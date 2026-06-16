// 遊玩時間限制與護眼休息（issue #6 / spec#9）的純邏輯。
// 依真實時間（now，epoch ms）計算目前帳號的遊玩時間預算（energy 顯示）、時間到結算與強制休息。
// 各帳號各自計算（狀態存於各帳號進度）。所有函式以 now 為參數（可注入），便於以合成時鐘測試、不需真實等待。
// 刻意不依賴其他模組（含 lookups），避免與 state 層循環相依（參見 accounts.js 同樣的隔離考量）。

export const MINUTE_MS = 60000;
export const MIN_LIMIT_MINUTES = 1;
export const MAX_LIMIT_MINUTES = 120;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function emptyCycle() {
  return { coinsAtStart: 0, answered: 0, correct: 0 };
}

export function defaultPlayLimit() {
  return { playMinutes: 15, restMinutes: 15, sessionEndsAt: 0, restEndsAt: 0, cycle: emptyCycle() };
}

function toMinutes(value, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return clamp(n, MIN_LIMIT_MINUTES, MAX_LIMIT_MINUTES);
}

function toTimestamp(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// 正規化（供 normalizeState 呼叫）：守住缺漏／損壞欄位，符合 solCase#8.1。
export function normalizePlayLimit(candidate = {}) {
  const base = defaultPlayLimit();
  const cycle = candidate.cycle && typeof candidate.cycle === "object" ? candidate.cycle : {};
  return {
    playMinutes: toMinutes(candidate.playMinutes, base.playMinutes),
    restMinutes: toMinutes(candidate.restMinutes, base.restMinutes),
    sessionEndsAt: toTimestamp(candidate.sessionEndsAt),
    restEndsAt: toTimestamp(candidate.restEndsAt),
    cycle: {
      coinsAtStart: Number(cycle.coinsAtStart) || 0,
      answered: Math.max(0, Math.trunc(Number(cycle.answered)) || 0),
      correct: Math.max(0, Math.trunc(Number(cycle.correct)) || 0)
    }
  };
}

// 讀取目前狀態（不改 state）。phase: "rest" | "play" | "idle"。
export function playStatus(state, now) {
  const pl = state.playLimit || defaultPlayLimit();
  if (pl.restEndsAt > 0) {
    const restRemainingMs = Math.max(0, pl.restEndsAt - now);
    return { phase: "rest", restRemainingMs, restDone: pl.restEndsAt - now <= 0, energyPercent: 0 };
  }
  if (pl.sessionEndsAt <= 0) {
    return { phase: "idle", energyPercent: 100 };
  }
  const totalMs = pl.playMinutes * MINUTE_MS;
  const playRemainingMs = pl.sessionEndsAt - now;
  return {
    phase: "play",
    playRemainingMs: Math.max(0, playRemainingMs),
    expired: playRemainingMs <= 0,
    energyPercent: clamp(Math.round((playRemainingMs / totalMs) * 100), 0, 100)
  };
}

// 開始（或重新開始）一個遊玩回合：重置本回合統計與遊玩結束時戳。
export function startSession(state, now) {
  const pl = state.playLimit;
  pl.sessionEndsAt = now + pl.playMinutes * MINUTE_MS;
  pl.restEndsAt = 0;
  pl.cycle = { coinsAtStart: Number(state.coins) || 0, answered: 0, correct: 0 };
}

// 進入強制休息：鎖定遊玩到 restEndsAt。
export function enterRest(state, now) {
  const pl = state.playLimit;
  pl.restEndsAt = now + pl.restMinutes * MINUTE_MS;
  pl.sessionEndsAt = 0;
}

// 休息結束後使用者主動續玩：開始新回合；僅在已過休息時間時有效（休息未滿不可繞過）。
export function resumeFromRest(state, now) {
  const status = playStatus(state, now);
  if (status.phase === "rest" && !status.restDone) return false;
  startSession(state, now);
  return true;
}

// 本回合成果（時間到結算畫面用）：本回合獲得金錢、答題數、答對數與正確度。
export function settlementSummary(state) {
  const cycle = state.playLimit?.cycle || emptyCycle();
  const coinsGained = Math.max(0, (Number(state.coins) || 0) - (Number(cycle.coinsAtStart) || 0));
  const answered = Math.max(0, cycle.answered || 0);
  const correct = Math.max(0, cycle.correct || 0);
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  return { coinsGained, answered, correct, accuracy };
}

// 記錄一次答題（每次嘗試計入 answered，答對另計 correct），供結算正確度。
export function recordAnswer(state, correct) {
  const pl = state.playLimit;
  if (!pl || !pl.cycle) return;
  pl.cycle.answered += 1;
  if (correct) pl.cycle.correct += 1;
}

// 推進一拍（ticker 呼叫）：依 now 套用狀態轉換，回傳事件供 UI 反應。
export function tick(state, now) {
  if (!state.playLimit) state.playLimit = defaultPlayLimit();
  const status = playStatus(state, now);
  if (status.phase === "rest") {
    // 休息結束不自動續玩：回報 restDone，由使用者按「繼續玩」(resumeFromRest) 才開始新回合，確保有意識地休息。
    return { phase: "rest", energyPercent: 0, restDone: status.restDone, restRemainingMs: status.restRemainingMs };
  }
  if (status.phase === "idle") {
    startSession(state, now);
    const next = playStatus(state, now);
    return { phase: "play", energyPercent: next.energyPercent, justStarted: true, playRemainingMs: next.playRemainingMs };
  }
  if (status.expired) {
    const settlement = settlementSummary(state);
    enterRest(state, now);
    const rest = playStatus(state, now);
    return { phase: "rest", energyPercent: 0, justExpired: true, settlement, restRemainingMs: rest.restRemainingMs };
  }
  return { phase: "play", energyPercent: status.energyPercent, playRemainingMs: status.playRemainingMs };
}
