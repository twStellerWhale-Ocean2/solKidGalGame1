// scene/speech.js — 語音關注點（issue #298 自 main.js 拆出，行為零變更）。
// speechManager（Web Speech API 包裝：voice 載入／指定／性別候選／語言 fallback、佇列 replace-last、
// 診斷紀錄、收束 stop）與遊戲發聲入口（speak／npcVoiceFor／playerVoiceProfile／playTone）。
import {
  DEFAULT_VOICE_PROFILE,
  pickVoiceByGender,
  voiceProfileForCharacterId,
  voiceProfileForNpcName
} from "../data/game-data.js";
import { sceneConfigFor } from "../core/lookups.js";
import { createVoiceAssignmentStore } from "../state/voice-assignments.js";
import { session } from "../core/session.js";

export const CHINESE_AUDIO_LANG = "zh-TW";      // design paramChineseAudioLang：中文協助播放語言
export const SPEECH_RATE_SCALE = 0.9;          // issue #109 design paramSpeechRateScale：全域朗讀語速倍率（套用於所有發聲）；issue #149 調整 0.8→0.9
export const SPEECH_QUEUE_MODE = "replace-last";
export const SPEECH_DEBOUNCE_MS = 120;
export const SPEECH_LEADING_PAD = "　　　　　　　　"; // issue #134 design paramSpeechLeadingPad：送入 utterance 前於開頭加入前置留白，延後首字、改善開頭清楚度（8 個全形空白 U+3000）
// issue #134/#246 design paramVoiceAssignmentKey：角色語音指定之全機（device-wide）儲存鍵與讀寫邏輯移入 state/voice-assignments.js（遊戲與管理工具共用單一來源）。
export const SPEECH_DIAGNOSTICS_MAX = 80;
const speechDiagnostics = [];
export const speechManager = createSpeechManager();

// issue #109：全域朗讀語速倍率——所有發聲（角色配音／公主朗讀／中文協助）最終語速＝音色 rate × SPEECH_RATE_SCALE，
// 於發聲端套用（不改 composeVoiceProfile 合成層，保留角色相對快慢；rate 缺漏時以基準 0.86 再縮放）。
export function effectiveSpeechRate(rate) {
  const base = typeof rate === "number" ? rate : DEFAULT_VOICE_PROFILE.rate;
  return Math.round(base * SPEECH_RATE_SCALE * 100) / 100;
}

export function textSample(text) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function normalizeLang(lang) {
  return String(lang || "en-US").toLowerCase();
}

export function primaryLang(lang) {
  return normalizeLang(lang).split("-")[0];
}

