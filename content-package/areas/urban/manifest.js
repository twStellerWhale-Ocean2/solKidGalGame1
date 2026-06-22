//#region 匯入共用工具
// 將題庫清單轉成遊戲執行時需要的 lessons（課程資料）與 quest templates（任務模板）。
import { mergeLessons } from "../_shared/lesson-helpers.js";
//#endregion 匯入共用工具

//#region 素材路徑工具
// 所有本地區圖片路徑集中在這裡；換素材或快取版本參數時優先改這段。
const npcImage = (name) => `content-package/areas/urban/assets/characters/${name}.webp?v=20260606-character-scale-r1`;
const sceneVersion = "20260606-issue66-adv-scenes-r1";
const sceneArt = (src, options = {}) => ({ sceneArt: { src, tone: "urban", ...options } });
const singleSceneArt = (name, options = {}) => sceneArt(`content-package/areas/urban/assets/scenes/${name}-1024.webp?v=${sceneVersion}`, options);
const urbanShopArt = (name) => singleSceneArt(name, { tone: "shop" });
const civicSceneArt = (name) => singleSceneArt(name);
//#endregion 素材路徑工具

//#region 英文等級與獎勵設定
// 定義本地區使用的英文程度、顯示名稱與答題獎勵。
export const urbanVocabularyProfile = Object.freeze({
  id: "cambridge-pre-a1-starters",
  label: "Cambridge Pre-A1 Starters",
  levelLabel: "Cambridge Starters",
  rewardCoins: 105,
  note: "Urban town places use short Starters-style words and classroom-safe sentences."
});
//#endregion 英文等級與獎勵設定

//#region 地圖與地點設定
// area 是地圖的主設定；新增地圖圖示或改座標主要看 nodes 與 locations。
export const urbanArea = Object.freeze({
  id: "urban",
  label: "Urban",
  view: "map",
  mapImage: "content-package/areas/urban/assets/map-1536.webp?v=20260606-issue66-map-contract-r1",
  imageSize: { width: 1536, height: 1536 },
  vocabularyProfile: urbanVocabularyProfile,
  // nodes 控制地圖上的路網與圖示座標；x / y 是相對地圖寬高的百分比。
  nodes: {
    castleRoom: { id: "castleRoom", label: "Castle Stairway", x: 50, y: 16.5, links: ["garden", "schoolClassroom", "library", "temple", "administration", "market"] },
    garden: { id: "garden", label: "Castle Garden", x: 49.5, y: 30.6, links: ["castleRoom", "market", "library", "temple"] },
    schoolClassroom: { id: "schoolClassroom", label: "School Classroom", x: 28.8, y: 19.9, links: ["castleRoom", "library", "market"] },
    library: { id: "library", label: "Library", x: 18.7, y: 34.1, links: ["schoolClassroom", "castleRoom", "garden"] },
    temple: { id: "temple", label: "Temple", x: 70.4, y: 24.3, links: ["castleRoom", "garden", "administration", "boutique"] },
    administration: { id: "administration", label: "Administration Building", x: 85.3, y: 34.8, links: ["castleRoom", "temple", "boutique"] },
    market: { id: "market", label: "Market Square", x: 45.5, y: 48.6, links: ["garden", "schoolClassroom", "harbor", "port"] },
    boutique: { id: "boutique", label: "Dress Boutique", x: 69.1, y: 46.3, links: ["administration", "temple"] },
    harbor: { id: "harbor", label: "Fish Shop", x: 30.1, y: 45.1, links: ["market", "port"] },
    port: { id: "port", label: "Harbor Port", x: 38.3, y: 74.4, links: ["market", "harbor", "lighthouse"] },
    lighthouse: { id: "lighthouse", label: "Lighthouse", x: 75.8, y: 78.4, links: ["port"] }
  },
  // locations 控制地圖圖示進入後的場景、NPC、商店與提示文字。
  locations: [
    { id: "luminaraCastle", area: "urban", node: "castleRoom", label: "Luminara Castle", icon: "🏰", npcClass: "npc-none", npc: "Gate Guard", kind: "gate", markerStyle: "portal", portalId: "castleStair", hint: "Open the kingdom world map." },
    { id: "garden", area: "urban", node: "garden", label: "Castle Garden", icon: "🌷", npc: "Mira", scene: "scene-garden", npcImage: npcImage("mira"), hint: "The garden is quiet. A small cat may be hiding near the roses." },
    { id: "schoolClassroom", area: "urban", node: "schoolClassroom", label: "School Classroom", icon: "🏫", npc: "Teacher Bell", scene: "scene-urban-school", npcImage: npcImage("teacher-bell"), hint: "Teacher Bell has a short classroom sentence." },
    { id: "library", area: "urban", node: "library", label: "Library", icon: "📚", npc: "Librarian Nola", scene: "scene-urban-library", npcImage: npcImage("librarian-nola"), hint: "The library is quiet and full of books." },
    { id: "temple", area: "urban", node: "temple", label: "Temple", icon: "🕯", npc: "Sister Luma", scene: "scene-urban-temple", npcImage: npcImage("sister-luma"), hint: "The temple flowers need a gentle helper." },
    { id: "administration", area: "urban", node: "administration", label: "Administration Building", icon: "🏛", npc: "Clerk Otto", scene: "scene-urban-administration", npcImage: npcImage("clerk-otto"), hint: "The town office has notes and maps to sort." },
    { id: "market", area: "urban", node: "market", label: "Market Square", icon: "🥖", npc: "Auntie Pom", scene: "scene-market", npcImage: npcImage("auntie-pom-market"), hint: "The market has warm bread, fruit, and kind food words." },
    { id: "harbor", area: "urban", node: "harbor", label: "Fish Shop", icon: "🐟", npc: "Nami", scene: "scene-harbor", npcImage: npcImage("nami"), hint: "The fish shop has fresh fish for dinner." },
    { id: "port", area: "urban", node: "port", label: "Harbor Port", icon: "⚓", npc: "Dock Guide", scene: "scene-port", npcImage: npcImage("dock-guide"), hint: "The docks are ready for boats and sea trips." },
    { id: "boutique", area: "urban", node: "boutique", label: "Dress Boutique", icon: "👗", npc: "Rena", scene: "scene-urban-dress-boutique", npcImage: npcImage("rena"), shopCategories: ["outfit", "shoes", "accessories"], defaultCategory: "outfit", hint: "Rena's boutique now carries every urban outfit — outfits, shoes and accessories." },
    { id: "lighthouse", area: "urban", node: "lighthouse", label: "Lighthouse", icon: "🗼", npc: "Captain Sol", scene: "scene-lighthouse", npcImage: npcImage("captain-sol"), hint: "The lighthouse watches the sea before ships sail." }
  ],
  // actors 是地圖上的動態環境效果，不是可點擊地點。
  actors: [],
  defaultNode: "garden",
  enabled: true
});
//#endregion 地圖與地點設定

