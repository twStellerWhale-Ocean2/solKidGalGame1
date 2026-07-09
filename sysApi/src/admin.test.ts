import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "./app";
import { createMemoryStore } from "./memory-store";
import { createRateLimiter } from "./rate-limit";
import { bootstrapAdmin, derivePlayStatus, resolveSettings, validatePlayLimitInput, validateSettingsInput } from "./admin";
import { hashToken } from "./tokens";
import type { Store } from "./store";

// [modAdmin模組]（sysStory#4）單元測試：admin 鑑權與權限負向、帳號管理、執行期設定、
// bootstrap 語意，與 #309 審查 A5（限流僅計失敗）／A7（session 清理）／B9（存檔形狀）收斂。
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
    bcryptCost: 4,
    ...overrides
  });
}

beforeEach(() => {
  store = createMemoryStore();
  clock = { value: 1_000_000 };
});

async function makeAdmin(app: ReturnType<typeof createApp>, username = "mom01") {
  await bootstrapAdmin(store, username, "adminpw", clock.value, 4);
  const login = await request(app).post("/api/auth/login").send({ username, password: "adminpw" });
  return { token: login.body.token as string, auth: { Authorization: `Bearer ${login.body.token}` }, id: login.body.account.id as string };
}

async function makePlayer(app: ReturnType<typeof createApp>, username = "amy2019") {
  const res = await request(app).post("/api/auth/register").send({ username, password: "secret6" });
  return { token: res.body.token as string, auth: { Authorization: `Bearer ${res.body.token}` }, id: res.body.account.id as string };
}

describe("admin bootstrap (paramAdminBootstrap)", () => {
  it("creates the admin only when missing; keeps DB password on restart", async () => {
    expect(await bootstrapAdmin(store, "mom01", "adminpw", clock.value, 4)).toBe("created");
    // admin 於線上改密後（模擬）重啟：不覆寫既有密碼。
    await store.updatePassword("mom01", bcrypt.hashSync("newerpw", 4));
    expect(await bootstrapAdmin(store, "mom01", "old-env-pw", clock.value, 4)).toBe("exists");
    const account = await store.getAccountByUsername("mom01");
    expect(bcrypt.compareSync("newerpw", account!.passwordHash)).toBe(true);
  });

  it("fails startup when the username collides with a player account", async () => {
    const app = makeApp();
    await makePlayer(app, "kid01");
    await expect(bootstrapAdmin(store, "kid01", "adminpw", clock.value, 4)).rejects.toThrow(/collides/);
  });

  it("rejects invalid admin username or password", async () => {
    await expect(bootstrapAdmin(store, "BAD", "adminpw", clock.value, 4)).rejects.toThrow(/ADMIN_USERNAME/);
    await expect(bootstrapAdmin(store, "mom01", "123", clock.value, 4)).rejects.toThrow(/ADMIN_PASSWORD/);
  });
});

describe("admin authorization boundary (solCase#25.2)", () => {
  it("rejects missing/forged tokens with 401 and player sessions with 403 on every admin endpoint", async () => {
    const app = makeApp();
    const player = await makePlayer(app);
    const endpoints: Array<[string, string]> = [
      ["get", "/api/admin/accounts"],
      ["post", `/api/admin/accounts/${player.id}/reset-password`],
      ["post", `/api/admin/accounts/${player.id}/revoke-sessions`],
      ["delete", `/api/admin/accounts/${player.id}`],
      ["put", `/api/admin/accounts/${player.id}/play-limit`],
      ["get", "/api/admin/settings"],
      ["put", "/api/admin/settings"]
    ];
    for (const [method, url] of endpoints) {
      const anon = await (request(app) as any)[method](url);
      expect(anon.status, `${method} ${url} anon`).toBe(401);
      const asPlayer = await (request(app) as any)[method](url).set(player.auth);
      expect(asPlayer.status, `${method} ${url} player`).toBe(403);
      expect(asPlayer.body.error.code).toBe("admin-only");
    }
  });
});

