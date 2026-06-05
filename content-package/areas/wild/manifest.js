//#region 匯入共用工具
// 將題庫清單轉成遊戲執行時需要的 lessons（課程資料）與 quest templates（任務模板）。
import { makeLessons, makeQuestTemplates } from "../_shared/lesson-helpers.js";
//#endregion 匯入共用工具

//#region 素材路徑工具
// 所有本地區圖片路徑集中在這裡；換素材或快取版本參數時優先改這段。
const npcImage = (name) => `content-package/areas/wild/assets/characters/${name}.webp?v=20260605-npc-r2`;
const sceneArt = (src, options = {}) => ({ sceneArt: { src, tone: "wild", ...options } });
const wildAtlasArt = (position) => sceneArt("content-package/areas/wild/assets/scenes/scenes-atlas.webp?v=20260605-webp-assets", {
  atlas: "wild-scenes",
  position,
  size: "800% 100%"
});
const wildShopArt = (name) => sceneArt(`content-package/areas/wild/assets/scenes/${name}.webp?v=20260604-issues56-60`, { tone: "shop" });
const wildPathArt = sceneArt("content-package/areas/wild/assets/scenes/wild-path.webp?v=20260602-wild-art");
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
const reward = { coins: 2000, vocab: 3, expression: 3, kindness: 2 };

// q() 是題目簡寫輔助函式，避免每題重複寫完整物件。
const q = (prompt, answer, choices, words, questionType = "sentence-choice") => ({ prompt, answer, choices, words, questionType, reward });

