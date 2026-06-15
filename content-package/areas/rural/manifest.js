//#region 匯入共用工具
// 將題庫清單轉成遊戲執行時需要的 lessons（課程資料）與 quest templates（任務模板）。
import { makeLessons, makeQuestTemplates, mergeLessons } from "../_shared/lesson-helpers.js";
//#endregion 匯入共用工具

//#region 素材路徑工具
// 所有本地區圖片路徑集中在這裡；換素材或快取版本參數時優先改這段。
const npcImage = (name) => `content-package/areas/rural/assets/characters/${name}.webp?v=20260606-character-scale-r1`;
const sceneVersion = "20260606-issue66-adv-scenes-r1";
const sceneArt = (src, options = {}) => ({ sceneArt: { src, tone: "rural", ...options } });
const ruralSceneArt = (name, options = {}) => sceneArt(`content-package/areas/rural/assets/scenes/${name}-1024.webp?v=${sceneVersion}`, options);
const ruralProductionArt = (name) => ruralSceneArt(`rural-${name}`);
const ruralShopArt = (name) => ruralSceneArt(name, { tone: "shop" });
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
const reward = { coins: 500 };

// q() 是題目簡寫輔助函式，避免每題重複寫完整物件。
const q = (prompt, answer, choices, words, questionType = "sentence-choice") => ({ prompt, answer, choices, words, questionType, reward });

// 中文協助對照（issue #73）：產生器以參數英文字查表得中文，組出 promptZh／choicesZh；缺項回退。
const ruralZh = {
  cart: "推車", log: "木頭", net: "漁網", sheep: "羊", field: "田地", sack: "袋子", basket: "籃子",
  mine: "礦坑", camp: "營地", shore: "海邊", pasture: "牧場", farm: "農場", mill: "磨坊", home: "家",
  miner: "礦工", logger: "伐木工", fisher: "漁夫", farmer: "農夫", miller: "磨坊主", grandma: "奶奶",
  stones: "石頭", wood: "木材", fish: "魚", hay: "乾草", vegetables: "蔬菜", flour: "麵粉", fruit: "水果",
  "sort stones": "分類石頭", "stack wood": "堆木材", "pull the net": "拉漁網", "feed the animals": "餵動物", "water the field": "澆田", "carry flour": "搬麵粉", "tidy the porch": "整理門廊",
  rocky: "多石", quiet: "安靜", windy: "有風", green: "翠綠", sunny: "晴朗", warm: "溫暖",
  "Miner Gemma checks the sparkling mine carts.": "礦工 Gemma 檢查閃亮的礦車。",
  "Logger Rowan stacks clean wood beside the cabin.": "伐木工 Rowan 在小木屋旁堆放乾淨的木材。",
  "Fisher Nami pulls a net near the shore.": "漁夫 Nami 在海邊拉起漁網。",
  "Farmer Theo counts sheep and cows.": "農夫 Theo 數著羊和牛。",
  "Auntie Pom waters the vegetables.": "Pom 阿姨為蔬菜澆水。",
  "Miller Bell carries flour sacks by the windmill.": "磨坊主 Bell 在風車旁搬運麵粉袋。",
  "Grandma Fina sets a basket on the porch.": "Fina 奶奶把籃子放在門廊上。"
};
const tz = (w) => ruralZh[w] || w;