export function recordSpeechDiagnostic(entry) {
  const diagnostic = {
    id: `speech-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source: entry.source || "unknown",
    textSample: textSample(entry.text),
    lang: entry.lang || "en-US",
    requestedVoiceHint: entry.voiceHint || "",
    actualVoiceName: entry.actualVoiceName || "",
    actualVoiceLang: entry.actualVoiceLang || "",
    pitch: entry.pitch,
    rate: entry.rate,
    volume: entry.volume,
    queueAction: entry.queueAction || "enqueue",
    cancelCalled: Boolean(entry.cancelCalled),
    fallbackReason: entry.fallbackReason || "",
    errorCode: "",
    voiceLoadState: entry.voiceLoadState || "unknown",
    events: [],
    startedAt: Date.now()
  };
  speechDiagnostics.push(diagnostic);
  if (speechDiagnostics.length > SPEECH_DIAGNOSTICS_MAX) speechDiagnostics.splice(0, speechDiagnostics.length - SPEECH_DIAGNOSTICS_MAX);
  return diagnostic;
}

export function speechEventElapsed(diagnostic) {
  return Date.now() - diagnostic.startedAt;
}

export function addSpeechDiagnosticEvent(diagnostic, eventType, event = {}) {
  diagnostic.events.push({
    eventType,
    elapsedMs: speechEventElapsed(diagnostic),
    charIndex: typeof event.charIndex === "number" ? event.charIndex : null
  });
}

export function createSpeechManager() {
  let voices = [];
  let voiceLoadState = "not-supported";
  let initialized = false;
  let lastReplayKey = "";
  // issue #156：管理器自身追蹤之發聲狀態，供離場收束判斷（headless 測試 mock speak 時瀏覽器 speaking getter 不可靠）。
  let speaking = false;
  // issue #134/#246：角色語音指定（覆蓋層）共用儲存。鍵為 `${gender}:${personality}`，性別預設桶為 `${gender}:`；
  // 全機（非帳號）儲存，與管理工具聲音管理頁籤共用同一 store（state/voice-assignments.js）。
  const voiceStore = createVoiceAssignmentStore();
  // issue #134：voice 清單（getVoices 初次常為空）於 voiceschanged 載入後，通知 UI 重渲染語音設定。
  const voicesChangedHandlers = [];
  // 解析某 (gender×personality) 桶指定的 voice name：先取該桶，缺則繼承性別預設桶。
  const assignedVoiceName = (gender, personality) => voiceStore.resolve(gender, personality);

  const hasSynth = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

  const refreshVoices = () => {
    if (!hasSynth() || typeof window.speechSynthesis.getVoices !== "function") {
      voices = [];
      voiceLoadState = "not-supported";
      return voices;
    }
    try {
      voices = window.speechSynthesis.getVoices() || [];
      voiceLoadState = voices.length ? "ready" : "empty";
    } catch {
      voices = [];
      voiceLoadState = "error";
    }
    return voices;
  };

  const init = () => {
    if (initialized) return;
    initialized = true;
    voiceStore.load();
    refreshVoices();
    try {
      window.speechSynthesis?.addEventListener?.("voiceschanged", () => {
        refreshVoices();
        for (const handler of voicesChangedHandlers) { try { handler(); } catch {} }
      });
    } catch {}
  };

  const selectVoice = (profile) => {
    init();
    const available = voices.length ? voices : refreshVoices();
    const lang = profile.lang || "en-US";
    const target = normalizeLang(lang);
    const primary = primaryLang(lang);
    if (!available.length) {
      return { voice: null, fallbackReason: "voices-empty", voiceLoadState };
    }
    // issue #134：使用者語音指定（覆蓋層）最高優先——依 (gender×personality) 桶、缺則繼承性別桶；
    // 指定 voice 於本機存在即採用並記 user-assigned；不存在則記 assigned-voice-missing，續走語言優先 fallback。
    const wantName = assignedVoiceName(profile.gender, profile.personality);
    let assignedMissing = false;
    if (wantName) {
      const want = String(wantName).toLowerCase();
      const assignedVoice = available.find((voice) => String(voice.name || "").toLowerCase() === want);
      if (assignedVoice) return { voice: assignedVoice, fallbackReason: "user-assigned", voiceLoadState };
      assignedMissing = true;
    }
    const missTag = assignedMissing ? "assigned-voice-missing" : "";
    const langMatches = available.filter((voice) => normalizeLang(voice.lang) === target);
    const primaryMatches = available.filter((voice) => primaryLang(voice.lang) === primary);
    const defaultVoice = available.find((voice) => voice.default) || available[0] || null;
    // issue #209：使用者未指定時，依角色性別自動挑「裝置上存在的同性別具名 voice」（語言優先：先 en-US 再泛 en）。
    // 取代舊有以 voiceHint 字串比對 voice 名稱之失效邏輯（瀏覽器 voice 名稱鮮少含 "female"／"male"，幾乎恆落空）。
    const genderVoice = pickVoiceByGender(profile.gender, langMatches)
      || pickVoiceByGender(profile.gender, primaryMatches);
    if (genderVoice) return { voice: genderVoice, fallbackReason: missTag || "gender-default", voiceLoadState };
    if (langMatches[0]) return { voice: langMatches[0], fallbackReason: missTag, voiceLoadState };
    if (primaryMatches[0]) return { voice: primaryMatches[0], fallbackReason: missTag || `fallback-${primary}`, voiceLoadState };
    return { voice: defaultVoice, fallbackReason: missTag || "language-unavailable", voiceLoadState };
  };

  const buildProfile = (voiceOrLang) => typeof voiceOrLang === "string"
    ? { lang: voiceOrLang, pitch: DEFAULT_VOICE_PROFILE.pitch, rate: DEFAULT_VOICE_PROFILE.rate, voiceHint: "" }
    : { ...DEFAULT_VOICE_PROFILE, ...(voiceOrLang || {}) };

  const stop = (reason = "stop") => {
    if (!hasSynth()) return false;
    try {
      window.speechSynthesis.cancel();
      recordSpeechDiagnostic({
        source: reason,
        text: "",
        lang: "",
        queueAction: "stop",
        cancelCalled: true,
        fallbackReason: reason,
        voiceLoadState
      });
      lastReplayKey = "";
      speaking = false;
      return true;
    } catch {
      return false;
    }
  };

  const speak = (text, voiceOrLang = "en-US", options = {}) => {
    const profile = buildProfile(voiceOrLang);
    const done = typeof options.then === "function" ? options.then : null;
    const replayKey = options.replayKey || `${options.source || "speech"}:${profile.lang || "en-US"}:${textSample(text)}`;
    if (!session.state.speechEnabled || !hasSynth()) {
      recordSpeechDiagnostic({
        source: options.source || "speech-disabled",
        text,
        lang: profile.lang || "en-US",
        pitch: profile.pitch,
        rate: effectiveSpeechRate(profile.rate),
        volume: 1,
        queueAction: "skip",
        cancelCalled: false,
        fallbackReason: session.state.speechEnabled ? "speechSynthesis-unavailable" : "voice-off",
        voiceLoadState
      });
      if (done) done();
      return;
    }

    init();
    let cancelCalled = false;
    let queueAction = "enqueue";
    if (SPEECH_QUEUE_MODE === "replace-last" && replayKey === lastReplayKey) {
      try {
        window.speechSynthesis.cancel();
        cancelCalled = true;
        queueAction = "replace-last";
      } catch {}
    }
    lastReplayKey = replayKey;

    const selection = selectVoice(profile);
    // issue #134：送入 utterance 前於開頭加入前置留白延後首字（畫面顯示與診斷紀錄仍用原文）。
    const utterance = new SpeechSynthesisUtterance(SPEECH_LEADING_PAD + text);
    utterance.lang = profile.lang || "en-US";
    utterance.pitch = typeof profile.pitch === "number" ? profile.pitch : 1;
    utterance.rate = effectiveSpeechRate(profile.rate);
    utterance.volume = typeof profile.volume === "number" ? profile.volume : 1;
    let voiceAssignmentFailed = false;
    if (selection.voice) {
      try {
        utterance.voice = selection.voice;
      } catch {
        voiceAssignmentFailed = true;
      }
    }

    const diagnostic = recordSpeechDiagnostic({
      source: options.source || "speech",
      text,
      lang: utterance.lang,
      voiceHint: profile.voiceHint,
      actualVoiceName: selection.voice?.name || "",
      actualVoiceLang: selection.voice?.lang || "",
      pitch: utterance.pitch,
      rate: utterance.rate,
      volume: utterance.volume,
      queueAction,
      cancelCalled,
      fallbackReason: selection.fallbackReason || (voiceAssignmentFailed ? "voice-assignment-failed" : ""),
      voiceLoadState: selection.voiceLoadState
    });

    let fired = false;
    const fireThen = () => {
      if (fired) return;
      fired = true;
      speaking = false;
      if (done) done();
    };
    utterance.addEventListener("start", (event) => addSpeechDiagnosticEvent(diagnostic, "start", event));
    utterance.addEventListener("boundary", (event) => addSpeechDiagnosticEvent(diagnostic, "boundary", event));
    utterance.addEventListener("end", (event) => {
      addSpeechDiagnosticEvent(diagnostic, "end", event);
      fireThen();
    });
    utterance.addEventListener("error", (event) => {
      diagnostic.errorCode = event.error || "synthesis-failed";
      diagnostic.fallbackReason = diagnostic.fallbackReason || diagnostic.errorCode;
      addSpeechDiagnosticEvent(diagnostic, "error", event);
      fireThen();
    });

    try {
      speaking = true;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      diagnostic.errorCode = error?.name === "NotAllowedError" ? "not-allowed" : "synthesis-failed";
      diagnostic.fallbackReason = diagnostic.errorCode;
      addSpeechDiagnosticEvent(diagnostic, "error");
      fireThen();
    }
  };

  return {
    init,
    refreshVoices,
    selectVoice,
    speak,
    stop,
    // issue #156：是否有語音正在播放或排隊（內部旗標 OR 瀏覽器狀態），供離場收束判斷。
    isSpeaking: () => speaking || (hasSynth() && (window.speechSynthesis.speaking || window.speechSynthesis.pending)),
    diagnostics: () => speechDiagnostics.slice(),
    resetDiagnostics: () => { speechDiagnostics.length = 0; },
    voiceLoadState: () => voiceLoadState,
    // issue #134：使用者語音指定（覆蓋層）對外介面，供設定 UI 與 selftest 使用。
    listVoices: () => (voices.length ? voices : refreshVoices()).map((voice) => ({
      name: voice.name || "",
      lang: voice.lang || "",
      default: Boolean(voice.default)
    })),
    getVoiceAssignments: () => voiceStore.getAll(),
    setVoiceAssignment: (gender, personality, voiceName) => voiceStore.set(gender, personality, voiceName),
    clearVoiceAssignments: () => voiceStore.clear(),
    onVoicesChanged: (handler) => { if (typeof handler === "function") voicesChangedHandlers.push(handler); }
  };
}

// issue #93：speak 第二參數相容 lang 字串（中文協助沿用）與音色 profile 物件（角色配音）；
// 第三參數 then 於語音自然結束後回呼，供「公主朗讀作答 → NPC 結語」串接，避免彼此 cancel。
export function speak(text, voiceOrLang = "en-US", options = {}) {
  speechManager.speak(text, voiceOrLang, { ...options, source: options.source || "game-speech" });
}

// issue #93：依場景人物／玩家公主的特性宣告解析音色（缺宣告自動降級 default）。
export function npcVoiceFor(hotspot) {
  return voiceProfileForNpcName(sceneConfigFor(hotspot)?.npc);
}
export function playerVoiceProfile() {
  return voiceProfileForCharacterId(session.state.activeCharacterId);
}

// issue #73 中文協助：撥放題目／選項語音。按中文（zh-TW）即標記本題已用中文協助，影響獎勵階梯。
export function playLessonAudio(text, lang = "en-US") {
  if (!text) return;
  if (lang === CHINESE_AUDIO_LANG) session.advChineseUsed = true;
  speak(text, lang, { source: lang === CHINESE_AUDIO_LANG ? "lesson-zh" : "lesson-en", replayKey: `lesson:${lang}:${textSample(text)}` });
}

export function playTone(kind) {
  try {
    if (new URLSearchParams(location.search).has("selftest")) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequencies = { correct: 660, wrong: 180, buy: 820 };
    oscillator.frequency.value = frequencies[kind] || 440;
    oscillator.type = "sine";
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.09);
  } catch {}
}
export function cutSceneVoiceOnSwitch() {
  if (speechManager.isSpeaking()) speechManager.stop("scene-switch");
}

