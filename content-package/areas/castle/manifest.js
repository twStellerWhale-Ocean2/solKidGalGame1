//#region 匯入共用工具
// 將題庫清單轉成遊戲執行時需要的 lessons（課程資料）與 quest templates（任務模板）。
import { makeLessons, makeQuestTemplates, mergeLessons } from "../_shared/lesson-helpers.js";
//#endregion 匯入共用工具

//#region 素材路徑工具
// 所有本地區圖片路徑集中在這裡；換素材或快取版本參數時優先改這段。
const npcImage = (name) => `content-package/areas/castle/assets/characters/${name}.webp?v=20260606-character-scale-r1`;
const sceneVersion = "20260606-issue66-adv-scenes-r1";
const sceneArt = (src, options = {}) => ({ sceneArt: { src, tone: "castle", ...options } });
const castleSceneArt = (name, options = {}) => sceneArt(`content-package/areas/castle/assets/scenes/${name}-1024.webp?v=${sceneVersion}`, options);
const castleShopArt = (name) => castleSceneArt(name, { tone: "shop" });
const gardenArt = sceneArt(`content-package/areas/urban/assets/scenes/garden-1024.webp?v=${sceneVersion}`, { tone: "urban" });
const princessRoomArt = castleSceneArt("bedroom", { tone: "room" });
//#endregion 素材路徑工具

//#region 英文等級與獎勵設定
// 定義本地區使用的英文程度、顯示名稱與答題獎勵。
export const castleVocabularyProfile = Object.freeze({
  id: "dolch-220",
  label: "Dolch Sight Words",
  levelLabel: "Dolch Sight Words 220",
  rewardCoins: 20,
  note: "Castle rooms use short sight-word sentences for the earliest readers."
});
//#endregion 英文等級與獎勵設定

//#region 題庫資料
// reward 是每題完成後給玩家的固定獎勵。
const reward = { coins: 20 };

// q() 是題目簡寫輔助函式，避免每題重複寫完整物件。
const q = (prompt, answer, choices, words, questionType = "sentence-choice") => ({ prompt, answer, choices, words, questionType, reward });

