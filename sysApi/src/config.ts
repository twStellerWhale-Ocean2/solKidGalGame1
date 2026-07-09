import path from "node:path";

// 組態一律由環境變數供給（.env／compose；正式 K8s Secret 於 #311 helm 化）。
// paramApiPort=4180、paramUsernamePattern、paramPasswordMinLength=6、paramSessionTtlDays=30（design.md ＜II.C (D)＞）。
export interface Config {
  port: number;
  databaseUrl: string;
  sessionSecret: string;
  sessionTtlMs: number;
  staticRoot: string;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  /** paramAdminBootstrap（#310）：兩者皆設才啟用 admin 起始帳號建立；未設僅告警（管理頁將無法登入）。 */
  adminUsername: string;
  adminPassword: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const databaseUrl = env.DATABASE_URL || "";
  const sessionSecret = env.SESSION_SECRET || "";
  if (!databaseUrl) throw new Error("DATABASE_URL is required (PostgreSQL connection string)");
  if (!sessionSecret) throw new Error("SESSION_SECRET is required (session token hash pepper)");
  return {
    port: Number(env.PORT) || 4180,
    databaseUrl,
    sessionSecret,
    sessionTtlMs: (Number(env.SESSION_TTL_DAYS) || 30) * 24 * 60 * 60 * 1000,
    // 遊戲殼靜態檔根目錄＝repo 根（sysApi 之上一層）；同站服務、免 CORS。
    staticRoot: env.STATIC_ROOT || path.resolve(__dirname, "..", ".."),
    rateLimitMax: Number(env.RATE_LIMIT_MAX) || 10,
    rateLimitWindowMs: Number(env.RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000,
    adminUsername: env.ADMIN_USERNAME || "",
    adminPassword: env.ADMIN_PASSWORD || ""
  };
}