// flyersQuestions() 用同一組題型產生 Wild 各童話場景的練習題。
const flyersQuestions = ({ character, place, object, problem, action, result }) => [
  q(`Pick the sentence that explains the ${place} problem.`, `${character} cannot find the ${object} because ${problem}.`, [`${character} cannot find the ${object} because ${problem}.`, `${character} cannot eat the ${object} because it is a castle.`, `${character} cannot wear the river because it is noisy.`, `${character} cannot read the mountain before breakfast.`], [character, object, "because", ...problem.split(" ")]),
  q(`Pick the best helpful sentence.`, `Lumi should ${action} before the path gets dark.`, [`Lumi should ${action} before the path gets dark.`, `Lumi should hide the path under her shoe.`, `Lumi should shout until the trees run away.`, `Lumi should cook the moon before it rains.`], ["should", action, "before", "path", "dark"]),
  q(`Pick the sentence about what happened next.`, `After Lumi helps, ${result}.`, [`After Lumi helps, ${result}.`, "After Lumi helps, the castle drinks a book.", "After Lumi helps, the basket becomes angry.", "After Lumi helps, every tree forgets the road."], ["after", "helps", ...result.split(" ")]),
  q(`Pick the careful wild sentence.`, `If we listen carefully, we can hear the wild answer.`, ["If we listen carefully, we can hear the wild answer.", "If we run loudly, the answer becomes a shoe.", "If the river sleeps, the basket can fly.", "If the wolf reads maps, bread gets taller."], ["if", "listen", "carefully", "answer"]),
  q(`Pick the story question.`, `Why does ${character} need Lumi's help?`, [`Why does ${character} need Lumi's help?`, `Why does ${character} sell the castle?`, `Where does ${character} eat a thundercloud?`, `When does ${character} become a teacup?`], ["why", character, "need", "help"], "question-choice")
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
  mapImage: "content-package/areas/wild/assets/map.webp?v=20260605-wild-map-r2",
  imageSize: { width: 1448, height: 1086 },
  vocabularyProfile: wildVocabularyProfile,
  // nodes 控制地圖上的路網與圖示座標；x / y 是相對地圖寬高的百分比。
  nodes: {
    wildEntrance: { id: "wildEntrance", label: "Urban Path", x: 87, y: 82, links: ["treeSpiritGrove", "wizardHut", "threePigsCottage"] },
    elfGlade: { id: "elfGlade", label: "Elf Glade", x: 31, y: 28, links: ["dwarfCottage", "fairyAtelier", "halflingVillage"] },
    fairyAtelier: { id: "fairyAtelier", label: "Fairy Atelier", x: 38, y: 38, links: ["elfGlade", "halflingVillage", "wizardHut"] },
    dwarfCottage: { id: "dwarfCottage", label: "Dwarf Cottage", x: 18, y: 48, links: ["elfGlade", "stoneGolemPass", "halflingVillage"] },
    stoneGolemPass: { id: "stoneGolemPass", label: "Stone Golem Pass", x: 44, y: 18, links: ["dwarfCottage", "wizardHut", "elfGlade"] },
    halflingVillage: { id: "halflingVillage", label: "Halfling Village", x: 50, y: 58, links: ["elfGlade", "dwarfCottage", "fairyAtelier", "redHoodPath", "threePigsCottage"] },
    wizardHut: { id: "wizardHut", label: "Wizard Hut", x: 63, y: 44, links: ["stoneGolemPass", "treeSpiritGrove", "threePigsCottage", "fairyAtelier"] },
    redHoodPath: { id: "redHoodPath", label: "Red Riding Hood Path", x: 14, y: 84, links: ["halflingVillage", "threePigsCottage"] },
    threePigsCottage: { id: "threePigsCottage", label: "Three Pigs Cottage", x: 57, y: 78, links: ["redHoodPath", "halflingVillage", "wizardHut", "treeSpiritGrove", "wildEntrance"] },
    treeSpiritGrove: { id: "treeSpiritGrove", label: "Tree Spirit Grove", x: 78, y: 43, links: ["wizardHut", "threePigsCottage", "wildEntrance"] }
  },
  // locations 控制地圖圖示進入後的場景、NPC、商店與提示文字。
  locations: [
    { id: "wildExit", area: "wild", node: "wildEntrance", label: "Urban Path", icon: "↩", npcClass: "npc-none", npc: "Wild Sign", kind: "gate", markerStyle: "portal", portalId: "entrance", hint: "The path returns to the urban town." },
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
  actors: [
    { id: "wild-river-glow", type: "water", x: 70, y: 78, w: 28, h: 18, z: 1, phase: 1.1 },
    { id: "wild-firefly-a", type: "glow", x: 31, y: 28, w: 8, h: 8, z: 3, phase: 0.2 },
    { id: "wild-firefly-b", type: "glow", x: 78, y: 43, w: 7, h: 7, z: 3, phase: 1.1 },
    { id: "wild-bird", type: "bird", x: 52, y: 19, w: 4, h: 2, z: 4, phase: 0.6 }
  ],
  defaultNode: "wildEntrance",
  enabled: true
});
//#endregion 地圖與地點設定

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
export const wildSceneConfigs = Object.freeze({
  wildExit: { ...wildPathArt, scene: "scene-wild-path", npcClass: "npc-none", npc: "Wild Sign", travelAction: "Back to Urban", travelLine: "The path returns to the urban town." },
  elfGlade: { ...wildAtlasArt("0% 50%"), scene: "scene-wild-elf-glade", npc: "Elia", npcImage: npcImage("elia"), travelAction: "Visit", travelLine: "Elia the elf listens to the glowing flowers." },
  fairyAtelier: { ...wildShopArt("fairy-atelier"), scene: "scene-wild-fairy-atelier", npc: "Faye", npcImage: npcImage("fairy-atelier"), travelAction: "Shop", travelLine: "Faye has fairy dresses and accessories in the glade.", shopGreeting: "Welcome to the Fairy Atelier. Pick dresses or accessories." },
  dwarfCottage: { ...wildAtlasArt("14.285% 50%"), scene: "scene-wild-dwarf-cottage", npc: "Pip", npcImage: npcImage("pip"), travelAction: "Shop", travelLine: "Pip has handmade wild outerwear and shoes ready for Lumi.", shopGreeting: "Welcome to the Dwarf Cottage. Pick outerwear or shoes." },
  stoneGolemPass: { ...wildAtlasArt("28.571% 50%"), scene: "scene-wild-golem-pass", npc: "Goro", npcImage: npcImage("goro"), travelAction: "Visit", travelLine: "Goro the stone golem blocks the old pass with a friendly smile." },
  halflingVillage: { ...wildAtlasArt("42.857% 50%"), scene: "scene-wild-halfling-village", npc: "Penny", npcImage: npcImage("penny"), travelAction: "Visit", travelLine: "Penny waves from a round green door." },
  wizardHut: { ...wildAtlasArt("57.143% 50%"), scene: "scene-wild-wizard-hut", npc: "Wiz Beryl", npcImage: npcImage("wiz-beryl"), travelAction: "Visit", travelLine: "Wiz Beryl is sorting jars under the purple roof." },
  redHoodPath: { ...wildAtlasArt("71.429% 50%"), scene: "scene-wild-red-hood-path", npc: "Ruby", npcImage: npcImage("ruby"), travelAction: "Visit", travelLine: "Ruby checks her basket on the wild path." },
  threePigsCottage: { ...wildAtlasArt("85.714% 50%"), scene: "scene-wild-three-pigs", npc: "Pippo", npcImage: npcImage("pippo"), travelAction: "Visit", travelLine: "Pippo looks at three tiny cottages." },
  treeSpiritGrove: { ...wildAtlasArt("100% 50%"), scene: "scene-wild-tree-spirit-grove", npc: "Sylvie", npcImage: npcImage("sylvie"), travelAction: "Visit", travelLine: "Sylvie the tree spirit smiles from the branches." }
});
//#endregion 對話場景設定

//#region 衍生匯出
// 由題庫資料統一產生給 game-engine/data/game-data.js 匯總使用的資料註冊表。
export const wildQuestTemplates = makeQuestTemplates(wildLessonPlaces);
export const wildLessons = makeLessons("wild", wildVocabularyProfile, wildLessonPlaces);
//#endregion 衍生匯出
