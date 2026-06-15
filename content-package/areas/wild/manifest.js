//#region 匯入共用工具
// 將題庫清單轉成遊戲執行時需要的 lessons（課程資料）與 quest templates（任務模板）。
import { makeLessons, makeQuestTemplates, mergeLessons } from "../_shared/lesson-helpers.js";
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

//#region 題庫資料
// reward 是每題完成後給玩家的固定獎勵。
const reward = { coins: 2000 };

// q() 是題目簡寫輔助函式，避免每題重複寫完整物件。
const q = (prompt, answer, choices, words, questionType = "sentence-choice") => ({ prompt, answer, choices, words, questionType, reward });

// 中文協助對照（issue #73）：含整句片語（problem／action／result）的查表；缺項回退。
const wildZh = {
  "the elf": "小精靈", "the dwarf": "小矮人", "the golem": "石巨人", "the halfling": "半身人", "the wizard": "巫師", "the girl": "小女孩", "the piglet": "小豬", "the spirit": "樹靈",
  glade: "林間空地", cottage: "小屋", pass: "山道", village: "村莊", hut: "小屋", path: "小路", grove: "樹叢",
  "silver bell": "銀鈴", "wooden wheel": "木輪", "missing stone": "遺失的石頭", "picnic basket": "野餐籃", "blue herb jar": "藍色藥草罐", basket: "籃子", "straw roof": "稻草屋頂", "moon seed": "月亮種子",
  "the flowers are too bright": "花太亮了", "it rolled behind the table": "它滾到桌子後面", "moss covers the sign": "青苔蓋住了告示牌", "it is beside the wrong door": "它在錯的門旁邊", "the shelf is too high": "架子太高了", "leaves cover the handle": "葉子蓋住了提把", "the wind moved some straw": "風把一些稻草吹動了", "it fell near the roots": "它掉在樹根附近",
  "follow the quiet music": "跟著安靜的音樂走", "look behind the workbench": "看看工作檯後面", "clean the old sign": "清理舊告示牌", "check each round door": "檢查每一扇圓門", "move the little ladder": "移動小梯子", "brush away the leaves": "撥開葉子", "tie the roof gently": "輕輕綁好屋頂", "place the seed in moonlight": "把種子放在月光下",
  "the silver bell rings softly": "銀鈴輕輕響起", "the wooden wheel turns again": "木輪又轉動了", "the mountain pass opens": "山道打開了", "the picnic basket is found": "野餐籃找到了", "the blue herb jar shines": "藍色藥草罐閃閃發亮", "the basket is ready": "籃子準備好了", "the straw roof stays still": "稻草屋頂穩穩不動", "the moon seed begins to glow": "月亮種子開始發光",
  "The elf glade glows with tiny blue flowers.": "精靈空地上開滿了藍色小花，閃閃發光。",
  "Pip the dwarf warms a small workshop fire.": "小矮人 Pip 生起了小小的工作坊爐火。",
  "A friendly stone golem blocks the old path.": "一個友善的石巨人擋住了舊路。",
  "Small round doors peek from the hill.": "小小的圓門從山丘探出頭來。",
  "A purple roof curls above the wizard's herbs.": "紫色的屋頂在巫師的藥草上方捲起。",
  "A red hood rests near a basket on the path.": "一頂紅帽子在小路上的籃子旁邊。",
  "Three tiny cottages stand under warm trees.": "三間小小的屋子立在溫暖的樹下。",
  "The ancient tree spirit blinks with blue lights.": "古老的樹靈眨著藍色的光。"
};
const tz = (w) => wildZh[w] || w;

// flyersQuestions() 用同一組題型產生 Wild 各童話場景的練習題（含中文協助）。
const flyersQuestions = ({ character, place, object, problem, action, result }) => [
  { ...q(`Pick the sentence that explains the ${place} problem.`, `${character} cannot find the ${object} because ${problem}.`, [`${character} cannot find the ${object} because ${problem}.`, `${character} cannot eat the ${object} because it is a castle.`, `${character} cannot wear the river because it is noisy.`, `${character} cannot read the mountain before breakfast.`], [character, object, "because", ...problem.split(" ")]),
    promptZh: `選出說明${tz(place)}問題的句子。`, choicesZh: [`${tz(character)}找不到${tz(object)}，因為${tz(problem)}。`, `${tz(character)}不能吃${tz(object)}，因為它是一座城堡。`, `${tz(character)}不能穿上河流，因為它很吵。`, `${tz(character)}不能在早餐前讀那座山。`] },
  { ...q(`Pick the best helpful sentence.`, `Lumi should ${action} before the path gets dark.`, [`Lumi should ${action} before the path gets dark.`, `Lumi should hide the path under her shoe.`, `Lumi should shout until the trees run away.`, `Lumi should cook the moon before it rains.`], ["should", action, "before", "path", "dark"]),
    promptZh: `選出最有幫助的句子。`, choicesZh: [`Lumi 應該在路變暗前${tz(action)}。`, `Lumi 應該把路藏在鞋子底下。`, `Lumi 應該大叫到樹都跑走。`, `Lumi 應該在下雨前把月亮煮熟。`] },
  { ...q(`Pick the sentence about what happened next.`, `After Lumi helps, ${result}.`, [`After Lumi helps, ${result}.`, "After Lumi helps, the castle drinks a book.", "After Lumi helps, the basket becomes angry.", "After Lumi helps, every tree forgets the road."], ["after", "helps", ...result.split(" ")]),
    promptZh: `選出接下來發生什麼的句子。`, choicesZh: [`Lumi 幫忙之後，${tz(result)}。`, `Lumi 幫忙之後，城堡喝了一本書。`, `Lumi 幫忙之後，籃子生氣了。`, `Lumi 幫忙之後，每棵樹都忘了路。`] },
  { ...q(`Pick the careful wild sentence.`, `If we listen carefully, we can hear the wild answer.`, ["If we listen carefully, we can hear the wild answer.", "If we run loudly, the answer becomes a shoe.", "If the river sleeps, the basket can fly.", "If the wolf reads maps, bread gets taller."], ["if", "listen", "carefully", "answer"]),
    promptZh: `選出小心的野外句子。`, choicesZh: ["如果我們仔細聽，就能聽到野外的答案。", "如果我們大聲跑，答案就會變成一隻鞋子。", "如果河流睡著了，籃子就能飛。", "如果狼讀地圖，麵包就會變高。"] },
  { ...q(`Pick the story question.`, `Why does ${character} need Lumi's help?`, [`Why does ${character} need Lumi's help?`, `Why does ${character} sell the castle?`, `Where does ${character} eat a thundercloud?`, `When does ${character} become a teacup?`], ["why", character, "need", "help"], "question-choice"),
    promptZh: `選出故事的問題句。`, choicesZh: [`${tz(character)}為什麼需要 Lumi 的幫忙？`, `${tz(character)}為什麼要賣掉城堡？`, `${tz(character)}在哪裡吃了一朵雷雲？`, `${tz(character)}什麼時候變成了一個茶杯？`] }
];

