import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";

describe("loadConfig", () => {
  const base = { DATABASE_URL: "postgres://u:p@h/db", SESSION_SECRET: "s" } as NodeJS.ProcessEnv;

  it("requires DATABASE_URL and SESSION_SECRET", () => {
    expect(() => loadConfig({} as NodeJS.ProcessEnv)).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ DATABASE_URL: "x" } as NodeJS.ProcessEnv)).toThrow(/SESSION_SECRET/);
  });

  it("applies defaults (port 4180, TTL 30d, rate limit 10/10min)", () => {
    const config = loadConfig(base);
    expect(config.port).toBe(4180);
    expect(config.sessionTtlMs).toBe(30 * 24 * 60 * 60 * 1000);
    expect(config.rateLimitMax).toBe(10);
    expect(config.rateLimitWindowMs).toBe(10 * 60 * 1000);
    expect(config.staticRoot).toBeTruthy();
  });

  it("honours overrides", () => {
    const config = loadConfig({ ...base, PORT: "5000", SESSION_TTL_DAYS: "7", RATE_LIMIT_MAX: "3", STATIC_ROOT: "/srv/game" });
    expect(config.port).toBe(5000);
    expect(config.sessionTtlMs).toBe(7 * 24 * 60 * 60 * 1000);
    expect(config.rateLimitMax).toBe(3);
    expect(config.staticRoot).toBe("/srv/game");
  });
});
