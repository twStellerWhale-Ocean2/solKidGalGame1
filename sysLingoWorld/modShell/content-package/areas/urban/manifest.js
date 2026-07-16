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
    { id: "boutique", area: "urban", node: "boutique", label: "Dress Boutique", icon: "👗", npc: "Rena", scene: "scene-urban-dress-boutique", npcImage: npcImage("rena"), shopCategories: ["hair", "outfit", "shoes", "accessories"], defaultCategory: "hair", hint: "Rena's boutique carries refined town hair, outfits, shoes, and accessories." },
    { id: "lighthouse", area: "urban", node: "lighthouse", label: "Lighthouse", icon: "🗼", npc: "Captain Sol", scene: "scene-lighthouse", npcImage: npcImage("captain-sol"), hint: "The lighthouse watches the sea before ships sail." }
  ],
  // actors 是地圖上的動態環境效果，不是可點擊地點。
  actors: [],
  defaultNode: "garden",
  enabled: true
});
//#endregion 地圖與地點設定

//#region 場景自帶題庫（issue #96 結構；issue #149 角色第一人稱；issue #295 全量重寫：語感自然化、干擾選項改為情境內合理但判斷較差／語意錯誤之回應，去除荒謬句）
// urbanLessonBank：以 place 為鍵的「打工任務」題庫（答對得 coins＝勞動所得）。
// Starters 分級；每場景 3 題、每題 3 選項；prompt＝角色第一人稱請求／任務、choices＝公主回應；數學包進角色任務情境。
const jobReward = { coins: 105 };
const urbanLessonBank = Object.freeze({
  garden: {
    title: "Help in the Castle Garden",
    questions: [
      { questionType: "sentence-choice", prompt: "My cat is hiding, and she loves warm, soft places. Where should we look first?", promptZh: "我的貓躲起來了，她喜歡溫暖柔軟的地方。我們該先找哪裡？", answer: "Sure — cats love warm spots. Let's check under the rose bush.", choices: ["Sure — cats love warm spots. Let's check under the rose bush.","OK — maybe she climbed up onto the stone wall.","Well, she could be down by the pond, watching the fish."], choicesZh: ["好啊——貓咪最愛溫暖的地方，我們先看看玫瑰叢下面。","好的——也許她爬到石牆上了。","嗯，她可能在池塘邊看魚。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I need three red roses and five pink roses for a bouquet. How many roses is that?", promptZh: "我做花束需要三朵紅玫瑰和五朵粉紅玫瑰。一共是幾朵？", answer: "OK — three and five make eight roses.", choices: ["OK — three and five make eight roses.","OK — I think that makes six roses.","OK — I count seven roses in all."], choicesZh: ["好——三加五，一共是八朵玫瑰。","好——我想應該是六朵。","好——我數起來一共七朵。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "My white flowers did not sell well yesterday. Can you give me some advice?", promptZh: "我的白花昨天賣得不好。可以給我一些建議嗎？", answer: "Well, you could add some pink roses — people love them.", choices: ["Well, you could add some pink roses — people love them.","Well, you could order even more white flowers.","Well, maybe flowers just do not sell in this town."], choicesZh: ["嗯，你可以加賣一些粉紅玫瑰——大家都很喜歡。","嗯，你可以再多進一些白花。","嗯，也許這個鎮上花本來就賣不動。"], reward: jobReward }
    ]
  },
  schoolClassroom: {
    title: "Help in the School Classroom",
    questions: [
      { questionType: "sentence-choice", prompt: "We have only ten books but twelve children today. What should we do?", promptZh: "我們今天只有十本書，卻有十二個孩子。我們該怎麼辦？", answer: "OK — two children can share one book for today.", choices: ["OK — two children can share one book for today.","Well, the class can wait while someone buys two more.","Sure — the fast readers can finish first and pass theirs on."], choicesZh: ["好的——今天先讓兩個孩子共讀一本。","嗯，全班可以先等，請人再去買兩本。","好啊——讀得快的先看完，再把書傳下去。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are six children here and four children there. How many children are in class?", promptZh: "這裡有六個孩子，那裡有四個孩子。全班一共有幾個孩子？", answer: "Sure — six and four make ten children.", choices: ["Sure — six and four make ten children.","Sure — I count eight children today.","Sure — that makes twelve children, I think."], choicesZh: ["好的——六加四，一共十個孩子。","好的——我數到八個孩子。","好的——我想應該是十二個孩子。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The class is reading. Please remind everyone softly.", promptZh: "全班正在閱讀。請輕聲提醒大家。", answer: "Sure — I'll say softly, 'Please read quietly, everyone.'", choices: ["Sure — I'll say softly, 'Please read quietly, everyone.'","OK — I'll clap my hands so everyone hears me.","Well, I can wait outside until they finish reading."], choicesZh: ["好的——我會輕聲說：「請大家安靜閱讀。」","好的——我會拍拍手，讓大家都聽到我。","嗯，我可以在外面等他們讀完。"], reward: jobReward }
    ]
  },
  library: {
    title: "Help in the Library",
    questions: [
      { questionType: "sentence-choice", prompt: "Should this story book go on the high shelf or the low shelf for small children?", promptZh: "這本故事書該放在高書架，還是給小小孩的矮書架？", answer: "OK — the low shelf, so small children can reach it.", choices: ["OK — the low shelf, so small children can reach it.","Sure — the high shelf keeps it nice and safe.","Well, the reading table is fine for now."], choicesZh: ["好的——放矮書架，小小孩才拿得到。","好啊——放高書架，書比較不會壞。","嗯，先放在閱讀桌上就好。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I see two blue books and four green books. How many books is that?", promptZh: "我看到兩本藍色書和四本綠色書。一共是幾本？", answer: "Sure — two and four make six books.", choices: ["Sure — two and four make six books.","Sure — I count five books in all.","Sure — that makes eight books, I think."], choicesZh: ["好的——二加四，一共六本書。","好的——我數起來一共五本。","好的——我想應該是八本。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A child is being loud. Please help me remind him.", promptZh: "有個孩子太大聲了。請幫我提醒他。", answer: "Of course — I'll ask him gently to use his quiet voice.", choices: ["Of course — I'll ask him gently to use his quiet voice.","OK — I'll tell him to go outside and read there.","Well, the other children can move to another table."], choicesZh: ["當然——我會溫柔地請他小聲說話。","好的——我會叫他去外面讀。","嗯，其他孩子可以換到別桌去。"], reward: jobReward }
    ]
  },
  temple: {
    title: "Help at the Temple",
    questions: [
      { questionType: "sentence-choice", prompt: "These white flowers look dry. How much water should I give them?", promptZh: "這些白花看起來很乾。我該給它們多少水？", answer: "Well — just a little each day keeps them happy.", choices: ["Well — just a little each day keeps them happy.","OK — a full bucket now will fix them fast.","Sure — we can wait for the rain to do it."], choicesZh: ["嗯——每天澆一點點，它們就會很開心。","好的——現在整桶倒下去，一次解決。","好啊——我們可以等下雨幫忙澆。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are two candles here and two candles there. How many candles is that?", promptZh: "這裡有兩支蠟燭，那裡有兩支蠟燭。一共是幾支？", answer: "OK — two and two make four candles.", choices: ["OK — two and two make four candles.","OK — I count five candles in all.","OK — that makes three candles, I think."], choicesZh: ["好的——二加二，一共四支蠟燭。","好的——我數起來一共五支。","好的——我想應該是三支。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Some visitors are getting noisy in the quiet temple. What should I ask them to do?", promptZh: "有些訪客在安靜的神殿裡變得吵鬧。我該請他們怎麼做？", answer: "Sure — I'll kindly ask them to use soft voices inside.", choices: ["Sure — I'll kindly ask them to use soft voices inside.","Well, a little noise never hurts a big temple.","OK — we can close the doors until they leave."], choicesZh: ["好啊——我會親切地請他們在裡面小聲說話。","嗯，這麼大的神殿，一點聲音沒關係吧。","好的——我們把門關上，等他們離開。"], reward: jobReward }
    ]
  },
  administration: {
    title: "Help at the Administration Building",
    questions: [
      { questionType: "sentence-choice", prompt: "These notes are important. Where should I keep them safe?", promptZh: "這些文件很重要。我該收在哪裡才安全？", answer: "OK — lock them in the drawer, and keep the key with you.", choices: ["OK — lock them in the drawer, and keep the key with you.","Sure — the desk is fine; everyone here is honest.","Well, you could carry them around with you all day."], choicesZh: ["好的——把它們鎖進抽屜，鑰匙隨身帶著。","好啊——放桌上就好，這裡大家都很誠實。","嗯，你可以整天隨身帶著它們。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I have three stamps here and four stamps there. How many stamps is that?", promptZh: "我這裡有三張郵票，那裡有四張郵票。一共是幾張？", answer: "Sure — three and four make seven stamps.", choices: ["Sure — three and four make seven stamps.","Sure — I count six stamps in all.","Sure — that makes eight stamps, I think."], choicesZh: ["好的——三加四，一共七張郵票。","好的——我數起來一共六張。","好的——我想應該是八張。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I lost the town map. Where should we search first?", promptZh: "我把城鎮地圖弄丟了。我們該先找哪裡？", answer: "OK — let's check your busy desk first. It is probably there.", choices: ["OK — let's check your busy desk first. It is probably there.","Well, we could draw a new map — that may be faster.","Sure — let's ask at the market if anyone found it."], choicesZh: ["好的——先找你那張忙亂的桌子，八成就在那裡。","嗯，我們可以畫一張新地圖——說不定更快。","好啊——我們去市集問問有沒有人撿到。"], reward: jobReward }
    ]
  },
  market: {
    title: "Help at Market Square",
    questions: [
      { questionType: "sentence-choice", prompt: "A girl wants some bread. Please ask her kindly what she needs.", promptZh: "一個女孩想買麵包。請親切地問她需要什麼。", answer: "Sure! Hello — how many would you like today?", choices: ["Sure! Hello — how many would you like today?","OK! It is two coins each — please pay first.","Well, I can just give her the biggest loaf."], choicesZh: ["好的！你好——你今天想要幾個呢？","好的！一個兩枚金幣——請先付錢。","嗯，我直接拿最大的那條給她就好。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are three apples and two pears. How many fruits is that?", promptZh: "有三顆蘋果和兩顆梨子。一共是幾個水果？", answer: "OK — three and two make five fruits.", choices: ["OK — three and two make five fruits.","OK — I count six fruits on the table.","OK — that makes four fruits, I think."], choicesZh: ["好的——三加二，一共五個水果。","好的——我數到桌上有六個。","好的——我想應該是四個。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A customer is leaving. Please say goodbye kindly.", promptZh: "一位客人要離開了。請親切地道別。", answer: "Thank you for coming! See you again soon!", choices: ["Thank you for coming! See you again soon!","OK — next customer, please come up!","Thanks! Do not forget to buy more tomorrow."], choicesZh: ["謝謝光臨！下次再來喔！","好的——下一位客人請上前！","謝謝！別忘了明天再來多買一點。"], reward: jobReward }
    ]
  },
  harbor: {
    title: "Help at the Fish Shop",
    questions: [
      { questionType: "sentence-choice", prompt: "This box has four fish, and that box has two fish. How many fish do I have?", promptZh: "這箱有四條魚，那箱有兩條魚。我一共有幾條魚？", answer: "Sure thing — four and two make six fish.", choices: ["Sure thing — four and two make six fish.","Sure — I count five fish in the boxes.","Sure — that makes seven fish, I think."], choicesZh: ["沒問題——四加二，一共六條魚。","好的——我數到箱子裡有五條。","好的——我想應該是七條。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This big fish must stay fresh until lunch. Where should I put it?", promptZh: "這條大魚要保鮮到午餐時間。我該把它放在哪裡？", answer: "OK — set it on the cold ice right away.", choices: ["OK — set it on the cold ice right away.","Well, the shady shelf should keep it cool enough.","Sure — wrap it in a cloth and leave it by the door."], choicesZh: ["好的——馬上把它放到冰塊上。","嗯，陰涼的架子應該夠涼了。","好啊——用布把它包起來，放在門邊。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A cook wants the freshest fish. Which one should I show her?", promptZh: "一位廚師想要最新鮮的魚。我該給她看哪一條？", answer: "Of course — show her today's catch. It is the freshest.", choices: ["Of course — show her today's catch. It is the freshest.","OK — the big one from yesterday still looks fine.","Well, any fish is fresh if we add enough ice."], choicesZh: ["當然——給她看今天捕的魚，那是最新鮮的。","好的——昨天那條大的看起來還不錯。","嗯，只要冰塊夠多，哪條魚都算新鮮吧。"], reward: jobReward }
    ]
  },
  port: {
    title: "Help at Harbor Port",
    questions: [
      { questionType: "sentence-choice", prompt: "There are two boats at the left dock and two at the right dock. How many boats is that?", promptZh: "左邊碼頭有兩艘船，右邊碼頭也有兩艘。一共是幾艘？", answer: "OK — two and two make four boats.", choices: ["OK — two and two make four boats.","OK — I count three boats by the docks.","OK — that makes six boats, I think."], choicesZh: ["好的——二加二，一共四艘船。","好的——我數到碼頭邊有三艘。","好的——我想應該是六艘。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The captain's big ship is coming in. Which dock should I send him to?", promptZh: "船長的大船要進港了。我該請他停哪個碼頭？", answer: "Sure — send him to the big empty dock. His ship needs room.", choices: ["Sure — send him to the big empty dock. His ship needs room.","Well, the small dock is closer — maybe try that first.","OK — he can wait out at sea until a dock is free."], choicesZh: ["好啊——請他停到那個大的空碼頭，他的船需要空間。","嗯，小碼頭比較近——要不要先試試？","好的——他可以先在海上等，等到有碼頭空出來。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The dock is busy today. Please help me remind the children to be careful.", promptZh: "今天碼頭很忙。請幫我提醒孩子們要小心。", answer: "Sure — I'll tell them, 'Please walk, do not run here.'", choices: ["Sure — I'll tell them, 'Please walk, do not run here.'","OK — I'll ask them to go play somewhere else.","Well, children never listen — we can only hope."], choicesZh: ["好的——我會告訴他們：「請用走的，不要在這裡跑。」","好的——我會請他們去別的地方玩。","嗯，孩子們從來不聽話——只能碰運氣了。"], reward: jobReward }
    ]
  },
  boutique: {
    title: "Help at the Dress Boutique",
    questions: [
      { questionType: "sentence-choice", prompt: "Where should I hang this pretty pink dress so customers can see it?", promptZh: "這件漂亮的粉紅洋裝，我該掛在哪裡讓客人看得到？", answer: "OK — hang it on the front rail, where everyone walks past.", choices: ["OK — hang it on the front rail, where everyone walks past.","Sure — the back room keeps it safe from the sun.","Well, fold it neatly in the drawer with the others."], choicesZh: ["好的——掛在最前面的衣架上，大家經過都看得到。","好啊——放後面房間，才不會被太陽曬到。","嗯，把它折好收進抽屜，跟其他的放一起。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are four dresses here and three dresses there. How many dresses is that?", promptZh: "這裡有四件洋裝，那裡有三件。一共是幾件？", answer: "Sure — four and three make seven dresses.", choices: ["Sure — four and three make seven dresses.","Sure — I count six dresses on the rails.","Sure — that makes eight dresses, I think."], choicesZh: ["好的——四加三，一共七件洋裝。","好的——我數到衣架上有六件。","好的——我想應該是八件。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A girl likes the blue dress. Please help her kindly.", promptZh: "一個女孩喜歡那件藍色洋裝。請親切地幫她。", answer: "Of course! Would you like to try it on?", choices: ["Of course! Would you like to try it on?","OK — I can wrap it up before she changes her mind.","Well, the pink one would suit her better, I think."], choicesZh: ["當然！你想試穿看看嗎？","好的——趁她還沒改變心意，我先包起來。","嗯，我覺得粉紅色那件更適合她。"], reward: jobReward }
    ]
  },
  lighthouse: {
    title: "Help at the Lighthouse",
    questions: [
      { questionType: "sentence-choice", prompt: "It is getting dark, and ships are still out there. Please help me with the lamp.", promptZh: "天快黑了，海上還有船。請幫我處理燈。", answer: "Right away — I'll light the lamp before the ships come near.", choices: ["Right away — I'll light the lamp before the ships come near.","OK — we can wait until it is fully dark outside.","Well, the moon is bright — the ships may see fine tonight."], choicesZh: ["馬上來——我在船靠近前把燈點亮。","好的——我們可以等天完全黑了再點。","嗯，今晚月亮很亮——船應該看得清楚吧。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There is one ship near the rocks and one near the dock. How many ships is that?", promptZh: "礁石附近有一艘船，碼頭附近也有一艘。一共是幾艘？", answer: "OK — one and one make two ships.", choices: ["OK — one and one make two ships.","OK — I only count one ship out there.","OK — that makes three ships, I think."], choicesZh: ["好的——一加一，一共兩艘船。","好的——我只數到外面有一艘。","好的——我想應該是三艘。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The sea is calm now. Please tell the sailors down at the dock.", promptZh: "現在海面很平靜。請告訴碼頭邊的水手們。", answer: "Sure — I'll tell them the sea is calm and safe to sail.", choices: ["Sure — I'll tell them the sea is calm and safe to sail.","OK — I'll tell them to wait until tomorrow anyway.","Well, the sailors can see the sea for themselves."], choicesZh: ["好的——我會告訴他們海面平靜，可以安心出航。","好的——我會叫他們還是等到明天再說。","嗯，水手們自己看海就知道了吧。"], reward: jobReward }
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
      { questionType: "sentence-choice", prompt: "Do you like the pink roses in my garden?", promptZh: "你喜歡我花園裡的粉紅玫瑰嗎？", answer: "Yes, I really love these pink roses!", choices: ["Yes, I really love these pink roses!","Hmm, the roses next door look prettier to me."], choicesZh: ["喜歡，我超愛這些粉紅玫瑰！","嗯，我覺得隔壁的玫瑰比較漂亮。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Look how the little cat sleeps by the flowers.", promptZh: "你看，小貓在花叢旁邊睡著了。", answer: "Aww, she looks so cosy by the flowers!", choices: ["Aww, she looks so cosy by the flowers!","Careful — cats can squash your flowers."], choicesZh: ["啊，她窩在花旁邊看起來好舒服！","小心——貓咪會把你的花壓壞喔。"], reward: chatReward }
    ]
  },
  schoolClassroom: {
    title: "Chat in the School Classroom",
    questions: [
      { questionType: "sentence-choice", prompt: "Good morning, Princess. Ready for class?", promptZh: "早安，公主。準備好上課了嗎？", answer: "Good morning, Teacher! I am all ready.", choices: ["Good morning, Teacher! I am all ready.","Morning… can class start a little later today?"], choicesZh: ["早安，老師！我全都準備好了。","早……今天可以晚一點上課嗎？"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "How do you feel about school today?", promptZh: "你今天覺得上學怎麼樣？", answer: "I feel great — school is fun today!", choices: ["Honestly, school feels a little long today.","I feel great — school is fun today!"], choicesZh: ["老實說，今天上學感覺有點漫長。","我覺得超棒——今天上學好好玩！"], reward: chatReward }
    ]
  },
  library: {
    title: "Chat in the Library",
    questions: [
      { questionType: "sentence-choice", prompt: "What books do you like, Princess?", promptZh: "公主，你喜歡什麼書？", answer: "Oh, I love story books best!", choices: ["Oh, I love story books best!","Hmm, books are not really my thing."], choicesZh: ["喔，我最愛故事書了！","嗯，我其實不太愛看書。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "We always speak softly in the library.", promptZh: "在圖書館裡我們都輕聲說話。", answer: "OK, I will speak softly too.", choices: ["But speaking softly is so hard for me!","OK, I will speak softly too."], choicesZh: ["可是輕聲說話對我好難喔！","好的，我也會輕聲說話。"], reward: chatReward }
    ]
  },
  temple: {
    title: "Chat at the Temple",
    questions: [
      { questionType: "sentence-choice", prompt: "How do you feel here, Princess?", promptZh: "公主，你在這裡感覺如何？", answer: "I feel calm and quiet here.", choices: ["I feel calm and quiet here.","I feel a bit sleepy here, to be honest."], choicesZh: ["我在這裡覺得平靜又安寧。","老實說，我在這裡有點想睡。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "These lilies smell sweet, don't they?", promptZh: "這些百合聞起來很香，對吧？", answer: "Yes, the lilies smell lovely!", choices: ["Hmm, the lilies smell a bit strong for me.","Yes, the lilies smell lovely!"], choicesZh: ["嗯，百合的味道對我來說有點濃。","對啊，百合聞起來好香！"], reward: chatReward }
    ]
  },
  administration: {
    title: "Chat at the Administration Building",
    questions: [
      { questionType: "sentence-choice", prompt: "Nice to meet you, Princess. I am Otto.", promptZh: "很高興見到你，公主。我是奧托。", answer: "Nice to meet you too, Otto!", choices: ["Nice to meet you too, Otto!","Sorry, Otto — I really must be going."], choicesZh: ["我也很高興見到你，奧托！","抱歉，奧托——我真的得走了。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Are you busy today, or do you have time to chat?", promptZh: "你今天忙嗎？還是有時間聊聊天？", answer: "I have time — let's chat a little!", choices: ["Very busy today — maybe another time.","I have time — let's chat a little!"], choicesZh: ["今天很忙——下次再聊吧。","我有時間——我們聊一下吧！"], reward: chatReward }
    ]
  },
  market: {
    title: "Chat at Market Square",
    questions: [
      { questionType: "sentence-choice", prompt: "Are you hungry, Princess? The bread is still warm.", promptZh: "公主，你餓了嗎？麵包還是溫熱的喔。", answer: "Yes! Warm bread sounds perfect right now.", choices: ["Yes! Warm bread sounds perfect right now.","Not hungry, thanks — I had a big breakfast."], choicesZh: ["要！現在來點溫熱的麵包太棒了。","不餓，謝謝——我早餐吃很多。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "I baked this bread fresh this morning.", promptZh: "這個麵包是我今天早上剛烤的。", answer: "Mmm — fresh bread! It smells wonderful.", choices: ["Hmm, the bread from yesterday was better, I think.","Mmm — fresh bread! It smells wonderful."], choicesZh: ["嗯，我覺得昨天的麵包比較好吃。","嗯——新鮮麵包！聞起來好香。"], reward: chatReward }
    ]
  },
  harbor: {
    title: "Chat at the Fish Shop",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like the sea, Princess?", promptZh: "公主，你喜歡大海嗎？", answer: "Yes, I love the sea and the salty air!", choices: ["Yes, I love the sea and the salty air!","Hmm, the sea is a bit too loud for me."], choicesZh: ["喜歡，我愛大海，也愛鹹鹹的海風！","嗯，大海對我來說有點吵。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "My fish came straight off the boat today.", promptZh: "我的魚是今天剛從船上卸下來的。", answer: "Wow, your fish look so fresh!", choices: ["Hmm, fish always smell a bit funny to me.","Wow, your fish look so fresh!"], choicesZh: ["嗯，魚對我來說總是有點怪味。","哇，你的魚看起來好新鮮！"], reward: chatReward }
    ]
  },
  port: {
    title: "Chat at Harbor Port",
    questions: [
      { questionType: "sentence-choice", prompt: "Have you ever sailed on a big ship, Princess?", promptZh: "公主，你搭過大船嗎？", answer: "Not yet, but I would love to sail one day!", choices: ["Not yet, but I would love to sail one day!","Big ships rock too much for me, I think."], choicesZh: ["還沒有，但我好想有一天出海航行！","我覺得大船搖來搖去，我會受不了。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The harbor is busy but happy today.", promptZh: "今天的港口很忙碌，但很熱鬧開心。", answer: "Yes, the harbor feels so lively today!", choices: ["Yes, the harbor feels so lively today!","A bit too busy for me — I like quiet places."], choicesZh: ["對啊，今天港口好有活力！","對我來說有點太忙了——我喜歡安靜的地方。"], reward: chatReward }
    ]
  },
  boutique: {
    title: "Chat at the Dress Boutique",
    questions: [
      { questionType: "sentence-choice", prompt: "This pink dress just came in. What do you think?", promptZh: "這件粉紅洋裝剛到貨。你覺得怎麼樣？", answer: "It is so pretty! I love the pink.", choices: ["It is so pretty! I love the pink.","Hmm, pink is not really my colour."], choicesZh: ["好漂亮！我最愛粉紅色了。","嗯，粉紅色不太是我的菜。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Thank you for visiting my little shop.", promptZh: "謝謝你來我的小店。", answer: "I love your shop — it is so pretty!", choices: ["Your shop is nice, but it is a bit small.","I love your shop — it is so pretty!"], choicesZh: ["你的店不錯，只是有點小。","我好喜歡你的店——好漂亮！"], reward: chatReward }
    ]
  },
  lighthouse: {
    title: "Chat at the Lighthouse",
    questions: [
      { questionType: "sentence-choice", prompt: "You can see the whole sea from up here, Princess.", promptZh: "公主，從這上面可以看到整片大海喔。", answer: "Wow, the sea looks amazing from here!", choices: ["Wow, the sea looks amazing from here!","The sea is pretty, but it is too high up here for me!"], choicesZh: ["哇，從這裡看大海好壯觀！","海是很美啦，但這裡對我來說太高了！"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The sea wind is strong tonight, Princess.", promptZh: "公主，今晚的海風很強。", answer: "I love the sea wind on my face!", choices: ["The wind is too cold — let's go inside.","I love the sea wind on my face!"], choicesZh: ["風太冷了——我們進去吧。","我好喜歡海風吹在臉上的感覺！"], reward: chatReward }
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
  market: { ...singleSceneArt("market"), scene: "scene-market", npc: "Auntie Pom", npcImage: npcImage("auntie-pom-market"), npcNaturalHeightCm: 155, travelAction: "Visit", travelLine: "Hello, Princess! The bread is warm, fresh from the oven.", travelLineZh: "你好，公主！麵包剛出爐，還熱呼呼的。" },
  harbor: { ...singleSceneArt("harbor"), scene: "scene-harbor", npc: "Nami", npcImage: npcImage("nami"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Hi, Princess! Today's fish came straight off the boat.", travelLineZh: "嗨，公主！今天的魚剛從船上卸下來。" },
  port: { ...singleSceneArt("harbor"), scene: "scene-port", npc: "Dock Guide", npcImage: npcImage("dock-guide"), npcNaturalHeightCm: 175, travelAction: "Visit", travelLine: "Hello, Princess! The port is busy today — watch your step.", travelLineZh: "你好，公主！今天港口很忙——走路小心喔。" },
  boutique: { ...urbanShopArt("dress-boutique"), scene: "scene-urban-dress-boutique", npc: "Rena", npcImage: npcImage("rena"), npcNaturalHeightCm: 165, travelAction: "Shop", travelLine: "Welcome back, Princess! New town styles just arrived.", travelLineZh: "歡迎回來，公主！新的城鎮款式剛到貨。", shopGreeting: "Come look around, Princess — town hair, everyday outfits, walking shoes, and clever little accessories.", shopGreetingZh: "公主，來逛逛吧——城鎮髮型、日常服裝、好走的鞋，還有精巧的小配件。" },
  lighthouse: { ...singleSceneArt("lighthouse"), scene: "scene-lighthouse", npc: "Captain Sol", npcImage: npcImage("captain-sol"), npcNaturalHeightCm: 178, travelAction: "Visit", travelLine: "Hello, Princess. Welcome to the lighthouse.", travelLineZh: "你好，公主。歡迎來到燈塔。" }
}, urbanLessonBank, { area: "urban", vocabProfile: urbanVocabularyProfile.id }),
  urbanChatLessonBank, { area: "urban", vocabProfile: urbanVocabularyProfile.id }, "chatLesson");
//#endregion 對話場景設定
