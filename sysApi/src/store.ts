// 持久化介面（[datIntf自訂玩家帳號紀錄]）：ACCOUNT／SESSION／SAVE。
// 正式實作為 PostgreSQL（pg-store.ts，依 [techItem資料庫]）；memory-store 僅供單元測試（記憶體假庫限測試）。
export interface AccountRecord {
  accountId: string;
  username: string;
  passwordHash: string;
  createdAt: number;
}

export interface SessionRecord {
  accountId: string;
  expiresAt: number;
  revokedAt: number | null;
}

export interface SaveRecord {
  state: unknown;
  schemaVersion: string;
  updatedAt: number;
}

export type PutSaveResult = { ok: true; updatedAt: number } | { ok: false; conflict: true };

export interface Store {
  createAccount(username: string, passwordHash: string, now: number): Promise<AccountRecord | "taken">;
  getAccountByUsername(username: string): Promise<AccountRecord | null>;
  updatePassword(username: string, passwordHash: string): Promise<boolean>;
  createSession(tokenHash: string, accountId: string, expiresAt: number): Promise<void>;
  getSession(tokenHash: string): Promise<SessionRecord | null>;
  revokeSession(tokenHash: string, now: number): Promise<void>;
  getSave(accountId: string): Promise<SaveRecord | null>;
  /** 整筆替換 upsert＋updatedAt 樂觀比對（spec#24）：baseUpdatedAt 與現存不符即 conflict。 */
  putSave(accountId: string, state: unknown, schemaVersion: string, baseUpdatedAt: number | null, now: number): Promise<PutSaveResult>;
  ping(): Promise<boolean>;
  close(): Promise<void>;
}