// lessonPlaces 是本地區所有可練習地點與題目清單。
const castleLessonPlaces = [
  {
    id: "kingHall",
    theme: "royal hall",
    title: "Help in the King's Hall",
    opening: "The king smiles. A small job is here.",
    ending: "Good work. The hall is bright.",
    questions: [
      q("Pick the sentence for the king.", "The king is here.", ["The king is here.", "The fish is here.", "We go down.", "It is red."], ["the", "is", "here", "king"]),
      q("Pick what Lumi can see.", "I see the crown.", ["I see the crown.", "I eat the crown.", "Go to sleep.", "The cow can run."], ["I", "see", "the", "crown"]),
      q("Pick the polite help sentence.", "Can I help?", ["Can I help?", "Can I jump?", "I am away.", "They are blue."], ["can", "I", "help"]),
      q("Pick the sentence about the hall.", "This hall is big.", ["This hall is big.", "This hall is wet.", "My hat can swim.", "She has a fish."], ["this", "is", "big", "hall"]),
      q("Pick the happy sentence.", "We can go now.", ["We can go now.", "We can eat now.", "They are not here.", "Look at my shoe."], ["we", "can", "go", "now"])
    ]
  },
  {
    id: "queenStudy",
    theme: "study room",
    title: "Help in the Queen's Study",
    opening: "The queen has a book and a note.",
    ending: "The study is neat now.",
    questions: [
      q("Pick the sentence about the book.", "I have a book.", ["I have a book.", "I have a cow.", "You run fast.", "It is under me."], ["I", "have", "a", "book"]),
      q("Pick what the queen can do.", "She can read.", ["She can read.", "She can fly.", "He can jump.", "We see red."], ["she", "can", "read"]),
      q("Pick the sentence about the desk.", "The desk is clean.", ["The desk is clean.", "The desk is blue.", "A dog is clean.", "I go up."], ["the", "is", "clean", "desk"]),
      q("Pick the kind sentence.", "This is for you.", ["This is for you.", "This is away.", "They came fast.", "I am under it."], ["this", "is", "for", "you"]),
      q("Pick the sentence about flowers.", "I see pretty flowers.", ["I see pretty flowers.", "I eat pretty flowers.", "The shoe is pretty.", "Go by the tree."], ["I", "see", "pretty", "flowers"])
    ]
  },
  {
    id: "castleKitchen",
    theme: "kitchen",
    title: "Help in the Castle Kitchen",
    opening: "The cook needs a short English word.",
    ending: "The warm soup is ready.",
    questions: [
      q("Pick the sentence about soup.", "The soup is hot.", ["The soup is hot.", "The soup is little.", "The tree is hot.", "I see a king."], ["the", "is", "hot", "soup"]),
      q("Pick what Lumi wants.", "I want some bread.", ["I want some bread.", "I want some rain.", "You want my shoe.", "They go away."], ["I", "want", "some", "bread"]),
      q("Pick the sentence about water.", "Please get water.", ["Please get water.", "Please get a crown.", "Water can read.", "She is not here."], ["please", "get", "water"]),
      q("Pick the sentence about the table.", "Put it on the table.", ["Put it on the table.", "Put it in the sky.", "I am the table.", "We came down."], ["put", "it", "on", "the", "table"]),
      q("Pick the safe kitchen sentence.", "Do not run.", ["Do not run.", "Do not read.", "The cow is hot.", "My book can run."], ["do", "not", "run"])
    ]
  },
  {
    id: "knightsRoom",
    theme: "knights room",
    title: "Help in the Knights' Room",
    opening: "The knight waves from the practice room.",
    ending: "The practice room is safe.",
    questions: [
      q("Pick the sentence about the knight.", "He can help.", ["He can help.", "He can sleep.", "She can eat.", "It is yellow."], ["he", "can", "help"]),
      q("Pick the sentence about the shield.", "The shield is round.", ["The shield is round.", "The shield is wet.", "My fish is round.", "We like soup."], ["the", "is", "round", "shield"]),
      q("Pick the action sentence.", "Stand by me.", ["Stand by me.", "Run by me.", "Eat by me.", "Read by me."], ["stand", "by", "me"]),
      q("Pick the sentence about a flag.", "Look at the flag.", ["Look at the flag.", "Look at the soup.", "The flag can eat.", "I am not big."], ["look", "at", "the", "flag"]),
      q("Pick the kind sentence.", "We are ready.", ["We are ready.", "We are little.", "They are under.", "You see bread."], ["we", "are", "ready"])
    ]
  },
  {
    id: "maidsRoom",
    theme: "maids room",
    title: "Help in the Maid's Room",
    opening: "The maid is folding clean cloth.",
    ending: "The room is tidy now.",
    questions: [
      q("Pick the sentence about the room.", "The room is clean.", ["The room is clean.", "The room is red.", "The fish is clean.", "I go out."], ["the", "is", "clean", "room"]),
      q("Pick the sentence about cloth.", "This cloth is white.", ["This cloth is white.", "This cloth can jump.", "The king is white.", "We eat it."], ["this", "is", "white", "cloth"]),
      q("Pick what Lumi can do.", "I can fold it.", ["I can fold it.", "I can fly it.", "You can eat it.", "She can run it."], ["I", "can", "fold", "it"]),
      q("Pick the sentence about a basket.", "Put it in the basket.", ["Put it in the basket.", "Put it in the sea.", "The basket is hot.", "My basket can read."], ["put", "it", "in", "the", "basket"]),
      q("Pick the thank-you sentence.", "Thank you for help.", ["Thank you for help.", "Thank you for fish.", "They are not you.", "Go up and away."], ["thank", "you", "for", "help"])
    ]
  }
];
//#endregion 題庫資料

