//#region 匯入共用工具
// 將題庫清單轉成遊戲執行時需要的 lessons（課程資料）與 quest templates（任務模板）。
import { mergeLessons } from "../_shared/lesson-helpers.js";
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
  rewardCoins: 50,
  note: "Castle rooms use short sight-word sentences for the earliest readers."
});
//#endregion 英文等級與獎勵設定

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
    princessRoom: { id: "princessRoom", label: "Princess Room", x: 50, y: 48, links: ["kingHall", "queenStudy", "castleKitchen", "knightsRoom", "maidsRoom", "royalCloakRoom", "castleSeamstress", "castleGate"] },
    kingHall: { id: "kingHall", label: "King's Hall", x: 50, y: 24, links: ["princessRoom", "queenStudy", "knightsRoom", "royalCloakRoom"] },
    queenStudy: { id: "queenStudy", label: "Queen's Study", x: 34, y: 33, links: ["princessRoom", "kingHall", "maidsRoom", "castleSeamstress"] },
    castleKitchen: { id: "castleKitchen", label: "Kitchen", x: 65, y: 56, links: ["princessRoom", "maidsRoom", "royalCloakRoom"] },
    knightsRoom: { id: "knightsRoom", label: "Knights' Room", x: 60, y: 78, links: ["kingHall", "princessRoom", "royalCloakRoom"] },
    maidsRoom: { id: "maidsRoom", label: "Maid's Room", x: 36, y: 58, links: ["queenStudy", "castleKitchen", "princessRoom", "castleSeamstress"] },
    royalCloakRoom: { id: "royalCloakRoom", label: "Royal Cloak Room", x: 68, y: 42, links: ["princessRoom", "kingHall", "knightsRoom", "castleKitchen"] },
    castleSeamstress: { id: "castleSeamstress", label: "Castle Seamstress", x: 38, y: 70, links: ["princessRoom", "queenStudy", "maidsRoom"] },
    castleGate: { id: "castleGate", label: "Castle Gate", x: 37, y: 86, links: ["princessRoom"] }
  },
  // locations 控制地圖圖示進入後的場景、NPC、商店與提示文字。
  locations: [
    { id: "princessRoom", area: "castle", node: "princessRoom", label: "Princess Room", icon: "🚪", npcClass: "npc-none", npc: "Lumi", scene: "scene-princess-room", kind: "room", hint: "Enter Lumi's room for hair, clothes, outerwear, shoes, and accessories." },
    { id: "kingHall", area: "castle", node: "kingHall", label: "King's Hall", icon: "👑", npc: "King Rowan", scene: "scene-castle-king-hall", npcImage: npcImage("king-rowan"), hint: "King Rowan has a small royal task in the bright hall."},
    { id: "queenStudy", area: "castle", node: "queenStudy", label: "Queen's Study", icon: "📖", npc: "Queen Mira", scene: "scene-castle-queen-study", npcImage: npcImage("queen-mira"), hint: "Queen Mira is reading in her quiet study." },
    { id: "castleKitchen", area: "castle", node: "castleKitchen", label: "Kitchen", icon: "🍲", npc: "Cook Panna", scene: "scene-castle-kitchen", npcImage: npcImage("cook-panna"), hint: "Cook Panna is making warm soup in the kitchen." },
    { id: "knightsRoom", area: "castle", node: "knightsRoom", label: "Knights' Room", icon: "🛡", npc: "Knight Theo", scene: "scene-castle-knights-room", npcImage: npcImage("knight-theo"), hint: "Knight Theo practices safe, kind words." },
    { id: "maidsRoom", area: "castle", node: "maidsRoom", label: "Maid's Room", icon: "🧺", npc: "Maid Lala", scene: "scene-castle-maids-room", npcImage: npcImage("maid-lala"), hint: "Maid Lala keeps the linens clean and tidy." },
    { id: "royalCloakRoom", area: "castle", node: "royalCloakRoom", label: "Royal Cloak Room", icon: "🧥", npc: "Cloak Keeper", scene: "scene-castle-royal-cloak-room", npcImage: npcImage("royal-cloak-keeper"), shopCategories: ["outerwear", "hats"], defaultCategory: "outerwear", hint: "The Royal Cloak Room sells outerwear and hats for castle rewards." },
    { id: "castleSeamstress", area: "castle", node: "castleSeamstress", label: "Castle Seamstress", icon: "👚", npc: "Seamstress Bea", scene: "scene-castle-seamstress", npcImage: npcImage("castle-seamstress"), shopCategories: ["tops", "bottoms"], defaultCategory: "tops", hint: "The Castle Seamstress sells tops and bottoms only." },
    { id: "castleGate", area: "castle", node: "castleGate", label: "Castle Gate", icon: "🏰", npcClass: "npc-garden", npc: "Gate Guard", scene: "scene-castle-gate", kind: "gate", markerStyle: "portal", portalId: "castleGate", hint: "Go out to the kingdom world map." }
  ],
  defaultNode: "princessRoom",
  enabled: true
});
//#endregion 地圖與地點設定

