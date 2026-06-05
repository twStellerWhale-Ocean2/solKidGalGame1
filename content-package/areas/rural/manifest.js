//#region 匯入共用工具
// 將題庫清單轉成遊戲執行時需要的 lessons（課程資料）與 quest templates（任務模板）。
import { makeLessons, makeQuestTemplates } from "../_shared/lesson-helpers.js";
//#endregion 匯入共用工具

//#region 素材路徑工具
// 所有本地區圖片路徑集中在這裡；換素材或快取版本參數時優先改這段。
const npcImage = (name) => `content-package/areas/rural/assets/characters/${name}.webp?v=20260605-npc-r2`;
const sceneArt = (src, options = {}) => ({ sceneArt: { src, tone: "rural", ...options } });
const ruralAtlasArt = (position) => sceneArt("content-package/areas/rural/assets/scenes/scenes-atlas.webp?v=20260605-webp-assets", {
  atlas: "rural-scenes",
  position,
  size: "700% 100%"
});
const ruralShopArt = (name) => sceneArt(`content-package/areas/rural/assets/scenes/${name}.webp?v=20260604-issues56-60`, { tone: "shop" });
//#endregion 素材路徑工具

//#region 英文等級與獎勵設定
// 定義本地區使用的英文程度、顯示名稱與答題獎勵。
export const ruralVocabularyProfile = Object.freeze({
  id: "cambridge-a1-movers",
  label: "Cambridge A1 Movers",
  levelLabel: "Cambridge Movers",
  rewardCoins: 500,
  note: "Rural production places use practical Movers-style resource words."
});
//#endregion 英文等級與獎勵設定

//#region 題庫資料
// reward 是每題完成後給玩家的固定獎勵。
const reward = { coins: 500, vocab: 2, expression: 2, kindness: 1 };

// q() 是題目簡寫輔助函式，避免每題重複寫完整物件。
const q = (prompt, answer, choices, words, questionType = "sentence-choice") => ({ prompt, answer, choices, words, questionType, reward });

// moversQuestions() 用同一組題型產生 Rural 各生產地點的練習題。
const moversQuestions = ({ object, place, worker, material, action, adjective }) => [
  q(`Pick the best sentence for the ${place}.`, `The ${worker} is carrying ${material}.`, [`The ${worker} is carrying ${material}.`, `The ${worker} is carrying clouds.`, `The castle is carrying ${material}.`, `The river is reading a book.`], ["carrying", material, worker]),
  q(`Pick the sentence about the ${object}.`, `The ${object} is ready before lunch.`, [`The ${object} is ready before lunch.`, `The ${object} is sleeping under lunch.`, `The ${object} can wear a ribbon.`, `The ${object} is afraid of bread.`], [object, "ready", "before", "lunch"]),
  q(`Pick what Lumi asks politely.`, `Could I help you ${action}?`, [`Could I help you ${action}?`, `Could I eat your road?`, `Could the ${object} fly home?`, `Could you put soup in the map?`], ["could", "help", action]),
  q(`Pick the useful description.`, `This ${place} is ${adjective} and busy.`, [`This ${place} is ${adjective} and busy.`, `This ${place} is sleepy and wet inside.`, `My shoe is ${adjective} and busy.`, `The moon works at the ${place}.`], ["this", place, adjective, "busy"]),
  q(`Pick the safe work sentence.`, `We should work slowly and carefully.`, ["We should work slowly and carefully.", "We should run quickly with tools.", `We should hide the ${material}.`, "We should shout at the animals."], ["should", "work", "slowly", "carefully"])
];

// lessonPlaces 是本地區所有可練習地點與題目清單。
const ruralLessonPlaces = [
  { id: "mine", theme: "mining", title: "Help at the Mine", opening: "Miner Gemma checks the sparkling mine carts.", ending: "The bright stones are sorted safely.", questions: moversQuestions({ object: "cart", place: "mine", worker: "miner", material: "stones", action: "sort stones", adjective: "rocky" }) },
  { id: "loggingCamp", theme: "logging", title: "Help at the Logging Camp", opening: "Logger Rowan stacks clean wood beside the cabin.", ending: "The logs are stacked neatly.", questions: moversQuestions({ object: "log", place: "camp", worker: "logger", material: "wood", action: "stack wood", adjective: "quiet" }) },
  { id: "fishingShore", theme: "fishing", title: "Help at the Fishing Shore", opening: "Fisher Nami pulls a net near the shore.", ending: "The small fish are counted carefully.", questions: moversQuestions({ object: "net", place: "shore", worker: "fisher", material: "fish", action: "pull the net", adjective: "windy" }) },
  { id: "pasture", theme: "pasture", title: "Help at the Pasture", opening: "Farmer Theo counts sheep and cows.", ending: "The animals are calm in the pasture.", questions: moversQuestions({ object: "sheep", place: "pasture", worker: "farmer", material: "hay", action: "feed the animals", adjective: "green" }) },
  { id: "farm", theme: "farm fields", title: "Help at the Farm", opening: "Auntie Pom waters the vegetables.", ending: "The farm rows look healthy.", questions: moversQuestions({ object: "field", place: "farm", worker: "farmer", material: "vegetables", action: "water the field", adjective: "sunny" }) },
  { id: "mill", theme: "windmill", title: "Help at the Mill", opening: "Miller Bell carries flour sacks by the windmill.", ending: "The flour sacks are ready for bread.", questions: moversQuestions({ object: "sack", place: "mill", worker: "miller", material: "flour", action: "carry flour", adjective: "windy" }) },
  { id: "villageHome", theme: "village home", title: "Help at the Village Home", opening: "Grandma Fina sets a basket on the porch.", ending: "The home feels warm and tidy.", questions: moversQuestions({ object: "basket", place: "home", worker: "grandma", material: "fruit", action: "tidy the porch", adjective: "warm" }) }
];
//#endregion 題庫資料

