//#region 匯入共用工具
// 將題庫清單轉成遊戲執行時需要的 lessons（課程資料）與 quest templates（任務模板）。
import { mergeLessons } from "../_shared/lesson-helpers.js";
//#endregion 匯入共用工具

//#region 素材路徑工具
// 所有本地區圖片路徑集中在這裡；換素材或快取版本參數時優先改這段。
const npcImage = (name) => `content-package/areas/wild/assets/characters/${name}.webp?v=20260606-character-scale-r1`;
const sceneVersion = "20260606-issue66-adv-scenes-r1";
const sceneArt = (src, options = {}) => ({ sceneArt: { src, tone: "wild", ...options } });
const wildSceneArt = (name, options = {}) => sceneArt(`content-package/areas/wild/assets/scenes/${name}-1024.webp?v=${sceneVersion}`, options);
const wildShopArt = (name) => wildSceneArt(name, { tone: "shop" });
const wildPathArt = wildSceneArt("wild-path");
//#endregion 素材路徑工具

//#region 英文等級與獎勵設定
// 定義本地區使用的英文程度、顯示名稱與答題獎勵。
export const wildVocabularyProfile = Object.freeze({
  id: "cambridge-a2-flyers",
  label: "Cambridge A2 Flyers",
  levelLabel: "Cambridge Flyers",
  rewardCoins: 2000,
  note: "Wild fantasy scenes use longer Flyers-style sentences with richer story words."
});
//#endregion 英文等級與獎勵設定

