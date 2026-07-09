import crypto from "node:crypto";
import { Pool } from "pg";
import type { AccountRecord, PutSaveResult, SaveRecord, SessionRecord, Store } from "./store";

/* v8 ignore start -- 薄 pg 接線：純邏輯在 app.ts／store 契約，本檔由 tests/integration.mjs 對真 Postgres 驗（GATE ＜1節＞ 涵蓋率排除紀律）。 */

// [datIntf自訂玩家帳號紀錄]：schema 由本檔 migrate 落地；updated_at 用 BIGINT ms epoch（樂觀比對免時區/精度陷阱）。
const MIGRATION = `
CREATE TABLE IF NOT EXISTS account (
  account_id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
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
`;

export async function createPgStore(databaseUrl: string): Promise<Store> {
  const pool = new Pool({ connectionString: databaseUrl });
  await pool.query(MIGRATION);
  return {
    async createAccount(username, passwordHash, now) {
      const accountId = crypto.randomUUID();
      try {
        await pool.query(
          "INSERT INTO account (account_id, username, password_hash, created_at) VALUES ($1, $2, $3, $4)",
          [accountId, username, passwordHash, now]
        );
      } catch (error) {
        if ((error as { code?: string }).code === "23505") return "taken"; // unique_violation
        throw error;
      }
      return { accountId, username, passwordHash, createdAt: now };
    },
    async getAccountByUsername(username) {
      const result = await pool.query(
        "SELECT account_id, username, password_hash, created_at FROM account WHERE username = $1",
        [username]
      );
      const row = result.rows[0];
      if (!row) return null;
      return toAccount(row);
    },
    async updatePassword(username, passwordHash) {
      const result = await pool.query(
        "UPDATE account SET password_hash = $2 WHERE username = $1",
        [username, passwordHash]
      );
      return (result.rowCount || 0) > 0;
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

function toAccount(row: { account_id: string; username: string; password_hash: string; created_at: string | number }): AccountRecord {
  return {
    accountId: row.account_id,
    username: row.username,
    passwordHash: row.password_hash,
    createdAt: Number(row.created_at)
  };
}

/* v8 ignore stop */
