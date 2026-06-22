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
  rewardCoins: 100,
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
    princessRoom: { id: "princessRoom", label: "Princess Room", x: 49.2, y: 42.4, links: ["kingHall", "queenStudy", "castleKitchen", "knightsRoom", "maidsRoom", "castleSeamstress", "castleGate"] },
    kingHall: { id: "kingHall", label: "King's Hall", x: 58.1, y: 29.5, links: ["princessRoom", "queenStudy", "knightsRoom"] },
    queenStudy: { id: "queenStudy", label: "Queen's Study", x: 48.3, y: 28.9, links: ["princessRoom", "kingHall", "maidsRoom", "castleSeamstress"] },
    castleKitchen: { id: "castleKitchen", label: "Kitchen", x: 75.3, y: 64.6, links: ["princessRoom", "maidsRoom"] },
    knightsRoom: { id: "knightsRoom", label: "Knights' Room", x: 50.3, y: 71.5, links: ["kingHall", "princessRoom"] },
    maidsRoom: { id: "maidsRoom", label: "Maid's Room", x: 33.7, y: 44.5, links: ["queenStudy", "castleKitchen", "princessRoom", "castleSeamstress"] },
    castleSeamstress: { id: "castleSeamstress", label: "Castle Seamstress", x: 29.1, y: 64, links: ["princessRoom", "queenStudy", "maidsRoom"] },
    castleGate: { id: "castleGate", label: "Castle Gate", x: 39, y: 95.3, links: ["princessRoom"] }
  },
  // locations 控制地圖圖示進入後的場景、NPC、商店與提示文字。
  locations: [
    { id: "princessRoom", area: "castle", node: "princessRoom", label: "Princess Room", icon: "🚪", npcClass: "npc-none", npc: "Lumi", scene: "scene-princess-room", kind: "room", hint: "Enter Lumi's room for hair, clothes, shoes, and accessories." },
    { id: "kingHall", area: "castle", node: "kingHall", label: "King's Hall", icon: "👑", npc: "King Rowan", scene: "scene-castle-king-hall", npcImage: npcImage("king-rowan"), hint: "King Rowan has a small royal task in the bright hall."},
    { id: "queenStudy", area: "castle", node: "queenStudy", label: "Queen's Study", icon: "📖", npc: "Queen Mira", scene: "scene-castle-queen-study", npcImage: npcImage("queen-mira"), hint: "Queen Mira is reading in her quiet study." },
    { id: "castleKitchen", area: "castle", node: "castleKitchen", label: "Kitchen", icon: "🍲", npc: "Cook Panna", scene: "scene-castle-kitchen", npcImage: npcImage("cook-panna"), hint: "Cook Panna is making warm soup in the kitchen." },
    { id: "knightsRoom", area: "castle", node: "knightsRoom", label: "Knights' Room", icon: "🛡", npc: "Knight Theo", scene: "scene-castle-knights-room", npcImage: npcImage("knight-theo"), hint: "Knight Theo practices safe, kind words." },
    { id: "maidsRoom", area: "castle", node: "maidsRoom", label: "Maid's Room", icon: "🧺", npc: "Maid Lala", scene: "scene-castle-maids-room", npcImage: npcImage("maid-lala"), hint: "Maid Lala keeps the linens clean and tidy." },
    { id: "castleSeamstress", area: "castle", node: "castleSeamstress", label: "Castle Seamstress", icon: "👚", npc: "Seamstress Bea", scene: "scene-castle-seamstress", npcImage: npcImage("castle-seamstress"), shopCategories: ["hair", "accessories"], defaultCategory: "hair", hint: "The Castle Seamstress now sews the castle wardrobe — hairstyles and tiaras." },
    { id: "castleGate", area: "castle", node: "castleGate", label: "Castle Gate", icon: "🏰", npcClass: "npc-garden", npc: "Gate Guard", scene: "scene-castle-gate", kind: "gate", markerStyle: "portal", portalId: "castleGate", hint: "Go out to the kingdom world map." }
  ],
  defaultNode: "princessRoom",
  enabled: true
});
//#endregion 地圖與地點設定

