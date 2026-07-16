import { createApp, BCRYPT_COST } from "./app";
import { loadConfig } from "./config";
import { createPgStore } from "./pg-store";
import { createRateLimiter } from "./rate-limit";
import { bootstrapAdmin } from "./admin";

/* v8 ignore start -- 程序進入點（真環境接線），由 tests/integration.mjs 對運行中服務驗證。 */
// DB 晚就緒容忍（design paramProbes、#311 審查）：TCP 通 ≠ 可查詢——Postgres crash 後 WAL replay
// 期間連得上但回 "the database system is starting up"；連線／migration 失敗以有限退避重試，
// 不 CrashLoop 即死，重試耗盡才交由進程失敗（K8s restartPolicy 兜底）。
async function createStoreWithRetry(databaseUrl: string, tries = 30, delayMs = 2000) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await createPgStore(databaseUrl);
    } catch (error) {
      if (attempt >= tries) throw error;
      console.warn(`sysApi: database not ready (attempt ${attempt}/${tries}): ${(error as Error).message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function main() {
  const config = loadConfig();
  const store = await createStoreWithRetry(config.databaseUrl);
  // admin 起始帳號（paramAdminBootstrap）：僅於帳號不存在時建立；驗證失敗／撞名玩家帳號即啟動失敗。
  if (config.adminUsername && config.adminPassword) {
    const outcome = await bootstrapAdmin(store, config.adminUsername, config.adminPassword, Date.now(), BCRYPT_COST);
    if (outcome === "created") console.log(`sysApi admin account "${config.adminUsername}" created.`);
  } else {
    console.warn("sysApi: ADMIN_USERNAME/ADMIN_PASSWORD not set — /admin/ console has no admin account to log in with.");
  }
  const app = createApp({
    store,
    sessionSecret: config.sessionSecret,
    sessionTtlMs: config.sessionTtlMs,
    staticRoot: config.staticRoot,
    rateLimiter: createRateLimiter({ max: config.rateLimitMax, windowMs: config.rateLimitWindowMs }),
    trustProxy: config.trustProxy
  });
  app.listen(config.port, () => {
    console.log(`sysApi listening on http://0.0.0.0:${config.port}/ (game shell + /api + /admin)`);
  });
}

main().catch((error) => {
  console.error("sysApi failed to start:", error.message);
  process.exit(1);
});
/* v8 ignore stop */
