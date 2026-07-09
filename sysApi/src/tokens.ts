import crypto from "node:crypto";

// session token（spec#23）：opaque 隨機值，伺服器端僅存其雜湊（tokenHash）、可撤銷。
// SESSION_SECRET 為 tokenHash 之 pepper——DB 外洩時無法反推可用 token。
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string, pepper: string): string {
  return crypto.createHash("sha256").update(`${pepper}:${token}`).digest("hex");
}