//#region 場景自帶題庫（issue #96 結構；issue #149 全量改寫：角色第一人稱、prompt 即台詞、選項即公主回應、無 opening/ending）
// castleLessonBank：以 place 為鍵的「打工任務」題庫（答對得 coins＝勞動所得）。
// issue #149：prompt＝場景角色第一人稱對公主之請求／任務；choices＝公主可說出的回應；每場景 3 題、每題 3 選項；words 由引擎自正解導出。
const jobReward = { coins: 100 };
const castleLessonBank = Object.freeze({
  kingHall: {
    title: "Help in the King's Hall",
    questions: [
      { questionType: "sentence-choice", prompt: "The King has three crowns. Which one should I bring for today's big ceremony?", promptZh: "國王有三頂王冠。今天的大典我該拿哪一頂？", answer: "Sure, let's bring the grand golden crown.", choices: ["Sure, let's bring the grand golden crown.","Sure, let's bring the broken rusty crown.","Sure, let's bring the tiny baby crown."], choicesZh: ["好啊，我們拿那頂華麗的金王冠。","好啊，我們拿那頂破舊生鏽的王冠。","好啊，我們拿那頂迷你的嬰兒王冠。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "We are setting up for the royal feast. Where should the cups go?", promptZh: "我們正在布置皇家宴會。杯子該擺在哪裡？", answer: "OK, let's set the cups neatly on the table.", choices: ["OK, let's set the cups neatly on the table.","OK, let's pile the cups on the floor.","OK, let's hide the cups under the throne."], choicesZh: ["好的，我們把杯子整齊地擺在桌上。","好的，我們把杯子堆在地上。","好的，我們把杯子藏在王座底下。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The hall is dusty before the guests arrive. What should I clean first?", promptZh: "客人到之前大廳灰塵很多。我該先打掃哪裡？", answer: "Sure, let's sweep the floor by the throne first.", choices: ["Sure, let's sweep the floor by the throne first.","Sure, let's just sweep one tiny corner.","Sure, let's leave all the dust where it is."], choicesZh: ["好啊，我們先掃王座旁的地板。","好啊，我們只掃一個小角落就好。","好啊，我們把灰塵都留在原地吧。"], reward: jobReward }
    ]
  },
  queenStudy: {
    title: "Help in the Queen's Study",
    questions: [
      { questionType: "sentence-choice", prompt: "The Queen wants to read tonight. Where should I leave her book?", promptZh: "王后今晚想看書。我該把她的書放在哪裡？", answer: "OK, let's leave it ready on her reading desk.", choices: ["OK, let's leave it ready on her reading desk.","OK, let's hide it inside the cold fireplace.","OK, let's drop it out of the window."], choicesZh: ["好的，我們把它準備好放在她的書桌上。","好的，我們把它藏進冰冷的壁爐裡。","好的，我們把它丟出窗外。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This secret note is only for the Queen. Who should I give it to?", promptZh: "這張密函只給王后。我該交給誰？", answer: "Sure, let's give it only to the Queen herself.", choices: ["Sure, let's give it only to the Queen herself.","Sure, let's read it out loud to everyone.","Sure, let's give it to the kitchen cat."], choicesZh: ["好啊，我們只交給王后本人。","好啊，我們大聲念給大家聽。","好啊，我們把它交給廚房的貓。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This page has a hard word I don't know. What should we do?", promptZh: "這一頁有個我不懂的難字。我們該怎麼辦？", answer: "Yes, let's look it up in the big dictionary.", choices: ["Yes, let's look it up in the big dictionary.","Yes, let's just skip the whole page.","Yes, let's tear the page out."], choicesZh: ["好的，我們去那本大字典查一查。","好的，我們乾脆跳過整頁。","好的，我們把那一頁撕掉。"], reward: jobReward }
    ]
  },
  castleKitchen: {
    title: "Help in the Castle Kitchen",
    questions: [
      { questionType: "sentence-choice", prompt: "The fresh bread is hot from the oven. Where should I put it to cool?", promptZh: "新鮮麵包剛出爐還很燙。我該放在哪裡放涼？", answer: "OK, let's put it on the wooden table to cool.", choices: ["OK, let's put it on the wooden table to cool.","OK, let's put it back in the hot oven.","OK, let's put it in the cold soup."], choicesZh: ["好的，我們把它放在木桌上放涼。","好的，我們把它放回熱烤箱裡。","好的，我們把它放進冷湯裡。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Lunch needs water. Should I bring the clean water or the dirty mop water?", promptZh: "午餐需要水。我該拿乾淨的水，還是拖把的髒水？", answer: "Sure, let's bring the clean fresh water.", choices: ["Sure, let's bring the clean fresh water.","Sure, let's bring the dirty mop water.","Sure, let's bring no water at all."], choicesZh: ["好啊，我們拿乾淨的新鮮水。","好啊，我們拿拖把的髒水。","好啊，我們完全不要拿水。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "These greasy plates need cleaning. What should I wash them with?", promptZh: "這些油膩的盤子要洗乾淨。我該用什麼洗？", answer: "OK, let's wash them with warm soapy water.", choices: ["OK, let's wash them with warm soapy water.","OK, let's wash them with sticky honey.","OK, let's just rub them with dry sand."], choicesZh: ["好的，我們用溫熱的肥皂水洗。","好的，我們用黏黏的蜂蜜洗。","好的，我們只用乾沙搓一搓。"], reward: jobReward }
    ]
  },
  knightsRoom: {
    title: "Help in the Knights' Room",
    questions: [
      { questionType: "sentence-choice", prompt: "My shield is covered in mud before the parade. How should I clean it?", promptZh: "遊行前我的盾牌沾滿了泥巴。我該怎麼清乾淨？", answer: "Sure, let's rub it shiny with a soft cloth.", choices: ["Sure, let's rub it shiny with a soft cloth.","Sure, let's smear more mud all over it.","Sure, let's leave it dirty for the parade."], choicesZh: ["好啊，我們用軟布把它擦得閃亮。","好啊，我們在上面抹更多泥巴。","好啊，我們就帶著髒盾牌去遊行。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This sharp sword must be stored safely. Where should it go?", promptZh: "這把鋒利的劍必須安全收好。該放到哪裡？", answer: "OK, let's hang it high on the sword rack.", choices: ["OK, let's hang it high on the sword rack.","OK, let's leave it on the floor to trip on.","OK, let's put it under the soft pillow."], choicesZh: ["好的，我們把它高高掛在劍架上。","好的，我們把它留在地上絆人。","好的，我們把它放在軟枕頭底下。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This armour is very heavy for me alone. How should we move it?", promptZh: "這套盔甲我一個人搬太重了。我們該怎麼搬？", answer: "Sure, let's carry it together, one piece at a time.", choices: ["Sure, let's carry it together, one piece at a time.","Sure, let's throw it across the room.","Sure, let's just drag it and scratch the floor."], choicesZh: ["好啊，我們一起搬，一次搬一件。","好啊，我們把它丟到房間另一頭。","好啊，我們直接拖著它把地板刮花。"], reward: jobReward }
    ]
  },
  maidsRoom: {
    title: "Help in the Maid's Room",
    questions: [
      { questionType: "sentence-choice", prompt: "This white cloth is still wet. Should I fold it now or dry it first?", promptZh: "這塊白布還是濕的。我該現在就折，還是先弄乾？", answer: "OK, let's dry it well first, then fold it neatly.", choices: ["OK, let's dry it well first, then fold it neatly.","OK, let's fold it while it is still wet.","OK, let's use the wet cloth as a flag."], choicesZh: ["好的，我們先把它弄乾，再整齊地折好。","好的，我們趁它還濕的時候就折。","好的，我們把濕布拿來當旗子。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The dirty cloths and the clean cloths are all mixed. Which go in the wash basket?", promptZh: "髒布和乾淨的布全混在一起了。哪些該放進待洗的籃子？", answer: "Sure, let's put only the dirty cloths in the basket.", choices: ["Sure, let's put only the dirty cloths in the basket.","Sure, let's put the clean cloths in the basket.","Sure, let's put the cat in the basket."], choicesZh: ["好啊，我們只把髒布放進籃子。","好啊，我們把乾淨的布放進籃子。","好啊，我們把貓放進籃子。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Where should the clean, dry towels go so guests can reach them?", promptZh: "乾淨又乾的毛巾該放哪裡，客人才拿得到？", answer: "OK, let's stack them on the open guest shelf.", choices: ["OK, let's stack them on the open guest shelf.","OK, let's hide them in a locked box.","OK, let's drop them in the muddy yard."], choicesZh: ["好的，我們把它們疊在客人拿得到的開放架上。","好的，我們把它們鎖進箱子裡。","好的，我們把它們丟到泥濘的院子裡。"], reward: jobReward }
    ]
  }
});
//#endregion 場景自帶題庫

//#region 生活聊天題庫（issue #135 spec#11；issue #149 全量改寫：角色第一人稱、無 opening/ending）
// castleChatLessonBank：每個場景的「生活聊天」題組——角色以第一人稱對公主寒暄、提問；每場景 2 題、每題 2 選項。
// 答對提升心情並在護眼上限內延長可玩時間、不發 coins（reward.coins=0 僅為結構一致）。
const chatReward = { coins: 0 };
const castleChatLessonBank = Object.freeze({
  kingHall: {
    title: "Chat in the King's Hall",
    questions: [
      { questionType: "sentence-choice", prompt: "Good morning, my dear.", promptZh: "早安，親愛的。", answer: "Good morning, Father! I am happy.", choices: ["Good morning, Father! I am happy.","Sorry, I am not happy this morning."], choicesZh: ["早安，父王！我好開心。","抱歉，我今天早上不太開心。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "How are you today?", promptZh: "你今天好嗎？", answer: "Oh, I am very well, thank you!", choices: ["Oh, I am very well, thank you!","I am not feeling well today."], choicesZh: ["喔，我很好，謝謝！","我今天覺得不太舒服。"], reward: chatReward }
    ]
  },
  queenStudy: {
    title: "Chat in the Queen's Study",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like this book?", promptZh: "你喜歡這本書嗎？", answer: "Yes, I like this book very much!", choices: ["Yes, I like this book very much!","Sorry, I do not like this book."], choicesZh: ["喜歡，我超喜歡這本書！","抱歉，我不喜歡這本書。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Thank you for sitting with me.", promptZh: "謝謝你坐在我身邊。", answer: "Thank you, Mother. I like this.", choices: ["Thank you, Mother. I like this.","Sorry, I cannot keep sitting here."], choicesZh: ["謝謝，母后。我很喜歡這樣。","抱歉，我沒辦法一直坐在這裡。"], reward: chatReward }
    ]
  },
  castleKitchen: {
    title: "Chat in the Castle Kitchen",
    questions: [
      { questionType: "sentence-choice", prompt: "Are you hungry, Princess?", promptZh: "公主，你餓了嗎？", answer: "Yes, I am so hungry!", choices: ["Yes, I am so hungry!","No, I am not hungry right now."], choicesZh: ["對啊，我好餓！","不，我現在不餓。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "This soup smells good.", promptZh: "這碗湯聞起來很香。", answer: "Yes! Some soup, please.", choices: ["Yes! Some soup, please.","Sorry, this soup smells a bit strange."], choicesZh: ["好耶！請給我一些湯。","抱歉，這碗湯聞起來怪怪的。"], reward: chatReward }
    ]
  },
  knightsRoom: {
    title: "Chat in the Knights' Room",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you want to play a safe game?", promptZh: "你想玩一個安全的小遊戲嗎？", answer: "Yes, let us play now!", choices: ["Yes, let us play now!","No, I do not want to play right now."], choicesZh: ["好啊，我們現在玩吧！","不，我現在不想玩。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "I am checking my shield.", promptZh: "我正在檢查我的盾牌。", answer: "Wow, your shield is so strong!", choices: ["Wow, your shield is so strong!","Be careful, your shield looks heavy."], choicesZh: ["哇，你的盾牌好堅固！","小心，你的盾牌看起來很重。"], reward: chatReward }
    ]
  },
  maidsRoom: {
    title: "Chat in the Maid's Room",
    questions: [
      { questionType: "sentence-choice", prompt: "How are you, Princess?", promptZh: "公主，你好嗎？", answer: "Hi! I am very well.", choices: ["Hi! I am very well.","Sorry, I am very busy and cannot talk."], choicesZh: ["嗨！我很好。","抱歉，我很忙，不能聊天。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "This room looks nice today.", promptZh: "今天這個房間看起來很漂亮。", answer: "Yes, the room looks so nice!", choices: ["Yes, the room looks so nice!","Hmm, this room looks a bit dusty today."], choicesZh: ["對啊，房間看起來好漂亮！","嗯，這個房間今天看起來有點灰。"], reward: chatReward }
    ]
  },
  castleSeamstress: {
    title: "Chat with the Castle Seamstress",
    questions: [
      { questionType: "sentence-choice", prompt: "Do you like this soft top?", promptZh: "你喜歡這件柔軟的上衣嗎？", answer: "Yes, I like this soft top very much!", choices: ["Yes, I like this soft top very much!","Sorry, I do not like this top."], choicesZh: ["喜歡，我很喜歡這件柔軟的上衣！","抱歉，我不喜歡這件上衣。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Thank you for coming to my room.", promptZh: "謝謝你來我的裁縫室。", answer: "Thank you for your help!", choices: ["Thank you for your help!","Sorry, I cannot come into your room."], choicesZh: ["謝謝你的幫忙！","抱歉，我不能進你的房間。"], reward: chatReward }
    ]
  }
});
//#endregion 生活聊天題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
// issue #149：travelLine／shopGreeting 改為角色第一人稱對公主發話，並補中文（travelLineZh／shopGreetingZh）。
export const castleSceneConfigs = mergeLessons(mergeLessons({
  princessRoom: { ...princessRoomArt, scene: "scene-princess-room", npcClass: "npc-none", npc: "Lumi", travelAction: "Enter", travelLine: "This is my room. I can dress for the trip.", travelLineZh: "這是我的房間。我可以為旅程換裝。" },
  kingHall: { ...castleSceneArt("king-hall"), scene: "scene-castle-king-hall", npc: "King Rowan", npcImage: npcImage("king-rowan"), npcNaturalHeightCm: 178, travelAction: "Visit", travelLine: "Hello, my dear. Come to the hall.", travelLineZh: "你好，親愛的。來大廳吧。" },
  queenStudy: { ...castleSceneArt("queen-study"), scene: "scene-castle-queen-study", npc: "Queen Mira", npcImage: npcImage("queen-mira"), npcNaturalHeightCm: 165, travelAction: "Visit", travelLine: "Come here, my dear. Let us read.", travelLineZh: "過來吧，親愛的。我們一起讀書吧。" },
  castleKitchen: { ...castleSceneArt("castle-kitchen"), scene: "scene-castle-kitchen", npc: "Cook Panna", npcImage: npcImage("cook-panna"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Hello, Princess. The soup is warm.", travelLineZh: "你好，公主。湯是溫熱的。" },
  knightsRoom: { ...castleSceneArt("knights-room"), scene: "scene-castle-knights-room", npc: "Knight Theo", npcImage: npcImage("knight-theo"), npcNaturalHeightCm: 182, travelAction: "Visit", travelLine: "Hello, Princess. My shield is ready.", travelLineZh: "你好，公主。我的盾牌準備好了。" },
  maidsRoom: { ...castleSceneArt("maids-room"), scene: "scene-castle-maids-room", npc: "Maid Lala", npcImage: npcImage("maid-lala"), npcNaturalHeightCm: 158, travelAction: "Visit", travelLine: "Hello, Princess. The room is clean.", travelLineZh: "你好，公主。房間很乾淨。" },
  castleSeamstress: { ...castleShopArt("castle-seamstress"), scene: "scene-castle-seamstress", npc: "Seamstress Bea", npcImage: npcImage("castle-seamstress"), npcNaturalHeightCm: 158, travelAction: "Shop", travelLine: "Good morning, Princess. The whole castle wardrobe is ready.", travelLineZh: "早安，公主。整套城堡服飾都準備好了。", shopGreeting: "Pick a hairstyle, tiara, top, skirt or cloak, Princess.", shopGreetingZh: "公主，選一個髮型、頭飾、上衣、裙子或披風吧。" },
  castleGate: { ...gardenArt, scene: "scene-castle-gate", npcClass: "npc-garden", npc: "Gate Guard", travelAction: "World Map", travelLine: "Princess, the gate is open. You can go to the world map.", travelLineZh: "公主，城門打開了。你可以前往世界地圖。" }
}, castleLessonBank, { area: "castle", vocabProfile: castleVocabularyProfile.id }),
  castleChatLessonBank, { area: "castle", vocabProfile: castleVocabularyProfile.id }, "chatLesson");
//#endregion 對話場景設定
