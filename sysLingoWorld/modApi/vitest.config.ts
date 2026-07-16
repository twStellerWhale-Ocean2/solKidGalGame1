import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // 涵蓋率排除紀律（GATE ＜1節＞）：真環境接線（pg、程序進入點、CLI）由 tests/integration.mjs 對真 Postgres 驗；
      // 其可測純邏輯（驗證、token、限流、路由行為）皆在此單元測試涵蓋。
      exclude: ["src/**/*.test.ts", "src/pg-store.ts", "src/server.ts", "src/cli-reset-password.ts"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 }
    }
  }
});