//#region 場景自帶題庫（issue #96 結構；issue #149 全量改寫：角色第一人稱、prompt 即台詞、選項即公主回應、無 opening/ending）
// urbanLessonBank：以 place 為鍵的「打工任務」題庫（答對得 coins＝勞動所得）。
// issue #149：Starters 分級；每場景 3 題、每題 3 選項；prompt＝角色第一人稱請求／任務、choices＝公主回應；數學包進角色任務情境。
const jobReward = { coins: 105 };
const urbanLessonBank = Object.freeze({
  garden: {
    title: "Help in the Castle Garden",
    questions: [
      { questionType: "sentence-choice", prompt: "My cat is hiding and she loves warm, soft places. Where should we look first?", promptZh: "我的貓躲起來了，她喜歡溫暖柔軟的地方。我們應該先找哪裡？", answer: "Sure, let's look under the soft rose bushes first.", choices: ["Sure, let's look under the soft rose bushes first.","Sure, let's look on the cold stone wall first.","Sure, let's look in the wet water bucket first."], choicesZh: ["好啊，我們先找柔軟的玫瑰叢下面。","好啊，我們先找冰冷的石牆上。","好啊，我們先找濕濕的水桶裡。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I need three red roses and five pink roses for a bouquet. How many roses is that?", promptZh: "我做花束需要三朵紅玫瑰和五朵粉紅玫瑰。一共是幾朵？", answer: "OK, let me add them up — that is eight roses.", choices: ["OK, let me add them up — that is eight roses.","OK, let me add them up — that is six roses.","OK, let me add them up — that is two roses."], choicesZh: ["好，我來加加看——一共是八朵玫瑰。","好，我來加加看——一共是六朵玫瑰。","好，我來加加看——一共是兩朵玫瑰。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "My white flowers did not sell yesterday. Can you give me some advice?", promptZh: "我的白花昨天沒賣完。可以給我一些建議嗎？", answer: "Sure, maybe you can sell some other flowers too.", choices: ["Sure, maybe you can sell some other flowers too.","Sure, maybe you can buy lots more white flowers.","Sure, maybe you can stop selling flowers."], choicesZh: ["當然，也許你可以也賣一些別種花。","當然，也許你可以多買很多白花。","當然，也許你可以不要再賣花了。"], reward: jobReward }
    ]
  },
  schoolClassroom: {
    title: "Help in the School Classroom",
    questions: [
      { questionType: "sentence-choice", prompt: "We have only ten books but twelve children today. What should we do?", promptZh: "我們今天只有十本書，卻有十二個孩子。我們該怎麼辦？", answer: "OK, two children can share one book.", choices: ["OK, two children can share one book.","OK, we can send two children away.","OK, we can throw two books away."], choicesZh: ["好的，兩個孩子可以共讀一本書。","好的，我們可以叫兩個孩子離開。","好的，我們可以丟掉兩本書。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are six children here and four children there. Please count the class.", promptZh: "這裡有六個孩子，那裡有四個孩子。請幫我數全班有幾個孩子。", answer: "OK, let me count! There are ten children.", choices: ["OK, let me count! There are six children.","OK, let me count! There are ten children.","OK, let me count! There are four children."], choicesZh: ["好，我來數數！有六個孩子。","好，我來數數！有十個孩子。","好，我來數數！有四個孩子。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The class is reading. Please remind everyone softly.", promptZh: "全班正在閱讀。請輕聲提醒大家。", answer: "Sure! Please be quiet.", choices: ["Sure! Run in the classroom.","Sure! Put the boat on the desk.","Sure! Please be quiet."], choicesZh: ["好的！在教室裡跑。","好的！把船放在書桌上。","好的！請保持安靜。"], reward: jobReward }
    ]
  },
  library: {
    title: "Help in the Library",
    questions: [
      { questionType: "sentence-choice", prompt: "Should I put this story book on the high shelf or the low shelf for small children?", promptZh: "這本故事書我該放在高的書架，還是給小小孩的矮書架？", answer: "OK, the low shelf is better for small children.", choices: ["OK, the low shelf is better for small children.","OK, let's put it on the highest shelf.","OK, let's leave it on the wet floor."], choicesZh: ["好的，矮書架比較適合小小孩。","好的，我們把它放到最高的架子上。","好的，我們把它留在濕地板上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I see two blue books and four green books. Please help me count them.", promptZh: "我看到兩本藍色書和四本綠色書。請幫我數一共有幾本。", answer: "OK, let me count! There are six books.", choices: ["OK, let me count! There are four books.","OK, let me count! There are six books.","OK, let me count! There are two books."], choicesZh: ["好，我來數數！有四本書。","好，我來數數！有六本書。","好，我來數數！有兩本書。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A child is loud. Please help me remind the child.", promptZh: "有個孩子太大聲了。請幫我提醒他。", answer: "Sure! Please speak softly.", choices: ["Sure! Please run fast.","Sure! Please buy fish.","Sure! Please speak softly."], choicesZh: ["好的！請跑快一點。","好的！請買魚。","好的！請輕聲說話。"], reward: jobReward }
    ]
  },
  temple: {
    title: "Help at the Temple",
    questions: [
      { questionType: "sentence-choice", prompt: "These white flowers look dry. How much water should I give them?", promptZh: "這些白花看起來很乾。我該給它們多少水？", answer: "Well, just a little water is best for them.", choices: ["Well, just a little water is best for them.","Well, let's pour the whole bucket on them.","Well, let's give them no water at all."], choicesZh: ["嗯，給一點點水對它們最好。","嗯，我們把整桶水都倒上去吧。","嗯，我們完全不要給它們水。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are two candles here and two candles there. Please help me count them.", promptZh: "這裡有兩支蠟燭，那裡有兩支蠟燭。請幫我數一共有幾支。", answer: "OK, let me count! There are four candles.", choices: ["OK, let me count! There are two candles.","OK, let me count! There are four candles.","OK, let me count! There are six candles."], choicesZh: ["好，我來數數！有兩支蠟燭。","好，我來數數！有四支蠟燭。","好，我來數數！有六支蠟燭。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Some visitors are getting noisy in the quiet temple. What should I gently ask them to do?", promptZh: "有些訪客在安靜的神殿裡變得吵鬧。我該溫和地請他們做什麼？", answer: "Sure, let's kindly ask them to speak in soft voices.", choices: ["Sure, let's kindly ask them to speak in soft voices.","Sure, let's tell them to shout even louder.","Sure, let's start a drum parade inside."], choicesZh: ["好啊，我們溫和地請他們小聲說話。","好啊，我們叫他們喊得更大聲。","好啊，我們在裡面辦個打鼓遊行。"], reward: jobReward }
    ]
  },
  administration: {
    title: "Help at the Administration Building",
    questions: [
      { questionType: "sentence-choice", prompt: "These notes are important. Where should I keep them safe?", promptZh: "這些便條很重要。我該放在哪裡才安全？", answer: "OK, let's lock them in the box.", choices: ["OK, let's lock them in the box.","OK, let's leave them on the floor.","OK, let's throw them out the window."], choicesZh: ["好的，我們把它們鎖進盒子裡。","好的，我們把它們留在地上。","好的，我們把它們丟出窗外。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I have three stamps here and four stamps there. Please help me count them.", promptZh: "我這裡有三張郵票，那裡有四張郵票。請幫我數一共有幾張。", answer: "OK, let me count! There are seven stamps.", choices: ["OK, let me count! There are four stamps.","OK, let me count! There are seven stamps.","OK, let me count! There are three stamps."], choicesZh: ["好，我來數數！有四張郵票。","好，我來數數！有七張郵票。","好，我來數數！有三張郵票。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I lost the town map. Where should we look for it first?", promptZh: "我把城鎮地圖弄丟了。我們該先找哪裡？", answer: "Sure, let's look on the busy desk first.", choices: ["Sure, let's look on the busy desk first.","Sure, let's look outside in the rain first.","Sure, let's stop looking and go home."], choicesZh: ["好啊，我們先找忙亂的書桌上。","好啊，我們先去外面雨中找。","好啊，我們別找了直接回家吧。"], reward: jobReward }
    ]
  },
  market: {
    title: "Help at Market Square",
    questions: [
      { questionType: "sentence-choice", prompt: "A girl wants bread. Please ask her kindly.", promptZh: "一個女孩想買麵包。請親切地問她。", answer: "Sure! How many do you want?", choices: ["Sure! How many do you want?","Sure! Where is the wet dock?","Sure! Please put the candle on ice."], choicesZh: ["好的！你想要幾個？","好的！濕的碼頭在哪裡？","好的！請把蠟燭放在冰上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are three apples and two pears. Please help me count all the fruits.", promptZh: "有三顆蘋果和兩顆梨子。請幫我數一共有幾個水果。", answer: "OK, let me count! There are five fruits.", choices: ["OK, let me count! There are three fruits.","OK, let me count! There are five fruits.","OK, let me count! There are two fruits."], choicesZh: ["好，我來數數！有三個水果。","好，我來數數！有五個水果。","好，我來數數！有兩個水果。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A customer is leaving. Please say goodbye kindly.", promptZh: "一位客人要離開了。請親切地道別。", answer: "Thank you! Come again!", choices: ["Thank you! The fish is under the roses.","Thank you! Run in the market.","Thank you! Come again!"], choicesZh: ["謝謝！魚在玫瑰下面。","謝謝！在市集裡跑。","謝謝！歡迎再來！"], reward: jobReward }
    ]
  },
  harbor: {
    title: "Help at the Fish Shop",
    questions: [
      { questionType: "sentence-choice", prompt: "This box has four fish, and that box has two fish. Please help me count all the fish.", promptZh: "這個箱子有四條魚，那個箱子有兩條魚。請你幫我計算一共有幾條魚。", answer: "Sure thing! I counted six fish for you.", choices: ["Sure thing! I counted six fish for you.","Sure thing! I counted four flowers for you.","Sure thing! I put the fish on the table."], choicesZh: ["沒問題！我幫你算好了，一共有六條魚。","沒問題！我幫你算好了，一共有四朵花。","沒問題！我把魚放在桌上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This big fish must stay fresh until lunch. Where should I put it?", promptZh: "這條大魚要保持新鮮到午餐。我該把它放在哪裡？", answer: "OK, let's put it on the cold ice.", choices: ["OK, let's put it on the cold ice.","OK, let's put it in the warm sun.","OK, let's put it on the dry shelf."], choicesZh: ["好的，我們把它放在冰冷的冰上。","好的，我們把它放在溫暖的太陽下。","好的，我們把它放在乾燥的架子上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A cook wants the freshest fish. Which one should I show her?", promptZh: "一位廚師想要最新鮮的魚。我該給她看哪一條？", answer: "Sure, show her the fish caught this morning.", choices: ["Sure, show her the fish caught this morning.","Sure, show her the fish from last week.","Sure, show her the plastic toy fish."], choicesZh: ["好啊，給她看今天早上捕到的魚。","好啊，給她看上禮拜的魚。","好啊，給她看塑膠玩具魚。"], reward: jobReward }
    ]
  },
  port: {
    title: "Help at Harbor Port",
    questions: [
      { questionType: "sentence-choice", prompt: "There are two boats at the left dock and two boats at the right dock. Please help me count them.", promptZh: "左邊碼頭有兩艘船，右邊碼頭有兩艘船。請幫我數一共有幾艘。", answer: "OK, let me count! There are four boats.", choices: ["OK, let me count! There are four boats.","OK, let me count! There are two boats.","OK, let me count! There are six boats."], choicesZh: ["好，我來數數！有四艘船。","好，我來數數！有兩艘船。","好，我來數數！有六艘船。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The captain's big ship is coming in. Which dock should I send him to?", promptZh: "船長的大船要靠岸了。我該請他停到哪個碼頭？", answer: "Sure, send him to the big empty dock.", choices: ["Sure, send him to the big empty dock.","Sure, send him to the tiny crowded dock.","Sure, send him onto the rocky beach."], choicesZh: ["好啊，請他停到那個又大又空的碼頭。","好啊，請他停到那個又小又擠的碼頭。","好啊，請他直接停到滿是礁石的沙灘上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The dock is busy. Please help me remind the children.", promptZh: "碼頭很忙。請幫我提醒孩子們。", answer: "OK! Do not run here.", choices: ["OK! Please jump on the boat.","OK! Please put books in the sea.","OK! Do not run here."], choicesZh: ["好的！請跳上船。","好的！請把書放進海裡。","好的！不要在這裡跑。"], reward: jobReward }
    ]
  },
  boutique: {
    title: "Help at the Dress Boutique",
    questions: [
      { questionType: "sentence-choice", prompt: "Where should I hang this pretty pink dress so customers can see it?", promptZh: "這件漂亮的粉紅洋裝，我該掛在哪裡讓客人看得到？", answer: "OK, let's hang it on the front rail.", choices: ["OK, let's hang it on the front rail.","OK, let's hide it under the table.","OK, let's leave it on the dusty floor."], choicesZh: ["好的，我們把它掛在前面的衣架上。","好的，我們把它藏在桌子底下。","好的，我們把它留在滿是灰塵的地板上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are four dresses here and three dresses there. Please help me count them.", promptZh: "這裡有四件洋裝，那裡有三件洋裝。請幫我數一共有幾件。", answer: "OK, let me count! There are seven dresses.", choices: ["OK, let me count! There are four dresses.","OK, let me count! There are seven dresses.","OK, let me count! There are three dresses."], choicesZh: ["好，我來數數！有四件洋裝。","好，我來數數！有七件洋裝。","好，我來數數！有三件洋裝。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A girl likes the blue dress. Please help her kindly.", promptZh: "一個女孩喜歡藍色洋裝。請親切地幫她。", answer: "Of course! You can try it on.", choices: ["Of course! The blue dress is a fish.","Of course! Please run in the shop.","Of course! You can try it on."], choicesZh: ["當然！藍色洋裝是一條魚。","當然！請在店裡跑。","當然！你可以試穿看看。"], reward: jobReward }
    ]
  },
  lighthouse: {
    title: "Help at the Lighthouse",
    questions: [
      { questionType: "sentence-choice", prompt: "It is getting dark. Please help me with the light.", promptZh: "天快黑了。請幫我處理燈。", answer: "OK! I will turn on the light.", choices: ["OK! I will turn on the light.","OK! I will turn on the fish.","OK! I will put the light under the bread."], choicesZh: ["好的！我會打開燈。","好的！我會打開魚。","好的！我會把燈放在麵包下面。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There is one ship near the rocks and one ship near the dock. Please help me count them.", promptZh: "礁石附近有一艘船，碼頭附近有一艘船。請幫我數一共有幾艘。", answer: "OK, let me count! There are two ships.", choices: ["OK, let me count! There is one ship.","OK, let me count! There are two ships.","OK, let me count! There are four ships."], choicesZh: ["好，我來數數！有一艘船。","好，我來數數！有兩艘船。","好，我來數數！有四艘船。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The sea is calm now. Please tell the sailors.", promptZh: "現在海面很平靜。請告訴水手們。", answer: "Sure! The sea is calm today.", choices: ["Sure! The shelf is tidy now.","Sure! The shoes are bigger.","Sure! The sea is calm today."], choicesZh: ["好的！架子現在很整齊。","好的！鞋子比較大。","好的！今天海面很平靜。"], reward: jobReward }
    ]
  }
});
//#endregion 場景自帶題庫

//#region 生活聊天題庫（issue #135 spec#11；issue #149 全量改寫：角色第一人稱、無 opening/ending）
// urbanChatLessonBank：各 NPC 場景的「生活聊天」題組——角色以第一人稱對公主寒暄、提問；每場景 2 題、每題 2 選項。
const chatReward = { coins: 0 };
const urbanChatLessonBank = Object.freeze({
  garden: {
    title: "Chat in the Castle Garden",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like the pink roses in my garden?", promptZh: "你喜歡我花園裡的粉紅玫瑰嗎？", answer: "Yes, I really love these pink roses!", choices: ["Yes, I really love these pink roses!","Sorry, the garden gate is locked."], choicesZh: ["喜歡，我超愛這些粉紅玫瑰！","抱歉，花園的門鎖住了。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The little cat is sleeping by the flowers.", promptZh: "小貓正在花叢旁邊睡覺。", answer: "Aww, she looks so peaceful!", choices: ["Aww, she looks so peaceful!","Quick, pull up all the flowers!"], choicesZh: ["啊，她看起來好安詳！","快，把所有的花都拔掉！"], reward: chatReward }
    ]
  },
  schoolClassroom: {
    title: "Chat in the School Classroom",
    questions: [
      { questionType: "sentence-choice", prompt: "Good morning, Princess.", promptZh: "早安，公主。", answer: "Good morning, Teacher! I am ready.", choices: ["Good morning, Teacher! I am ready.","Sorry, I am not ready for class yet."], choicesZh: ["早安，老師！我準備好了。","抱歉，我還沒準備好上課。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "How do you feel today?", promptZh: "你今天感覺怎麼樣？", answer: "Oh, I am very happy today!", choices: ["Hmm, I do not feel happy today.","Oh, I am very happy today!"], choicesZh: ["嗯，我今天覺得不太開心。","喔，我今天超開心！"], reward: chatReward }
    ]
  },
  library: {
    title: "Chat in the Library",
    questions: [
      { questionType: "sentence-choice", prompt: "What books do you like, Princess?", promptZh: "公主，你喜歡什麼書？", answer: "Oh, I love story books!", choices: ["Oh, I love story books!","Sorry, I do not like these books."], choicesZh: ["喔，我超愛故事書！","抱歉，我不喜歡這些書。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "We speak softly in the library.", promptZh: "我們在圖書館裡輕聲說話。", answer: "OK, I will speak softly.", choices: ["No, I want to speak loudly in the library.","OK, I will speak softly."], choicesZh: ["不要，我想在圖書館裡大聲說話。","好的，我會輕聲說話。"], reward: chatReward }
    ]
  },
  temple: {
    title: "Chat at the Temple",
    questions: [
      { questionType: "sentence-choice", prompt: "How do you feel here, Princess?", promptZh: "公主，你在這裡感覺如何？", answer: "I feel so calm here.", choices: ["I feel so calm here.","I feel a bit noisy here."], choicesZh: ["我在這裡覺得好平靜。","我在這裡覺得有點吵。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "These flowers smell sweet.", promptZh: "這些花聞起來很香。", answer: "Oh, the flowers are lovely!", choices: ["Sorry, these flowers smell bad.","Oh, the flowers are lovely!"], choicesZh: ["抱歉，這些花聞起來很難聞。","喔，這些花好美！"], reward: chatReward }
    ]
  },
  administration: {
    title: "Chat at the Administration Building",
    questions: [
      { questionType: "sentence-choice", prompt: "Nice to meet you, Princess.", promptZh: "很高興見到你，公主。", answer: "Nice to meet you too, Otto!", choices: ["Nice to meet you too, Otto!","Sorry, I do not want to meet you."], choicesZh: ["我也很高興見到你，奧托！","抱歉，我不想見你。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Are you busy now?", promptZh: "你現在忙嗎？", answer: "No, I am free right now!", choices: ["Yes, I am very busy right now.","No, I am free right now!"], choicesZh: ["對，我現在很忙。","不忙，我現在有空！"], reward: chatReward }
    ]
  },
  market: {
    title: "Chat at Market Square",
    questions: [
      { questionType: "sentence-choice", prompt: "Are you hungry, Princess?", promptZh: "公主，你餓了嗎？", answer: "Yes, just a little!", choices: ["Yes, just a little!","No, I am not hungry at all."], choicesZh: ["對啊，有一點點！","不，我一點也不餓。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "This bread smells good.", promptZh: "這個麵包聞起來很香。", answer: "Thank you! It smells so good.", choices: ["Sorry, this bread smells strange.","Thank you! It smells so good."], choicesZh: ["抱歉，這個麵包聞起來怪怪的。","謝謝！聞起來好香。"], reward: chatReward }
    ]
  },
  harbor: {
    title: "Chat at the Fish Shop",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like the sea, Princess?", promptZh: "公主，你喜歡大海嗎？", answer: "Yes, I really like the sea.", choices: ["Yes, I really like the sea.","No, I do not like the sea."], choicesZh: ["喜歡，我很喜歡大海。","不，我不喜歡大海。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The fish are fresh today.", promptZh: "今天的魚很新鮮。", answer: "Wow, your fish look so fresh!", choices: ["Hmm, these fish do not look fresh.","Wow, your fish look so fresh!"], choicesZh: ["嗯，這些魚看起來不太新鮮。","哇，你的魚看起來好新鮮！"], reward: chatReward }
    ]
  },
  port: {
    title: "Chat at Harbor Port",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like the sea, Princess?", promptZh: "公主，你喜歡大海嗎？", answer: "Yes, I love the sea so much!", choices: ["Yes, I love the sea so much!","No, the sea is too cold for me."], choicesZh: ["對啊，我超愛大海！","不，大海對我來說太冷了。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Have a safe trip, Princess.", promptZh: "祝你旅途平安，公主。", answer: "Thank you! Have a good day.", choices: ["Oh no, I am scared of this trip.","Thank you! Have a good day."], choicesZh: ["喔不，我好怕這趟旅程。","謝謝！祝你有美好的一天。"], reward: chatReward }
    ]
  },
  boutique: {
    title: "Chat at the Dress Boutique",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like this pink dress?", promptZh: "你喜歡這件粉紅色洋裝嗎？", answer: "I love this pink dress!", choices: ["I love this pink dress!","Sorry, I do not like this dress."], choicesZh: ["我好愛這件粉紅洋裝！","抱歉，我不喜歡這件洋裝。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Thank you for visiting my shop.", promptZh: "謝謝你來我的店。", answer: "Wow, your shop is so pretty!", choices: ["Sorry, your shop is a bit messy.","Wow, your shop is so pretty!"], choicesZh: ["抱歉，你的店有點亂。","哇，你的店好漂亮！"], reward: chatReward }
    ]
  },
  lighthouse: {
    title: "Chat at the Lighthouse",
    questions: [
      { questionType: "sentence-choice", prompt: "Can you see the sea, Princess?", promptZh: "公主，你看得到大海嗎？", answer: "Yes, it is so beautiful!", choices: ["Yes, it is so beautiful!","No, the fog hides the sea today."], choicesZh: ["看得到，它好美！","不，今天的霧把海遮住了。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Good night, Princess.", promptZh: "晚安，公主。", answer: "Good night, Captain!", choices: ["It is too early to say good night.","Good night, Captain!"], choicesZh: ["現在說晚安還太早了。","晚安，船長！"], reward: chatReward }
    ]
  }
});
//#endregion 生活聊天題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
// issue #149：travelLine／shopGreeting 改為角色第一人稱對公主發話，並補中文（travelLineZh／shopGreetingZh）。
export const urbanSceneConfigs = mergeLessons(mergeLessons({
  luminaraCastle: { ...singleSceneArt("garden"), scene: "scene-luminara-castle", npcClass: "npc-garden", npc: "Gate Guard", travelAction: "World Map", travelLine: "Princess, the castle stair leads to the world map.", travelLineZh: "公主，城堡階梯通往世界地圖。" },
  garden: { ...singleSceneArt("garden"), scene: "scene-garden", npc: "Mira", npcImage: npcImage("mira"), npcNaturalHeightCm: 130, travelAction: "Visit", travelLine: "Hello, my dear. I am watering the roses.", travelLineZh: "你好，親愛的。我正在澆玫瑰。" },
  schoolClassroom: { ...civicSceneArt("school-classroom"), scene: "scene-urban-school", npc: "Teacher Bell", npcImage: npcImage("teacher-bell"), npcNaturalHeightCm: 165, travelAction: "Visit", travelLine: "Good morning, Princess. Welcome to my classroom.", travelLineZh: "早安，公主。歡迎來到我的教室。" },
  library: { ...civicSceneArt("library"), scene: "scene-urban-library", npc: "Librarian Nola", npcImage: npcImage("librarian-nola"), npcNaturalHeightCm: 162, travelAction: "Visit", travelLine: "Hello, Princess. Welcome to the quiet library.", travelLineZh: "你好，公主。歡迎來到安靜的圖書館。" },
  temple: { ...civicSceneArt("temple"), scene: "scene-urban-temple", npc: "Sister Luma", npcImage: npcImage("sister-luma"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Good day, Princess. Welcome to the calm temple.", travelLineZh: "日安，公主。歡迎來到平靜的神殿。" },
  administration: { ...civicSceneArt("administration"), scene: "scene-urban-administration", npc: "Clerk Otto", npcImage: npcImage("clerk-otto"), npcNaturalHeightCm: 172, travelAction: "Visit", travelLine: "Hello, Princess. I am sorting town notes.", travelLineZh: "你好，公主。我正在整理城鎮便條。" },
  market: { ...singleSceneArt("market"), scene: "scene-market", npc: "Auntie Pom", npcImage: npcImage("auntie-pom-market"), npcNaturalHeightCm: 155, travelAction: "Visit", travelLine: "Hello, Princess. Warm bread is ready.", travelLineZh: "你好，公主。溫熱的麵包準備好了。" },
  harbor: { ...singleSceneArt("harbor"), scene: "scene-harbor", npc: "Nami", npcImage: npcImage("nami"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Hi, Princess. The fresh fish are ready today.", travelLineZh: "嗨，公主。今天的新鮮魚準備好了。" },
  port: { ...singleSceneArt("harbor"), scene: "scene-port", npc: "Dock Guide", npcImage: npcImage("dock-guide"), npcNaturalHeightCm: 175, travelAction: "Visit", travelLine: "Hello, Princess. Welcome to the harbor.", travelLineZh: "你好，公主。歡迎來到港口。" },
  boutique: { ...urbanShopArt("dress-boutique"), scene: "scene-urban-dress-boutique", npc: "Rena", npcImage: npcImage("rena"), npcNaturalHeightCm: 165, travelAction: "Shop", travelLine: "Hello, Princess. Every outfit is ready today.", travelLineZh: "你好，公主。今天每一件服飾都準備好了。", shopGreeting: "Pick anything you like, Princess — dresses, tops, hats and more.", shopGreetingZh: "公主，喜歡什麼都可以挑——洋裝、上衣、帽飾通通有。" },
  lighthouse: { ...singleSceneArt("lighthouse"), scene: "scene-lighthouse", npc: "Captain Sol", npcImage: npcImage("captain-sol"), npcNaturalHeightCm: 178, travelAction: "Visit", travelLine: "Hello, Princess. Welcome to the lighthouse.", travelLineZh: "你好，公主。歡迎來到燈塔。" }
}, urbanLessonBank, { area: "urban", vocabProfile: urbanVocabularyProfile.id }),
  urbanChatLessonBank, { area: "urban", vocabProfile: urbanVocabularyProfile.id }, "chatLesson");
//#endregion 對話場景設定
