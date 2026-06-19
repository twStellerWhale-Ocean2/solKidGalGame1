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
  // jobsDone（issue #177）：本遊玩週期已答對之打工場景 id；使同場景打工於本週期下架、下一週期由 startSession 重置。
  return { coinsAtStart: 0, answered: 0, correct: 0, jobsDone: [] };
}

export function defaultPlayLimit() {
  // playMaxMinutes（spec#11）：本回合可玩時間的護眼硬上限；生活聊天答對可延長 sessionEndsAt，但不得超過此值。
  // sessionMaxEndsAt：本回合延長的時戳上限（startSession 時依 playMaxMinutes 設定，0=尚未開始）。
  return { playMinutes: 15, restMinutes: 15, playMaxMinutes: 20, sessionEndsAt: 0, restEndsAt: 0, sessionMaxEndsAt: 0, cycle: emptyCycle() };
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
    playMaxMinutes: toMinutes(candidate.playMaxMinutes, base.playMaxMinutes),
    sessionEndsAt: toTimestamp(candidate.sessionEndsAt),
    restEndsAt: toTimestamp(candidate.restEndsAt),
    sessionMaxEndsAt: toTimestamp(candidate.sessionMaxEndsAt),
    cycle: {
      coinsAtStart: Number(cycle.coinsAtStart) || 0,
      answered: Math.max(0, Math.trunc(Number(cycle.answered)) || 0),
      correct: Math.max(0, Math.trunc(Number(cycle.correct)) || 0),
      // issue #177：守舊存檔——缺漏或非陣列 → 空；僅留字串場景 id（舊存檔視為本週期尚未答對任何打工）。
      jobsDone: Array.isArray(cycle.jobsDone) ? cycle.jobsDone.filter((id) => typeof id === "string") : []
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
  const playRemainingMs = pl.sessionEndsAt - now;
  if (playRemainingMs <= 0) {
    // 遊玩時間已用完但尚未進入休息（如於帳號選單離開、ticker 未運作，restEndsAt 仍 0）：
    // 休息自「遊玩結束時戳」起算、離開（未遊玩）時間計入休息——離開達休息時長即視為休息已足、
    // 回到 idle 可重新開始；否則回報休息剩餘，使帳號卡與 tick() 一致、不再誤顯示「Play 0:00」（issue #169）。
    const restEnd = pl.sessionEndsAt + pl.restMinutes * MINUTE_MS;
    if (now >= restEnd) return { phase: "idle", energyPercent: 100 };
    return { phase: "rest", restRemainingMs: restEnd - now, restDone: false, energyPercent: 0 };
  }
  const totalMs = pl.playMinutes * MINUTE_MS;
  return {
    phase: "play",
    playRemainingMs,
    energyPercent: clamp(Math.round((playRemainingMs / totalMs) * 100), 0, 100)
  };
}

// 開始（或重新開始）一個遊玩回合：重置本回合統計與遊玩結束時戳。
export function startSession(state, now) {
  const pl = state.playLimit;
  pl.sessionEndsAt = now + pl.playMinutes * MINUTE_MS;
  // 護眼上限不得低於基礎遊玩時長；延長至多到 sessionMaxEndsAt（spec#11）。
  const maxMinutes = Math.max(pl.playMinutes, pl.playMaxMinutes || pl.playMinutes);
  pl.sessionMaxEndsAt = now + maxMinutes * MINUTE_MS;
  pl.restEndsAt = 0;
  pl.cycle = { coinsAtStart: Number(state.coins) || 0, answered: 0, correct: 0, jobsDone: [] };
}

// 心情延長當次遊玩（spec#11，solCase#14.1／sysCase#11.3）：依心情換算的分鐘數延長 sessionEndsAt，
// 但不得超過 sessionMaxEndsAt 護眼上限；僅於遊玩回合中（phase=play）有效。回傳實際延長的毫秒數。
export function extendSession(state, now, minutes) {
  const pl = state.playLimit;
  if (!pl) return 0;
  if (playStatus(state, now).phase !== "play") return 0;
  const cap = pl.sessionMaxEndsAt > 0 ? pl.sessionMaxEndsAt : pl.sessionEndsAt;
  const wanted = pl.sessionEndsAt + Math.max(0, Number(minutes) || 0) * MINUTE_MS;
  const next = Math.min(wanted, cap);
  const added = Math.max(0, next - pl.sessionEndsAt);
  pl.sessionEndsAt = next;
  return added;
}

// 本回合「可玩時間額度」（spec#9 顯示用）：基礎時長 + 已賺得的生活聊天延長（spec#11）。
// 回傳 { baseMinutes, bonusMinutes, totalMinutes }；未開始（idle/rest，sessionEndsAt<=0）時 bonus=0、total=base。
// 由既有時戳推導，不需新增 state 欄位：sessionStart = sessionMaxEndsAt - maxMinutes，延長量 = (sessionEndsAt - sessionStart) - base。
export function playAllowance(state) {
  const pl = state.playLimit || defaultPlayLimit();
  const baseMinutes = toMinutes(pl.playMinutes, 15);
  if (!(pl.sessionEndsAt > 0) || !(pl.sessionMaxEndsAt > 0)) {
    return { baseMinutes, bonusMinutes: 0, totalMinutes: baseMinutes };
  }
  const maxMinutes = Math.max(baseMinutes, toMinutes(pl.playMaxMinutes, baseMinutes));
  const sessionStart = pl.sessionMaxEndsAt - maxMinutes * MINUTE_MS;
  const totalMinutes = clamp(Math.round((pl.sessionEndsAt - sessionStart) / MINUTE_MS), baseMinutes, maxMinutes);
  return { baseMinutes, bonusMinutes: Math.max(0, totalMinutes - baseMinutes), totalMinutes };
}

// 進入強制休息：鎖定遊玩到 restEndsAt。
// 休息自「遊玩結束時戳」(sessionEndsAt) 起算，使離開（未遊玩）的時間計入休息（issue #169）；
// 無有效 session 時退回以 now 起算。正常遊玩中即時到點時 sessionEndsAt≈now，與舊行為一致。
export function enterRest(state, now) {
  const pl = state.playLimit;
  const restFrom = pl.sessionEndsAt > 0 ? pl.sessionEndsAt : now;
  pl.restEndsAt = restFrom + pl.restMinutes * MINUTE_MS;
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

// 記錄本遊玩週期某場景之打工已答對（issue #177，spec#11 反洗 coins）：使同場景打工於本週期下架、
// 不可再作答；下一週期由 startSession 重置。僅供打工(job) 答對時呼叫——聊天(chat) 不計（不發 coins）。
export function markJobDone(state, place) {
  const pl = state.playLimit;
  if (!pl || !pl.cycle || !place) return;
  if (!Array.isArray(pl.cycle.jobsDone)) pl.cycle.jobsDone = [];
  if (!pl.cycle.jobsDone.includes(place)) pl.cycle.jobsDone.push(place);
}

// 本遊玩週期內，該場景之打工是否已答對（已下架）。
export function isJobDone(state, place) {
  const jobsDone = state.playLimit?.cycle?.jobsDone;
  return Array.isArray(jobsDone) && jobsDone.includes(place);
}

// 推進一拍（ticker 呼叫）：依 now 套用狀態轉換，回傳事件供 UI 反應。
export function tick(state, now) {
  if (!state.playLimit) state.playLimit = defaultPlayLimit();
  const pl = state.playLimit;

  // 休息進行中（restEndsAt 已設）：休息結束不自動續玩，回報 restDone，由使用者按「繼續玩」
  // (resumeFromRest) 才開始新回合，確保有意識地休息。
  if (pl.restEndsAt > 0) {
    const restRemainingMs = Math.max(0, pl.restEndsAt - now);
    return { phase: "rest", energyPercent: 0, restDone: restRemainingMs <= 0, restRemainingMs };
  }

  // 遊玩回合進行中。
  if (pl.sessionEndsAt > 0 && now < pl.sessionEndsAt) {
    const status = playStatus(state, now);
    return { phase: "play", energyPercent: status.energyPercent, playRemainingMs: status.playRemainingMs };
  }

  // 遊玩時間已用完、尚未進入休息（restEndsAt 仍 0）。
  if (pl.sessionEndsAt > 0) {
    const restEnd = pl.sessionEndsAt + pl.restMinutes * MINUTE_MS;
    if (now < restEnd) {
      // 首次觀察到用完（遊玩中即時到點，或離開後於休息窗內回來）：結算並進入休息（自 sessionEndsAt 起算）。
      const settlement = settlementSummary(state);
      enterRest(state, now);
      return { phase: "rest", energyPercent: 0, justExpired: true, settlement, restRemainingMs: Math.max(0, pl.restEndsAt - now) };
    }
    // 離開已達休息時長：休息已足，清掉殘留 session、直接開新回合（玩家已離開、不再強制等待，issue #169）。
    pl.sessionEndsAt = 0;
  }

  // 全新／休息已足：開始新回合。
  startSession(state, now);
  const next = playStatus(state, now);
  return { phase: "play", energyPercent: next.energyPercent, justStarted: true, playRemainingMs: next.playRemainingMs };
}
