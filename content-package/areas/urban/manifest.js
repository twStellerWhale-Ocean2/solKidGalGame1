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

//#region 場景自帶題庫（issue #96 結構；issue #135 內容研改）
// urbanLessonBank：以 place 為鍵的「打工任務」題庫（答對得 coins＝勞動所得）。
// issue #135 句型分級：Cambridge Starters——現在簡單式／現在進行式（is/are + V-ing）／can／have got／
//   this·these／Wh- 問句（What·Where·How many）／祈使句／地方介系詞；單句為主、題材切合各場景主體。
// 生活化：選項皆為合理但情境不符的日常句（非超現實、非換名詞樣板）；部分場景結合 Starters 程度的點數計算。
const jobReward = { coins: 100 };
const urbanLessonBank = Object.freeze({
  garden: {
    theme: "garden helper",
    title: "Help in the Castle Garden",
    opening: "Mira needs a hand with the roses and the shy garden cat.",
    openingZh: "Mira 需要有人幫忙照顧玫瑰和那隻害羞的花園貓。",
    ending: "The garden looks fresh and tidy. Thank you!",
    questions: [
      { questionType: "sentence-choice", prompt: "Mira needs help. Pick the way to offer it.", promptZh: "Mira 需要幫忙。選出主動幫忙的說法。", answer: "Can I help you?", choices: ["Can I help you?","Where is my hat?","I am very tired.","This is not mine."], choicesZh: ["我可以幫你嗎？","我的帽子在哪裡？","我好累。","這個不是我的。"], words: ["can","I","help","you"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The cat is hiding under the roses. Pick that sentence.", promptZh: "貓躲在玫瑰底下。選出這個句子。", answer: "The cat is under the roses.", choices: ["The cat is under the roses.","The cat is on the wall.","The cat is in the box.","The cat is next to the gate."], choicesZh: ["貓在玫瑰底下。","貓在牆上。","貓在箱子裡。","貓在門旁邊。"], words: ["the","cat","under","roses"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Count the red roses: there are eight. Pick the sentence.", promptZh: "數一數紅玫瑰：有八朵。選出正確句子。", answer: "There are eight roses.", choices: ["There are eight roses.","There are eight cats.","There is one rose.","I like red roses."], choicesZh: ["有八朵玫瑰。","有八隻貓。","有一朵玫瑰。","我喜歡紅玫瑰。"], words: ["there","are","eight","roses"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Mira is watering the flowers now. Pick that sentence.", promptZh: "Mira 正在澆花。選出這個句子。", answer: "Mira is watering the flowers.", choices: ["Mira is watering the flowers.","Mira is reading a book.","Mira is washing the cups.","Mira is feeding the birds."], choicesZh: ["Mira 正在澆花。","Mira 正在看書。","Mira 正在洗杯子。","Mira 正在餵鳥。"], words: ["is","watering","the","flowers"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Pick the kind thing to say about her garden.", promptZh: "選出稱讚她花園的好聽話。", answer: "Your garden is beautiful.", choices: ["Your garden is beautiful.","Your garden is dirty.","I do not like flowers.","Give me the roses."], choicesZh: ["你的花園好美。","你的花園很髒。","我不喜歡花。","把玫瑰給我。"], words: ["your","garden","is","beautiful"], reward: jobReward }
    ]
  },
  market: {
    theme: "market stall",
    title: "Help at Market Square",
    opening: "Auntie Pom is busy. She needs help selling bread and fruit.",
    openingZh: "Pom 阿姨很忙，需要有人幫忙賣麵包和水果。",
    ending: "The stall is full and tidy. Great work!",
    questions: [
      { questionType: "sentence-choice", prompt: "A girl wants bread. Pick the polite shop question.", promptZh: "有個女孩想買麵包。選出有禮貌的詢問。", answer: "How many do you want?", choices: ["How many do you want?","Why are you here?","Where is your shoe?","Who is that man?"], choicesZh: ["你要幾個？","你為什麼在這裡？","你的鞋子在哪？","那個男人是誰？"], words: ["how","many","do","you","want"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are three apples and two pears. Pick the total.", promptZh: "有三顆蘋果和兩顆梨子。選出總數。", answer: "There are five fruits.", choices: ["There are five fruits.","There are six fruits.","There are two fruits.","There are five breads."], choicesZh: ["有五個水果。","有六個水果。","有兩個水果。","有五個麵包。"], words: ["there","are","five","fruits"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Pom is making warm bread. Pick that sentence.", promptZh: "Pom 正在做溫熱的麵包。選出這個句子。", answer: "Pom is making warm bread.", choices: ["Pom is making warm bread.","Pom is washing the floor.","Pom is selling old shoes.","Pom is reading a map."], choicesZh: ["Pom 正在做溫熱的麵包。","Pom 正在洗地板。","Pom 正在賣舊鞋子。","Pom 正在看地圖。"], words: ["is","making","warm","bread"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Tell the buyer the price. Pick the sentence.", promptZh: "告訴客人價格。選出正確句子。", answer: "It is ten coins.", choices: ["It is ten coins.","It is my cat.","It is on Monday.","It is raining now."], choicesZh: ["這個十枚金幣。","這是我的貓。","在星期一。","現在正在下雨。"], words: ["it","is","ten","coins"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Pick the friendly goodbye for a customer.", promptZh: "選出對客人友善的道別。", answer: "Thank you, come again!", choices: ["Thank you, come again!","Go away, please.","I am too busy.","That is wrong."], choicesZh: ["謝謝，歡迎再來！","請走開。","我太忙了。","那是錯的。"], words: ["thank","you","come","again"], reward: jobReward }
    ]
  },
  harbor: {
    theme: "fish shop work",
    title: "Help at the Fish Shop",
    opening: "Nami has fresh fish to sort and sell before dinner.",
    openingZh: "Nami 有新鮮的魚要在晚餐前分類和賣出。",
    ending: "The fish are sorted and ready. Well done!",
    questions: [
      { questionType: "sentence-choice", prompt: "Count the fish in the box: there are six. Pick the sentence.", promptZh: "數一數箱子裡的魚：有六條。選出正確句子。", answer: "There are six fish.", choices: ["There are six fish.","There are six boats.","There is one fish.","The fish is big."], choicesZh: ["有六條魚。","有六艘船。","有一條魚。","這條魚很大。"], words: ["there","are","six","fish"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Put the big fish on the ice. Pick the instruction.", promptZh: "把大魚放在冰上。選出這個指示。", answer: "Put the fish on the ice.", choices: ["Put the fish on the ice.","Put the fish in your bag.","Put the fish under the bed.","Put the fish on your head."], choicesZh: ["把魚放在冰上。","把魚放進你的袋子。","把魚放在床底下。","把魚放在你頭上。"], words: ["put","the","fish","on","ice"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A man asks for fish. Pick the polite answer.", promptZh: "有位男士想買魚。選出有禮貌的回答。", answer: "Here you are.", choices: ["Here you are.","No, never.","Go home now.","I am sleepy."], choicesZh: ["這給你。","不，絕不。","現在回家。","我想睡覺。"], words: ["here","you","are"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Nami is washing the fresh fish. Pick that sentence.", promptZh: "Nami 正在清洗新鮮的魚。選出這個句子。", answer: "Nami is washing the fish.", choices: ["Nami is washing the fish.","Nami is painting a wall.","Nami is flying a kite.","Nami is baking a cake."], choicesZh: ["Nami 正在清洗魚。","Nami 正在油漆牆壁。","Nami 正在放風箏。","Nami 正在烤蛋糕。"], words: ["is","washing","the","fish"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Tell the cook these fish are fresh. Pick the sentence.", promptZh: "告訴廚師這些魚很新鮮。選出正確句子。", answer: "These fish are fresh.", choices: ["These fish are fresh.","These fish are old.","These shoes are fresh.","This soup is hot."], choicesZh: ["這些魚很新鮮。","這些魚很舊。","這些鞋子很新鮮。","這碗湯很燙。"], words: ["these","fish","are","fresh"], reward: jobReward }
    ]
  },
  port: {
    theme: "harbor port work",
    title: "Help at Harbor Port",
    opening: "The Dock Guide needs help waving the little boats in safely.",
    openingZh: "碼頭嚮導需要有人幫忙指引小船安全進港。",
    ending: "Every boat is safe at the dock. Nice job!",
    questions: [
      { questionType: "sentence-choice", prompt: "Count the boats at the dock: there are four. Pick the sentence.", promptZh: "數一數碼頭邊的船：有四艘。選出正確句子。", answer: "There are four boats.", choices: ["There are four boats.","There are four fish.","There is one boat.","The boat is fast."], choicesZh: ["有四艘船。","有四條魚。","有一艘船。","這艘船很快。"], words: ["there","are","four","boats"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Show the captain where to stop. Pick the instruction.", promptZh: "告訴船長要停在哪裡。選出這個指示。", answer: "Stop here, please.", choices: ["Stop here, please.","Eat here, please.","Sleep here, please.","Sing here, please."], choicesZh: ["請停在這裡。","請在這裡吃。","請在這裡睡。","請在這裡唱歌。"], words: ["stop","here","please"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The Dock Guide is waving to a boat. Pick that sentence.", promptZh: "碼頭嚮導正在向一艘船揮手。選出這個句子。", answer: "He is waving to the boat.", choices: ["He is waving to the boat.","He is eating the boat.","He is reading a boat.","He is washing a boat."], choicesZh: ["他正在向船揮手。","他正在吃船。","他正在讀船。","他正在洗船。"], words: ["he","is","waving","boat"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Tell the sailor the sea is calm today. Pick the sentence.", promptZh: "告訴水手今天海面很平靜。選出正確句子。", answer: "The sea is calm today.", choices: ["The sea is calm today.","The sea is angry today.","The road is calm today.","The shop is calm today."], choicesZh: ["今天海面很平靜。","今天海很狂暴。","今天那條路很平靜。","今天那家店很平靜。"], words: ["the","sea","is","calm"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Pick the safe warning to shout at the dock.", promptZh: "選出在碼頭該喊的安全提醒。", answer: "Do not run here.", choices: ["Do not run here.","Do not read here.","Do not sing here.","Do not smile here."], choicesZh: ["不要在這裡奔跑。","不要在這裡看書。","不要在這裡唱歌。","不要在這裡微笑。"], words: ["do","not","run","here"], reward: jobReward }
    ]
  },
  boutique: {
    theme: "dress boutique work",
    title: "Help at the Dress Boutique",
    opening: "Rena needs help folding dresses and keeping the rail tidy.",
    openingZh: "Rena 需要有人幫忙摺洋裝、把衣架整理整齊。",
    ending: "The boutique is neat and bright. Lovely work!",
    questions: [
      { questionType: "sentence-choice", prompt: "Hang the pink dress on the rail. Pick the instruction.", promptZh: "把粉紅洋裝掛到衣架上。選出這個指示。", answer: "Hang the dress on the rail.", choices: ["Hang the dress on the rail.","Hang the dress in the sink.","Hang the dress on the cat.","Hang the dress under the bus."], choicesZh: ["把洋裝掛在衣架上。","把洋裝掛在水槽裡。","把洋裝掛在貓身上。","把洋裝掛在公車底下。"], words: ["hang","the","dress","on","rail"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Count the dresses on the rail: there are seven. Pick the sentence.", promptZh: "數一數衣架上的洋裝：有七件。選出正確句子。", answer: "There are seven dresses.", choices: ["There are seven dresses.","There are seven hats.","There is one dress.","The dress is long."], choicesZh: ["有七件洋裝。","有七頂帽子。","有一件洋裝。","這件洋裝很長。"], words: ["there","are","seven","dresses"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A girl likes a blue dress. Pick the helpful reply.", promptZh: "有個女孩喜歡一件藍洋裝。選出有幫助的回答。", answer: "You can try it on.", choices: ["You can try it on.","You can eat it now.","You can throw it away.","You can sleep on it."], choicesZh: ["你可以試穿看看。","你可以現在吃掉它。","你可以把它丟掉。","你可以睡在上面。"], words: ["you","can","try","it","on"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Rena is folding a soft dress. Pick that sentence.", promptZh: "Rena 正在摺一件柔軟的洋裝。選出這個句子。", answer: "Rena is folding a dress.", choices: ["Rena is folding a dress.","Rena is driving a bus.","Rena is feeding a fish.","Rena is digging a hole."], choicesZh: ["Rena 正在摺洋裝。","Rena 正在開公車。","Rena 正在餵魚。","Rena 正在挖洞。"], words: ["is","folding","a","dress"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Tell the customer this dress is pretty. Pick the sentence.", promptZh: "告訴客人這件洋裝很漂亮。選出正確句子。", answer: "This dress is very pretty.", choices: ["This dress is very pretty.","This dress is very wet.","This soup is very pretty.","This road is very pretty."], choicesZh: ["這件洋裝很漂亮。","這件洋裝很濕。","這碗湯很漂亮。","這條路很漂亮。"], words: ["this","dress","is","pretty"], reward: jobReward }
    ]
  },
  hairSalon: {
    theme: "hair salon work",
    title: "Help at the Hair Salon",
    opening: "Stylist Lina needs help passing brushes and tidying the mirror table.",
    openingZh: "造型師 Lina 需要有人幫忙遞梳子、整理鏡台。",
    ending: "The salon is clean and the mirror shines. Thank you!",
    questions: [
      { questionType: "sentence-choice", prompt: "Lina needs the brush. Pick the polite offer.", promptZh: "Lina 需要梳子。選出有禮貌的遞送說法。", answer: "Here is the brush.", choices: ["Here is the brush.","Here is the bus.","Here is the fish.","Here is the door."], choicesZh: ["梳子在這裡。","公車在這裡。","魚在這裡。","門在這裡。"], words: ["here","is","the","brush"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Lina is combing the girl's hair. Pick that sentence.", promptZh: "Lina 正在幫女孩梳頭髮。選出這個句子。", answer: "Lina is combing her hair.", choices: ["Lina is combing her hair.","Lina is cooking her hair.","Lina is reading her hair.","Lina is planting her hair."], choicesZh: ["Lina 正在梳她的頭髮。","Lina 正在煮她的頭髮。","Lina 正在讀她的頭髮。","Lina 正在種她的頭髮。"], words: ["is","combing","her","hair"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Count the clean brushes: there are five. Pick the sentence.", promptZh: "數一數乾淨的梳子：有五把。選出正確句子。", answer: "There are five brushes.", choices: ["There are five brushes.","There are five boats.","There is one brush.","The brush is pink."], choicesZh: ["有五把梳子。","有五艘船。","有一把梳子。","這把梳子是粉紅色的。"], words: ["there","are","five","brushes"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Ask the girl what she likes. Pick the question.", promptZh: "問女孩她喜歡什麼。選出這個問句。", answer: "What hair do you like?", choices: ["What hair do you like?","Where is my soup?","Who has my shoe?","Why is it raining?"], choicesZh: ["你喜歡什麼髮型？","我的湯在哪裡？","誰拿了我的鞋子？","為什麼在下雨？"], words: ["what","hair","do","you","like"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Tell her the hair looks soft now. Pick the sentence.", promptZh: "告訴她現在頭髮看起來很柔順。選出正確句子。", answer: "Your hair looks soft.", choices: ["Your hair looks soft.","Your hair looks wet.","Your shoe looks soft.","Your soup looks soft."], choicesZh: ["你的頭髮看起來很柔順。","你的頭髮看起來濕濕的。","你的鞋子看起來很柔軟。","你的湯看起來很柔軟。"], words: ["your","hair","looks","soft"], reward: jobReward }
    ]
  },
  tailorStudio: {
    theme: "tailor studio work",
    title: "Help at the Tailor Studio",
    opening: "Tailor Tess needs help folding tops and stacking them neatly.",
    openingZh: "裁縫師 Tess 需要有人幫忙摺上衣、整齊堆好。",
    ending: "The shelves are neat and the studio looks tidy. Good work!",
    questions: [
      { questionType: "sentence-choice", prompt: "Fold the shirt and put it on the shelf. Pick the instruction.", promptZh: "把襯衫摺好放到架上。選出這個指示。", answer: "Put the shirt on the shelf.", choices: ["Put the shirt on the shelf.","Put the shirt in the pond.","Put the shirt on the dog.","Put the shirt in the soup."], choicesZh: ["把襯衫放到架上。","把襯衫放進池塘。","把襯衫放在狗身上。","把襯衫放進湯裡。"], words: ["put","the","shirt","on","shelf"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Count the folded shirts: there are nine. Pick the sentence.", promptZh: "數一數摺好的襯衫：有九件。選出正確句子。", answer: "There are nine shirts.", choices: ["There are nine shirts.","There are nine fish.","There is one shirt.","The shirt is blue."], choicesZh: ["有九件襯衫。","有九條魚。","有一件襯衫。","這件襯衫是藍色的。"], words: ["there","are","nine","shirts"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Tess is sewing a small button. Pick that sentence.", promptZh: "Tess 正在縫一顆小鈕扣。選出這個句子。", answer: "Tess is sewing a button.", choices: ["Tess is sewing a button.","Tess is eating a button.","Tess is driving a button.","Tess is reading a button."], choicesZh: ["Tess 正在縫鈕扣。","Tess 正在吃鈕扣。","Tess 正在駕駛鈕扣。","Tess 正在讀鈕扣。"], words: ["is","sewing","a","button"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Ask which shirt is clean. Pick the question.", promptZh: "詢問哪一件襯衫是乾淨的。選出這個問句。", answer: "Which shirt is clean?", choices: ["Which shirt is clean?","Which fish is happy?","Which road is hungry?","Which cup is tall?"], choicesZh: ["哪一件襯衫是乾淨的？","哪一條魚是開心的？","哪一條路是餓的？","哪一個杯子是高的？"], words: ["which","shirt","is","clean"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Tell Tess the shelf is tidy now. Pick the sentence.", promptZh: "告訴 Tess 架子現在很整齊。選出正確句子。", answer: "The shelf is tidy now.", choices: ["The shelf is tidy now.","The shelf is hungry now.","The fish is tidy now.","The rain is tidy now."], choicesZh: ["架子現在很整齊。","架子現在餓了。","魚現在很整齊。","雨現在很整齊。"], words: ["the","shelf","is","tidy"], reward: jobReward }
    ]
  },
  shoeShop: {
    theme: "shoe shop work",
    title: "Help at the Shoe Shop",
    opening: "Mina needs help pairing shoes and lining them up neatly.",
    openingZh: "Mina 需要有人幫忙把鞋子配對、排整齊。",
    ending: "Every pair is matched and ready. Well done!",
    questions: [
      { questionType: "sentence-choice", prompt: "One pair has two shoes. Pick the sentence.", promptZh: "一雙鞋有兩隻。選出正確句子。", answer: "A pair has two shoes.", choices: ["A pair has two shoes.","A pair has ten shoes.","A pair has two boats.","A pair has one shoe."], choicesZh: ["一雙有兩隻鞋子。","一雙有十隻鞋子。","一雙有兩艘船。","一雙有一隻鞋子。"], words: ["a","pair","two","shoes"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Put the red shoes by the door. Pick the instruction.", promptZh: "把紅鞋子放在門邊。選出這個指示。", answer: "Put the shoes by the door.", choices: ["Put the shoes by the door.","Put the shoes in the cake.","Put the shoes on the fish.","Put the shoes under the rain."], choicesZh: ["把鞋子放在門邊。","把鞋子放進蛋糕裡。","把鞋子放在魚上。","把鞋子放在雨底下。"], words: ["put","the","shoes","by","door"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A boy needs bigger shoes. Pick the helpful reply.", promptZh: "有個男孩需要大一點的鞋子。選出有幫助的回答。", answer: "Try these bigger shoes.", choices: ["Try these bigger shoes.","Eat these bigger shoes.","Throw these bigger shoes.","Read these bigger shoes."], choicesZh: ["試試這雙大一點的鞋子。","吃掉這雙大一點的鞋子。","把這雙大一點的鞋子丟掉。","讀這雙大一點的鞋子。"], words: ["try","these","bigger","shoes"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Mina is cleaning a brown shoe. Pick that sentence.", promptZh: "Mina 正在清潔一隻棕色鞋子。選出這個句子。", answer: "Mina is cleaning a shoe.", choices: ["Mina is cleaning a shoe.","Mina is cooking a shoe.","Mina is planting a shoe.","Mina is singing a shoe."], choicesZh: ["Mina 正在清潔鞋子。","Mina 正在煮鞋子。","Mina 正在種鞋子。","Mina 正在唱鞋子。"], words: ["is","cleaning","a","shoe"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Ask how many pairs are left. Pick the question.", promptZh: "詢問還剩幾雙。選出這個問句。", answer: "How many pairs are left?", choices: ["How many pairs are left?","How many cats can fly?","How many roads are wet?","How many cups are sad?"], choicesZh: ["還剩幾雙？","有幾隻貓會飛？","有幾條路是濕的？","有幾個杯子是傷心的？"], words: ["how","many","pairs","left"], reward: jobReward }
    ]
  },
  accessoryShop: {
    theme: "accessory atelier work",
    title: "Help at the Accessory Atelier",
    opening: "Lili needs help sorting ribbons and small crowns by colour.",
    openingZh: "Lili 需要有人幫忙把緞帶和小皇冠按顏色分類。",
    ending: "Every tray is sorted by colour. Beautiful work!",
    questions: [
      { questionType: "sentence-choice", prompt: "Put the red ribbons in one tray. Pick the instruction.", promptZh: "把紅緞帶放進同一個盤子。選出這個指示。", answer: "Put the red ribbons together.", choices: ["Put the red ribbons together.","Put the red ribbons in the soup.","Put the red ribbons on the bus.","Put the red ribbons under water."], choicesZh: ["把紅緞帶放在一起。","把紅緞帶放進湯裡。","把紅緞帶放在公車上。","把紅緞帶放到水底下。"], words: ["put","red","ribbons","together"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Count the small crowns: there are three. Pick the sentence.", promptZh: "數一數小皇冠：有三頂。選出正確句子。", answer: "There are three crowns.", choices: ["There are three crowns.","There are three fish.","There is one crown.","The crown is gold."], choicesZh: ["有三頂皇冠。","有三條魚。","有一頂皇冠。","這頂皇冠是金色的。"], words: ["there","are","three","crowns"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Lili is tying a pretty ribbon. Pick that sentence.", promptZh: "Lili 正在綁一條漂亮的緞帶。選出這個句子。", answer: "Lili is tying a ribbon.", choices: ["Lili is tying a ribbon.","Lili is eating a ribbon.","Lili is driving a ribbon.","Lili is washing a ribbon."], choicesZh: ["Lili 正在綁緞帶。","Lili 正在吃緞帶。","Lili 正在駕駛緞帶。","Lili 正在洗緞帶。"], words: ["is","tying","a","ribbon"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Ask the girl which colour she wants. Pick the question.", promptZh: "問女孩她想要哪個顏色。選出這個問句。", answer: "Which colour do you want?", choices: ["Which colour do you want?","Which colour can swim?","Which colour is hungry?","Which colour is asleep?"], choicesZh: ["你想要哪個顏色？","哪個顏色會游泳？","哪個顏色餓了？","哪個顏色睡著了？"], words: ["which","colour","you","want"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Tell her this ribbon is pretty. Pick the sentence.", promptZh: "告訴她這條緞帶很好看。選出正確句子。", answer: "This ribbon is pretty.", choices: ["This ribbon is pretty.","This ribbon is angry.","This shoe is pretty.","This rain is pretty."], choicesZh: ["這條緞帶很好看。","這條緞帶在生氣。","這隻鞋子很好看。","這場雨很好看。"], words: ["this","ribbon","is","pretty"], reward: jobReward }
    ]
  },
  lighthouse: {
    theme: "lighthouse work",
    title: "Help at the Lighthouse",
    opening: "Captain Sol needs help checking the sky and the big light before night.",
    openingZh: "Sol 船長需要有人幫忙在入夜前檢查天空和大燈。",
    ending: "The light is on and the ships are safe. Great job!",
    questions: [
      { questionType: "sentence-choice", prompt: "It is dark. Pick the right instruction for the light.", promptZh: "天黑了。選出對燈正確的指示。", answer: "Turn on the light.", choices: ["Turn on the light.","Turn on the soup.","Turn on the shoe.","Turn on the rain."], choicesZh: ["把燈打開。","把湯打開。","把鞋子打開。","把雨打開。"], words: ["turn","on","the","light"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Look at the sky and tell Sol. Pick the weather sentence.", promptZh: "看看天空再告訴 Sol。選出天氣句子。", answer: "It is windy tonight.", choices: ["It is windy tonight.","It is windy in my bag.","The fish is windy tonight.","The chair is windy tonight."], choicesZh: ["今晚風很大。","我的袋子裡風很大。","這條魚今晚風很大。","這張椅子今晚風很大。"], words: ["it","is","windy","tonight"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Count the ships on the sea: there are two. Pick the sentence.", promptZh: "數一數海上的船：有兩艘。選出正確句子。", answer: "There are two ships.", choices: ["There are two ships.","There are two cakes.","There is one ship.","The ship is white."], choicesZh: ["有兩艘船。","有兩個蛋糕。","有一艘船。","這艘船是白色的。"], words: ["there","are","two","ships"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Sol is watching the dark sea. Pick that sentence.", promptZh: "Sol 正在守望黑暗的海面。選出這個句子。", answer: "Sol is watching the sea.", choices: ["Sol is watching the sea.","Sol is eating the sea.","Sol is reading the sea.","Sol is planting the sea."], choicesZh: ["Sol 正在守望海面。","Sol 正在吃海。","Sol 正在讀海。","Sol 正在種海。"], words: ["is","watching","the","sea"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Tell the ships it is safe now. Pick the sentence.", promptZh: "告訴船隻現在安全了。選出正確句子。", answer: "It is safe now.", choices: ["It is safe now.","It is angry now.","The soup is safe now.","The hat is safe now."], choicesZh: ["現在安全了。","現在在生氣。","湯現在安全了。","帽子現在安全了。"], words: ["it","is","safe","now"], reward: jobReward }
    ]
  },
  schoolClassroom: {
    theme: "classroom helper",
    title: "Help in the School Classroom",
    opening: "Teacher Bell needs a helper to hand out books and count the class.",
    openingZh: "Bell 老師需要小幫手發書和數人數。",
    ending: "The class is ready to read. Thank you, helper!",
    questions: [
      { questionType: "sentence-choice", prompt: "Give one book to each child. Pick the instruction.", promptZh: "每個小朋友發一本書。選出這個指示。", answer: "Give each child a book.", choices: ["Give each child a book.","Give each child a fish.","Give each child a boat.","Give each child a shoe."], choicesZh: ["每個小朋友發一本書。","每個小朋友發一條魚。","每個小朋友發一艘船。","每個小朋友發一隻鞋子。"], words: ["give","each","child","book"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Count the children: there are ten. Pick the sentence.", promptZh: "數一數小朋友：有十個。選出正確句子。", answer: "There are ten children.", choices: ["There are ten children.","There are ten desks.","There is one child.","The child is tall."], choicesZh: ["有十個小朋友。","有十張桌子。","有一個小朋友。","這個小朋友很高。"], words: ["there","are","ten","children"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The class is quiet. Pick the polite classroom rule.", promptZh: "教室要安靜。選出有禮貌的教室規則。", answer: "Please be quiet.", choices: ["Please be quiet.","Please be a fish.","Please be a road.","Please be the rain."], choicesZh: ["請保持安靜。","請當一條魚。","請當一條路。","請當那場雨。"], words: ["please","be","quiet"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Bell is writing on the board. Pick that sentence.", promptZh: "Bell 正在黑板上寫字。選出這個句子。", answer: "Bell is writing on the board.", choices: ["Bell is writing on the board.","Bell is eating the board.","Bell is washing the board.","Bell is driving the board."], choicesZh: ["Bell 正在黑板上寫字。","Bell 正在吃黑板。","Bell 正在洗黑板。","Bell 正在駕駛黑板。"], words: ["is","writing","on","board"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Two children sit. Three more sit. Pick the total.", promptZh: "兩個小朋友坐下，又有三個坐下。選出總數。", answer: "Five children sit down.", choices: ["Five children sit down.","Six children sit down.","Two children sit down.","Five books sit down."], choicesZh: ["五個小朋友坐下。","六個小朋友坐下。","兩個小朋友坐下。","五本書坐下。"], words: ["five","children","sit","down"], reward: jobReward }
    ]
  },
  library: {
    theme: "library helper",
    title: "Help in the Library",
    opening: "Librarian Nola needs help shelving books and keeping the room quiet.",
    openingZh: "圖書館員 Nola 需要有人幫忙把書上架、保持安靜。",
    ending: "Every book is back in order. Well done!",
    questions: [
      { questionType: "sentence-choice", prompt: "Put the book back on the shelf. Pick the instruction.", promptZh: "把書放回架上。選出這個指示。", answer: "Put the book on the shelf.", choices: ["Put the book on the shelf.","Put the book in the pond.","Put the book on the cat.","Put the book under the bus."], choicesZh: ["把書放到架上。","把書放進池塘。","把書放在貓身上。","把書放在公車底下。"], words: ["put","the","book","on","shelf"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "A child is loud. Pick the polite library reminder.", promptZh: "有個小朋友很吵。選出有禮貌的圖書館提醒。", answer: "Please speak softly.", choices: ["Please speak softly.","Please run faster.","Please shout louder.","Please throw the book."], choicesZh: ["請小聲說話。","請跑快一點。","請喊大聲一點。","請把書丟出去。"], words: ["please","speak","softly"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Count the books on the cart: there are six. Pick the sentence.", promptZh: "數一數推車上的書：有六本。選出正確句子。", answer: "There are six books.", choices: ["There are six books.","There are six fish.","There is one book.","The book is heavy."], choicesZh: ["有六本書。","有六條魚。","有一本書。","這本書很重。"], words: ["there","are","six","books"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Nola is reading to the children. Pick that sentence.", promptZh: "Nola 正在念書給小朋友聽。選出這個句子。", answer: "Nola is reading to the children.", choices: ["Nola is reading to the children.","Nola is cooking the children.","Nola is washing the children.","Nola is driving the children."], choicesZh: ["Nola 正在念書給小朋友聽。","Nola 正在煮小朋友。","Nola 正在洗小朋友。","Nola 正在載小朋友。"], words: ["is","reading","to","children"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Ask where the story books are. Pick the question.", promptZh: "詢問故事書在哪裡。選出這個問句。", answer: "Where are the story books?", choices: ["Where are the story books?","Where are the swimming fish?","Where are the flying roads?","Where are the singing cups?"], choicesZh: ["故事書在哪裡？","會游泳的魚在哪裡？","會飛的路在哪裡？","會唱歌的杯子在哪裡？"], words: ["where","are","story","books"], reward: jobReward }
    ]
  },
  temple: {
    theme: "temple helper",
    title: "Help at the Temple",
    opening: "Sister Luma needs help watering flowers and lighting the calm candles.",
    openingZh: "Luma 修女需要有人幫忙澆花和點亮安靜的蠟燭。",
    ending: "The temple is calm and bright. Thank you!",
    questions: [
      { questionType: "sentence-choice", prompt: "Give the white flowers some water. Pick the instruction.", promptZh: "幫白花澆一點水。選出這個指示。", answer: "Water the white flowers.", choices: ["Water the white flowers.","Eat the white flowers.","Drive the white flowers.","Throw the white flowers."], choicesZh: ["幫白花澆水。","吃掉白花。","駕駛白花。","把白花丟掉。"], words: ["water","the","white","flowers"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Count the candles: there are four. Pick the sentence.", promptZh: "數一數蠟燭：有四根。選出正確句子。", answer: "There are four candles.", choices: ["There are four candles.","There are four boats.","There is one candle.","The candle is warm."], choicesZh: ["有四根蠟燭。","有四艘船。","有一根蠟燭。","這根蠟燭很溫暖。"], words: ["there","are","four","candles"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Luma is lighting a small candle. Pick that sentence.", promptZh: "Luma 正在點一根小蠟燭。選出這個句子。", answer: "Luma is lighting a candle.", choices: ["Luma is lighting a candle.","Luma is eating a candle.","Luma is driving a candle.","Luma is washing a candle."], choicesZh: ["Luma 正在點蠟燭。","Luma 正在吃蠟燭。","Luma 正在駕駛蠟燭。","Luma 正在洗蠟燭。"], words: ["is","lighting","a","candle"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The temple should be calm. Pick the gentle reminder.", promptZh: "神廟要保持安靜。選出溫柔的提醒。", answer: "Let us be calm here.", choices: ["Let us be calm here.","Let us run here.","Let us shout here.","Let us jump here."], choicesZh: ["我們在這裡保持安靜吧。","我們在這裡奔跑吧。","我們在這裡大喊吧。","我們在這裡跳吧。"], words: ["let","us","be","calm"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Tell Luma the flowers smell sweet. Pick the sentence.", promptZh: "告訴 Luma 花聞起來很香。選出正確句子。", answer: "The flowers smell sweet.", choices: ["The flowers smell sweet.","The flowers smell angry.","The shoes smell sweet.","The roads smell sweet."], choicesZh: ["花聞起來很香。","花聞起來在生氣。","鞋子聞起來很香。","路聞起來很香。"], words: ["the","flowers","smell","sweet"], reward: jobReward }
    ]
  },
  administration: {
    theme: "town office helper",
    title: "Help at the Administration Building",
    opening: "Clerk Otto needs help sorting town notes and counting the stamps.",
    openingZh: "Otto 職員需要有人幫忙整理城鎮的紙條、數印章。",
    ending: "The notes are sorted and the desk is tidy. Good work!",
    questions: [
      { questionType: "sentence-choice", prompt: "Put the notes in the box. Pick the instruction.", promptZh: "把紙條放進盒子裡。選出這個指示。", answer: "Put the notes in the box.", choices: ["Put the notes in the box.","Put the notes in the soup.","Put the notes on the cat.","Put the notes under the sea."], choicesZh: ["把紙條放進盒子裡。","把紙條放進湯裡。","把紙條放在貓身上。","把紙條放到海底。"], words: ["put","the","notes","in","box"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Count the stamps: there are seven. Pick the sentence.", promptZh: "數一數印章：有七個。選出正確句子。", answer: "There are seven stamps.", choices: ["There are seven stamps.","There are seven fish.","There is one stamp.","The stamp is red."], choicesZh: ["有七個印章。","有七條魚。","有一個印章。","這個印章是紅色的。"], words: ["there","are","seven","stamps"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Otto is reading a long map. Pick that sentence.", promptZh: "Otto 正在看一張長長的地圖。選出這個句子。", answer: "Otto is reading a map.", choices: ["Otto is reading a map.","Otto is eating a map.","Otto is washing a map.","Otto is planting a map."], choicesZh: ["Otto 正在看地圖。","Otto 正在吃地圖。","Otto 正在洗地圖。","Otto 正在種地圖。"], words: ["is","reading","a","map"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Ask Otto where the town map is. Pick the question.", promptZh: "問 Otto 城鎮地圖在哪裡。選出這個問句。", answer: "Where is the town map?", choices: ["Where is the town map?","Where is the flying fish?","Where is the singing road?","Where is the sleeping soup?"], choicesZh: ["城鎮地圖在哪裡？","會飛的魚在哪裡？","會唱歌的路在哪裡？","睡著的湯在哪裡？"], words: ["where","is","town","map"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Tell Otto the desk is tidy now. Pick the sentence.", promptZh: "告訴 Otto 桌子現在很整齊。選出正確句子。", answer: "The desk is tidy now.", choices: ["The desk is tidy now.","The desk is hungry now.","The fish is tidy now.","The rain is tidy now."], choicesZh: ["桌子現在很整齊。","桌子現在餓了。","魚現在很整齊。","雨現在很整齊。"], words: ["the","desk","is","tidy"], reward: jobReward }
    ]
  }
});
//#endregion 場景自帶題庫

//#region 生活聊天題庫（issue #135 spec#11）
// urbanChatLessonBank：各 NPC 場景的「生活聊天」題組——貼近生活的寒暄、感受、問句與禮貌用語（Starters 程度）。
// 與打工題庫分開：答對提升心情並在護眼上限內延長可玩時間、不發 coins（chatReward.coins=0 僅為結構一致）。
// 干擾項為合理但情境不符的日常句（非超現實），由 mergeLessons 以 chatLesson 鍵併入對應場景。
const chatReward = { coins: 0 };
const urbanChatLessonBank = Object.freeze({
  garden: {
    theme: "chatting in the garden",
    title: "Chat in the Castle Garden",
    opening: "Mira smiles by the roses and says hello.",
    openingZh: "Mira 在玫瑰旁微笑著向你打招呼。",
    ending: "Mira is happy you stopped to chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly hello for Mira.", promptZh: "選出對 Mira 親切的招呼。", answer: "Hello, how are you?", choices: ["Hello, how are you?","Go away, please.","Where is my bus?","Stop talking now."], choicesZh: ["你好，你好嗎？","請走開。","我的公車在哪？","現在別說了。"], words: ["hello","how","are","you"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Mira asks what you like. Pick a kind answer.", promptZh: "Mira 問你喜歡什麼。選出親切的回答。", answer: "I like the pink roses.", choices: ["I like the pink roses.","I do not care.","Give me your hat.","No, not you."], choicesZh: ["我喜歡粉紅玫瑰。","我不在乎。","把你的帽子給我。","不，不是你。"], words: ["I","like","pink","roses"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the nice goodbye for Mira.", promptZh: "選出對 Mira 友善的道別。", answer: "See you tomorrow!", choices: ["See you tomorrow!","Be quiet now.","Go home fast.","That is wrong."], choicesZh: ["明天見！","現在安靜。","快回家。","那是錯的。"], words: ["see","you","tomorrow"], reward: chatReward }
    ]
  },
  schoolClassroom: {
    theme: "chatting with the teacher",
    title: "Chat in the School Classroom",
    opening: "Teacher Bell waves you to her desk for a chat.",
    openingZh: "Bell 老師招手請你到她桌邊聊聊。",
    ending: "Teacher Bell is glad you talked with her.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the polite morning greeting for your teacher.", promptZh: "選出對老師有禮貌的早晨問候。", answer: "Good morning, Teacher.", choices: ["Good morning, Teacher.","Be quiet, Teacher.","Go away, Teacher.","Not now, Teacher."], choicesZh: ["老師早安。","老師安靜。","老師走開。","老師現在不行。"], words: ["good","morning","teacher"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Bell asks how you feel. Pick a friendly answer.", promptZh: "Bell 問你心情如何。選出友善的回答。", answer: "I am happy today.", choices: ["I am happy today.","I am a big bus.","No, you are not.","Stop right now."], choicesZh: ["我今天很開心。","我是一台大公車。","不，你才不是。","現在停下。"], words: ["I","am","happy","today"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the polite way to ask for help.", promptZh: "選出有禮貌的求助說法。", answer: "Can you help me, please?", choices: ["Can you help me, please?","Give it to me now.","I do not like you.","Go away from me."], choicesZh: ["可以請你幫我嗎？","現在把它給我。","我不喜歡你。","離我遠一點。"], words: ["can","you","help","me"], reward: chatReward }
    ]
  },
  library: {
    theme: "chatting with the librarian",
    title: "Chat in the Library",
    opening: "Librarian Nola whispers a quiet hello.",
    openingZh: "圖書館員 Nola 輕聲向你問好。",
    ending: "Nola smiles. What a nice quiet chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the quiet, polite hello for the library.", promptZh: "選出在圖書館安靜又有禮貌的招呼。", answer: "Hello, Nola.", choices: ["Hello, Nola.","Run, Nola!","Shout, Nola!","No, Nola."], choicesZh: ["你好，Nola。","快跑，Nola！","大喊，Nola！","不要，Nola。"], words: ["hello","nola"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Nola asks what you like to read. Pick a kind answer.", promptZh: "Nola 問你喜歡讀什麼。選出親切的回答。", answer: "I like story books.", choices: ["I like story books.","I like to shout.","I do not care.","Give me your pen."], choicesZh: ["我喜歡故事書。","我喜歡大喊。","我不在乎。","把你的筆給我。"], words: ["I","like","story","books"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the polite thank-you for Nola.", promptZh: "選出對 Nola 有禮貌的道謝。", answer: "Thank you very much.", choices: ["Thank you very much.","No, not you.","Stop it now.","Give me more."], choicesZh: ["非常謝謝你。","不，不是你。","現在停下。","再給我一些。"], words: ["thank","you","very","much"], reward: chatReward }
    ]
  },
  temple: {
    theme: "chatting at the temple",
    title: "Chat at the Temple",
    opening: "Sister Luma greets you gently by the flowers.",
    openingZh: "Luma 修女在花旁溫柔地問候你。",
    ending: "Sister Luma is happy you visited.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the gentle hello for Sister Luma.", promptZh: "選出對 Luma 修女溫柔的招呼。", answer: "Good day, Sister Luma.", choices: ["Good day, Sister Luma.","Move away, Luma.","Be loud, Luma.","Not now, Luma."], choicesZh: ["午安，Luma 修女。","讓開，Luma。","大聲點，Luma。","現在不行，Luma。"], words: ["good","day","sister"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Luma asks how you feel. Pick a calm answer.", promptZh: "Luma 問你的感受。選出平靜的回答。", answer: "I feel calm here.", choices: ["I feel calm here.","I feel like a bus.","No, you do not.","Go away please."], choicesZh: ["我在這裡覺得很平靜。","我覺得自己像公車。","不，你才不是。","請走開。"], words: ["I","feel","calm","here"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind thing to say about the flowers.", promptZh: "選出稱讚花的好聽話。", answer: "The flowers are lovely.", choices: ["The flowers are lovely.","The flowers are silly.","I do not like them.","Throw them away."], choicesZh: ["這些花好可愛。","這些花很笨。","我不喜歡它們。","把它們丟掉。"], words: ["the","flowers","are","lovely"], reward: chatReward }
    ]
  },
  administration: {
    theme: "chatting at the town office",
    title: "Chat at the Administration Building",
    opening: "Clerk Otto looks up from his notes and smiles.",
    openingZh: "Otto 職員從紙堆中抬起頭微笑。",
    ending: "Clerk Otto enjoyed the friendly chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the polite hello for Clerk Otto.", promptZh: "選出對 Otto 職員有禮貌的招呼。", answer: "Hello, nice to meet you.", choices: ["Hello, nice to meet you.","Give me your desk.","Go away, Otto.","Be quiet, Otto."], choicesZh: ["你好，很高興認識你。","把你的桌子給我。","走開，Otto。","安靜，Otto。"], words: ["nice","to","meet","you"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Otto asks if you are busy. Pick a friendly answer.", promptZh: "Otto 問你忙不忙。選出友善的回答。", answer: "No, I am free now.", choices: ["No, I am free now.","No, I am a map.","Stop talking now.","Go home, Otto."], choicesZh: ["不，我現在有空。","不，我是一張地圖。","現在別說了。","回家吧，Otto。"], words: ["I","am","free","now"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind goodbye for Otto.", promptZh: "選出對 Otto 友善的道別。", answer: "Have a good day!", choices: ["Have a good day!","Have my shoe!","Go away fast!","That is wrong!"], choicesZh: ["祝你有美好的一天！","拿走我的鞋子！","快走開！","那是錯的！"], words: ["have","a","good","day"], reward: chatReward }
    ]
  },
  market: {
    theme: "chatting at the market",
    title: "Chat at Market Square",
    opening: "Auntie Pom waves hello beside the warm bread.",
    openingZh: "Pom 阿姨在溫熱的麵包旁向你揮手問好。",
    ending: "Auntie Pom laughs. What a friendly chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the warm hello for Auntie Pom.", promptZh: "選出對 Pom 阿姨溫暖的招呼。", answer: "Hello, Auntie Pom!", choices: ["Hello, Auntie Pom!","Go away, Pom!","Where is my fish?","Stop it, Pom!"], choicesZh: ["你好，Pom 阿姨！","走開，Pom！","我的魚在哪？","住手，Pom！"], words: ["hello","auntie","pom"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pom asks if you are hungry. Pick a friendly answer.", promptZh: "Pom 問你餓不餓。選出友善的回答。", answer: "Yes, a little.", choices: ["Yes, a little.","Yes, I am a boat.","No, go away.","Give me ten now."], choicesZh: ["對，有一點。","對，我是一艘船。","不，走開。","現在給我十個。"], words: ["yes","a","little"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the polite thank-you for the bread.", promptZh: "選出對麵包有禮貌的道謝。", answer: "Thank you, it smells good.", choices: ["Thank you, it smells good.","No, it is bad.","Give me more now.","I do not like it."], choicesZh: ["謝謝，它聞起來很香。","不，它很糟。","現在再給我一些。","我不喜歡它。"], words: ["thank","you","smells","good"], reward: chatReward }
    ]
  },
  harbor: {
    theme: "chatting at the fish shop",
    title: "Chat at the Fish Shop",
    opening: "Nami smiles by the bright water and says hi.",
    openingZh: "Nami 在明亮的水邊微笑著打招呼。",
    ending: "Nami is glad you stopped for a chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly hello for Nami.", promptZh: "選出對 Nami 親切的招呼。", answer: "Hi, Nami!", choices: ["Hi, Nami!","Go away, Nami!","Where is my boat?","Be quiet, Nami!"], choicesZh: ["嗨，Nami！","走開，Nami！","我的船在哪？","安靜，Nami！"], words: ["hi","nami"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Nami asks how your day is. Pick a kind answer.", promptZh: "Nami 問你今天好嗎。選出親切的回答。", answer: "It is a good day.", choices: ["It is a good day.","It is a big fish.","No, you are not.","Go home now."], choicesZh: ["今天是美好的一天。","它是一條大魚。","不，你才不是。","現在回家。"], words: ["it","is","good","day"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind thing to say to Nami.", promptZh: "選出對 Nami 好聽的話。", answer: "Your shop is so clean.", choices: ["Your shop is so clean.","Your shop is so bad.","I do not like fish.","Give me your net."], choicesZh: ["你的店好乾淨。","你的店好糟。","我不喜歡魚。","把你的網子給我。"], words: ["your","shop","is","clean"], reward: chatReward }
    ]
  },
  port: {
    theme: "chatting at the port",
    title: "Chat at Harbor Port",
    opening: "The Dock Guide waves and welcomes you to the docks.",
    openingZh: "碼頭嚮導揮手歡迎你來到碼頭。",
    ending: "The Dock Guide enjoyed the friendly chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly hello at the docks.", promptZh: "選出在碼頭親切的招呼。", answer: "Hello, nice to see you.", choices: ["Hello, nice to see you.","Go away from here.","Where is my fish?","Stop the boat now."], choicesZh: ["你好，很高興見到你。","從這裡走開。","我的魚在哪？","現在停船。"], words: ["nice","to","see","you"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "He asks if you like the sea. Pick a kind answer.", promptZh: "他問你喜不喜歡海。選出親切的回答。", answer: "Yes, I love the sea.", choices: ["Yes, I love the sea.","Yes, I am a boat.","No, go away.","Give me a ship."], choicesZh: ["對，我愛海。","對，我是一艘船。","不，走開。","給我一艘船。"], words: ["I","love","the","sea"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind goodbye at the port.", promptZh: "選出在碼頭友善的道別。", answer: "Have a safe trip!", choices: ["Have a safe trip!","Have my shoe!","Go away fast!","That is wrong!"], choicesZh: ["祝你旅途平安！","拿走我的鞋子！","快走開！","那是錯的！"], words: ["have","a","safe","trip"], reward: chatReward }
    ]
  },
  lighthouse: {
    theme: "chatting at the lighthouse",
    title: "Chat at the Lighthouse",
    opening: "Captain Sol turns from the sea and greets you warmly.",
    openingZh: "Sol 船長從海面轉過身來，熱情地問候你。",
    ending: "Captain Sol is happy you came up to chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly hello for Captain Sol.", promptZh: "選出對 Sol 船長親切的招呼。", answer: "Hello, Captain Sol!", choices: ["Hello, Captain Sol!","Go away, Sol!","Where is my hat?","Be quiet, Sol!"], choicesZh: ["你好，Sol 船長！","走開，Sol！","我的帽子在哪？","安靜，Sol！"], words: ["hello","captain","sol"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Sol asks if you can see the sea. Pick a kind answer.", promptZh: "Sol 問你看不看得到海。選出親切的回答。", answer: "Yes, it is beautiful.", choices: ["Yes, it is beautiful.","Yes, it is a cake.","No, you cannot.","Go down now."], choicesZh: ["看得到，它好美。","對，它是一個蛋糕。","不，你不行。","現在下去。"], words: ["yes","it","is","beautiful"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind goodbye for Captain Sol.", promptZh: "選出對 Sol 船長友善的道別。", answer: "Good night, Captain!", choices: ["Good night, Captain!","Give me the light!","Go away fast!","That is wrong!"], choicesZh: ["晚安，船長！","把燈給我！","快走開！","那是錯的！"], words: ["good","night","captain"], reward: chatReward }
    ]
  }
});
//#endregion 生活聊天題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
export const urbanSceneConfigs = mergeLessons(mergeLessons({
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
}, urbanLessonBank, { area: "urban", vocabProfile: urbanVocabularyProfile.id }),
  urbanChatLessonBank, { area: "urban", vocabProfile: urbanVocabularyProfile.id }, "chatLesson");
//#endregion 對話場景設定
