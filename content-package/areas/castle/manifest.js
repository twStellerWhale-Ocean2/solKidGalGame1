//#region 匯入共用工具
// 將題庫清單轉成遊戲執行時需要的 lessons（課程資料）與 quest templates（任務模板）。
import { makeLessons, makeQuestTemplates } from "../_shared/lesson-helpers.js";
//#endregion 匯入共用工具

//#region 素材路徑工具
// 所有本地區圖片路徑集中在這裡；換素材或快取版本參數時優先改這段。
const npcImage = (name) => `content-package/areas/castle/assets/characters/${name}.webp?v=20260606-character-scale-r1`;
const sceneVersion = "20260606-issue66-adv-scenes-r1";
const sceneArt = (src, options = {}) => ({ sceneArt: { src, tone: "castle", ...options } });
const castleSceneArt = (name, options = {}) => sceneArt(`content-package/areas/castle/assets/scenes/${name}-1024.webp?v=${sceneVersion}`, options);
const castleShopArt = (name) => castleSceneArt(name, { tone: "shop" });
const gardenArt = sceneArt(`content-package/areas/urban/assets/scenes/garden-1024.webp?v=${sceneVersion}`, { tone: "urban" });
const princessRoomArt = castleSceneArt("bedroom", { tone: "room" });
//#endregion 素材路徑工具

//#region 英文等級與獎勵設定
// 定義本地區使用的英文程度、顯示名稱與答題獎勵。
export const castleVocabularyProfile = Object.freeze({
  id: "dolch-220",
  label: "Dolch Sight Words",
  levelLabel: "Dolch Sight Words 220",
  rewardCoins: 20,
  note: "Castle rooms use short sight-word sentences for the earliest readers."
});
//#endregion 英文等級與獎勵設定

//#region 題庫資料
// reward 是每題完成後給玩家的固定獎勵。
const reward = { coins: 20, vocab: 1, expression: 1 };

// q() 是題目簡寫輔助函式，避免每題重複寫完整物件。
const q = (prompt, answer, choices, words, questionType = "sentence-choice") => ({ prompt, answer, choices, words, questionType, reward });

