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
    ruralEntrance: { id: "ruralEntrance", label: "World Road", x: 7.1, y: 63.3, links: ["pasture", "farm"] },
    mine: { id: "mine", label: "Mine", x: 64.9, y: 32.4, links: ["loggingCamp", "fishingShore", "ruralEntrance"] },
    loggingCamp: { id: "loggingCamp", label: "Logging Camp", x: 34.4, y: 37, links: ["mine", "fishingShore", "mill"] },
    fishingShore: { id: "fishingShore", label: "Fishing Shore", x: 76.7, y: 87.4, links: ["loggingCamp", "farm", "mine"] },
    pasture: { id: "pasture", label: "Pasture", x: 63.7, y: 45.1, links: ["ruralEntrance", "farm", "mill", "workwearStall"] },
    farm: { id: "farm", label: "Farm", x: 70.2, y: 65.2, links: ["pasture", "mill", "villageHome", "fishingShore", "workwearStall"] },
    mill: { id: "mill", label: "Mill", x: 33, y: 61, links: ["farm", "pasture", "loggingCamp", "villageHome", "workwearStall"] },
    workwearStall: { id: "workwearStall", label: "Workwear Stall", x: 33.1, y: 69.9, links: ["pasture", "farm", "mill"] },
    villageHome: { id: "villageHome", label: "Village Home", x: 53.8, y: 79.2, links: ["farm", "mill"] }
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
    { id: "workwearStall", area: "rural", node: "workwearStall", label: "Workwear Stall", icon: "👚", npc: "Workwear Keeper", scene: "scene-rural-workwear-stall", npcImage: npcImage("workwear-stall-keeper"), shopCategories: ["hair", "outfit", "shoes", "accessories"], defaultCategory: "hair", hint: "The Workwear Stall stocks countryside hair, apron dresses, shoes, and baskets." },
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
      { questionType: "sentence-choice", prompt: "I found ten stones this morning and sold four. How many stones are left?", promptZh: "我今天早上找到十顆石頭，賣掉了四顆。還剩幾顆？", answer: "Sure — you sold four, so six stones are left.", choices: ["Sure — you sold four, so six stones are left.","OK — I think five stones are left.","Well, all ten stones are still here, right?"], choicesZh: ["好的——你賣掉四顆，所以還剩六顆。","好——我想還剩五顆。","嗯，十顆應該都還在吧？"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This stone is heavy, and that one is smaller. Which should we carry first?", promptZh: "這顆石頭很重，那顆比較小。我們該先搬哪一顆？", answer: "Well, start with the smaller one — it is safer to lift.", choices: ["Well, start with the smaller one — it is safer to lift.","OK — the heavy one first, so the hard job is done early.","Sure — carry both at once and finish faster."], choicesZh: ["嗯，先搬小的那顆——抬起來比較安全。","好的——先搬重的，困難的先做完。","好啊——兩顆一起搬，比較快做完。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Stones can fall here. Please tell me what we must wear to stay safe.", promptZh: "這裡可能會有石頭掉下來。請告訴我我們必須戴什麼才安全。", answer: "Of course — hard hats, so falling stones cannot hurt our heads.", choices: ["Of course — hard hats, so falling stones cannot hurt our heads.","Well, thick gloves should be enough for the mine.","OK — warm coats, because the mine gets cold."], choicesZh: ["當然——戴安全帽，掉下來的石頭才傷不到我們的頭。","嗯，戴厚手套在礦場應該就夠了。","好的——穿保暖外套，因為礦場裡很冷。"], reward: jobReward }
    ]
  },
  loggingCamp: {
    title: "Help at the Logging Camp",
    questions: [
      { questionType: "sentence-choice", prompt: "I cut three logs, then four more. How many logs did I cut in all?", promptZh: "我先切了三根木頭，後來又切了四根。我一共切了幾根？", answer: "OK — three and then four more makes seven logs.", choices: ["OK — three and then four more makes seven logs.","OK — I count six logs in the pile.","OK — that makes eight logs, I think."], choicesZh: ["好——三根再加四根，一共七根木頭。","好——我數到木堆裡有六根。","好——我想應該是八根。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This log is long, and that log is short. Please help me pick the longer one.", promptZh: "這根木頭長，那根短。請幫我挑比較長的那根。", answer: "Sure — this one here. It is longer than that short one.", choices: ["Sure — this one here. It is longer than that short one.","OK — the short one is easier to carry. Take that one.","Well, both logs look about the same to me."], choicesZh: ["好的——這根。它比那根短的長。","好的——短的那根比較好搬，拿那根吧。","嗯，兩根在我看來差不多長。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "These logs are heavy. Why should we lift them carefully?", promptZh: "這些木頭很重。為什麼我們搬的時候要小心？", answer: "Well, because a dropped log could hurt someone's feet.", choices: ["Well, because a dropped log could hurt someone's feet.","OK — because lifting fast gets the work done sooner.","Sure — because the boss is watching us today."], choicesZh: ["嗯，因為木頭掉下來會砸傷別人的腳。","好的——因為搬快一點，工作比較早做完。","好啊——因為老闆今天正看著我們。"], reward: jobReward }
    ]
  },
  fishingShore: {
    title: "Help at the Fishing Shore",
    questions: [
      { questionType: "sentence-choice", prompt: "One net had five fish, and the other net had five more. How big is the catch?", promptZh: "一張網有五條魚，另一張網也有五條。漁獲一共是多少？", answer: "OK — five and five make ten fish. What a catch!", choices: ["OK — five and five make ten fish. What a catch!","OK — I count eight fish in the nets.","OK — that makes twelve fish, I think."], choicesZh: ["好——五加五，一共十條魚。大豐收！","好——我數到網子裡有八條。","好——我想應該是十二條。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The dock is wet and slippery. Please help me remind everyone.", promptZh: "碼頭又濕又滑。請幫我提醒大家。", answer: "Sure — I'll tell everyone to walk slowly on the wet boards.", choices: ["Sure — I'll tell everyone to walk slowly on the wet boards.","OK — I'll tell everyone to take their shoes off first.","Well, everyone can see the water — they will be careful."], choicesZh: ["好的——我會提醒大家在濕木板上要慢慢走。","好的——我會叫大家先把鞋子脫掉。","嗯，大家都看得到水啦——他們自己會小心的。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The weather looks good for tomorrow. What is our fishing plan?", promptZh: "明天天氣看起來很好。我們的捕魚計畫是什麼？", answer: "Of course — we will sail out early and fish again tomorrow.", choices: ["Of course — we will sail out early and fish again tomorrow.","Well, let's stay home tomorrow and mend the nets.","OK — we can decide the plan after lunch tomorrow."], choicesZh: ["當然——我們明天一早出海，再捕一次魚。","嗯，我們明天待在家補網子吧。","好的——我們明天午餐後再決定計畫。"], reward: jobReward }
    ]
  },
  pasture: {
    title: "Help at the Pasture",
    questions: [
      { questionType: "sentence-choice", prompt: "I saw six sheep, and four more came to the fence. How many sheep are there now?", promptZh: "我看到六隻羊，後來又有四隻走到圍欄旁。現在一共有幾隻？", answer: "OK — six and four more make ten sheep.", choices: ["OK — six and four more make ten sheep.","OK — I count nine sheep by the fence.","OK — that makes eight sheep, I think."], choicesZh: ["好——六隻加四隻，一共十隻羊。","好——我數到圍欄邊有九隻。","好——我想應該是八隻。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A cow is big, and a sheep is small. Please help me compare them.", promptZh: "牛很大，羊比較小。請幫我比較牠們。", answer: "Sure — the cow is bigger than the sheep.", choices: ["Sure — the cow is bigger than the sheep.","Sure — the sheep is bigger than the cow.","Well, they look about the same size to me."], choicesZh: ["好的——牛比羊大。","好的——羊比牛大。","嗯，牠們在我看來差不多大。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The animals are hungry. Why should the hay come first, before other jobs?", promptZh: "動物們餓了。為什麼要先拿乾草來，其他工作後做？", answer: "Sure — hungry animals cannot wait. Feed them first.", choices: ["Sure — hungry animals cannot wait. Feed them first.","OK — we can feed them after we clean the barn.","Well, the grass in the field may be enough today."], choicesZh: ["好的——餓著的動物等不了，先餵牠們。","好的——我們先打掃穀倉，再餵牠們。","嗯，今天田裡的草也許就夠吃了。"], reward: jobReward }
    ]
  },
  farm: {
    title: "Help at the Farm",
    questions: [
      { questionType: "sentence-choice", prompt: "I picked twelve carrots and gave five away. How many carrots are left?", promptZh: "我採了十二根紅蘿蔔，送出了五根。還剩幾根？", answer: "Sure — twelve take away five leaves seven carrots.", choices: ["Sure — twelve take away five leaves seven carrots.","OK — I think six carrots are left.","Well, you still have all twelve, right?"], choicesZh: ["好的——十二減五，還剩七根紅蘿蔔。","好——我想還剩六根。","嗯，十二根應該都還在吧？"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The rows are dry. What are we going to do about it?", promptZh: "菜畦很乾。我們接下來要怎麼處理？", answer: "Sure — we are going to water the rows right away.", choices: ["Sure — we are going to water the rows right away.","OK — we can wait and hope for rain tonight.","Well, let's pick everything today before it dries more."], choicesZh: ["好的——我們現在馬上去澆菜畦。","好的——我們可以等等看，希望今晚下雨。","嗯，趁還沒更乾，今天全部採收吧。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The plants are thirsty. Why do we water them?", promptZh: "植物缺水了。為什麼我們要澆水？", answer: "Well, because water helps them grow big and healthy.", choices: ["Well, because water helps them grow big and healthy.","OK — because wet soil is easier to dig.","Sure — because the watering can is already full."], choicesZh: ["嗯，因為水能幫助它們長得又大又健康。","好的——因為濕的土比較好挖。","好啊——因為澆水壺已經裝滿了。"], reward: jobReward }
    ]
  },
  mill: {
    title: "Help at the Mill",
    questions: [
      { questionType: "sentence-choice", prompt: "I had eight sacks, and the cart took three away. How many sacks are left?", promptZh: "我原本有八袋麵粉，推車載走了三袋。還剩幾袋？", answer: "OK — eight take away three leaves five sacks.", choices: ["OK — eight take away three leaves five sacks.","OK — I count four sacks by the door.","Well, all eight sacks are still here, right?"], choicesZh: ["好——八減三，還剩五袋。","好——我數到門邊有四袋。","嗯，八袋應該都還在吧？"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This sack is heavy, and that sack is light. Please help me compare them.", promptZh: "這袋很重，那袋比較輕。請幫我比較它們。", answer: "Sure — this sack is heavier than that one.", choices: ["Sure — this sack is heavier than that one.","Sure — this sack is lighter than that one.","Well, both sacks weigh about the same to me."], choicesZh: ["好的——這袋比那袋重。","好的——這袋比那袋輕。","嗯，兩袋在我看來差不多重。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There is flour on the floor. Why should we sweep it up?", promptZh: "地上有麵粉。為什麼我們該把它掃乾淨？", answer: "Well, because someone could slip on it and fall.", choices: ["Well, because someone could slip on it and fall.","Sure — because we can bake with that flour later.","OK — because sweeping is good exercise for us."], choicesZh: ["嗯，因為有人可能會踩到滑倒。","好啊——因為那些麵粉之後還能拿來烤東西。","好的——因為掃地對我們是很好的運動。"], reward: jobReward }
    ]
  },
  villageHome: {
    title: "Help at the Village Home",
    questions: [
      { questionType: "sentence-choice", prompt: "I had seven apples, and you brought two more. How many apples do we have?", promptZh: "我原本有七顆蘋果，你又帶來兩顆。我們一共有幾顆？", answer: "OK — seven and two more make nine apples.", choices: ["OK — seven and two more make nine apples.","OK — I count eight apples in the bowl.","OK — that makes ten apples, I think."], choicesZh: ["好——七顆加兩顆，一共九顆蘋果。","好——我數到碗裡有八顆。","好——我想應該是十顆。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The porch is dusty. Why should we sweep it today?", promptZh: "門廊有灰塵。為什麼我們今天該打掃？", answer: "Well, because a clean porch is nicer and safer for your visitors.", choices: ["Well, because a clean porch is nicer and safer for your visitors.","OK — because the new broom needs some use.","Sure — because sweeping keeps our hands warm."], choicesZh: ["嗯，因為乾淨的門廊對訪客來說更舒服也更安全。","好的——因為新掃把總得用一用。","好啊——因為掃地可以讓手暖起來。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "You helped me so much today. I have even more work tomorrow — can you come back?", promptZh: "你今天幫了我好多。我明天有更多工作——你能再回來嗎？", answer: "Of course — I'd be glad to come back and help again tomorrow.", choices: ["Of course — I'd be glad to come back and help again tomorrow.","Well, maybe — I will come if I have nothing else to do.","Sure — but only if the work is easy tomorrow."], choicesZh: ["當然——我很樂意明天再回來幫忙。","嗯，可能吧——如果我沒別的事就會來。","好啊——不過明天的工作要簡單一點才行。"], reward: jobReward }
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
      { questionType: "sentence-choice", prompt: "My morning was busy but good. How was yours?", promptZh: "我的早上很忙，但還不錯。你的呢？", answer: "Mine was busy too, but really fun!", choices: ["Mine was busy too, but really fun!","My morning was a little boring, to be honest."], choicesZh: ["我的早上也很忙，但超好玩的！","老實說，我的早上有點無聊。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "I am a little tired after carrying stones all day.", promptZh: "搬了一整天的石頭，我有點累了。", answer: "You worked so hard! You should rest a little.", choices: ["You worked so hard! You should rest a little.","Tired already? Those stones did not look heavy."], choicesZh: ["你好努力工作！你該休息一下了。","這就累了？那些石頭看起來不重呀。"], reward: chatReward }
    ]
  },
  loggingCamp: {
    title: "Chat at the Logging Camp",
    questions: [
      { questionType: "sentence-choice", prompt: "Why did you come to the logging camp, Princess?", promptZh: "公主，你為什麼來伐木營地呢？", answer: "Well, because I wanted to see how you work!", choices: ["Well, because I wanted to see how you work!","Honestly, I was just walking past the camp."], choicesZh: ["嗯，因為我想看看你們怎麼工作！","老實說，我只是剛好路過營地。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "I will stack all these logs before lunch.", promptZh: "我會在午餐前把這些木頭全堆好。", answer: "Sure, I can help you stack them!", choices: ["Sure, I can help you stack them!","Before lunch? Those logs look like a whole day of work."], choicesZh: ["好啊，我可以幫你一起堆！","午餐前？這些木頭看起來要堆一整天吧。"], reward: chatReward }
    ]
  },
  fishingShore: {
    title: "Chat at the Fishing Shore",
    questions: [
      { questionType: "sentence-choice", prompt: "I walked along the shore this morning. What did you do?", promptZh: "我今天早上沿著海岸散步。你做了什麼？", answer: "I explored the village all morning!", choices: ["I explored the village all morning!","I walked nowhere — I slept all morning!"], choicesZh: ["我一整個早上都在探索村莊！","我哪都沒走——我睡了一整個早上！"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The sea was calm and pretty today.", promptZh: "今天的大海平靜又漂亮。", answer: "Yes, the sea was so calm and pretty!", choices: ["Yes, the sea was so calm and pretty!","Really? The sea looked a bit grey to me today."], choicesZh: ["對啊，大海平靜又漂亮！","真的嗎？我今天覺得海看起來灰灰的。"], reward: chatReward }
    ]
  },
  pasture: {
    title: "Chat at the Pasture",
    questions: [
      { questionType: "sentence-choice", prompt: "Why do you like the pasture, Princess?", promptZh: "公主，你為什麼喜歡牧場？", answer: "Well, because the animals are so sweet!", choices: ["Well, because the animals are so sweet!","Hmm, the pasture smells a bit like sheep."], choicesZh: ["嗯，因為這些動物好可愛！","嗯，牧場聞起來有點羊味。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The grass is so green after the rain.", promptZh: "下過雨後，草地好綠。", answer: "Wow, your pasture looks so green today!", choices: ["Wow, your pasture looks so green today!","The rain made the ground too muddy for me."], choicesZh: ["哇，你的牧場今天看起來好綠！","下過雨地上太泥濘了，我不太喜歡。"], reward: chatReward }
    ]
  },
  farm: {
    title: "Chat at the Farm",
    questions: [
      { questionType: "sentence-choice", prompt: "How do you feel on the farm today?", promptZh: "你今天在農場感覺如何？", answer: "I feel happy — the farm is lovely today!", choices: ["I feel happy — the farm is lovely today!","A bit tired — the farm is a lot of work today."], choicesZh: ["我好開心——今天的農場好美！","有點累——今天農場的工作好多。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "These vegetables look fresh, right?", promptZh: "這些蔬菜看起來很新鮮，對吧？", answer: "Wow, your vegetables look so fresh!", choices: ["Wow, your vegetables look so fresh!","Hmm, the vegetables at the market looked fresher."], choicesZh: ["哇，你的蔬菜看起來好新鮮！","嗯，市場的蔬菜看起來更新鮮耶。"], reward: chatReward }
    ]
  },
  mill: {
    title: "Chat at the Mill",
    questions: [
      { questionType: "sentence-choice", prompt: "Why is the mill one of your favourite places?", promptZh: "為什麼磨坊是你最喜歡的地方之一？", answer: "Well, because the fresh flour smells so warm and sweet!", choices: ["Well, because the fresh flour smells so warm and sweet!","Honestly, the mill is a bit dusty for me."], choicesZh: ["嗯，因為新鮮麵粉聞起來又暖又香甜！","老實說，磨坊對我來說有點多灰塵。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Thank you for helping me near the mill today.", promptZh: "謝謝你今天在磨坊旁幫我。", answer: "Any time! Helping at the mill was fun.", choices: ["Any time! Helping at the mill was fun.","The mill work was harder than I thought!"], choicesZh: ["隨時樂意！在磨坊幫忙很好玩。","磨坊的工作比我想的還累！"], reward: chatReward }
    ]
  },
  villageHome: {
    title: "Chat at the Village Home",
    questions: [
      { questionType: "sentence-choice", prompt: "Why did you come to visit me, Princess?", promptZh: "公主，你為什麼來看我呢？", answer: "I just came to see you, Grandma!", choices: ["I just came to see you, Grandma!","I came because it started raining, Grandma."], choicesZh: ["奶奶，我就是特地來看你的呀！","奶奶，我是因為外面開始下雨才進來的。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "My little home is nice and warm today, right?", promptZh: "我的小屋今天很溫暖，對吧？", answer: "Your home is so warm and cosy!", choices: ["Your home is so warm and cosy!","It is warm, but my castle room is warmer."], choicesZh: ["你的家好溫暖、好舒服！","是很溫暖啦，不過我城堡的房間更暖。"], reward: chatReward }
    ]
  },
  workwearStall: {
    title: "Chat at the Workwear Stall",
    questions: [
      { questionType: "sentence-choice", prompt: "Why are these clothes good for country work?", promptZh: "為什麼這些衣服適合鄉間工作？", answer: "Well, because they are strong and easy to move in!", choices: ["Well, because they are strong and easy to move in!","Hmm, these clothes look a bit plain for a princess."], choicesZh: ["嗯，因為它們又耐穿又好活動！","嗯，這些衣服對公主來說有點樸素。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "These clothes look ready for the fields.", promptZh: "這些衣服看起來已經準備好下田了。", answer: "Wow, they look strong and ready for anything!", choices: ["Wow, they look strong and ready for anything!","The fields will make these clothes dirty so fast."], choicesZh: ["哇，它們看起來很耐穿，什麼都不怕！","下田一下子就會把這些衣服弄髒了啦。"], reward: chatReward }
    ]
  },
});
//#endregion 生活聊天題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
// issue #149：travelLine／shopGreeting 改為角色第一人稱對公主發話，並補中文（travelLineZh／shopGreetingZh）。
export const ruralSceneConfigs = mergeLessons(mergeLessons({
  ruralExit: { ...ruralProductionArt("farm"), scene: "scene-rural-exit", npcClass: "npc-none", npc: "Rural Sign", travelAction: "World Map", travelLine: "Princess, this road returns to the kingdom world map.", travelLineZh: "公主，這條路會回到王國世界地圖。" },
  mine: { ...ruralProductionArt("mine"), scene: "scene-rural-mine", npc: "Miner Gemma", npcImage: npcImage("miner-gemma"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Hello, Princess! I found some shiny stones this morning.", travelLineZh: "你好，公主！我今天早上挖到一些亮晶晶的石頭。" },
  loggingCamp: { ...ruralProductionArt("logging"), scene: "scene-rural-logging", npc: "Logger Rowan", npcImage: npcImage("logger-rowan"), npcNaturalHeightCm: 178, travelAction: "Visit", travelLine: "Good morning, Princess! We are cutting logs by the cabin.", travelLineZh: "早安，公主！我們正在小屋旁鋸木頭。" },
  fishingShore: { ...ruralProductionArt("fishing"), scene: "scene-rural-fishing", npc: "Fisher Nami", npcImage: npcImage("fisher-nami"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Hello, Princess! The nets came back full today.", travelLineZh: "你好，公主！今天的漁網滿載而歸。" },
  pasture: { ...ruralProductionArt("pasture"), scene: "scene-rural-pasture", npc: "Farmer Theo", npcImage: npcImage("farmer-theo"), npcNaturalHeightCm: 175, travelAction: "Visit", travelLine: "Hi, Princess! The sheep are all out in the sun today.", travelLineZh: "嗨，公主！今天羊兒都在外面曬太陽。" },
  farm: { ...ruralProductionArt("farm"), scene: "scene-rural-farm", npc: "Auntie Pom", npcImage: npcImage("auntie-pom"), npcNaturalHeightCm: 155, travelAction: "Visit", travelLine: "Hello, Princess! The carrots came up big this year.", travelLineZh: "你好，公主！今年的紅蘿蔔長得特別大。" },
  mill: { ...ruralProductionArt("mill"), scene: "scene-rural-mill", npc: "Miller Bell", npcImage: npcImage("miller-bell"), npcNaturalHeightCm: 162, travelAction: "Visit", travelLine: "Good day, Princess! The mill is grinding fresh flour today.", travelLineZh: "日安，公主！磨坊今天正在磨新鮮麵粉。" },
  workwearStall: { ...ruralShopArt("workwear-stall"), scene: "scene-rural-workwear-stall", npc: "Workwear Keeper", npcImage: npcImage("workwear-stall-keeper"), npcNaturalHeightCm: 168, travelAction: "Shop", travelLine: "Hello, Princess! Come see today's sturdy country wear.", travelLineZh: "你好，公主！來看看今天耐穿的鄉村服飾吧。", shopGreeting: "Take your time, Princess — kerchief hairstyles, apron dresses, wooden clogs, and warm country accessories.", shopGreetingZh: "公主，慢慢看——頭巾髮型、圍裙裙裝、木鞋，還有溫暖的鄉村配件。" },
  villageHome: { ...ruralProductionArt("home"), scene: "scene-rural-home", npc: "Grandma Fina", npcImage: npcImage("grandma-fina"), npcNaturalHeightCm: 148, travelAction: "Visit", travelLine: "Hello, dear! I just made apple jam this morning.", travelLineZh: "你好呀，親愛的！我今天早上剛做好蘋果果醬。" }
}, ruralLessonBank, { area: "rural", vocabProfile: ruralVocabularyProfile.id }),
  ruralChatLessonBank, { area: "rural", vocabProfile: ruralVocabularyProfile.id }, "chatLesson");
//#endregion 對話場景設定
