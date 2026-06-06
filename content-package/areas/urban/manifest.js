//#region 匯入共用工具
// 將題庫清單轉成遊戲執行時需要的 lessons（課程資料）與 quest templates（任務模板）。
import { makeLessons, makeQuestTemplates } from "../_shared/lesson-helpers.js";
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
  rewardCoins: 100,
  note: "Urban town places use short Starters-style words and classroom-safe sentences."
});
//#endregion 英文等級與獎勵設定

//#region 題庫資料
// reward 是每題完成後給玩家的固定獎勵。
const reward = { coins: 100, vocab: 1, expression: 1 };

// q() 是題目簡寫輔助函式，避免每題重複寫完整物件。
const q = (prompt, answer, choices, words, questionType = "sentence-choice") => ({ prompt, answer, choices, words, questionType, reward });

// starterQuestions() 用同一組題型產生不同地點的 Starters 練習題。
const starterQuestions = ({ object, place, action, color, person, extra }) => [
  q(`Pick the sentence about the ${object}.`, `I can see the ${object}.`, [`I can see the ${object}.`, `I can eat the ${object}.`, `The ${object} is under my shoe.`, `The ${object} can fly away.`], ["I", "can", "see", object]),
  q(`Pick the sentence for ${person}.`, `${person} has a ${object}.`, [`${person} has a ${object}.`, `${person} has a moon.`, `${person} is a boat.`, `${person} eats the castle.`], [person, "has", object]),
  q(`Pick the ${place} sentence.`, `This ${place} is ${color}.`, [`This ${place} is ${color}.`, `This ${place} is a fish.`, `My shoe is ${color}.`, `The cow reads here.`], ["this", place, color]),
  q(`Pick what Lumi can do here.`, `Lumi can ${action}.`, [`Lumi can ${action}.`, `Lumi can sleep in the sea.`, `Lumi can eat a road.`, `Lumi can run into the sky.`], ["Lumi", "can", action]),
  q(`Pick the kind sentence.`, extra, [extra, `The ${object} is angry.`, `I do not like this ${place}.`, `The ${place} is under water.`], extra.toLowerCase().replaceAll(".", "").split(" "))
];