//#region 地圖與地點設定
// area 是地圖的主設定；新增地圖圖示或改座標主要看 nodes 與 locations。
export const castleArea = Object.freeze({
  id: "castle",
  label: "Castle",
  view: "home",
  mapImage: "content-package/areas/castle/assets/map-1536.webp?v=20260606-issue66-map-contract-r1",
  imageSize: { width: 1536, height: 1536 },
  vocabularyProfile: castleVocabularyProfile,
  // nodes 控制地圖上的路網與圖示座標；x / y 是相對地圖寬高的百分比。
  nodes: {
    princessRoom: { id: "princessRoom", label: "Princess Room", x: 50.8, y: 56.0, links: ["kingHall", "queenStudy", "castleKitchen", "knightsRoom", "maidsRoom", "royalCloakRoom", "castleSeamstress", "castleGate"] },
    kingHall: { id: "kingHall", label: "King's Hall", x: 50.8, y: 35.8, links: ["princessRoom", "queenStudy", "knightsRoom", "royalCloakRoom"] },
    queenStudy: { id: "queenStudy", label: "Queen's Study", x: 35.8, y: 50.8, links: ["princessRoom", "kingHall", "maidsRoom", "castleSeamstress"] },
    castleKitchen: { id: "castleKitchen", label: "Kitchen", x: 68.4, y: 59.2, links: ["princessRoom", "maidsRoom", "royalCloakRoom"] },
    knightsRoom: { id: "knightsRoom", label: "Knights' Room", x: 72.3, y: 43.6, links: ["kingHall", "princessRoom", "royalCloakRoom"] },
    maidsRoom: { id: "maidsRoom", label: "Maid's Room", x: 35.2, y: 67.7, links: ["queenStudy", "castleKitchen", "princessRoom", "castleSeamstress"] },
    royalCloakRoom: { id: "royalCloakRoom", label: "Royal Cloak Room", x: 76.2, y: 71.0, links: ["princessRoom", "kingHall", "knightsRoom", "castleKitchen"] },
    castleSeamstress: { id: "castleSeamstress", label: "Castle Seamstress", x: 28.0, y: 81.4, links: ["princessRoom", "queenStudy", "maidsRoom"] },
    castleGate: { id: "castleGate", label: "Castle Gate", x: 50.5, y: 85.3, links: ["princessRoom"] }
  },
  // locations 控制地圖圖示進入後的場景、NPC、商店與提示文字。
  locations: [
    { id: "princessRoom", area: "castle", node: "princessRoom", label: "Princess Room", icon: "🚪", npcClass: "npc-none", npc: "Lumi", scene: "scene-princess-room", kind: "room", hint: "Enter Lumi's room for hair, clothes, outerwear, shoes, and accessories." },
    { id: "kingHall", area: "castle", node: "kingHall", label: "King's Hall", icon: "👑", npc: "King Rowan", scene: "scene-castle-king-hall", npcImage: npcImage("king-rowan"), hint: "King Rowan needs very short English words in the hall." },
    { id: "queenStudy", area: "castle", node: "queenStudy", label: "Queen's Study", icon: "📖", npc: "Queen Mira", scene: "scene-castle-queen-study", npcImage: npcImage("queen-mira"), hint: "Queen Mira is reading in her quiet study." },
    { id: "castleKitchen", area: "castle", node: "castleKitchen", label: "Kitchen", icon: "🍲", npc: "Cook Panna", scene: "scene-castle-kitchen", npcImage: npcImage("cook-panna"), hint: "Cook Panna is making warm soup in the kitchen." },
    { id: "knightsRoom", area: "castle", node: "knightsRoom", label: "Knights' Room", icon: "🛡", npc: "Knight Theo", scene: "scene-castle-knights-room", npcImage: npcImage("knight-theo"), hint: "Knight Theo practices safe, kind words." },
    { id: "maidsRoom", area: "castle", node: "maidsRoom", label: "Maid's Room", icon: "🧺", npc: "Maid Lala", scene: "scene-castle-maids-room", npcImage: npcImage("maid-lala"), hint: "Maid Lala keeps the linens clean and tidy." },
    { id: "royalCloakRoom", area: "castle", node: "royalCloakRoom", label: "Royal Cloak Room", icon: "🧥", npc: "Cloak Keeper", scene: "scene-castle-royal-cloak-room", npcImage: npcImage("royal-cloak-keeper"), kind: "shop", shopCategories: ["outerwear", "hats"], defaultCategory: "outerwear", hint: "The Royal Cloak Room sells outerwear and hats for castle rewards." },
    { id: "castleSeamstress", area: "castle", node: "castleSeamstress", label: "Castle Seamstress", icon: "👚", npc: "Seamstress Bea", scene: "scene-castle-seamstress", npcImage: npcImage("castle-seamstress"), kind: "shop", shopCategories: ["tops", "bottoms"], defaultCategory: "tops", hint: "The Castle Seamstress sells tops and bottoms only." },
    { id: "castleGate", area: "castle", node: "castleGate", label: "Castle Gate", icon: "🏰", npcClass: "npc-garden", npc: "Gate Guard", scene: "scene-garden", kind: "gate", markerStyle: "portal", portalId: "castleGate", hint: "Go out to the kingdom world map." }
  ],
  defaultNode: "princessRoom",
  enabled: true
});
//#endregion 地圖與地點設定