//#region 地圖與地點設定
// area 是地圖的主設定；新增地圖圖示或改座標主要看 nodes 與 locations。
export const wildArea = Object.freeze({
  id: "wild",
  label: "Wild",
  view: "map",
  mapImage: "content-package/areas/wild/assets/map-1536.webp?v=20260606-issue66-map-contract-r1",
  imageSize: { width: 1536, height: 1536 },
  vocabularyProfile: wildVocabularyProfile,
  // nodes 控制地圖上的路網與圖示座標；x / y 是相對地圖寬高的百分比。
  nodes: {
    wildEntrance: { id: "wildEntrance", label: "World Path", x: 14, y: 90, links: ["treeSpiritGrove", "wizardHut", "threePigsCottage"] },
    elfGlade: { id: "elfGlade", label: "Elf Glade", x: 22, y: 40, links: ["dwarfCottage", "fairyAtelier", "halflingVillage"] },
    fairyAtelier: { id: "fairyAtelier", label: "Fairy Atelier", x: 38, y: 52, links: ["elfGlade", "halflingVillage", "wizardHut"] },
    dwarfCottage: { id: "dwarfCottage", label: "Dwarf Cottage", x: 25, y: 72, links: ["elfGlade", "stoneGolemPass", "halflingVillage"] },
    stoneGolemPass: { id: "stoneGolemPass", label: "Stone Golem Pass", x: 52, y: 32, links: ["dwarfCottage", "wizardHut", "elfGlade"] },
    halflingVillage: { id: "halflingVillage", label: "Halfling Village", x: 45, y: 80, links: ["elfGlade", "dwarfCottage", "fairyAtelier", "redHoodPath", "threePigsCottage"] },
    wizardHut: { id: "wizardHut", label: "Wizard Hut", x: 75, y: 40, links: ["stoneGolemPass", "treeSpiritGrove", "threePigsCottage", "fairyAtelier"] },
    redHoodPath: { id: "redHoodPath", label: "Red Riding Hood Path", x: 12, y: 60, links: ["halflingVillage", "threePigsCottage"] },
    threePigsCottage: { id: "threePigsCottage", label: "Three Pigs Cottage", x: 66, y: 82, links: ["redHoodPath", "halflingVillage", "wizardHut", "treeSpiritGrove", "wildEntrance"] },
    treeSpiritGrove: { id: "treeSpiritGrove", label: "Tree Spirit Grove", x: 80, y: 62, links: ["wizardHut", "threePigsCottage", "wildEntrance"] }
  },
  // locations 控制地圖圖示進入後的場景、NPC、商店與提示文字。
  locations: [
    { id: "wildExit", area: "wild", node: "wildEntrance", label: "World Path", icon: "↩", npcClass: "npc-none", npc: "Wild Sign", kind: "gate", markerStyle: "portal", portalId: "entrance", hint: "The path returns to the kingdom world map." },
    { id: "elfGlade", area: "wild", node: "elfGlade", label: "Elf Glade", icon: "🧝", npc: "Elia", scene: "scene-wild-elf-glade", npcImage: npcImage("elia"), hint: "The elf glade glows with tiny flowers." },
    { id: "fairyAtelier", area: "wild", node: "fairyAtelier", label: "Fairy Atelier", icon: "👗", npc: "Faye", scene: "scene-wild-fairy-atelier", npcImage: npcImage("fairy-atelier"), shopCategories: ["dresses", "accessories"], defaultCategory: "dresses", hint: "Faye sells fairy dresses and accessories in the glade." },
    { id: "dwarfCottage", area: "wild", node: "dwarfCottage", label: "Dwarf Cottage", icon: "🛖", npc: "Pip", scene: "scene-wild-dwarf-cottage", npcImage: npcImage("pip"), shopCategories: ["outerwear", "shoes"], defaultCategory: "outerwear", hint: "Pip keeps handmade wild outerwear and shoes in a warm cottage." },
    { id: "stoneGolemPass", area: "wild", node: "stoneGolemPass", label: "Stone Golem Pass", icon: "🪨", npc: "Goro", scene: "scene-wild-golem-pass", npcImage: npcImage("goro"), hint: "A friendly stone golem watches the mountain pass." },
    { id: "halflingVillage", area: "wild", node: "halflingVillage", label: "Halfling Village", icon: "🏘", npc: "Penny", scene: "scene-wild-halfling-village", npcImage: npcImage("penny"), hint: "Small round doors peek from the hill." },
    { id: "wizardHut", area: "wild", node: "wizardHut", label: "Wizard Hut", icon: "🪄", npc: "Wiz Beryl", scene: "scene-wild-wizard-hut", npcImage: npcImage("wiz-beryl"), hint: "A purple roof curls above jars and herbs." },
    { id: "redHoodPath", area: "wild", node: "redHoodPath", label: "Red Riding Hood Path", icon: "🧺", npc: "Ruby", scene: "scene-wild-red-hood-path", npcImage: npcImage("ruby"), hint: "A red hood and basket wait on the wild path." },
    { id: "threePigsCottage", area: "wild", node: "threePigsCottage", label: "Three Pigs Cottage", icon: "🐷", npc: "Pippo", scene: "scene-wild-three-pigs", npcImage: npcImage("pippo"), hint: "Three small cottages stand under warm trees." },
    { id: "treeSpiritGrove", area: "wild", node: "treeSpiritGrove", label: "Tree Spirit Grove", icon: "✨", npc: "Sylvie", scene: "scene-wild-tree-spirit-grove", npcImage: npcImage("sylvie"), hint: "A gentle tree spirit listens to children practicing English." }
  ],
  // actors 是地圖上的動態環境效果，不是可點擊地點。
  actors: [],
  defaultNode: "wildEntrance",
  enabled: true
});
//#endregion 地圖與地點設定

