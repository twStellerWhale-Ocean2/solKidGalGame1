import { defaultProfileColorFor } from "../data/game-data.js";

export const defaultState = {
  activeCharacterId: "lumi",
  playerName: "Lumi",
  profileColor: defaultProfileColorFor("lumi"),
  // issue #131：背景花紋（spec#6），與識別色組成公主視覺主題；"none"=無花紋。
  backgroundPattern: "none",
  coins: 100,
  // energy 即「每次遊玩時間預算」的顯示值（0–100%，issue #6 / spec#9）；由 play-clock 依真實時間重算，
  // 不再由答題等 effects 變動。實際倒數時間以 playLimit.sessionEndsAt／restEndsAt 時戳為準。
  energy: 100,
  // mood（spec#11）：生活聊天累積的心情值；答對聊天題 +paramChatMoodReward，並在護眼上限內延長當次可玩時間。
  mood: 0,
  difficulty: 100,
  speechEnabled: true,
  // 遊玩時間限制與護眼休息（issue #6 / spec#9）。各帳號各自計算（存於各帳號進度）。
  // playMinutes/restMinutes：每次遊玩／休息時長（分鐘，可於設定調整，預設各 15）。
  // sessionEndsAt：本回合遊玩結束時戳（epoch ms，0=尚未開始）。restEndsAt：休息結束時戳（0=非休息中）。
  // cycle：本回合成果統計（用於時間到結算畫面）。
  playLimit: {
    playMinutes: 15,
    restMinutes: 15,
    playMaxMinutes: 20,
    sessionEndsAt: 0,
    restEndsAt: 0,
    sessionMaxEndsAt: 0,
    cycle: { coinsAtStart: 0, answered: 0, correct: 0 }
  },
  owned: ["softBrownHair", "yumiStarterHair", "solStarterHair", "rosaStarterHair", "starterPajama", "coralBlouse", "skyShorts"],
  outfit: {
    hairstyle: "none",
    top: "coralBlouse",
    bottom: "skyShorts",
    dress: "none",
    outer: "none",
    shoes: "none",
    headTop: "none",
    headSide: "none",
    faceEyes: "none",
    faceMask: "none",
    neck: "none",
    hand: "none",
    room: "none"
  },
  diary: [],
  completedLessons: [],
  metNpcs: [],
  learnedWords: [],
  badges: [],
  purchaseStoreIds: {},
  activeQuest: null,
  area: "castle",
  player: { x: 51.5, y: 50 },
  playerNode: "princessRoom",
  // 世界地圖上公主頭像的自由走動座標（issue #99）。預設 null：玩家於世界地圖移動或進入地點前，
  // currentPlayerPoint("world") 會退回目前選定目的地座標（依 state.area 推導），移動/進入後才寫入實際座標。
  // 預設 null 亦確保舊存檔（normalizeState 淺合併 defaultState）不會被釘在 castle，而是依其所在地區顯示。
  world: null
};
