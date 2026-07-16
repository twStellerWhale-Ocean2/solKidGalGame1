import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app";
import { createMemoryStore } from "./memory-store";
import { createRateLimiter } from "./rate-limit";
import type { Store } from "./store";

// app 路由行為單元測試（memory store＝測試假庫；pg 接線由 tests/integration.mjs 對真 Postgres 驗）。
const SECRET = "test-pepper";
let store: Store;
let clock = { value: 1_000_000 };

function makeApp(overrides: Partial<Parameters<typeof createApp>[0]> = {}) {
  return createApp({
    store,
    sessionSecret: SECRET,
    sessionTtlMs: 30 * 24 * 60 * 60 * 1000,
    rateLimiter: createRateLimiter({ max: 3, windowMs: 60_000 }),
    now: () => clock.value,
    bcryptCost: 4, // 單元測試降 cost 提速；正式 cost=10（integration 驗 $2b$10 前綴）
    ...overrides
  });
}

beforeEach(() => {
  store = createMemoryStore();
  clock = { value: 1_000_000 };
});

async function register(app: ReturnType<typeof createApp>, username = "mimi", password = "secret6") {
  return request(app).post("/api/auth/register").send({ username, password });
}

describe("health endpoints", () => {
  it("healthz and readyz respond with serverTime", async () => {
    const app = makeApp();
    const health = await request(app).get("/healthz");
    expect(health.status).toBe(200);
    expect(health.body.serverTime).toBe(clock.value);
    const ready = await request(app).get("/readyz");
    expect(ready.status).toBe(200);
  });

  it("readyz returns 503 when the store is unreachable", async () => {
    const app = makeApp({ store: { ...store, ping: async () => false } });
    const ready = await request(app).get("/readyz");
    expect(ready.status).toBe(503);
  });
});

