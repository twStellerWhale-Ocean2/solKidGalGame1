import { createApp } from "./app";
import { loadConfig } from "./config";
import { createPgStore } from "./pg-store";
import { createRateLimiter } from "./rate-limit";

/* v8 ignore start -- 程序進入點（真環境接線），由 tests/integration.mjs 對運行中服務驗證。 */
async function main() {
  const config = loadConfig();
  const store = await createPgStore(config.databaseUrl);
  const app = createApp({
    store,
    sessionSecret: config.sessionSecret,
    sessionTtlMs: config.sessionTtlMs,
    staticRoot: config.staticRoot,
    rateLimiter: createRateLimiter({ max: config.rateLimitMax, windowMs: config.rateLimitWindowMs })
  });
  app.listen(config.port, () => {
    console.log(`sysApi listening on http://0.0.0.0:${config.port}/ (game shell + /api)`);
  });
}

main().catch((error) => {
  console.error("sysApi failed to start:", error.message);
  process.exit(1);
});
/* v8 ignore stop */
