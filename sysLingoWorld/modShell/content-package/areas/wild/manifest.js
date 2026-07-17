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
  rewardCoins: 115,
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
    wildEntrance: { id: "wildEntrance", label: "World Path", x: 32.6, y: 87.1, links: ["treeSpiritGrove", "wizardHut", "threePigsCottage"] },
    elfGlade: { id: "elfGlade", label: "Elf Glade", x: 54.2, y: 48.4, links: ["fairyAtelier", "halflingVillage"] },
    fairyAtelier: { id: "fairyAtelier", label: "Fairy Atelier", x: 38, y: 52, links: ["elfGlade", "halflingVillage", "wizardHut"] },
    stoneGolemPass: { id: "stoneGolemPass", label: "Stone Golem Pass", x: 52, y: 32, links: ["wizardHut", "elfGlade"] },
    halflingVillage: { id: "halflingVillage", label: "Halfling Village", x: 87.2, y: 54.6, links: ["elfGlade", "fairyAtelier", "redHoodPath", "threePigsCottage"] },
    wizardHut: { id: "wizardHut", label: "Wizard Hut", x: 17.9, y: 37.7, links: ["stoneGolemPass", "treeSpiritGrove", "threePigsCottage", "fairyAtelier"] },
    redHoodPath: { id: "redHoodPath", label: "Red Riding Hood Path", x: 12, y: 60, links: ["halflingVillage", "threePigsCottage"] },
    threePigsCottage: { id: "threePigsCottage", label: "Three Pigs Cottage", x: 57.6, y: 65.5, links: ["redHoodPath", "halflingVillage", "wizardHut", "treeSpiritGrove", "wildEntrance"] },
    treeSpiritGrove: { id: "treeSpiritGrove", label: "Tree Spirit Grove", x: 33.7, y: 65.8, links: ["wizardHut", "threePigsCottage", "wildEntrance"] }
  },
  // locations 控制地圖圖示進入後的場景、NPC、商店與提示文字。
  locations: [
    { id: "wildExit", area: "wild", node: "wildEntrance", label: "World Path", icon: "↩", npcClass: "npc-none", npc: "Wild Sign", kind: "gate", markerStyle: "portal", portalId: "entrance", hint: "The path returns to the kingdom world map." },
    { id: "elfGlade", area: "wild", node: "elfGlade", label: "Elf Glade", icon: "🧝", npc: "Elia", scene: "scene-wild-elf-glade", npcImage: npcImage("elia"), hint: "The elf glade glows with tiny flowers." },
    { id: "fairyAtelier", area: "wild", node: "fairyAtelier", label: "Fairy Atelier", icon: "👗", npc: "Faye", scene: "scene-wild-fairy-atelier", npcImage: npcImage("fairy-atelier"), shopCategories: ["hair", "outfit", "shoes", "accessories"], defaultCategory: "hair", hint: "Faye tailors Fairy Forest hair, dresses, shoes, and magical accessories." },
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
const jobReward = { coins: 115 };
const wildLessonBank = Object.freeze({
  elfGlade: {
    title: "Help in the Elf Glade",
    questions: [
      { questionType: "sentence-choice", prompt: "I have watered all the flowers, but I still cannot see the bell. Where should we look next?", promptZh: "我已經澆完所有花，但還是沒看到鈴鐺。我們接下來該找哪裡？", answer: "Of course! Since the flowers are done, let's search under the leaves next.", choices: ["Of course! Since the flowers are done, let's search under the leaves next.","Well, we could water the flowers once more, just in case.","OK — maybe the bell will ring by itself if we wait."], choicesZh: ["當然！花都澆完了，我們接下來找葉子底下吧。","嗯，保險起見，我們可以再把花澆一次。","好——也許我們等一等，鈴鐺就會自己響了。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The bell might be hiding near the flower that glows the brightest. Which one should we check?", promptZh: "鈴鐺可能藏在發光最亮的那朵花附近。我們該檢查哪一朵？", answer: "Sure — that tall silver flower glows the brightest. Let's check it.", choices: ["Sure — that tall silver flower glows the brightest. Let's check it.","OK — the little pink one by the gate glows quite brightly too.","Well, we could check every flower in the glade, one by one."], choicesZh: ["好的——那朵高高的銀色花發光最亮，我們去看看它。","好——門邊那朵小粉紅花也發著不錯的光。","嗯，我們可以把林間每一朵花都一一檢查。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The elves are far away in the deep woods. How can we call them quickly?", promptZh: "精靈們在森林深處很遠的地方。我們要怎麼快點叫他們來？", answer: "Certainly — if we ring the bell, they will hear us and come.", choices: ["Certainly — if we ring the bell, they will hear us and come.","Well, we could walk into the woods and search for them.","OK — let's shout together as loudly as we can."], choicesZh: ["當然——只要我們搖鈴，他們就會聽到並趕來。","嗯，我們可以走進森林裡去找他們。","好——我們一起用最大的聲音喊吧。"], reward: jobReward }
    ]
  },
  stoneGolemPass: {
    title: "Help at Stone Golem Pass",
    questions: [
      { questionType: "sentence-choice", prompt: "I have cleaned half of the old road sign. Can you finish the other half while I rest?", promptZh: "我已經把舊路牌清乾淨一半了。我休息時，你能把另一半清完嗎？", answer: "Of course — take a break. I'll scrub the rest of the sign now.", choices: ["Of course — take a break. I'll scrub the rest of the sign now.","Well, travellers can still read half a sign, right?","OK — let's paint a whole new sign instead."], choicesZh: ["當然——你休息吧，我現在就把路牌剩下的部分刷乾淨。","嗯，路牌剩一半，旅人應該也看得懂吧？","好——我們乾脆重畫一個全新的路牌。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A big rock fell from the hill onto the road. Which problem should we fix first?", promptZh: "一塊大石頭從山坡滾到路上。我們該先解決哪個問題？", answer: "Sure — the rock that fell is blocking the road, so let's clear it first.", choices: ["Sure — the rock that fell is blocking the road, so let's clear it first.","Well, the small stones by the path look untidy — start there.","OK — first, let's find out why the rock fell down."], choicesZh: ["好的——滾下來的石頭正擋住路，我們先把它清開。","嗯，小路邊的碎石看起來很亂——先從那裡開始吧。","好——我們先查清楚石頭為什麼會滾下來。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Travellers are waiting behind the rock. What should we do to help them?", promptZh: "旅人們被擋在石頭後面等著。我們該怎麼幫他們？", answer: "Certainly — if we move the rock aside, they will pass safely.", choices: ["Certainly — if we move the rock aside, they will pass safely.","Well, they could climb over the rock if they are careful.","OK — we can show them the long path around the hill."], choicesZh: ["當然——只要把石頭移開，他們就能安全通過。","嗯，只要小心一點，他們可以從石頭上爬過去。","好——我們可以帶他們繞山走遠路。"], reward: jobReward }
    ]
  },
  halflingVillage: {
    title: "Help in Halfling Village",
    questions: [
      { questionType: "sentence-choice", prompt: "I have checked four doors, and you have checked two more. How many doors have we checked?", promptZh: "我已經檢查了四扇門，你又檢查了兩扇。我們一共檢查了幾扇？", answer: "Of course — we have checked six doors already.", choices: ["Of course — we have checked six doors already.","Of course — I make it five doors so far.","Of course — that is seven doors, I think."], choicesZh: ["當然——我們已經檢查六扇門了。","當然——我算起來到目前是五扇。","當然——我想應該是七扇。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The basket might be behind the door that is green. Which door should we try?", promptZh: "籃子可能在綠色的那扇門後面。我們該試哪一扇？", answer: "Sure — the round green door. Let's try that one first.", choices: ["Sure — the round green door. Let's try that one first.","OK — the red door is closer, so let's start there.","Well, we could knock on every door in the village."], choicesZh: ["好的——那扇圓圓的綠門，我們先試那一扇。","好——紅色的門比較近，先從那裡開始吧。","嗯，我們可以把村裡每扇門都敲一遍。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I am not sure which door is mine any more! Please ask me politely for a hint.", promptZh: "我不太確定哪一扇才是我的門了！請有禮貌地向我詢問線索。", answer: "Sure — could you tell me which door is yours, please?", choices: ["Sure — could you tell me which door is yours, please?","Well — just point at your door, and we are done.","OK — which one? Hurry up and remember!"], choicesZh: ["好的——可以請你告訴我哪一扇門是你的嗎？","嗯——你直接指出你的門，我們就搞定了。","好——是哪扇？快點想起來啦！"], reward: jobReward }
    ]
  },
  wizardHut: {
    title: "Help at the Wizard Hut",
    questions: [
      { questionType: "sentence-choice", prompt: "I have labelled two jars, and you have labelled one more. How many jars have we labelled?", promptZh: "我已經貼好兩個罐子的標籤，你又貼好一個。我們一共貼好幾個？", answer: "Of course — we have labelled three jars so far.", choices: ["Of course — we have labelled three jars so far.","Of course — I make it four jars so far.","Of course — only the two big ones are done, I think."], choicesZh: ["當然——我們目前已經貼好三個罐子。","當然——我算起來是四個。","當然——我想只有那兩個大的貼好了。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I need the glowing herb jar for tonight's potion. Which jar should I take?", promptZh: "今晚的藥水需要那罐會發光的藥草。我該拿哪一罐？", answer: "Sure — take the jar that glows blue, on the middle shelf.", choices: ["Sure — take the jar that glows blue, on the middle shelf.","OK — the dusty jar at the back looks important too.","Well, maybe open each jar and smell them all first."], choicesZh: ["好的——拿中間架上那罐發藍光的。","好——後面那罐布滿灰塵的看起來也很重要。","嗯，也許先把每罐都打開聞聞看。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The shelf is very high, and I need the top jar. What is the safe plan?", promptZh: "架子很高，我需要最上面那罐。安全的做法是什麼？", answer: "Certainly — if we use the ladder, we will reach it safely.", choices: ["Certainly — if we use the ladder, we will reach it safely.","Well, I could lift you up on my shoulders.","OK — we can poke it down with the long broom."], choicesZh: ["當然——用梯子的話，我們就能安全拿到。","嗯，我可以把你扛到我的肩膀上。","好——我們可以用長掃把把它戳下來。"], reward: jobReward }
    ]
  },
  redHoodPath: {
    title: "Help on Red Riding Hood Path",
    questions: [
      { questionType: "sentence-choice", prompt: "I have cleared the leaves near the first tree. What should we do next?", promptZh: "我已經清掉第一棵樹旁的落葉。我們接下來該做什麼？", answer: "Of course — since the first tree is done, let's move on to the next one.", choices: ["Of course — since the first tree is done, let's move on to the next one.","Well, we could rest here until more leaves fall.","OK — let's sweep the same spot again, to be sure."], choicesZh: ["當然——第一棵樹清好了，我們接著去下一棵吧。","嗯，我們可以在這裡休息，等更多葉子掉下來。","好——我們把同一個地方再掃一次，比較保險。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Grandma, who is ill, is waiting for food. What should we pack in her basket?", promptZh: "生病的奶奶正在等食物。我們該在籃子裡裝什麼？", answer: "Sure — warm soup and soft bread would be perfect for her.", choices: ["Sure — warm soup and soft bread would be perfect for her.","OK — crunchy apples and cold juice from the stream.","Well, flowers first — the food can come later."], choicesZh: ["好的——熱湯和軟麵包對她來說最合適了。","好——脆蘋果和溪邊打來的冰涼果汁。","嗯，先送花吧——食物晚點再說。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The forest path can be tricky. What safety advice should we remember?", promptZh: "森林小路暗藏危險。我們該記住什麼安全守則？", answer: "Certainly — stay on the path, and do not talk to strangers.", choices: ["Certainly — stay on the path, and do not talk to strangers.","Well, a shortcut through the trees would save us time.","OK — walk fast and sing loudly so nothing surprises us."], choicesZh: ["當然——走在小路上，而且不跟陌生人說話。","嗯，從樹林抄捷徑可以省不少時間。","好——走快一點、大聲唱歌，就不會被嚇到了。"], reward: jobReward }
    ]
  },
  threePigsCottage: {
    title: "Help at the Three Pigs Cottage",
    questions: [
      { questionType: "sentence-choice", prompt: "I have tied one side of the straw roof. What should we do with the other side?", promptZh: "我已經綁好稻草屋頂的一邊。另一邊我們該怎麼處理？", answer: "Of course — since one side is tied, let's tie the other side too.", choices: ["Of course — since one side is tied, let's tie the other side too.","Well, one tied side may be enough if the wind stays soft.","OK — let's shake the roof first to test how strong it is."], choicesZh: ["當然——一邊綁好了，我們把另一邊也綁起來。","嗯，如果風不大，綁一邊也許就夠了。","好——我們先用力搖搖屋頂，測試它多堅固。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "One cottage is made of brick, and two are made of straw. Please help me describe them.", promptZh: "一間小屋是磚頭做的，兩間是稻草做的。請幫我描述它們。", answer: "Sure — two cottages are straw, and the strongest one is brick.", choices: ["Sure — two cottages are straw, and the strongest one is brick.","Sure — most of the cottages here are made of brick.","Sure — all three cottages look the same to me."], choicesZh: ["好的——兩間是稻草屋，最堅固的那間是磚屋。","好的——這裡大部分的小屋都是磚頭做的。","好的——三間小屋在我看來都一樣。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "If the big wind comes again, we need the safest house. Please say the plan.", promptZh: "如果大風再來，我們需要最安全的房子。請說出這個計畫。", answer: "Certainly — if the wind blows, we will all meet in the brick house.", choices: ["Certainly — if the wind blows, we will all meet in the brick house.","Well, the straw house is cosier — let's meet there.","OK — we can hold the straw roofs down with our hands."], choicesZh: ["當然——如果風吹起來，我們就全部到磚屋集合。","嗯，稻草屋比較舒服——我們去那裡集合吧。","好——我們可以用手把稻草屋頂壓住。"], reward: jobReward }
    ]
  },
  treeSpiritGrove: {
    title: "Help in the Tree Spirit Grove",
    questions: [
      { questionType: "sentence-choice", prompt: "I have prepared the soil for the glowing seed. What have you done with the seed?", promptZh: "我已經為發光種子準備好土壤。你把種子處理得怎麼樣了？", answer: "Of course — I have planted it right in the middle of the soil.", choices: ["Of course — I have planted it right in the middle of the soil.","Well — I have kept it safe in my pocket for now.","OK — I gave it a little water while I waited."], choicesZh: ["當然——我已經把它種進土壤正中央了。","嗯——我暫時把它收在口袋裡保管。","好——我等待的時候先給它澆了點水。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The oldest tree holds the grove's magic. Which tree should we ask for help?", promptZh: "最古老的樹守護著樹林的魔法。我們該向哪棵樹求助？", answer: "Sure — the old tree that whispers. Let's ask it politely.", choices: ["Sure — the old tree that whispers. Let's ask it politely.","OK — the young tree by the stream looks friendly too.","Well, any tall tree should know the grove's secrets."], choicesZh: ["好的——那棵會低語的老樹，我們有禮貌地去請教它。","好——溪邊那棵年輕的樹看起來也很友善。","嗯，隨便一棵高的樹應該都知道樹林的祕密吧。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The glowing seed is planted. How can we help it grow tall and strong?", promptZh: "發光的種子種好了。我們要怎麼幫它長得又高又壯？", answer: "Certainly — if it gets moonlight and water, it will grow tall.", choices: ["Certainly — if it gets moonlight and water, it will grow tall.","Well, singing to it every night might be enough.","OK — let's dig it up each day to check the roots."], choicesZh: ["當然——只要有月光和水，它就會長得很高。","嗯，每天晚上對它唱歌也許就夠了。","好——我們每天把它挖出來檢查根長得如何。"], reward: jobReward }
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
      { questionType: "sentence-choice", prompt: "How have you been, Princess?", promptZh: "公主，你最近過得如何？", answer: "Oh, I have been really well, Elia!", choices: ["Oh, I have been really well, Elia!","I have been a little sleepy lately, Elia."], choicesZh: ["喔，我最近過得很好，艾莉亞！","艾莉亞，我最近有點愛睏。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The flowers that glow are beautiful tonight.", promptZh: "今晚這些會發光的花特別美。", answer: "Yes, the flowers that glow are so beautiful!", choices: ["Yes, the flowers that glow are so beautiful!","The flowers that glow would keep me awake all night."], choicesZh: ["對啊，會發光的花好美！","會發光的花會讓我整晚睡不著啦。"], reward: chatReward }
    ]
  },
  stoneGolemPass: {
    title: "Chat at Stone Golem Pass",
    questions: [
      { questionType: "sentence-choice", prompt: "I have felt a little lonely at the pass today.", promptZh: "我今天在山口覺得有點孤單。", answer: "Oh, do not worry! I will visit you again soon.", choices: ["Oh, do not worry! I will visit you again soon.","The pass is so quiet — no wonder you feel lonely."], choicesZh: ["喔，別擔心！我很快會再來看你的。","山口這麼安靜——難怪你覺得孤單。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The travellers who pass here need a clear road.", promptZh: "經過這裡的旅人需要一條暢通的路。", answer: "Yes — and you keep the road clear so well!", choices: ["Yes — and you keep the road clear so well!","So many travellers — the road must get messy fast."], choicesZh: ["對啊——而且你把路顧得好好的！","這麼多旅人——路一定很快就亂了。"], reward: chatReward }
    ]
  },
  halflingVillage: {
    title: "Chat in Halfling Village",
    questions: [
      { questionType: "sentence-choice", prompt: "Have you had a good day, Princess?", promptZh: "公主，你今天過得好嗎？", answer: "Yes, I have had a really good day!", choices: ["Yes, I have had a really good day!","It has been a long day, to be honest."], choicesZh: ["對啊，我今天過得超棒！","老實說，今天真是漫長的一天。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The door that is round is my favourite door.", promptZh: "圓圓的那扇門是我最喜歡的門。", answer: "Wow, the round door is so pretty!", choices: ["Wow, the round door is so pretty!","A round door? A square door is easier to build."], choicesZh: ["哇，那扇圓門好漂亮！","圓門？方門比較好蓋吧。"], reward: chatReward }
    ]
  },
  wizardHut: {
    title: "Chat at the Wizard Hut",
    questions: [
      { questionType: "sentence-choice", prompt: "Guess what this little herb can do, Princess.", promptZh: "公主，猜猜這株小藥草有什麼本領。", answer: "Hmm — does it help sleepy flowers wake up?", choices: ["Hmm — does it help sleepy flowers wake up?","I give up — herb riddles are too hard for me."], choicesZh: ["嗯——它是不是能叫醒愛睏的花？","我放棄——藥草謎語對我來說太難了。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "I have been mixing herbs since sunset.", promptZh: "我從日落就一直在調藥草。", answer: "Wow, you have been mixing herbs since sunset!", choices: ["Wow, you have been mixing herbs since sunset!","Mixing herbs all night sounds a bit tiring."], choicesZh: ["哇，你從日落就一直在調藥草呀！","整晚調藥草聽起來好累喔。"], reward: chatReward }
    ]
  },
  redHoodPath: {
    title: "Chat on Red Riding Hood Path",
    questions: [
      { questionType: "sentence-choice", prompt: "Where are you going today, Princess?", promptZh: "公主，你今天要去哪裡？", answer: "I am going to Grandma's house with you!", choices: ["I am going to Grandma's house with you!","I am going back home before it gets dark."], choicesZh: ["我要和你一起去奶奶家呀！","我要趁天黑前回家去。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The path is long, and I feel safer with a friend.", promptZh: "路很長，有朋友一起走我覺得比較安全。", answer: "Of course — I will walk the long path with you.", choices: ["Of course — I will walk the long path with you.","The path is not that long — you will be fine alone."], choicesZh: ["當然——這條長長的路我陪你一起走。","這條路沒那麼長啦——你自己走沒問題的。"], reward: chatReward }
    ]
  },
  threePigsCottage: {
    title: "Chat at the Three Pigs Cottage",
    questions: [
      { questionType: "sentence-choice", prompt: "Princess, I have just built a brand-new house!", promptZh: "公主，我剛剛蓋好一間全新的房子！", answer: "Wow, Pippo! Your new house looks great.", choices: ["Wow, Pippo! Your new house looks great.","Another new house, Pippo? You build too many!"], choicesZh: ["哇，皮波！你的新房子看起來好棒。","又蓋新房子，皮波？你蓋太多了啦！"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The house that is built of brick feels safe.", promptZh: "磚頭蓋的房子讓人覺得安心。", answer: "Yes, the brick house is really strong!", choices: ["Yes, the brick house is really strong!","Safe, yes — but the straw house is comfier."], choicesZh: ["對啊，磚屋真的很堅固！","安全是安全——不過稻草屋比較舒服。"], reward: chatReward }
    ]
  },
  treeSpiritGrove: {
    title: "Chat in the Tree Spirit Grove",
    questions: [
      { questionType: "sentence-choice", prompt: "How have you been, Princess?", promptZh: "公主，你最近過得如何？", answer: "I have been helping my friends all day!", choices: ["I have been helping my friends all day!","I have been so busy that my feet hurt!"], choicesZh: ["我一整天都在幫朋友們的忙！","我忙到腳都痛了！"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Thank you for visiting my peaceful grove.", promptZh: "謝謝你來我這片平靜的樹林。", answer: "I love this grove — it is so peaceful!", choices: ["I love this grove — it is so peaceful!","The grove is a bit too quiet for me."], choicesZh: ["我好喜歡這片樹林——好平靜！","這片樹林對我來說有點太安靜了。"], reward: chatReward }
    ]
  },
  fairyAtelier: {
    title: "Chat at the Fairy Atelier",
    questions: [
      { questionType: "sentence-choice", prompt: "Have you been well, Princess?", promptZh: "公主，你最近過得好嗎？", answer: "I have been really well, Faye!", choices: ["I have been really well, Faye!","I have been a little tired, Faye."], choicesZh: ["我最近過得很好，菲伊！","菲伊，我最近有點累。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "The dress that sparkles is my favourite today.", promptZh: "這件會閃閃發光的洋裝是我今天的最愛。", answer: "Wow, the dress that sparkles is so lovely!", choices: ["Wow, the dress that sparkles is so lovely!","It sparkles a lot — maybe a little too much for me?"], choicesZh: ["哇，會閃閃發光的洋裝好美！","它真的很閃——對我來說會不會太閃啦？"], reward: chatReward }
    ]
  },
});
//#endregion 生活聊天題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
// issue #149：travelLine／shopGreeting 改為角色第一人稱對公主發話，並補中文（travelLineZh／shopGreetingZh）。
export const wildSceneConfigs = mergeLessons(mergeLessons({
  wildExit: { ...wildPathArt, scene: "scene-wild-path", npcClass: "npc-none", npc: "Wild Sign", travelAction: "World Map", travelLine: "Princess, this wild path returns to the kingdom world map.", travelLineZh: "公主，這條野地小路會回到王國世界地圖。" },
  elfGlade: { ...wildSceneArt("elf-glade"), scene: "scene-wild-elf-glade", npc: "Elia", npcImage: npcImage("elia"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Hello, Princess. I have been listening to the glowing flowers.", travelLineZh: "你好，公主。我一直在聽發光花的聲音。" },
  fairyAtelier: { ...wildShopArt("fairy-atelier"), scene: "scene-wild-fairy-atelier", npc: "Faye", npcImage: npcImage("fairy-atelier"), npcNaturalHeightCm: 150, travelAction: "Shop", travelLine: "Welcome, Princess. The Fairy Forest wardrobe is ready.", travelLineZh: "歡迎，公主。童話森林服飾準備好了。", shopGreeting: "Pick flower hair, a petal dress, vine shoes, or a glowing forest accessory, Princess.", shopGreetingZh: "公主，選花朵髮型、花瓣洋裝、藤蔓鞋或發光森林配件吧。" },
  stoneGolemPass: { ...wildSceneArt("golem-pass"), scene: "scene-wild-golem-pass", npc: "Goro", npcImage: npcImage("goro"), npcNaturalHeightCm: 200, travelAction: "Visit", travelLine: "Hello, Princess. I have guarded this old pass for many years.", travelLineZh: "你好，公主。我守護這條古老山路很多年了。" },
  halflingVillage: { ...wildSceneArt("halfling-village"), scene: "scene-wild-halfling-village", npc: "Penny", npcImage: npcImage("penny"), npcNaturalHeightCm: 100, travelAction: "Visit", travelLine: "Hi, Princess. I have been waiting by my round green door.", travelLineZh: "嗨，公主。我一直在我的綠色圓門旁等你。" },
  wizardHut: { ...wildSceneArt("wizard-hut"), scene: "scene-wild-wizard-hut", npc: "Wiz Beryl", npcImage: npcImage("wiz-beryl"), npcNaturalHeightCm: 170, travelAction: "Visit", travelLine: "Good evening, Princess. I have been sorting herb jars under the purple roof.", travelLineZh: "晚安，公主。我一直在紫色屋頂下整理藥草罐。" },
  redHoodPath: { ...wildSceneArt("red-hood-path"), scene: "scene-wild-red-hood-path", npc: "Ruby", npcImage: npcImage("ruby"), npcNaturalHeightCm: 125, travelAction: "Visit", travelLine: "Hi, Princess. I have been checking my basket on the forest path.", travelLineZh: "嗨，公主。我一直在森林小路上檢查我的籃子。" },
  threePigsCottage: { ...wildSceneArt("three-pigs"), scene: "scene-wild-three-pigs", npc: "Pippo", npcImage: npcImage("pippo"), npcNaturalHeightCm: 90, travelAction: "Visit", travelLine: "Hello, Princess. I have been fixing the little cottages today.", travelLineZh: "你好，公主。我今天一直在修小屋。" },
  treeSpiritGrove: { ...wildSceneArt("tree-spirit-grove"), scene: "scene-wild-tree-spirit-grove", npc: "Sylvie", npcImage: npcImage("sylvie"), npcNaturalHeightCm: 170, travelAction: "Visit", travelLine: "Hello, Princess. I have been glowing softly among the branches.", travelLineZh: "你好，公主。我一直在樹枝間柔柔地發光。" }
}, wildLessonBank, { area: "wild", vocabProfile: wildVocabularyProfile.id }),
  wildChatLessonBank, { area: "wild", vocabProfile: wildVocabularyProfile.id }, "chatLesson");
//#endregion 對話場景設定
