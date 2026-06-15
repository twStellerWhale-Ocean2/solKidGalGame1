//#region 匯入共用工具
// 將題庫清單轉成遊戲執行時需要的 lessons（課程資料）與 quest templates（任務模板）。
import { mergeLessons } from "../_shared/lesson-helpers.js";
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
    { id: "castleGate", area: "castle", node: "castleGate", label: "Castle Gate", icon: "🏰", npcClass: "npc-garden", npc: "Gate Guard", scene: "scene-castle-gate", kind: "gate", markerStyle: "portal", portalId: "castleGate", hint: "Go out to the kingdom world map." }
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
  castleGate: { ...gardenArt, scene: "scene-castle-gate", npcClass: "npc-garden", npc: "Gate Guard", travelAction: "World Map", travelLine: "The castle gate opens the kingdom world map." }
}, castleLessonBank, { area: "castle", vocabProfile: castleVocabularyProfile.id });
//#endregion 對話場景設定