//#region 地圖與地點設定
// area 是地圖的主設定；新增地圖圖示或改座標主要看 nodes 與 locations。
export const ruralArea = Object.freeze({
  id: "rural",
  label: "Rural",
  view: "map",
  mapImage: "content-package/areas/rural/assets/map.webp?v=20260605-webp-assets",
  imageSize: { width: 1536, height: 1024 },
  vocabularyProfile: ruralVocabularyProfile,
  // nodes 控制地圖上的路網與圖示座標；x / y 是相對地圖寬高的百分比。
  nodes: {
    ruralEntrance: { id: "ruralEntrance", label: "Urban Road", x: 19, y: 22, links: ["pasture", "farm"] },
    mine: { id: "mine", label: "Mine", x: 77, y: 26, links: ["loggingCamp", "fishingShore", "ruralEntrance"] },
    loggingCamp: { id: "loggingCamp", label: "Logging Camp", x: 76, y: 66, links: ["mine", "fishingShore", "mill", "fieldCobbler"] },
    fishingShore: { id: "fishingShore", label: "Fishing Shore", x: 50, y: 86, links: ["loggingCamp", "farm", "mine", "fieldCobbler"] },
    pasture: { id: "pasture", label: "Pasture", x: 22, y: 28, links: ["ruralEntrance", "farm", "mill", "workwearStall"] },
    farm: { id: "farm", label: "Farm", x: 26, y: 62, links: ["pasture", "mill", "villageHome", "fishingShore", "workwearStall"] },
    mill: { id: "mill", label: "Mill", x: 40, y: 57, links: ["farm", "pasture", "loggingCamp", "villageHome", "workwearStall"] },
    workwearStall: { id: "workwearStall", label: "Workwear Stall", x: 33, y: 44, links: ["pasture", "farm", "mill"] },
    fieldCobbler: { id: "fieldCobbler", label: "Field Cobbler", x: 62, y: 70, links: ["fishingShore", "loggingCamp", "mine"] },
    villageHome: { id: "villageHome", label: "Village Home", x: 19, y: 82, links: ["farm", "mill"] }
  },
  // locations 控制地圖圖示進入後的場景、NPC、商店與提示文字。
  locations: [
    { id: "ruralExit", area: "rural", node: "ruralEntrance", label: "Urban Road", icon: "↩", npcClass: "npc-none", npc: "Rural Sign", kind: "gate", markerStyle: "portal", portalId: "entrance", hint: "The road returns to the urban town." },
    { id: "mine", area: "rural", node: "mine", label: "Mine", icon: "⛏", npc: "Miner Gemma", scene: "scene-rural-mine", npcImage: npcImage("miner-gemma"), hint: "The mine has bright stones and cart tracks." },
    { id: "loggingCamp", area: "rural", node: "loggingCamp", label: "Logging Camp", icon: "🪵", npc: "Logger Rowan", scene: "scene-rural-logging", npcImage: npcImage("logger-rowan"), hint: "The logging camp stacks wood for safe building." },
    { id: "fishingShore", area: "rural", node: "fishingShore", label: "Fishing Shore", icon: "🎣", npc: "Fisher Nami", scene: "scene-rural-fishing", npcImage: npcImage("fisher-nami"), hint: "The shore has nets, boats, and small fish." },
    { id: "pasture", area: "rural", node: "pasture", label: "Pasture", icon: "🐄", npc: "Farmer Theo", scene: "scene-rural-pasture", npcImage: npcImage("farmer-theo"), hint: "The pasture has sheep, cows, and hay." },
    { id: "farm", area: "rural", node: "farm", label: "Farm", icon: "🥕", npc: "Auntie Pom", scene: "scene-rural-farm", npcImage: npcImage("auntie-pom"), hint: "The farm fields grow vegetables and wheat." },
    { id: "mill", area: "rural", node: "mill", label: "Mill", icon: "🌬", npc: "Miller Bell", scene: "scene-rural-mill", npcImage: npcImage("miller-bell"), hint: "The windmill turns grain into flour." },
    { id: "workwearStall", area: "rural", node: "workwearStall", label: "Workwear Stall", icon: "👚", npc: "Workwear Keeper", scene: "scene-rural-workwear-stall", npcImage: npcImage("workwear-stall-keeper"), kind: "shop", shopCategories: ["tops", "bottoms"], defaultCategory: "tops", hint: "The Workwear Stall sells sturdy tops and bottoms." },
    { id: "fieldCobbler", area: "rural", node: "fieldCobbler", label: "Field Cobbler", icon: "👞", npc: "Field Cobbler", scene: "scene-rural-field-cobbler", npcImage: npcImage("field-cobbler"), kind: "shop", shopCategories: ["shoes", "hats"], defaultCategory: "shoes", hint: "The Field Cobbler sells shoes and hats for country roads." },
    { id: "villageHome", area: "rural", node: "villageHome", label: "Village Home", icon: "🏡", npc: "Grandma Fina", scene: "scene-rural-home", npcImage: npcImage("grandma-fina"), hint: "The village home has a warm porch and garden." }
  ],
  // actors 是地圖上的動態環境效果，不是可點擊地點。
  actors: [
    { id: "rural-river-glow", type: "water", x: 50, y: 82, w: 22, h: 12, z: 1, phase: 0.5 },
    { id: "rural-mill-glow", type: "glow", x: 40, y: 57, w: 8, h: 8, z: 2, phase: 1.2 }
  ],
  defaultNode: "ruralEntrance",
  enabled: true
});
//#endregion 地圖與地點設定

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
export const ruralSceneConfigs = Object.freeze({
  ruralExit: { ...ruralAtlasArt("66.666% 50%"), scene: "scene-rural-farm", npcClass: "npc-none", npc: "Rural Sign", travelAction: "Back to Urban", travelLine: "The road returns to the urban town." },
  mine: { ...ruralAtlasArt("0% 50%"), scene: "scene-rural-mine", npc: "Miner Gemma", npcImage: npcImage("miner-gemma"), travelAction: "Visit", travelLine: "Miner Gemma is sorting shiny stones." },
  loggingCamp: { ...ruralAtlasArt("16.666% 50%"), scene: "scene-rural-logging", npc: "Logger Rowan", npcImage: npcImage("logger-rowan"), travelAction: "Visit", travelLine: "Logger Rowan stacks logs beside the cabin." },
  fishingShore: { ...ruralAtlasArt("33.333% 50%"), scene: "scene-rural-fishing", npc: "Fisher Nami", npcImage: npcImage("fisher-nami"), travelAction: "Visit", travelLine: "Fisher Nami pulls a net near the bright shore." },
  pasture: { ...ruralAtlasArt("50% 50%"), scene: "scene-rural-pasture", npc: "Farmer Theo", npcImage: npcImage("farmer-theo"), travelAction: "Visit", travelLine: "Farmer Theo counts animals in the pasture." },
  farm: { ...ruralAtlasArt("66.666% 50%"), scene: "scene-rural-farm", npc: "Auntie Pom", npcImage: npcImage("auntie-pom"), travelAction: "Visit", travelLine: "Auntie Pom waters vegetables and wheat." },
  mill: { ...ruralAtlasArt("83.333% 50%"), scene: "scene-rural-mill", npc: "Miller Bell", npcImage: npcImage("miller-bell"), travelAction: "Visit", travelLine: "Miller Bell carries flour by the windmill." },
  workwearStall: { ...ruralShopArt("workwear-stall"), scene: "scene-rural-workwear-stall", npc: "Workwear Keeper", npcImage: npcImage("workwear-stall-keeper"), travelAction: "Shop", travelLine: "The Workwear Keeper has sturdy tops and bottoms.", shopGreeting: "Welcome to the Workwear Stall. Pick tops or bottoms." },
  fieldCobbler: { ...ruralShopArt("field-cobbler"), scene: "scene-rural-field-cobbler", npc: "Field Cobbler", npcImage: npcImage("field-cobbler"), travelAction: "Shop", travelLine: "The Field Cobbler has shoes and hats for country roads.", shopGreeting: "Welcome to the Field Cobbler. Pick shoes or hats." },
  villageHome: { ...ruralAtlasArt("100% 50%"), scene: "scene-rural-home", npc: "Grandma Fina", npcImage: npcImage("grandma-fina"), travelAction: "Visit", travelLine: "Grandma Fina tidies the warm village porch." }
});
//#endregion 對話場景設定

//#region 衍生匯出
// 由題庫資料統一產生給 game-engine/data/game-data.js 匯總使用的資料註冊表。
export const ruralQuestTemplates = makeQuestTemplates(ruralLessonPlaces);
export const ruralLessons = makeLessons("rural", ruralVocabularyProfile, ruralLessonPlaces);
//#endregion 衍生匯出
