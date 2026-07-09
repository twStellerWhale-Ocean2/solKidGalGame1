import crypto from "node:crypto";
import type { AccountRecord, PutSaveResult, SaveRecord, SessionRecord, Store } from "./store";

// 記憶體假庫——僅限測試（[techItem資料庫] 紀律）；行為與 pg-store 同契約，
// 供單元測試以同一 app 工廠驗 API 行為，pg 接線由整合測試（tests/integration.mjs）對真 Postgres 驗。
export function createMemoryStore(): Store {
  const accounts = new Map<string, AccountRecord>(); // key: username
  const sessions = new Map<string, SessionRecord>(); // key: tokenHash
  const saves = new Map<string, SaveRecord>(); // key: accountId
  return {
    async createAccount(username, passwordHash, now) {
      if (accounts.has(username)) return "taken";
      const record: AccountRecord = {
        accountId: crypto.randomUUID(),
        username,
        passwordHash,
        createdAt: now
      };
      accounts.set(username, record);
      return record;
    },
    async getAccountByUsername(username) {
      return accounts.get(username) || null;
    },
    async updatePassword(username, passwordHash) {
      const record = accounts.get(username);
      if (!record) return false;
      record.passwordHash = passwordHash;
      return true;
    },
    async createSession(tokenHash, accountId, expiresAt) {
      sessions.set(tokenHash, { accountId, expiresAt, revokedAt: null });
    },
    async getSession(tokenHash) {
      return sessions.get(tokenHash) || null;
    },
    async revokeSession(tokenHash, now) {
      const session = sessions.get(tokenHash);
      if (session) session.revokedAt = now;
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