// lessonPlaces 是本地區所有可練習地點與題目清單。
const urbanLessonPlaces = [
  { id: "garden", theme: "garden cat", title: "Help in the Castle Garden", opening: "Mira is looking for a small garden friend.", ending: "The garden feels happy again.", questions: starterQuestions({ object: "cat", place: "garden", action: "look", color: "green", person: "Mira", extra: "The cat is cute." }) },
  { id: "market", theme: "market food", title: "Help at Market Square", opening: "Auntie Pom smiles by the warm bread.", ending: "The market stall is ready.", questions: starterQuestions({ object: "bread", place: "market", action: "buy", color: "busy", person: "Pom", extra: "May I have bread?" }) },
  { id: "harbor", theme: "fish shop", title: "Help at the Fish Shop", opening: "Nami has fresh fish by the water.", ending: "Dinner will be ready soon.", questions: starterQuestions({ object: "fish", place: "shop", action: "choose", color: "blue", person: "Nami", extra: "I want a fish." }) },
  { id: "port", theme: "dock guide", title: "Help at Harbor Port", opening: "The dock guide watches the little boats.", ending: "The boats can sail safely.", questions: starterQuestions({ object: "boat", place: "port", action: "wave", color: "open", person: "Dock Guide", extra: "The boat is small." }) },
  { id: "boutique", theme: "dress boutique", title: "Help at the Dress Boutique", opening: "Rena has a new dress to show.", ending: "The boutique sparkles.", questions: starterQuestions({ object: "dress", place: "boutique", action: "try", color: "pink", person: "Rena", extra: "The dress is pretty." }) },
  { id: "hairSalon", theme: "hair salon", title: "Help at the Hair Salon", opening: "Stylist Lina brushes soft story hair.", ending: "The salon mirror shines.", questions: starterQuestions({ object: "brush", place: "salon", action: "comb", color: "bright", person: "Lina", extra: "This hair is soft." }) },
  { id: "tailorStudio", theme: "tailor studio", title: "Help at the Tailor Studio", opening: "Tailor Tess folds tops and skirts.", ending: "The studio shelves are neat.", questions: starterQuestions({ object: "shirt", place: "studio", action: "fold", color: "neat", person: "Tess", extra: "This shirt is clean." }) },
  { id: "shoeShop", theme: "shoe shop", title: "Help at the Shoe Shop", opening: "Mina is checking soft walking shoes.", ending: "The shoes are ready for a walk.", questions: starterQuestions({ object: "shoe", place: "shop", action: "walk", color: "soft", person: "Mina", extra: "These shoes are soft." }) },
  { id: "accessoryShop", theme: "accessory shop", title: "Help at the Accessory Shop", opening: "Lili has ribbons and crowns.", ending: "The tiny gifts are neat.", questions: starterQuestions({ object: "ribbon", place: "shop", action: "pick", color: "red", person: "Lili", extra: "This ribbon is nice." }) },
  { id: "lighthouse", theme: "lighthouse weather", title: "Help at the Lighthouse", opening: "Captain Sol looks at the sky and sea.", ending: "The light shines safely.", questions: starterQuestions({ object: "light", place: "lighthouse", action: "check", color: "bright", person: "Sol", extra: "It is sunny today." }) },
  { id: "schoolClassroom", theme: "school classroom", title: "Help in the School Classroom", opening: "Teacher Bell points to the board.", ending: "The class is ready to read.", questions: starterQuestions({ object: "book", place: "classroom", action: "read", color: "happy", person: "Bell", extra: "Open your book." }) },
  { id: "library", theme: "library reading", title: "Help in the Library", opening: "Librarian Nola has a quiet reading table.", ending: "The books are in order.", questions: starterQuestions({ object: "book", place: "library", action: "read", color: "quiet", person: "Nola", extra: "Please read here." }) },
  { id: "temple", theme: "gentle temple", title: "Help at the Temple", opening: "Sister Luma waters the temple flowers.", ending: "The temple is calm.", questions: starterQuestions({ object: "flower", place: "temple", action: "listen", color: "white", person: "Luma", extra: "The flower is white." }) },
  { id: "administration", theme: "town office", title: "Help at the Administration Building", opening: "Clerk Otto sorts the town notes.", ending: "The town notes are tidy.", questions: starterQuestions({ object: "map", place: "office", action: "help", color: "neat", person: "Otto", extra: "This map is for town." }) }
];
//#endregion 題庫資料

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
    castleRoom: { id: "castleRoom", label: "Castle Stairway", x: 52.7, y: 15.0, links: ["garden", "schoolClassroom", "library", "temple", "administration", "market"] },
    garden: { id: "garden", label: "Castle Garden", x: 52.7, y: 44.9, links: ["castleRoom", "market", "library", "temple"] },
    schoolClassroom: { id: "schoolClassroom", label: "School Classroom", x: 35.2, y: 47.5, links: ["castleRoom", "library", "market"] },
    library: { id: "library", label: "Library", x: 44.5, y: 44.3, links: ["schoolClassroom", "castleRoom", "garden"] },
    temple: { id: "temple", label: "Temple", x: 67.1, y: 46.9, links: ["castleRoom", "garden", "administration", "boutique", "hairSalon"] },
    administration: { id: "administration", label: "Administration Building", x: 60.5, y: 37.1, links: ["castleRoom", "temple", "boutique", "tailorStudio"] },
    market: { id: "market", label: "Market Square", x: 40.4, y: 59.2, links: ["garden", "schoolClassroom", "tailorStudio", "shoeShop", "harbor", "port"] },
    boutique: { id: "boutique", label: "Dress Boutique", x: 68.4, y: 59.2, links: ["tailorStudio", "shoeShop", "accessoryShop", "administration", "temple", "hairSalon"] },
    hairSalon: { id: "hairSalon", label: "Hair Salon", x: 80.7, y: 54.7, links: ["boutique", "accessoryShop", "temple"] },
    tailorStudio: { id: "tailorStudio", label: "Tailor Studio", x: 59.2, y: 67.7, links: ["market", "boutique", "shoeShop", "administration"] },
    shoeShop: { id: "shoeShop", label: "Shoe Shop", x: 73.6, y: 70.3, links: ["market", "harbor", "boutique", "tailorStudio"] },
    accessoryShop: { id: "accessoryShop", label: "Accessory Atelier", x: 84.0, y: 65.1, links: ["boutique", "hairSalon"] },
    harbor: { id: "harbor", label: "Fish Shop", x: 39.7, y: 76.8, links: ["market", "shoeShop", "port"] },
    port: { id: "port", label: "Harbor Port", x: 56.0, y: 84.6, links: ["market", "harbor", "lighthouse"] },
    lighthouse: { id: "lighthouse", label: "Lighthouse", x: 89.8, y: 76.2, links: ["port"] }
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
    { id: "port", area: "urban", node: "port", label: "Harbor Port", icon: "⚓", npc: "Dock Guide", scene: "scene-harbor", npcImage: npcImage("dock-guide"), hint: "The docks are ready for boats and sea trips." },
    { id: "boutique", area: "urban", node: "boutique", label: "Dress Boutique", icon: "👗", npc: "Rena", scene: "scene-urban-dress-boutique", npcImage: npcImage("rena"), kind: "shop", shopCategories: ["dresses", "outfitSets"], defaultCategory: "dresses", hint: "Rena's boutique focuses on dresses and complete outfit sets." },
    { id: "hairSalon", area: "urban", node: "hairSalon", label: "Hair Salon", icon: "💇", npc: "Stylist Lina", scene: "scene-urban-hair-salon", npcImage: npcImage("stylist-lina"), kind: "shop", shopCategories: ["hair"], defaultCategory: "hair", hint: "Stylist Lina keeps soft story hairstyles ready for Lumi." },
    { id: "tailorStudio", area: "urban", node: "tailorStudio", label: "Tailor Studio", icon: "👚", npc: "Tailor Tess", scene: "scene-urban-tailor-studio", npcImage: npcImage("tailor-tess"), kind: "shop", shopCategories: ["tops", "bottoms"], defaultCategory: "tops", hint: "Tailor Tess sells tops and bottoms only." },
    { id: "shoeShop", area: "urban", node: "shoeShop", label: "Shoe Shop", icon: "👞", npc: "Mina", scene: "scene-shoes", npcImage: npcImage("mina"), kind: "shop", shopCategories: ["shoes"], defaultCategory: "shoes", hint: "Mina shows shoes for long walks." },
    { id: "accessoryShop", area: "urban", node: "accessoryShop", label: "Accessory Atelier", icon: "👑", npc: "Lili", scene: "scene-urban-accessory-atelier", npcImage: npcImage("lili"), kind: "shop", shopCategories: ["hats", "accessories"], defaultCategory: "hats", hint: "Lili sells hats and accessories only." },
    { id: "lighthouse", area: "urban", node: "lighthouse", label: "Lighthouse", icon: "🗼", npc: "Captain Sol", scene: "scene-lighthouse", npcImage: npcImage("captain-sol"), hint: "The lighthouse watches the sea before ships sail." }
  ],
  // actors 是地圖上的動態環境效果，不是可點擊地點。
  actors: [],
  defaultNode: "garden",
  enabled: true
});
//#endregion 地圖與地點設定

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
export const urbanSceneConfigs = Object.freeze({
  luminaraCastle: { ...singleSceneArt("garden"), scene: "scene-garden", npcClass: "npc-garden", npc: "Gate Guard", travelAction: "World Map", travelLine: "The castle stair opens the kingdom world map." },
  garden: { ...singleSceneArt("garden"), scene: "scene-garden", npc: "Mira", npcImage: npcImage("mira"), npcNaturalHeightCm: 130, travelAction: "Visit", travelLine: "Mira is watching the roses and a shy garden cat." },
  schoolClassroom: { ...civicSceneArt("school-classroom"), scene: "scene-urban-school", npc: "Teacher Bell", npcImage: npcImage("teacher-bell"), npcNaturalHeightCm: 165, travelAction: "Visit", travelLine: "Teacher Bell has a short Starters sentence." },
  library: { ...civicSceneArt("library"), scene: "scene-urban-library", npc: "Librarian Nola", npcImage: npcImage("librarian-nola"), npcNaturalHeightCm: 162, travelAction: "Visit", travelLine: "Librarian Nola is ready for quiet reading." },
  temple: { ...civicSceneArt("temple"), scene: "scene-urban-temple", npc: "Sister Luma", npcImage: npcImage("sister-luma"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Sister Luma keeps the temple flowers bright." },
  administration: { ...civicSceneArt("administration"), scene: "scene-urban-administration", npc: "Clerk Otto", npcImage: npcImage("clerk-otto"), npcNaturalHeightCm: 172, travelAction: "Visit", travelLine: "Clerk Otto sorts the town notes." },
  market: { ...singleSceneArt("market"), scene: "scene-market", npc: "Auntie Pom", npcImage: npcImage("auntie-pom-market"), npcNaturalHeightCm: 155, travelAction: "Visit", travelLine: "Auntie Pom smiles beside warm bread and bright fruit." },
  harbor: { ...singleSceneArt("harbor"), scene: "scene-harbor", npc: "Nami", npcImage: npcImage("nami"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Nami is waiting by the bright harbor boats." },
  port: { ...singleSceneArt("harbor"), scene: "scene-harbor", npc: "Dock Guide", npcImage: npcImage("dock-guide"), npcNaturalHeightCm: 175, travelAction: "Visit", travelLine: "Boats arrive at the harbor port for sea trips and dock visits." },
  boutique: { ...urbanShopArt("dress-boutique"), scene: "scene-urban-dress-boutique", npc: "Rena", npcImage: npcImage("rena"), npcNaturalHeightCm: 165, travelAction: "Shop", travelLine: "Rena has dresses and complete outfit sets ready for a bright day.", shopGreeting: "Welcome to the Dress Boutique. Dresses and outfit sets are ready." },
  hairSalon: { ...urbanShopArt("hair-salon"), scene: "scene-urban-hair-salon", npc: "Stylist Lina", npcImage: npcImage("stylist-lina"), npcNaturalHeightCm: 162, travelAction: "Shop", travelLine: "Stylist Lina has soft story hairstyles for Lumi.", shopGreeting: "Welcome to the Hair Salon. Pick a hairstyle for Lumi." },
  tailorStudio: { ...urbanShopArt("tailor-studio"), scene: "scene-urban-tailor-studio", npc: "Tailor Tess", npcImage: npcImage("tailor-tess"), npcNaturalHeightCm: 160, travelAction: "Shop", travelLine: "Tailor Tess keeps tops and bottoms neatly folded.", shopGreeting: "Welcome to the Tailor Studio. Pick tops or bottoms." },
  shoeShop: { ...singleSceneArt("shoes", { tone: "shop" }), scene: "scene-shoes", npc: "Mina", npcImage: npcImage("mina"), npcNaturalHeightCm: 158, travelAction: "Shop", travelLine: "Mina has walking shoes for Lumi's next trip.", shopGreeting: "Hello, Princess. Try shoes for the road." },
  accessoryShop: { ...urbanShopArt("accessory-atelier"), scene: "scene-urban-accessory-atelier", npc: "Lili", npcImage: npcImage("lili"), npcNaturalHeightCm: 156, travelAction: "Shop", travelLine: "Lili has hats and accessories in separate trays.", shopGreeting: "Good day, Princess. Pick a hat or accessory." },
  lighthouse: { ...singleSceneArt("lighthouse"), scene: "scene-lighthouse", npc: "Captain Sol", npcImage: npcImage("captain-sol"), npcNaturalHeightCm: 178, travelAction: "Visit", travelLine: "Captain Sol checks the sea from the lighthouse." }
});
//#endregion 對話場景設定

//#region 衍生匯出
// 由題庫資料統一產生給 game-engine/data/game-data.js 匯總使用的資料註冊表。
export const urbanQuestTemplates = makeQuestTemplates(urbanLessonPlaces);
export const urbanLessons = makeLessons("urban", urbanVocabularyProfile, urbanLessonPlaces);
//#endregion 衍生匯出
