// 帳號與密碼規則（spec#23、#330）：前後端同源驗證——本檔為後端正本，
// 遊戲端 game-engine/system/api-client.js 以同一組常數就地提示（值不得分歧）。
// #330（USR 2026-07-16 核定）：帳號可數字開頭（至少含一英文字母）；密碼 8–72 且須含至少一數字與一小寫英文。
// 長度以 ASCII 字元計、上限 72 對應 bcrypt 有效輸入 72 bytes。
export const USERNAME_PATTERN = /^(?=.*[a-z])[a-z0-9]{3,16}$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt 有效輸入上限（72 bytes）
// 相容鐵則（design II.C.(B)）：登入之格式預檢凍結舊制下限——新規僅適用建立密碼時點，
// 既有 6–7 碼舊密碼仍須能登入（比對交給 bcrypt）。
export const LEGACY_PASSWORD_MIN_LENGTH = 6;

export type ValidationError = "invalid-username" | "password-too-short" | "password-too-long" | "password-needs-mix";

export function validateUsername(username: unknown): username is string {
  return typeof username === "string" && USERNAME_PATTERN.test(username);
}

/** 建立密碼時點之新規（註冊／線上重設／CLI reset-password／bootstrap 首次建立）。 */
export function validatePassword(password: unknown): ValidationError | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) return "password-too-short";
  if (password.length > PASSWORD_MAX_LENGTH) return "password-too-long";
  if (!/[0-9]/.test(password) || !/[a-z]/.test(password)) return "password-needs-mix";
  return null;
}

/** 登入預檢（anti-DoS 界限；不驗新規複雜度）：舊制下限 6–72，既有舊密碼不受新規影響。 */
export function validateLoginPassword(password: unknown): boolean {
  return typeof password === "string"
    && password.length >= LEGACY_PASSWORD_MIN_LENGTH
    && password.length <= PASSWORD_MAX_LENGTH;
}

export function validateRegistration(username: unknown, password: unknown): ValidationError | null {
  if (!validateUsername(username)) return "invalid-username";
  return validatePassword(password);
}
