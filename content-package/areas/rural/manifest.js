//#region 匯入共用工具
// 將題庫清單轉成遊戲執行時需要的 lessons（課程資料）與 quest templates（任務模板）。
import { mergeLessons } from "../_shared/lesson-helpers.js";
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
  rewardCoins: 110,
  note: "Rural production places use practical Movers-style resource words."
});
//#endregion 英文等級與獎勵設定

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
    ruralEntrance: { id: "ruralEntrance", label: "World Road", x: 7, y: 78, links: ["pasture", "farm"] },
    mine: { id: "mine", label: "Mine", x: 64, y: 17, links: ["loggingCamp", "fishingShore", "ruralEntrance"] },
    loggingCamp: { id: "loggingCamp", label: "Logging Camp", x: 45, y: 28, links: ["mine", "fishingShore", "mill", "fieldCobbler"] },
    fishingShore: { id: "fishingShore", label: "Fishing Shore", x: 84, y: 76, links: ["loggingCamp", "farm", "mine", "fieldCobbler"] },
    pasture: { id: "pasture", label: "Pasture", x: 56, y: 34, links: ["ruralEntrance", "farm", "mill", "workwearStall"] },
    farm: { id: "farm", label: "Farm", x: 64, y: 58, links: ["pasture", "mill", "villageHome", "fishingShore", "workwearStall"] },
    mill: { id: "mill", label: "Mill", x: 33, y: 61, links: ["farm", "pasture", "loggingCamp", "villageHome", "workwearStall"] },
    workwearStall: { id: "workwearStall", label: "Workwear Stall", x: 42, y: 46, links: ["pasture", "farm", "mill"] },
    fieldCobbler: { id: "fieldCobbler", label: "Field Cobbler", x: 50, y: 82, links: ["fishingShore", "loggingCamp", "mine"] },
    villageHome: { id: "villageHome", label: "Village Home", x: 15, y: 86, links: ["farm", "mill"] }
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
    { id: "workwearStall", area: "rural", node: "workwearStall", label: "Workwear Stall", icon: "👚", npc: "Workwear Keeper", scene: "scene-rural-workwear-stall", npcImage: npcImage("workwear-stall-keeper"), shopCategories: ["tops", "bottoms"], defaultCategory: "tops", hint: "The Workwear Stall sells sturdy tops and bottoms." },
    { id: "fieldCobbler", area: "rural", node: "fieldCobbler", label: "Field Cobbler", icon: "👞", npc: "Field Cobbler", scene: "scene-rural-field-cobbler", npcImage: npcImage("field-cobbler"), shopCategories: ["shoes", "hats"], defaultCategory: "shoes", hint: "The Field Cobbler sells shoes and hats for country roads." },
    { id: "villageHome", area: "rural", node: "villageHome", label: "Village Home", icon: "🏡", npc: "Grandma Fina", scene: "scene-rural-home", npcImage: npcImage("grandma-fina"), hint: "The village home has a warm porch and garden." }
  ],
  // actors 是地圖上的動態環境效果，不是可點擊地點。
  actors: [],
  defaultNode: "ruralEntrance",
  enabled: true
});
//#endregion 地圖與地點設定

