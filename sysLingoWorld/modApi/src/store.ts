// 持久化介面（[datIntf自訂玩家帳號紀錄]）：ACCOUNT／SESSION／SAVE／SETTINGS。
// 正式實作為 PostgreSQL（pg-store.ts，依 [techItem資料庫]）；memory-store 僅供單元測試（記憶體假庫限測試）。
export type AccountRole = "player" | "admin";

export interface AccountRecord {
  accountId: string;
  username: string;
  passwordHash: string;
  role: AccountRole;
  createdAt: number;
  lastLoginAt: number | null;
}

/** 維護者對單一帳號之時長覆寫與鎖定（spec#26；未鎖定時分鐘值為 null）。 */
export interface PlayLimitPolicy {
  locked: boolean;
  playMinutes: number | null;
  restMinutes: number | null;
  playMaxMinutes: number | null;
}

/** 管理頁帳號清單列（sysCase#4.2）；savePlayLimit 為存檔內遊玩／休息時戳之最小投影，供推導可玩／休息狀態。 */
export interface AccountSummary {
  accountId: string;
  username: string;
  role: AccountRole;
  createdAt: number;
  lastLoginAt: number | null;
  saveUpdatedAt: number | null;
  playLimit: PlayLimitPolicy;
  savePlayLimit: { sessionEndsAt: number; restEndsAt: number; restMinutes: number } | null;
}

/** 執行期設定單列（spec#26）；欄位 null＝資料庫未設值、由程式預設遞補（app 層合併）。 */
export interface SettingsRecord {
  registrationOpen: boolean | null;
  defaultPlayMinutes: number | null;
  defaultRestMinutes: number | null;
  defaultPlayMaxMinutes: number | null;
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
  createAccount(username: string, passwordHash: string, now: number, role?: AccountRole): Promise<AccountRecord | "taken">;
  getAccountByUsername(username: string): Promise<AccountRecord | null>;
  getAccountById(accountId: string): Promise<AccountRecord | null>;
  listAccounts(): Promise<AccountSummary[]>;
  updatePassword(username: string, passwordHash: string): Promise<boolean>;
  updatePasswordById(accountId: string, passwordHash: string): Promise<boolean>;
  /** 刪除帳號連同存檔與全部 session（同一交易；FK cascade）。回傳 false＝帳號不存在。 */
  deleteAccount(accountId: string): Promise<boolean>;
  touchLastLogin(accountId: string, now: number): Promise<void>;
  createSession(tokenHash: string, accountId: string, expiresAt: number): Promise<void>;
  getSession(tokenHash: string): Promise<SessionRecord | null>;
  revokeSession(tokenHash: string, now: number): Promise<void>;
  /** 撤銷該帳號全部 session；exceptTokenHash＝操作者重設自身密碼時保留當前 session（sysCase#4.2）。 */
  revokeAccountSessions(accountId: string, now: number, exceptTokenHash?: string | null): Promise<void>;
  /** 惰性清理已逾期／已撤銷之 session 資料列（#309 審查 A7；於登入等寫入時機順掃）。 */
  cleanupSessions(now: number): Promise<void>;
  getPlayLimit(accountId: string): Promise<PlayLimitPolicy | null>;
  /** 設定該帳號時長覆寫與鎖定（值域由 app 層驗證）。回傳 false＝帳號不存在。 */
  setPlayLimit(accountId: string, policy: PlayLimitPolicy): Promise<boolean>;
  getSettings(): Promise<SettingsRecord | null>;
  putSettings(settings: SettingsRecord, now: number): Promise<void>;
  getSave(accountId: string): Promise<SaveRecord | null>;
  /** 整筆替換 upsert＋updatedAt 樂觀比對（spec#24）：baseUpdatedAt 與現存不符即 conflict。 */
  putSave(accountId: string, state: unknown, schemaVersion: string, baseUpdatedAt: number | null, now: number): Promise<PutSaveResult>;
  ping(): Promise<boolean>;
  close(): Promise<void>;
}