//#region 場景自帶題庫（issue #96）
// castleLessonBank：以 place 為鍵的手寫固定題庫，每題自帶中文（promptZh／choicesZh）；
// 由 mergeLessons 併入 castleSceneConfigs 對應條目，使場景進場時就近取用。
const castleLessonBank = Object.freeze({
  kingHall: {
    theme: "royal hall",
    title: "Help in the King's Hall",
    opening: "The king smiles. A small job is here.",
    openingZh: "國王笑了。這裡有一個小任務。",
    ending: "Good work. The hall is bright.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence for the king.", promptZh: "選出要對國王說的句子。", answer: "The king is here.", choices: ["The king is here.","The fish is here.","We go down.","It is red."], choicesZh: ["國王在這裡。","魚在這裡。","我們往下走。","它是紅色的。"], words: ["the","is","here","king"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can see.", promptZh: "選出 Lumi 看得到的東西。", answer: "I see the crown.", choices: ["I see the crown.","I eat the crown.","Go to sleep.","The cow can run."], choicesZh: ["我看到皇冠。","我吃皇冠。","去睡覺。","牛會跑。"], words: ["I","see","the","crown"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the polite help sentence.", promptZh: "選出有禮貌的幫忙句子。", answer: "Can I help?", choices: ["Can I help?","Can I jump?","I am away.","They are blue."], choicesZh: ["我可以幫忙嗎？","我可以跳嗎？","我不在。","它們是藍色的。"], words: ["can","I","help"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about the hall.", promptZh: "選出關於大廳的句子。", answer: "This hall is big.", choices: ["This hall is big.","This hall is wet.","My hat can swim.","She has a fish."], choicesZh: ["這個大廳很大。","這個大廳是濕的。","我的帽子會游泳。","她有一條魚。"], words: ["this","is","big","hall"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the happy sentence.", promptZh: "選出開心的句子。", answer: "We can go now.", choices: ["We can go now.","We can eat now.","They are not here.","Look at my shoe."], choicesZh: ["我們現在可以走了。","我們現在可以吃了。","他們不在這裡。","看看我的鞋子。"], words: ["we","can","go","now"], reward: { coins: 20 } }
    ]
  },
  queenStudy: {
    theme: "study room",
    title: "Help in the Queen's Study",
    opening: "The queen has a book and a note.",
    openingZh: "皇后有一本書和一張紙條。",
    ending: "The study is neat now.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the book.", promptZh: "選出關於書的句子。", answer: "I have a book.", choices: ["I have a book.","I have a cow.","You run fast.","It is under me."], choicesZh: ["我有一本書。","我有一頭牛。","你跑得很快。","它在我下面。"], words: ["I","have","a","book"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick what the queen can do.", promptZh: "選出皇后會做的事。", answer: "She can read.", choices: ["She can read.","She can fly.","He can jump.","We see red."], choicesZh: ["她會讀書。","她會飛。","他會跳。","我們看到紅色。"], words: ["she","can","read"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about the desk.", promptZh: "選出關於書桌的句子。", answer: "The desk is clean.", choices: ["The desk is clean.","The desk is blue.","A dog is clean.","I go up."], choicesZh: ["書桌很乾淨。","書桌是藍色的。","一隻狗很乾淨。","我往上走。"], words: ["the","is","clean","desk"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "This is for you.", choices: ["This is for you.","This is away.","They came fast.","I am under it."], choicesZh: ["這是給你的。","這個離得很遠。","他們來得很快。","我在它下面。"], words: ["this","is","for","you"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about flowers.", promptZh: "選出關於花的句子。", answer: "I see pretty flowers.", choices: ["I see pretty flowers.","I eat pretty flowers.","The shoe is pretty.","Go by the tree."], choicesZh: ["我看到漂亮的花。","我吃漂亮的花。","這隻鞋子很漂亮。","走到樹旁邊。"], words: ["I","see","pretty","flowers"], reward: { coins: 20 } }
    ]
  },
  castleKitchen: {
    theme: "kitchen",
    title: "Help in the Castle Kitchen",
    opening: "The cook needs a short English word.",
    openingZh: "廚師需要一個簡短的英文字。",
    ending: "The warm soup is ready.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about soup.", promptZh: "選出關於湯的句子。", answer: "The soup is hot.", choices: ["The soup is hot.","The soup is little.","The tree is hot.","I see a king."], choicesZh: ["湯很燙。","湯很少。","樹很熱。","我看到一位國王。"], words: ["the","is","hot","soup"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi wants.", promptZh: "選出 Lumi 想要的東西。", answer: "I want some bread.", choices: ["I want some bread.","I want some rain.","You want my shoe.","They go away."], choicesZh: ["我想要一些麵包。","我想要一些雨。","你想要我的鞋子。","他們離開了。"], words: ["I","want","some","bread"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about water.", promptZh: "選出關於水的句子。", answer: "Please get water.", choices: ["Please get water.","Please get a crown.","Water can read.","She is not here."], choicesZh: ["請去拿水。","請去拿一頂皇冠。","水會讀書。","她不在這裡。"], words: ["please","get","water"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about the table.", promptZh: "選出關於桌子的句子。", answer: "Put it on the table.", choices: ["Put it on the table.","Put it in the sky.","I am the table.","We came down."], choicesZh: ["把它放在桌上。","把它放到天空。","我是桌子。","我們下來了。"], words: ["put","it","on","the","table"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the safe kitchen sentence.", promptZh: "選出廚房裡安全的句子。", answer: "Do not run.", choices: ["Do not run.","Do not read.","The cow is hot.","My book can run."], choicesZh: ["不要奔跑。","不要讀。","牛很熱。","我的書會跑。"], words: ["do","not","run"], reward: { coins: 20 } }
    ]
  },
  knightsRoom: {
    theme: "knights room",
    title: "Help in the Knights' Room",
    opening: "The knight waves from the practice room.",
    openingZh: "騎士從練習室向你揮手。",
    ending: "The practice room is safe.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the knight.", promptZh: "選出關於騎士的句子。", answer: "He can help.", choices: ["He can help.","He can sleep.","She can eat.","It is yellow."], choicesZh: ["他可以幫忙。","他可以睡覺。","她可以吃。","它是黃色的。"], words: ["he","can","help"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about the shield.", promptZh: "選出關於盾牌的句子。", answer: "The shield is round.", choices: ["The shield is round.","The shield is wet.","My fish is round.","We like soup."], choicesZh: ["盾牌是圓的。","盾牌是濕的。","我的魚是圓的。","我們喜歡湯。"], words: ["the","is","round","shield"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the action sentence.", promptZh: "選出表示動作的句子。", answer: "Stand by me.", choices: ["Stand by me.","Run by me.","Eat by me.","Read by me."], choicesZh: ["站在我旁邊。","從我旁邊跑過。","在我旁邊吃。","在我旁邊讀。"], words: ["stand","by","me"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about a flag.", promptZh: "選出關於旗子的句子。", answer: "Look at the flag.", choices: ["Look at the flag.","Look at the soup.","The flag can eat.","I am not big."], choicesZh: ["看看那面旗子。","看看那碗湯。","旗子會吃東西。","我不大。"], words: ["look","at","the","flag"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the kind sentence.", promptZh: "選出親切的句子。", answer: "We are ready.", choices: ["We are ready.","We are little.","They are under.","You see bread."], choicesZh: ["我們準備好了。","我們很小。","他們在下面。","你看到麵包。"], words: ["we","are","ready"], reward: { coins: 20 } }
    ]
  },
  maidsRoom: {
    theme: "maids room",
    title: "Help in the Maid's Room",
    opening: "The maid is folding clean cloth.",
    openingZh: "女僕正在摺乾淨的布。",
    ending: "The room is tidy now.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the sentence about the room.", promptZh: "選出關於房間的句子。", answer: "The room is clean.", choices: ["The room is clean.","The room is red.","The fish is clean.","I go out."], choicesZh: ["房間很乾淨。","房間是紅色的。","魚很乾淨。","我出去。"], words: ["the","is","clean","room"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about cloth.", promptZh: "選出關於布的句子。", answer: "This cloth is white.", choices: ["This cloth is white.","This cloth can jump.","The king is white.","We eat it."], choicesZh: ["這塊布是白色的。","這塊布會跳。","國王是白色的。","我們把它吃掉。"], words: ["this","is","white","cloth"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick what Lumi can do.", promptZh: "選出 Lumi 會做的事。", answer: "I can fold it.", choices: ["I can fold it.","I can fly it.","You can eat it.","She can run it."], choicesZh: ["我可以把它摺起來。","我可以讓它飛。","你可以吃它。","她可以操作它。"], words: ["I","can","fold","it"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the sentence about a basket.", promptZh: "選出關於籃子的句子。", answer: "Put it in the basket.", choices: ["Put it in the basket.","Put it in the sea.","The basket is hot.","My basket can read."], choicesZh: ["把它放進籃子裡。","把它放進海裡。","籃子很燙。","我的籃子會讀書。"], words: ["put","it","in","the","basket"], reward: { coins: 20 } },
      { questionType: "sentence-choice", prompt: "Pick the thank-you sentence.", promptZh: "選出道謝的句子。", answer: "Thank you for help.", choices: ["Thank you for help.","Thank you for fish.","They are not you.","Go up and away."], choicesZh: ["謝謝你的幫忙。","謝謝你的魚。","他們不是你。","往上飛走。"], words: ["thank","you","for","help"], reward: { coins: 20 } }
    ]
  }
});
//#endregion 場景自帶題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
export const castleSceneConfigs = mergeLessons({
  princessRoom: { ...princessRoomArt, scene: "scene-princess-room", npcClass: "npc-none", npc: "Lumi", travelAction: "Enter", travelLine: "Lumi's room is ready for hair, clothes, outerwear, shoes, and accessories." },
  kingHall: { ...castleSceneArt("king-hall"), scene: "scene-castle-king-hall", npc: "King Rowan", npcImage: npcImage("king-rowan"), npcNaturalHeightCm: 178, travelAction: "Visit", travelLine: "King Rowan is waiting in the bright royal hall." },
  queenStudy: { ...castleSceneArt("queen-study"), scene: "scene-castle-queen-study", npc: "Queen Mira", npcImage: npcImage("queen-mira"), npcNaturalHeightCm: 165, travelAction: "Visit", travelLine: "Queen Mira has opened her study book." },
  castleKitchen: { ...castleSceneArt("castle-kitchen"), scene: "scene-castle-kitchen", npc: "Cook Panna", npcImage: npcImage("cook-panna"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Cook Panna stirs warm soup for the castle." },
  knightsRoom: { ...castleSceneArt("knights-room"), scene: "scene-castle-knights-room", npc: "Knight Theo", npcImage: npcImage("knight-theo"), npcNaturalHeightCm: 182, travelAction: "Visit", travelLine: "Knight Theo is checking the shields." },
  maidsRoom: { ...castleSceneArt("maids-room"), scene: "scene-castle-maids-room", npc: "Maid Lala", npcImage: npcImage("maid-lala"), npcNaturalHeightCm: 158, travelAction: "Visit", travelLine: "Maid Lala is folding soft white cloth." },
  royalCloakRoom: { ...castleShopArt("royal-cloak-room"), scene: "scene-castle-royal-cloak-room", npc: "Cloak Keeper", npcImage: npcImage("royal-cloak-keeper"), npcNaturalHeightCm: 170, travelAction: "Shop", travelLine: "The Cloak Keeper has royal outerwear and hats.", shopGreeting: "Welcome to the Royal Cloak Room. Pick outerwear or hats." },
  castleSeamstress: { ...castleShopArt("castle-seamstress"), scene: "scene-castle-seamstress", npc: "Seamstress Bea", npcImage: npcImage("castle-seamstress"), npcNaturalHeightCm: 158, travelAction: "Shop", travelLine: "Seamstress Bea has castle tops and bottoms ready.", shopGreeting: "Welcome to the Castle Seamstress. Pick tops or bottoms." },
  castleGate: { ...gardenArt, scene: "scene-garden", npcClass: "npc-garden", npc: "Gate Guard", travelAction: "World Map", travelLine: "The castle gate opens the kingdom world map." }
}, castleLessonBank);
//#endregion 對話場景設定

//#region 中文協助對照（issue #73）
// 英文字串 → 中文（zh-TW）對照表，供題目（advLine）與選項的中文撥放使用；
// 查無對應者前端自動降級為僅英文撥放。目前涵蓋 King's Hall，其餘城堡房間於後續切片補齊。
const castleZh = {
  "The king smiles. A small job is here.": "國王笑了。這裡有一個小任務。",
  "Pick the sentence for the king.": "選出要對國王說的句子。",
  "The king is here.": "國王在這裡。",
  "The fish is here.": "魚在這裡。",
  "We go down.": "我們往下走。",
  "It is red.": "它是紅色的。",
  "Pick what Lumi can see.": "選出 Lumi 看得到的東西。",
  "I see the crown.": "我看到皇冠。",
  "I eat the crown.": "我吃皇冠。",
  "Go to sleep.": "去睡覺。",
  "The cow can run.": "牛會跑。",
  "Pick the polite help sentence.": "選出有禮貌的幫忙句子。",
  "Can I help?": "我可以幫忙嗎？",
  "Can I jump?": "我可以跳嗎？",
  "I am away.": "我不在。",
  "They are blue.": "它們是藍色的。",
  "Pick the sentence about the hall.": "選出關於大廳的句子。",
  "This hall is big.": "這個大廳很大。",
  "This hall is wet.": "這個大廳是濕的。",
  "My hat can swim.": "我的帽子會游泳。",
  "She has a fish.": "她有一條魚。",
  "Pick the happy sentence.": "選出開心的句子。",
  "We can go now.": "我們現在可以走了。",
  "We can eat now.": "我們現在可以吃了。",
  "They are not here.": "他們不在這裡。",
  "Look at my shoe.": "看看我的鞋子。",
  "The queen has a book and a note.": "皇后有一本書和一張紙條。",
  "Pick the sentence about the book.": "選出關於書的句子。",
  "I have a book.": "我有一本書。",
  "I have a cow.": "我有一頭牛。",
  "You run fast.": "你跑得很快。",
  "It is under me.": "它在我下面。",
  "Pick what the queen can do.": "選出皇后會做的事。",
  "She can read.": "她會讀書。",
  "She can fly.": "她會飛。",
  "He can jump.": "他會跳。",
  "We see red.": "我們看到紅色。",
  "Pick the sentence about the desk.": "選出關於書桌的句子。",
  "The desk is clean.": "書桌很乾淨。",
  "The desk is blue.": "書桌是藍色的。",
  "A dog is clean.": "一隻狗很乾淨。",
  "I go up.": "我往上走。",
  "Pick the kind sentence.": "選出親切的句子。",
  "This is for you.": "這是給你的。",
  "This is away.": "這個離得很遠。",
  "They came fast.": "他們來得很快。",
  "I am under it.": "我在它下面。",
  "Pick the sentence about flowers.": "選出關於花的句子。",
  "I see pretty flowers.": "我看到漂亮的花。",
  "I eat pretty flowers.": "我吃漂亮的花。",
  "The shoe is pretty.": "這隻鞋子很漂亮。",
  "Go by the tree.": "走到樹旁邊。",
  "The cook needs a short English word.": "廚師需要一個簡短的英文字。",
  "Pick the sentence about soup.": "選出關於湯的句子。",
  "The soup is hot.": "湯很燙。",
  "The soup is little.": "湯很少。",
  "The tree is hot.": "樹很熱。",
  "I see a king.": "我看到一位國王。",
  "Pick what Lumi wants.": "選出 Lumi 想要的東西。",
  "I want some bread.": "我想要一些麵包。",
  "I want some rain.": "我想要一些雨。",
  "You want my shoe.": "你想要我的鞋子。",
  "They go away.": "他們離開了。",
  "Pick the sentence about water.": "選出關於水的句子。",
  "Please get water.": "請去拿水。",
  "Please get a crown.": "請去拿一頂皇冠。",
  "Water can read.": "水會讀書。",
  "She is not here.": "她不在這裡。",
  "Pick the sentence about the table.": "選出關於桌子的句子。",
  "Put it on the table.": "把它放在桌上。",
  "Put it in the sky.": "把它放到天空。",
  "I am the table.": "我是桌子。",
  "We came down.": "我們下來了。",
  "Pick the safe kitchen sentence.": "選出廚房裡安全的句子。",
  "Do not run.": "不要奔跑。",
  "Do not read.": "不要讀。",
  "The cow is hot.": "牛很熱。",
  "My book can run.": "我的書會跑。",
  "The knight waves from the practice room.": "騎士從練習室向你揮手。",
  "Pick the sentence about the knight.": "選出關於騎士的句子。",
  "He can help.": "他可以幫忙。",
  "He can sleep.": "他可以睡覺。",
  "She can eat.": "她可以吃。",
  "It is yellow.": "它是黃色的。",
  "Pick the sentence about the shield.": "選出關於盾牌的句子。",
  "The shield is round.": "盾牌是圓的。",
  "The shield is wet.": "盾牌是濕的。",
  "My fish is round.": "我的魚是圓的。",
  "We like soup.": "我們喜歡湯。",
  "Pick the action sentence.": "選出表示動作的句子。",
  "Stand by me.": "站在我旁邊。",
  "Run by me.": "從我旁邊跑過。",
  "Eat by me.": "在我旁邊吃。",
  "Read by me.": "在我旁邊讀。",
  "Pick the sentence about a flag.": "選出關於旗子的句子。",
  "Look at the flag.": "看看那面旗子。",
  "Look at the soup.": "看看那碗湯。",
  "The flag can eat.": "旗子會吃東西。",
  "I am not big.": "我不大。",
  "We are ready.": "我們準備好了。",
  "We are little.": "我們很小。",
  "They are under.": "他們在下面。",
  "You see bread.": "你看到麵包。",
  "The maid is folding clean cloth.": "女僕正在摺乾淨的布。",
  "Pick the sentence about the room.": "選出關於房間的句子。",
  "The room is clean.": "房間很乾淨。",
  "The room is red.": "房間是紅色的。",
  "The fish is clean.": "魚很乾淨。",
  "I go out.": "我出去。",
  "Pick the sentence about cloth.": "選出關於布的句子。",
  "This cloth is white.": "這塊布是白色的。",
  "This cloth can jump.": "這塊布會跳。",
  "The king is white.": "國王是白色的。",
  "We eat it.": "我們把它吃掉。",
  "Pick what Lumi can do.": "選出 Lumi 會做的事。",
  "I can fold it.": "我可以把它摺起來。",
  "I can fly it.": "我可以讓它飛。",
  "You can eat it.": "你可以吃它。",
  "She can run it.": "她可以操作它。",
  "Pick the sentence about a basket.": "選出關於籃子的句子。",
  "Put it in the basket.": "把它放進籃子裡。",
  "Put it in the sea.": "把它放進海裡。",
  "The basket is hot.": "籃子很燙。",
  "My basket can read.": "我的籃子會讀書。",
  "Pick the thank-you sentence.": "選出道謝的句子。",
  "Thank you for help.": "謝謝你的幫忙。",
  "Thank you for fish.": "謝謝你的魚。",
  "They are not you.": "他們不是你。",
  "Go up and away.": "往上飛走。"
};
//#endregion 中文協助對照

//#region 衍生匯出
// 由題庫資料統一產生給 game-engine/data/game-data.js 匯總使用的資料註冊表。
export const castleQuestTemplates = makeQuestTemplates(castleLessonPlaces, castleZh);
export const castleLessons = makeLessons("castle", castleVocabularyProfile, castleLessonPlaces, castleZh);
//#endregion 衍生匯出
