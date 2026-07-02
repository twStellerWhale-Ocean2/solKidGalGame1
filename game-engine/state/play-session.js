// state/play-session.js — 遊玩時鐘、護眼結算與休息鎖定之會話服務（issue #298 自 main.js 拆出，行為零變更）。
import {
  MAX_LIMIT_MINUTES,
  MIN_LIMIT_MINUTES,
  playAllowance,
  playStatus,
  resumeFromRest,
  tick as tickPlayLimit
} from "../system/play-clock.js";
import { getActiveAccountId } from "./accounts.js";
import { persist } from "../system/persistence.js";
import { renderSettings } from "../render/hud.js";
import { elements, session } from "../core/session.js";
export function clockNow() {
  return Date.now() + session.testClockOffset;
}

// 僅在已選定帳號且帳號／選角 overlay 未開啟時計時（共用裝置以各帳號各自計算）。
export function playClockActive() {
  return Boolean(getActiveAccountId())
    && !elements.accountSelect?.classList.contains("show")
    && !elements.characterSelect?.classList.contains("show");
}

export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function renderPlayTimeAllowance() {
  if (!elements.playTimeValue) return;
  const { baseMinutes, bonusMinutes } = playAllowance(session.state);
  elements.playTimeValue.innerHTML = bonusMinutes > 0
    ? `${baseMinutes} <span class="play-time-bonus">+${bonusMinutes}😄</span> min`
    : `${baseMinutes} min`;
}

// 更新人物資訊欄時間顯示：可玩時間額度 + 剩餘可玩時間（不以百分比為主，sysCase#7.5）。
// 接受 playStatus() 或 tick() 之結果（兩者皆帶 phase/energyPercent/playRemainingMs/restRemainingMs）。
export function updateEnergyHudFromStatus(status, now = clockNow()) {
  session.state.energy = status.phase === "rest" ? 0 : Math.min(100, Math.max(0, Math.round(Number(status.energyPercent) || 0)));
  renderPlayTimeAllowance();
  if (!elements.timeLeftValue) return;
  if (status.phase === "rest") {
    elements.timeLeftValue.textContent = `Rest ${formatClock(status.restRemainingMs)}`;
  } else if (status.phase === "play") {
    elements.timeLeftValue.textContent = formatClock(status.playRemainingMs);
  } else {
    elements.timeLeftValue.textContent = formatClock((session.state.playLimit?.playMinutes || 15) * 60000);
  }
}

export function renderPlayClock() {
  const now = clockNow();
  const status = playStatus(session.state, now);
  updateEnergyHudFromStatus(status, now);
}

// 每秒一拍：依真實時間推進，時間到顯示結算並進入休息，休息屆滿開放續玩。
export function tickPlayClock() {
  if (!playClockActive()) return;
  const now = clockNow();
  const ev = tickPlayLimit(session.state, now);
  updateEnergyHudFromStatus(ev, now);
  if (ev.justExpired) {
    showPlayBreak(ev.settlement, ev.restRemainingMs, false);
    persist();
  } else if (ev.phase === "rest") {
    showPlayBreak(null, ev.restRemainingMs, Boolean(ev.restDone));
  } else {
    if (ev.justStarted) persist();
    hidePlayBreak();
  }
}

export function startPlayClock() {
  if (session.playClockTimer) return;
  tickPlayClock();
  session.playClockTimer = window.setInterval(tickPlayClock, 1000);
}

export function renderPlayBreakStats(settlement) {
  if (!settlement || !elements.playBreakStats) return;
  const rows = [
    ["Coins this round", `+${settlement.coinsGained}`],
    ["Questions", String(settlement.answered)],
    ["Correct", String(settlement.correct)],
    ["Accuracy", `${settlement.accuracy}%`]
  ];
  elements.playBreakStats.replaceChildren(...rows.map(([label, value]) => {
    const row = document.createElement("div");
    row.className = "play-break-stat";
    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    const valueEl = document.createElement("strong");
    valueEl.textContent = value;
    row.append(labelEl, valueEl);
    return row;
  }));
}

// 顯示結算＋休息 overlay：settlement 僅於時間到當下提供，其後休息拍只更新倒數與續玩鈕狀態。
export function showPlayBreak(settlement, restRemainingMs, restDone) {
  renderPlayBreakStats(settlement);
  if (elements.playBreakCountdown) {
    elements.playBreakCountdown.textContent = restDone
      ? "Eyes rested! You can play again."
      : `Resting… ${formatClock(restRemainingMs)} left`;
  }
  const resumeWasDisabled = elements.playBreakResume?.disabled !== false;
  if (elements.playBreakResume) elements.playBreakResume.disabled = !restDone;
  if (!session.playBreakShown) {
    elements.playBreak?.classList.add("show");
    elements.playBreak?.setAttribute("aria-hidden", "false");
    document.body.classList.add("play-break-open");
    session.playBreakShown = true;
    elements.playBreak?.querySelector(".play-break-card")?.focus({ preventScroll: true });
  }
  // 休息屆滿、續玩鈕由禁用轉為可用時，移焦點到續玩鈕（鍵盤可直接續玩、不卡關）。
  if (restDone && resumeWasDisabled) elements.playBreakResume?.focus({ preventScroll: true });
}

export function hidePlayBreak() {
  if (!session.playBreakShown) return;
  elements.playBreak?.classList.remove("show");
  elements.playBreak?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("play-break-open");
  session.playBreakShown = false;
}

// 休息屆滿後按「Play again」續玩；休息未滿則不動作（不可繞過休息）。
export function resumePlayFromBreak() {
  if (!resumeFromRest(session.state, clockNow())) return;
  persist();
  hidePlayBreak();
  tickPlayClock();
}

export function applyPlayLimitSettings() {
  const toMinutes = (value) => {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return MIN_LIMIT_MINUTES;
    return Math.min(MAX_LIMIT_MINUTES, Math.max(MIN_LIMIT_MINUTES, n));
  };
  session.state.playLimit.playMinutes = toMinutes(elements.playMinutesInput?.value);
  session.state.playLimit.restMinutes = toMinutes(elements.restMinutesInput?.value);
  persist();
  renderSettings();
  elements.statusMessage.textContent = `Play ${session.state.playLimit.playMinutes} min, rest ${session.state.playLimit.restMinutes} min.`;
}

