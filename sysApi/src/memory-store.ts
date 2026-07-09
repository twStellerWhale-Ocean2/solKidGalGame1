import crypto from "node:crypto";
import type { AccountRecord, AccountSummary, PlayLimitPolicy, PutSaveResult, SaveRecord, SessionRecord, SettingsRecord, Store } from "./store";

const UNLOCKED_POLICY: PlayLimitPolicy = { locked: false, playMinutes: null, restMinutes: null, playMaxMinutes: null };

// 記憶體假庫——僅限測試（[techItem資料庫] 紀律）；行為與 pg-store 同契約，
// 供單元測試以同一 app 工廠驗 API 行為，pg 接線由整合測試（tests/integration.mjs）對真 Postgres 驗。
export function createMemoryStore(): Store {
  const accounts = new Map<string, AccountRecord>(); // key: username
  const sessions = new Map<string, SessionRecord>(); // key: tokenHash
  const saves = new Map<string, SaveRecord>(); // key: accountId
  const playLimits = new Map<string, PlayLimitPolicy>(); // key: accountId
  let settings: SettingsRecord | null = null;

  function byId(accountId: string): AccountRecord | null {
    for (const record of accounts.values()) {
      if (record.accountId === accountId) return record;
    }
    return null;
  }

  return {
    async createAccount(username, passwordHash, now, role = "player") {
      if (accounts.has(username)) return "taken";
      const record: AccountRecord = {
        accountId: crypto.randomUUID(),
        username,
        passwordHash,
        role,
        createdAt: now,
        lastLoginAt: null
      };
      accounts.set(username, record);
      return record;
    },
    async getAccountByUsername(username) {
      return accounts.get(username) || null;
    },
    async getAccountById(accountId) {
      return byId(accountId);
    },
    async listAccounts() {
      const rows: AccountSummary[] = [];
      for (const record of accounts.values()) {
        const save = saves.get(record.accountId) || null;
        const stateLimit = save && save.state && typeof save.state === "object"
          ? (save.state as { playLimit?: { sessionEndsAt?: number; restEndsAt?: number; restMinutes?: number } }).playLimit
          : null;
        rows.push({
          accountId: record.accountId,
          username: record.username,
          role: record.role,
          createdAt: record.createdAt,
          lastLoginAt: record.lastLoginAt,
          saveUpdatedAt: save ? save.updatedAt : null,
          playLimit: playLimits.get(record.accountId) || UNLOCKED_POLICY,
          savePlayLimit: stateLimit && typeof stateLimit === "object"
            ? {
                sessionEndsAt: Number(stateLimit.sessionEndsAt) || 0,
                restEndsAt: Number(stateLimit.restEndsAt) || 0,
                restMinutes: Number(stateLimit.restMinutes) || 0
              }
            : null
        });
      }
      rows.sort((a, b) => a.createdAt - b.createdAt);
      return rows;
    },
    async updatePassword(username, passwordHash) {
      const record = accounts.get(username);
      if (!record) return false;
      record.passwordHash = passwordHash;
      return true;
    },
    async updatePasswordById(accountId, passwordHash) {
      const record = byId(accountId);
      if (!record) return false;
      record.passwordHash = passwordHash;
      return true;
    },
    async deleteAccount(accountId) {
      const record = byId(accountId);
      if (!record) return false;
      accounts.delete(record.username);
      saves.delete(accountId);
      playLimits.delete(accountId);
      for (const [tokenHash, session] of sessions) {
        if (session.accountId === accountId) sessions.delete(tokenHash);
      }
      return true;
    },
    async touchLastLogin(accountId, now) {
      const record = byId(accountId);
      if (record) record.lastLoginAt = now;
    },
    async createSession(tokenHash, accountId, expiresAt) {
      sessions.set(tokenHash, { accountId, expiresAt, revokedAt: null });
    },
    async getSession(tokenHash) {
      return sessions.get(tokenHash) || null;
    },
    async revokeSession(tokenHash, now) {
      const session = sessions.get(tokenHash);
      if (session && session.revokedAt === null) session.revokedAt = now;
    },
    async revokeAccountSessions(accountId, now, exceptTokenHash = null) {
      for (const [tokenHash, session] of sessions) {
        if (session.accountId !== accountId) continue;
        if (exceptTokenHash && tokenHash === exceptTokenHash) continue;
        if (session.revokedAt === null) session.revokedAt = now;
      }
    },
    async cleanupSessions(now) {
      for (const [tokenHash, session] of sessions) {
        if (session.expiresAt <= now || session.revokedAt !== null) sessions.delete(tokenHash);
      }
    },
    async getPlayLimit(accountId) {
      if (!byId(accountId)) return null;
      return playLimits.get(accountId) || UNLOCKED_POLICY;
    },
    async setPlayLimit(accountId, policy) {
      if (!byId(accountId)) return false;
      playLimits.set(accountId, { ...policy });
      return true;
    },
    async getSettings() {
      return settings;
    },
    async putSettings(next) {
      settings = { ...next };
    },
    async getSave(accountId) {
      return saves.get(accountId) || null;
    },
    async putSave(accountId, state, schemaVersion, baseUpdatedAt, now): Promise<PutSaveResult> {
      const existing = saves.get(accountId);
      const existingUpdatedAt = existing ? existing.updatedAt : null;
      if (baseUpdatedAt !== existingUpdatedAt) return { ok: false, conflict: true };
      const updatedAt = Math.max(now, existing ? existing.updatedAt + 1 : now);
      saves.set(accountId, { state, schemaVersion, updatedAt });
      return { ok: true, updatedAt };
    },
    async ping() {
      return true;
    },
    async close() {
      /* no-op */
    }
  };
}
