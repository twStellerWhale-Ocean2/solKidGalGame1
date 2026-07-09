// 帳號與密碼規則（spec#23）：前後端同源驗證——本檔為後端正本，
// 遊戲端 game-engine/system/api-client.js 以同一組常數就地提示（值不得分歧）。
export const USERNAME_PATTERN = /^[a-z][a-z0-9]{2,15}$/;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt 有效輸入上限（72 bytes）

export type ValidationError = "invalid-username" | "password-too-short" | "password-too-long";

export function validateUsername(username: unknown): username is string {
  return typeof username === "string" && USERNAME_PATTERN.test(username);
}

export function validatePassword(password: unknown): ValidationError | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) return "password-too-short";
  if (password.length > PASSWORD_MAX_LENGTH) return "password-too-long";
  return null;
}

export function validateRegistration(username: unknown, password: unknown): ValidationError | null {
  if (!validateUsername(username)) return "invalid-username";
  return validatePassword(password);
}
