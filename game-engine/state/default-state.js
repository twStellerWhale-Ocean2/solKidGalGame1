export const defaultState = {
  activeCharacterId: "lumi",
  playerName: "Lumi",
  coins: 100,
  // energy 即「每次遊玩時間預算」的顯示值（0–100%，issue #6 / spec#9）；由 play-clock 依真實時間重算，
  // 不再由答題等 effects 變動。實際倒數時間以 playLimit.sessionEndsAt／restEndsAt 時戳為準。
  energy: 100,
  difficulty: 100,
  speechEnabled: true,
  // 遊玩時間限制與護眼休息（issue #6 / spec#9）。各帳號各自計算（存於各帳號進度）。
  // playMinutes/restMinutes：每次遊玩／休息時長（分鐘，可於設定調整，預設各 10）。
  // sessionEndsAt：本回合遊玩結束時戳（epoch ms，0=尚未開始）。restEndsAt：休息結束時戳（0=非休息中）。
  // cycle：本回合成果統計（用於時間到結算畫面）。
  playLimit: {
    playMinutes: 10,
    restMinutes: 10,
    sessionEndsAt: 0,
    restEndsAt: 0,
    cycle: { coinsAtStart: 0, answered: 0, correct: 0 }
  },
  owned: ["softBrownHair", "starterPajama"],
  outfit: {
    hairstyle: "softBrownHair",
    top: "none",
    bottom: "none",
    dress: "starterPajama",
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
  bundleUnlocks: {},
  purchaseStoreIds: {},
  activeQuest: null,
  area: "castle",
  player: { x: 51.5, y: 50 },
  playerNode: "princessRoom"
};
