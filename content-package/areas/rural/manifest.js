//#region 匯入共用工具
// 將題庫清單轉成遊戲執行時需要的 lessons（課程資料）與 quest templates（任務模板）。
import { mergeLessons } from "../_shared/lesson-helpers.js";
//#endregion 匯入共用工具

//#region 素材路徑工具
// 所有本地區圖片路徑集中在這裡；換素材或快取版本參數時優先改這段。
const npcImage = (name) => `content-package/areas/rural/assets/characters/${name}.webp?v=20260606-character-scale-r1`;
const sceneVersion = "20260606-issue66-adv-scenes-r1";
const sceneArt = (src, options = {}) => ({ sceneArt: { src, tone: "rural", ...options } });
const ruralSceneArt = (name, options = {}) => sceneArt(`content-package/areas/rural/assets/scenes/${name}-1024.webp?v=${sceneVersion}`, options);
const ruralProductionArt = (name) => ruralSceneArt(`rural-${name}`);
const ruralShopArt = (name) => ruralSceneArt(name, { tone: "shop" });
//#endregion 素材路徑工具

//#region 英文等級與獎勵設定
// 定義本地區使用的英文程度、顯示名稱與答題獎勵。
export const ruralVocabularyProfile = Object.freeze({
  id: "cambridge-a1-movers",
  label: "Cambridge A1 Movers",
  levelLabel: "Cambridge Movers",
  rewardCoins: 500,
  note: "Rural production places use practical Movers-style resource words."
});
//#endregion 英文等級與獎勵設定

//#region 地圖與地點設定
// area 是地圖的主設定；新增地圖圖示或改座標主要看 nodes 與 locations。
export const ruralArea = Object.freeze({
  id: "rural",
  label: "Rural",
  view: "map",
  mapImage: "content-package/areas/rural/assets/map-1536.webp?v=20260606-issue66-map-contract-r1",
  imageSize: { width: 1536, height: 1536 },
  vocabularyProfile: ruralVocabularyProfile,
  // nodes 控制地圖上的路網與圖示座標；x / y 是相對地圖寬高的百分比。
  nodes: {
    ruralEntrance: { id: "ruralEntrance", label: "World Road", x: 7, y: 78, links: ["pasture", "farm"] },
    mine: { id: "mine", label: "Mine", x: 64, y: 17, links: ["loggingCamp", "fishingShore", "ruralEntrance"] },
    loggingCamp: { id: "loggingCamp", label: "Logging Camp", x: 45, y: 28, links: ["mine", "fishingShore", "mill", "fieldCobbler"] },
    fishingShore: { id: "fishingShore", label: "Fishing Shore", x: 84, y: 76, links: ["loggingCamp", "farm", "mine", "fieldCobbler"] },
    pasture: { id: "pasture", label: "Pasture", x: 56, y: 34, links: ["ruralEntrance", "farm", "mill", "workwearStall"] },
    farm: { id: "farm", label: "Farm", x: 64, y: 58, links: ["pasture", "mill", "villageHome", "fishingShore", "workwearStall"] },
    mill: { id: "mill", label: "Mill", x: 33, y: 61, links: ["farm", "pasture", "loggingCamp", "villageHome", "workwearStall"] },
    workwearStall: { id: "workwearStall", label: "Workwear Stall", x: 42, y: 46, links: ["pasture", "farm", "mill"] },
    fieldCobbler: { id: "fieldCobbler", label: "Field Cobbler", x: 50, y: 82, links: ["fishingShore", "loggingCamp", "mine"] },
    villageHome: { id: "villageHome", label: "Village Home", x: 15, y: 86, links: ["farm", "mill"] }
  },
  // locations 控制地圖圖示進入後的場景、NPC、商店與提示文字。
  locations: [
    { id: "ruralExit", area: "rural", node: "ruralEntrance", label: "World Road", icon: "↩", npcClass: "npc-none", npc: "Rural Sign", kind: "gate", markerStyle: "portal", portalId: "entrance", hint: "The road returns to the kingdom world map." },
    { id: "mine", area: "rural", node: "mine", label: "Mine", icon: "⛏", npc: "Miner Gemma", scene: "scene-rural-mine", npcImage: npcImage("miner-gemma"), hint: "The mine has bright stones and cart tracks." },
    { id: "loggingCamp", area: "rural", node: "loggingCamp", label: "Logging Camp", icon: "🪵", npc: "Logger Rowan", scene: "scene-rural-logging", npcImage: npcImage("logger-rowan"), hint: "The logging camp stacks wood for safe building." },
    { id: "fishingShore", area: "rural", node: "fishingShore", label: "Fishing Shore", icon: "🎣", npc: "Fisher Nami", scene: "scene-rural-fishing", npcImage: npcImage("fisher-nami"), hint: "The shore has nets, boats, and small fish." },
    { id: "pasture", area: "rural", node: "pasture", label: "Pasture", icon: "🐄", npc: "Farmer Theo", scene: "scene-rural-pasture", npcImage: npcImage("farmer-theo"), hint: "The pasture has sheep, cows, and hay." },
    { id: "farm", area: "rural", node: "farm", label: "Farm", icon: "🥕", npc: "Auntie Pom", scene: "scene-rural-farm", npcImage: npcImage("auntie-pom"), hint: "The farm fields grow vegetables and wheat." },
    { id: "mill", area: "rural", node: "mill", label: "Mill", icon: "🌬", npc: "Miller Bell", scene: "scene-rural-mill", npcImage: npcImage("miller-bell"), hint: "The windmill turns grain into flour." },
    { id: "workwearStall", area: "rural", node: "workwearStall", label: "Workwear Stall", icon: "👚", npc: "Workwear Keeper", scene: "scene-rural-workwear-stall", npcImage: npcImage("workwear-stall-keeper"), shopCategories: ["tops", "bottoms"], defaultCategory: "tops", hint: "The Workwear Stall sells sturdy tops and bottoms." },
    { id: "fieldCobbler", area: "rural", node: "fieldCobbler", label: "Field Cobbler", icon: "👞", npc: "Field Cobbler", scene: "scene-rural-field-cobbler", npcImage: npcImage("field-cobbler"), shopCategories: ["shoes", "hats"], defaultCategory: "shoes", hint: "The Field Cobbler sells shoes and hats for country roads." },
    { id: "villageHome", area: "rural", node: "villageHome", label: "Village Home", icon: "🏡", npc: "Grandma Fina", scene: "scene-rural-home", npcImage: npcImage("grandma-fina"), hint: "The village home has a warm porch and garden." }
  ],
  // actors 是地圖上的動態環境效果，不是可點擊地點。
  actors: [],
  defaultNode: "ruralEntrance",
  enabled: true
});
//#endregion 地圖與地點設定

