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
      { questionType: "sentence-choice", prompt: "Please look at the crown.", promptZh: "請看看王冠。", answer: "Yes, I see the crown.", choices: ["Yes, I see the crown.","Yes, I see the soup.","Yes, I see the fish."], choicesZh: ["好的，我看到王冠。","好的，我看到湯。","好的，我看到魚。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Please stand by me.", promptZh: "請站在我旁邊。", answer: "OK, I will stand by you.", choices: ["OK, I will stand by you.","OK, I will run away.","OK, I will read the note."], choicesZh: ["好，我會站在你旁邊。","好，我會跑走。","好，我會去讀便條。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The hall is big. Can we go now?", promptZh: "大廳很大。我們可以走了嗎？", answer: "Sure, we can go now.", choices: ["Sure, we can go now.","Sure, the cat has a hat.","Sure, the bread is hot."], choicesZh: ["好啊，我們現在可以走了。","好啊，貓有一頂帽子。","好啊，麵包很燙。"], reward: jobReward }
    ]
  },
  queenStudy: {
    title: "Help in the Queen's Study",
    questions: [
      { questionType: "sentence-choice", prompt: "Please put the book on the desk.", promptZh: "請把書放在書桌上。", answer: "OK, I will put the book on the desk.", choices: ["OK, I will put the book on the desk.","OK, I will put the soup on the bed.","OK, I will put the book on the bed."], choicesZh: ["好，我會把書放在書桌上。","好，我會把湯放在床上。","好，我會把書放在床上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Please give this note to me.", promptZh: "請把這張便條給我。", answer: "Sure, here is the note.", choices: ["Sure, here is the note.","Sure, here is my hat.","Sure, here is a fish."], choicesZh: ["好啊，便條在這裡。","好啊，我的帽子在這裡。","好啊，這裡有一條魚。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Can you read this page with me?", promptZh: "你可以和我一起讀這一頁嗎？", answer: "Yes, I can read with you.", choices: ["Yes, I can read with you.","Yes, I can run with you.","Yes, I can see six fish."], choicesZh: ["好的，我可以和你一起讀。","好的，我可以和你一起跑。","好的，我可以看到六條魚。"], reward: jobReward }
    ]
  },
  castleKitchen: {
    title: "Help in the Castle Kitchen",
    questions: [
      { questionType: "sentence-choice", prompt: "Please put the bread on the table.", promptZh: "請把麵包放在餐桌上。", answer: "OK, I will put the bread on the table.", choices: ["OK, I will put the bread on the table.","OK, I will put the crown in the soup.","OK, I will put the bread on the bed."], choicesZh: ["好，我會把麵包放在餐桌上。","好，我會把王冠放進湯裡。","好，我會把麵包放在床上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Please get water for lunch.", promptZh: "請幫午餐拿水。", answer: "Sure, here is the water.", choices: ["Sure, here is the water.","Sure, here is the towel.","Sure, here is the book."], choicesZh: ["好啊，水在這裡。","好啊，毛巾在這裡。","好啊，書在這裡。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The kitchen is busy. Please be safe.", promptZh: "廚房很忙。請注意安全。", answer: "OK, I will not run.", choices: ["OK, I will not run.","OK, I will run fast.","OK, I will play with the soup."], choicesZh: ["好，我不會跑。","好，我會跑很快。","好，我會玩湯。"], reward: jobReward }
    ]
  },
  knightsRoom: {
    title: "Help in the Knights' Room",
    questions: [
      { questionType: "sentence-choice", prompt: "Please look at the shield.", promptZh: "請看看盾牌。", answer: "Yes, the shield is round.", choices: ["Yes, the shield is round.","Yes, the bread is cold.","Yes, the book is on the desk."], choicesZh: ["好的，盾牌是圓的。","好的，麵包是冷的。","好的，書在書桌上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Please stand by me.", promptZh: "請站在我旁邊。", answer: "OK, I will stand by you.", choices: ["OK, I will stand by you.","OK, I will stand on the table.","OK, I will stand near the door."], choicesZh: ["好，我會站在你旁邊。","好，我會站在餐桌上。","好，我會站在門旁邊。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Please look at the flag.", promptZh: "請看看旗子。", answer: "Sure, I see the flag.", choices: ["Sure, I see the flag.","Sure, I see the towel.","Sure, I see the fish."], choicesZh: ["好啊，我看到旗子。","好啊，我看到毛巾。","好啊，我看到魚。"], reward: jobReward }
    ]
  },
  maidsRoom: {
    title: "Help in the Maid's Room",
    questions: [
      { questionType: "sentence-choice", prompt: "Please fold this white cloth.", promptZh: "請折這塊白布。", answer: "OK, I can fold it.", choices: ["OK, I can fold it.","OK, I can hold the cloth.","OK, I can sit on the cloth."], choicesZh: ["好，我可以折它。","好，我可以拿著布。","好，我可以坐在布上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Please put the cloth in the basket.", promptZh: "請把布放進籃子裡。", answer: "Sure, I will put it in the basket.", choices: ["Sure, I will put it in the basket.","Sure, I will put the crown on the fish.","Sure, I will run in the room."], choicesZh: ["好啊，我會把它放進籃子裡。","好啊，我會把王冠放在魚上。","好啊，我會在房間裡跑。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Thank you for your help, Princess.", promptZh: "謝謝你的幫忙，公主。", answer: "You're welcome, Lala!", choices: ["You're welcome, Lala!","The hall is big.","This is a hot soup."], choicesZh: ["不客氣，拉拉！","大廳很大。","這是一碗熱湯。"], reward: jobReward }
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
      { questionType: "sentence-choice", prompt: "Good morning, my dear.", promptZh: "早安，親愛的。", answer: "Good morning, Father! I am happy.", choices: ["Good morning, Father! I am happy.","The soup is hot."], choicesZh: ["早安，父王！我好開心。","湯很燙。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "How are you today?", promptZh: "你今天好嗎？", answer: "Oh, I am very well, thank you!", choices: ["Oh, I am very well, thank you!","I see the crown."], choicesZh: ["喔，我很好，謝謝！","我看到王冠。"], reward: chatReward }
    ]
  },
  queenStudy: {
    title: "Chat in the Queen's Study",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like this book?", promptZh: "你喜歡這本書嗎？", answer: "Yes, I like this book very much!", choices: ["Yes, I like this book very much!","I see the crown."], choicesZh: ["喜歡，我超喜歡這本書！","我看到王冠。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Thank you for sitting with me.", promptZh: "謝謝你坐在我身邊。", answer: "Thank you, Mother. I like this.", choices: ["Thank you, Mother. I like this.","The room is big."], choicesZh: ["謝謝，母后。我很喜歡這樣。","房間很大。"], reward: chatReward }
    ]
  },
  castleKitchen: {
    title: "Chat in the Castle Kitchen",
    questions: [
      { questionType: "sentence-choice", prompt: "Are you hungry, Princess?", promptZh: "公主，你餓了嗎？", answer: "Yes, I am so hungry!", choices: ["Yes, I am so hungry!","The shield is round."], choicesZh: ["對啊，我好餓！","盾牌是圓的。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "This soup smells good.", promptZh: "這碗湯聞起來很香。", answer: "Yes! Some soup, please.", choices: ["Yes! Some soup, please.","I see the flag."], choicesZh: ["好耶！請給我一些湯。","我看到旗子。"], reward: chatReward }
    ]
  },
  knightsRoom: {
    title: "Chat in the Knights' Room",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you want to play a safe game?", promptZh: "你想玩一個安全的小遊戲嗎？", answer: "Yes, let us play now!", choices: ["Yes, let us play now!","The soup is on the desk."], choicesZh: ["好啊，我們現在玩吧！","湯在書桌上。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "I am checking my shield.", promptZh: "我正在檢查我的盾牌。", answer: "Wow, your shield is so strong!", choices: ["Wow, your shield is so strong!","This book is soft."], choicesZh: ["哇，你的盾牌好堅固！","這本書很柔軟。"], reward: chatReward }
    ]
  },
  maidsRoom: {
    title: "Chat in the Maid's Room",
    questions: [
      { questionType: "sentence-choice", prompt: "How are you, Princess?", promptZh: "公主，你好嗎？", answer: "Hi! I am very well.", choices: ["Hi! I am very well.","The crown is hot."], choicesZh: ["嗨！我很好。","王冠很燙。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "This room looks nice today.", promptZh: "今天這個房間看起來很漂亮。", answer: "Yes, the room looks so nice!", choices: ["Yes, the room looks so nice!","I want fish."], choicesZh: ["對啊，房間看起來好漂亮！","我想要魚。"], reward: chatReward }
    ]
  },
  royalCloakRoom: {
    title: "Chat in the Royal Cloak Room",
    questions: [
      { questionType: "sentence-choice", prompt: "It is cold today, Princess.", promptZh: "公主，今天有點冷。", answer: "Yes, I love this warm cloak!", choices: ["Yes, I love this warm cloak!","I see six fish."], choicesZh: ["對啊，我好喜歡這件暖披風！","我看到六條魚。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "This hat is for a long walk.", promptZh: "這頂帽子適合長路旅行。", answer: "Oh, thank you! I will try the hat.", choices: ["Oh, thank you! I will try the hat.","The soup is on the table."], choicesZh: ["喔，謝謝！我來試試這頂帽子。","湯在餐桌上。"], reward: chatReward }
    ]
  },
  castleSeamstress: {
    title: "Chat with the Castle Seamstress",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like this soft top?", promptZh: "你喜歡這件柔軟的上衣嗎？", answer: "Yes, I like this soft top very much!", choices: ["Yes, I like this soft top very much!","The shield is round."], choicesZh: ["喜歡，我很喜歡這件柔軟的上衣！","盾牌是圓的。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Thank you for coming to my room.", promptZh: "謝謝你來我的裁縫室。", answer: "Thank you for your help!", choices: ["Thank you for your help!","I see a fish."], choicesZh: ["謝謝你的幫忙！","我看到一條魚。"], reward: chatReward }
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
