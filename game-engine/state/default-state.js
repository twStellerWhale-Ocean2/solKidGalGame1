import { defaultProfileColorFor } from "../data/game-data.js";

// issue #259：起始狀態組態依關注點分離為三具名片段（公主新局／起始位置／遊戲規則），與 #260 管理設定
// 工具三頁籤（公主／地圖／遊戲規則）對齊。defaultState 收斂為三片之唯讀聚合——單一事實來源＝三片，
// 此聚合僅供既有 `import { defaultState }` 沿用、請勿於聚合另增欄位。同檔具名 export、不拆多檔、不另建相容層；
// 起始值與舊存檔相容不變。註：mood 宣告與 normalizeState 之 delete 矛盾另循 #262，本案不動。

// ① 公主新局設定：玩家所選身分、識別主題、起始錢包與擁有物、穿搭，及起始進度初值（新局皆空集合／null）。
export const princessStart = {
  activeCharacterId: "lumi",
  playerName: "Lumi",
  profileColor: defaultProfileColorFor("lumi"),
  // issue #131：背景花紋（spec#6），與識別色組成公主視覺主題；"none"=無花紋。
  backgroundPattern: "none",
  coins: 200,
  // #263 衣物四包重作移除了舊預設 item（twinBraidHair／blueDress/…），改指向 castle 新包之有效物件。
  owned: ["softBrownHair", "yumiStarterHair", "solStarterHair", "rosaStarterHair", "starterPajama", "castleSideCurlPrincessHair", "castleRoyalBlueTrainDress", "castlePearlSatinShoes", "castleSmallCrown"],
  outfit: {
    hairstyle: "castleSideCurlPrincessHair",
    outfit: "castleRoyalBlueTrainDress",
    shoes: "castlePearlSatinShoes",
    headTop: "castleSmallCrown",
    headSide: "none",
    faceEyes: "none",
    faceMask: "none",
    neck: "none",
    hand: "none",
    room: "none"
  },
  // 起始進度初值（新局皆空）。
  diary: [],
  completedLessons: [],
  metNpcs: [],
  learnedWords: [],
  badges: [],
  purchaseStoreIds: {},
  activeQuest: null
};

// ② 起始位置：新局所在地區／地點與世界地圖走動座標。
export const startPosition = {
  area: "castle",
  player: { x: 51.5, y: 50 },
  playerNode: "princessRoom",
  // 世界地圖上公主頭像的自由走動座標（issue #99）。預設 null：玩家於世界地圖移動或進入地點前，
  // currentPlayerPoint("world") 會退回目前選定目的地座標（依 state.area 推導），移動/進入後才寫入實際座標。
  // 預設 null 亦確保舊存檔（normalizeState 淺合併 defaultState）不會被釘在 castle，而是依其所在地區顯示。
  world: null
};

// ③ 遊戲規則與家長：護眼遊玩限制、難度、能量顯示、心情、語音開關（各帳號各自計算、存於各帳號進度）。
export const gameRules = {
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
  }
};

// defaultState：三片之唯讀聚合，供既有 `import { defaultState }` 沿用（freshState 以 JSON 深拷此物件）。
// 鍵集合與各欄位預設值與重構前相同；依關注點分組使列舉順序改變，不影響行為（存取與存檔還原皆以鍵為準）。
export const defaultState = { ...princessStart, ...startPosition, ...gameRules };