//#region 場景自帶題庫（issue #96 結構；issue #135 內容研改）
// ruralLessonBank：以 place 為鍵的「打工任務」題庫（答對得 coins＝勞動所得）。
// issue #135 句型分級：Cambridge Movers——補齊過去式缺口（was/were、規則與常見不規則：found/sold/
//   caught/made/dug/cut）／because 原因子句（首見複句）／比較級（-er than）／going to·will 未來式／
//   have to·must／時間介系詞（before·after）。題材切合各生產場景，並結合 Movers 程度的加減法應用題。
// 生活化：選項皆為合理但情境不符的日常句（非超現實、非換名詞樣板）；干擾項聚焦時態／數量／原因之常見錯誤。
const jobReward = { coins: 500 };
const ruralLessonBank = Object.freeze({
  mine: {
    theme: "mining work",
    title: "Help at the Mine",
    opening: "Miner Gemma needs help digging, counting, and sorting the bright stones.",
    openingZh: "礦工 Gemma 需要有人幫忙挖礦、數數和分類亮晶晶的石頭。",
    ending: "The carts are sorted and safe. Great work down here!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Gemma what you did this morning. Pick the past sentence.", promptZh: "告訴 Gemma 你早上做了什麼。選出過去式句子。", answer: "I found six stones.", choices: ["I found six stones.","I find six stones.","I will find six stones.","I found six socks."], choicesZh: ["我找到了六顆石頭。","我找到六顆石頭（現在式）。","我將會找到六顆石頭。","我找到了六隻襪子。"], words: ["I","found","six","stones"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Gemma had ten stones and sold four. How many are left?", promptZh: "Gemma 有十顆石頭，賣掉四顆。還剩幾顆？", answer: "Six stones are left.", choices: ["Six stones are left.","Fourteen stones are left.","Four stones are left.","Six carts are left."], choicesZh: ["還剩六顆石頭。","還剩十四顆石頭。","還剩四顆石頭。","還剩六台礦車。"], words: ["six","stones","are","left"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Gemma is pushing the heavy cart now. Pick that sentence.", promptZh: "Gemma 正在推沉重的礦車。選出這個句子。", answer: "Gemma is pushing the cart.", choices: ["Gemma is pushing the cart.","Gemma is filling the cart.","Gemma is fixing the cart.","Gemma is pulling the cart."], choicesZh: ["Gemma 正在推礦車。","Gemma 正在裝滿礦車。","Gemma 正在修礦車。","Gemma 正在拉礦車。"], words: ["is","pushing","the","cart"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Why must we wear a hard hat here? Pick the reason.", promptZh: "為什麼這裡一定要戴安全帽？選出原因。", answer: "Because stones can fall.", choices: ["Because stones can fall.","Because the path is dark.","Because the cart is heavy.","Because the floor is wet."], choicesZh: ["因為石頭可能會掉下來。","因為通道很暗。","因為礦車很重。","因為地板很濕。"], words: ["because","stones","can","fall"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Compare two stones. Pick the correct comparative sentence.", promptZh: "比較兩顆石頭。選出正確的比較級句子。", answer: "This stone is bigger than that one.", choices: ["This stone is bigger than that one.","This stone is big than that one.","This stone is more big than that one.","This stone is the bigger one than that."], choicesZh: ["這顆石頭比那顆大。","這顆石頭比那顆「big than」（錯誤）。","這顆石頭比那顆「more big」（錯誤）。","這顆石頭是「the bigger one than」（錯誤）。"], words: ["bigger","than","that","one"], reward: jobReward }
    ]
  },
  loggingCamp: {
    theme: "logging work",
    title: "Help at the Logging Camp",
    opening: "Logger Rowan needs help cutting, counting, and stacking the wood safely.",
    openingZh: "伐木工 Rowan 需要有人幫忙鋸木、數數和安全地堆木材。",
    ending: "The logs are stacked neatly and safely. Well done!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Rowan what happened. Pick the past sentence.", promptZh: "告訴 Rowan 發生了什麼。選出過去式句子。", answer: "We cut ten logs today.", choices: ["We cut ten logs today.","We cut ten clouds today.","We will cut ten logs today.","We cuts ten logs today."], choicesZh: ["我們今天鋸了十根木頭。","我們今天鋸了十朵雲。","我們今天將會鋸十根木頭。","我們今天「cuts」十根木頭（錯誤）。"], words: ["we","cut","ten","logs"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Rowan cut three logs, then four more. How many logs?", promptZh: "Rowan 鋸了三根木頭，又鋸了四根。一共幾根？", answer: "He cut seven logs.", choices: ["He cut seven logs.","He cut twelve logs.","He cut one log.","He cut seven nets."], choicesZh: ["他鋸了七根木頭。","他鋸了十二根木頭。","他鋸了一根木頭。","他鋸了七張漁網。"], words: ["seven","logs","cut"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Compare two logs. Pick the correct comparative sentence.", promptZh: "比較兩根木頭。選出正確的比較級句子。", answer: "This log is longer than that one.", choices: ["This log is longer than that one.","This log is long than that one.","This log is more long than that one.","This log is longest than that one."], choicesZh: ["這根木頭比那根長。","這根木頭比那根「long than」（錯誤）。","這根木頭比那根「more long」（錯誤）。","這根木頭比那根「longest than」（錯誤）。"], words: ["longer","than","that","log"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Why do we lift the wood carefully? Pick the reason.", promptZh: "為什麼我們要小心地搬木頭？選出原因。", answer: "Because the logs are heavy.", choices: ["Because the logs are heavy.","Because the logs are wet.","Because the path is steep.","Because the axe is sharp."], choicesZh: ["因為木頭很重。","因為木頭很濕。","因為路很陡。","因為斧頭很利。"], words: ["because","logs","are","heavy"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Rowan is tying the logs together now. Pick that sentence.", promptZh: "Rowan 正在把木頭綁在一起。選出這個句子。", answer: "Rowan is tying the logs.", choices: ["Rowan is tying the logs.","Rowan is stacking the logs.","Rowan is counting the logs.","Rowan is carrying the logs."], choicesZh: ["Rowan 正在綁木頭。","Rowan 正在堆木頭。","Rowan 正在數木頭。","Rowan 正在搬木頭。"], words: ["is","tying","the","logs"], reward: jobReward }
    ]
  },
  fishingShore: {
    theme: "fishing work",
    title: "Help at the Fishing Shore",
    opening: "Fisher Nami needs help pulling nets, counting fish, and keeping the dock safe.",
    openingZh: "漁夫 Nami 需要有人幫忙拉網、數魚，並保持碼頭安全。",
    ending: "The fish are counted and the nets are dry. Nice work!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Nami about the catch. Pick the past sentence.", promptZh: "告訴 Nami 今天的漁獲。選出過去式句子。", answer: "We caught eight fish.", choices: ["We caught eight fish.","We catch eight fish.","We will catch eight fish.","We caught eight hats."], choicesZh: ["我們抓到了八條魚。","我們抓八條魚（現在式）。","我們將會抓八條魚。","我們抓到了八頂帽子。"], words: ["we","caught","eight","fish"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "One net had five fish, the other had five. How many fish?", promptZh: "一張網有五條魚，另一張也有五條。一共幾條？", answer: "There are ten fish.", choices: ["There are ten fish.","There are five fish.","There are twenty fish.","There are ten boats."], choicesZh: ["一共有十條魚。","一共有五條魚。","一共有二十條魚。","一共有十艘船。"], words: ["there","are","ten","fish"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Nami is washing the wet net now. Pick that sentence.", promptZh: "Nami 正在清洗濕漁網。選出這個句子。", answer: "Nami is washing the net.", choices: ["Nami is washing the net.","Nami is fixing the net.","Nami is folding the net.","Nami is hanging the net."], choicesZh: ["Nami 正在清洗漁網。","Nami 正在修補漁網。","Nami 正在摺漁網。","Nami 正在掛漁網。"], words: ["is","washing","the","net"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Why do we walk slowly on the dock? Pick the reason.", promptZh: "為什麼我們在碼頭要慢慢走？選出原因。", answer: "Because the dock is wet and slippery.", choices: ["Because the dock is wet and slippery.","Because the dock is very narrow.","Because the boxes are heavy.","Because the ropes are loose."], choicesZh: ["因為碼頭又濕又滑。","因為碼頭很窄。","因為箱子很重。","因為繩子鬆了。"], words: ["because","dock","wet","slippery"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Tomorrow's plan. Pick the future sentence.", promptZh: "明天的計畫。選出未來式句子。", answer: "We are going to fish again tomorrow.", choices: ["We are going to fish again tomorrow.","We fished again tomorrow.","We are going to fish again yesterday.","We are go to fish tomorrow."], choicesZh: ["我們明天要再去釣魚。","我們明天釣了魚（時態錯誤）。","我們昨天要去釣魚（時間錯誤）。","我們「are go to」釣魚（錯誤）。"], words: ["going","to","fish","tomorrow"], reward: jobReward }
    ]
  },
  pasture: {
    theme: "pasture work",
    title: "Help at the Pasture",
    opening: "Farmer Theo needs help counting the animals and carrying fresh hay.",
    openingZh: "農夫 Theo 需要有人幫忙數動物、搬新鮮的乾草。",
    ending: "Every animal is fed and counted. Thank you!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Theo what you saw. Pick the past sentence.", promptZh: "告訴 Theo 你看到了什麼。選出過去式句子。", answer: "I saw six sheep.", choices: ["I saw six sheep.","I see six sheep.","I will see six sheep.","I saw six ships."], choicesZh: ["我看到了六隻羊。","我看到六隻羊（現在式）。","我將會看到六隻羊。","我看到了六艘船。"], words: ["I","saw","six","sheep"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There were six sheep. Four more came. How many now?", promptZh: "原本有六隻羊，又來了四隻。現在有幾隻？", answer: "Now there are ten sheep.", choices: ["Now there are ten sheep.","Now there are two sheep.","Now there are six sheep.","Now there are ten cows."], choicesZh: ["現在有十隻羊。","現在有兩隻羊。","現在有六隻羊。","現在有十隻牛。"], words: ["ten","sheep","now"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Compare a cow and a sheep. Pick the correct sentence.", promptZh: "比較牛和羊。選出正確的句子。", answer: "The cow is bigger than the sheep.", choices: ["The cow is bigger than the sheep.","The cow is big than the sheep.","The cow is more big than the sheep.","The cow is bigger then the sheep."], choicesZh: ["牛比羊大。","牛比羊「big than」（錯誤）。","牛比羊「more big」（錯誤）。","牛比羊大（then 拼錯）。"], words: ["bigger","than","cow","sheep"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Why do we bring the hay now? Pick the reason.", promptZh: "為什麼我們現在要送乾草來？選出原因。", answer: "Because the animals are hungry.", choices: ["Because the animals are hungry.","Because the animals are thirsty.","Because the field is empty.","Because the gate is open."], choicesZh: ["因為動物餓了。","因為動物渴了。","因為田裡空了。","因為門開著。"], words: ["because","animals","are","hungry"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Theo is feeding the calm cows now. Pick that sentence.", promptZh: "Theo 正在餵溫馴的牛。選出這個句子。", answer: "Theo is feeding the cows.", choices: ["Theo is feeding the cows.","Theo is counting the cows.","Theo is washing the cows.","Theo is leading the cows."], choicesZh: ["Theo 正在餵牛。","Theo 正在數牛。","Theo 正在幫牛洗澡。","Theo 正在牽牛。"], words: ["is","feeding","the","cows"], reward: jobReward }
    ]
  },
  farm: {
    theme: "farm work",
    title: "Help at the Farm",
    opening: "Auntie Pom needs help picking vegetables and watering the long rows.",
    openingZh: "Pom 阿姨需要有人幫忙採蔬菜、為長長的菜畦澆水。",
    ending: "The rows are watered and the baskets are full. Good work!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Pom about the harvest. Pick the past sentence.", promptZh: "告訴 Pom 採收的情況。選出過去式句子。", answer: "I picked nine carrots.", choices: ["I picked nine carrots.","I pick nine carrots.","I will pick nine carrots.","I picked nine clouds."], choicesZh: ["我採了九根紅蘿蔔。","我採九根紅蘿蔔（現在式）。","我將會採九根紅蘿蔔。","我採了九朵雲。"], words: ["I","picked","nine","carrots"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Pom had twelve carrots and gave five away. How many left?", promptZh: "Pom 有十二根紅蘿蔔，送出五根。還剩幾根？", answer: "Seven carrots are left.", choices: ["Seven carrots are left.","Seventeen carrots are left.","Five carrots are left.","Seven baskets are left."], choicesZh: ["還剩七根紅蘿蔔。","還剩十七根紅蘿蔔。","還剩五根紅蘿蔔。","還剩七個籃子。"], words: ["seven","carrots","are","left"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "The plan for the dry rows. Pick the future sentence.", promptZh: "對乾燥菜畦的計畫。選出未來式句子。", answer: "I am going to water the rows.", choices: ["I am going to water the rows.","I watered the rows tomorrow.","I am going to water the rows yesterday.","I am go to water the rows."], choicesZh: ["我要去幫菜畦澆水。","我明天澆了菜畦（時態錯誤）。","我昨天要去澆菜畦（時間錯誤）。","我「am go to」澆菜畦（錯誤）。"], words: ["going","to","water","rows"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Why do we water the plants? Pick the reason.", promptZh: "為什麼我們要為植物澆水？選出原因。", answer: "Because the plants are thirsty.", choices: ["Because the plants are thirsty.","Because the soil is dry.","Because the sun is hot.","Because the rows are long."], choicesZh: ["因為植物渴了。","因為土壤很乾。","因為太陽很大。","因為菜畦很長。"], words: ["because","plants","are","thirsty"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Pom is filling a big basket now. Pick that sentence.", promptZh: "Pom 正在裝滿一個大籃子。選出這個句子。", answer: "Pom is filling the basket.", choices: ["Pom is filling the basket.","Pom is carrying the basket.","Pom is lifting the basket.","Pom is moving the basket."], choicesZh: ["Pom 正在裝滿籃子。","Pom 正在搬籃子。","Pom 正在抬籃子。","Pom 正在移動籃子。"], words: ["is","filling","the","basket"], reward: jobReward }
    ]
  },
  mill: {
    theme: "mill work",
    title: "Help at the Mill",
    opening: "Miller Bell needs help carrying flour sacks and keeping the floor safe.",
    openingZh: "磨坊主 Bell 需要有人幫忙搬麵粉袋、保持地板安全。",
    ending: "The sacks are stacked and the floor is clean. Well done!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Bell what you did. Pick the past sentence.", promptZh: "告訴 Bell 你做了什麼。選出過去式句子。", answer: "I carried four sacks.", choices: ["I carried four sacks.","I carry four sacks.","I will carry four sacks.","I carried four songs."], choicesZh: ["我搬了四袋。","我搬四袋（現在式）。","我將會搬四袋。","我搬了四首歌。"], words: ["I","carried","four","sacks"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There were eight sacks. The cart took three. How many left?", promptZh: "原本有八袋，馬車載走三袋。還剩幾袋？", answer: "Five sacks are left.", choices: ["Five sacks are left.","Eleven sacks are left.","Three sacks are left.","Five mills are left."], choicesZh: ["還剩五袋。","還剩十一袋。","還剩三袋。","還剩五座磨坊。"], words: ["five","sacks","are","left"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Compare two sacks. Pick the correct comparative sentence.", promptZh: "比較兩袋麵粉。選出正確的比較級句子。", answer: "This sack is heavier than that one.", choices: ["This sack is heavier than that one.","This sack is heavy than that one.","This sack is more heavy than that one.","This sack is heavier then that one."], choicesZh: ["這袋比那袋重。","這袋比那袋「heavy than」（錯誤）。","這袋比那袋「more heavy」（錯誤）。","這袋比那袋重（then 拼錯）。"], words: ["heavier","than","that","sack"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Why do we sweep the floor? Pick the reason.", promptZh: "為什麼我們要掃地？選出原因。", answer: "Because the flour is slippery.", choices: ["Because the flour is slippery.","Because the flour is dusty.","Because the floor is dirty.","Because the sacks are heavy."], choicesZh: ["因為麵粉很滑。","因為麵粉很多灰。","因為地板很髒。","因為麵粉袋很重。"], words: ["because","flour","is","slippery"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Bell is grinding the grain now. Pick that sentence.", promptZh: "Bell 正在磨穀子。選出這個句子。", answer: "Bell is grinding the grain.", choices: ["Bell is grinding the grain.","Bell is carrying the grain.","Bell is pouring the grain.","Bell is weighing the grain."], choicesZh: ["Bell 正在磨穀子。","Bell 正在搬穀子。","Bell 正在倒穀子。","Bell 正在秤穀子。"], words: ["is","grinding","the","grain"], reward: jobReward }
    ]
  },
  villageHome: {
    theme: "village home work",
    title: "Help at the Village Home",
    opening: "Grandma Fina needs help tidying the porch and sorting baskets of apples.",
    openingZh: "Fina 奶奶需要有人幫忙整理門廊、分裝一籃籃的蘋果。",
    ending: "The porch is tidy and the apples are sorted. Thank you, dear!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Grandma what she did. Pick the past sentence.", promptZh: "告訴大家奶奶做了什麼。選出過去式句子。", answer: "Grandma made apple jam.", choices: ["Grandma made apple jam.","Grandma makes apple jam.","Grandma will make apple jam.","Grandma made apple maps."], choicesZh: ["奶奶做了蘋果果醬。","奶奶做蘋果果醬（現在式）。","奶奶將會做蘋果果醬。","奶奶做了蘋果地圖。"], words: ["grandma","made","apple","jam"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "One basket had seven apples, another had two. How many?", promptZh: "一籃有七顆蘋果，另一籃有兩顆。一共幾顆？", answer: "There are nine apples.", choices: ["There are nine apples.","There are five apples.","There are nine baskets.","There are seven apples."], choicesZh: ["一共有九顆蘋果。","一共有五顆蘋果。","一共有九個籃子。","一共有七顆蘋果。"], words: ["there","are","nine","apples"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Why do we sweep the porch? Pick the reason.", promptZh: "為什麼我們要掃門廊？選出原因。", answer: "Because the porch is dusty.", choices: ["Because the porch is dusty.","Because the leaves fell down.","Because the floor is muddy.","Because the steps are dirty."], choicesZh: ["因為門廊很多灰塵。","因為葉子掉下來了。","因為地板很泥濘。","因為台階很髒。"], words: ["because","porch","is","dusty"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Grandma is baking warm bread now. Pick that sentence.", promptZh: "奶奶正在烤溫熱的麵包。選出這個句子。", answer: "Grandma is baking bread.", choices: ["Grandma is baking bread.","Grandma is cutting bread.","Grandma is sharing bread.","Grandma is holding bread."], choicesZh: ["奶奶正在烤麵包。","奶奶正在切麵包。","奶奶正在分麵包。","奶奶正在拿著麵包。"], words: ["is","baking","bread"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Offer to help after the work. Pick the polite future sentence.", promptZh: "工作後主動幫忙。選出有禮貌的未來式句子。", answer: "I will help you again tomorrow.", choices: ["I will help you again tomorrow.","I will help you again yesterday.","I helped you again tomorrow.","I will helps you tomorrow."], choicesZh: ["我明天會再來幫你。","我昨天會再幫你（時間錯誤）。","我明天幫了你（時態錯誤）。","我明天「will helps」（錯誤）。"], words: ["I","will","help","tomorrow"], reward: jobReward }
    ]
  }
});
//#endregion 場景自帶題庫

//#region 生活聊天題庫（issue #135 spec#11）
// ruralChatLessonBank：各生產場景 NPC 的「生活聊天」題組（Movers 程度）——含 How was your day、
//   because 原因、比較級與過去式回顧；答對提升心情並在護眼上限內延長可玩時間、不發 coins。
const chatReward = { coins: 0 };
const ruralChatLessonBank = Object.freeze({
  mine: {
    theme: "chatting with the miner",
    title: "Chat at the Mine",
    opening: "Miner Gemma wipes her hands and smiles hello.",
    openingZh: "礦工 Gemma 擦擦手，微笑著打招呼。",
    ending: "Gemma is glad you stopped for a chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Gemma asks how your day was. Pick a friendly answer.", promptZh: "Gemma 問你今天過得如何。選出友善的回答。", answer: "It was busy but good.", choices: ["It was busy but good.","It is a big rock.","No, you are wrong.","Go away, please."], choicesZh: ["很忙但很充實。","它是一塊大石頭。","不，你錯了。","請走開。"], words: ["it","was","busy","good"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "She looks tired. Pick the kind question to ask.", promptZh: "她看起來很累。選出親切的關心提問。", answer: "Are you tired today?", choices: ["Are you tired today?","Are you a stone today?","Go home now, please.","Give me your cart."], choicesZh: ["你今天累嗎？","你今天是石頭嗎？","現在請回家。","把你的礦車給我。"], words: ["are","you","tired","today"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind thing to say about her work.", promptZh: "選出稱讚她工作的好聽話。", answer: "You work very hard.", choices: ["You work very hard.","You work very lazy.","I do not like you.","Stop talking now."], choicesZh: ["你工作非常認真。","你工作很懶散。","我不喜歡你。","現在別說了。"], words: ["you","work","very","hard"], reward: chatReward }
    ]
  },
  loggingCamp: {
    theme: "chatting with the logger",
    title: "Chat at the Logging Camp",
    opening: "Logger Rowan leans on his axe and waves hello.",
    openingZh: "伐木工 Rowan 靠著斧頭向你揮手問好。",
    ending: "Rowan enjoyed the friendly chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly hello for Rowan.", promptZh: "選出對 Rowan 親切的招呼。", answer: "Good morning, Rowan!", choices: ["Good morning, Rowan!","Go away, Rowan!","Where is my log?","Be quiet, Rowan!"], choicesZh: ["早安，Rowan！","走開，Rowan！","我的木頭在哪？","安靜，Rowan！"], words: ["good","morning","rowan"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Rowan asks why you came. Pick a kind answer.", promptZh: "Rowan 問你為什麼來。選出親切的回答。", answer: "Because I want to help.", choices: ["Because I want to help.","Because I am a tree.","No, I will not.","Give me the axe."], choicesZh: ["因為我想幫忙。","因為我是一棵樹。","不，我不要。","把斧頭給我。"], words: ["because","I","want","help"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind goodbye for Rowan.", promptZh: "選出對 Rowan 友善的道別。", answer: "See you again soon!", choices: ["See you again soon!","Go away fast!","That is wrong!","Give me wood!"], choicesZh: ["很快再見！","快走開！","那是錯的！","把木頭給我！"], words: ["see","you","again","soon"], reward: chatReward }
    ]
  },
  fishingShore: {
    theme: "chatting with the fisher",
    title: "Chat at the Fishing Shore",
    opening: "Fisher Nami sits by the boat and says hello.",
    openingZh: "漁夫 Nami 坐在船邊向你打招呼。",
    ending: "Nami is happy you came to chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly hello for Nami.", promptZh: "選出對 Nami 親切的招呼。", answer: "Hello, Nami! How are you?", choices: ["Hello, Nami! How are you?","Go away, Nami!","Where is my net?","Be quiet, Nami!"], choicesZh: ["你好，Nami！你好嗎？","走開，Nami！","我的網子在哪？","安靜，Nami！"], words: ["hello","how","are","you"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Nami asks about your morning. Pick the past answer.", promptZh: "Nami 問你的早上。選出過去式回答。", answer: "I walked along the shore.", choices: ["I walked along the shore.","I walk along the shore.","I am a small boat.","Go home now, please."], choicesZh: ["我沿著海邊散步了。","我沿著海邊散步（現在式）。","我是一艘小船。","現在請回家。"], words: ["I","walked","the","shore"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind thing to say about the sea.", promptZh: "選出稱讚大海的好聽話。", answer: "The sea is calm and pretty.", choices: ["The sea is calm and pretty.","The sea is silly today.","I do not like the sea.","Throw the net away."], choicesZh: ["大海平靜又漂亮。","大海今天很笨。","我不喜歡大海。","把網子丟掉。"], words: ["the","sea","is","calm"], reward: chatReward }
    ]
  },
  pasture: {
    theme: "chatting with the farmer",
    title: "Chat at the Pasture",
    opening: "Farmer Theo rests by the fence and greets you.",
    openingZh: "農夫 Theo 在圍欄邊休息，向你問候。",
    ending: "Theo enjoyed the friendly chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly hello for Theo.", promptZh: "選出對 Theo 親切的招呼。", answer: "Hi, Theo! Nice to see you.", choices: ["Hi, Theo! Nice to see you.","Go away, Theo!","Where is my cow?","Be quiet, Theo!"], choicesZh: ["嗨，Theo！很高興見到你。","走開，Theo！","我的牛在哪？","安靜，Theo！"], words: ["nice","to","see","you"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Theo asks why you like the pasture. Pick a kind answer.", promptZh: "Theo 問你為什麼喜歡牧場。選出親切的回答。", answer: "Because the animals are sweet.", choices: ["Because the animals are sweet.","Because I am a cow.","No, I do not.","Give me a sheep."], choicesZh: ["因為動物很可愛。","因為我是一頭牛。","不，我不喜歡。","給我一隻羊。"], words: ["because","animals","are","sweet"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind thing to say to Theo.", promptZh: "選出對 Theo 好聽的話。", answer: "Your pasture is so green.", choices: ["Your pasture is so green.","Your pasture is so bad.","I do not like grass.","Stop talking now."], choicesZh: ["你的牧場好翠綠。","你的牧場好糟。","我不喜歡草。","現在別說了。"], words: ["your","pasture","is","green"], reward: chatReward }
    ]
  },
  farm: {
    theme: "chatting at the farm",
    title: "Chat at the Farm",
    opening: "Auntie Pom looks up from the rows and smiles.",
    openingZh: "Pom 阿姨從菜畦間抬起頭微笑。",
    ending: "Auntie Pom is glad you stopped to chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the warm hello for Auntie Pom.", promptZh: "選出對 Pom 阿姨溫暖的招呼。", answer: "Hello, Auntie Pom!", choices: ["Hello, Auntie Pom!","Go away, Pom!","Where is my carrot?","Be quiet, Pom!"], choicesZh: ["你好，Pom 阿姨！","走開，Pom！","我的紅蘿蔔在哪？","安靜，Pom！"], words: ["hello","auntie","pom"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pom asks how you feel. Pick a friendly answer.", promptZh: "Pom 問你的感受。選出友善的回答。", answer: "I feel happy and warm.", choices: ["I feel happy and warm.","I feel like a carrot.","No, you do not.","Go home, Pom."], choicesZh: ["我覺得開心又溫暖。","我覺得自己像紅蘿蔔。","不，你才不是。","回家吧，Pom。"], words: ["I","feel","happy","warm"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind thing to say about her farm.", promptZh: "選出稱讚她農場的好聽話。", answer: "Your vegetables look fresh.", choices: ["Your vegetables look fresh.","Your vegetables look bad.","I do not like farms.","Throw them away."], choicesZh: ["你的蔬菜看起來很新鮮。","你的蔬菜看起來很糟。","我不喜歡農場。","把它們丟掉。"], words: ["vegetables","look","fresh"], reward: chatReward }
    ]
  },
  mill: {
    theme: "chatting with the miller",
    title: "Chat at the Mill",
    opening: "Miller Bell dusts off the flour and waves hello.",
    openingZh: "磨坊主 Bell 拍掉麵粉，揮手問好。",
    ending: "Bell enjoyed the friendly chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly hello for Bell.", promptZh: "選出對 Bell 親切的招呼。", answer: "Good day, Bell!", choices: ["Good day, Bell!","Go away, Bell!","Where is my flour?","Be quiet, Bell!"], choicesZh: ["午安，Bell！","走開，Bell！","我的麵粉在哪？","安靜，Bell！"], words: ["good","day","bell"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Bell asks why the mill is your favourite. Pick a kind answer.", promptZh: "Bell 問你為什麼最喜歡磨坊。選出親切的回答。", answer: "Because the bread smells nice.", choices: ["Because the bread smells nice.","Because I am a sack.","No, it is not.","Give me the grain."], choicesZh: ["因為麵包聞起來很香。","因為我是一個麵粉袋。","不，才不是。","把穀子給我。"], words: ["because","bread","smells","nice"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the polite thank-you for Bell.", promptZh: "選出對 Bell 有禮貌的道謝。", answer: "Thank you for the warm bread.", choices: ["Thank you for the warm bread.","No, it is bad.","Give me more now.","I do not like it."], choicesZh: ["謝謝你的溫熱麵包。","不，它很糟。","現在再給我一些。","我不喜歡它。"], words: ["thank","you","warm","bread"], reward: chatReward }
    ]
  },
  villageHome: {
    theme: "chatting with grandma",
    title: "Chat at the Village Home",
    opening: "Grandma Fina pats the bench and asks you to sit.",
    openingZh: "Fina 奶奶拍拍長椅，請你坐下。",
    ending: "Grandma Fina loved your friendly visit.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the warm hello for Grandma Fina.", promptZh: "選出對 Fina 奶奶溫暖的招呼。", answer: "Hello, Grandma! How are you?", choices: ["Hello, Grandma! How are you?","Go away, Grandma!","Where is my apple?","Be quiet, Grandma!"], choicesZh: ["你好，奶奶！您好嗎？","走開，奶奶！","我的蘋果在哪？","安靜，奶奶！"], words: ["hello","how","are","you"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Grandma asks about your visit. Pick the past answer.", promptZh: "奶奶問起你的來訪。選出過去式回答。", answer: "I came to see you.", choices: ["I came to see you.","I come to see you.","I am a red apple.","Go home now, please."], choicesZh: ["我是來看您的。","我來看您（現在式）。","我是一顆紅蘋果。","現在請回家。"], words: ["I","came","to","see"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind thing to say to Grandma.", promptZh: "選出對奶奶好聽的話。", answer: "Your home is warm and cosy.", choices: ["Your home is warm and cosy.","Your home is cold and sad.","I do not like it here.","Give me your basket."], choicesZh: ["您的家溫暖又舒適。","您的家又冷又悲傷。","我不喜歡這裡。","把您的籃子給我。"], words: ["your","home","warm","cosy"], reward: chatReward }
    ]
  },
  workwearStall: {
    theme: "chatting at the workwear stall",
    title: "Chat at the Workwear Stall",
    opening: "The Workwear Keeper folds a shirt and says hello.",
    openingZh: "工作服管理員摺著襯衫向你打招呼。",
    ending: "The Keeper enjoyed the friendly chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly hello.", promptZh: "選出親切的招呼。", answer: "Hello! How are you today?", choices: ["Hello! How are you today?","Go away, please.","Where is my hat?","Be quiet now."], choicesZh: ["你好！你今天好嗎？","請走開。","我的帽子在哪？","現在安靜。"], words: ["how","are","you","today"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind thing to say about the clothes.", promptZh: "選出稱讚衣服的好聽話。", answer: "These clothes look very strong.", choices: ["These clothes look very strong.","These clothes are ugly.","I do not like your stall.","Give me them for free."], choicesZh: ["這些衣服看起來很耐穿。","這些衣服很醜。","我不喜歡你的攤位。","免費給我。"], words: ["clothes","look","very","strong"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the polite thank-you.", promptZh: "選出有禮貌的道謝。", answer: "Thank you for your help.", choices: ["Thank you for your help.","No, you are no help.","Give me more now.","Go away, please."], choicesZh: ["謝謝你的幫忙。","不，你一點忙都幫不上。","現在再給我一些。","請走開。"], words: ["thank","you","for","help"], reward: chatReward }
    ]
  },
  fieldCobbler: {
    theme: "chatting with the cobbler",
    title: "Chat with the Field Cobbler",
    opening: "The Field Cobbler taps a shoe and waves hello.",
    openingZh: "鄉野鞋匠敲敲鞋子，揮手問好。",
    ending: "The Cobbler enjoyed the friendly chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly hello.", promptZh: "選出親切的招呼。", answer: "Good morning! Nice to see you.", choices: ["Good morning! Nice to see you.","Go away from my shop.","Where are my socks?","Be quiet, please."], choicesZh: ["早安！很高興見到你。","從我的店走開。","我的襪子在哪？","請安靜。"], words: ["nice","to","see","you"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "He asks why you walk so much. Pick the reason.", promptZh: "他問你為什麼走那麼多路。選出原因。", answer: "I walk a lot because the roads are long.", choices: ["I walk a lot because the roads are long.","I walk a lot because I am very lazy.","I never walk anywhere at all.","Give me free shoes now."], choicesZh: ["我走很多路，因為路很長。","我走很多路，因為我很懶。","我從來都不走路。","現在免費給我鞋子。"], words: ["because","roads","are","long"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind thing to say about the shoes.", promptZh: "選出稱讚鞋子的好聽話。", answer: "These shoes look very strong.", choices: ["These shoes look very strong.","These shoes look terrible.","I do not like your shop.","Throw them away now."], choicesZh: ["這雙鞋看起來很耐穿。","這雙鞋看起來很糟。","我不喜歡你的店。","現在把它們丟掉。"], words: ["shoes","look","very","strong"], reward: chatReward }
    ]
  }
});
//#endregion 生活聊天題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
export const ruralSceneConfigs = mergeLessons(mergeLessons({
  ruralExit: { ...ruralProductionArt("farm"), scene: "scene-rural-exit", npcClass: "npc-none", npc: "Rural Sign", travelAction: "World Map", travelLine: "The road returns to the kingdom world map." },
  mine: { ...ruralProductionArt("mine"), scene: "scene-rural-mine", npc: "Miner Gemma", npcImage: npcImage("miner-gemma"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Miner Gemma is sorting shiny stones." },
  loggingCamp: { ...ruralProductionArt("logging"), scene: "scene-rural-logging", npc: "Logger Rowan", npcImage: npcImage("logger-rowan"), npcNaturalHeightCm: 178, travelAction: "Visit", travelLine: "Logger Rowan stacks logs beside the cabin." },
  fishingShore: { ...ruralProductionArt("fishing"), scene: "scene-rural-fishing", npc: "Fisher Nami", npcImage: npcImage("fisher-nami"), npcNaturalHeightCm: 160, travelAction: "Visit", travelLine: "Fisher Nami pulls a net near the bright shore." },
  pasture: { ...ruralProductionArt("pasture"), scene: "scene-rural-pasture", npc: "Farmer Theo", npcImage: npcImage("farmer-theo"), npcNaturalHeightCm: 175, travelAction: "Visit", travelLine: "Farmer Theo counts animals in the pasture." },
  farm: { ...ruralProductionArt("farm"), scene: "scene-rural-farm", npc: "Auntie Pom", npcImage: npcImage("auntie-pom"), npcNaturalHeightCm: 155, travelAction: "Visit", travelLine: "Auntie Pom waters vegetables and wheat." },
  mill: { ...ruralProductionArt("mill"), scene: "scene-rural-mill", npc: "Miller Bell", npcImage: npcImage("miller-bell"), npcNaturalHeightCm: 162, travelAction: "Visit", travelLine: "Miller Bell carries flour by the windmill." },
  workwearStall: { ...ruralShopArt("workwear-stall"), scene: "scene-rural-workwear-stall", npc: "Workwear Keeper", npcImage: npcImage("workwear-stall-keeper"), npcNaturalHeightCm: 168, travelAction: "Shop", travelLine: "The Workwear Keeper has sturdy tops and bottoms.", shopGreeting: "Welcome to the Workwear Stall. Pick tops or bottoms." },
  fieldCobbler: { ...ruralShopArt("field-cobbler"), scene: "scene-rural-field-cobbler", npc: "Field Cobbler", npcImage: npcImage("field-cobbler"), npcNaturalHeightCm: 165, travelAction: "Shop", travelLine: "The Field Cobbler has shoes and hats for country roads.", shopGreeting: "Welcome to the Field Cobbler. Pick shoes or hats." },
  villageHome: { ...ruralProductionArt("home"), scene: "scene-rural-home", npc: "Grandma Fina", npcImage: npcImage("grandma-fina"), npcNaturalHeightCm: 148, travelAction: "Visit", travelLine: "Grandma Fina tidies the warm village porch." }
}, ruralLessonBank, { area: "rural", vocabProfile: ruralVocabularyProfile.id }),
  ruralChatLessonBank, { area: "rural", vocabProfile: ruralVocabularyProfile.id }, "chatLesson");
//#endregion 對話場景設定
