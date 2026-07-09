import bcrypt from "bcryptjs";
import { validatePassword, validateUsername } from "./validation";
import type { PlayLimitPolicy, SettingsRecord, Store } from "./store";

// [modAdmin模組] 純邏輯：執行期設定預設值合併、值域驗證、可玩／休息狀態推導與 admin 起始帳號（sysStory#4）。
// paramDefaultPlayLimit=`play 15／rest 15／max 20`、paramRegistrationOpenDefault=`true`（DB 有值以 DB 為準）。
export const PLAY_LIMIT_MIN_MINUTES = 1;
export const PLAY_LIMIT_MAX_MINUTES = 120;

export interface ResolvedSettings {
  registrationOpen: boolean;
  defaultPlayMinutes: number;
  defaultRestMinutes: number;
  defaultPlayMaxMinutes: number;
}

export const SETTINGS_DEFAULTS: ResolvedSettings = {
  registrationOpen: true,
  defaultPlayMinutes: 15,
  defaultRestMinutes: 15,
  defaultPlayMaxMinutes: 20
};

/** DB 缺列或缺值以程式預設遞補（spec#26：部署升級零遷移負擔）。 */
export function resolveSettings(record: SettingsRecord | null): ResolvedSettings {
  return {
    registrationOpen: record?.registrationOpen ?? SETTINGS_DEFAULTS.registrationOpen,
    defaultPlayMinutes: record?.defaultPlayMinutes ?? SETTINGS_DEFAULTS.defaultPlayMinutes,
    defaultRestMinutes: record?.defaultRestMinutes ?? SETTINGS_DEFAULTS.defaultRestMinutes,
    defaultPlayMaxMinutes: record?.defaultPlayMaxMinutes ?? SETTINGS_DEFAULTS.defaultPlayMaxMinutes
  };
}

function toMinutes(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n)) return null;
  if (n < PLAY_LIMIT_MIN_MINUTES || n > PLAY_LIMIT_MAX_MINUTES) return null;
  return n;
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

/** PUT /api/admin/settings 值域驗證：分鐘 1–120 整數且 play ≤ max（sysCase#4.3，違者 422）。 */
export function validateSettingsInput(body: unknown): ValidationResult<SettingsRecord> {
  const input = (body || {}) as Record<string, unknown>;
  if (typeof input.registrationOpen !== "boolean") {
    return { ok: false, message: "registrationOpen must be a boolean." };
  }
  const play = toMinutes(input.defaultPlayMinutes);
  const rest = toMinutes(input.defaultRestMinutes);
  const max = toMinutes(input.defaultPlayMaxMinutes);
  if (play === null || rest === null || max === null) {
    return { ok: false, message: `Minutes must be integers between ${PLAY_LIMIT_MIN_MINUTES} and ${PLAY_LIMIT_MAX_MINUTES}.` };
  }
  if (play > max) return { ok: false, message: "Play minutes must not exceed the per-session maximum." };
  return {
    ok: true,
    value: { registrationOpen: input.registrationOpen, defaultPlayMinutes: play, defaultRestMinutes: rest, defaultPlayMaxMinutes: max }
  };
}

/** PUT /api/admin/accounts/:id/play-limit 驗證：locked=false 即解除（分鐘清空）；locked=true 三值必備且 play ≤ max。 */
export function validatePlayLimitInput(body: unknown): ValidationResult<PlayLimitPolicy> {
  const input = (body || {}) as Record<string, unknown>;
  if (typeof input.locked !== "boolean") return { ok: false, message: "locked must be a boolean." };
  if (!input.locked) {
    return { ok: true, value: { locked: false, playMinutes: null, restMinutes: null, playMaxMinutes: null } };
  }
  const play = toMinutes(input.playMinutes);
  const rest = toMinutes(input.restMinutes);
  const max = toMinutes(input.playMaxMinutes);
  if (play === null || rest === null || max === null) {
    return { ok: false, message: `Minutes must be integers between ${PLAY_LIMIT_MIN_MINUTES} and ${PLAY_LIMIT_MAX_MINUTES}.` };
  }
  if (play > max) return { ok: false, message: "Play minutes must not exceed the per-session maximum." };
  return { ok: true, value: { locked: true, playMinutes: play, restMinutes: rest, playMaxMinutes: max } };
}

const MINUTE_MS = 60000;

/** 帳號清單之可玩／休息狀態摘要（sysCase#4.2）：由存檔遊玩／休息時戳推導，語意鏡射遊戲端 play-clock（含用完未進休息之休息窗）。 */
export function derivePlayStatus(
  savePlayLimit: { sessionEndsAt: number; restEndsAt: number; restMinutes: number } | null,
  now: number
): "play" | "rest" | "idle" {
  if (!savePlayLimit) return "idle";
  if (savePlayLimit.restEndsAt > now) return "rest";
  if (savePlayLimit.restEndsAt > 0) return "idle";
  if (savePlayLimit.sessionEndsAt > now) return "play";
  if (savePlayLimit.sessionEndsAt > 0 && now < savePlayLimit.sessionEndsAt + savePlayLimit.restMinutes * MINUTE_MS) return "rest";
  return "idle";
}

/** 未鎖定政策（回應與清單之標準形）。 */
export const UNLOCKED_POLICY: PlayLimitPolicy = { locked: false, playMinutes: null, restMinutes: null, playMaxMinutes: null };

/**
 * admin 起始帳號（paramAdminBootstrap）：僅於帳號不存在時建立——不覆寫既有密碼
 * （admin 線上變更後之密碼以 DB 為準、不被服務重啟回滾）；撞名既有玩家帳號即擲錯使啟動失敗（不就地升權）。
 */
export async function bootstrapAdmin(
  store: Store,
  username: string,
  password: string,
  now: number,
  bcryptCost: number
): Promise<"created" | "exists"> {
  if (!validateUsername(username)) {
    throw new Error(`ADMIN_USERNAME "${username}" is invalid (3-16 chars, lowercase letters and digits, starting with a letter).`);
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    throw new Error("ADMIN_PASSWORD is invalid (6-72 characters).");
  }
  const existing = await store.getAccountByUsername(username);
  if (existing) {
    if (existing.role !== "admin") {
      throw new Error(`ADMIN_USERNAME "${username}" collides with an existing player account. Pick another admin username.`);
    }
    return "exists";
  }
  const created = await store.createAccount(username, bcrypt.hashSync(password, bcryptCost), now, "admin");
  if (created === "taken") {
    // 併發競態下重查：既有 admin 即視為已存在，玩家撞名同樣擲錯。
    const raced = await store.getAccountByUsername(username);
    if (raced && raced.role === "admin") return "exists";
    throw new Error(`ADMIN_USERNAME "${username}" collides with an existing player account. Pick another admin username.`);
  }
  return "created";
}