// lessonPlaces 是本地區所有可練習地點與題目清單。
const wildLessonPlaces = [
  { id: "elfGlade", theme: "elf glade", title: "Help in the Elf Glade", opening: "The elf glade glows with tiny blue flowers.", ending: "The elf song guides the wild path.", questions: flyersQuestions({ character: "the elf", place: "glade", object: "silver bell", problem: "the flowers are too bright", action: "follow the quiet music", result: "the silver bell rings softly" }) },
  { id: "dwarfCottage", theme: "dwarf workshop", title: "Help at the Dwarf Cottage", opening: "Pip the dwarf warms a small workshop fire.", ending: "The cottage tools are safe and tidy.", questions: flyersQuestions({ character: "the dwarf", place: "cottage", object: "wooden wheel", problem: "it rolled behind the table", action: "look behind the workbench", result: "the wooden wheel turns again" }) },
  { id: "stoneGolemPass", theme: "stone golem pass", title: "Help at Stone Golem Pass", opening: "A friendly stone golem blocks the old path.", ending: "The golem smiles and opens the pass.", questions: flyersQuestions({ character: "the golem", place: "pass", object: "missing stone", problem: "moss covers the sign", action: "clean the old sign", result: "the mountain pass opens" }) },
  { id: "halflingVillage", theme: "halfling village", title: "Help in Halfling Village", opening: "Small round doors peek from the hill.", ending: "The village picnic can begin.", questions: flyersQuestions({ character: "the halfling", place: "village", object: "picnic basket", problem: "it is beside the wrong door", action: "check each round door", result: "the picnic basket is found" }) },
  { id: "wizardHut", theme: "wizard hut", title: "Help at the Wizard Hut", opening: "A purple roof curls above the wizard's herbs.", ending: "The glowing herb jar is safe.", questions: flyersQuestions({ character: "the wizard", place: "hut", object: "blue herb jar", problem: "the shelf is too high", action: "move the little ladder", result: "the blue herb jar shines" }) },
  { id: "redHoodPath", theme: "red riding hood path", title: "Help on Red Riding Hood Path", opening: "A red hood rests near a basket on the path.", ending: "The wild path is clear again.", questions: flyersQuestions({ character: "the girl", place: "path", object: "basket", problem: "leaves cover the handle", action: "brush away the leaves", result: "the basket is ready" }) },
  { id: "threePigsCottage", theme: "three pigs cottage", title: "Help at the Three Pigs Cottage", opening: "Three tiny cottages stand under warm trees.", ending: "The three cottages are tidy.", questions: flyersQuestions({ character: "the piglet", place: "cottage", object: "straw roof", problem: "the wind moved some straw", action: "tie the roof gently", result: "the straw roof stays still" }) },
  { id: "treeSpiritGrove", theme: "tree spirit grove", title: "Help in the Tree Spirit Grove", opening: "The ancient tree spirit blinks with blue lights.", ending: "The grove glows softly.", questions: flyersQuestions({ character: "the spirit", place: "grove", object: "moon seed", problem: "it fell near the roots", action: "place the seed in moonlight", result: "the moon seed begins to glow" }) }
];
//#endregion 題庫資料

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
    wildEntrance: { id: "wildEntrance", label: "World Path", x: 82.0, y: 82.0, links: ["treeSpiritGrove", "wizardHut", "threePigsCottage"] },
    elfGlade: { id: "elfGlade", label: "Elf Glade", x: 21.5, y: 50.8, links: ["dwarfCottage", "fairyAtelier", "halflingVillage"] },
    fairyAtelier: { id: "fairyAtelier", label: "Fairy Atelier", x: 34.5, y: 61.2, links: ["elfGlade", "halflingVillage", "wizardHut"] },
    dwarfCottage: { id: "dwarfCottage", label: "Dwarf Cottage", x: 22.1, y: 72.3, links: ["elfGlade", "stoneGolemPass", "halflingVillage"] },
    stoneGolemPass: { id: "stoneGolemPass", label: "Stone Golem Pass", x: 53.4, y: 40.4, links: ["dwarfCottage", "wizardHut", "elfGlade"] },
    halflingVillage: { id: "halflingVillage", label: "Halfling Village", x: 45.6, y: 79.4, links: ["elfGlade", "dwarfCottage", "fairyAtelier", "redHoodPath", "threePigsCottage"] },
    wizardHut: { id: "wizardHut", label: "Wizard Hut", x: 79.4, y: 43.0, links: ["stoneGolemPass", "treeSpiritGrove", "threePigsCottage", "fairyAtelier"] },
    redHoodPath: { id: "redHoodPath", label: "Red Riding Hood Path", x: 13.0, y: 88.5, links: ["halflingVillage", "threePigsCottage"] },
    threePigsCottage: { id: "threePigsCottage", label: "Three Pigs Cottage", x: 67.7, y: 84.6, links: ["redHoodPath", "halflingVillage", "wizardHut", "treeSpiritGrove", "wildEntrance"] },
    treeSpiritGrove: { id: "treeSpiritGrove", label: "Tree Spirit Grove", x: 81.4, y: 61.8, links: ["wizardHut", "threePigsCottage", "wildEntrance"] }
  },
  // locations 控制地圖圖示進入後的場景、NPC、商店與提示文字。
  locations: [
    { id: "wildExit", area: "wild", node: "wildEntrance", label: "World Path", icon: "↩", npcClass: "npc-none", npc: "Wild Sign", kind: "gate", markerStyle: "portal", portalId: "entrance", hint: "The path returns to the kingdom world map." },
    { id: "elfGlade", area: "wild", node: "elfGlade", label: "Elf Glade", icon: "🧝", npc: "Elia", scene: "scene-wild-elf-glade", npcImage: npcImage("elia"), hint: "The elf glade glows with tiny flowers." },
    { id: "fairyAtelier", area: "wild", node: "fairyAtelier", label: "Fairy Atelier", icon: "👗", npc: "Faye", scene: "scene-wild-fairy-atelier", npcImage: npcImage("fairy-atelier"), kind: "shop", shopCategories: ["dresses", "accessories"], defaultCategory: "dresses", hint: "Faye sells fairy dresses and accessories in the glade." },
    { id: "dwarfCottage", area: "wild", node: "dwarfCottage", label: "Dwarf Cottage", icon: "🛖", npc: "Pip", scene: "scene-wild-dwarf-cottage", npcImage: npcImage("pip"), kind: "shop", shopCategories: ["outerwear", "shoes"], defaultCategory: "outerwear", hint: "Pip keeps handmade wild outerwear and shoes in a warm cottage." },
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

//#region 場景自帶題庫（issue #96）
// wildLessonBank：以 place 為鍵的手寫固定題庫，每題自帶中文（promptZh／choicesZh）；由 mergeLessons 併入 sceneConfigs 對應條目。
const wildLessonBank = Object.freeze({
  elfGlade: {
    theme: "elf glade",
    title: "Help in the Elf Glade",
    opening: "The elf glade glows with tiny blue flowers.",
    openingZh: "精靈空地上開滿了藍色小花，閃閃發光。",
    ending: "The elf song guides the wild path.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence that explains the glade problem.", promptZh: "選出說明林間空地問題的句子。", answer: "the elf cannot find the silver bell because the flowers are too bright.", choices: ["the elf cannot find the silver bell because the flowers are too bright.","the elf cannot eat the silver bell because it is a castle.","the elf cannot wear the river because it is noisy.","the elf cannot read the mountain before breakfast."], choicesZh: ["小精靈找不到銀鈴，因為花太亮了。","小精靈不能吃銀鈴，因為它是一座城堡。","小精靈不能穿上河流，因為它很吵。","小精靈不能在早餐前讀那座山。"], words: ["the elf","silver bell","because","the","flowers","are","too","bright"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the best helpful sentence.", promptZh: "選出最有幫助的句子。", answer: "Lumi should follow the quiet music before the path gets dark.", choices: ["Lumi should follow the quiet music before the path gets dark.","Lumi should hide the path under her shoe.","Lumi should shout until the trees run away.","Lumi should cook the moon before it rains."], choicesZh: ["Lumi 應該在路變暗前跟著安靜的音樂走。","Lumi 應該把路藏在鞋子底下。","Lumi 應該大叫到樹都跑走。","Lumi 應該在下雨前把月亮煮熟。"], words: ["should","follow the quiet music","before","path","dark"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about what happened next.", promptZh: "選出接下來發生什麼的句子。", answer: "After Lumi helps, the silver bell rings softly.", choices: ["After Lumi helps, the silver bell rings softly.","After Lumi helps, the castle drinks a book.","After Lumi helps, the basket becomes angry.","After Lumi helps, every tree forgets the road."], choicesZh: ["Lumi 幫忙之後，銀鈴輕輕響起。","Lumi 幫忙之後，城堡喝了一本書。","Lumi 幫忙之後，籃子生氣了。","Lumi 幫忙之後，每棵樹都忘了路。"], words: ["after","helps","the","silver","bell","rings","softly"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the careful wild sentence.", promptZh: "選出小心的野外句子。", answer: "If we listen carefully, we can hear the wild answer.", choices: ["If we listen carefully, we can hear the wild answer.","If we run loudly, the answer becomes a shoe.","If the river sleeps, the basket can fly.","If the wolf reads maps, bread gets taller."], choicesZh: ["如果我們仔細聽，就能聽到野外的答案。","如果我們大聲跑，答案就會變成一隻鞋子。","如果河流睡著了，籃子就能飛。","如果狼讀地圖，麵包就會變高。"], words: ["if","listen","carefully","answer"], reward: { coins: 2000 } },
      { questionType: "question-choice", prompt: "Pick the story question.", promptZh: "選出故事的問題句。", answer: "Why does the elf need Lumi's help?", choices: ["Why does the elf need Lumi's help?","Why does the elf sell the castle?","Where does the elf eat a thundercloud?","When does the elf become a teacup?"], choicesZh: ["小精靈為什麼需要 Lumi 的幫忙？","小精靈為什麼要賣掉城堡？","小精靈在哪裡吃了一朵雷雲？","小精靈什麼時候變成了一個茶杯？"], words: ["why","the elf","need","help"], reward: { coins: 2000 } }
    ]
  },
  dwarfCottage: {
    theme: "dwarf workshop",
    title: "Help at the Dwarf Cottage",
    opening: "Pip the dwarf warms a small workshop fire.",
    openingZh: "小矮人 Pip 生起了小小的工作坊爐火。",
    ending: "The cottage tools are safe and tidy.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence that explains the cottage problem.", promptZh: "選出說明小屋問題的句子。", answer: "the dwarf cannot find the wooden wheel because it rolled behind the table.", choices: ["the dwarf cannot find the wooden wheel because it rolled behind the table.","the dwarf cannot eat the wooden wheel because it is a castle.","the dwarf cannot wear the river because it is noisy.","the dwarf cannot read the mountain before breakfast."], choicesZh: ["小矮人找不到木輪，因為它滾到桌子後面。","小矮人不能吃木輪，因為它是一座城堡。","小矮人不能穿上河流，因為它很吵。","小矮人不能在早餐前讀那座山。"], words: ["the dwarf","wooden wheel","because","it","rolled","behind","the","table"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the best helpful sentence.", promptZh: "選出最有幫助的句子。", answer: "Lumi should look behind the workbench before the path gets dark.", choices: ["Lumi should look behind the workbench before the path gets dark.","Lumi should hide the path under her shoe.","Lumi should shout until the trees run away.","Lumi should cook the moon before it rains."], choicesZh: ["Lumi 應該在路變暗前看看工作檯後面。","Lumi 應該把路藏在鞋子底下。","Lumi 應該大叫到樹都跑走。","Lumi 應該在下雨前把月亮煮熟。"], words: ["should","look behind the workbench","before","path","dark"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about what happened next.", promptZh: "選出接下來發生什麼的句子。", answer: "After Lumi helps, the wooden wheel turns again.", choices: ["After Lumi helps, the wooden wheel turns again.","After Lumi helps, the castle drinks a book.","After Lumi helps, the basket becomes angry.","After Lumi helps, every tree forgets the road."], choicesZh: ["Lumi 幫忙之後，木輪又轉動了。","Lumi 幫忙之後，城堡喝了一本書。","Lumi 幫忙之後，籃子生氣了。","Lumi 幫忙之後，每棵樹都忘了路。"], words: ["after","helps","the","wooden","wheel","turns","again"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the careful wild sentence.", promptZh: "選出小心的野外句子。", answer: "If we listen carefully, we can hear the wild answer.", choices: ["If we listen carefully, we can hear the wild answer.","If we run loudly, the answer becomes a shoe.","If the river sleeps, the basket can fly.","If the wolf reads maps, bread gets taller."], choicesZh: ["如果我們仔細聽，就能聽到野外的答案。","如果我們大聲跑，答案就會變成一隻鞋子。","如果河流睡著了，籃子就能飛。","如果狼讀地圖，麵包就會變高。"], words: ["if","listen","carefully","answer"], reward: { coins: 2000 } },
      { questionType: "question-choice", prompt: "Pick the story question.", promptZh: "選出故事的問題句。", answer: "Why does the dwarf need Lumi's help?", choices: ["Why does the dwarf need Lumi's help?","Why does the dwarf sell the castle?","Where does the dwarf eat a thundercloud?","When does the dwarf become a teacup?"], choicesZh: ["小矮人為什麼需要 Lumi 的幫忙？","小矮人為什麼要賣掉城堡？","小矮人在哪裡吃了一朵雷雲？","小矮人什麼時候變成了一個茶杯？"], words: ["why","the dwarf","need","help"], reward: { coins: 2000 } }
    ]
  },
  stoneGolemPass: {
    theme: "stone golem pass",
    title: "Help at Stone Golem Pass",
    opening: "A friendly stone golem blocks the old path.",
    openingZh: "一個友善的石巨人擋住了舊路。",
    ending: "The golem smiles and opens the pass.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence that explains the pass problem.", promptZh: "選出說明山道問題的句子。", answer: "the golem cannot find the missing stone because moss covers the sign.", choices: ["the golem cannot find the missing stone because moss covers the sign.","the golem cannot eat the missing stone because it is a castle.","the golem cannot wear the river because it is noisy.","the golem cannot read the mountain before breakfast."], choicesZh: ["石巨人找不到遺失的石頭，因為青苔蓋住了告示牌。","石巨人不能吃遺失的石頭，因為它是一座城堡。","石巨人不能穿上河流，因為它很吵。","石巨人不能在早餐前讀那座山。"], words: ["the golem","missing stone","because","moss","covers","the","sign"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the best helpful sentence.", promptZh: "選出最有幫助的句子。", answer: "Lumi should clean the old sign before the path gets dark.", choices: ["Lumi should clean the old sign before the path gets dark.","Lumi should hide the path under her shoe.","Lumi should shout until the trees run away.","Lumi should cook the moon before it rains."], choicesZh: ["Lumi 應該在路變暗前清理舊告示牌。","Lumi 應該把路藏在鞋子底下。","Lumi 應該大叫到樹都跑走。","Lumi 應該在下雨前把月亮煮熟。"], words: ["should","clean the old sign","before","path","dark"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about what happened next.", promptZh: "選出接下來發生什麼的句子。", answer: "After Lumi helps, the mountain pass opens.", choices: ["After Lumi helps, the mountain pass opens.","After Lumi helps, the castle drinks a book.","After Lumi helps, the basket becomes angry.","After Lumi helps, every tree forgets the road."], choicesZh: ["Lumi 幫忙之後，山道打開了。","Lumi 幫忙之後，城堡喝了一本書。","Lumi 幫忙之後，籃子生氣了。","Lumi 幫忙之後，每棵樹都忘了路。"], words: ["after","helps","the","mountain","pass","opens"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the careful wild sentence.", promptZh: "選出小心的野外句子。", answer: "If we listen carefully, we can hear the wild answer.", choices: ["If we listen carefully, we can hear the wild answer.","If we run loudly, the answer becomes a shoe.","If the river sleeps, the basket can fly.","If the wolf reads maps, bread gets taller."], choicesZh: ["如果我們仔細聽，就能聽到野外的答案。","如果我們大聲跑，答案就會變成一隻鞋子。","如果河流睡著了，籃子就能飛。","如果狼讀地圖，麵包就會變高。"], words: ["if","listen","carefully","answer"], reward: { coins: 2000 } },
      { questionType: "question-choice", prompt: "Pick the story question.", promptZh: "選出故事的問題句。", answer: "Why does the golem need Lumi's help?", choices: ["Why does the golem need Lumi's help?","Why does the golem sell the castle?","Where does the golem eat a thundercloud?","When does the golem become a teacup?"], choicesZh: ["石巨人為什麼需要 Lumi 的幫忙？","石巨人為什麼要賣掉城堡？","石巨人在哪裡吃了一朵雷雲？","石巨人什麼時候變成了一個茶杯？"], words: ["why","the golem","need","help"], reward: { coins: 2000 } }
    ]
  },
  halflingVillage: {
    theme: "halfling village",
    title: "Help in Halfling Village",
    opening: "Small round doors peek from the hill.",
    openingZh: "小小的圓門從山丘探出頭來。",
    ending: "The village picnic can begin.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence that explains the village problem.", promptZh: "選出說明村莊問題的句子。", answer: "the halfling cannot find the picnic basket because it is beside the wrong door.", choices: ["the halfling cannot find the picnic basket because it is beside the wrong door.","the halfling cannot eat the picnic basket because it is a castle.","the halfling cannot wear the river because it is noisy.","the halfling cannot read the mountain before breakfast."], choicesZh: ["半身人找不到野餐籃，因為它在錯的門旁邊。","半身人不能吃野餐籃，因為它是一座城堡。","半身人不能穿上河流，因為它很吵。","半身人不能在早餐前讀那座山。"], words: ["the halfling","picnic basket","because","it","is","beside","the","wrong","door"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the best helpful sentence.", promptZh: "選出最有幫助的句子。", answer: "Lumi should check each round door before the path gets dark.", choices: ["Lumi should check each round door before the path gets dark.","Lumi should hide the path under her shoe.","Lumi should shout until the trees run away.","Lumi should cook the moon before it rains."], choicesZh: ["Lumi 應該在路變暗前檢查每一扇圓門。","Lumi 應該把路藏在鞋子底下。","Lumi 應該大叫到樹都跑走。","Lumi 應該在下雨前把月亮煮熟。"], words: ["should","check each round door","before","path","dark"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about what happened next.", promptZh: "選出接下來發生什麼的句子。", answer: "After Lumi helps, the picnic basket is found.", choices: ["After Lumi helps, the picnic basket is found.","After Lumi helps, the castle drinks a book.","After Lumi helps, the basket becomes angry.","After Lumi helps, every tree forgets the road."], choicesZh: ["Lumi 幫忙之後，野餐籃找到了。","Lumi 幫忙之後，城堡喝了一本書。","Lumi 幫忙之後，籃子生氣了。","Lumi 幫忙之後，每棵樹都忘了路。"], words: ["after","helps","the","picnic","basket","is","found"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the careful wild sentence.", promptZh: "選出小心的野外句子。", answer: "If we listen carefully, we can hear the wild answer.", choices: ["If we listen carefully, we can hear the wild answer.","If we run loudly, the answer becomes a shoe.","If the river sleeps, the basket can fly.","If the wolf reads maps, bread gets taller."], choicesZh: ["如果我們仔細聽，就能聽到野外的答案。","如果我們大聲跑，答案就會變成一隻鞋子。","如果河流睡著了，籃子就能飛。","如果狼讀地圖，麵包就會變高。"], words: ["if","listen","carefully","answer"], reward: { coins: 2000 } },
      { questionType: "question-choice", prompt: "Pick the story question.", promptZh: "選出故事的問題句。", answer: "Why does the halfling need Lumi's help?", choices: ["Why does the halfling need Lumi's help?","Why does the halfling sell the castle?","Where does the halfling eat a thundercloud?","When does the halfling become a teacup?"], choicesZh: ["半身人為什麼需要 Lumi 的幫忙？","半身人為什麼要賣掉城堡？","半身人在哪裡吃了一朵雷雲？","半身人什麼時候變成了一個茶杯？"], words: ["why","the halfling","need","help"], reward: { coins: 2000 } }
    ]
  },
  wizardHut: {
    theme: "wizard hut",
    title: "Help at the Wizard Hut",
    opening: "A purple roof curls above the wizard's herbs.",
    openingZh: "紫色的屋頂在巫師的藥草上方捲起。",
    ending: "The glowing herb jar is safe.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence that explains the hut problem.", promptZh: "選出說明小屋問題的句子。", answer: "the wizard cannot find the blue herb jar because the shelf is too high.", choices: ["the wizard cannot find the blue herb jar because the shelf is too high.","the wizard cannot eat the blue herb jar because it is a castle.","the wizard cannot wear the river because it is noisy.","the wizard cannot read the mountain before breakfast."], choicesZh: ["巫師找不到藍色藥草罐，因為架子太高了。","巫師不能吃藍色藥草罐，因為它是一座城堡。","巫師不能穿上河流，因為它很吵。","巫師不能在早餐前讀那座山。"], words: ["the wizard","blue herb jar","because","the","shelf","is","too","high"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the best helpful sentence.", promptZh: "選出最有幫助的句子。", answer: "Lumi should move the little ladder before the path gets dark.", choices: ["Lumi should move the little ladder before the path gets dark.","Lumi should hide the path under her shoe.","Lumi should shout until the trees run away.","Lumi should cook the moon before it rains."], choicesZh: ["Lumi 應該在路變暗前移動小梯子。","Lumi 應該把路藏在鞋子底下。","Lumi 應該大叫到樹都跑走。","Lumi 應該在下雨前把月亮煮熟。"], words: ["should","move the little ladder","before","path","dark"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about what happened next.", promptZh: "選出接下來發生什麼的句子。", answer: "After Lumi helps, the blue herb jar shines.", choices: ["After Lumi helps, the blue herb jar shines.","After Lumi helps, the castle drinks a book.","After Lumi helps, the basket becomes angry.","After Lumi helps, every tree forgets the road."], choicesZh: ["Lumi 幫忙之後，藍色藥草罐閃閃發亮。","Lumi 幫忙之後，城堡喝了一本書。","Lumi 幫忙之後，籃子生氣了。","Lumi 幫忙之後，每棵樹都忘了路。"], words: ["after","helps","the","blue","herb","jar","shines"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the careful wild sentence.", promptZh: "選出小心的野外句子。", answer: "If we listen carefully, we can hear the wild answer.", choices: ["If we listen carefully, we can hear the wild answer.","If we run loudly, the answer becomes a shoe.","If the river sleeps, the basket can fly.","If the wolf reads maps, bread gets taller."], choicesZh: ["如果我們仔細聽，就能聽到野外的答案。","如果我們大聲跑，答案就會變成一隻鞋子。","如果河流睡著了，籃子就能飛。","如果狼讀地圖，麵包就會變高。"], words: ["if","listen","carefully","answer"], reward: { coins: 2000 } },
      { questionType: "question-choice", prompt: "Pick the story question.", promptZh: "選出故事的問題句。", answer: "Why does the wizard need Lumi's help?", choices: ["Why does the wizard need Lumi's help?","Why does the wizard sell the castle?","Where does the wizard eat a thundercloud?","When does the wizard become a teacup?"], choicesZh: ["巫師為什麼需要 Lumi 的幫忙？","巫師為什麼要賣掉城堡？","巫師在哪裡吃了一朵雷雲？","巫師什麼時候變成了一個茶杯？"], words: ["why","the wizard","need","help"], reward: { coins: 2000 } }
    ]
  },
  redHoodPath: {
    theme: "red riding hood path",
    title: "Help on Red Riding Hood Path",
    opening: "A red hood rests near a basket on the path.",
    openingZh: "一頂紅帽子在小路上的籃子旁邊。",
    ending: "The wild path is clear again.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence that explains the path problem.", promptZh: "選出說明小路問題的句子。", answer: "the girl cannot find the basket because leaves cover the handle.", choices: ["the girl cannot find the basket because leaves cover the handle.","the girl cannot eat the basket because it is a castle.","the girl cannot wear the river because it is noisy.","the girl cannot read the mountain before breakfast."], choicesZh: ["小女孩找不到籃子，因為葉子蓋住了提把。","小女孩不能吃籃子，因為它是一座城堡。","小女孩不能穿上河流，因為它很吵。","小女孩不能在早餐前讀那座山。"], words: ["the girl","basket","because","leaves","cover","the","handle"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the best helpful sentence.", promptZh: "選出最有幫助的句子。", answer: "Lumi should brush away the leaves before the path gets dark.", choices: ["Lumi should brush away the leaves before the path gets dark.","Lumi should hide the path under her shoe.","Lumi should shout until the trees run away.","Lumi should cook the moon before it rains."], choicesZh: ["Lumi 應該在路變暗前撥開葉子。","Lumi 應該把路藏在鞋子底下。","Lumi 應該大叫到樹都跑走。","Lumi 應該在下雨前把月亮煮熟。"], words: ["should","brush away the leaves","before","path","dark"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about what happened next.", promptZh: "選出接下來發生什麼的句子。", answer: "After Lumi helps, the basket is ready.", choices: ["After Lumi helps, the basket is ready.","After Lumi helps, the castle drinks a book.","After Lumi helps, the basket becomes angry.","After Lumi helps, every tree forgets the road."], choicesZh: ["Lumi 幫忙之後，籃子準備好了。","Lumi 幫忙之後，城堡喝了一本書。","Lumi 幫忙之後，籃子生氣了。","Lumi 幫忙之後，每棵樹都忘了路。"], words: ["after","helps","the","basket","is","ready"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the careful wild sentence.", promptZh: "選出小心的野外句子。", answer: "If we listen carefully, we can hear the wild answer.", choices: ["If we listen carefully, we can hear the wild answer.","If we run loudly, the answer becomes a shoe.","If the river sleeps, the basket can fly.","If the wolf reads maps, bread gets taller."], choicesZh: ["如果我們仔細聽，就能聽到野外的答案。","如果我們大聲跑，答案就會變成一隻鞋子。","如果河流睡著了，籃子就能飛。","如果狼讀地圖，麵包就會變高。"], words: ["if","listen","carefully","answer"], reward: { coins: 2000 } },
      { questionType: "question-choice", prompt: "Pick the story question.", promptZh: "選出故事的問題句。", answer: "Why does the girl need Lumi's help?", choices: ["Why does the girl need Lumi's help?","Why does the girl sell the castle?","Where does the girl eat a thundercloud?","When does the girl become a teacup?"], choicesZh: ["小女孩為什麼需要 Lumi 的幫忙？","小女孩為什麼要賣掉城堡？","小女孩在哪裡吃了一朵雷雲？","小女孩什麼時候變成了一個茶杯？"], words: ["why","the girl","need","help"], reward: { coins: 2000 } }
    ]
  },
  threePigsCottage: {
    theme: "three pigs cottage",
    title: "Help at the Three Pigs Cottage",
    opening: "Three tiny cottages stand under warm trees.",
    openingZh: "三間小小的屋子立在溫暖的樹下。",
    ending: "The three cottages are tidy.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence that explains the cottage problem.", promptZh: "選出說明小屋問題的句子。", answer: "the piglet cannot find the straw roof because the wind moved some straw.", choices: ["the piglet cannot find the straw roof because the wind moved some straw.","the piglet cannot eat the straw roof because it is a castle.","the piglet cannot wear the river because it is noisy.","the piglet cannot read the mountain before breakfast."], choicesZh: ["小豬找不到稻草屋頂，因為風把一些稻草吹動了。","小豬不能吃稻草屋頂，因為它是一座城堡。","小豬不能穿上河流，因為它很吵。","小豬不能在早餐前讀那座山。"], words: ["the piglet","straw roof","because","the","wind","moved","some","straw"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the best helpful sentence.", promptZh: "選出最有幫助的句子。", answer: "Lumi should tie the roof gently before the path gets dark.", choices: ["Lumi should tie the roof gently before the path gets dark.","Lumi should hide the path under her shoe.","Lumi should shout until the trees run away.","Lumi should cook the moon before it rains."], choicesZh: ["Lumi 應該在路變暗前輕輕綁好屋頂。","Lumi 應該把路藏在鞋子底下。","Lumi 應該大叫到樹都跑走。","Lumi 應該在下雨前把月亮煮熟。"], words: ["should","tie the roof gently","before","path","dark"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about what happened next.", promptZh: "選出接下來發生什麼的句子。", answer: "After Lumi helps, the straw roof stays still.", choices: ["After Lumi helps, the straw roof stays still.","After Lumi helps, the castle drinks a book.","After Lumi helps, the basket becomes angry.","After Lumi helps, every tree forgets the road."], choicesZh: ["Lumi 幫忙之後，稻草屋頂穩穩不動。","Lumi 幫忙之後，城堡喝了一本書。","Lumi 幫忙之後，籃子生氣了。","Lumi 幫忙之後，每棵樹都忘了路。"], words: ["after","helps","the","straw","roof","stays","still"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the careful wild sentence.", promptZh: "選出小心的野外句子。", answer: "If we listen carefully, we can hear the wild answer.", choices: ["If we listen carefully, we can hear the wild answer.","If we run loudly, the answer becomes a shoe.","If the river sleeps, the basket can fly.","If the wolf reads maps, bread gets taller."], choicesZh: ["如果我們仔細聽，就能聽到野外的答案。","如果我們大聲跑，答案就會變成一隻鞋子。","如果河流睡著了，籃子就能飛。","如果狼讀地圖，麵包就會變高。"], words: ["if","listen","carefully","answer"], reward: { coins: 2000 } },
      { questionType: "question-choice", prompt: "Pick the story question.", promptZh: "選出故事的問題句。", answer: "Why does the piglet need Lumi's help?", choices: ["Why does the piglet need Lumi's help?","Why does the piglet sell the castle?","Where does the piglet eat a thundercloud?","When does the piglet become a teacup?"], choicesZh: ["小豬為什麼需要 Lumi 的幫忙？","小豬為什麼要賣掉城堡？","小豬在哪裡吃了一朵雷雲？","小豬什麼時候變成了一個茶杯？"], words: ["why","the piglet","need","help"], reward: { coins: 2000 } }
    ]
  },
  treeSpiritGrove: {
    theme: "tree spirit grove",
    title: "Help in the Tree Spirit Grove",
    opening: "The ancient tree spirit blinks with blue lights.",
    openingZh: "古老的樹靈眨著藍色的光。",
    ending: "The grove glows softly.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence that explains the grove problem.", promptZh: "選出說明樹叢問題的句子。", answer: "the spirit cannot find the moon seed because it fell near the roots.", choices: ["the spirit cannot find the moon seed because it fell near the roots.","the spirit cannot eat the moon seed because it is a castle.","the spirit cannot wear the river because it is noisy.","the spirit cannot read the mountain before breakfast."], choicesZh: ["樹靈找不到月亮種子，因為它掉在樹根附近。","樹靈不能吃月亮種子，因為它是一座城堡。","樹靈不能穿上河流，因為它很吵。","樹靈不能在早餐前讀那座山。"], words: ["the spirit","moon seed","because","it","fell","near","the","roots"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the best helpful sentence.", promptZh: "選出最有幫助的句子。", answer: "Lumi should place the seed in moonlight before the path gets dark.", choices: ["Lumi should place the seed in moonlight before the path gets dark.","Lumi should hide the path under her shoe.","Lumi should shout until the trees run away.","Lumi should cook the moon before it rains."], choicesZh: ["Lumi 應該在路變暗前把種子放在月光下。","Lumi 應該把路藏在鞋子底下。","Lumi 應該大叫到樹都跑走。","Lumi 應該在下雨前把月亮煮熟。"], words: ["should","place the seed in moonlight","before","path","dark"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about what happened next.", promptZh: "選出接下來發生什麼的句子。", answer: "After Lumi helps, the moon seed begins to glow.", choices: ["After Lumi helps, the moon seed begins to glow.","After Lumi helps, the castle drinks a book.","After Lumi helps, the basket becomes angry.","After Lumi helps, every tree forgets the road."], choicesZh: ["Lumi 幫忙之後，月亮種子開始發光。","Lumi 幫忙之後，城堡喝了一本書。","Lumi 幫忙之後，籃子生氣了。","Lumi 幫忙之後，每棵樹都忘了路。"], words: ["after","helps","the","moon","seed","begins","to","glow"], reward: { coins: 2000 } },
      { questionType: "sentence-choice", prompt: "Pick the careful wild sentence.", promptZh: "選出小心的野外句子。", answer: "If we listen carefully, we can hear the wild answer.", choices: ["If we listen carefully, we can hear the wild answer.","If we run loudly, the answer becomes a shoe.","If the river sleeps, the basket can fly.","If the wolf reads maps, bread gets taller."], choicesZh: ["如果我們仔細聽，就能聽到野外的答案。","如果我們大聲跑，答案就會變成一隻鞋子。","如果河流睡著了，籃子就能飛。","如果狼讀地圖，麵包就會變高。"], words: ["if","listen","carefully","answer"], reward: { coins: 2000 } },
      { questionType: "question-choice", prompt: "Pick the story question.", promptZh: "選出故事的問題句。", answer: "Why does the spirit need Lumi's help?", choices: ["Why does the spirit need Lumi's help?","Why does the spirit sell the castle?","Where does the spirit eat a thundercloud?","When does the spirit become a teacup?"], choicesZh: ["樹靈為什麼需要 Lumi 的幫忙？","樹靈為什麼要賣掉城堡？","樹靈在哪裡吃了一朵雷雲？","樹靈什麼時候變成了一個茶杯？"], words: ["why","the spirit","need","help"], reward: { coins: 2000 } }
    ]
  },
});
//#endregion 場景自帶題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
export const wildSceneConfigs = mergeLessons({
  wildExit: { ...wildPathArt, scene: "scene-wild-path", npcClass: "npc-none", npc: "Wild Sign", travelAction: "World Map", travelLine: "The path returns to the kingdom world map." },
  elfGlade: { ...wildSceneArt("elf-glade"), scene: "scene-wild-elf-glade", npc: "Elia", npcImage: npcImage("elia"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Elia the elf listens to the glowing flowers." },
  fairyAtelier: { ...wildShopArt("fairy-atelier"), scene: "scene-wild-fairy-atelier", npc: "Faye", npcImage: npcImage("fairy-atelier"), npcNaturalHeightCm: 150, travelAction: "Shop", travelLine: "Faye has fairy dresses and accessories in the glade.", shopGreeting: "Welcome to the Fairy Atelier. Pick dresses or accessories." },
  dwarfCottage: { ...wildSceneArt("dwarf-cottage"), scene: "scene-wild-dwarf-cottage", npc: "Pip", npcImage: npcImage("pip"), npcNaturalHeightCm: 125, travelAction: "Shop", travelLine: "Pip has handmade wild outerwear and shoes ready for Lumi.", shopGreeting: "Welcome to the Dwarf Cottage. Pick outerwear or shoes." },
  stoneGolemPass: { ...wildSceneArt("golem-pass"), scene: "scene-wild-golem-pass", npc: "Goro", npcImage: npcImage("goro"), npcNaturalHeightCm: 200, travelAction: "Visit", travelLine: "Goro the stone golem blocks the old pass with a friendly smile." },
  halflingVillage: { ...wildSceneArt("halfling-village"), scene: "scene-wild-halfling-village", npc: "Penny", npcImage: npcImage("penny"), npcNaturalHeightCm: 100, travelAction: "Visit", travelLine: "Penny waves from a round green door." },
  wizardHut: { ...wildSceneArt("wizard-hut"), scene: "scene-wild-wizard-hut", npc: "Wiz Beryl", npcImage: npcImage("wiz-beryl"), npcNaturalHeightCm: 170, travelAction: "Visit", travelLine: "Wiz Beryl is sorting jars under the purple roof." },
  redHoodPath: { ...wildSceneArt("red-hood-path"), scene: "scene-wild-red-hood-path", npc: "Ruby", npcImage: npcImage("ruby"), npcNaturalHeightCm: 125, travelAction: "Visit", travelLine: "Ruby checks her basket on the wild path." },
  threePigsCottage: { ...wildSceneArt("three-pigs"), scene: "scene-wild-three-pigs", npc: "Pippo", npcImage: npcImage("pippo"), npcNaturalHeightCm: 90, travelAction: "Visit", travelLine: "Pippo looks at three tiny cottages." },
  treeSpiritGrove: { ...wildSceneArt("tree-spirit-grove"), scene: "scene-wild-tree-spirit-grove", npc: "Sylvie", npcImage: npcImage("sylvie"), npcNaturalHeightCm: 170, travelAction: "Visit", travelLine: "Sylvie the tree spirit smiles from the branches." }
}, wildLessonBank);
//#endregion 對話場景設定

//#region 衍生匯出
// 由題庫資料統一產生給 game-engine/data/game-data.js 匯總使用的資料註冊表。
export const wildQuestTemplates = makeQuestTemplates(wildLessonPlaces, wildZh);
export const wildLessons = makeLessons("wild", wildVocabularyProfile, wildLessonPlaces, wildZh);
//#endregion 衍生匯出