// lessonPlaces 是本地區所有可練習地點與題目清單。
const castleLessonPlaces = [
  {
    id: "kingHall",
    theme: "royal hall",
    title: "Help in the King's Hall",
    opening: "The king smiles. A small job is here.",
    ending: "Good work. The hall is bright.",
    questions: [
      q("Pick the sentence for the king.", "The king is here.", ["The king is here.", "The fish is here.", "We go down.", "It is red."], ["the", "is", "here", "king"]),
      q("Pick what Lumi can see.", "I see the crown.", ["I see the crown.", "I eat the crown.", "Go to sleep.", "The cow can run."], ["I", "see", "the", "crown"]),
      q("Pick the polite help sentence.", "Can I help?", ["Can I help?", "Can I jump?", "I am away.", "They are blue."], ["can", "I", "help"]),
      q("Pick the sentence about the hall.", "This hall is big.", ["This hall is big.", "This hall is wet.", "My hat can swim.", "She has a fish."], ["this", "is", "big", "hall"]),
      q("Pick the happy sentence.", "We can go now.", ["We can go now.", "We can eat now.", "They are not here.", "Look at my shoe."], ["we", "can", "go", "now"])
    ]
  },
  {
    id: "queenStudy",
    theme: "study room",
    title: "Help in the Queen's Study",
    opening: "The queen has a book and a note.",
    ending: "The study is neat now.",
    questions: [
      q("Pick the sentence about the book.", "I have a book.", ["I have a book.", "I have a cow.", "You run fast.", "It is under me."], ["I", "have", "a", "book"]),
      q("Pick what the queen can do.", "She can read.", ["She can read.", "She can fly.", "He can jump.", "We see red."], ["she", "can", "read"]),
      q("Pick the sentence about the desk.", "The desk is clean.", ["The desk is clean.", "The desk is blue.", "A dog is clean.", "I go up."], ["the", "is", "clean", "desk"]),
      q("Pick the kind sentence.", "This is for you.", ["This is for you.", "This is away.", "They came fast.", "I am under it."], ["this", "is", "for", "you"]),
      q("Pick the sentence about flowers.", "I see pretty flowers.", ["I see pretty flowers.", "I eat pretty flowers.", "The shoe is pretty.", "Go by the tree."], ["I", "see", "pretty", "flowers"])
    ]
  },
  {
    id: "castleKitchen",
    theme: "kitchen",
    title: "Help in the Castle Kitchen",
    opening: "The cook needs a short English word.",
    ending: "The warm soup is ready.",
    questions: [
      q("Pick the sentence about soup.", "The soup is hot.", ["The soup is hot.", "The soup is little.", "The tree is hot.", "I see a king."], ["the", "is", "hot", "soup"]),
      q("Pick what Lumi wants.", "I want some bread.", ["I want some bread.", "I want some rain.", "You want my shoe.", "They go away."], ["I", "want", "some", "bread"]),
      q("Pick the sentence about water.", "Please get water.", ["Please get water.", "Please get a crown.", "Water can read.", "She is not here."], ["please", "get", "water"]),
      q("Pick the sentence about the table.", "Put it on the table.", ["Put it on the table.", "Put it in the sky.", "I am the table.", "We came down."], ["put", "it", "on", "the", "table"]),
      q("Pick the safe kitchen sentence.", "Do not run.", ["Do not run.", "Do not read.", "The cow is hot.", "My book can run."], ["do", "not", "run"])
    ]
  },
  {
    id: "knightsRoom",
    theme: "knights room",
    title: "Help in the Knights' Room",
    opening: "The knight waves from the practice room.",
    ending: "The practice room is safe.",
    questions: [
      q("Pick the sentence about the knight.", "He can help.", ["He can help.", "He can sleep.", "She can eat.", "It is yellow."], ["he", "can", "help"]),
      q("Pick the sentence about the shield.", "The shield is round.", ["The shield is round.", "The shield is wet.", "My fish is round.", "We like soup."], ["the", "is", "round", "shield"]),
      q("Pick the action sentence.", "Stand by me.", ["Stand by me.", "Run by me.", "Eat by me.", "Read by me."], ["stand", "by", "me"]),
      q("Pick the sentence about a flag.", "Look at the flag.", ["Look at the flag.", "Look at the soup.", "The flag can eat.", "I am not big."], ["look", "at", "the", "flag"]),
      q("Pick the kind sentence.", "We are ready.", ["We are ready.", "We are little.", "They are under.", "You see bread."], ["we", "are", "ready"])
    ]
  },
  {
    id: "maidsRoom",
    theme: "maids room",
    title: "Help in the Maid's Room",
    opening: "The maid is folding clean cloth.",
    ending: "The room is tidy now.",
    questions: [
      q("Pick the sentence about the room.", "The room is clean.", ["The room is clean.", "The room is red.", "The fish is clean.", "I go out."], ["the", "is", "clean", "room"]),
      q("Pick the sentence about cloth.", "This cloth is white.", ["This cloth is white.", "This cloth can jump.", "The king is white.", "We eat it."], ["this", "is", "white", "cloth"]),
      q("Pick what Lumi can do.", "I can fold it.", ["I can fold it.", "I can fly it.", "You can eat it.", "She can run it."], ["I", "can", "fold", "it"]),
      q("Pick the sentence about a basket.", "Put it in the basket.", ["Put it in the basket.", "Put it in the sea.", "The basket is hot.", "My basket can read."], ["put", "it", "in", "the", "basket"]),
      q("Pick the thank-you sentence.", "Thank you for help.", ["Thank you for help.", "Thank you for fish.", "They are not you.", "Go up and away."], ["thank", "you", "for", "help"])
    ]
  }
];
//#endregion 題庫資料

