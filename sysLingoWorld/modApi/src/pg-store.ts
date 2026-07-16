import crypto from "node:crypto";
import { Pool } from "pg";
import type { AccountRecord, AccountRole, AccountSummary, PlayLimitPolicy, PutSaveResult, SaveRecord, SessionRecord, SettingsRecord, Store } from "./store";

/* v8 ignore start -- 薄 pg 接線：純邏輯在 app.ts／store 契約，本檔由 tests/integration.mjs 對真 Postgres 驗（GATE ＜1節＞ 涵蓋率排除紀律）。 */

// [datIntf自訂玩家帳號紀錄]：schema 由本檔 migrate 落地；updated_at 用 BIGINT ms epoch（樂觀比對免時區/精度陷阱）。
// #310：account 增 role／last_login_at／時長政策欄位（ADD COLUMN IF NOT EXISTS 使既有部署零遷移負擔）、
// settings 單列表（缺列或缺值由 app 層以程式預設遞補）。
const MIGRATION = `
CREATE TABLE IF NOT EXISTS account (
  account_id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
ALTER TABLE account ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'player';
ALTER TABLE account ADD COLUMN IF NOT EXISTS last_login_at BIGINT;
ALTER TABLE account ADD COLUMN IF NOT EXISTS limit_locked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE account ADD COLUMN IF NOT EXISTS play_minutes_override INT;
ALTER TABLE account ADD COLUMN IF NOT EXISTS rest_minutes_override INT;
ALTER TABLE account ADD COLUMN IF NOT EXISTS play_max_minutes_override INT;
CREATE TABLE IF NOT EXISTS session (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL,
  revoked_at BIGINT
);
CREATE TABLE IF NOT EXISTS save (
  account_id TEXT PRIMARY KEY REFERENCES account(account_id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  schema_version TEXT NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY CHECK (id = 1),
  registration_open BOOLEAN,
  default_play_minutes INT,
  default_rest_minutes INT,
  default_play_max_minutes INT,
  updated_at BIGINT NOT NULL
);
`;

