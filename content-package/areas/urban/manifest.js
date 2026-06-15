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
  rewardCoins: 100,
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
    { id: "port", area: "urban", node: "port", label: "Harbor Port", icon: "⚓", npc: "Dock Guide", scene: "scene-port", npcImage: npcImage("dock-guide"), hint: "The docks are ready for boats and sea trips." },
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

//#region 場景自帶題庫（issue #96）
// urbanLessonBank：以 place 為鍵的手寫固定題庫，每題自帶中文（promptZh／choicesZh）；由 mergeLessons 併入 sceneConfigs 對應條目。
const urbanLessonBank = Object.freeze({
  garden: {
    theme: "garden cat",
    title: "Help in the Castle Garden",
    opening: "Mira is looking for a small garden friend.",
    openingZh: "Mira 正在找一個小小的花園朋友。",
    ending: "The garden feels happy again.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the cat.", promptZh: "選出關於貓的句子。", answer: "I can see the cat.", choices: ["I can see the cat.","I can eat the cat.","The cat is under my shoe.","The cat can fly away."], choicesZh: ["我看得到貓。","我可以吃貓。","貓在我的鞋子底下。","貓會飛走。"], words: ["I","can","see","cat"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence for Mira.", promptZh: "選出給Mira的句子。", answer: "Mira has a cat.", choices: ["Mira has a cat.","Mira has a moon.","Mira is a boat.","Mira eats the castle."], choicesZh: ["Mira有一個貓。","Mira有一個月亮。","Mira是一艘船。","Mira把城堡吃掉。"], words: ["Mira","has","cat"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the garden sentence.", promptZh: "選出關於花園的句子。", answer: "This garden is green.", choices: ["This garden is green.","This garden is a fish.","My shoe is green.","The cow reads here."], choicesZh: ["這個花園是綠色的。","這個花園是一條魚。","我的鞋子是綠色的。","牛在這裡讀書。"], words: ["this","garden","green"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do here.", promptZh: "選出 Lumi 在這裡會做的事。", answer: "Lumi can look.", choices: ["Lumi can look.","Lumi can sleep in the sea.","Lumi can eat a road.","Lumi can run into the sky."], choicesZh: ["Lumi 會看。","Lumi 會在海裡睡覺。","Lumi 會吃一條路。","Lumi 會跑進天空。"], words: ["Lumi","can","look"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "The cat is cute.", choices: ["The cat is cute.","The cat is angry.","I do not like this garden.","The garden is under water."], choicesZh: ["這隻貓很可愛。","貓在生氣。","我不喜歡這個花園。","這個花園在水底下。"], words: ["the","cat","is","cute"], reward: { coins: 100 } }
    ]
  },
  market: {
    theme: "market food",
    title: "Help at Market Square",
    opening: "Auntie Pom smiles by the warm bread.",
    openingZh: "Pom 阿姨在溫熱的麵包旁微笑。",
    ending: "The market stall is ready.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the bread.", promptZh: "選出關於麵包的句子。", answer: "I can see the bread.", choices: ["I can see the bread.","I can eat the bread.","The bread is under my shoe.","The bread can fly away."], choicesZh: ["我看得到麵包。","我可以吃麵包。","麵包在我的鞋子底下。","麵包會飛走。"], words: ["I","can","see","bread"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence for Pom.", promptZh: "選出給Pom的句子。", answer: "Pom has a bread.", choices: ["Pom has a bread.","Pom has a moon.","Pom is a boat.","Pom eats the castle."], choicesZh: ["Pom有一個麵包。","Pom有一個月亮。","Pom是一艘船。","Pom把城堡吃掉。"], words: ["Pom","has","bread"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the market sentence.", promptZh: "選出關於市場的句子。", answer: "This market is busy.", choices: ["This market is busy.","This market is a fish.","My shoe is busy.","The cow reads here."], choicesZh: ["這個市場是忙碌的。","這個市場是一條魚。","我的鞋子是忙碌的。","牛在這裡讀書。"], words: ["this","market","busy"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do here.", promptZh: "選出 Lumi 在這裡會做的事。", answer: "Lumi can buy.", choices: ["Lumi can buy.","Lumi can sleep in the sea.","Lumi can eat a road.","Lumi can run into the sky."], choicesZh: ["Lumi 會買東西。","Lumi 會在海裡睡覺。","Lumi 會吃一條路。","Lumi 會跑進天空。"], words: ["Lumi","can","buy"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "May I have bread?", choices: ["May I have bread?","The bread is angry.","I do not like this market.","The market is under water."], choicesZh: ["我可以要一些麵包嗎？","麵包在生氣。","我不喜歡這個市場。","這個市場在水底下。"], words: ["may","i","have","bread?"], reward: { coins: 100 } }
    ]
  },
  harbor: {
    theme: "fish shop",
    title: "Help at the Fish Shop",
    opening: "Nami has fresh fish by the water.",
    openingZh: "Nami 在水邊有新鮮的魚。",
    ending: "Dinner will be ready soon.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the fish.", promptZh: "選出關於魚的句子。", answer: "I can see the fish.", choices: ["I can see the fish.","I can eat the fish.","The fish is under my shoe.","The fish can fly away."], choicesZh: ["我看得到魚。","我可以吃魚。","魚在我的鞋子底下。","魚會飛走。"], words: ["I","can","see","fish"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence for Nami.", promptZh: "選出給Nami的句子。", answer: "Nami has a fish.", choices: ["Nami has a fish.","Nami has a moon.","Nami is a boat.","Nami eats the castle."], choicesZh: ["Nami有一個魚。","Nami有一個月亮。","Nami是一艘船。","Nami把城堡吃掉。"], words: ["Nami","has","fish"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the shop sentence.", promptZh: "選出關於商店的句子。", answer: "This shop is blue.", choices: ["This shop is blue.","This shop is a fish.","My shoe is blue.","The cow reads here."], choicesZh: ["這個商店是藍色的。","這個商店是一條魚。","我的鞋子是藍色的。","牛在這裡讀書。"], words: ["this","shop","blue"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do here.", promptZh: "選出 Lumi 在這裡會做的事。", answer: "Lumi can choose.", choices: ["Lumi can choose.","Lumi can sleep in the sea.","Lumi can eat a road.","Lumi can run into the sky."], choicesZh: ["Lumi 會挑選。","Lumi 會在海裡睡覺。","Lumi 會吃一條路。","Lumi 會跑進天空。"], words: ["Lumi","can","choose"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "I want a fish.", choices: ["I want a fish.","The fish is angry.","I do not like this shop.","The shop is under water."], choicesZh: ["我想要一條魚。","魚在生氣。","我不喜歡這個商店。","這個商店在水底下。"], words: ["i","want","a","fish"], reward: { coins: 100 } }
    ]
  },
  port: {
    theme: "dock guide",
    title: "Help at Harbor Port",
    opening: "The dock guide watches the little boats.",
    openingZh: "碼頭嚮導看著小船。",
    ending: "The boats can sail safely.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the boat.", promptZh: "選出關於船的句子。", answer: "I can see the boat.", choices: ["I can see the boat.","I can eat the boat.","The boat is under my shoe.","The boat can fly away."], choicesZh: ["我看得到船。","我可以吃船。","船在我的鞋子底下。","船會飛走。"], words: ["I","can","see","boat"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence for Dock Guide.", promptZh: "選出給Dock Guide的句子。", answer: "Dock Guide has a boat.", choices: ["Dock Guide has a boat.","Dock Guide has a moon.","Dock Guide is a boat.","Dock Guide eats the castle."], choicesZh: ["Dock Guide有一個船。","Dock Guide有一個月亮。","Dock Guide是一艘船。","Dock Guide把城堡吃掉。"], words: ["Dock Guide","has","boat"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the port sentence.", promptZh: "選出關於碼頭的句子。", answer: "This port is open.", choices: ["This port is open.","This port is a fish.","My shoe is open.","The cow reads here."], choicesZh: ["這個碼頭是開闊的。","這個碼頭是一條魚。","我的鞋子是開闊的。","牛在這裡讀書。"], words: ["this","port","open"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do here.", promptZh: "選出 Lumi 在這裡會做的事。", answer: "Lumi can wave.", choices: ["Lumi can wave.","Lumi can sleep in the sea.","Lumi can eat a road.","Lumi can run into the sky."], choicesZh: ["Lumi 會揮手。","Lumi 會在海裡睡覺。","Lumi 會吃一條路。","Lumi 會跑進天空。"], words: ["Lumi","can","wave"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "The boat is small.", choices: ["The boat is small.","The boat is angry.","I do not like this port.","The port is under water."], choicesZh: ["這艘船很小。","船在生氣。","我不喜歡這個碼頭。","這個碼頭在水底下。"], words: ["the","boat","is","small"], reward: { coins: 100 } }
    ]
  },
  boutique: {
    theme: "dress boutique",
    title: "Help at the Dress Boutique",
    opening: "Rena has a new dress to show.",
    openingZh: "Rena 有一件新洋裝要展示。",
    ending: "The boutique sparkles.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the dress.", promptZh: "選出關於洋裝的句子。", answer: "I can see the dress.", choices: ["I can see the dress.","I can eat the dress.","The dress is under my shoe.","The dress can fly away."], choicesZh: ["我看得到洋裝。","我可以吃洋裝。","洋裝在我的鞋子底下。","洋裝會飛走。"], words: ["I","can","see","dress"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence for Rena.", promptZh: "選出給Rena的句子。", answer: "Rena has a dress.", choices: ["Rena has a dress.","Rena has a moon.","Rena is a boat.","Rena eats the castle."], choicesZh: ["Rena有一個洋裝。","Rena有一個月亮。","Rena是一艘船。","Rena把城堡吃掉。"], words: ["Rena","has","dress"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the boutique sentence.", promptZh: "選出關於服飾店的句子。", answer: "This boutique is pink.", choices: ["This boutique is pink.","This boutique is a fish.","My shoe is pink.","The cow reads here."], choicesZh: ["這個服飾店是粉紅色的。","這個服飾店是一條魚。","我的鞋子是粉紅色的。","牛在這裡讀書。"], words: ["this","boutique","pink"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do here.", promptZh: "選出 Lumi 在這裡會做的事。", answer: "Lumi can try.", choices: ["Lumi can try.","Lumi can sleep in the sea.","Lumi can eat a road.","Lumi can run into the sky."], choicesZh: ["Lumi 會試穿。","Lumi 會在海裡睡覺。","Lumi 會吃一條路。","Lumi 會跑進天空。"], words: ["Lumi","can","try"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "The dress is pretty.", choices: ["The dress is pretty.","The dress is angry.","I do not like this boutique.","The boutique is under water."], choicesZh: ["這件洋裝很漂亮。","洋裝在生氣。","我不喜歡這個服飾店。","這個服飾店在水底下。"], words: ["the","dress","is","pretty"], reward: { coins: 100 } }
    ]
  },
  hairSalon: {
    theme: "hair salon",
    title: "Help at the Hair Salon",
    opening: "Stylist Lina brushes soft story hair.",
    openingZh: "造型師 Lina 梳著柔軟的頭髮。",
    ending: "The salon mirror shines.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the brush.", promptZh: "選出關於梳子的句子。", answer: "I can see the brush.", choices: ["I can see the brush.","I can eat the brush.","The brush is under my shoe.","The brush can fly away."], choicesZh: ["我看得到梳子。","我可以吃梳子。","梳子在我的鞋子底下。","梳子會飛走。"], words: ["I","can","see","brush"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence for Lina.", promptZh: "選出給Lina的句子。", answer: "Lina has a brush.", choices: ["Lina has a brush.","Lina has a moon.","Lina is a boat.","Lina eats the castle."], choicesZh: ["Lina有一個梳子。","Lina有一個月亮。","Lina是一艘船。","Lina把城堡吃掉。"], words: ["Lina","has","brush"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the salon sentence.", promptZh: "選出關於沙龍的句子。", answer: "This salon is bright.", choices: ["This salon is bright.","This salon is a fish.","My shoe is bright.","The cow reads here."], choicesZh: ["這個沙龍是明亮的。","這個沙龍是一條魚。","我的鞋子是明亮的。","牛在這裡讀書。"], words: ["this","salon","bright"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do here.", promptZh: "選出 Lumi 在這裡會做的事。", answer: "Lumi can comb.", choices: ["Lumi can comb.","Lumi can sleep in the sea.","Lumi can eat a road.","Lumi can run into the sky."], choicesZh: ["Lumi 會梳頭髮。","Lumi 會在海裡睡覺。","Lumi 會吃一條路。","Lumi 會跑進天空。"], words: ["Lumi","can","comb"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "This hair is soft.", choices: ["This hair is soft.","The brush is angry.","I do not like this salon.","The salon is under water."], choicesZh: ["這頭髮很柔軟。","梳子在生氣。","我不喜歡這個沙龍。","這個沙龍在水底下。"], words: ["this","hair","is","soft"], reward: { coins: 100 } }
    ]
  },
  tailorStudio: {
    theme: "tailor studio",
    title: "Help at the Tailor Studio",
    opening: "Tailor Tess folds tops and skirts.",
    openingZh: "裁縫師 Tess 摺著上衣和裙子。",
    ending: "The studio shelves are neat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the shirt.", promptZh: "選出關於襯衫的句子。", answer: "I can see the shirt.", choices: ["I can see the shirt.","I can eat the shirt.","The shirt is under my shoe.","The shirt can fly away."], choicesZh: ["我看得到襯衫。","我可以吃襯衫。","襯衫在我的鞋子底下。","襯衫會飛走。"], words: ["I","can","see","shirt"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence for Tess.", promptZh: "選出給Tess的句子。", answer: "Tess has a shirt.", choices: ["Tess has a shirt.","Tess has a moon.","Tess is a boat.","Tess eats the castle."], choicesZh: ["Tess有一個襯衫。","Tess有一個月亮。","Tess是一艘船。","Tess把城堡吃掉。"], words: ["Tess","has","shirt"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the studio sentence.", promptZh: "選出關於工作室的句子。", answer: "This studio is neat.", choices: ["This studio is neat.","This studio is a fish.","My shoe is neat.","The cow reads here."], choicesZh: ["這個工作室是整齊的。","這個工作室是一條魚。","我的鞋子是整齊的。","牛在這裡讀書。"], words: ["this","studio","neat"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do here.", promptZh: "選出 Lumi 在這裡會做的事。", answer: "Lumi can fold.", choices: ["Lumi can fold.","Lumi can sleep in the sea.","Lumi can eat a road.","Lumi can run into the sky."], choicesZh: ["Lumi 會摺衣服。","Lumi 會在海裡睡覺。","Lumi 會吃一條路。","Lumi 會跑進天空。"], words: ["Lumi","can","fold"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "This shirt is clean.", choices: ["This shirt is clean.","The shirt is angry.","I do not like this studio.","The studio is under water."], choicesZh: ["這件襯衫很乾淨。","襯衫在生氣。","我不喜歡這個工作室。","這個工作室在水底下。"], words: ["this","shirt","is","clean"], reward: { coins: 100 } }
    ]
  },
  shoeShop: {
    theme: "shoe shop",
    title: "Help at the Shoe Shop",
    opening: "Mina is checking soft walking shoes.",
    openingZh: "Mina 正在檢查好走的鞋子。",
    ending: "The shoes are ready for a walk.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the shoe.", promptZh: "選出關於鞋子的句子。", answer: "I can see the shoe.", choices: ["I can see the shoe.","I can eat the shoe.","The shoe is under my shoe.","The shoe can fly away."], choicesZh: ["我看得到鞋子。","我可以吃鞋子。","鞋子在我的鞋子底下。","鞋子會飛走。"], words: ["I","can","see","shoe"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence for Mina.", promptZh: "選出給Mina的句子。", answer: "Mina has a shoe.", choices: ["Mina has a shoe.","Mina has a moon.","Mina is a boat.","Mina eats the castle."], choicesZh: ["Mina有一個鞋子。","Mina有一個月亮。","Mina是一艘船。","Mina把城堡吃掉。"], words: ["Mina","has","shoe"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the shop sentence.", promptZh: "選出關於商店的句子。", answer: "This shop is soft.", choices: ["This shop is soft.","This shop is a fish.","My shoe is soft.","The cow reads here."], choicesZh: ["這個商店是柔軟的。","這個商店是一條魚。","我的鞋子是柔軟的。","牛在這裡讀書。"], words: ["this","shop","soft"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do here.", promptZh: "選出 Lumi 在這裡會做的事。", answer: "Lumi can walk.", choices: ["Lumi can walk.","Lumi can sleep in the sea.","Lumi can eat a road.","Lumi can run into the sky."], choicesZh: ["Lumi 會走路。","Lumi 會在海裡睡覺。","Lumi 會吃一條路。","Lumi 會跑進天空。"], words: ["Lumi","can","walk"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "These shoes are soft.", choices: ["These shoes are soft.","The shoe is angry.","I do not like this shop.","The shop is under water."], choicesZh: ["這雙鞋子很柔軟。","鞋子在生氣。","我不喜歡這個商店。","這個商店在水底下。"], words: ["these","shoes","are","soft"], reward: { coins: 100 } }
    ]
  },
  accessoryShop: {
    theme: "accessory shop",
    title: "Help at the Accessory Shop",
    opening: "Lili has ribbons and crowns.",
    openingZh: "Lili 有緞帶和皇冠。",
    ending: "The tiny gifts are neat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the ribbon.", promptZh: "選出關於緞帶的句子。", answer: "I can see the ribbon.", choices: ["I can see the ribbon.","I can eat the ribbon.","The ribbon is under my shoe.","The ribbon can fly away."], choicesZh: ["我看得到緞帶。","我可以吃緞帶。","緞帶在我的鞋子底下。","緞帶會飛走。"], words: ["I","can","see","ribbon"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence for Lili.", promptZh: "選出給Lili的句子。", answer: "Lili has a ribbon.", choices: ["Lili has a ribbon.","Lili has a moon.","Lili is a boat.","Lili eats the castle."], choicesZh: ["Lili有一個緞帶。","Lili有一個月亮。","Lili是一艘船。","Lili把城堡吃掉。"], words: ["Lili","has","ribbon"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the shop sentence.", promptZh: "選出關於商店的句子。", answer: "This shop is red.", choices: ["This shop is red.","This shop is a fish.","My shoe is red.","The cow reads here."], choicesZh: ["這個商店是紅色的。","這個商店是一條魚。","我的鞋子是紅色的。","牛在這裡讀書。"], words: ["this","shop","red"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do here.", promptZh: "選出 Lumi 在這裡會做的事。", answer: "Lumi can pick.", choices: ["Lumi can pick.","Lumi can sleep in the sea.","Lumi can eat a road.","Lumi can run into the sky."], choicesZh: ["Lumi 會挑選。","Lumi 會在海裡睡覺。","Lumi 會吃一條路。","Lumi 會跑進天空。"], words: ["Lumi","can","pick"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "This ribbon is nice.", choices: ["This ribbon is nice.","The ribbon is angry.","I do not like this shop.","The shop is under water."], choicesZh: ["這條緞帶很好看。","緞帶在生氣。","我不喜歡這個商店。","這個商店在水底下。"], words: ["this","ribbon","is","nice"], reward: { coins: 100 } }
    ]
  },
  lighthouse: {
    theme: "lighthouse weather",
    title: "Help at the Lighthouse",
    opening: "Captain Sol looks at the sky and sea.",
    openingZh: "Sol 船長看著天空和海。",
    ending: "The light shines safely.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the light.", promptZh: "選出關於燈的句子。", answer: "I can see the light.", choices: ["I can see the light.","I can eat the light.","The light is under my shoe.","The light can fly away."], choicesZh: ["我看得到燈。","我可以吃燈。","燈在我的鞋子底下。","燈會飛走。"], words: ["I","can","see","light"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence for Sol.", promptZh: "選出給Sol的句子。", answer: "Sol has a light.", choices: ["Sol has a light.","Sol has a moon.","Sol is a boat.","Sol eats the castle."], choicesZh: ["Sol有一個燈。","Sol有一個月亮。","Sol是一艘船。","Sol把城堡吃掉。"], words: ["Sol","has","light"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the lighthouse sentence.", promptZh: "選出關於燈塔的句子。", answer: "This lighthouse is bright.", choices: ["This lighthouse is bright.","This lighthouse is a fish.","My shoe is bright.","The cow reads here."], choicesZh: ["這個燈塔是明亮的。","這個燈塔是一條魚。","我的鞋子是明亮的。","牛在這裡讀書。"], words: ["this","lighthouse","bright"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do here.", promptZh: "選出 Lumi 在這裡會做的事。", answer: "Lumi can check.", choices: ["Lumi can check.","Lumi can sleep in the sea.","Lumi can eat a road.","Lumi can run into the sky."], choicesZh: ["Lumi 會檢查。","Lumi 會在海裡睡覺。","Lumi 會吃一條路。","Lumi 會跑進天空。"], words: ["Lumi","can","check"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "It is sunny today.", choices: ["It is sunny today.","The light is angry.","I do not like this lighthouse.","The lighthouse is under water."], choicesZh: ["今天是晴天。","燈在生氣。","我不喜歡這個燈塔。","這個燈塔在水底下。"], words: ["it","is","sunny","today"], reward: { coins: 100 } }
    ]
  },
  schoolClassroom: {
    theme: "school classroom",
    title: "Help in the School Classroom",
    opening: "Teacher Bell points to the board.",
    openingZh: "Bell 老師指著黑板。",
    ending: "The class is ready to read.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the book.", promptZh: "選出關於書的句子。", answer: "I can see the book.", choices: ["I can see the book.","I can eat the book.","The book is under my shoe.","The book can fly away."], choicesZh: ["我看得到書。","我可以吃書。","書在我的鞋子底下。","書會飛走。"], words: ["I","can","see","book"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence for Bell.", promptZh: "選出給Bell的句子。", answer: "Bell has a book.", choices: ["Bell has a book.","Bell has a moon.","Bell is a boat.","Bell eats the castle."], choicesZh: ["Bell有一個書。","Bell有一個月亮。","Bell是一艘船。","Bell把城堡吃掉。"], words: ["Bell","has","book"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the classroom sentence.", promptZh: "選出關於教室的句子。", answer: "This classroom is happy.", choices: ["This classroom is happy.","This classroom is a fish.","My shoe is happy.","The cow reads here."], choicesZh: ["這個教室是開心的。","這個教室是一條魚。","我的鞋子是開心的。","牛在這裡讀書。"], words: ["this","classroom","happy"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do here.", promptZh: "選出 Lumi 在這裡會做的事。", answer: "Lumi can read.", choices: ["Lumi can read.","Lumi can sleep in the sea.","Lumi can eat a road.","Lumi can run into the sky."], choicesZh: ["Lumi 會看書。","Lumi 會在海裡睡覺。","Lumi 會吃一條路。","Lumi 會跑進天空。"], words: ["Lumi","can","read"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "Open your book.", choices: ["Open your book.","The book is angry.","I do not like this classroom.","The classroom is under water."], choicesZh: ["打開你的書。","書在生氣。","我不喜歡這個教室。","這個教室在水底下。"], words: ["open","your","book"], reward: { coins: 100 } }
    ]
  },
  library: {
    theme: "library reading",
    title: "Help in the Library",
    opening: "Librarian Nola has a quiet reading table.",
    openingZh: "圖書館員 Nola 有一張安靜的閱讀桌。",
    ending: "The books are in order.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the book.", promptZh: "選出關於書的句子。", answer: "I can see the book.", choices: ["I can see the book.","I can eat the book.","The book is under my shoe.","The book can fly away."], choicesZh: ["我看得到書。","我可以吃書。","書在我的鞋子底下。","書會飛走。"], words: ["I","can","see","book"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence for Nola.", promptZh: "選出給Nola的句子。", answer: "Nola has a book.", choices: ["Nola has a book.","Nola has a moon.","Nola is a boat.","Nola eats the castle."], choicesZh: ["Nola有一個書。","Nola有一個月亮。","Nola是一艘船。","Nola把城堡吃掉。"], words: ["Nola","has","book"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the library sentence.", promptZh: "選出關於圖書館的句子。", answer: "This library is quiet.", choices: ["This library is quiet.","This library is a fish.","My shoe is quiet.","The cow reads here."], choicesZh: ["這個圖書館是安靜的。","這個圖書館是一條魚。","我的鞋子是安靜的。","牛在這裡讀書。"], words: ["this","library","quiet"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do here.", promptZh: "選出 Lumi 在這裡會做的事。", answer: "Lumi can read.", choices: ["Lumi can read.","Lumi can sleep in the sea.","Lumi can eat a road.","Lumi can run into the sky."], choicesZh: ["Lumi 會看書。","Lumi 會在海裡睡覺。","Lumi 會吃一條路。","Lumi 會跑進天空。"], words: ["Lumi","can","read"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "Please read here.", choices: ["Please read here.","The book is angry.","I do not like this library.","The library is under water."], choicesZh: ["請在這裡看書。","書在生氣。","我不喜歡這個圖書館。","這個圖書館在水底下。"], words: ["please","read","here"], reward: { coins: 100 } }
    ]
  },
  temple: {
    theme: "gentle temple",
    title: "Help at the Temple",
    opening: "Sister Luma waters the temple flowers.",
    openingZh: "Luma 修女為神廟的花澆水。",
    ending: "The temple is calm.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the flower.", promptZh: "選出關於花的句子。", answer: "I can see the flower.", choices: ["I can see the flower.","I can eat the flower.","The flower is under my shoe.","The flower can fly away."], choicesZh: ["我看得到花。","我可以吃花。","花在我的鞋子底下。","花會飛走。"], words: ["I","can","see","flower"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence for Luma.", promptZh: "選出給Luma的句子。", answer: "Luma has a flower.", choices: ["Luma has a flower.","Luma has a moon.","Luma is a boat.","Luma eats the castle."], choicesZh: ["Luma有一個花。","Luma有一個月亮。","Luma是一艘船。","Luma把城堡吃掉。"], words: ["Luma","has","flower"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the temple sentence.", promptZh: "選出關於神廟的句子。", answer: "This temple is white.", choices: ["This temple is white.","This temple is a fish.","My shoe is white.","The cow reads here."], choicesZh: ["這個神廟是白色的。","這個神廟是一條魚。","我的鞋子是白色的。","牛在這裡讀書。"], words: ["this","temple","white"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do here.", promptZh: "選出 Lumi 在這裡會做的事。", answer: "Lumi can listen.", choices: ["Lumi can listen.","Lumi can sleep in the sea.","Lumi can eat a road.","Lumi can run into the sky."], choicesZh: ["Lumi 會聆聽。","Lumi 會在海裡睡覺。","Lumi 會吃一條路。","Lumi 會跑進天空。"], words: ["Lumi","can","listen"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "The flower is white.", choices: ["The flower is white.","The flower is angry.","I do not like this temple.","The temple is under water."], choicesZh: ["這朵花是白色的。","花在生氣。","我不喜歡這個神廟。","這個神廟在水底下。"], words: ["the","flower","is","white"], reward: { coins: 100 } }
    ]
  },
  administration: {
    theme: "town office",
    title: "Help at the Administration Building",
    opening: "Clerk Otto sorts the town notes.",
    openingZh: "Otto 職員整理城鎮的紙條。",
    ending: "The town notes are tidy.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the map.", promptZh: "選出關於地圖的句子。", answer: "I can see the map.", choices: ["I can see the map.","I can eat the map.","The map is under my shoe.","The map can fly away."], choicesZh: ["我看得到地圖。","我可以吃地圖。","地圖在我的鞋子底下。","地圖會飛走。"], words: ["I","can","see","map"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence for Otto.", promptZh: "選出給Otto的句子。", answer: "Otto has a map.", choices: ["Otto has a map.","Otto has a moon.","Otto is a boat.","Otto eats the castle."], choicesZh: ["Otto有一個地圖。","Otto有一個月亮。","Otto是一艘船。","Otto把城堡吃掉。"], words: ["Otto","has","map"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the office sentence.", promptZh: "選出關於辦公室的句子。", answer: "This office is neat.", choices: ["This office is neat.","This office is a fish.","My shoe is neat.","The cow reads here."], choicesZh: ["這個辦公室是整齊的。","這個辦公室是一條魚。","我的鞋子是整齊的。","牛在這裡讀書。"], words: ["this","office","neat"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do here.", promptZh: "選出 Lumi 在這裡會做的事。", answer: "Lumi can help.", choices: ["Lumi can help.","Lumi can sleep in the sea.","Lumi can eat a road.","Lumi can run into the sky."], choicesZh: ["Lumi 會幫忙。","Lumi 會在海裡睡覺。","Lumi 會吃一條路。","Lumi 會跑進天空。"], words: ["Lumi","can","help"], reward: { coins: 100 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "This map is for town.", choices: ["This map is for town.","The map is angry.","I do not like this office.","The office is under water."], choicesZh: ["這張地圖是給城鎮用的。","地圖在生氣。","我不喜歡這個辦公室。","這個辦公室在水底下。"], words: ["this","map","is","for","town"], reward: { coins: 100 } }
    ]
  },
});
//#endregion 場景自帶題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
export const urbanSceneConfigs = mergeLessons({
  luminaraCastle: { ...singleSceneArt("garden"), scene: "scene-luminara-castle", npcClass: "npc-garden", npc: "Gate Guard", travelAction: "World Map", travelLine: "The castle stair opens the kingdom world map." },
  garden: { ...singleSceneArt("garden"), scene: "scene-garden", npc: "Mira", npcImage: npcImage("mira"), npcNaturalHeightCm: 130, travelAction: "Visit", travelLine: "Mira is watching the roses and a shy garden cat." },
  schoolClassroom: { ...civicSceneArt("school-classroom"), scene: "scene-urban-school", npc: "Teacher Bell", npcImage: npcImage("teacher-bell"), npcNaturalHeightCm: 165, travelAction: "Visit", travelLine: "Teacher Bell has a short Starters sentence." },
  library: { ...civicSceneArt("library"), scene: "scene-urban-library", npc: "Librarian Nola", npcImage: npcImage("librarian-nola"), npcNaturalHeightCm: 162, travelAction: "Visit", travelLine: "Librarian Nola is ready for quiet reading." },
  temple: { ...civicSceneArt("temple"), scene: "scene-urban-temple", npc: "Sister Luma", npcImage: npcImage("sister-luma"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Sister Luma keeps the temple flowers bright." },
  administration: { ...civicSceneArt("administration"), scene: "scene-urban-administration", npc: "Clerk Otto", npcImage: npcImage("clerk-otto"), npcNaturalHeightCm: 172, travelAction: "Visit", travelLine: "Clerk Otto sorts the town notes." },
  market: { ...singleSceneArt("market"), scene: "scene-market", npc: "Auntie Pom", npcImage: npcImage("auntie-pom-market"), npcNaturalHeightCm: 155, travelAction: "Visit", travelLine: "Auntie Pom smiles beside warm bread and bright fruit." },
  harbor: { ...singleSceneArt("harbor"), scene: "scene-harbor", npc: "Nami", npcImage: npcImage("nami"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Nami is waiting by the bright harbor boats." },
  port: { ...singleSceneArt("harbor"), scene: "scene-port", npc: "Dock Guide", npcImage: npcImage("dock-guide"), npcNaturalHeightCm: 175, travelAction: "Visit", travelLine: "Boats arrive at the harbor port for sea trips and dock visits." },
  boutique: { ...urbanShopArt("dress-boutique"), scene: "scene-urban-dress-boutique", npc: "Rena", npcImage: npcImage("rena"), npcNaturalHeightCm: 165, travelAction: "Shop", travelLine: "Rena has dresses and complete outfit sets ready for a bright day.", shopGreeting: "Welcome to the Dress Boutique. Dresses and outfit sets are ready." },
  hairSalon: { ...urbanShopArt("hair-salon"), scene: "scene-urban-hair-salon", npc: "Stylist Lina", npcImage: npcImage("stylist-lina"), npcNaturalHeightCm: 162, travelAction: "Shop", travelLine: "Stylist Lina has soft story hairstyles for Lumi.", shopGreeting: "Welcome to the Hair Salon. Pick a hairstyle for Lumi." },
  tailorStudio: { ...urbanShopArt("tailor-studio"), scene: "scene-urban-tailor-studio", npc: "Tailor Tess", npcImage: npcImage("tailor-tess"), npcNaturalHeightCm: 160, travelAction: "Shop", travelLine: "Tailor Tess keeps tops and bottoms neatly folded.", shopGreeting: "Welcome to the Tailor Studio. Pick tops or bottoms." },
  shoeShop: { ...singleSceneArt("shoes", { tone: "shop" }), scene: "scene-shoes", npc: "Mina", npcImage: npcImage("mina"), npcNaturalHeightCm: 158, travelAction: "Shop", travelLine: "Mina has walking shoes for Lumi's next trip.", shopGreeting: "Hello, Princess. Try shoes for the road." },
  accessoryShop: { ...urbanShopArt("accessory-atelier"), scene: "scene-urban-accessory-atelier", npc: "Lili", npcImage: npcImage("lili"), npcNaturalHeightCm: 156, travelAction: "Shop", travelLine: "Lili has hats and accessories in separate trays.", shopGreeting: "Good day, Princess. Pick a hat or accessory." },
  lighthouse: { ...singleSceneArt("lighthouse"), scene: "scene-lighthouse", npc: "Captain Sol", npcImage: npcImage("captain-sol"), npcNaturalHeightCm: 178, travelAction: "Visit", travelLine: "Captain Sol checks the sea from the lighthouse." }
}, urbanLessonBank, { area: "urban", vocabProfile: urbanVocabularyProfile.id });
//#endregion 對話場景設定