// moversQuestions() 用同一組題型產生 Rural 各生產地點的練習題（含中文協助）。
const moversQuestions = ({ object, place, worker, material, action, adjective }) => [
  { ...q(`Pick the best sentence for the ${place}.`, `The ${worker} is carrying ${material}.`, [`The ${worker} is carrying ${material}.`, `The ${worker} is carrying clouds.`, `The castle is carrying ${material}.`, `The river is reading a book.`], ["carrying", material, worker]),
    promptZh: `選出最適合${tz(place)}的句子。`, choicesZh: [`${tz(worker)}正在搬運${tz(material)}。`, `${tz(worker)}正在搬運雲朵。`, `城堡正在搬運${tz(material)}。`, `河流在讀一本書。`] },
  { ...q(`Pick the sentence about the ${object}.`, `The ${object} is ready before lunch.`, [`The ${object} is ready before lunch.`, `The ${object} is sleeping under lunch.`, `The ${object} can wear a ribbon.`, `The ${object} is afraid of bread.`], [object, "ready", "before", "lunch"]),
    promptZh: `選出關於${tz(object)}的句子。`, choicesZh: [`${tz(object)}在午餐前準備好了。`, `${tz(object)}睡在午餐底下。`, `${tz(object)}會戴緞帶。`, `${tz(object)}害怕麵包。`] },
  { ...q(`Pick what Lumi asks politely.`, `Could I help you ${action}?`, [`Could I help you ${action}?`, `Could I eat your road?`, `Could the ${object} fly home?`, `Could you put soup in the map?`], ["could", "help", action]),
    promptZh: `選出 Lumi 有禮貌的問法。`, choicesZh: [`我可以幫你${tz(action)}嗎？`, `我可以吃你的路嗎？`, `${tz(object)}可以飛回家嗎？`, `你可以把湯放進地圖裡嗎？`] },
  { ...q(`Pick the useful description.`, `This ${place} is ${adjective} and busy.`, [`This ${place} is ${adjective} and busy.`, `This ${place} is sleepy and wet inside.`, `My shoe is ${adjective} and busy.`, `The moon works at the ${place}.`], ["this", place, adjective, "busy"]),
    promptZh: `選出有用的描述。`, choicesZh: [`這個${tz(place)}${tz(adjective)}又忙碌。`, `這個${tz(place)}裡面又想睡又濕。`, `我的鞋子${tz(adjective)}又忙碌。`, `月亮在這個${tz(place)}工作。`] },
  { ...q(`Pick the safe work sentence.`, `We should work slowly and carefully.`, ["We should work slowly and carefully.", "We should run quickly with tools.", `We should hide the ${material}.`, "We should shout at the animals."], ["should", "work", "slowly", "carefully"]),
    promptZh: `選出安全工作的句子。`, choicesZh: ["我們應該慢慢地、小心地工作。", "我們應該帶著工具快快跑。", `我們應該把${tz(material)}藏起來。`, "我們應該對動物大叫。"] }
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
  mapImage: "content-package/areas/rural/assets/map-1536.webp?v=20260606-issue66-map-contract-r1",
  imageSize: { width: 1536, height: 1536 },
  vocabularyProfile: ruralVocabularyProfile,
  // nodes 控制地圖上的路網與圖示座標；x / y 是相對地圖寬高的百分比。
  nodes: {
    ruralEntrance: { id: "ruralEntrance", label: "World Road", x: 9.1, y: 81.8, links: ["pasture", "farm"] },
    mine: { id: "mine", label: "Mine", x: 78.8, y: 20.2, links: ["loggingCamp", "fishingShore", "ruralEntrance"] },
    loggingCamp: { id: "loggingCamp", label: "Logging Camp", x: 83.6, y: 56.0, links: ["mine", "fishingShore", "mill", "fieldCobbler"] },
    fishingShore: { id: "fishingShore", label: "Fishing Shore", x: 81.4, y: 85.9, links: ["loggingCamp", "farm", "mine", "fieldCobbler"] },
    pasture: { id: "pasture", label: "Pasture", x: 65.8, y: 41.0, links: ["ruralEntrance", "farm", "mill", "workwearStall"] },
    farm: { id: "farm", label: "Farm", x: 46.9, y: 69.7, links: ["pasture", "mill", "villageHome", "fishingShore", "workwearStall"] },
    mill: { id: "mill", label: "Mill", x: 22.1, y: 67.7, links: ["farm", "pasture", "loggingCamp", "villageHome", "workwearStall"] },
    workwearStall: { id: "workwearStall", label: "Workwear Stall", x: 37.1, y: 57.9, links: ["pasture", "farm", "mill"] },
    fieldCobbler: { id: "fieldCobbler", label: "Field Cobbler", x: 65.1, y: 87.2, links: ["fishingShore", "loggingCamp", "mine"] },
    villageHome: { id: "villageHome", label: "Village Home", x: 26.7, y: 87.9, links: ["farm", "mill"] }
  },
  // locations 控制地圖圖示進入後的場景、NPC、商店與提示文字。
  locations: [
    { id: "ruralExit", area: "rural", node: "ruralEntrance", label: "World Road", icon: "↩", npcClass: "npc-none", npc: "Rural Sign", kind: "gate", markerStyle: "portal", portalId: "entrance", hint: "The road returns to the kingdom world map." },
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
  actors: [],
  defaultNode: "ruralEntrance",
  enabled: true
});
//#endregion 地圖與地點設定

