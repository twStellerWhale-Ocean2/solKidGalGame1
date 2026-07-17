// core/session.js — 跨關注點會話可變狀態之單一居所（issue #298 main.js 拆解基座）。
// main.js 原以模組級 let 散置的遊玩會話狀態集中於此，各關注點模組以 `session.xxx` 讀寫；
// 僅收「跨模組共享」的暫態會話資料——模組私有狀態應留在各模組內部，勿回流此處。
// 本檔不得 import 任何關注點模組（維持無環基座）；elements 為全域 DOM 查找表、一併居此供各模組共用。
import { createElements } from "../app/elements.js";
import { loadLocalState } from "../state/game-state.js";
import { defaultProfileColorFor, normalizeBackgroundPattern } from "../data/game-data.js";

export const elements = createElements();

const state = loadLocalState();

export const session = {
  // ── 帳號進度（單一遊玩狀態樹；切帳號／匯入／重置時整棵替換） ──
  state,

  // ── 場景（ADV）流程 ──
  activeHotspot: null,
  activeLesson: null,
  activeLessonMode: "job",   // issue #135：本次題目所屬互動模式 "job"（打工→coins）/"chat"（聊天→心情＋延長時間）
  advMode: "closed",
  advChineseUsed: false,     // issue #73：本題是否按過中文撥放（按過＝該題無獎勵）
  advWrongAttempts: 0,       // issue #73：本題答錯次數（0→全額、1→半額、≥2→無）
  activeOpeningZh: "",       // issue #73：本題題目（advLine）的中文，無則空字串
  // issue #164：本次場景造訪已播歡迎詞之 hotspot id。同一造訪內返回第一層場景選單不重播歡迎詞，
  // 離場（closeAdv／openArea 場景切換）清空，使下次造訪重新播放一次。為暫態、不持久化存檔。
  sceneVisitWelcomeId: "",
  princessExpression: "normal",
  npcExpression: "normal",
  advFocusIndex: 0,
  advFocusTimer: 0,

  // ── 商店／衣櫃 ──
  shopCategory: "outfit",
  activeShopHotspot: null,
  wardrobeCategory: "outfit",
  shopPreviewItemId: "",
  // 商店多件同時試穿：累加試穿中的商品 id（沿用同一個試穿娃娃，依各自部位疊穿）。
  shopTryOnIds: [],
  // issue #272：面板目前聚焦的單品（商店或衣櫃），用以驅動公主右上角「調整」浮動按鈕。
  panelFocusItem: null,

  // ── 地圖 ──
  mapGesture: null,
  pendingMapPositionFrame: 0,
  pendingMapRefreshArea: "",
  activeCastleHotspot: null,
  activeWorldDestinationId: "castle",
  // issue #99：世界地圖「點選地點 → 公主走到再進入」進行中的目的地與計時器（null＝未在移動）。
  worldTravelTargetId: null,
  worldTravelTimer: null,

  // ── 系統選單 ──
  systemMenuPanel: "diary",

  // ── 選角／帳號選擇 ──
  pendingCharacterId: state.activeCharacterId,
  pendingProfileColor: state.profileColor || defaultProfileColorFor(state.activeCharacterId),
  // issue #131：選角流程進行中的背景花紋（per-account 視覺主題，spec#6）。
  pendingBackgroundPattern: normalizeBackgroundPattern(state.backgroundPattern),
  playerNameEdited: false,
  profileColorEdited: false,
  accountSelectMustChoose: false,
  pendingNewAccount: null,
  accountStatusTimer: null,

  // ── 遊玩時鐘／護眼休息 ──
  testClockOffset: 0,   // 測試用合成時鐘偏移（ms）；正式遊玩恆為 0，由 selftest hook 注入。
  serverClockOffsetMs: 0, // issue #309（spec#24）：伺服器時間校時偏移（serverTime - Date.now()），由 cloud-sync 於每次 API 回應更新。
  playClockTimer: 0,    // setInterval id（0 = 未啟動）
  playBreakShown: false // 結算／休息 overlay 是否顯示中
};
