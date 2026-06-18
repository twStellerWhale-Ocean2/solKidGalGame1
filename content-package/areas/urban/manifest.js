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
  rewardCoins: 60,
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
    castleRoom: { id: "castleRoom", label: "Castle Stairway", x: 47, y: 7, links: ["garden", "schoolClassroom", "library", "temple", "administration", "market"] },
    garden: { id: "garden", label: "Castle Garden", x: 20, y: 42, links: ["castleRoom", "market", "library", "temple"] },
    schoolClassroom: { id: "schoolClassroom", label: "School Classroom", x: 26, y: 18, links: ["castleRoom", "library", "market"] },
    library: { id: "library", label: "Library", x: 17, y: 30, links: ["schoolClassroom", "castleRoom", "garden"] },
    temple: { id: "temple", label: "Temple", x: 60, y: 47, links: ["castleRoom", "garden", "administration", "boutique", "hairSalon"] },
    administration: { id: "administration", label: "Administration Building", x: 40, y: 15, links: ["castleRoom", "temple", "boutique", "tailorStudio"] },
    market: { id: "market", label: "Market Square", x: 46, y: 33, links: ["garden", "schoolClassroom", "tailorStudio", "shoeShop", "harbor", "port"] },
    boutique: { id: "boutique", label: "Dress Boutique", x: 60, y: 17, links: ["tailorStudio", "shoeShop", "accessoryShop", "administration", "temple", "hairSalon"] },
    hairSalon: { id: "hairSalon", label: "Hair Salon", x: 73, y: 41, links: ["boutique", "accessoryShop", "temple"] },
    tailorStudio: { id: "tailorStudio", label: "Tailor Studio", x: 45, y: 49, links: ["market", "boutique", "shoeShop", "administration"] },
    shoeShop: { id: "shoeShop", label: "Shoe Shop", x: 30, y: 48, links: ["market", "harbor", "boutique", "tailorStudio"] },
    accessoryShop: { id: "accessoryShop", label: "Accessory Atelier", x: 72, y: 27, links: ["boutique", "hairSalon"] },
    harbor: { id: "harbor", label: "Fish Shop", x: 36, y: 76, links: ["market", "shoeShop", "port"] },
    port: { id: "port", label: "Harbor Port", x: 22, y: 88, links: ["market", "harbor", "lighthouse"] },
    lighthouse: { id: "lighthouse", label: "Lighthouse", x: 88, y: 80, links: ["port"] }
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
    { id: "boutique", area: "urban", node: "boutique", label: "Dress Boutique", icon: "👗", npc: "Rena", scene: "scene-urban-dress-boutique", npcImage: npcImage("rena"), shopCategories: ["dresses", "outfitSets"], defaultCategory: "dresses", hint: "Rena's boutique focuses on dresses and complete outfit sets." },
    { id: "hairSalon", area: "urban", node: "hairSalon", label: "Hair Salon", icon: "💇", npc: "Stylist Lina", scene: "scene-urban-hair-salon", npcImage: npcImage("stylist-lina"), shopCategories: ["hair"], defaultCategory: "hair", hint: "Stylist Lina keeps soft story hairstyles ready for Lumi." },
    { id: "tailorStudio", area: "urban", node: "tailorStudio", label: "Tailor Studio", icon: "👚", npc: "Tailor Tess", scene: "scene-urban-tailor-studio", npcImage: npcImage("tailor-tess"), shopCategories: ["tops", "bottoms"], defaultCategory: "tops", hint: "Tailor Tess sells tops and bottoms only." },
    { id: "shoeShop", area: "urban", node: "shoeShop", label: "Shoe Shop", icon: "👞", npc: "Mina", scene: "scene-shoes", npcImage: npcImage("mina"), shopCategories: ["shoes"], defaultCategory: "shoes", hint: "Mina shows shoes for long walks." },
    { id: "accessoryShop", area: "urban", node: "accessoryShop", label: "Accessory Atelier", icon: "👑", npc: "Lili", scene: "scene-urban-accessory-atelier", npcImage: npcImage("lili"), shopCategories: ["hats", "accessories"], defaultCategory: "hats", hint: "Lili sells hats and accessories only." },
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
const jobReward = { coins: 60 };
const urbanLessonBank = Object.freeze({
  garden: {
    title: "Help in the Castle Garden",
    questions: [
      { questionType: "sentence-choice", prompt: "The cat is hiding under the roses. Please help me find it.", promptZh: "小貓躲在玫瑰下面。請幫我找到牠。", answer: "Sure thing! The cat is under the roses.", choices: ["Sure thing! The cat is under the roses.","Sure thing! The cat is on the boat.","Sure thing! The cat is in the soup."], choicesZh: ["沒問題！小貓在玫瑰下面。","沒問題！小貓在船上。","沒問題！小貓在湯裡。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I see three red roses and five pink roses. Please help me count them.", promptZh: "我看到三朵紅玫瑰和五朵粉紅玫瑰。請幫我數一共有幾朵。", answer: "OK, let me count! There are eight roses.", choices: ["OK, let me count! There are five roses.","OK, let me count! There are eight roses.","OK, let me count! There are three roses."], choicesZh: ["好，我來數數！有五朵玫瑰。","好，我來數數！有八朵玫瑰。","好，我來數數！有三朵玫瑰。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I am watering the flowers now. Please tell me what I am doing.", promptZh: "我現在正在澆花。請告訴我我正在做什麼。", answer: "Sure! You are watering the flowers.", choices: ["Sure! You are reading a map.","Sure! You are buying bread.","Sure! You are watering the flowers."], choicesZh: ["好的！你正在讀地圖。","好的！你正在買麵包。","好的！你正在澆花。"], reward: jobReward }
    ]
  },
  schoolClassroom: {
    title: "Help in the School Classroom",
    questions: [
      { questionType: "sentence-choice", prompt: "Please give one book to each child.", promptZh: "請給每個孩子一本書。", answer: "OK, I can do that! I will give each child a book.", choices: ["OK, I can do that! I will give each child a book.","OK, I can do that! I will put the fish on the board.","OK, I can do that! I will wear the red shoes."], choicesZh: ["好的，我可以！我會給每個孩子一本書。","好的，我可以！我會把魚放在黑板上。","好的，我可以！我會穿紅鞋。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are six children here and four children there. Please count the class.", promptZh: "這裡有六個孩子，那裡有四個孩子。請幫我數全班有幾個孩子。", answer: "OK, let me count! There are ten children.", choices: ["OK, let me count! There are six children.","OK, let me count! There are ten children.","OK, let me count! There are four children."], choicesZh: ["好，我來數數！有六個孩子。","好，我來數數！有十個孩子。","好，我來數數！有四個孩子。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The class is reading. Please remind everyone softly.", promptZh: "全班正在閱讀。請輕聲提醒大家。", answer: "Sure! Please be quiet.", choices: ["Sure! Run in the classroom.","Sure! Put the boat on the desk.","Sure! Please be quiet."], choicesZh: ["好的！在教室裡跑。","好的！把船放在書桌上。","好的！請保持安靜。"], reward: jobReward }
    ]
  },
  library: {
    title: "Help in the Library",
    questions: [
      { questionType: "sentence-choice", prompt: "Please put the story book on the shelf.", promptZh: "請把故事書放在書架上。", answer: "OK! I put the story book on the shelf.", choices: ["OK! I put the story book on the shelf.","OK! I put the bread in the river.","OK! I put the shoe on the candle."], choicesZh: ["好的！我把故事書放在書架上。","好的！我把麵包放進河裡。","好的！我把鞋子放在蠟燭上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I see two blue books and four green books. Please help me count them.", promptZh: "我看到兩本藍色書和四本綠色書。請幫我數一共有幾本。", answer: "OK, let me count! There are six books.", choices: ["OK, let me count! There are four books.","OK, let me count! There are six books.","OK, let me count! There are two books."], choicesZh: ["好，我來數數！有四本書。","好，我來數數！有六本書。","好，我來數數！有兩本書。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A child is loud. Please help me remind the child.", promptZh: "有個孩子太大聲了。請幫我提醒他。", answer: "Sure! Please speak softly.", choices: ["Sure! Please run fast.","Sure! Please buy fish.","Sure! Please speak softly."], choicesZh: ["好的！請跑快一點。","好的！請買魚。","好的！請輕聲說話。"], reward: jobReward }
    ]
  },
  temple: {
    title: "Help at the Temple",
    questions: [
      { questionType: "sentence-choice", prompt: "Please give the white flowers some water.", promptZh: "請給白色的花一些水。", answer: "Of course! I will water the white flowers.", choices: ["Of course! I will water the white flowers.","Of course! I will put fish on the flowers.","Of course! I will carry the shoes to the sea."], choicesZh: ["當然！我會澆白色的花。","當然！我會把魚放在花上。","當然！我會把鞋子搬到海邊。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are two candles here and two candles there. Please help me count them.", promptZh: "這裡有兩支蠟燭，那裡有兩支蠟燭。請幫我數一共有幾支。", answer: "OK, let me count! There are four candles.", choices: ["OK, let me count! There are two candles.","OK, let me count! There are four candles.","OK, let me count! There are six candles."], choicesZh: ["好，我來數數！有兩支蠟燭。","好，我來數數！有四支蠟燭。","好，我來數數！有六支蠟燭。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This temple should stay calm. Please help me remind everyone.", promptZh: "這座神殿應該保持平靜。請幫我提醒大家。", answer: "Sure! Let us be calm here.", choices: ["Sure! Please shout loudly.","Sure! Please put stamps in the soup.","Sure! Let us be calm here."], choicesZh: ["好的！請大聲喊叫。","好的！請把郵票放進湯裡。","好的！我們在這裡保持平靜吧。"], reward: jobReward }
    ]
  },
  administration: {
    title: "Help at the Administration Building",
    questions: [
      { questionType: "sentence-choice", prompt: "Please put the notes in the box.", promptZh: "請把便條放進盒子裡。", answer: "OK! I put the notes in the box.", choices: ["OK! I put the notes in the box.","OK! I put the shoes by the door.","OK! I put the map under the fish."], choicesZh: ["好的！我把便條放進盒子裡。","好的！我把鞋子放在門旁邊。","好的！我把地圖放在魚下面。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I have three stamps here and four stamps there. Please help me count them.", promptZh: "我這裡有三張郵票，那裡有四張郵票。請幫我數一共有幾張。", answer: "OK, let me count! There are seven stamps.", choices: ["OK, let me count! There are four stamps.","OK, let me count! There are seven stamps.","OK, let me count! There are three stamps."], choicesZh: ["好，我來數數！有四張郵票。","好，我來數數！有七張郵票。","好，我來數數！有三張郵票。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I cannot find the town map. Please look on the desk.", promptZh: "我找不到城鎮地圖。請幫我看看書桌上有沒有。", answer: "Sure! The town map is on the desk.", choices: ["Sure! The fish is fresh.","Sure! The shoes are by the door.","Sure! The town map is on the desk."], choicesZh: ["好的！魚很新鮮。","好的！鞋子在門旁邊。","好的！城鎮地圖在書桌上。"], reward: jobReward }
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
      { questionType: "sentence-choice", prompt: "Please put the big fish on the ice.", promptZh: "請把大魚放在冰上。", answer: "OK! I put the big fish on the ice.", choices: ["OK! I put the fish under the roses.","OK! I put the big fish on the ice.","OK! I put the candle in the sea."], choicesZh: ["好的！我把魚放在玫瑰下面。","好的！我把大魚放在冰上。","好的！我把蠟燭放進海裡。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A cook asks, \"Are these fish fresh?\" Please help me answer.", promptZh: "一位廚師問：「這些魚新鮮嗎？」請幫我回答。", answer: "Of course, these fish are fresh!", choices: ["Of course, these shoes are red.","Of course, the map is on the desk.","Of course, these fish are fresh!"], choicesZh: ["當然，這些鞋子是紅色的。","當然，地圖在書桌上。","當然，這些魚很新鮮！"], reward: jobReward }
    ]
  },
  port: {
    title: "Help at Harbor Port",
    questions: [
      { questionType: "sentence-choice", prompt: "There are two boats at the left dock and two boats at the right dock. Please help me count them.", promptZh: "左邊碼頭有兩艘船，右邊碼頭有兩艘船。請幫我數一共有幾艘。", answer: "OK, let me count! There are four boats.", choices: ["OK, let me count! There are four boats.","OK, let me count! There are two boats.","OK, let me count! There are six boats."], choicesZh: ["好，我來數數！有四艘船。","好，我來數數！有兩艘船。","好，我來數數！有六艘船。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The captain is coming in. Please show him where to stop.", promptZh: "船長正要靠岸。請告訴他要停在哪裡。", answer: "Sure! Stop here, please.", choices: ["Sure! Run here, please.","Sure! Stop here, please.","Sure! Wait by the dock, please."], choicesZh: ["好的！請在這裡跑。","好的！請停在這裡。","好的！請在碼頭旁等待。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The dock is busy. Please help me remind the children.", promptZh: "碼頭很忙。請幫我提醒孩子們。", answer: "OK! Do not run here.", choices: ["OK! Please jump on the boat.","OK! Please put books in the sea.","OK! Do not run here."], choicesZh: ["好的！請跳上船。","好的！請把書放進海裡。","好的！不要在這裡跑。"], reward: jobReward }
    ]
  },
  boutique: {
    title: "Help at the Dress Boutique",
    questions: [
      { questionType: "sentence-choice", prompt: "Please hang the pink dress on the rail.", promptZh: "請把粉紅色洋裝掛到衣架上。", answer: "OK! I hang the dress on the rail.", choices: ["OK! I hang the dress on the rail.","OK! I put the dress on the chair.","OK! I put the ribbon in the tray."], choicesZh: ["好的！我把洋裝掛到衣架上。","好的！我把洋裝放在椅子上。","好的！我把緞帶放進托盤裡。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are four dresses here and three dresses there. Please help me count them.", promptZh: "這裡有四件洋裝，那裡有三件洋裝。請幫我數一共有幾件。", answer: "OK, let me count! There are seven dresses.", choices: ["OK, let me count! There are four dresses.","OK, let me count! There are seven dresses.","OK, let me count! There are three dresses."], choicesZh: ["好，我來數數！有四件洋裝。","好，我來數數！有七件洋裝。","好，我來數數！有三件洋裝。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A girl likes the blue dress. Please help her kindly.", promptZh: "一個女孩喜歡藍色洋裝。請親切地幫她。", answer: "Of course! You can try it on.", choices: ["Of course! The blue dress is a fish.","Of course! Please run in the shop.","Of course! You can try it on."], choicesZh: ["當然！藍色洋裝是一條魚。","當然！請在店裡跑。","當然！你可以試穿看看。"], reward: jobReward }
    ]
  },
  hairSalon: {
    title: "Help at the Hair Salon",
    questions: [
      { questionType: "sentence-choice", prompt: "Please pass me the brush.", promptZh: "請把梳子遞給我。", answer: "Sure! Here is the brush.", choices: ["Sure! Here is the brush.","Sure! Here is the fish.","Sure! Here is the stamp."], choicesZh: ["好的！梳子在這裡。","好的！魚在這裡。","好的！郵票在這裡。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are two brushes on the table and three brushes in the cup. Please help me count them.", promptZh: "桌上有兩把梳子，杯子裡有三把梳子。請幫我數一共有幾把。", answer: "OK, let me count! There are five brushes.", choices: ["OK, let me count! There are three brushes.","OK, let me count! There are five brushes.","OK, let me count! There are two brushes."], choicesZh: ["好，我來數數！有三把梳子。","好，我來數數！有五把梳子。","好，我來數數！有兩把梳子。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The mirror table is messy. Please help me tidy it.", promptZh: "鏡台有點亂。請幫我整理它。", answer: "Of course! I will tidy the mirror table.", choices: ["Of course! I will put fish on it.","Of course! I will run around it.","Of course! I will tidy the mirror table."], choicesZh: ["當然！我會把魚放在上面。","當然！我會繞著它跑。","當然！我會整理鏡台。"], reward: jobReward }
    ]
  },
  tailorStudio: {
    title: "Help at the Tailor Studio",
    questions: [
      { questionType: "sentence-choice", prompt: "Please put the shirt on the shelf.", promptZh: "請把襯衫放在架子上。", answer: "OK! I put the shirt on the shelf.", choices: ["OK! I put the shirt on the shelf.","OK! I put the shoe in the candle.","OK! I put the map on the fish."], choicesZh: ["好的！我把襯衫放在架子上。","好的！我把鞋子放進蠟燭裡。","好的！我把地圖放在魚上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are five shirts here and four shirts there. Please help me count them.", promptZh: "這裡有五件襯衫，那裡有四件襯衫。請幫我數一共有幾件。", answer: "OK, let me count! There are nine shirts.", choices: ["OK, let me count! There are five shirts.","OK, let me count! There are nine shirts.","OK, let me count! There are four shirts."], choicesZh: ["好，我來數數！有五件襯衫。","好，我來數數！有九件襯衫。","好，我來數數！有四件襯衫。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I am sewing a small button. Please tell the customer kindly.", promptZh: "我正在縫一顆小鈕扣。請親切地告訴客人。", answer: "Sure! Tess is sewing a button.", choices: ["Sure! Tess is washing fish.","Sure! Tess is reading a boat.","Sure! Tess is sewing a button."], choicesZh: ["好的！泰絲正在洗魚。","好的！泰絲正在讀船。","好的！泰絲正在縫鈕扣。"], reward: jobReward }
    ]
  },
  shoeShop: {
    title: "Help at the Shoe Shop",
    questions: [
      { questionType: "sentence-choice", prompt: "One pair has two shoes. Please help me check this pair.", promptZh: "一雙鞋有兩隻。請幫我檢查這一雙。", answer: "Sure! This pair has two shoes.", choices: ["Sure! This pair has two shoes.","Sure! This pair has two fish.","Sure! This pair has six candles."], choicesZh: ["好的！這雙鞋有兩隻。","好的！這一雙有兩條魚。","好的！這一雙有六支蠟燭。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Please put the red shoes by the door.", promptZh: "請把紅鞋放在門旁邊。", answer: "OK! I put the red shoes by the door.", choices: ["OK! I put the red shoes under the table.","OK! I put the red shoes by the door.","OK! I put the red shoes on the soup."], choicesZh: ["好的！我把紅鞋放在桌子下面。","好的！我把紅鞋放在門旁邊。","好的！我把紅鞋放在湯上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A boy needs bigger shoes. Please help him kindly.", promptZh: "一個男孩需要更大的鞋。請親切地幫他。", answer: "Of course! Try these bigger shoes.", choices: ["Of course! Try these smaller hats.","Of course! Run with the shoes.","Of course! Try these bigger shoes."], choicesZh: ["當然！試試這些更小的帽子。","當然！穿著鞋跑。","當然！試試這雙更大的鞋。"], reward: jobReward }
    ]
  },
  accessoryShop: {
    title: "Help at the Accessory Atelier",
    questions: [
      { questionType: "sentence-choice", prompt: "Please put the red ribbons together.", promptZh: "請把紅緞帶放在一起。", answer: "OK! I put the red ribbons together.", choices: ["OK! I put the red ribbons together.","OK! I put the red ribbons in the soup.","OK! I put the fish together."], choicesZh: ["好的！我把紅緞帶放在一起。","好的！我把紅緞帶放進湯裡。","好的！我把魚放在一起。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There is one crown here and two crowns there. Please help me count them.", promptZh: "這裡有一個皇冠，那裡有兩個皇冠。請幫我數一共有幾個。", answer: "OK, let me count! There are three crowns.", choices: ["OK, let me count! There are two crowns.","OK, let me count! There are three crowns.","OK, let me count! There is one crown."], choicesZh: ["好，我來數數！有兩個皇冠。","好，我來數數！有三個皇冠。","好，我來數數！有一個皇冠。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A girl wants a blue ribbon. Please ask her kindly.", promptZh: "一個女孩想要藍緞帶。請親切地問她。", answer: "Sure! Which colour do you want?", choices: ["Sure! How many fish do you want?","Sure! Please put the crown under the dock.","Sure! Which colour do you want?"], choicesZh: ["好的！你想要幾條魚？","好的！請把皇冠放在碼頭下面。","好的！你想要哪一種顏色？"], reward: jobReward }
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
      { questionType: "sentence-choice", prompt: "Do you like the pink roses?", promptZh: "你喜歡粉紅色的玫瑰嗎？", answer: "Yes, I love the pink roses!", choices: ["Yes, I love the pink roses!","The book is under the boat."], choicesZh: ["喜歡，我超愛這些粉紅玫瑰！","書在船的下面。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The little cat is by the flowers.", promptZh: "小貓在花旁邊。", answer: "Aww, the cat is so cute!", choices: ["I am washing the fish.","Aww, the cat is so cute!"], choicesZh: ["我正在洗魚。","啊，這隻小貓好可愛！"], reward: chatReward }
    ]
  },
  schoolClassroom: {
    title: "Chat in the School Classroom",
    questions: [
      { questionType: "sentence-choice", prompt: "Good morning, Princess.", promptZh: "早安，公主。", answer: "Good morning, Teacher! I am ready.", choices: ["Good morning, Teacher! I am ready.","The fish is on the ice."], choicesZh: ["早安，老師！我準備好了。","魚在冰上。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "How do you feel today?", promptZh: "你今天感覺怎麼樣？", answer: "Oh, I am very happy today!", choices: ["The map is by the door.","Oh, I am very happy today!"], choicesZh: ["地圖在門旁邊。","喔，我今天超開心！"], reward: chatReward }
    ]
  },
  library: {
    title: "Chat in the Library",
    questions: [
      { questionType: "sentence-choice", prompt: "What books do you like, Princess?", promptZh: "公主，你喜歡什麼書？", answer: "Oh, I love story books!", choices: ["Oh, I love story books!","I like wet docks."], choicesZh: ["喔，我超愛故事書！","我喜歡濕的碼頭。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "We speak softly in the library.", promptZh: "我們在圖書館裡輕聲說話。", answer: "OK, I will speak softly.", choices: ["I can shout here.","OK, I will speak softly."], choicesZh: ["我可以在這裡大叫。","好的，我會輕聲說話。"], reward: chatReward }
    ]
  },
  temple: {
    title: "Chat at the Temple",
    questions: [
      { questionType: "sentence-choice", prompt: "How do you feel here, Princess?", promptZh: "公主，你在這裡感覺如何？", answer: "I feel so calm here.", choices: ["I feel so calm here.","I am cleaning a shoe."], choicesZh: ["我在這裡覺得好平靜。","我正在清一隻鞋。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "These flowers smell sweet.", promptZh: "這些花聞起來很香。", answer: "Oh, the flowers are lovely!", choices: ["The stamps are on the boat.","Oh, the flowers are lovely!"], choicesZh: ["郵票在船上。","喔，這些花好美！"], reward: chatReward }
    ]
  },
  administration: {
    title: "Chat at the Administration Building",
    questions: [
      { questionType: "sentence-choice", prompt: "Nice to meet you, Princess.", promptZh: "很高興見到你，公主。", answer: "Nice to meet you too, Otto!", choices: ["Nice to meet you too, Otto!","The candle is under the fish."], choicesZh: ["我也很高興見到你，奧托！","蠟燭在魚下面。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Are you busy now?", promptZh: "你現在忙嗎？", answer: "No, I am free right now!", choices: ["The roses are on the shelf.","No, I am free right now!"], choicesZh: ["玫瑰在書架上。","不忙，我現在有空！"], reward: chatReward }
    ]
  },
  market: {
    title: "Chat at Market Square",
    questions: [
      { questionType: "sentence-choice", prompt: "Are you hungry, Princess?", promptZh: "公主，你餓了嗎？", answer: "Yes, just a little!", choices: ["Yes, just a little!","The map is on the candle."], choicesZh: ["對啊，有一點點！","地圖在蠟燭上。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "This bread smells good.", promptZh: "這個麵包聞起來很香。", answer: "Thank you! It smells so good.", choices: ["The boat is quiet.","Thank you! It smells so good."], choicesZh: ["船很安靜。","謝謝！聞起來好香。"], reward: chatReward }
    ]
  },
  harbor: {
    title: "Chat at the Fish Shop",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like the sea, Princess?", promptZh: "公主，你喜歡大海嗎？", answer: "Yes, I really like the sea.", choices: ["Yes, I really like the sea.","The book is under the bed."], choicesZh: ["喜歡，我很喜歡大海。","書在床底下。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The fish are fresh today.", promptZh: "今天的魚很新鮮。", answer: "Wow, your fish look so fresh!", choices: ["The shoes are in the tree.","Wow, your fish look so fresh!"], choicesZh: ["鞋子在樹上。","哇，你的魚看起來好新鮮！"], reward: chatReward }
    ]
  },
  port: {
    title: "Chat at Harbor Port",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like the sea, Princess?", promptZh: "公主，你喜歡大海嗎？", answer: "Yes, I love the sea so much!", choices: ["Yes, I love the sea so much!","The stamps are under the table."], choicesZh: ["對啊，我超愛大海！","郵票在桌子下面。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Have a safe trip, Princess.", promptZh: "祝你旅途平安，公主。", answer: "Thank you! Have a good day.", choices: ["I will shout in the library.","Thank you! Have a good day."], choicesZh: ["我會在圖書館大叫。","謝謝！祝你有美好的一天。"], reward: chatReward }
    ]
  },
  boutique: {
    title: "Chat at the Dress Boutique",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like this pink dress?", promptZh: "你喜歡這件粉紅色洋裝嗎？", answer: "I love this pink dress!", choices: ["I love this pink dress!","I like the wet dock."], choicesZh: ["我好愛這件粉紅洋裝！","我喜歡濕的碼頭。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Thank you for visiting my shop.", promptZh: "謝謝你來我的店。", answer: "Wow, your shop is so pretty!", choices: ["The fish are on ice.","Wow, your shop is so pretty!"], choicesZh: ["魚在冰上。","哇，你的店好漂亮！"], reward: chatReward }
    ]
  },
  hairSalon: {
    title: "Chat at the Hair Salon",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like your new hair?", promptZh: "你喜歡你的新髮型嗎？", answer: "I love my new hair!", choices: ["I love my new hair!","I like the town map."], choicesZh: ["我超愛我的新髮型！","我喜歡城鎮地圖。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "It is nice to see you today.", promptZh: "今天很高興見到你。", answer: "Nice to see you too, Lina!", choices: ["The fish is under the table.","Nice to see you too, Lina!"], choicesZh: ["魚在桌子下面。","我也很高興見到你，莉娜！"], reward: chatReward }
    ]
  },
  tailorStudio: {
    title: "Chat at the Tailor Studio",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like this blue top?", promptZh: "你喜歡這件藍色上衣嗎？", answer: "I really like this blue top!", choices: ["I really like this blue top!","I like this red fish."], choicesZh: ["我很喜歡這件藍色上衣！","我喜歡這條紅色魚。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "My shop is tidy today.", promptZh: "我的店今天很整齊。", answer: "Yes, your shop is so tidy!", choices: ["The sea is under the chair.","Yes, your shop is so tidy!"], choicesZh: ["海在椅子下面。","對啊，你的店好整齊！"], reward: chatReward }
    ]
  },
  shoeShop: {
    title: "Chat at the Shoe Shop",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like these red shoes?", promptZh: "你喜歡這雙紅鞋嗎？", answer: "I love these red shoes!", choices: ["I love these red shoes!","I like the quiet candle."], choicesZh: ["我超愛這雙紅鞋！","我喜歡安靜的蠟燭。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Do the shoes fit well?", promptZh: "鞋子合腳嗎？", answer: "Yes, they fit really well!", choices: ["The ship is on the shelf.","Yes, they fit really well!"], choicesZh: ["船在架子上。","對啊，很合腳！"], reward: chatReward }
    ]
  },
  accessoryShop: {
    title: "Chat at the Accessory Atelier",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like this red ribbon?", promptZh: "你喜歡這條紅緞帶嗎？", answer: "I love this red ribbon!", choices: ["I love this red ribbon!","I like this wet boat."], choicesZh: ["我好愛這條紅緞帶！","我喜歡這艘濕船。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "These hats are pretty today.", promptZh: "這些帽子今天很漂亮。", answer: "Wow, your hats are so pretty!", choices: ["The fish are on the shelf.","Wow, your hats are so pretty!"], choicesZh: ["魚在架子上。","哇，你的帽子真漂亮！"], reward: chatReward }
    ]
  },
  lighthouse: {
    title: "Chat at the Lighthouse",
    questions: [
      { questionType: "sentence-choice", prompt: "Can you see the sea, Princess?", promptZh: "公主，你看得到大海嗎？", answer: "Yes, it is so beautiful!", choices: ["Yes, it is so beautiful!","The book is in the soup."], choicesZh: ["看得到，它好美！","書在湯裡。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Good night, Princess.", promptZh: "晚安，公主。", answer: "Good night, Captain!", choices: ["The shoes are loud.","Good night, Captain!"], choicesZh: ["鞋子很大聲。","晚安，船長！"], reward: chatReward }
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
  boutique: { ...urbanShopArt("dress-boutique"), scene: "scene-urban-dress-boutique", npc: "Rena", npcImage: npcImage("rena"), npcNaturalHeightCm: 165, travelAction: "Shop", travelLine: "Hello, Princess. The dresses are ready today.", travelLineZh: "你好，公主。今天的洋裝準備好了。", shopGreeting: "Pick a dress or an outfit set, Princess.", shopGreetingZh: "公主，選一件洋裝或一套服裝吧。" },
  hairSalon: { ...urbanShopArt("hair-salon"), scene: "scene-urban-hair-salon", npc: "Stylist Lina", npcImage: npcImage("stylist-lina"), npcNaturalHeightCm: 162, travelAction: "Shop", travelLine: "Hi, Princess. Welcome to the hair salon.", travelLineZh: "嗨，公主。歡迎來到髮廊。", shopGreeting: "Sit by the mirror, Princess.", shopGreetingZh: "公主，請坐到鏡子旁邊。" },
  tailorStudio: { ...urbanShopArt("tailor-studio"), scene: "scene-urban-tailor-studio", npc: "Tailor Tess", npcImage: npcImage("tailor-tess"), npcNaturalHeightCm: 160, travelAction: "Shop", travelLine: "Good morning, Princess. The shirts are folded.", travelLineZh: "早安，公主。襯衫已經摺好了。", shopGreeting: "Pick a top or bottoms, Princess.", shopGreetingZh: "公主，選一件上衣或下身服飾吧。" },
  shoeShop: { ...singleSceneArt("shoes", { tone: "shop" }), scene: "scene-shoes", npc: "Mina", npcImage: npcImage("mina"), npcNaturalHeightCm: 158, travelAction: "Shop", travelLine: "Hello, Princess. Try shoes for the road.", travelLineZh: "你好，公主。試試適合走路的鞋吧。", shopGreeting: "These shoes are ready for your next trip.", shopGreetingZh: "這些鞋準備好陪你去下一趟旅程。" },
  accessoryShop: { ...urbanShopArt("accessory-atelier"), scene: "scene-urban-accessory-atelier", npc: "Lili", npcImage: npcImage("lili"), npcNaturalHeightCm: 156, travelAction: "Shop", travelLine: "Good day, Princess. Hats and ribbons are ready.", travelLineZh: "日安，公主。帽子和緞帶準備好了。", shopGreeting: "Pick a hat or accessory, Princess.", shopGreetingZh: "公主，選一頂帽子或一個配件吧。" },
  lighthouse: { ...singleSceneArt("lighthouse"), scene: "scene-lighthouse", npc: "Captain Sol", npcImage: npcImage("captain-sol"), npcNaturalHeightCm: 178, travelAction: "Visit", travelLine: "Hello, Princess. Welcome to the lighthouse.", travelLineZh: "你好，公主。歡迎來到燈塔。" }
}, urbanLessonBank, { area: "urban", vocabProfile: urbanVocabularyProfile.id }),
  urbanChatLessonBank, { area: "urban", vocabProfile: urbanVocabularyProfile.id }, "chatLesson");
//#endregion 對話場景設定