//#region 場景自帶題庫（issue #96 結構；issue #149 全量改寫：角色第一人稱、prompt 即台詞、選項即公主回應、無 opening/ending）
// ruralLessonBank：以 place 為鍵的「打工任務」題庫（答對得 coins＝勞動所得）。
// issue #149：Movers 分級（過去式／because／比較級／going to·will／加減法）；每場景 3 題、每題 3 選項；prompt＝角色第一人稱請求／任務、choices＝公主回應。
const jobReward = { coins: 110 };
const ruralLessonBank = Object.freeze({
  mine: {
    title: "Help at the Mine",
    questions: [
      { questionType: "sentence-choice", prompt: "I found ten stones this morning and sold four. Please help me check how many stones are left.", promptZh: "我今天早上找到十顆石頭，賣掉四顆。請幫我確認還剩幾顆。", answer: "OK, let me check! Six stones are left.", choices: ["OK, let me check! Six stones are left.","OK, let me check! Four stones are left.","OK, let me check! Ten stones are left."], choicesZh: ["好，我來確認！還剩六顆石頭。","好，我來確認！還剩四顆石頭。","好，我來確認！還剩十顆石頭。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This stone is heavy, and that stone is small. Please help me choose the safer one to carry first.", promptZh: "這顆石頭很重，那顆石頭比較小。請幫我選比較安全、可以先搬的那一顆。", answer: "Sure, we should carry the smaller stone first.", choices: ["Sure, we should carry the heavier stone first.","Sure, we should carry the smaller stone first.","Sure, we should carry no stones ever."], choicesZh: ["好的，我們應該先搬比較重的石頭。","好的，我們應該先搬比較小的石頭。","好的，我們永遠不要搬石頭。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Stones can fall here. Please tell me what we must wear.", promptZh: "這裡可能會有石頭掉下來。請告訴我我們必須戴什麼。", answer: "Of course, we must wear hard hats because stones can fall.", choices: ["Of course, we must wear sandals because the road is long.","Of course, we must wear crowns because they are shiny.","Of course, we must wear hard hats because stones can fall."], choicesZh: ["當然，因為路很長，我們必須穿涼鞋。","當然，因為皇冠很亮，我們必須戴皇冠。","當然，因為石頭可能會掉下來，我們必須戴安全帽。"], reward: jobReward }
    ]
  },
  loggingCamp: {
    title: "Help at the Logging Camp",
    questions: [
      { questionType: "sentence-choice", prompt: "I cut three logs, then four more. Please help me count all the logs.", promptZh: "我先切了三根木頭，後來又切了四根。請幫我計算一共有幾根。", answer: "OK, let me count! He cut seven logs.", choices: ["OK, let me count! He cut seven logs.","OK, let me count! He cut four logs.","OK, let me count! He cut three logs."], choicesZh: ["好，我來數數！他切了七根木頭。","好，我來數數！他切了四根木頭。","好，我來數數！他切了三根木頭。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This log is long, and that log is short. Please help me choose the longer one.", promptZh: "這根木頭很長，那根木頭很短。請幫我選比較長的那一根。", answer: "Sure, this log is longer than that one.", choices: ["Sure, this log is shorter than that one.","Sure, this log is longer than that one.","Sure, this log is wetter than the sea."], choicesZh: ["好的，這根木頭比那根短。","好的，這根木頭比那根長。","好的，這根木頭比大海還濕。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "These logs are heavy. Please tell me why we should lift them carefully.", promptZh: "這些木頭很重。請告訴我為什麼我們應該小心搬。", answer: "Well, because the logs are heavy.", choices: ["Well, because the books are quiet.","Well, because the shoes are red.","Well, because the logs are heavy."], choicesZh: ["嗯，因為書很安靜。","嗯，因為鞋子是紅色的。","嗯，因為木頭很重。"], reward: jobReward }
    ]
  },
  fishingShore: {
    title: "Help at the Fishing Shore",
    questions: [
      { questionType: "sentence-choice", prompt: "One net had five fish, and the other net had five fish. Please help me count the catch.", promptZh: "一張網有五條魚，另一張網也有五條魚。請幫我計算漁獲總數。", answer: "OK, let me count! There are ten fish.", choices: ["OK, let me count! There are ten fish.","OK, let me count! There are five fish.","OK, let me count! There are eight fish."], choicesZh: ["好，我來數數！有十條魚。","好，我來數數！有五條魚。","好，我來數數！有八條魚。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The dock is wet and slippery. Please help me remind everyone.", promptZh: "碼頭又濕又滑。請幫我提醒大家。", answer: "Sure, we should walk slowly because the dock is wet.", choices: ["Sure, we should run because the dock is wet.","Sure, we should walk slowly because the dock is wet.","Sure, we should leave the net on the dock because it is wet."], choicesZh: ["好的，因為碼頭是濕的，我們應該跑。","好的，因為碼頭是濕的，我們應該慢慢走。","好的，因為網子是濕的，我們應該把它留在碼頭上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The weather looks good. Please tell me our plan for tomorrow.", promptZh: "天氣看起來很好。請告訴我我們明天的計畫。", answer: "Of course, we are going to fish again tomorrow.", choices: ["Of course, we were cleaning the boat yesterday.","Of course, we must put the fish in a book.","Of course, we are going to fish again tomorrow."], choicesZh: ["當然，我們昨天正在清理船。","當然，我們必須把魚放進書裡。","當然，我們明天會再去釣魚。"], reward: jobReward }
    ]
  },
  pasture: {
    title: "Help at the Pasture",
    questions: [
      { questionType: "sentence-choice", prompt: "I saw six sheep, and four more came to the fence. Please help me count them.", promptZh: "我看到六隻羊，後來又有四隻走到圍欄旁。請幫我數一共有幾隻。", answer: "OK, let me count! Now there are ten sheep.", choices: ["OK, let me count! Now there are ten sheep.","OK, let me count! Now there are six sheep.","OK, let me count! Now there are four sheep."], choicesZh: ["好，我來數數！現在有十隻羊。","好，我來數數！現在有六隻羊。","好，我來數數！現在有四隻羊。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A cow is big, and a sheep is small. Please help me compare them.", promptZh: "牛很大，羊比較小。請幫我比較牠們。", answer: "Sure, the cow is bigger than the sheep.", choices: ["Sure, the sheep is bigger than the cow.","Sure, the cow is bigger than the sheep.","Sure, the cow is wetter than the fish."], choicesZh: ["好的，羊比牛大。","好的，牛比羊大。","好的，牛比魚更濕。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The animals are hungry. Please tell me why we should bring the hay now.", promptZh: "動物們餓了。請告訴我為什麼我們現在應該拿乾草來。", answer: "Well, because the animals are hungry.", choices: ["Well, because the shoes are blue.","Well, because the road is muddy.","Well, because the animals are hungry."], choicesZh: ["嗯，因為鞋子是藍色的。","嗯，因為道路很泥濘。","嗯，因為動物們餓了。"], reward: jobReward }
    ]
  },
  farm: {
    title: "Help at the Farm",
    questions: [
      { questionType: "sentence-choice", prompt: "I picked twelve carrots and gave five away. Please help me check how many carrots are left.", promptZh: "我採了十二根紅蘿蔔，送出了五根。請幫我確認還剩幾根。", answer: "OK, let me check! Seven carrots are left.", choices: ["OK, let me check! Seven carrots are left.","OK, let me check! Five carrots are left.","OK, let me check! Twelve carrots are left."], choicesZh: ["好，我來確認！還剩七根紅蘿蔔。","好，我來確認！還剩五根紅蘿蔔。","好，我來確認！還剩十二根紅蘿蔔。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The rows are dry. Please tell me what we are going to do.", promptZh: "菜畦很乾。請告訴我我們接下來要做什麼。", answer: "Sure, we are going to water the rows.", choices: ["Sure, we are going to put the rows on ice.","Sure, we are going to water the rows.","Sure, we are going to read the carrots."], choicesZh: ["好的，我們要把菜畦放在冰上。","好的，我們要澆菜畦。","好的，我們要讀紅蘿蔔。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The plants are thirsty. Please tell me why we water them.", promptZh: "植物們缺水了。請告訴我為什麼我們要澆水。", answer: "Well, because the plants are thirsty.", choices: ["Well, because the baskets are loud.","Well, because the mill is bigger.","Well, because the plants are thirsty."], choicesZh: ["嗯，因為籃子很大聲。","嗯，因為磨坊比較大。","嗯，因為植物缺水了。"], reward: jobReward }
    ]
  },
  mill: {
    title: "Help at the Mill",
    questions: [
      { questionType: "sentence-choice", prompt: "I had eight sacks, and the cart took three away. Please help me check how many sacks are left.", promptZh: "我原本有八袋麵粉，推車載走三袋。請幫我確認還剩幾袋。", answer: "OK, let me check! Five sacks are left.", choices: ["OK, let me check! Five sacks are left.","OK, let me check! Three sacks are left.","OK, let me check! Eight sacks are left."], choicesZh: ["好，我來確認！還剩五袋。","好，我來確認！還剩三袋。","好，我來確認！還剩八袋。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This sack is heavy, and that sack is light. Please help me compare them.", promptZh: "這袋很重，那袋比較輕。請幫我比較它們。", answer: "Sure, this sack is heavier than that one.", choices: ["Sure, this sack is lighter than that one.","Sure, this sack is heavier than that one.","Sure, this sack is wetter than the sea."], choicesZh: ["好的，這袋比那袋輕。","好的，這袋比那袋重。","好的，這袋比大海濕。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There is flour on the floor. Please tell me why we should sweep it.", promptZh: "地上有麵粉。請告訴我為什麼我們應該把它掃掉。", answer: "Well, because the flour is slippery.", choices: ["Well, because the apples are counting us.","Well, because the mill is under the hat.","Well, because the flour is slippery."], choicesZh: ["嗯，因為蘋果在數我們。","嗯，因為磨坊在帽子下面。","嗯，因為麵粉會滑。"], reward: jobReward }
    ]
  },
  villageHome: {
    title: "Help at the Village Home",
    questions: [
      { questionType: "sentence-choice", prompt: "I had seven apples, and you brought two more. Please help me count them.", promptZh: "我原本有七顆蘋果，你又帶來兩顆。請幫我數一共有幾顆。", answer: "OK, let me count! There are nine apples.", choices: ["OK, let me count! There are nine apples.","OK, let me count! There are seven apples.","OK, let me count! There are two apples."], choicesZh: ["好，我來數數！有九顆蘋果。","好，我來數數！有七顆蘋果。","好，我來數數！有兩顆蘋果。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The porch is dusty. Please tell me why we should sweep it.", promptZh: "門廊有灰塵。請告訴我為什麼我們應該打掃。", answer: "Well, because the porch is dusty.", choices: ["Well, because the sheep are taller than the house.","Well, because the porch is dusty.","Well, because the fish are in the basket."], choicesZh: ["嗯，因為羊比房子高。","嗯，因為門廊有灰塵。","嗯，因為魚在籃子裡。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "You helped me so much today. I have even more work tomorrow — can you come back?", promptZh: "你今天幫了我好多。我明天有更多工作——你能再回來嗎？", answer: "Of course, I'd be glad to come back and help again tomorrow.", choices: ["Of course, I'd be glad to come back and help again tomorrow.","Of course, I will never come to this village again.","Of course, you should do all the work by yourself."], choicesZh: ["當然，我很樂意明天再回來幫忙。","當然，我再也不會來這個村莊了。","當然，你應該自己一個人做完所有工作。"], reward: jobReward }
    ]
  }
});
//#endregion 場景自帶題庫

//#region 生活聊天題庫（issue #135 spec#11；issue #149 全量改寫：角色第一人稱、無 opening/ending）
// ruralChatLessonBank：各生產場景 NPC 的「生活聊天」題組（Movers 程度）——角色第一人稱寒暄／回顧；每場景 2 題、每題 2 選項。
const chatReward = { coins: 0 };
const ruralChatLessonBank = Object.freeze({
  mine: {
    title: "Chat at the Mine",
    questions: [
      { questionType: "sentence-choice", prompt: "My morning was busy but good. How was yours?", promptZh: "我的早上很忙，但還不錯。你的呢？", answer: "Oh, it was busy but good!", choices: ["Oh, it was busy but good!","Sorry, my morning was very bad."], choicesZh: ["喔，很忙，但還不錯！","抱歉，我今天早上過得很糟。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "I am a little tired after carrying stones.", promptZh: "搬完石頭後，我有一點累。", answer: "Oh, are you tired today?", choices: ["You should rest after carrying those stones.","Oh, are you tired today?"], choicesZh: ["搬完那些石頭，你應該休息一下。","喔，你今天累了嗎？"], reward: chatReward }
    ]
  },
  loggingCamp: {
    title: "Chat at the Logging Camp",
    questions: [
      { questionType: "sentence-choice", prompt: "Why did you come to the logging camp, Princess?", promptZh: "公主，你為什麼來伐木營地呢？", answer: "Well, because I want to help!", choices: ["Well, because I want to help!","Because the classroom is busy."], choicesZh: ["嗯，因為我想幫忙啊！","因為教室很忙。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "I will stack the logs before lunch.", promptZh: "我會在午餐前堆好木頭。", answer: "Sure, I can help you stack them!", choices: ["I think those logs are too heavy to stack.","Sure, I can help you stack them!"], choicesZh: ["我覺得那些木頭太重，堆不起來。","好啊，我可以幫你把它們堆好！"], reward: chatReward }
    ]
  },
  fishingShore: {
    title: "Chat at the Fishing Shore",
    questions: [
      { questionType: "sentence-choice", prompt: "I walked along the shore this morning. What did you do?", promptZh: "我今天早上沿著海岸走。你做了什麼？", answer: "I walked along the shore too!", choices: ["I walked along the shore too!","I rested at home all morning."], choicesZh: ["我也沿著海岸走了走！","我整個早上都在家休息。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The sea was calm and pretty today.", promptZh: "今天的大海平靜又漂亮。", answer: "Yes, the sea was calm and pretty!", choices: ["The log was under the candle.","Yes, the sea was calm and pretty!"], choicesZh: ["木頭在蠟燭下面。","對啊，大海平靜又漂亮！"], reward: chatReward }
    ]
  },
  pasture: {
    title: "Chat at the Pasture",
    questions: [
      { questionType: "sentence-choice", prompt: "Why do you like the pasture, Princess?", promptZh: "公主，你為什麼喜歡牧場？", answer: "Well, because the animals are so sweet!", choices: ["Well, because the animals are so sweet!","Because the map is in the soup."], choicesZh: ["嗯，因為這些動物好可愛！","因為地圖在湯裡。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The grass is green after the rain.", promptZh: "下雨後草地很綠。", answer: "Wow, your pasture is so green!", choices: ["No, the grass looks brown and dry.","Wow, your pasture is so green!"], choicesZh: ["不，草地看起來又枯又乾。","哇，你的牧場好綠！"], reward: chatReward }
    ]
  },
  farm: {
    title: "Chat at the Farm",
    questions: [
      { questionType: "sentence-choice", prompt: "How do you feel on the farm today?", promptZh: "你今天在農場感覺如何？", answer: "I feel really happy and warm!", choices: ["I feel really happy and warm!","I feel under the boat."], choicesZh: ["我覺得好開心、好溫暖！","我覺得在船下面。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "These vegetables look fresh.", promptZh: "這些蔬菜看起來很新鮮。", answer: "Wow, your vegetables look so fresh!", choices: ["Hmm, these vegetables look old.","Wow, your vegetables look so fresh!"], choicesZh: ["嗯，這些蔬菜看起來不太新鮮。","哇，你的蔬菜看起來好新鮮！"], reward: chatReward }
    ]
  },
  mill: {
    title: "Chat at the Mill",
    questions: [
      { questionType: "sentence-choice", prompt: "Why is the mill one of your favourite places?", promptZh: "為什麼磨坊是你喜歡的地方之一？", answer: "Well, because the bread smells so nice!", choices: ["Well, because the bread smells so nice!","Because the kitchen smells nice."], choicesZh: ["嗯，因為麵包聞起來好香！","因為廚房聞起來很香。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Thank you for helping me near the mill.", promptZh: "謝謝你在磨坊旁幫我。", answer: "Thank you so much for the warm bread!", choices: ["Sorry, I could not help at the mill today.","Thank you so much for the warm bread!"], choicesZh: ["抱歉，我今天沒能在磨坊幫上忙。","真謝謝你的溫熱麵包！"], reward: chatReward }
    ]
  },
  villageHome: {
    title: "Chat at the Village Home",
    questions: [
      { questionType: "sentence-choice", prompt: "Why did you come to visit me, Princess?", promptZh: "公主，你為什麼來看我呢？", answer: "I just came to see you!", choices: ["I just came to see you!","I came to count boats in the mine."], choicesZh: ["我就是來看你的呀！","我來礦場數船。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "My home is warm today.", promptZh: "我的家今天很溫暖。", answer: "Your home is so warm and cosy!", choices: ["Really? Your home feels cold to me.","Your home is so warm and cosy!"], choicesZh: ["真的嗎？你家對我來說有點冷。","你的家好溫暖、好舒適！"], reward: chatReward }
    ]
  },
  workwearStall: {
    title: "Chat at the Workwear Stall",
    questions: [
      { questionType: "sentence-choice", prompt: "Why are these clothes good for country work?", promptZh: "為什麼這些衣服適合鄉間工作？", answer: "Well, because they are really strong!", choices: ["Well, because they are really strong!","Because they caught ten fish."], choicesZh: ["嗯，因為它們很耐用！","因為它們捕到十條魚。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "These clothes look ready for the fields.", promptZh: "這些衣服看起來準備好去田裡了。", answer: "Wow, these clothes look really strong!", choices: ["Hmm, these clothes are not ready yet.","Wow, these clothes look really strong!"], choicesZh: ["嗯，這些衣服還沒準備好。","哇，這些衣服看起來真耐用！"], reward: chatReward }
    ]
  },
  fieldCobbler: {
    title: "Chat with the Field Cobbler",
    questions: [
      { questionType: "sentence-choice", prompt: "Why do you need strong shoes, Princess?", promptZh: "公主，你為什麼需要耐用的鞋？", answer: "Well, because the roads are very long!", choices: ["Well, because the roads are very long!","Because the books sold carrots."], choicesZh: ["嗯，因為路很長啊！","因為書賣了紅蘿蔔。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "These shoes were made for walking.", promptZh: "這些鞋是為走路做的。", answer: "Wow, these shoes look really strong!", choices: ["These shoes look too small for walking.","Wow, these shoes look really strong!"], choicesZh: ["這雙鞋看起來太小，不好走路。","哇，這些鞋看起來真耐用！"], reward: chatReward }
    ]
  }
});
//#endregion 生活聊天題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
// issue #149：travelLine／shopGreeting 改為角色第一人稱對公主發話，並補中文（travelLineZh／shopGreetingZh）。
export const ruralSceneConfigs = mergeLessons(mergeLessons({
  ruralExit: { ...ruralProductionArt("farm"), scene: "scene-rural-exit", npcClass: "npc-none", npc: "Rural Sign", travelAction: "World Map", travelLine: "Princess, this road returns to the kingdom world map.", travelLineZh: "公主，這條路會回到王國世界地圖。" },
  mine: { ...ruralProductionArt("mine"), scene: "scene-rural-mine", npc: "Miner Gemma", npcImage: npcImage("miner-gemma"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Hello, Princess. I found shiny stones this morning.", travelLineZh: "你好，公主。我今天早上找到一些閃亮的石頭。" },
  loggingCamp: { ...ruralProductionArt("logging"), scene: "scene-rural-logging", npc: "Logger Rowan", npcImage: npcImage("logger-rowan"), npcNaturalHeightCm: 178, travelAction: "Visit", travelLine: "Good morning, Princess. We cut logs near the cabin today.", travelLineZh: "早安，公主。我們今天在小屋旁切木頭。" },
  fishingShore: { ...ruralProductionArt("fishing"), scene: "scene-rural-fishing", npc: "Fisher Nami", npcImage: npcImage("fisher-nami"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Hello, Princess. We caught fish near the shore today.", travelLineZh: "你好，公主。我們今天在岸邊捕到魚。" },
  pasture: { ...ruralProductionArt("pasture"), scene: "scene-rural-pasture", npc: "Farmer Theo", npcImage: npcImage("farmer-theo"), npcNaturalHeightCm: 175, travelAction: "Visit", travelLine: "Hi, Princess. I counted animals in the pasture today.", travelLineZh: "嗨，公主。我今天在牧場數動物。" },
  farm: { ...ruralProductionArt("farm"), scene: "scene-rural-farm", npc: "Auntie Pom", npcImage: npcImage("auntie-pom"), npcNaturalHeightCm: 155, travelAction: "Visit", travelLine: "Hello, Princess. I picked carrots on the farm today.", travelLineZh: "你好，公主。我今天在農場採紅蘿蔔。" },
  mill: { ...ruralProductionArt("mill"), scene: "scene-rural-mill", npc: "Miller Bell", npcImage: npcImage("miller-bell"), npcNaturalHeightCm: 162, travelAction: "Visit", travelLine: "Good day, Princess. I carried flour sacks to the mill.", travelLineZh: "日安，公主。我把麵粉袋搬到磨坊了。" },
  workwearStall: { ...ruralShopArt("workwear-stall"), scene: "scene-rural-workwear-stall", npc: "Workwear Keeper", npcImage: npcImage("workwear-stall-keeper"), npcNaturalHeightCm: 168, travelAction: "Shop", travelLine: "Hello, Princess. I brought strong clothes for country work.", travelLineZh: "你好，公主。我帶來了適合鄉間工作的耐用衣服。", shopGreeting: "These tops and bottoms are ready for the fields.", shopGreetingZh: "這些上衣和褲子準備好在田裡使用了。" },
  fieldCobbler: { ...ruralShopArt("field-cobbler"), scene: "scene-rural-field-cobbler", npc: "Field Cobbler", npcImage: npcImage("field-cobbler"), npcNaturalHeightCm: 165, travelAction: "Shop", travelLine: "Good morning, Princess. These shoes are made for country roads.", travelLineZh: "早安，公主。這些鞋是為鄉間道路做的。", shopGreeting: "Try these walking shoes before your next trip.", shopGreetingZh: "下一趟旅程前，試試這雙步行鞋吧。" },
  villageHome: { ...ruralProductionArt("home"), scene: "scene-rural-home", npc: "Grandma Fina", npcImage: npcImage("grandma-fina"), npcNaturalHeightCm: 148, travelAction: "Visit", travelLine: "Hello, Princess. I made apple jam this morning.", travelLineZh: "你好，公主。我今天早上做了蘋果果醬。" }
}, ruralLessonBank, { area: "rural", vocabProfile: ruralVocabularyProfile.id }),
  ruralChatLessonBank, { area: "rural", vocabProfile: ruralVocabularyProfile.id }, "chatLesson");
//#endregion 對話場景設定
