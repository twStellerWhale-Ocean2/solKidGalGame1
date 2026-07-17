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
    { id: "castleSeamstress", area: "castle", node: "castleSeamstress", label: "Castle Seamstress", icon: "👚", npc: "Seamstress Bea", scene: "scene-castle-seamstress", npcImage: npcImage("castle-seamstress"), shopCategories: ["hair", "outfit", "shoes", "accessories"], defaultCategory: "hair", hint: "The Castle Seamstress offers royal hair, gowns, shoes, and accessories." },
    { id: "castleGate", area: "castle", node: "castleGate", label: "Castle Gate", icon: "🏰", npcClass: "npc-garden", npc: "Gate Guard", scene: "scene-castle-gate", kind: "gate", markerStyle: "portal", portalId: "castleGate", hint: "Go out to the kingdom world map." }
  ],
  defaultNode: "princessRoom",
  enabled: true
});
//#endregion 地圖與地點設定

//#region 場景自帶題庫（issue #96 結構；issue #149 角色第一人稱；issue #295 全量重寫：語感自然化、干擾選項改為情境內合理但判斷較差／語意錯誤之回應，去除荒謬句）
// castleLessonBank：以 place 為鍵的「打工任務」題庫（答對得 coins＝勞動所得）。
// prompt＝場景角色第一人稱對公主之請求／任務；choices＝公主可說出的回應；每場景 3 題、每題 3 選項；words 由引擎自正解導出。
const jobReward = { coins: 100 };
const castleLessonBank = Object.freeze({
  kingHall: {
    title: "Help in the King's Hall",
    questions: [
      { questionType: "sentence-choice", prompt: "Today is the big ceremony, and I want my finest crown. Which one should I bring?", promptZh: "今天是盛大的典禮，我想戴上我最好的王冠。我該拿哪一頂？", answer: "Sure — the gold crown shines the most. Take that one!", choices: ["Sure — the gold crown shines the most. Take that one!","Well, the plain grey crown is fine for a big day.","OK — maybe you can go without a crown today."], choicesZh: ["好啊——金王冠最閃亮，就拿那一頂吧！","嗯，大日子戴那頂樸素的灰王冠就可以了。","好吧——也許你今天可以不戴王冠。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The long table needs cups for the feast tonight. Where should they go?", promptZh: "今晚的宴會，長桌需要擺上杯子。杯子該放在哪裡？", answer: "OK — one cup at each seat, so every guest gets one.", choices: ["OK — one cup at each seat, so every guest gets one.","OK — set all the cups at your seat, just in case.","Well, we can bring the cups out after the feast starts."], choicesZh: ["好的——每個座位放一個杯子，每位客人都有。","好的——把杯子全放在您的座位旁，以防萬一。","嗯，我們可以等宴會開始後再把杯子拿出來。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Guests will arrive soon, and the hall is dusty. What should we do first?", promptZh: "客人快到了，大廳都是灰塵。我們該先做什麼？", answer: "Right away — I'll sweep the floor before they come in.", choices: ["Right away — I'll sweep the floor before they come in.","Well, we can clean the hall after the guests leave.","OK — let's close the doors so nobody sees the dust."], choicesZh: ["馬上來——我在客人進來之前先把地板掃乾淨。","嗯，我們可以等客人走了再打掃大廳。","好的——我們把門關上，這樣就沒人看到灰塵了。"], reward: jobReward }
    ]
  },
  queenStudy: {
    title: "Help in the Queen's Study",
    questions: [
      { questionType: "sentence-choice", prompt: "I want to read by the window tonight. Where should my book wait for me?", promptZh: "我今晚想在窗邊看書。我的書該放在哪裡等我？", answer: "Sure — I'll set it on the little table by the window.", choices: ["Sure — I'll set it on the little table by the window.","OK — I'll put it back up on the high shelf.","Well, you can find it yourself when you need it."], choicesZh: ["好啊——我把它放在窗邊的小桌上。","好的——我把它放回高高的書架上。","嗯，你需要的時候再自己找就好了。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This note is a royal secret. What will you do if someone asks about it?", promptZh: "這張便條是王室機密。如果有人問起，你會怎麼做？", answer: "Of course — I'll keep it safe and give it only to you.", choices: ["Of course — I'll keep it safe and give it only to you.","Well, I could show it to the maids if they ask nicely.","OK — I can read it out at dinner so nobody wonders."], choicesZh: ["當然——我會好好保管，只交給你本人。","嗯，如果女僕們好好拜託，我可以給她們看看。","好的——我可以在晚餐時念出來，這樣就沒人好奇了。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "I found a word in this book that I do not know. Can you help me?", promptZh: "我在這本書裡看到一個我不懂的字。你可以幫我嗎？", answer: "Sure — let's open the big dictionary and find it together.", choices: ["Sure — let's open the big dictionary and find it together.","Well, we could skip that page and keep going.","OK — maybe an easier book would be more fun."], choicesZh: ["好啊——我們一起打開大字典查查看。","嗯，我們可以跳過那一頁繼續讀。","好的——也許換一本簡單的書更有趣。"], reward: jobReward }
    ]
  },
  castleKitchen: {
    title: "Help in the Castle Kitchen",
    questions: [
      { questionType: "sentence-choice", prompt: "The bread is hot, fresh from the oven. Where should it go to cool?", promptZh: "麵包剛出爐還很燙。該放在哪裡放涼？", answer: "OK — set it on the rack by the window to cool.", choices: ["OK — set it on the rack by the window to cool.","Sure — keep it in the warm oven a little longer.","Well, we can wrap it up now while it is still hot."], choicesZh: ["好的——把它放在窗邊的架子上放涼。","好啊——讓它在溫熱的烤箱裡再待一下。","嗯，我們可以趁熱現在就把它包起來。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The soup pot needs more water. Which water should we use?", promptZh: "湯鍋需要加水。我們該用哪種水？", answer: "Sure — the clean water from the well is best for soup.", choices: ["Sure — the clean water from the well is best for soup.","OK — the washing-up water is right here, so use that.","Well, the pot looks full enough — maybe add none."], choicesZh: ["好啊——井裡打來的乾淨水最適合煮湯。","好的——洗碗水就在旁邊，用那個吧。","嗯，鍋子看起來夠滿了——也許不用加。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "These plates are greasy from lunch. How should we wash them?", promptZh: "這些盤子沾了午餐的油。我們該怎麼洗？", answer: "No problem — warm water and soap will get them clean.", choices: ["No problem — warm water and soap will get them clean.","OK — a quick rinse in cold water should be enough.","Well, we can wipe them with a dry cloth and save time."], choicesZh: ["沒問題——溫水加肥皂就能洗得乾乾淨淨。","好的——用冷水快速沖一下應該就夠了。","嗯，我們可以用乾布擦一擦，省點時間。"], reward: jobReward }
    ]
  },
  knightsRoom: {
    title: "Help in the Knights' Room",
    questions: [
      { questionType: "sentence-choice", prompt: "The parade is today, and my shield is muddy. How can I make it shine?", promptZh: "今天要遊行，我的盾牌卻沾滿泥巴。我要怎麼讓它發亮？", answer: "Sure — rub it with a soft cloth until it shines.", choices: ["Sure — rub it with a soft cloth until it shines.","Well, a quick splash of water should be enough.","OK — hold the muddy side down, and nobody will see."], choicesZh: ["好啊——用軟布擦到它發亮為止。","嗯，潑一點水沖一下應該就夠了。","好的——把泥巴那面朝下拿，就沒人看到了。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This sword is very sharp. Where is the safest place to keep it?", promptZh: "這把劍非常鋒利。放在哪裡最安全？", answer: "Of course — hang it high on the rack, away from little hands.", choices: ["Of course — hang it high on the rack, away from little hands.","OK — lean it by the door so it is easy to grab.","Well, under the bed is a good hiding place for it."], choicesZh: ["當然——把它高掛在架上，小朋友的手才碰不到。","好的——把它靠在門邊，要拿比較方便。","嗯，床底下是個藏它的好地方。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "This armour is too heavy for one person. How should we move it?", promptZh: "這套盔甲一個人搬太重了。我們該怎麼搬？", answer: "Sure — we can carry it together, one piece at a time.", choices: ["Sure — we can carry it together, one piece at a time.","OK — I can drag it over there in one go by myself.","Well, let's wait for a stronger knight to do it later."], choicesZh: ["好啊——我們一起搬，一次搬一件。","好的——我可以自己一口氣把它拖過去。","嗯，我們等一位更強壯的騎士晚點來搬吧。"], reward: jobReward }
    ]
  },
  maidsRoom: {
    title: "Help in the Maid's Room",
    questions: [
      { questionType: "sentence-choice", prompt: "This sheet is still wet. Should I fold it now or dry it first?", promptZh: "這條床單還是濕的。我該現在折，還是先弄乾？", answer: "Well, dry it first — then it will fold nice and neat.", choices: ["Well, dry it first — then it will fold nice and neat.","Sure, fold it right now so we can finish early.","OK, hang it in the closet just the way it is."], choicesZh: ["嗯，先把它弄乾——這樣折起來才漂亮又整齊。","好啊，現在就折，我們可以早點做完。","好的，就這樣直接把它掛進衣櫃吧。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Clean cloths and dirty cloths got all mixed up. Which ones go in the wash basket?", promptZh: "乾淨的布和髒布全混在一起了。哪些該放進洗衣籃？", answer: "OK — only the dirty ones go in the basket.", choices: ["OK — only the dirty ones go in the basket.","Sure — wash them all again, just to be safe.","Well, the white ones go in, and the rest can wait."], choicesZh: ["好的——只有髒的才放進籃子。","好啊——保險起見，全部再洗一次吧。","嗯，白色的放進去，其他的先等等。"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Guests will need towels tonight. Where should the clean towels go?", promptZh: "今晚客人會需要毛巾。乾淨的毛巾該放在哪裡？", answer: "Sure — stack them on the open shelf where guests can reach.", choices: ["Sure — stack them on the open shelf where guests can reach.","OK — keep them in the locked chest so they stay clean.","Well, leave them by the wash tub until someone asks."], choicesZh: ["好啊——把它們疊在客人拿得到的開放架上。","好的——把它們收進上鎖的櫃子，才不會弄髒。","嗯，先放在洗衣盆旁，有人要再說。"], reward: jobReward }
    ]
  }
});
//#endregion 場景自帶題庫

//#region 生活聊天題庫（issue #135 spec#11；issue #149 角色第一人稱；issue #295 全量重寫：寒暄具體化、貼近真實親子/朋友對話，干擾句同語域）
// castleChatLessonBank：每個場景的「生活聊天」題組——角色以第一人稱對公主寒暄、提問；每場景 2 題、每題 2 選項。
// 答對提升心情並在護眼上限內延長可玩時間、不發 coins（reward.coins=0 僅為結構一致）。
const chatReward = { coins: 0 };
const castleChatLessonBank = Object.freeze({
  kingHall: {
    title: "Chat in the King's Hall",
    questions: [
      { questionType: "sentence-choice", prompt: "Good morning, my dear. Did you sleep well?", promptZh: "早安，親愛的。你睡得好嗎？", answer: "Good morning, Father! I slept really well.", choices: ["Good morning, Father! I slept really well.","Not really, Father — I did not sleep much."], choicesZh: ["早安，父王！我睡得超好。","不太好，父王——我沒睡多久。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "I have a whole day of royal work ahead of me.", promptZh: "我今天有一整天的王室工作要忙。", answer: "You can do it, Father! I will cheer for you.", choices: ["You can do it, Father! I will cheer for you.","Royal work sounds a bit boring to me, Father."], choicesZh: ["父王你一定做得到！我會為你加油。","父王，王室工作聽起來有點無聊耶。"], reward: chatReward }
    ]
  },
  queenStudy: {
    title: "Chat in the Queen's Study",
    questions: [
      { questionType: "sentence-choice", prompt: "Reading by the window is my favourite time of day.", promptZh: "在窗邊看書是我一天中最喜歡的時光。", answer: "I love reading here with you, Mother!", choices: ["I love reading here with you, Mother!","Reading always makes me sleepy, Mother."], choicesZh: ["母后，我最喜歡在這裡陪你看書了！","母后，看書總是讓我想睡覺。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Thank you for keeping me company today.", promptZh: "謝謝你今天陪著我。", answer: "I always love our time together, Mother!", choices: ["I always love our time together, Mother!","Sorry, Mother — I cannot stay with you today."], choicesZh: ["母后，我一直都很喜歡我們在一起的時光！","抱歉，母后——我今天不能陪你。"], reward: chatReward }
    ]
  },
  castleKitchen: {
    title: "Chat in the Castle Kitchen",
    questions: [
      { questionType: "sentence-choice", prompt: "Something smells good in my kitchen, right?", promptZh: "我的廚房裡有東西聞起來很香，對吧？", answer: "Yes! The warm bread smells so good.", choices: ["Yes! The warm bread smells so good.","Hmm, the kitchen smells a little smoky to me."], choicesZh: ["對啊！溫熱的麵包聞起來好香。","嗯，我覺得廚房聞起來有點煙味。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Are you hungry after all that running around?", promptZh: "跑來跑去一整天，你餓了嗎？", answer: "So hungry! May I have a little taste?", choices: ["So hungry! May I have a little taste?","Not hungry at all — I just ate, thank you."], choicesZh: ["超餓的！可以讓我嚐一小口嗎？","一點都不餓——我剛吃過了，謝謝。"], reward: chatReward }
    ]
  },
  knightsRoom: {
    title: "Chat in the Knights' Room",
    questions: [
      { questionType: "sentence-choice", prompt: "I polished my shield all morning. How does it look?", promptZh: "我擦了一早上的盾牌。看起來如何？", answer: "Wow, your shield shines like a mirror!", choices: ["Wow, your shield shines like a mirror!","Hmm, your shield still looks a bit dull to me."], choicesZh: ["哇，你的盾牌亮得像鏡子一樣！","嗯，我覺得你的盾牌看起來還是有點暗。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Would you like to hear about my bravest day?", promptZh: "你想聽聽我最勇敢的那一天嗎？", answer: "Yes! I love your brave stories, Theo.", choices: ["Yes! I love your brave stories, Theo.","Maybe later, Theo — brave stories scare me a little."], choicesZh: ["想！我最愛聽你的勇敢故事了，西奧。","晚點吧，西奧——勇敢的故事讓我有點害怕。"], reward: chatReward }
    ]
  },
  maidsRoom: {
    title: "Chat in the Maid's Room",
    questions: [
      { questionType: "sentence-choice", prompt: "I folded every sheet in the castle today.", promptZh: "我今天把城堡裡每一條床單都折好了。", answer: "Wow, Lala! The sheets look so neat.", choices: ["Wow, Lala! The sheets look so neat.","The sheets will just get messy again, Lala."], choicesZh: ["哇，拉拉！床單看起來好整齊。","拉拉，床單很快又會亂掉的啦。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "How are you today, little Princess?", promptZh: "小公主，你今天好嗎？", answer: "I am great! The castle feels so cosy today.", choices: ["I am great! The castle feels so cosy today.","A bit bored — the castle is too quiet today."], choicesZh: ["我很好！今天城堡感覺好舒服。","有點無聊——今天城堡太安靜了。"], reward: chatReward }
    ]
  },
  castleSeamstress: {
    title: "Chat with the Castle Seamstress",
    questions: [
      { questionType: "sentence-choice", prompt: "I sewed this ribbon dress just this morning. Do you like it?", promptZh: "這件緞帶洋裝是我今天早上才縫好的。你喜歡嗎？", answer: "I love it! The ribbon is so pretty.", choices: ["I love it! The ribbon is so pretty.","Hmm, the ribbon colour is not really for me."], choicesZh: ["我超愛！這條緞帶好漂亮。","嗯，這個緞帶的顏色不太適合我。"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Every princess needs one dress that twirls. True?", promptZh: "每位公主都需要一件轉圈圈會飛起來的洋裝。對吧？", answer: "So true! A dress that twirls is the best.", choices: ["So true! A dress that twirls is the best.","Not really — a plain dress is easier to run in."], choicesZh: ["太對了！會轉圈圈的洋裝最棒了。","不一定耶——素面洋裝跑起來比較方便。"], reward: chatReward }
    ]
  }
});
//#endregion 生活聊天題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
// issue #149：travelLine／shopGreeting 改為角色第一人稱對公主發話，並補中文（travelLineZh／shopGreetingZh）。
export const castleSceneConfigs = mergeLessons(mergeLessons({
  princessRoom: { ...princessRoomArt, scene: "scene-princess-room", npcClass: "npc-none", npc: "Lumi", travelAction: "Enter", travelLine: "This is my room. I can dress for the trip.", travelLineZh: "這是我的房間。我可以為旅程換裝。" },
  kingHall: { ...castleSceneArt("king-hall"), scene: "scene-castle-king-hall", npc: "King Rowan", npcImage: npcImage("king-rowan"), npcNaturalHeightCm: 178, travelAction: "Visit", travelLine: "There you are, my dear! Come in, come in.", travelLineZh: "你來啦，親愛的！快進來、快進來。" },
  queenStudy: { ...castleSceneArt("queen-study"), scene: "scene-castle-queen-study", npc: "Queen Mira", npcImage: npcImage("queen-mira"), npcNaturalHeightCm: 165, travelAction: "Visit", travelLine: "Come in, my dear. Shall we read together?", travelLineZh: "進來吧，親愛的。我們一起看書好嗎？" },
  castleKitchen: { ...castleSceneArt("castle-kitchen"), scene: "scene-castle-kitchen", npc: "Cook Panna", npcImage: npcImage("cook-panna"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Hello, Princess! The soup is nice and warm.", travelLineZh: "你好，公主！湯煮得又香又暖。" },
  knightsRoom: { ...castleSceneArt("knights-room"), scene: "scene-castle-knights-room", npc: "Knight Theo", npcImage: npcImage("knight-theo"), npcNaturalHeightCm: 182, travelAction: "Visit", travelLine: "Hello, Princess! My shield is ready for the parade.", travelLineZh: "你好，公主！我的盾牌已經為遊行準備好了。" },
  maidsRoom: { ...castleSceneArt("maids-room"), scene: "scene-castle-maids-room", npc: "Maid Lala", npcImage: npcImage("maid-lala"), npcNaturalHeightCm: 158, travelAction: "Visit", travelLine: "Hello, Princess! Everything is fresh and tidy today.", travelLineZh: "你好，公主！今天每樣東西都清爽又整齊。" },
  castleSeamstress: { ...castleShopArt("castle-seamstress"), scene: "scene-castle-seamstress", npc: "Seamstress Bea", npcImage: npcImage("castle-seamstress"), npcNaturalHeightCm: 158, travelAction: "Shop", travelLine: "Welcome, Princess! The court wardrobe is all ready for you.", travelLineZh: "歡迎，公主！宮廷服飾都為你準備好了。", shopGreeting: "Come look around, Princess — royal hair, court gowns, satin shoes, and sparkly accessories.", shopGreetingZh: "公主，來逛逛吧——宮廷髮型、禮服、緞面鞋，還有亮晶晶的配件。" },
  castleGate: { ...gardenArt, scene: "scene-castle-gate", npcClass: "npc-garden", npc: "Gate Guard", travelAction: "World Map", travelLine: "The gate is open, Princess. The whole kingdom is waiting!", travelLineZh: "城門開了，公主。整個王國都在等你！" }
}, castleLessonBank, { area: "castle", vocabProfile: castleVocabularyProfile.id }),
  castleChatLessonBank, { area: "castle", vocabProfile: castleVocabularyProfile.id }, "chatLesson");
//#endregion 對話場景設定