describe("admin account management (sysCase#4.2)", () => {
  it("lists accounts with role, timestamps, policy and playStatus", async () => {
    const app = makeApp();
    const admin = await makeAdmin(app);
    const player = await makePlayer(app);
    await request(app).put("/api/save").set(player.auth)
      .send({ state: { coins: 5, playLimit: { sessionEndsAt: clock.value + 60_000, restEndsAt: 0, restMinutes: 15 } }, baseUpdatedAt: null });
    const res = await request(app).get("/api/admin/accounts").set(admin.auth);
    expect(res.status).toBe(200);
    const rows = res.body.accounts;
    expect(rows).toHaveLength(2);
    const kid = rows.find((row: { username: string }) => row.username === "amy2019");
    expect(kid.role).toBe("player");
    expect(kid.lastLoginAt).toBe(clock.value);
    expect(kid.saveUpdatedAt).toBeGreaterThan(0);
    expect(kid.playStatus).toBe("play");
    expect(kid.playLimitPolicy.locked).toBe(false);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  it("resets a player password: old fails, new works, sessions revoked", async () => {
    const app = makeApp();
    const admin = await makeAdmin(app);
    const player = await makePlayer(app);
    const res = await request(app).post(`/api/admin/accounts/${player.id}/reset-password`).set(admin.auth)
      .send({ newPassword: "fresh66" });
    expect(res.status).toBe(204);
    expect((await request(app).get("/api/save").set(player.auth)).status).toBe(401);
    expect((await request(app).post("/api/auth/login").send({ username: "amy2019", password: "secret6" })).status).toBe(401);
    expect((await request(app).post("/api/auth/login").send({ username: "amy2019", password: "fresh66" })).status).toBe(200);
  });

  it("keeps the current admin session when the admin resets their own password", async () => {
    const app = makeApp();
    const admin = await makeAdmin(app);
    const res = await request(app).post(`/api/admin/accounts/${admin.id}/reset-password`).set(admin.auth)
      .send({ newPassword: "rotated9" });
    expect(res.status).toBe(204);
    expect((await request(app).get("/api/admin/accounts").set(admin.auth)).status).toBe(200);
    expect((await request(app).post("/api/auth/login").send({ username: "mom01", password: "rotated9" })).status).toBe(200);
  });

  it("validates the new password against spec#23 rules", async () => {
    const app = makeApp();
    const admin = await makeAdmin(app);
    const player = await makePlayer(app);
    const short = await request(app).post(`/api/admin/accounts/${player.id}/reset-password`).set(admin.auth)
      .send({ newPassword: "12345" });
    expect(short.status).toBe(422);
    expect(short.body.error.code).toBe("password-too-short");
  });

  it("revoke-sessions logs the account out everywhere", async () => {
    const app = makeApp();
    const admin = await makeAdmin(app);
    const player = await makePlayer(app);
    const res = await request(app).post(`/api/admin/accounts/${player.id}/revoke-sessions`).set(admin.auth);
    expect(res.status).toBe(204);
    expect((await request(app).get("/api/save").set(player.auth)).status).toBe(401);
  });

  it("deletes an account together with save and sessions; self-delete is rejected", async () => {
    const app = makeApp();
    const admin = await makeAdmin(app);
    const player = await makePlayer(app);
    await request(app).put("/api/save").set(player.auth).send({ state: { coins: 3 }, baseUpdatedAt: null });
    const self = await request(app).delete(`/api/admin/accounts/${admin.id}`).set(admin.auth);
    expect(self.status).toBe(409);
    expect(self.body.error.code).toBe("cannot-delete-self");
    const res = await request(app).delete(`/api/admin/accounts/${player.id}`).set(admin.auth);
    expect(res.status).toBe(204);
    expect((await request(app).get("/api/save").set(player.auth)).status).toBe(401);
    expect((await request(app).post("/api/auth/login").send({ username: "amy2019", password: "secret6" })).status).toBe(401);
    expect((await request(app).delete(`/api/admin/accounts/${player.id}`).set(admin.auth)).status).toBe(404);
  });
});

describe("play-limit policy (spec#26)", () => {
  it("locks minutes within range, attaches policy to GET and PUT /api/save, and unlock restores", async () => {
    const app = makeApp();
    const admin = await makeAdmin(app);
    const player = await makePlayer(app);
    const lock = await request(app).put(`/api/admin/accounts/${player.id}/play-limit`).set(admin.auth)
      .send({ locked: true, playMinutes: 10, restMinutes: 20, playMaxMinutes: 12 });
    expect(lock.status).toBe(200);
    const got = await request(app).get("/api/save").set(player.auth);
    expect(got.body.playLimitPolicy).toEqual({ locked: true, playMinutes: 10, restMinutes: 20, playMaxMinutes: 12 });
    // 政策與存檔分離：PUT 不改寫 state、回應搭載政策（sysCase#2.2）。
    const put = await request(app).put("/api/save").set(player.auth)
      .send({ state: { coins: 1, playLimit: { playMinutes: 30 } }, baseUpdatedAt: null });
    expect(put.body.playLimitPolicy.locked).toBe(true);
    const back = await request(app).get("/api/save").set(player.auth);
    expect(back.body.state.playLimit.playMinutes).toBe(30);
    const unlock = await request(app).put(`/api/admin/accounts/${player.id}/play-limit`).set(admin.auth)
      .send({ locked: false });
    expect(unlock.status).toBe(200);
    expect((await request(app).get("/api/save").set(player.auth)).body.playLimitPolicy.locked).toBe(false);
  });

  it("rejects out-of-range, non-integer and play>max combinations with 422", async () => {
    const app = makeApp();
    const admin = await makeAdmin(app);
    const player = await makePlayer(app);
    const bad = [
      { locked: true, playMinutes: 0, restMinutes: 15, playMaxMinutes: 20 },
      { locked: true, playMinutes: 15, restMinutes: 121, playMaxMinutes: 20 },
      { locked: true, playMinutes: "x", restMinutes: 15, playMaxMinutes: 20 },
      { locked: true, playMinutes: 30, restMinutes: 15, playMaxMinutes: 20 },
      { locked: "yes" }
    ];
    for (const body of bad) {
      const res = await request(app).put(`/api/admin/accounts/${player.id}/play-limit`).set(admin.auth).send(body);
      expect(res.status, JSON.stringify(body)).toBe(422);
    }
  });
});

describe("runtime settings (spec#26)", () => {
  it("serves program defaults when the DB has no row, persists writes, and /api/config mirrors them", async () => {
    const app = makeApp();
    const admin = await makeAdmin(app);
    const before = await request(app).get("/api/admin/settings").set(admin.auth);
    expect(before.body).toEqual({ registrationOpen: true, defaultPlayMinutes: 15, defaultRestMinutes: 15, defaultPlayMaxMinutes: 20 });
    const put = await request(app).put("/api/admin/settings").set(admin.auth)
      .send({ registrationOpen: false, defaultPlayMinutes: 10, defaultRestMinutes: 30, defaultPlayMaxMinutes: 15 });
    expect(put.status).toBe(200);
    const config = await request(app).get("/api/config");
    expect(config.status).toBe(200);
    expect(config.body).toEqual({
      registrationOpen: false,
      defaultPlayLimit: { playMinutes: 10, restMinutes: 30, playMaxMinutes: 15 }
    });
  });

  it("closes registration with 403 registration-closed while existing logins keep working", async () => {
    const app = makeApp();
    const admin = await makeAdmin(app);
    const player = await makePlayer(app);
    await request(app).put("/api/admin/settings").set(admin.auth)
      .send({ registrationOpen: false, defaultPlayMinutes: 15, defaultRestMinutes: 15, defaultPlayMaxMinutes: 20 });
    const denied = await request(app).post("/api/auth/register").send({ username: "newkid", password: "secret6" });
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe("registration-closed");
    expect((await request(app).post("/api/auth/login").send({ username: "amy2019", password: "secret6" })).status).toBe(200);
    void player;
  });

  it("rejects invalid settings payloads with 422 (range, type, play>max)", async () => {
    const app = makeApp();
    const admin = await makeAdmin(app);
    const bad = [
      { registrationOpen: "yes", defaultPlayMinutes: 15, defaultRestMinutes: 15, defaultPlayMaxMinutes: 20 },
      { registrationOpen: true, defaultPlayMinutes: 0, defaultRestMinutes: 15, defaultPlayMaxMinutes: 20 },
      { registrationOpen: true, defaultPlayMinutes: 15, defaultRestMinutes: 15, defaultPlayMaxMinutes: 121 },
      { registrationOpen: true, defaultPlayMinutes: 30, defaultRestMinutes: 15, defaultPlayMaxMinutes: 20 }
    ];
    for (const body of bad) {
      const res = await request(app).put("/api/admin/settings").set(admin.auth).send(body);
      expect(res.status, JSON.stringify(body)).toBe(422);
    }
  });
});

describe("server hardening (#309 review A5/A7/B9)", () => {
  it("A5: only failures count toward the login limiter; successes never trip it", async () => {
    const app = makeApp();
    await makePlayer(app);
    for (let i = 0; i < 5; i += 1) {
      const ok = await request(app).post("/api/auth/login").send({ username: "amy2019", password: "secret6" });
      expect(ok.status).toBe(200);
    }
  });

  it("A7: expired and revoked session rows are purged lazily on login", async () => {
    const app = makeApp();
    const player = await makePlayer(app);
    const expiredHash = hashToken(player.token, SECRET);
    await request(app).post("/api/auth/logout").set(player.auth); // revoked row
    clock.value += 1000;
    await request(app).post("/api/auth/login").send({ username: "amy2019", password: "secret6" });
    expect(await store.getSession(expiredHash)).toBeNull();
  });

  it("B9: rejects malformed top-level field types with 422 invalid-state (nothing persisted)", async () => {
    const app = makeApp();
    const player = await makePlayer(app);
    const bad = [
      { coins: "lots" },
      { playerName: 7 },
      { playLimit: [1, 2] },
      { outfit: "gown" }
    ];
    for (const state of bad) {
      const res = await request(app).put("/api/save").set(player.auth).send({ state, baseUpdatedAt: null });
      expect(res.status, JSON.stringify(state)).toBe(422);
      expect(res.body.error.code).toBe("invalid-state");
    }
    expect((await request(app).get("/api/save").set(player.auth)).body.state).toBeNull();
  });
});

describe("pure helpers", () => {
  it("derivePlayStatus mirrors the game play-clock semantics", () => {
    const now = 1_000_000;
    expect(derivePlayStatus(null, now)).toBe("idle");
    expect(derivePlayStatus({ sessionEndsAt: now + 1, restEndsAt: 0, restMinutes: 15 }, now)).toBe("play");
    expect(derivePlayStatus({ sessionEndsAt: 0, restEndsAt: now + 1, restMinutes: 15 }, now)).toBe("rest");
    expect(derivePlayStatus({ sessionEndsAt: 0, restEndsAt: now - 1, restMinutes: 15 }, now)).toBe("idle");
    // 用完未進休息：休息窗內視為 rest、窗後 idle。
    expect(derivePlayStatus({ sessionEndsAt: now - 1000, restEndsAt: 0, restMinutes: 15 }, now)).toBe("rest");
    expect(derivePlayStatus({ sessionEndsAt: now - 16 * 60000, restEndsAt: 0, restMinutes: 15 }, now)).toBe("idle");
  });

  it("resolveSettings merges DB values over program defaults", () => {
    expect(resolveSettings(null).registrationOpen).toBe(true);
    expect(resolveSettings({ registrationOpen: false, defaultPlayMinutes: null, defaultRestMinutes: 9, defaultPlayMaxMinutes: null }))
      .toEqual({ registrationOpen: false, defaultPlayMinutes: 15, defaultRestMinutes: 9, defaultPlayMaxMinutes: 20 });
  });

  it("validators return typed values on success", () => {
    expect(validateSettingsInput({ registrationOpen: true, defaultPlayMinutes: 1, defaultRestMinutes: 120, defaultPlayMaxMinutes: 120 }).ok).toBe(true);
    expect(validatePlayLimitInput({ locked: false }).ok).toBe(true);
  });
});