describe("register", () => {
  it("creates an account, returns 201 with token and account", async () => {
    const res = await register(makeApp());
    expect(res.status).toBe(201);
    expect(res.body.token).toMatch(/^[0-9a-f]{64}$/);
    expect(res.body.account).toEqual({ id: expect.any(String), username: "mimi", role: "player", createdAt: clock.value });
  });

  it("rejects invalid username / short password / long password with 422 codes", async () => {
    const app = makeApp();
    expect((await register(app, "BAD", "secret6")).body.error.code).toBe("invalid-username");
    expect((await register(app, "mimi", "12345")).body.error.code).toBe("password-too-short");
    expect((await register(app, "mimi", "x".repeat(73))).body.error.code).toBe("password-too-long");
  });

  it("rejects duplicate usernames with 409 username-taken", async () => {
    const app = makeApp();
    await register(app);
    const res = await register(app);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("username-taken");
  });

  it("does not store the plaintext password (bcrypt hash only)", async () => {
    await register(makeApp());
    const account = await store.getAccountByUsername("mimi");
    expect(account?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(account?.passwordHash).not.toContain("secret6");
  });
});

describe("login", () => {
  it("logs in with correct credentials", async () => {
    const app = makeApp();
    await register(app);
    const res = await request(app).post("/api/auth/login").send({ username: "mimi", password: "secret6" });
    expect(res.status).toBe(200);
    expect(res.body.token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns identical 401 for unknown user and wrong password (no account disclosure)", async () => {
    const app = makeApp();
    await register(app);
    const unknown = await request(app).post("/api/auth/login").send({ username: "nobody", password: "secret6" });
    const wrong = await request(app).post("/api/auth/login").send({ username: "mimi", password: "wrong66" });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
  });

  it("rate-limits repeated failures with 429 and recovers after success elsewhere", async () => {
    const app = makeApp();
    await register(app);
    for (let i = 0; i < 3; i += 1) {
      await request(app).post("/api/auth/login").send({ username: "mimi", password: "wrong66" });
    }
    const limited = await request(app).post("/api/auth/login").send({ username: "mimi", password: "secret6" });
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe("rate-limited");
  });
});

// #331 客戶模擬拓撲之單元層：limiter key 含帳號、429 附等待秒數、trust proxy 之 XFF 採信邊界。
describe("rate limit topology (#331)", () => {
  it("register limiter is keyed per username: neighbour failures do not lock others", async () => {
    const app = makeApp();
    await register(app, "taken1");
    for (let i = 0; i < 3; i += 1) {
      await register(app, "taken1"); // 同一來源 IP 對同名重複撞名（409 記失敗）
    }
    const sameName = await register(app, "taken1");
    expect(sameName.status).toBe(429); // 同名重試被擋
    const otherName = await register(app, "newkid9");
    expect(otherName.status).toBe(201); // 換名（＝別的孩子）不受鄰居失敗牽連
  });

  it("429 carries retryAfterSeconds body field and matching Retry-After header", async () => {
    const app = makeApp();
    await register(app, "taken2");
    for (let i = 0; i < 3; i += 1) await register(app, "taken2");
    const limited = await register(app, "taken2");
    expect(limited.status).toBe(429);
    expect(limited.body.error.retryAfterSeconds).toBeGreaterThan(0);
    expect(Number(limited.headers["retry-after"])).toBe(limited.body.error.retryAfterSeconds);
  });

  it("trustProxy=2 resolves real client IP from two-hop XFF; default 0 ignores forged XFF", async () => {
    const trusted = makeApp({ trustProxy: 2 });
    await register(trusted, "taken3");
    const viaProxy = (xff: string) =>
      request(trusted).post("/api/auth/register").set("X-Forwarded-For", xff)
        .send({ username: "taken3", password: "secret6" });
    for (let i = 0; i < 3; i += 1) await viaProxy("203.0.113.7, 10.0.0.1");
    expect((await viaProxy("203.0.113.7, 10.0.0.1")).status).toBe(429); // 同真實 client 同名：鎖
    expect((await viaProxy("198.51.100.9, 10.0.0.1")).status).toBe(409); // 不同真實 client：不受鎖、正常回撞名

    store = createMemoryStore();
    const untrusted = makeApp({ trustProxy: 0 });
    await register(untrusted, "taken4");
    const forged = (xff: string) =>
      request(untrusted).post("/api/auth/register").set("X-Forwarded-For", xff)
        .send({ username: "taken4", password: "secret6" });
    for (let i = 0; i < 3; i += 1) await forged(`203.0.113.${i}`); // 每次偽造不同來源
    expect((await forged("203.0.113.99")).status).toBe(429); // 偽 XFF 不被採信：仍按實際 socket 來源累計而鎖
  });
});

describe("session protection", () => {
  it("rejects missing and forged tokens with 401", async () => {
    const app = makeApp();
    expect((await request(app).get("/api/save")).status).toBe(401);
    const forged = await request(app).get("/api/save").set("Authorization", "Bearer deadbeef".padEnd(71, "0"));
    expect(forged.status).toBe(401);
  });

  it("rejects expired sessions and saves once before redirect flows re-login", async () => {
    const app = makeApp();
    const token = (await register(app)).body.token;
    clock.value += 31 * 24 * 60 * 60 * 1000; // beyond TTL
    const res = await request(app).get("/api/save").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("logout revokes the session; the token no longer works", async () => {
    const app = makeApp();
    const token = (await register(app)).body.token;
    const logout = await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${token}`);
    expect(logout.status).toBe(204);
    const after = await request(app).get("/api/save").set("Authorization", `Bearer ${token}`);
    expect(after.status).toBe(401);
  });
});

describe("cloud save", () => {
  async function authed() {
    const app = makeApp();
    const token = (await register(app)).body.token;
    return { app, auth: { Authorization: `Bearer ${token}` } };
  }

  it("returns null state when no save exists (with serverTime)", async () => {
    const { app, auth } = await authed();
    const res = await request(app).get("/api/save").set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      state: null,
      schemaVersion: null,
      updatedAt: null,
      serverTime: clock.value,
      playLimitPolicy: { locked: false, playMinutes: null, restMinutes: null, playMaxMinutes: null }
    });
  });

  it("upserts and reads back a save (full state round-trip)", async () => {
    const { app, auth } = await authed();
    const state = { coins: 42, playerName: "Mimi", outfit: { outfit: "gown" } };
    const put = await request(app).put("/api/save").set(auth).send({ state, schemaVersion: "1", baseUpdatedAt: null });
    expect(put.status).toBe(200);
    const got = await request(app).get("/api/save").set(auth);
    expect(got.body.state).toEqual(state);
    expect(got.body.updatedAt).toBe(put.body.updatedAt);
  });

  it("rejects a stale base with 409 save-conflict (optimistic lock)", async () => {
    const { app, auth } = await authed();
    const first = await request(app).put("/api/save").set(auth).send({ state: { coins: 1 }, baseUpdatedAt: null });
    clock.value += 10;
    const second = await request(app).put("/api/save").set(auth)
      .send({ state: { coins: 2 }, baseUpdatedAt: first.body.updatedAt });
    expect(second.status).toBe(200);
    // 以過期基準（first）再寫 → 409，且不覆蓋較新進度
    const stale = await request(app).put("/api/save").set(auth)
      .send({ state: { coins: 99 }, baseUpdatedAt: first.body.updatedAt });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe("save-conflict");
    const got = await request(app).get("/api/save").set(auth);
    expect(got.body.state).toEqual({ coins: 2 });
  });

  it("rejects non-object states and malformed baseUpdatedAt with 422", async () => {
    const { app, auth } = await authed();
    expect((await request(app).put("/api/save").set(auth).send({ state: [1, 2] })).status).toBe(422);
    expect((await request(app).put("/api/save").set(auth).send({ state: "x" })).status).toBe(422);
    expect((await request(app).put("/api/save").set(auth).send({ state: { a: 1 }, baseUpdatedAt: "zzz" })).status).toBe(422);
  });

  it("keeps saves isolated per account (no cross-account access)", async () => {
    const app = makeApp();
    const tokenA = (await register(app, "aaa", "secret6")).body.token;
    const tokenB = (await register(app, "bbb", "secret6")).body.token;
    await request(app).put("/api/save").set("Authorization", `Bearer ${tokenA}`)
      .send({ state: { coins: 7 }, baseUpdatedAt: null });
    const b = await request(app).get("/api/save").set("Authorization", `Bearer ${tokenB}`);
    expect(b.body.state).toBeNull();
  });
});

describe("error envelope and unknown endpoints", () => {
  it("returns unified {error:{code,message}} for unknown api paths", async () => {
    const res = await request(makeApp()).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not-found");
  });

  it("returns 400 invalid-json for malformed JSON bodies", async () => {
    const res = await request(makeApp())
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{nope");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid-json");
  });
});