//#region 場景自帶題庫（issue #96 結構；issue #149 全量改寫：角色第一人稱、prompt 即台詞、選項即公主回應、無 opening/ending）
// wildLessonBank：以 place 為鍵的「打工任務」題庫（答對得 coins＝勞動所得）。
// issue #149：Flyers 分級（現在完成式／過去進行式＋when／if…will／關係子句／間接問句／情態）；每場景 3 題、每題 3 選項；保留奇幻角色、互動功能生活化。
const jobReward = { coins: 2000 };
const wildLessonBank = Object.freeze({
  elfGlade: {
    title: "Help in the Elf Glade",
    questions: [
      { questionType: "sentence-choice", prompt: "I have watered all the flowers, but I still cannot see the bell. Please tell me your progress.", promptZh: "我已經澆完所有花，但還是沒看到鈴鐺。請告訴我你的進度。", answer: "Of course! I have watered all the flowers.", choices: ["Of course! I have watered all the flowers.","Of course! I was water all the flowers.","Of course! I watered all the flowers yesterday."], choicesZh: ["當然！我已經澆完所有花了。","當然！我過去正在澆所有花。","當然！我昨天澆完所有花。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The flower which glows the brightest may hide the bell. Please tell me where to look.", promptZh: "發光最亮的那朵花可能藏著鈴鐺。請告訴我該往哪裡找。", answer: "Sure! The flower which glows is hiding the bell.", choices: ["Sure! The flower who glows is hiding the bell.","Sure! The flower which glows is hiding the bell.","Sure! The flower glowed will hiding the bell."], choicesZh: ["好的！那朵人會發光的花藏著鈴鐺。","好的！那朵會發光的花藏著鈴鐺。","好的！那朵發光花將正在藏鈴鐺。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "If we ring the bell, the elves will hear us. Please help me say the plan.", promptZh: "如果我們搖鈴，精靈們就會聽到我們。請幫我說出這個計畫。", answer: "Certainly! If we ring the bell, the elves will come.", choices: ["Certainly! If we rang the bell, the elves hear us yesterday.","Certainly! If we ring the bell, the elves heard us.","Certainly! If we ring the bell, the elves will come."], choicesZh: ["當然！如果我們昨天搖鈴，精靈聽到我們。","當然！如果我們搖鈴，精靈聽過我們。","當然！如果我們搖鈴，精靈們就會來。"], reward: jobReward }
    ]
  },
  dwarfCottage: {
    title: "Help at the Dwarf Cottage",
    questions: [
      { questionType: "sentence-choice", prompt: "I have looked near the door, but I have not found the wheel. Please tell me what you found.", promptZh: "我已經找過門邊，但還沒找到輪子。請告訴我你找到什麼。", answer: "Of course! I have found the missing wheel.", choices: ["Of course! I have found the missing wheel.","Of course! I has found the missing wheel.","Of course! I was find the missing wheel."], choicesZh: ["當然！我已經找到不見的輪子了。","當然！我已經找到不見的輪子。","當然！我過去正在找到不見的輪子。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The hammer that I made is on the bench. Please tell me which tool we need.", promptZh: "我做的槌子在長椅上。請告訴我我們需要哪個工具。", answer: "Sure! The hammer that Pip made is on the bench.", choices: ["Sure! The hammer who Pip made is on the bench.","Sure! The hammer that Pip made is on the bench.","Sure! The hammer was on the bench yesterday."], choicesZh: ["好的！皮普做的人槌子在長椅上。","好的！皮普做的槌子在長椅上。","好的！槌子昨天在長椅上。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "If we fix the wheel, the cart will move again. Please help me say our plan.", promptZh: "如果我們修好輪子，推車就會再動起來。請幫我說出我們的計畫。", answer: "Certainly! If we fix the wheel, the cart will move again.", choices: ["Certainly! If we fixed the wheel, the cart moves yesterday.","Certainly! If we fix the wheel, the cart moved again.","Certainly! If we fix the wheel, the cart will move again."], choicesZh: ["當然！如果我們昨天修好輪子，推車移動。","當然！如果我們修好輪子，推車以前動了。","當然！如果我們修好輪子，推車就會再動起來。"], reward: jobReward }
    ]
  },
  stoneGolemPass: {
    title: "Help at Stone Golem Pass",
    questions: [
      { questionType: "sentence-choice", prompt: "I have cleaned part of the sign. Please tell me how much is done.", promptZh: "我已經清掉一部分路牌。請告訴我完成多少了。", answer: "Of course! I have cleaned half of the sign.", choices: ["Of course! I have cleaned half of the sign.","Of course! I has cleaned half of the sign.","Of course! I was clean half of the sign."], choicesZh: ["當然！我已經清掉一半路牌了。","當然！我已經清掉一半路牌。","當然！我過去正在清一半路牌。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The rock which fell from the hill is blocking the road. Please describe the problem.", promptZh: "從山上掉下來的石頭擋住了路。請描述這個問題。", answer: "Sure! The rock which fell is blocking the road.", choices: ["Sure! The rock that fell is near the road.","Sure! The rock which fell is blocking the road.","Sure! The rock will blocked the road yesterday."], choicesZh: ["好的！掉下來的石頭在路旁邊。","好的！掉下來的石頭正在擋路。","好的！石頭昨天將會擋路。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "If we move the rock, travellers will pass safely. Please help me say the plan.", promptZh: "如果我們移開石頭，旅人就可以安全通過。請幫我說出這個計畫。", answer: "Certainly! If we move the rock, travellers will pass safely.", choices: ["Certainly! If we move the rock, travellers passed yesterday.","Certainly! If we move the rock, travellers will be safe.","Certainly! If we move the rock, travellers will pass safely."], choicesZh: ["當然！如果我們移開石頭，旅人昨天通過了。","當然！如果我們移開石頭，旅人就會安全。","當然！如果我們移開石頭，旅人就能安全通過。"], reward: jobReward }
    ]
  },
  halflingVillage: {
    title: "Help in Halfling Village",
    questions: [
      { questionType: "sentence-choice", prompt: "I have checked four doors, and you have checked two more. Please help me report our progress.", promptZh: "我已經檢查了四扇門，你又檢查了兩扇。請幫我回報我們的進度。", answer: "Of course! We have checked six doors already.", choices: ["Of course! We have checked six doors already.","Of course! We has checked six doors already.","Of course! We were check six doors tomorrow."], choicesZh: ["當然！我們已經檢查六扇門了。","當然！我們已經檢查六扇門。","當然！我們明天正在檢查六扇門。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The door which is green may hide the basket. Please tell me which door to try.", promptZh: "綠色的那扇門可能藏著籃子。請告訴我該試哪一扇門。", answer: "Sure! The door which is green hides the basket.", choices: ["Sure! The door who is green hides the basket.","Sure! The door which is green hides the basket.","Sure! The door will hiding the basket."], choicesZh: ["好的！綠色的人門藏著籃子。","好的！綠色的那扇門藏著籃子。","好的！門將會正在藏籃子。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I am not sure which door is mine. Please ask me politely for a hint.", promptZh: "我不太確定哪一扇是我的門。請有禮貌地向我詢問線索。", answer: "Sure! Can you tell me which door is yours?", choices: ["Sure! Which door yours is?","Sure! Which door is you?","Sure! Can you tell me which door is yours?"], choicesZh: ["好的！哪扇門你的？","好的！哪扇門是你？","好的！你可以告訴我哪一扇門是你的嗎？"], reward: jobReward }
    ]
  },
  wizardHut: {
    title: "Help at the Wizard Hut",
    questions: [
      { questionType: "sentence-choice", prompt: "I have labelled two jars, and you have labelled one more. Please report our progress.", promptZh: "我已經貼好兩個罐子，你又貼好一個。請回報我們的進度。", answer: "Of course! We have labelled three jars.", choices: ["Of course! We have labelled three jars.","Of course! We has labelled three jars.","Of course! We were label three jars."], choicesZh: ["當然！我們已經貼好三個罐子。","當然！我們已經貼好三個罐子。","當然！我們過去正在貼三個罐子。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The jar that glows blue is the herb jar I need. Please tell me which jar to take.", promptZh: "發藍光的罐子是我需要的藥草罐。請告訴我該拿哪一個。", answer: "Sure! The jar that glows blue is the herb jar.", choices: ["Sure! The jar who glows blue is the herb jar.","Sure! The jar that glows blue is the herb jar.","Sure! The jar glowed blue yesterday."], choicesZh: ["好的！發藍光的人罐子是藥草罐。","好的！發藍光的罐子是藥草罐。","好的！罐子昨天發藍光。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The shelf is very high. Please help me say the safe plan.", promptZh: "架子很高。請幫我說出安全的計畫。", answer: "Certainly! If we use the ladder, we will reach the shelf safely.", choices: ["Certainly! If we jump, we will reach the shelf.","Certainly! We should throw the jars down.","Certainly! If we use the ladder, we will reach the shelf safely."], choicesZh: ["當然！如果我們跳，就能拿到架子。","當然！我們應該把罐子丟下來。","當然！如果我們使用梯子，就能安全拿到架子上的東西。"], reward: jobReward }
    ]
  },
  redHoodPath: {
    title: "Help on Red Riding Hood Path",
    questions: [
      { questionType: "sentence-choice", prompt: "I have cleared the leaves near the first tree. Please tell me your progress.", promptZh: "我已經清掉第一棵樹旁的落葉。請告訴我你的進度。", answer: "Of course! I have cleared the leaves.", choices: ["Of course! I have cleared the leaves.","Of course! I has cleared the leaves.","Of course! I was clear the leaves tomorrow."], choicesZh: ["當然！我已經清掉落葉了。","當然！我已經清掉落葉。","當然！我明天正在清落葉。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Grandma, who is ill, needs this basket. Please say who the basket is for.", promptZh: "生病的奶奶需要這個籃子。請說出這個籃子是給誰的。", answer: "Sure! The basket is for Grandma, who is ill.", choices: ["Sure! The basket is for Grandma, which is a road.","Sure! The basket is for Grandma, who is ill.","Sure! The basket was for Grandma yesterday."], choicesZh: ["好的！籃子是給奶奶，道路的那個。","好的！籃子是給生病的奶奶。","好的！籃子昨天是給奶奶的。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "We should stay safe on the path. Please give me good advice.", promptZh: "我們在小路上應該保持安全。請給我好的建議。", answer: "Certainly! We should stay on the path and not talk to strangers.", choices: ["Certainly! We should talk to every stranger.","Certainly! We should leave the path and run.","Certainly! We should stay on the path and not talk to strangers."], choicesZh: ["當然！我們應該和每個陌生人說話。","當然！我們應該離開小路去跑。","當然！我們應該走在小路上，不和陌生人說話。"], reward: jobReward }
    ]
  },
  threePigsCottage: {
    title: "Help at the Three Pigs Cottage",
    questions: [
      { questionType: "sentence-choice", prompt: "I have tied one side of the straw roof. Please tell me what you have done.", promptZh: "我已經綁好稻草屋頂的一邊。請告訴我你做了什麼。", answer: "Of course! I have tied the straw down.", choices: ["Of course! I have tied the straw down.","Of course! I has tied the straw down.","Of course! I was tie the straw tomorrow."], choicesZh: ["當然！我已經把稻草綁好了。","當然！我已經把稻草綁好。","當然！我明天正在綁稻草。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "One cottage is made of brick, and two are made of straw. Please help me describe them.", promptZh: "一間小屋是磚頭做的，兩間是稻草做的。請幫我描述它們。", answer: "Sure! Two cottages are made of straw.", choices: ["Sure! Two cottages are made of brick.","Sure! Two cottages are made of straw.","Sure! Two cottages are made of wood."], choicesZh: ["好的！兩間小屋是磚頭做的。","好的！兩間小屋是稻草做的。","好的！兩間小屋是木頭做的。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "If the wind blows again, we need the safest house. Please say the plan.", promptZh: "如果風又吹起來，我們需要最安全的房子。請說出這個計畫。", answer: "Certainly! If the wind blows, the brick house will stand.", choices: ["Certainly! If the wind blows, the straw house may fall.","Certainly! If the wind blew, the brick house stand yesterday.","Certainly! If the wind blows, the brick house will stand."], choicesZh: ["當然！如果風吹，稻草屋可能會倒。","當然！如果風吹了，磚房昨天站。","當然！如果風吹起來，磚房會站得住。"], reward: jobReward }
    ]
  },
  treeSpiritGrove: {
    title: "Help in the Tree Spirit Grove",
    questions: [
      { questionType: "sentence-choice", prompt: "I have prepared the soil. Please tell me what you have done with the seed.", promptZh: "我已經準備好土壤。請告訴我你對種子做了什麼。", answer: "Of course! I have planted the glowing seed.", choices: ["Of course! I have planted the glowing seed.","Of course! I has planted the glowing seed.","Of course! I was plant the glowing seed."], choicesZh: ["當然！我已經種下發光種子了。","當然！我已經種下發光種子。","當然！我過去正在種發光種子。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The tree that whispers is the oldest one. Please help me name the right tree.", promptZh: "會低語的那棵樹是最古老的。請幫我說出正確的樹。", answer: "Sure! The tree that whispers is the oldest one.", choices: ["Sure! The tree who whispers is the oldest one.","Sure! The tree that whispers is the oldest one.","Sure! The tree will oldest when it whispered."], choicesZh: ["好的！會低語的人樹是最古老的。","好的！會低語的那棵樹是最古老的。","好的！樹低語時將會最老。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "If the seed gets moonlight, it will grow. Please help me say what will happen.", promptZh: "如果種子得到月光，它就會成長。請幫我說出會發生什麼。", answer: "Certainly! If the seed gets moonlight, it will grow.", choices: ["Certainly! If the seed gets water, it will grow.","Certainly! If the seed got sunlight, it grew.","Certainly! If the seed gets moonlight, it will grow."], choicesZh: ["當然！如果種子得到水，它就會成長。","當然！如果種子得到陽光，它以前長大了。","當然！如果種子得到月光，它就會成長。"], reward: jobReward }
    ]
  }
});
//#endregion 場景自帶題庫

//#region 生活聊天題庫（issue #135 spec#11；issue #149 全量改寫：角色第一人稱、無 opening/ending）
// wildChatLessonBank：各 NPC 場景的「生活聊天」題組（Flyers 程度）——角色第一人稱寒暄／關係子句／第一條件句好意；每場景 2 題、每題 2 選項。
const chatReward = { coins: 0 };
const wildChatLessonBank = Object.freeze({
  elfGlade: {
    title: "Chat in the Elf Glade",
    questions: [
      { questionType: "sentence-choice", prompt: "How have you been, Princess?", promptZh: "公主，你最近過得如何？", answer: "Oh, I have been really well, Elia!", choices: ["Oh, I have been really well, Elia!","I was carrying fish when the book will sing."], choicesZh: ["喔，我最近過得很好，艾莉亞！","書會唱歌時，我正在搬魚。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The flowers that glow are beautiful tonight.", promptZh: "今晚這些會發光的花很美。", answer: "Yes, the flowers that glow are so beautiful!", choices: ["The cart which is blue is beside the path.","Yes, the flowers that glow are so beautiful!"], choicesZh: ["藍色推車在小路旁。","對啊，會發光的花好美！"], reward: chatReward }
    ]
  },
  stoneGolemPass: {
    title: "Chat at Stone Golem Pass",
    questions: [
      { questionType: "sentence-choice", prompt: "I have felt lonely at the pass today.", promptZh: "我今天在山路上覺得有點孤單。", answer: "Oh, do not worry! I will visit you again.", choices: ["Oh, do not worry! I will visit you again.","The sign has fallen near the bridge."], choicesZh: ["喔，別擔心！我會再來看你的。","路牌倒在橋旁邊。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The travellers who pass here need a clear road.", promptZh: "經過這裡的旅人需要一條清楚的路。", answer: "Yes, the travellers who pass here really need a clear road.", choices: ["The travellers which is pass here need soup.","Yes, the travellers who pass here really need a clear road."], choicesZh: ["經過這裡的物旅人需要湯。","對啊，經過這裡的旅人真的需要一條清楚的路。"], reward: chatReward }
    ]
  },
  halflingVillage: {
    title: "Chat in Halfling Village",
    questions: [
      { questionType: "sentence-choice", prompt: "Have you had a good day, Princess?", promptZh: "公主，你今天過得好嗎？", answer: "Yes, I have had a really good day!", choices: ["Yes, I have had a really good day!","Yes, I has have a green door."], choicesZh: ["對啊，我今天過得超棒！","是的，我有一扇綠門。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The door that is round is my favourite door.", promptZh: "這扇圓圓的門是我最喜歡的門。", answer: "Wow, the door that is round is so pretty!", choices: ["The door who is round is a fish.","Wow, the door that is round is so pretty!"], choicesZh: ["圓圓的人門是一條魚。","哇，那扇圓圓的門好漂亮！"], reward: chatReward }
    ]
  },
  wizardHut: {
    title: "Chat at the Wizard Hut",
    questions: [
      { questionType: "sentence-choice", prompt: "Can you tell me what this herb does?", promptZh: "你可以告訴我這種藥草有什麼作用嗎？", answer: "Oh, it helps sleepy flowers wake up!", choices: ["Oh, it helps sleepy flowers wake up!","What does this herb it does?"], choicesZh: ["喔，它可以幫愛睏的花醒過來！","這藥草它做什麼？"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "I have been mixing herbs since sunset.", promptZh: "我從日落後就一直在混合藥草。", answer: "Wow, you have been mixing herbs since sunset!", choices: ["You has been mixing herbs.","Wow, you have been mixing herbs since sunset!"], choicesZh: ["你一直混合藥草。","哇，你從日落後就一直在混合藥草呢！"], reward: chatReward }
    ]
  },
  redHoodPath: {
    title: "Chat on Red Riding Hood Path",
    questions: [
      { questionType: "sentence-choice", prompt: "Where are you going today, Princess?", promptZh: "公主，你今天要去哪裡？", answer: "I am going to Grandma's house with you!", choices: ["I am going to Grandma's house with you!","I have ate the road yesterday."], choicesZh: ["我要和你一起去奶奶家呀！","我昨天已經吃掉路。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The path is long, and I feel safer with a friend.", promptZh: "路很長，有朋友一起走我覺得比較安全。", answer: "Of course, if the path is long, I will walk with you.", choices: ["The basket who walks is blue.","Of course, if the path is long, I will walk with you."], choicesZh: ["會走路的人籃子是藍色的。","當然，如果路很長，我會陪你一起走。"], reward: chatReward }
    ]
  },
  threePigsCottage: {
    title: "Chat at the Three Pigs Cottage",
    questions: [
      { questionType: "sentence-choice", prompt: "Have you built a new house, Pippo?", promptZh: "皮波，你蓋了新房子嗎？", answer: "Yes, I have just built a new house!", choices: ["Yes, I have just built a new house!","Yes, I has build a new fish."], choicesZh: ["對啊，我剛蓋好一間新房子！","是的，我蓋了一條新魚。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The house that is built of brick feels safe.", promptZh: "用磚頭蓋的房子讓人覺得安全。", answer: "Yes, the house that is built of brick is really strong!", choices: ["The house who is brick feels soup.","Yes, the house that is built of brick is really strong!"], choicesZh: ["是磚頭的人房子感覺湯。","對啊，用磚頭蓋的房子真堅固！"], reward: chatReward }
    ]
  },
  treeSpiritGrove: {
    title: "Chat in the Tree Spirit Grove",
    questions: [
      { questionType: "sentence-choice", prompt: "How have you been, Princess?", promptZh: "公主，你最近過得如何？", answer: "I have been helping my friends all day!", choices: ["I have been helping my friends all day!","I has been under the roof."], choicesZh: ["我今天一整天都在幫朋友呢！","我一直在屋頂下面。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Thank you for caring for the peaceful grove.", promptZh: "謝謝你照顧這片平靜的樹林。", answer: "Thank you so much for the peaceful grove!", choices: ["The door which is round is a hammer.","Thank you so much for the peaceful grove!"], choicesZh: ["圓圓的門是一把槌子。","真謝謝你給我這片平靜的樹林！"], reward: chatReward }
    ]
  },
  fairyAtelier: {
    title: "Chat at the Fairy Atelier",
    questions: [
      { questionType: "sentence-choice", prompt: "Have you been well, Princess?", promptZh: "公主，你最近過得好嗎？", answer: "I have been really well, Faye!", choices: ["I have been really well, Faye!","I has been in the cart."], choicesZh: ["我最近過得很好，菲伊！","我有一直在推車裡。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The dress that sparkles is my favourite today.", promptZh: "這件會閃亮的洋裝是我今天最喜歡的。", answer: "Wow, the dress that sparkles is so lovely!", choices: ["The dress who sparkles is a hammer.","Wow, the dress that sparkles is so lovely!"], choicesZh: ["會閃亮的人洋裝是一把槌子。","哇，會閃亮的洋裝好美！"], reward: chatReward }
    ]
  },
  dwarfCottage: {
    title: "Chat at the Dwarf Cottage",
    questions: [
      { questionType: "sentence-choice", prompt: "It is good to see you again, Princess.", promptZh: "很高興又見到你，公主。", answer: "It is so good to see you too, Pip!", choices: ["It is so good to see you too, Pip!","I were seeing the wheel tomorrow."], choicesZh: ["我也好高興又見到你，皮普！","我明天正在看車輪。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The coat that I made is warm.", promptZh: "我做的這件外套很暖和。", answer: "Wow, the coat that you made is so warm!", choices: ["The coat who made me is warm.","Wow, the coat that you made is so warm!"], choicesZh: ["做我的人外套很暖。","哇，你做的外套好暖和！"], reward: chatReward }
    ]
  }
});
//#endregion 生活聊天題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
// issue #149：travelLine／shopGreeting 改為角色第一人稱對公主發話，並補中文（travelLineZh／shopGreetingZh）。
export const wildSceneConfigs = mergeLessons(mergeLessons({
  wildExit: { ...wildPathArt, scene: "scene-wild-path", npcClass: "npc-none", npc: "Wild Sign", travelAction: "World Map", travelLine: "Princess, this wild path returns to the kingdom world map.", travelLineZh: "公主，這條野地小路會回到王國世界地圖。" },
  elfGlade: { ...wildSceneArt("elf-glade"), scene: "scene-wild-elf-glade", npc: "Elia", npcImage: npcImage("elia"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Hello, Princess. I have been listening to the glowing flowers.", travelLineZh: "你好，公主。我一直在聽發光花的聲音。" },
  fairyAtelier: { ...wildShopArt("fairy-atelier"), scene: "scene-wild-fairy-atelier", npc: "Faye", npcImage: npcImage("fairy-atelier"), npcNaturalHeightCm: 150, travelAction: "Shop", travelLine: "Welcome, Princess. I have made dresses that sparkle softly.", travelLineZh: "歡迎，公主。我做了會柔柔發亮的洋裝。", shopGreeting: "Pick a fairy dress or a bright accessory, Princess.", shopGreetingZh: "公主，選一件仙子洋裝或一個亮亮的配件吧。" },
  dwarfCottage: { ...wildSceneArt("dwarf-cottage"), scene: "scene-wild-dwarf-cottage", npc: "Pip", npcImage: npcImage("pip"), npcNaturalHeightCm: 125, travelAction: "Shop", travelLine: "Hello, Princess. I have made warm coats and sturdy shoes.", travelLineZh: "你好，公主。我做了暖和的外套和耐走的鞋。", shopGreeting: "Choose outerwear or shoes for the wild road, Princess.", shopGreetingZh: "公主，為野地道路選外套或鞋子吧。" },
  stoneGolemPass: { ...wildSceneArt("golem-pass"), scene: "scene-wild-golem-pass", npc: "Goro", npcImage: npcImage("goro"), npcNaturalHeightCm: 200, travelAction: "Visit", travelLine: "Hello, Princess. I have guarded this old pass for many years.", travelLineZh: "你好，公主。我守護這條古老山路很多年了。" },
  halflingVillage: { ...wildSceneArt("halfling-village"), scene: "scene-wild-halfling-village", npc: "Penny", npcImage: npcImage("penny"), npcNaturalHeightCm: 100, travelAction: "Visit", travelLine: "Hi, Princess. I have been waiting by my round green door.", travelLineZh: "嗨，公主。我一直在我的綠色圓門旁等你。" },
  wizardHut: { ...wildSceneArt("wizard-hut"), scene: "scene-wild-wizard-hut", npc: "Wiz Beryl", npcImage: npcImage("wiz-beryl"), npcNaturalHeightCm: 170, travelAction: "Visit", travelLine: "Good evening, Princess. I have been sorting herb jars under the purple roof.", travelLineZh: "晚安，公主。我一直在紫色屋頂下整理藥草罐。" },
  redHoodPath: { ...wildSceneArt("red-hood-path"), scene: "scene-wild-red-hood-path", npc: "Ruby", npcImage: npcImage("ruby"), npcNaturalHeightCm: 125, travelAction: "Visit", travelLine: "Hi, Princess. I have been checking my basket on the forest path.", travelLineZh: "嗨，公主。我一直在森林小路上檢查我的籃子。" },
  threePigsCottage: { ...wildSceneArt("three-pigs"), scene: "scene-wild-three-pigs", npc: "Pippo", npcImage: npcImage("pippo"), npcNaturalHeightCm: 90, travelAction: "Visit", travelLine: "Hello, Princess. I have been fixing the little cottages today.", travelLineZh: "你好，公主。我今天一直在修小屋。" },
  treeSpiritGrove: { ...wildSceneArt("tree-spirit-grove"), scene: "scene-wild-tree-spirit-grove", npc: "Sylvie", npcImage: npcImage("sylvie"), npcNaturalHeightCm: 170, travelAction: "Visit", travelLine: "Hello, Princess. I have been glowing softly among the branches.", travelLineZh: "你好，公主。我一直在樹枝間柔柔地發光。" }
}, wildLessonBank, { area: "wild", vocabProfile: wildVocabularyProfile.id }),
  wildChatLessonBank, { area: "wild", vocabProfile: wildVocabularyProfile.id }, "chatLesson");
//#endregion 對話場景設定