//#region 地圖與地點設定
// area 是地圖的主設定；新增地圖圖示或改座標主要看 nodes 與 locations。
export const castleArea = Object.freeze({
  id: "castle",
  label: "Castle",
  view: "home",
  mapImage: "content-package/areas/castle/assets/map-1536.webp?v=20260606-issue66-map-contract-r1",
  imageSize: { width: 1536, height: 1536 },
  vocabularyProfile: castleVocabularyProfile,
  // nodes 控制地圖上的路網與圖示座標；x / y 是相對地圖寬高的百分比。
  nodes: {
    princessRoom: { id: "princessRoom", label: "Princess Room", x: 50.8, y: 56.0, links: ["kingHall", "queenStudy", "castleKitchen", "knightsRoom", "maidsRoom", "royalCloakRoom", "castleSeamstress", "castleGate"] },
    kingHall: { id: "kingHall", label: "King's Hall", x: 50.8, y: 35.8, links: ["princessRoom", "queenStudy", "knightsRoom", "royalCloakRoom"] },
    queenStudy: { id: "queenStudy", label: "Queen's Study", x: 35.8, y: 50.8, links: ["princessRoom", "kingHall", "maidsRoom", "castleSeamstress"] },
    castleKitchen: { id: "castleKitchen", label: "Kitchen", x: 68.4, y: 59.2, links: ["princessRoom", "maidsRoom", "royalCloakRoom"] },
    knightsRoom: { id: "knightsRoom", label: "Knights' Room", x: 72.3, y: 43.6, links: ["kingHall", "princessRoom", "royalCloakRoom"] },
    maidsRoom: { id: "maidsRoom", label: "Maid's Room", x: 35.2, y: 67.7, links: ["queenStudy", "castleKitchen", "princessRoom", "castleSeamstress"] },
    royalCloakRoom: { id: "royalCloakRoom", label: "Royal Cloak Room", x: 76.2, y: 71.0, links: ["princessRoom", "kingHall", "knightsRoom", "castleKitchen"] },
    castleSeamstress: { id: "castleSeamstress", label: "Castle Seamstress", x: 28.0, y: 81.4, links: ["princessRoom", "queenStudy", "maidsRoom"] },
    castleGate: { id: "castleGate", label: "Castle Gate", x: 50.5, y: 85.3, links: ["princessRoom"] }
  },
  // locations 控制地圖圖示進入後的場景、NPC、商店與提示文字。
  locations: [
    { id: "princessRoom", area: "castle", node: "princessRoom", label: "Princess Room", icon: "🚪", npcClass: "npc-none", npc: "Lumi", scene: "scene-princess-room", kind: "room", hint: "Enter Lumi's room for hair, clothes, outerwear, shoes, and accessories." },
    { id: "kingHall", area: "castle", node: "kingHall", label: "King's Hall", icon: "👑", npc: "King Rowan", scene: "scene-castle-king-hall", npcImage: npcImage("king-rowan"), hint: "King Rowan needs very short English words in the hall." },
    { id: "queenStudy", area: "castle", node: "queenStudy", label: "Queen's Study", icon: "📖", npc: "Queen Mira", scene: "scene-castle-queen-study", npcImage: npcImage("queen-mira"), hint: "Queen Mira is reading in her quiet study." },
    { id: "castleKitchen", area: "castle", node: "castleKitchen", label: "Kitchen", icon: "🍲", npc: "Cook Panna", scene: "scene-castle-kitchen", npcImage: npcImage("cook-panna"), hint: "Cook Panna is making warm soup in the kitchen." },
    { id: "knightsRoom", area: "castle", node: "knightsRoom", label: "Knights' Room", icon: "🛡", npc: "Knight Theo", scene: "scene-castle-knights-room", npcImage: npcImage("knight-theo"), hint: "Knight Theo practices safe, kind words." },
    { id: "maidsRoom", area: "castle", node: "maidsRoom", label: "Maid's Room", icon: "🧺", npc: "Maid Lala", scene: "scene-castle-maids-room", npcImage: npcImage("maid-lala"), hint: "Maid Lala keeps the linens clean and tidy." },
    { id: "royalCloakRoom", area: "castle", node: "royalCloakRoom", label: "Royal Cloak Room", icon: "🧥", npc: "Cloak Keeper", scene: "scene-castle-royal-cloak-room", npcImage: npcImage("royal-cloak-keeper"), kind: "shop", shopCategories: ["outerwear", "hats"], defaultCategory: "outerwear", hint: "The Royal Cloak Room sells outerwear and hats for castle rewards." },
    { id: "castleSeamstress", area: "castle", node: "castleSeamstress", label: "Castle Seamstress", icon: "👚", npc: "Seamstress Bea", scene: "scene-castle-seamstress", npcImage: npcImage("castle-seamstress"), kind: "shop", shopCategories: ["tops", "bottoms"], defaultCategory: "tops", hint: "The Castle Seamstress sells tops and bottoms only." },
    { id: "castleGate", area: "castle", node: "castleGate", label: "Castle Gate", icon: "🏰", npcClass: "npc-garden", npc: "Gate Guard", scene: "scene-garden", kind: "gate", markerStyle: "portal", portalId: "castleGate", hint: "Go out to the kingdom world map." }
  ],
  defaultNode: "princessRoom",
  enabled: true
});
//#endregion 地圖與地點設定

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
export const castleSceneConfigs = Object.freeze({
  princessRoom: { ...princessRoomArt, scene: "scene-princess-room", npcClass: "npc-none", npc: "Lumi", travelAction: "Enter", travelLine: "Lumi's room is ready for hair, clothes, outerwear, shoes, and accessories." },
  kingHall: { ...castleSceneArt("king-hall"), scene: "scene-castle-king-hall", npc: "King Rowan", npcImage: npcImage("king-rowan"), npcNaturalHeightCm: 178, travelAction: "Visit", travelLine: "King Rowan is waiting in the bright royal hall." },
  queenStudy: { ...castleSceneArt("queen-study"), scene: "scene-castle-queen-study", npc: "Queen Mira", npcImage: npcImage("queen-mira"), npcNaturalHeightCm: 165, travelAction: "Visit", travelLine: "Queen Mira has opened her study book." },
  castleKitchen: { ...castleSceneArt("castle-kitchen"), scene: "scene-castle-kitchen", npc: "Cook Panna", npcImage: npcImage("cook-panna"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Cook Panna stirs warm soup for the castle." },
  knightsRoom: { ...castleSceneArt("knights-room"), scene: "scene-castle-knights-room", npc: "Knight Theo", npcImage: npcImage("knight-theo"), npcNaturalHeightCm: 182, travelAction: "Visit", travelLine: "Knight Theo is checking the shields." },
  maidsRoom: { ...castleSceneArt("maids-room"), scene: "scene-castle-maids-room", npc: "Maid Lala", npcImage: npcImage("maid-lala"), npcNaturalHeightCm: 158, travelAction: "Visit", travelLine: "Maid Lala is folding soft white cloth." },
  royalCloakRoom: { ...castleShopArt("royal-cloak-room"), scene: "scene-castle-royal-cloak-room", npc: "Cloak Keeper", npcImage: npcImage("royal-cloak-keeper"), npcNaturalHeightCm: 170, travelAction: "Shop", travelLine: "The Cloak Keeper has royal outerwear and hats.", shopGreeting: "Welcome to the Royal Cloak Room. Pick outerwear or hats." },
  castleSeamstress: { ...castleShopArt("castle-seamstress"), scene: "scene-castle-seamstress", npc: "Seamstress Bea", npcImage: npcImage("castle-seamstress"), npcNaturalHeightCm: 158, travelAction: "Shop", travelLine: "Seamstress Bea has castle tops and bottoms ready.", shopGreeting: "Welcome to the Castle Seamstress. Pick tops or bottoms." },
  castleGate: { ...gardenArt, scene: "scene-garden", npcClass: "npc-garden", npc: "Gate Guard", travelAction: "World Map", travelLine: "The castle gate opens the kingdom world map." }
});
//#endregion 對話場景設定

//#region 衍生匯出
// 由題庫資料統一產生給 game-engine/data/game-data.js 匯總使用的資料註冊表。
export const castleQuestTemplates = makeQuestTemplates(castleLessonPlaces);
export const castleLessons = makeLessons("castle", castleVocabularyProfile, castleLessonPlaces);
//#endregion 衍生匯出