export async function createPgStore(databaseUrl: string): Promise<Store> {
  const pool = new Pool({ connectionString: databaseUrl });
  // 資料庫連線被外力斷開（DB 重啟、備份還原之 DROP … WITH (FORCE)）時，idle client 會對 Pool 發
  // error 事件——未接住即炸掉整個進程（#311 e2e 災難復原實測）。接住記錄即可：Pool 會補新連線，
  // 進行中請求各自收到錯誤由路由層回 5xx，服務本體不得因此死亡（design paramProbes：不 CrashLoop 即死）。
  pool.on("error", (error) => {
    console.error("sysApi pg pool error (connection dropped, pool will recover):", error.message);
  });
  await pool.query(MIGRATION);
  return {
    async createAccount(username, passwordHash, now, role: AccountRole = "player") {
      const accountId = crypto.randomUUID();
      try {
        await pool.query(
          "INSERT INTO account (account_id, username, password_hash, created_at, role) VALUES ($1, $2, $3, $4, $5)",
          [accountId, username, passwordHash, now, role]
        );
      } catch (error) {
        if ((error as { code?: string }).code === "23505") return "taken"; // unique_violation
        throw error;
      }
      return { accountId, username, passwordHash, role, createdAt: now, lastLoginAt: null };
    },
    async getAccountByUsername(username) {
      const result = await pool.query(
        `${ACCOUNT_SELECT} WHERE username = $1`,
        [username]
      );
      const row = result.rows[0];
      if (!row) return null;
      return toAccount(row);
    },
    async getAccountById(accountId) {
      const result = await pool.query(
        `${ACCOUNT_SELECT} WHERE account_id = $1`,
        [accountId]
      );
      const row = result.rows[0];
      if (!row) return null;
      return toAccount(row);
    },
    async listAccounts() {
      const result = await pool.query(
        `SELECT a.account_id, a.username, a.role, a.created_at, a.last_login_at,
                a.limit_locked, a.play_minutes_override, a.rest_minutes_override, a.play_max_minutes_override,
                s.updated_at AS save_updated_at, s.state->'playLimit' AS save_play_limit
         FROM account a LEFT JOIN save s ON s.account_id = a.account_id
         ORDER BY a.created_at ASC`
      );
      return result.rows.map((row): AccountSummary => {
        const limit = row.save_play_limit && typeof row.save_play_limit === "object" ? row.save_play_limit : null;
        return {
          accountId: row.account_id,
          username: row.username,
          role: row.role,
          createdAt: Number(row.created_at),
          lastLoginAt: row.last_login_at === null ? null : Number(row.last_login_at),
          saveUpdatedAt: row.save_updated_at === null || row.save_updated_at === undefined ? null : Number(row.save_updated_at),
          playLimit: toPolicy(row),
          savePlayLimit: limit
            ? {
                sessionEndsAt: Number(limit.sessionEndsAt) || 0,
                restEndsAt: Number(limit.restEndsAt) || 0,
                restMinutes: Number(limit.restMinutes) || 0
              }
            : null
        };
      });
    },
    async updatePassword(username, passwordHash) {
      const result = await pool.query(
        "UPDATE account SET password_hash = $2 WHERE username = $1",
        [username, passwordHash]
      );
      return (result.rowCount || 0) > 0;
    },
    async updatePasswordById(accountId, passwordHash) {
      const result = await pool.query(
        "UPDATE account SET password_hash = $2 WHERE account_id = $1",
        [accountId, passwordHash]
      );
      return (result.rowCount || 0) > 0;
    },
    async deleteAccount(accountId) {
      // FK ON DELETE CASCADE 使 session／save 隨帳號同刪（單一敘述＝同一交易，sysCase#4.2）。
      const result = await pool.query("DELETE FROM account WHERE account_id = $1", [accountId]);
      return (result.rowCount || 0) > 0;
    },
    async touchLastLogin(accountId, now) {
      await pool.query("UPDATE account SET last_login_at = $2 WHERE account_id = $1", [accountId, now]);
    },
    async createSession(tokenHash, accountId, expiresAt) {
      await pool.query(
        "INSERT INTO session (token_hash, account_id, expires_at, revoked_at) VALUES ($1, $2, $3, NULL)",
        [tokenHash, accountId, expiresAt]
      );
    },
    async getSession(tokenHash) {
      const result = await pool.query(
        "SELECT account_id, expires_at, revoked_at FROM session WHERE token_hash = $1",
        [tokenHash]
      );
      const row = result.rows[0];
      if (!row) return null;
      return {
        accountId: row.account_id,
        expiresAt: Number(row.expires_at),
        revokedAt: row.revoked_at === null ? null : Number(row.revoked_at)
      } satisfies SessionRecord;
    },
    async revokeSession(tokenHash, now) {
      await pool.query(
        "UPDATE session SET revoked_at = $2 WHERE token_hash = $1 AND revoked_at IS NULL",
        [tokenHash, now]
      );
    },
    async revokeAccountSessions(accountId, now, exceptTokenHash = null) {
      await pool.query(
        "UPDATE session SET revoked_at = $2 WHERE account_id = $1 AND revoked_at IS NULL AND ($3::text IS NULL OR token_hash <> $3)",
        [accountId, now, exceptTokenHash]
      );
    },
    async cleanupSessions(now) {
      await pool.query("DELETE FROM session WHERE expires_at <= $1 OR revoked_at IS NOT NULL", [now]);
    },
    async getPlayLimit(accountId) {
      const result = await pool.query(
        "SELECT limit_locked, play_minutes_override, rest_minutes_override, play_max_minutes_override FROM account WHERE account_id = $1",
        [accountId]
      );
      const row = result.rows[0];
      if (!row) return null;
      return toPolicy(row);
    },
    async setPlayLimit(accountId, policy: PlayLimitPolicy) {
      const result = await pool.query(
        "UPDATE account SET limit_locked = $2, play_minutes_override = $3, rest_minutes_override = $4, play_max_minutes_override = $5 WHERE account_id = $1",
        [accountId, policy.locked, policy.playMinutes, policy.restMinutes, policy.playMaxMinutes]
      );
      return (result.rowCount || 0) > 0;
    },
    async getSettings() {
      const result = await pool.query(
        "SELECT registration_open, default_play_minutes, default_rest_minutes, default_play_max_minutes FROM settings WHERE id = 1"
      );
      const row = result.rows[0];
      if (!row) return null;
      return {
        registrationOpen: row.registration_open === null ? null : Boolean(row.registration_open),
        defaultPlayMinutes: row.default_play_minutes === null ? null : Number(row.default_play_minutes),
        defaultRestMinutes: row.default_rest_minutes === null ? null : Number(row.default_rest_minutes),
        defaultPlayMaxMinutes: row.default_play_max_minutes === null ? null : Number(row.default_play_max_minutes)
      } satisfies SettingsRecord;
    },
    async putSettings(settings, now) {
      await pool.query(
        `INSERT INTO settings (id, registration_open, default_play_minutes, default_rest_minutes, default_play_max_minutes, updated_at)
         VALUES (1, $1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET registration_open = $1, default_play_minutes = $2, default_rest_minutes = $3, default_play_max_minutes = $4, updated_at = $5`,
        [settings.registrationOpen, settings.defaultPlayMinutes, settings.defaultRestMinutes, settings.defaultPlayMaxMinutes, now]
      );
    },
    async getSave(accountId) {
      const result = await pool.query(
        "SELECT state, schema_version, updated_at FROM save WHERE account_id = $1",
        [accountId]
      );
      const row = result.rows[0];
      if (!row) return null;
      return { state: row.state, schemaVersion: row.schema_version, updatedAt: Number(row.updated_at) } satisfies SaveRecord;
    },
    async putSave(accountId, state, schemaVersion, baseUpdatedAt, now): Promise<PutSaveResult> {
      const payload = JSON.stringify(state);
      if (baseUpdatedAt === null) {
        // 首次寫入：僅在尚無存檔時插入（存在即 conflict——呼叫端持舊基準）。
        const result = await pool.query(
          "INSERT INTO save (account_id, state, schema_version, updated_at) VALUES ($1, $2::jsonb, $3, $4) ON CONFLICT (account_id) DO NOTHING",
          [accountId, payload, schemaVersion, now]
        );
        if ((result.rowCount || 0) === 0) return { ok: false, conflict: true };
        return { ok: true, updatedAt: now };
      }
      const updatedAt = Math.max(now, baseUpdatedAt + 1);
      const result = await pool.query(
        "UPDATE save SET state = $2::jsonb, schema_version = $3, updated_at = $4 WHERE account_id = $1 AND updated_at = $5",
        [accountId, payload, schemaVersion, updatedAt, baseUpdatedAt]
      );
      if ((result.rowCount || 0) === 0) return { ok: false, conflict: true };
      return { ok: true, updatedAt };
    },
    async ping() {
      try {
        await pool.query("SELECT 1");
        return true;
      } catch {
        return false;
      }
    },
    async close() {
      await pool.end();
    }
  };
}

const ACCOUNT_SELECT = "SELECT account_id, username, password_hash, role, created_at, last_login_at FROM account";

function toAccount(row: { account_id: string; username: string; password_hash: string; role: string; created_at: string | number; last_login_at: string | number | null }): AccountRecord {
  return {
    accountId: row.account_id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role === "admin" ? "admin" : "player",
    createdAt: Number(row.created_at),
    lastLoginAt: row.last_login_at === null ? null : Number(row.last_login_at)
  };
}

function toPolicy(row: { limit_locked: boolean; play_minutes_override: number | null; rest_minutes_override: number | null; play_max_minutes_override: number | null }): PlayLimitPolicy {
  return {
    locked: Boolean(row.limit_locked),
    playMinutes: row.play_minutes_override === null ? null : Number(row.play_minutes_override),
    restMinutes: row.rest_minutes_override === null ? null : Number(row.rest_minutes_override),
    playMaxMinutes: row.play_max_minutes_override === null ? null : Number(row.play_max_minutes_override)
  };
}

/* v8 ignore stop */