//#region 場景自帶題庫（issue #96 結構；issue #149 全量改寫：角色第一人稱、prompt 即台詞、選項即公主回應、無 opening/ending）
// castleLessonBank：以 place 為鍵的「打工任務」題庫（答對得 coins＝勞動所得）。
// issue #149：prompt＝場景角色第一人稱對公主之請求／任務；choices＝公主可說出的回應；每場景 3 題、每題 3 選項；words 由引擎自正解導出。
const jobReward = { coins: 50 };
const castleLessonBank = Object.freeze({
  kingHall: {
    title: "Help in the King's Hall",
    questions: [
      { questionType: "sentence-choice", prompt: "Please look at the crown.", promptZh: "請看看王冠。", answer: "I see the crown.", choices: ["I see the crown.","I see the soup.","I see the fish."], choicesZh: ["我看到王冠。","我看到湯。","我看到魚。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Please stand by me.", promptZh: "請站在我旁邊。", answer: "I will stand by you.", choices: ["I will run.","I will stand by you.","I will read the note."], choicesZh: ["我要跑。","我會站在你旁邊。","我要讀便條。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The hall is big. Can we go now?", promptZh: "大廳很大。我們可以走了嗎？", answer: "We can go now.", choices: ["The bread is under the bed.","The cat has a hat.","We can go now."], choicesZh: ["麵包在床底下。","貓有一頂帽子。","我們現在可以走了。"], reward: jobReward }
    ]
  },
  queenStudy: {
    title: "Help in the Queen's Study",
    questions: [
      { questionType: "sentence-choice", prompt: "Please put the book on the desk.", promptZh: "請把書放在書桌上。", answer: "I put the book on the desk.", choices: ["I put the book on the desk.","I put the soup on the bed.","I run in the room."], choicesZh: ["我把書放在書桌上。","我把湯放在床上。","我在房間裡跑。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Please give this note to me.", promptZh: "請把這張便條給我。", answer: "Here is the note.", choices: ["This is my hat.","Here is the note.","The fish is hot."], choicesZh: ["這是我的帽子。","便條在這裡。","魚很熱。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Can you read this page with me?", promptZh: "你可以和我一起讀這一頁嗎？", answer: "Yes, I can read with you.", choices: ["I see six fish.","Do not run.","Yes, I can read with you."], choicesZh: ["我看到六條魚。","不要跑。","好的，我可以和你一起讀。"], reward: jobReward }
    ]
  },
  castleKitchen: {
    title: "Help in the Castle Kitchen",
    questions: [
      { questionType: "sentence-choice", prompt: "Please put the bread on the table.", promptZh: "請把麵包放在餐桌上。", answer: "I put the bread on the table.", choices: ["I put the bread on the table.","I put the crown in the soup.","I see a big hall."], choicesZh: ["我把麵包放在餐桌上。","我把王冠放進湯裡。","我看到大廳很大。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Please get water for lunch.", promptZh: "請幫午餐拿水。", answer: "Here is the water.", choices: ["The towel is white.","Here is the water.","The knight can read."], choicesZh: ["毛巾是白色的。","水在這裡。","騎士會讀書。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The kitchen is busy. Please be safe.", promptZh: "廚房很忙。請注意安全。", answer: "I will not run.", choices: ["I will run fast.","I will put soup on the floor.","I will not run."], choicesZh: ["我會跑很快。","我會把湯放在地上。","我不會跑。"], reward: jobReward }
    ]
  },
  knightsRoom: {
    title: "Help in the Knights' Room",
    questions: [
      { questionType: "sentence-choice", prompt: "Please look at the shield.", promptZh: "請看看盾牌。", answer: "The shield is round.", choices: ["The shield is round.","The bread is cold.","The book is on the desk."], choicesZh: ["盾牌是圓的。","麵包是冷的。","書在書桌上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Please stand by me.", promptZh: "請站在我旁邊。", answer: "I will stand by you.", choices: ["I will stand on the table.","I will stand by you.","I will stand near the door."], choicesZh: ["我會站在餐桌上。","我會站在你旁邊。","我會站在門旁邊。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Please look at the flag.", promptZh: "請看看旗子。", answer: "I see the flag.", choices: ["The towel is in the basket.","The fish is on ice.","I see the flag."], choicesZh: ["毛巾在籃子裡。","魚在冰上。","我看到旗子。"], reward: jobReward }
    ]
  },
  maidsRoom: {
    title: "Help in the Maid's Room",
    questions: [
      { questionType: "sentence-choice", prompt: "Please fold this white cloth.", promptZh: "請折這塊白布。", answer: "I can fold it.", choices: ["I can fold it.","I can hold the cloth.","I can put cloth on the chair."], choicesZh: ["我可以折它。","我可以拿著布。","我可以把布放在椅子上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Please put the cloth in the basket.", promptZh: "請把布放進籃子裡。", answer: "I put it in the basket.", choices: ["I put the crown on the fish.","I put it in the basket.","I run in the room."], choicesZh: ["我把王冠放在魚上。","我把它放進籃子裡。","我在房間裡跑。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Thank you for your help, Princess.", promptZh: "謝謝你的幫忙，公主。", answer: "You are welcome.", choices: ["The hall is big.","This is a hot soup.","You are welcome."], choicesZh: ["大廳很大。","這是一碗熱湯。","不客氣。"], reward: jobReward }
    ]
  }
});
//#endregion 場景自帶題庫

//#region 生活聊天題庫（issue #135 spec#11；issue #149 全量改寫：角色第一人稱、無 opening/ending）
// castleChatLessonBank：每個場景的「生活聊天」題組——角色以第一人稱對公主寒暄、提問；每場景 2 題、每題 2 選項。
// 答對提升心情並在護眼上限內延長可玩時間、不發 coins（reward.coins=0 僅為結構一致）。
const chatReward = { coins: 0 };
const castleChatLessonBank = Object.freeze({
  kingHall: {
    title: "Chat in the King's Hall",
    questions: [
      { questionType: "sentence-choice", prompt: "Good morning, my dear.", promptZh: "早安，親愛的。", answer: "Good morning, Father.", choices: ["Good morning, Father.","The soup is hot."], choicesZh: ["早安，父王。","湯很熱。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "How are you today?", promptZh: "你今天好嗎？", answer: "I am very well.", choices: ["I see the crown.","I am very well."], choicesZh: ["我看到王冠。","我很好。"], reward: chatReward }
    ]
  },
  queenStudy: {
    title: "Chat in the Queen's Study",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like this book?", promptZh: "你喜歡這本書嗎？", answer: "I like this book.", choices: ["I like this book.","I see the crown."], choicesZh: ["我喜歡這本書。","我看到王冠。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Thank you for sitting with me.", promptZh: "謝謝你坐在我身邊。", answer: "Thank you, Mother.", choices: ["The room is big.","Thank you, Mother."], choicesZh: ["房間很大。","謝謝，母后。"], reward: chatReward }
    ]
  },
  castleKitchen: {
    title: "Chat in the Castle Kitchen",
    questions: [
      { questionType: "sentence-choice", prompt: "Are you hungry, Princess?", promptZh: "公主，你餓了嗎？", answer: "I am hungry.", choices: ["I am hungry.","The shield is round."], choicesZh: ["我餓了。","盾牌是圓的。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "This soup smells good.", promptZh: "這碗湯聞起來很香。", answer: "Some soup, please.", choices: ["I see the flag.","Some soup, please."], choicesZh: ["我看到旗子。","請給我一些湯。"], reward: chatReward }
    ]
  },
  knightsRoom: {
    title: "Chat in the Knights' Room",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you want to play a safe game?", promptZh: "你想玩一個安全的小遊戲嗎？", answer: "Let us play now.", choices: ["Let us play now.","The soup is on the desk."], choicesZh: ["我們現在玩吧。","湯在書桌上。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "I am checking my shield.", promptZh: "我正在檢查我的盾牌。", answer: "Your shield is strong.", choices: ["This book is soft.","Your shield is strong."], choicesZh: ["這本書很柔軟。","你的盾牌很堅固。"], reward: chatReward }
    ]
  },
  maidsRoom: {
    title: "Chat in the Maid's Room",
    questions: [
      { questionType: "sentence-choice", prompt: "How are you, Princess?", promptZh: "公主，你好嗎？", answer: "Hello, I am well.", choices: ["Hello, I am well.","The crown is hot."], choicesZh: ["你好，我很好。","王冠很熱。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "This room looks nice today.", promptZh: "今天這個房間看起來很漂亮。", answer: "The room looks nice.", choices: ["I want fish.","The room looks nice."], choicesZh: ["我想要魚。","房間看起來很漂亮。"], reward: chatReward }
    ]
  },
  royalCloakRoom: {
    title: "Chat in the Royal Cloak Room",
    questions: [
      { questionType: "sentence-choice", prompt: "It is cold today, Princess.", promptZh: "公主，今天有點冷。", answer: "I like this warm cloak.", choices: ["I like this warm cloak.","I see six fish."], choicesZh: ["我喜歡這件暖和的披風。","我看到六條魚。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "This hat is for a long walk.", promptZh: "這頂帽子適合長路旅行。", answer: "Thank you. I will try the hat.", choices: ["The soup is on the table.","Thank you. I will try the hat."], choicesZh: ["湯在餐桌上。","謝謝。我會試試這頂帽子。"], reward: chatReward }
    ]
  },
  castleSeamstress: {
    title: "Chat with the Castle Seamstress",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like this soft top?", promptZh: "你喜歡這件柔軟的上衣嗎？", answer: "I like this soft top.", choices: ["I like this soft top.","The shield is round."], choicesZh: ["我喜歡這件柔軟的上衣。","盾牌是圓的。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Thank you for coming to my room.", promptZh: "謝謝你來我的裁縫室。", answer: "Thank you for the help.", choices: ["I see a fish.","Thank you for the help."], choicesZh: ["我看到一條魚。","謝謝你的幫忙。"], reward: chatReward }
    ]
  }
});
//#endregion 生活聊天題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
// issue #149：travelLine／shopGreeting 改為角色第一人稱對公主發話，並補中文（travelLineZh／shopGreetingZh）。
export const castleSceneConfigs = mergeLessons(mergeLessons({
  princessRoom: { ...princessRoomArt, scene: "scene-princess-room", npcClass: "npc-none", npc: "Lumi", travelAction: "Enter", travelLine: "This is my room. I can dress for the trip.", travelLineZh: "這是我的房間。我可以為旅程換裝。" },
  kingHall: { ...castleSceneArt("king-hall"), scene: "scene-castle-king-hall", npc: "King Rowan", npcImage: npcImage("king-rowan"), npcNaturalHeightCm: 178, travelAction: "Visit", travelLine: "Hello, my dear. Come to the hall.", travelLineZh: "你好，親愛的。來大廳吧。" },
  queenStudy: { ...castleSceneArt("queen-study"), scene: "scene-castle-queen-study", npc: "Queen Mira", npcImage: npcImage("queen-mira"), npcNaturalHeightCm: 165, travelAction: "Visit", travelLine: "Come here, my dear. Let us read.", travelLineZh: "過來吧，親愛的。我們一起讀書吧。" },
  castleKitchen: { ...castleSceneArt("castle-kitchen"), scene: "scene-castle-kitchen", npc: "Cook Panna", npcImage: npcImage("cook-panna"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Hello, Princess. The soup is warm.", travelLineZh: "你好，公主。湯是溫熱的。" },
  knightsRoom: { ...castleSceneArt("knights-room"), scene: "scene-castle-knights-room", npc: "Knight Theo", npcImage: npcImage("knight-theo"), npcNaturalHeightCm: 182, travelAction: "Visit", travelLine: "Hello, Princess. My shield is ready.", travelLineZh: "你好，公主。我的盾牌準備好了。" },
  maidsRoom: { ...castleSceneArt("maids-room"), scene: "scene-castle-maids-room", npc: "Maid Lala", npcImage: npcImage("maid-lala"), npcNaturalHeightCm: 158, travelAction: "Visit", travelLine: "Hello, Princess. The room is clean.", travelLineZh: "你好，公主。房間很乾淨。" },
  royalCloakRoom: { ...castleShopArt("royal-cloak-room"), scene: "scene-castle-royal-cloak-room", npc: "Cloak Keeper", npcImage: npcImage("royal-cloak-keeper"), npcNaturalHeightCm: 170, travelAction: "Shop", travelLine: "Hello, Princess. My cloaks and hats are ready.", travelLineZh: "你好，公主。我的外套和帽子準備好了。", shopGreeting: "Try this warm cloak, Princess.", shopGreetingZh: "公主，試試這件暖和的披風吧。" },
  castleSeamstress: { ...castleShopArt("castle-seamstress"), scene: "scene-castle-seamstress", npc: "Seamstress Bea", npcImage: npcImage("castle-seamstress"), npcNaturalHeightCm: 158, travelAction: "Shop", travelLine: "Good morning, Princess. Soft clothes are ready.", travelLineZh: "早安，公主。柔軟的衣服準備好了。", shopGreeting: "Pick a top or a skirt, Princess.", shopGreetingZh: "公主，選一件上衣或裙子吧。" },
  castleGate: { ...gardenArt, scene: "scene-castle-gate", npcClass: "npc-garden", npc: "Gate Guard", travelAction: "World Map", travelLine: "Princess, the gate is open. You can go to the world map.", travelLineZh: "公主，城門打開了。你可以前往世界地圖。" }
}, castleLessonBank, { area: "castle", vocabProfile: castleVocabularyProfile.id }),
  castleChatLessonBank, { area: "castle", vocabProfile: castleVocabularyProfile.id }, "chatLesson");
//#endregion 對話場景設定