//#region 場景自帶題庫（issue #96）
// ruralLessonBank：以 place 為鍵的手寫固定題庫，每題自帶中文（promptZh／choicesZh）；由 mergeLessons 併入 sceneConfigs 對應條目。
const ruralLessonBank = Object.freeze({
  mine: {
    theme: "mining",
    title: "Help at the Mine",
    opening: "Miner Gemma checks the sparkling mine carts.",
    openingZh: "礦工 Gemma 檢查閃亮的礦車。",
    ending: "The bright stones are sorted safely.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the best sentence for the mine.", promptZh: "選出最適合礦坑的句子。", answer: "The miner is carrying stones.", choices: ["The miner is carrying stones.","The miner is carrying clouds.","The castle is carrying stones.","The river is reading a book."], choicesZh: ["礦工正在搬運石頭。","礦工正在搬運雲朵。","城堡正在搬運石頭。","河流在讀一本書。"], words: ["carrying","stones","miner"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about the cart.", promptZh: "選出關於推車的句子。", answer: "The cart is ready before lunch.", choices: ["The cart is ready before lunch.","The cart is sleeping under lunch.","The cart can wear a ribbon.","The cart is afraid of bread."], choicesZh: ["推車在午餐前準備好了。","推車睡在午餐底下。","推車會戴緞帶。","推車害怕麵包。"], words: ["cart","ready","before","lunch"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi asks politely.", promptZh: "選出 Lumi 有禮貌的問法。", answer: "Could I help you sort stones?", choices: ["Could I help you sort stones?","Could I eat your road?","Could the cart fly home?","Could you put soup in the map?"], choicesZh: ["我可以幫你分類石頭嗎？","我可以吃你的路嗎？","推車可以飛回家嗎？","你可以把湯放進地圖裡嗎？"], words: ["could","help","sort stones"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the useful description.", promptZh: "選出有用的描述。", answer: "This mine is rocky and busy.", choices: ["This mine is rocky and busy.","This mine is sleepy and wet inside.","My shoe is rocky and busy.","The moon works at the mine."], choicesZh: ["這個礦坑多石又忙碌。","這個礦坑裡面又想睡又濕。","我的鞋子多石又忙碌。","月亮在這個礦坑工作。"], words: ["this","mine","rocky","busy"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the safe work sentence.", promptZh: "選出安全工作的句子。", answer: "We should work slowly and carefully.", choices: ["We should work slowly and carefully.","We should run quickly with tools.","We should hide the stones.","We should shout at the animals."], choicesZh: ["我們應該慢慢地、小心地工作。","我們應該帶著工具快快跑。","我們應該把石頭藏起來。","我們應該對動物大叫。"], words: ["should","work","slowly","carefully"], reward: { coins: 500 } }
    ]
  },
  loggingCamp: {
    theme: "logging",
    title: "Help at the Logging Camp",
    opening: "Logger Rowan stacks clean wood beside the cabin.",
    openingZh: "伐木工 Rowan 在小木屋旁堆放乾淨的木材。",
    ending: "The logs are stacked neatly.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the best sentence for the camp.", promptZh: "選出最適合營地的句子。", answer: "The logger is carrying wood.", choices: ["The logger is carrying wood.","The logger is carrying clouds.","The castle is carrying wood.","The river is reading a book."], choicesZh: ["伐木工正在搬運木材。","伐木工正在搬運雲朵。","城堡正在搬運木材。","河流在讀一本書。"], words: ["carrying","wood","logger"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about the log.", promptZh: "選出關於木頭的句子。", answer: "The log is ready before lunch.", choices: ["The log is ready before lunch.","The log is sleeping under lunch.","The log can wear a ribbon.","The log is afraid of bread."], choicesZh: ["木頭在午餐前準備好了。","木頭睡在午餐底下。","木頭會戴緞帶。","木頭害怕麵包。"], words: ["log","ready","before","lunch"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi asks politely.", promptZh: "選出 Lumi 有禮貌的問法。", answer: "Could I help you stack wood?", choices: ["Could I help you stack wood?","Could I eat your road?","Could the log fly home?","Could you put soup in the map?"], choicesZh: ["我可以幫你堆木材嗎？","我可以吃你的路嗎？","木頭可以飛回家嗎？","你可以把湯放進地圖裡嗎？"], words: ["could","help","stack wood"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the useful description.", promptZh: "選出有用的描述。", answer: "This camp is quiet and busy.", choices: ["This camp is quiet and busy.","This camp is sleepy and wet inside.","My shoe is quiet and busy.","The moon works at the camp."], choicesZh: ["這個營地安靜又忙碌。","這個營地裡面又想睡又濕。","我的鞋子安靜又忙碌。","月亮在這個營地工作。"], words: ["this","camp","quiet","busy"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the safe work sentence.", promptZh: "選出安全工作的句子。", answer: "We should work slowly and carefully.", choices: ["We should work slowly and carefully.","We should run quickly with tools.","We should hide the wood.","We should shout at the animals."], choicesZh: ["我們應該慢慢地、小心地工作。","我們應該帶著工具快快跑。","我們應該把木材藏起來。","我們應該對動物大叫。"], words: ["should","work","slowly","carefully"], reward: { coins: 500 } }
    ]
  },
  fishingShore: {
    theme: "fishing",
    title: "Help at the Fishing Shore",
    opening: "Fisher Nami pulls a net near the shore.",
    openingZh: "漁夫 Nami 在海邊拉起漁網。",
    ending: "The small fish are counted carefully.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the best sentence for the shore.", promptZh: "選出最適合海邊的句子。", answer: "The fisher is carrying fish.", choices: ["The fisher is carrying fish.","The fisher is carrying clouds.","The castle is carrying fish.","The river is reading a book."], choicesZh: ["漁夫正在搬運魚。","漁夫正在搬運雲朵。","城堡正在搬運魚。","河流在讀一本書。"], words: ["carrying","fish","fisher"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about the net.", promptZh: "選出關於漁網的句子。", answer: "The net is ready before lunch.", choices: ["The net is ready before lunch.","The net is sleeping under lunch.","The net can wear a ribbon.","The net is afraid of bread."], choicesZh: ["漁網在午餐前準備好了。","漁網睡在午餐底下。","漁網會戴緞帶。","漁網害怕麵包。"], words: ["net","ready","before","lunch"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi asks politely.", promptZh: "選出 Lumi 有禮貌的問法。", answer: "Could I help you pull the net?", choices: ["Could I help you pull the net?","Could I eat your road?","Could the net fly home?","Could you put soup in the map?"], choicesZh: ["我可以幫你拉漁網嗎？","我可以吃你的路嗎？","漁網可以飛回家嗎？","你可以把湯放進地圖裡嗎？"], words: ["could","help","pull the net"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the useful description.", promptZh: "選出有用的描述。", answer: "This shore is windy and busy.", choices: ["This shore is windy and busy.","This shore is sleepy and wet inside.","My shoe is windy and busy.","The moon works at the shore."], choicesZh: ["這個海邊有風又忙碌。","這個海邊裡面又想睡又濕。","我的鞋子有風又忙碌。","月亮在這個海邊工作。"], words: ["this","shore","windy","busy"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the safe work sentence.", promptZh: "選出安全工作的句子。", answer: "We should work slowly and carefully.", choices: ["We should work slowly and carefully.","We should run quickly with tools.","We should hide the fish.","We should shout at the animals."], choicesZh: ["我們應該慢慢地、小心地工作。","我們應該帶著工具快快跑。","我們應該把魚藏起來。","我們應該對動物大叫。"], words: ["should","work","slowly","carefully"], reward: { coins: 500 } }
    ]
  },
  pasture: {
    theme: "pasture",
    title: "Help at the Pasture",
    opening: "Farmer Theo counts sheep and cows.",
    openingZh: "農夫 Theo 數著羊和牛。",
    ending: "The animals are calm in the pasture.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the best sentence for the pasture.", promptZh: "選出最適合牧場的句子。", answer: "The farmer is carrying hay.", choices: ["The farmer is carrying hay.","The farmer is carrying clouds.","The castle is carrying hay.","The river is reading a book."], choicesZh: ["農夫正在搬運乾草。","農夫正在搬運雲朵。","城堡正在搬運乾草。","河流在讀一本書。"], words: ["carrying","hay","farmer"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about the sheep.", promptZh: "選出關於羊的句子。", answer: "The sheep is ready before lunch.", choices: ["The sheep is ready before lunch.","The sheep is sleeping under lunch.","The sheep can wear a ribbon.","The sheep is afraid of bread."], choicesZh: ["羊在午餐前準備好了。","羊睡在午餐底下。","羊會戴緞帶。","羊害怕麵包。"], words: ["sheep","ready","before","lunch"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi asks politely.", promptZh: "選出 Lumi 有禮貌的問法。", answer: "Could I help you feed the animals?", choices: ["Could I help you feed the animals?","Could I eat your road?","Could the sheep fly home?","Could you put soup in the map?"], choicesZh: ["我可以幫你餵動物嗎？","我可以吃你的路嗎？","羊可以飛回家嗎？","你可以把湯放進地圖裡嗎？"], words: ["could","help","feed the animals"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the useful description.", promptZh: "選出有用的描述。", answer: "This pasture is green and busy.", choices: ["This pasture is green and busy.","This pasture is sleepy and wet inside.","My shoe is green and busy.","The moon works at the pasture."], choicesZh: ["這個牧場翠綠又忙碌。","這個牧場裡面又想睡又濕。","我的鞋子翠綠又忙碌。","月亮在這個牧場工作。"], words: ["this","pasture","green","busy"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the safe work sentence.", promptZh: "選出安全工作的句子。", answer: "We should work slowly and carefully.", choices: ["We should work slowly and carefully.","We should run quickly with tools.","We should hide the hay.","We should shout at the animals."], choicesZh: ["我們應該慢慢地、小心地工作。","我們應該帶著工具快快跑。","我們應該把乾草藏起來。","我們應該對動物大叫。"], words: ["should","work","slowly","carefully"], reward: { coins: 500 } }
    ]
  },
  farm: {
    theme: "farm fields",
    title: "Help at the Farm",
    opening: "Auntie Pom waters the vegetables.",
    openingZh: "Pom 阿姨為蔬菜澆水。",
    ending: "The farm rows look healthy.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the best sentence for the farm.", promptZh: "選出最適合農場的句子。", answer: "The farmer is carrying vegetables.", choices: ["The farmer is carrying vegetables.","The farmer is carrying clouds.","The castle is carrying vegetables.","The river is reading a book."], choicesZh: ["農夫正在搬運蔬菜。","農夫正在搬運雲朵。","城堡正在搬運蔬菜。","河流在讀一本書。"], words: ["carrying","vegetables","farmer"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about the field.", promptZh: "選出關於田地的句子。", answer: "The field is ready before lunch.", choices: ["The field is ready before lunch.","The field is sleeping under lunch.","The field can wear a ribbon.","The field is afraid of bread."], choicesZh: ["田地在午餐前準備好了。","田地睡在午餐底下。","田地會戴緞帶。","田地害怕麵包。"], words: ["field","ready","before","lunch"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi asks politely.", promptZh: "選出 Lumi 有禮貌的問法。", answer: "Could I help you water the field?", choices: ["Could I help you water the field?","Could I eat your road?","Could the field fly home?","Could you put soup in the map?"], choicesZh: ["我可以幫你澆田嗎？","我可以吃你的路嗎？","田地可以飛回家嗎？","你可以把湯放進地圖裡嗎？"], words: ["could","help","water the field"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the useful description.", promptZh: "選出有用的描述。", answer: "This farm is sunny and busy.", choices: ["This farm is sunny and busy.","This farm is sleepy and wet inside.","My shoe is sunny and busy.","The moon works at the farm."], choicesZh: ["這個農場晴朗又忙碌。","這個農場裡面又想睡又濕。","我的鞋子晴朗又忙碌。","月亮在這個農場工作。"], words: ["this","farm","sunny","busy"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the safe work sentence.", promptZh: "選出安全工作的句子。", answer: "We should work slowly and carefully.", choices: ["We should work slowly and carefully.","We should run quickly with tools.","We should hide the vegetables.","We should shout at the animals."], choicesZh: ["我們應該慢慢地、小心地工作。","我們應該帶著工具快快跑。","我們應該把蔬菜藏起來。","我們應該對動物大叫。"], words: ["should","work","slowly","carefully"], reward: { coins: 500 } }
    ]
  },
  mill: {
    theme: "windmill",
    title: "Help at the Mill",
    opening: "Miller Bell carries flour sacks by the windmill.",
    openingZh: "磨坊主 Bell 在風車旁搬運麵粉袋。",
    ending: "The flour sacks are ready for bread.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the best sentence for the mill.", promptZh: "選出最適合磨坊的句子。", answer: "The miller is carrying flour.", choices: ["The miller is carrying flour.","The miller is carrying clouds.","The castle is carrying flour.","The river is reading a book."], choicesZh: ["磨坊主正在搬運麵粉。","磨坊主正在搬運雲朵。","城堡正在搬運麵粉。","河流在讀一本書。"], words: ["carrying","flour","miller"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about the sack.", promptZh: "選出關於袋子的句子。", answer: "The sack is ready before lunch.", choices: ["The sack is ready before lunch.","The sack is sleeping under lunch.","The sack can wear a ribbon.","The sack is afraid of bread."], choicesZh: ["袋子在午餐前準備好了。","袋子睡在午餐底下。","袋子會戴緞帶。","袋子害怕麵包。"], words: ["sack","ready","before","lunch"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi asks politely.", promptZh: "選出 Lumi 有禮貌的問法。", answer: "Could I help you carry flour?", choices: ["Could I help you carry flour?","Could I eat your road?","Could the sack fly home?","Could you put soup in the map?"], choicesZh: ["我可以幫你搬麵粉嗎？","我可以吃你的路嗎？","袋子可以飛回家嗎？","你可以把湯放進地圖裡嗎？"], words: ["could","help","carry flour"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the useful description.", promptZh: "選出有用的描述。", answer: "This mill is windy and busy.", choices: ["This mill is windy and busy.","This mill is sleepy and wet inside.","My shoe is windy and busy.","The moon works at the mill."], choicesZh: ["這個磨坊有風又忙碌。","這個磨坊裡面又想睡又濕。","我的鞋子有風又忙碌。","月亮在這個磨坊工作。"], words: ["this","mill","windy","busy"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the safe work sentence.", promptZh: "選出安全工作的句子。", answer: "We should work slowly and carefully.", choices: ["We should work slowly and carefully.","We should run quickly with tools.","We should hide the flour.","We should shout at the animals."], choicesZh: ["我們應該慢慢地、小心地工作。","我們應該帶著工具快快跑。","我們應該把麵粉藏起來。","我們應該對動物大叫。"], words: ["should","work","slowly","carefully"], reward: { coins: 500 } }
    ]
  },
  villageHome: {
    theme: "village home",
    title: "Help at the Village Home",
    opening: "Grandma Fina sets a basket on the porch.",
    openingZh: "Fina 奶奶把籃子放在門廊上。",
    ending: "The home feels warm and tidy.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the best sentence for the home.", promptZh: "選出最適合家的句子。", answer: "The grandma is carrying fruit.", choices: ["The grandma is carrying fruit.","The grandma is carrying clouds.","The castle is carrying fruit.","The river is reading a book."], choicesZh: ["奶奶正在搬運水果。","奶奶正在搬運雲朵。","城堡正在搬運水果。","河流在讀一本書。"], words: ["carrying","fruit","grandma"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about the basket.", promptZh: "選出關於籃子的句子。", answer: "The basket is ready before lunch.", choices: ["The basket is ready before lunch.","The basket is sleeping under lunch.","The basket can wear a ribbon.","The basket is afraid of bread."], choicesZh: ["籃子在午餐前準備好了。","籃子睡在午餐底下。","籃子會戴緞帶。","籃子害怕麵包。"], words: ["basket","ready","before","lunch"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi asks politely.", promptZh: "選出 Lumi 有禮貌的問法。", answer: "Could I help you tidy the porch?", choices: ["Could I help you tidy the porch?","Could I eat your road?","Could the basket fly home?","Could you put soup in the map?"], choicesZh: ["我可以幫你整理門廊嗎？","我可以吃你的路嗎？","籃子可以飛回家嗎？","你可以把湯放進地圖裡嗎？"], words: ["could","help","tidy the porch"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the useful description.", promptZh: "選出有用的描述。", answer: "This home is warm and busy.", choices: ["This home is warm and busy.","This home is sleepy and wet inside.","My shoe is warm and busy.","The moon works at the home."], choicesZh: ["這個家溫暖又忙碌。","這個家裡面又想睡又濕。","我的鞋子溫暖又忙碌。","月亮在這個家工作。"], words: ["this","home","warm","busy"], reward: { coins: 500 } },
      { questionType: "sentence-choice", prompt: "Pick the safe work sentence.", promptZh: "選出安全工作的句子。", answer: "We should work slowly and carefully.", choices: ["We should work slowly and carefully.","We should run quickly with tools.","We should hide the fruit.","We should shout at the animals."], choicesZh: ["我們應該慢慢地、小心地工作。","我們應該帶著工具快快跑。","我們應該把水果藏起來。","我們應該對動物大叫。"], words: ["should","work","slowly","carefully"], reward: { coins: 500 } }
    ]
  },
});
//#endregion 場景自帶題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
export const ruralSceneConfigs = mergeLessons({
  ruralExit: { ...ruralProductionArt("farm"), scene: "scene-rural-farm", npcClass: "npc-none", npc: "Rural Sign", travelAction: "World Map", travelLine: "The road returns to the kingdom world map." },
  mine: { ...ruralProductionArt("mine"), scene: "scene-rural-mine", npc: "Miner Gemma", npcImage: npcImage("miner-gemma"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Miner Gemma is sorting shiny stones." },
  loggingCamp: { ...ruralProductionArt("logging"), scene: "scene-rural-logging", npc: "Logger Rowan", npcImage: npcImage("logger-rowan"), npcNaturalHeightCm: 178, travelAction: "Visit", travelLine: "Logger Rowan stacks logs beside the cabin." },
  fishingShore: { ...ruralProductionArt("fishing"), scene: "scene-rural-fishing", npc: "Fisher Nami", npcImage: npcImage("fisher-nami"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Fisher Nami pulls a net near the bright shore." },
  pasture: { ...ruralProductionArt("pasture"), scene: "scene-rural-pasture", npc: "Farmer Theo", npcImage: npcImage("farmer-theo"), npcNaturalHeightCm: 175, travelAction: "Visit", travelLine: "Farmer Theo counts animals in the pasture." },
  farm: { ...ruralProductionArt("farm"), scene: "scene-rural-farm", npc: "Auntie Pom", npcImage: npcImage("auntie-pom"), npcNaturalHeightCm: 155, travelAction: "Visit", travelLine: "Auntie Pom waters vegetables and wheat." },
  mill: { ...ruralProductionArt("mill"), scene: "scene-rural-mill", npc: "Miller Bell", npcImage: npcImage("miller-bell"), npcNaturalHeightCm: 162, travelAction: "Visit", travelLine: "Miller Bell carries flour by the windmill." },
  workwearStall: { ...ruralShopArt("workwear-stall"), scene: "scene-rural-workwear-stall", npc: "Workwear Keeper", npcImage: npcImage("workwear-stall-keeper"), npcNaturalHeightCm: 168, travelAction: "Shop", travelLine: "The Workwear Keeper has sturdy tops and bottoms.", shopGreeting: "Welcome to the Workwear Stall. Pick tops or bottoms." },
  fieldCobbler: { ...ruralShopArt("field-cobbler"), scene: "scene-rural-field-cobbler", npc: "Field Cobbler", npcImage: npcImage("field-cobbler"), npcNaturalHeightCm: 165, travelAction: "Shop", travelLine: "The Field Cobbler has shoes and hats for country roads.", shopGreeting: "Welcome to the Field Cobbler. Pick shoes or hats." },
  villageHome: { ...ruralProductionArt("home"), scene: "scene-rural-home", npc: "Grandma Fina", npcImage: npcImage("grandma-fina"), npcNaturalHeightCm: 148, travelAction: "Visit", travelLine: "Grandma Fina tidies the warm village porch." }
}, ruralLessonBank);
//#endregion 對話場景設定

//#region 衍生匯出
// 由題庫資料統一產生給 game-engine/data/game-data.js 匯總使用的資料註冊表。
export const ruralQuestTemplates = makeQuestTemplates(ruralLessonPlaces, ruralZh);
export const ruralLessons = makeLessons("rural", ruralVocabularyProfile, ruralLessonPlaces, ruralZh);
//#endregion 衍生匯出
