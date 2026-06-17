//#region 匯入共用工具
// 將題庫清單轉成遊戲執行時需要的 lessons（課程資料）與 quest templates（任務模板）。
import { mergeLessons } from "../_shared/lesson-helpers.js";
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
    { id: "fairyAtelier", area: "wild", node: "fairyAtelier", label: "Fairy Atelier", icon: "👗", npc: "Faye", scene: "scene-wild-fairy-atelier", npcImage: npcImage("fairy-atelier"), shopCategories: ["dresses", "accessories"], defaultCategory: "dresses", hint: "Faye sells fairy dresses and accessories in the glade." },
    { id: "dwarfCottage", area: "wild", node: "dwarfCottage", label: "Dwarf Cottage", icon: "🛖", npc: "Pip", scene: "scene-wild-dwarf-cottage", npcImage: npcImage("pip"), shopCategories: ["outerwear", "shoes"], defaultCategory: "outerwear", hint: "Pip keeps handmade wild outerwear and shoes in a warm cottage." },
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

//#region 場景自帶題庫（issue #96 結構；issue #135 內容研改）
// wildLessonBank：以 place 為鍵的「打工任務」題庫（答對得 coins＝勞動所得）。
// issue #135 句型分級：Cambridge Flyers——現在完成式（have/has + p.p.）／過去進行式＋when 子句／
//   第一條件句（if … will）／關係子句（who·which·that）／embedded question 語序／will·should·could。
// 生活化：保留各場景奇幻主體（精靈／矮人／石巨人／半身人／巫師／小紅帽／三隻小豬／樹靈），
//   但改以真實生活的溝通功能（幫忙、詢問、計畫、好意）承載；移除超現實干擾項（吃城堡／煮月亮／
//   狼讀地圖），干擾項改為 Flyers 程度的時態／語序／關係代名詞常見錯誤。
const jobReward = { coins: 2000 };
const wildLessonBank = Object.freeze({
  elfGlade: {
    theme: "elf glade work",
    title: "Help in the Elf Glade",
    opening: "Elia the elf has lost the silver bell among the glowing flowers.",
    openingZh: "精靈 Elia 把銀鈴弄丟在發光的花叢裡了。",
    ending: "The silver bell rings again and the glade glows. Wonderful!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Elia your progress. Pick the present perfect sentence.", promptZh: "告訴 Elia 你的進度。選出現在完成式句子。", answer: "I have watered all the flowers.", choices: ["I have watered all the flowers.","I have water all the flowers.","I has watered all the flowers.","I watering all the flowers."], choicesZh: ["我已經把所有的花都澆過水了。","我已經「water」所有的花（動詞未變化）。","我「has watered」所有的花（主詞錯）。","我「watering」所有的花（缺助動詞）。"], words: ["I","have","watered","flowers"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Say which flower hides the bell. Pick the relative-clause sentence.", promptZh: "說出哪朵花藏著鈴鐺。選出含關係子句的句子。", answer: "The flower which glows is hiding the bell.", choices: ["The flower which glows is hiding the bell.","The flower who glows is hiding the bell.","The flower which glow is hiding the bell.","The flower glows which is hiding the bell."], choicesZh: ["那朵發光的花藏著鈴鐺。","那朵發光的花（用 who 指物，錯）。","那朵花「which glow」（動詞未變化）。","語序錯誤的句子。"], words: ["flower","which","glows","bell"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Make a plan with Elia. Pick the correct 'if' sentence.", promptZh: "和 Elia 一起計畫。選出正確的條件句。", answer: "If we ring the bell, the elves will come.", choices: ["If we ring the bell, the elves will come.","If we ring the bell, the elves came.","If we rang the bell, the elves will come.","If we ring the bell, the elves come will."], choicesZh: ["如果我們搖鈴，精靈們就會來。","如果我們搖鈴，精靈們「came」（時態錯）。","如果我們「rang」搖鈴（時態錯）。","語序錯誤（come will）。"], words: ["if","ring","elves","will","come"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Elia was singing when you arrived. Pick that sentence.", promptZh: "你到達時 Elia 正在唱歌。選出這個句子。", answer: "Elia was singing when I arrived.", choices: ["Elia was singing when I arrived.","Elia was sing when I arrived.","Elia is singing when I arrived.","Elia sang when I was arrive."], choicesZh: ["我到達時，Elia 正在唱歌。","Elia「was sing」（動詞錯）。","用現在進行式（時態不一致）。","「was arrive」（錯誤）。"], words: ["was","singing","when","arrived"], reward: jobReward },
      { questionType: "question-choice", prompt: "Ask Elia politely where to look. Pick the question.", promptZh: "有禮貌地問 Elia 該去哪裡找。選出這個問句。", answer: "Could you show me where the bell is?", choices: ["Could you show me where the bell is?","Could you show me where is the bell?","Can you showed me where the bell?","Could you showing me where the bell?"], choicesZh: ["可以請你告訴我鈴鐺在哪裡嗎？","間接問句語序錯（where is the bell）。","「showed」時態錯。","「showing」形式錯。"], words: ["could","you","show","where","bell"], reward: jobReward }
    ]
  },
  dwarfCottage: {
    theme: "dwarf workshop work",
    title: "Help at the Dwarf Cottage",
    opening: "Pip the dwarf needs help mending the cartwheel that rolled behind the bench.",
    openingZh: "小矮人 Pip 需要有人幫忙修好那個滾到工作檯後面的車輪。",
    ending: "The cartwheel turns smoothly again. Great work!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Pip what you found. Pick the present perfect sentence.", promptZh: "告訴 Pip 你找到了什麼。選出現在完成式句子。", answer: "I have found the missing wheel.", choices: ["I have found the missing wheel.","I have find the missing wheel.","I has found the missing wheel.","I have founded the missing wheel."], choicesZh: ["我已經找到那個不見的車輪了。","「have find」（動詞未變化）。","「has found」（主詞錯）。","「founded」（過去分詞錯）。"], words: ["I","have","found","wheel"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Describe the tool Pip wants. Pick the relative-clause sentence.", promptZh: "描述 Pip 要的工具。選出含關係子句的句子。", answer: "The hammer that Pip made is on the bench.", choices: ["The hammer that Pip made is on the bench.","The hammer who Pip made is on the bench.","The hammer that Pip make is on the bench.","The hammer that made Pip is on the bench."], choicesZh: ["Pip 做的那把鎚子在工作檯上。","用 who 指物（錯）。","「Pip make」（時態錯）。","語意顛倒（鎚子做了 Pip）。"], words: ["hammer","that","Pip","made"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Make a plan with Pip. Pick the correct 'if' sentence.", promptZh: "和 Pip 一起計畫。選出正確的條件句。", answer: "If we fix the wheel, the cart will move.", choices: ["If we fix the wheel, the cart will move.","If we fix the wheel, the cart moved.","If we fixed the wheel, the cart will move.","If we fix the wheel, the cart will moved."], choicesZh: ["如果我們修好車輪，推車就會動。","「cart moved」（時態錯）。","「fixed」（時態錯）。","「will moved」（錯）。"], words: ["if","fix","wheel","cart","will","move"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Pip was hammering when you knocked. Pick that sentence.", promptZh: "你敲門時 Pip 正在敲打。選出這個句子。", answer: "Pip was hammering when I knocked.", choices: ["Pip was hammering when I knocked.","Pip was hammer when I knocked.","Pip is hammering when I knocked.","Pip hammered when I was knock."], choicesZh: ["我敲門時，Pip 正在敲打。","「was hammer」（動詞錯）。","現在進行式（時態不一致）。","「was knock」（錯誤）。"], words: ["was","hammering","when","knocked"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Offer help politely. Pick the polite sentence.", promptZh: "有禮貌地主動幫忙。選出有禮貌的句子。", answer: "Would you like me to hold the wheel?", choices: ["Would you like me to hold the wheel?","Would you like me holding the wheel?","Do you like me hold the wheel?","Would you liked me to hold the wheel?"], choicesZh: ["你需要我幫你扶住車輪嗎？","「me holding」（形式錯）。","「Do you like me hold」（錯）。","「would you liked」（時態錯）。"], words: ["would","you","like","hold","wheel"], reward: jobReward }
    ]
  },
  stoneGolemPass: {
    theme: "golem pass work",
    title: "Help at Stone Golem Pass",
    opening: "Goro the friendly golem cannot read the old sign because moss has covered it.",
    openingZh: "友善的石巨人 Goro 看不懂舊告示牌，因為青苔蓋住它了。",
    ending: "The sign is clean and the pass is open. Well done!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Goro your progress. Pick the present perfect sentence.", promptZh: "告訴 Goro 你的進度。選出現在完成式句子。", answer: "I have cleaned half of the sign.", choices: ["I have cleaned half of the sign.","I have clean half of the sign.","I has cleaned half of the sign.","I have cleaning half of the sign."], choicesZh: ["我已經把告示牌清了一半。","「have clean」（動詞未變化）。","「has cleaned」（主詞錯）。","「have cleaning」（形式錯）。"], words: ["I","have","cleaned","sign"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Describe the rock that blocks the road. Pick the relative-clause sentence.", promptZh: "描述擋路的那塊岩石。選出含關係子句的句子。", answer: "The rock which fell is blocking the road.", choices: ["The rock which fell is blocking the road.","The rock who fell is blocking the road.","The rock which fall is blocking the road.","The rock blocking which fell the road."], choicesZh: ["那塊掉下來的岩石擋住了路。","用 who 指物（錯）。","「which fall」（時態錯）。","語序錯誤。"], words: ["rock","which","fell","blocking","road"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Make a plan with Goro. Pick the correct 'if' sentence.", promptZh: "和 Goro 一起計畫。選出正確的條件句。", answer: "If we move the rock, travellers will pass safely.", choices: ["If we move the rock, travellers will pass safely.","If we move the rock, travellers passed safely.","If we moved the rock, travellers will pass safely.","If we move the rock, travellers will passed safely."], choicesZh: ["如果我們移開岩石，旅人就能安全通過。","「passed」（時態錯）。","「moved」（時態錯）。","「will passed」（錯）。"], words: ["if","move","rock","will","pass"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Goro was guarding the pass when you came. Pick that sentence.", promptZh: "你來時 Goro 正在守著山道。選出這個句子。", answer: "Goro was guarding the pass when I came.", choices: ["Goro was guarding the pass when I came.","Goro was guard the pass when I came.","Goro is guarding the pass when I came.","Goro guarded the pass when I was come."], choicesZh: ["我來時，Goro 正在守著山道。","「was guard」（動詞錯）。","現在進行式（時態不一致）。","「was come」（錯誤）。"], words: ["was","guarding","when","came"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Be kind to Goro. Pick the encouraging sentence.", promptZh: "對 Goro 友善一點。選出鼓勵的句子。", answer: "You are stronger than you think, Goro.", choices: ["You are stronger than you think, Goro.","You are strong than you think, Goro.","You are the stronger than you think, Goro.","You are more strong than you think, Goro."], choicesZh: ["你比你想的還要強壯，Goro。","「strong than」（比較級錯）。","「the stronger than」（錯）。","「more strong」（錯）。"], words: ["stronger","than","you","think"], reward: jobReward }
    ]
  },
  halflingVillage: {
    theme: "halfling village work",
    title: "Help in Halfling Village",
    opening: "Penny the halfling has lost the picnic basket among the many round doors.",
    openingZh: "半身人 Penny 把野餐籃弄丟在眾多圓門之間了。",
    ending: "The basket is found and the picnic can begin. Thank you!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Penny your progress. Pick the present perfect sentence.", promptZh: "告訴 Penny 你的進度。選出現在完成式句子。", answer: "I have checked six doors already.", choices: ["I have checked six doors already.","I have check six doors already.","I has checked six doors already.","I have checking six doors already."], choicesZh: ["我已經檢查過六扇門了。","「have check」（動詞未變化）。","「has checked」（主詞錯）。","「have checking」（形式錯）。"], words: ["I","have","checked","doors"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are ten doors; four are open. Pick the sentence for the rest.", promptZh: "有十扇門，四扇是開的。選出說明其餘的句子。", answer: "Six doors are still closed.", choices: ["Six doors are still closed.","Fourteen doors are still closed.","Four doors are still closed.","Six windows are still closed."], choicesZh: ["還有六扇門是關著的。","還有十四扇門關著（算錯）。","還有四扇門關著（算錯）。","還有六扇窗關著（名詞錯）。"], words: ["six","doors","still","closed"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Describe the door that hides the basket. Pick the relative-clause sentence.", promptZh: "描述藏著籃子的那扇門。選出含關係子句的句子。", answer: "The door which is green hides the basket.", choices: ["The door which is green hides the basket.","The door who is green hides the basket.","The door which are green hides the basket.","The door green which is hides the basket."], choicesZh: ["那扇綠色的門藏著籃子。","用 who 指物（錯）。","「which are green」（單複數錯）。","語序錯誤。"], words: ["door","which","green","basket"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Make a plan with Penny. Pick the correct 'if' sentence.", promptZh: "和 Penny 一起計畫。選出正確的條件句。", answer: "If we find the basket, the picnic will start.", choices: ["If we find the basket, the picnic will start.","If we find the basket, the picnic started.","If we found the basket, the picnic will start.","If we find the basket, the picnic will started."], choicesZh: ["如果我們找到籃子，野餐就會開始。","「picnic started」（時態錯）。","「found」（時態錯）。","「will started」（錯）。"], words: ["if","find","basket","will","start"], reward: jobReward },
      { questionType: "question-choice", prompt: "Ask Penny politely for a hint. Pick the question.", promptZh: "有禮貌地向 Penny 問線索。選出這個問句。", answer: "Can you tell me which door is yours?", choices: ["Can you tell me which door is yours?","Can you tell me which door is your?","Can you tell me which is door yours?","Can you told me which door is yours?"], choicesZh: ["可以告訴我哪一扇門是你的嗎？","「is your」（所有格錯）。","語序錯誤。","「told」時態錯。"], words: ["can","you","tell","which","door"], reward: jobReward }
    ]
  },
  wizardHut: {
    theme: "wizard hut work",
    title: "Help at the Wizard Hut",
    opening: "Wiz Beryl needs help labelling the herb jars on the very high shelf.",
    openingZh: "巫師 Beryl 需要有人幫忙在很高的架子上替藥草罐貼標籤。",
    ending: "Every jar is labelled and the shelf is tidy. Excellent!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Beryl your progress. Pick the present perfect sentence.", promptZh: "告訴 Beryl 你的進度。選出現在完成式句子。", answer: "I have labelled three jars.", choices: ["I have labelled three jars.","I have label three jars.","I has labelled three jars.","I have labelling three jars."], choicesZh: ["我已經貼好三個罐子了。","「have label」（動詞未變化）。","「has labelled」（主詞錯）。","「have labelling」（形式錯）。"], words: ["I","have","labelled","jars"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Describe the jar Beryl wants. Pick the relative-clause sentence.", promptZh: "描述 Beryl 要的罐子。選出含關係子句的句子。", answer: "The jar that glows blue is the herb jar.", choices: ["The jar that glows blue is the herb jar.","The jar who glows blue is the herb jar.","The jar that glow blue is the herb jar.","The jar glows that blue is the herb jar."], choicesZh: ["那個發藍光的罐子就是藥草罐。","用 who 指物（錯）。","「that glow」（動詞未變化）。","語序錯誤。"], words: ["jar","that","glows","herb"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Make a plan with Beryl. Pick the correct 'if' sentence.", promptZh: "和 Beryl 一起計畫。選出正確的條件句。", answer: "If we use the ladder, we will reach the shelf.", choices: ["If we use the ladder, we will reach the shelf.","If we use the ladder, we reached the shelf.","If we used the ladder, we will reach the shelf.","If we use the ladder, we will reached the shelf."], choicesZh: ["如果我們用梯子，就能搆到架子。","「we reached」（時態錯）。","「used」（時態錯）。","「will reached」（錯）。"], words: ["if","use","ladder","will","reach"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Beryl was mixing herbs when you arrived. Pick that sentence.", promptZh: "你到達時 Beryl 正在調配藥草。選出這個句子。", answer: "Beryl was mixing herbs when I arrived.", choices: ["Beryl was mixing herbs when I arrived.","Beryl was mix herbs when I arrived.","Beryl is mixing herbs when I arrived.","Beryl mixed herbs when I was arrive."], choicesZh: ["我到達時，Beryl 正在調配藥草。","「was mix」（動詞錯）。","現在進行式（時態不一致）。","「was arrive」（錯誤）。"], words: ["was","mixing","when","arrived"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Stay safe near the jars. Pick the careful advice.", promptZh: "在罐子旁要注意安全。選出小心的建議。", answer: "We should hold each jar with both hands.", choices: ["We should hold each jar with both hands.","We should holding each jar with both hands.","We should held each jar with both hands.","We shoulds hold each jar with both hands."], choicesZh: ["我們應該用雙手拿好每個罐子。","「should holding」（形式錯）。","「should held」（形式錯）。","「shoulds」（錯）。"], words: ["should","hold","each","jar"], reward: jobReward }
    ]
  },
  redHoodPath: {
    theme: "red hood path work",
    title: "Help on Red Riding Hood Path",
    opening: "Ruby needs help clearing the fallen leaves that hide her grandma's basket.",
    openingZh: "Ruby 需要有人幫忙清掉蓋住外婆籃子的落葉。",
    ending: "The path is clear and the basket is ready. Lovely work!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Ruby your progress. Pick the present perfect sentence.", promptZh: "告訴 Ruby 你的進度。選出現在完成式句子。", answer: "I have cleared the leaves.", choices: ["I have cleared the leaves.","I have clear the leaves.","I has cleared the leaves.","I have clearing the leaves."], choicesZh: ["我已經把落葉清掉了。","「have clear」（動詞未變化）。","「has cleared」（主詞錯）。","「have clearing」（形式錯）。"], words: ["I","have","cleared","leaves"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Say who the basket is for. Pick the relative-clause sentence.", promptZh: "說出籃子是給誰的。選出含關係子句的句子。", answer: "The basket is for Grandma, who is ill.", choices: ["The basket is for Grandma, who is ill.","The basket is for Grandma, which is ill.","The basket is for Grandma, who are ill.","The basket is for Grandma, who ill is."], choicesZh: ["籃子是要給生病的外婆的。","用 which 指人（錯）。","「who are ill」（單複數錯）。","語序錯誤。"], words: ["basket","Grandma","who","ill"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Make a plan with Ruby. Pick the correct 'if' sentence.", promptZh: "和 Ruby 一起計畫。選出正確的條件句。", answer: "If we hurry, we will reach Grandma before dark.", choices: ["If we hurry, we will reach Grandma before dark.","If we hurry, we reached Grandma before dark.","If we hurried, we will reach Grandma before dark.","If we hurry, we will reached Grandma before dark."], choicesZh: ["如果我們快一點，就能在天黑前到外婆家。","「we reached」（時態錯）。","「hurried」（時態錯）。","「will reached」（錯）。"], words: ["if","hurry","will","reach","before","dark"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Give Ruby safe advice for the path. Pick the careful sentence.", promptZh: "給 Ruby 走路的安全建議。選出小心的句子。", answer: "We should stay on the path and not talk to strangers.", choices: ["We should stay on the path and not talk to strangers.","We should staying on the path and not talk to strangers.","We should stayed on the path and not talk to strangers.","We should stay on the path or talk to strangers."], choicesZh: ["我們應該走在路上，不要和陌生人說話。","「should staying」（形式錯）。","「should stayed」（形式錯）。","用 or 使語意相反（錯）。"], words: ["should","stay","path","not","strangers"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Ruby was walking when she dropped the basket. Pick that sentence.", promptZh: "Ruby 走著走著把籃子掉了。選出這個句子。", answer: "Ruby was walking when she dropped the basket.", choices: ["Ruby was walking when she dropped the basket.","Ruby was walk when she dropped the basket.","Ruby is walking when she dropped the basket.","Ruby walked when she was drop the basket."], choicesZh: ["Ruby 走路時把籃子掉了。","「was walk」（動詞錯）。","現在進行式（時態不一致）。","「was drop」（錯誤）。"], words: ["was","walking","when","dropped"], reward: jobReward }
    ]
  },
  threePigsCottage: {
    theme: "three pigs cottage work",
    title: "Help at the Three Pigs Cottage",
    opening: "Pippo the piglet needs help tying down the straw roof before the wind returns.",
    openingZh: "小豬 Pippo 需要有人幫忙在風再起前把稻草屋頂綁牢。",
    ending: "The roof is tied tight and the cottages are safe. Great job!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Pippo your progress. Pick the present perfect sentence.", promptZh: "告訴 Pippo 你的進度。選出現在完成式句子。", answer: "I have tied the straw down.", choices: ["I have tied the straw down.","I have tie the straw down.","I has tied the straw down.","I have tying the straw down."], choicesZh: ["我已經把稻草綁好了。","「have tie」（動詞未變化）。","「has tied」（主詞錯）。","「have tying」（形式錯）。"], words: ["I","have","tied","straw"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "There are three cottages; one is brick. Pick the sentence for the rest.", promptZh: "有三間屋子，一間是磚造的。選出說明其餘的句子。", answer: "Two cottages are made of straw.", choices: ["Two cottages are made of straw.","Three cottages are made of straw.","Two cottages are made of brick.","Two castles are made of straw."], choicesZh: ["有兩間屋子是稻草做的。","三間都是稻草做的（算錯）。","兩間是磚造的（材質錯）。","兩座城堡是稻草做的（名詞錯）。"], words: ["two","cottages","made","straw"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Say which house is safest. Pick the relative-clause sentence.", promptZh: "說出哪間房子最安全。選出含關係子句的句子。", answer: "The house that is built of brick is the strongest.", choices: ["The house that is built of brick is the strongest.","The house who is built of brick is the strongest.","The house that is built of brick is the stronger.","The house that build of brick is the strongest."], choicesZh: ["磚造的那間房子最堅固。","用 who 指物（錯）。","用比較級 stronger（最高級錯）。","「that build」（被動／時態錯）。"], words: ["house","that","brick","strongest"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Make a plan with Pippo. Pick the correct 'if' sentence.", promptZh: "和 Pippo 一起計畫。選出正確的條件句。", answer: "If the wind blows, the brick house will stand.", choices: ["If the wind blows, the brick house will stand.","If the wind blows, the brick house stood.","If the wind blew, the brick house will stand.","If the wind blows, the brick house will stood."], choicesZh: ["如果風吹來，磚房就會屹立不倒。","「house stood」（時態錯）。","「blew」（時態錯）。","「will stood」（錯）。"], words: ["if","wind","blows","will","stand"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Pippo was building when the wind came. Pick that sentence.", promptZh: "風來時 Pippo 正在蓋房子。選出這個句子。", answer: "Pippo was building when the wind came.", choices: ["Pippo was building when the wind came.","Pippo was build when the wind came.","Pippo is building when the wind came.","Pippo built when the wind was come."], choicesZh: ["風來時，Pippo 正在蓋房子。","「was build」（動詞錯）。","現在進行式（時態不一致）。","「was come」（錯誤）。"], words: ["was","building","when","came"], reward: jobReward }
    ]
  },
  treeSpiritGrove: {
    theme: "tree spirit grove work",
    title: "Help in the Tree Spirit Grove",
    opening: "Sylvie the tree spirit needs help planting the glowing seed before night falls.",
    openingZh: "樹靈 Sylvie 需要有人幫忙在入夜前種下發光的種子。",
    ending: "The seed glows softly and the grove is calm. Beautiful work!",
    questions: [
      { questionType: "sentence-choice", prompt: "Tell Sylvie your progress. Pick the present perfect sentence.", promptZh: "告訴 Sylvie 你的進度。選出現在完成式句子。", answer: "I have planted the glowing seed.", choices: ["I have planted the glowing seed.","I have plant the glowing seed.","I has planted the glowing seed.","I have planting the glowing seed."], choicesZh: ["我已經把發光的種子種下了。","「have plant」（動詞未變化）。","「has planted」（主詞錯）。","「have planting」（形式錯）。"], words: ["I","have","planted","seed"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Say which tree is the oldest. Pick the relative-clause sentence.", promptZh: "說出哪棵樹最古老。選出含關係子句的句子。", answer: "The tree that whispers is the oldest one.", choices: ["The tree that whispers is the oldest one.","The tree who whispers is the oldest one.","The tree that whisper is the oldest one.","The tree that whispers is the older one."], choicesZh: ["那棵會低語的樹是最古老的。","用 who 指物（錯）。","「that whisper」（動詞未變化）。","用比較級 older（最高級錯）。"], words: ["tree","that","whispers","oldest"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Make a plan with Sylvie. Pick the correct 'if' sentence.", promptZh: "和 Sylvie 一起計畫。選出正確的條件句。", answer: "If the seed gets moonlight, it will grow.", choices: ["If the seed gets moonlight, it will grow.","If the seed gets moonlight, it grew.","If the seed got moonlight, it will grow.","If the seed gets moonlight, it will grew."], choicesZh: ["如果種子照到月光，它就會生長。","「it grew」（時態錯）。","「got」（時態錯）。","「will grew」（錯）。"], words: ["if","seed","moonlight","will","grow"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Sylvie was glowing softly when you came. Pick that sentence.", promptZh: "你來時 Sylvie 正在輕輕發光。選出這個句子。", answer: "Sylvie was glowing when I came.", choices: ["Sylvie was glowing when I came.","Sylvie was glow when I came.","Sylvie is glowing when I came.","Sylvie glowed when I was come."], choicesZh: ["我來時，Sylvie 正在輕輕發光。","「was glow」（動詞錯）。","現在進行式（時態不一致）。","「was come」（錯誤）。"], words: ["was","glowing","when","came"], reward: jobReward },
      { questionType: "sentence-choice", prompt: "Thank Sylvie kindly. Pick the warm sentence.", promptZh: "親切地謝謝 Sylvie。選出溫暖的句子。", answer: "Thank you for letting me help today.", choices: ["Thank you for letting me help today.","Thank you for let me help today.","Thank you for letting me to help today.","Thank you for letting me helped today."], choicesZh: ["謝謝你今天讓我幫忙。","「for let me」（形式錯）。","「letting me to help」（多餘 to）。","「me helped」（形式錯）。"], words: ["thank","you","letting","help"], reward: jobReward }
    ]
  }
});
//#endregion 場景自帶題庫

//#region 生活聊天題庫（issue #135 spec#11）
// wildChatLessonBank：各 NPC 場景的「生活聊天」題組（Flyers 程度）——How have you been、第一條件句的
//   好意提議、關係子句稱讚、過去進行式回顧；答對提升心情並在護眼上限內延長可玩時間、不發 coins。
const chatReward = { coins: 0 };
const wildChatLessonBank = Object.freeze({
  elfGlade: {
    theme: "chatting with the elf",
    title: "Chat in the Elf Glade",
    opening: "Elia the elf greets you among the glowing flowers.",
    openingZh: "精靈 Elia 在發光的花叢間問候你。",
    ending: "Elia hums a happy tune. What a lovely chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly greeting for Elia.", promptZh: "選出對 Elia 親切的招呼。", answer: "Hi Elia, how have you been?", choices: ["Hi Elia, how have you been?","Hi Elia, how you have been?","Hi Elia, how have you was?","Hi Elia, how been you have?"], choicesZh: ["嗨 Elia，你最近好嗎？","語序錯誤。","「how have you was」（錯）。","語序錯誤。"], words: ["how","have","you","been"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Elia looks busy. Pick the kind offer to help.", promptZh: "Elia 看起來很忙。選出親切的幫忙提議。", answer: "If you are busy, I can help you.", choices: ["If you are busy, I can help you.","If you are busy, I helped you.","If you were busy, I can help you.","If you busy are, I can help you."], choicesZh: ["如果你在忙，我可以幫你。","「I helped you」（時態錯）。","「were busy」（時態錯）。","語序錯誤。"], words: ["if","busy","I","can","help"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind thing to say about the glade.", promptZh: "選出稱讚林間空地的好聽話。", answer: "The flowers that glow are beautiful.", choices: ["The flowers that glow are beautiful.","The flowers who glow are beautiful.","The flowers that glows are beautiful.","The flowers are beautiful that glow."], choicesZh: ["那些發光的花好美。","用 who 指物（錯）。","「that glows」（動詞錯）。","語序錯誤。"], words: ["flowers","that","glow","beautiful"], reward: chatReward }
    ]
  },
  stoneGolemPass: {
    theme: "chatting with the golem",
    title: "Chat at Stone Golem Pass",
    opening: "Goro the golem rumbles a friendly hello.",
    openingZh: "石巨人 Goro 用低沉友善的聲音打招呼。",
    ending: "Goro smiles. He enjoyed the chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly greeting for Goro.", promptZh: "選出對 Goro 親切的招呼。", answer: "Hello Goro, it is good to see you.", choices: ["Hello Goro, it is good to see you.","Hello Goro, it is good seeing you to.","Hello Goro, it good is to see you.","Hello Goro, good it is see you."], choicesZh: ["你好 Goro，很高興見到你。","語序錯誤。","語序錯誤。","語序錯誤。"], words: ["good","to","see","you"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Goro feels lonely. Pick the kind, encouraging sentence.", promptZh: "Goro 覺得孤單。選出親切鼓勵的句子。", answer: "Do not worry, I will visit you again.", choices: ["Do not worry, I will visit you again.","Do not worry, I visited you again.","Do not worry, I will visited you again.","Do not worry, I visit will you again."], choicesZh: ["別擔心，我會再來看你。","「I visited」（時態錯）。","「will visited」（錯）。","語序錯誤。"], words: ["I","will","visit","you","again"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind compliment for Goro.", promptZh: "選出對 Goro 親切的稱讚。", answer: "You are the kindest golem I know.", choices: ["You are the kindest golem I know.","You are the kindiest golem I know.","You are the most kind golem I know.","You are kinder golem I know."], choicesZh: ["你是我認識最善良的石巨人。","「kindiest」（拼字錯）。","「most kind」（最高級錯）。","「kinder golem」（用法錯）。"], words: ["kindest","golem","I","know"], reward: chatReward }
    ]
  },
  halflingVillage: {
    theme: "chatting with the halfling",
    title: "Chat in Halfling Village",
    opening: "Penny the halfling waves from a round green door.",
    openingZh: "半身人 Penny 從綠色圓門向你揮手。",
    ending: "Penny giggles. What a friendly chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly greeting for Penny.", promptZh: "選出對 Penny 親切的招呼。", answer: "Hi Penny, have you had a good day?", choices: ["Hi Penny, have you had a good day?","Hi Penny, you have had a good day?","Hi Penny, have you have a good day?","Hi Penny, had you have a good day?"], choicesZh: ["嗨 Penny，你今天過得好嗎？","語序錯誤。","「have you have」（錯）。","語序錯誤。"], words: ["have","you","had","good","day"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Penny asks about your morning. Pick the past continuous answer.", promptZh: "Penny 問你的早上。選出過去進行式的回答。", answer: "I was exploring the hills this morning.", choices: ["I was exploring the hills this morning.","I was explore the hills this morning.","I am exploring the hills this morning.","I explored the hills when I was explore."], choicesZh: ["我今天早上在探索山丘。","「was explore」（動詞錯）。","現在進行式（時態不一致）。","「was explore」（錯誤）。"], words: ["was","exploring","hills","morning"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind thing to say about her home.", promptZh: "選出稱讚她家的好聽話。", answer: "The door that is round is very pretty.", choices: ["The door that is round is very pretty.","The door who is round is very pretty.","The door that are round is very pretty.","The door round that is very pretty."], choicesZh: ["那扇圓圓的門好漂亮。","用 who 指物（錯）。","「that are round」（單複數錯）。","語序錯誤。"], words: ["door","that","round","pretty"], reward: chatReward }
    ]
  },
  wizardHut: {
    theme: "chatting with the wizard",
    title: "Chat at the Wizard Hut",
    opening: "Wiz Beryl looks up from a glowing book and smiles.",
    openingZh: "巫師 Beryl 從發光的書本中抬起頭微笑。",
    ending: "Wiz Beryl chuckles. A fine chat indeed.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the polite greeting for Wiz Beryl.", promptZh: "選出對 Beryl 巫師有禮貌的招呼。", answer: "Good evening, Wiz Beryl.", choices: ["Good evening, Wiz Beryl.","Good evening, Wiz Beryl are.","Evening good, Wiz Beryl.","Good evening is, Wiz Beryl."], choicesZh: ["晚安，Beryl 巫師。","多餘的 are（錯）。","語序錯誤。","語序錯誤。"], words: ["good","evening","wiz","beryl"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Beryl seems tired. Pick the kind offer.", promptZh: "Beryl 看起來累了。選出親切的提議。", answer: "If you need a rest, I will tidy the jars.", choices: ["If you need a rest, I will tidy the jars.","If you need a rest, I tidied the jars.","If you needed a rest, I will tidy the jars.","If you need a rest, I will tidied the jars."], choicesZh: ["如果你需要休息，我來整理罐子。","「I tidied」（時態錯）。","「needed」（時態錯）。","「will tidied」（錯）。"], words: ["if","need","rest","will","tidy"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the curious, polite question for Beryl.", promptZh: "選出對 Beryl 好奇又有禮貌的提問。", answer: "Can you tell me what this herb does?", choices: ["Can you tell me what this herb does?","Can you tell me what does this herb?","Can you tell me what this herb do?","Can you told me what this herb does?"], choicesZh: ["可以告訴我這種藥草有什麼用嗎？","間接問句語序錯。","「herb do」（主詞動詞不一致）。","「told」時態錯。"], words: ["what","this","herb","does"], reward: chatReward }
    ]
  },
  redHoodPath: {
    theme: "chatting with ruby",
    title: "Chat on Red Riding Hood Path",
    opening: "Ruby lifts her red hood and says hello.",
    openingZh: "Ruby 掀起她的紅帽子問好。",
    ending: "Ruby waves goodbye with a smile.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly greeting for Ruby.", promptZh: "選出對 Ruby 親切的招呼。", answer: "Hi Ruby, where are you going today?", choices: ["Hi Ruby, where are you going today?","Hi Ruby, where you are going today?","Hi Ruby, where are you go today?","Hi Ruby, where going are you today?"], choicesZh: ["嗨 Ruby，你今天要去哪裡？","語序錯誤。","「are you go」（錯）。","語序錯誤。"], words: ["where","are","you","going"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Ruby is going to Grandma's. Pick the kind offer.", promptZh: "Ruby 要去外婆家。選出親切的提議。", answer: "If the path is long, I will walk with you.", choices: ["If the path is long, I will walk with you.","If the path is long, I walked with you.","If the path was long, I will walk with you.","If the path is long, I will walked with you."], choicesZh: ["如果路很長，我陪你走。","「I walked」（時態錯）。","「was long」（時態錯）。","「will walked」（錯）。"], words: ["if","path","long","will","walk"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the caring thing to say to Ruby.", promptZh: "選出對 Ruby 體貼的話。", answer: "Please stay safe on the path.", choices: ["Please stay safe on the path.","Please staying safe on the path.","Please stayed safe on the path.","Please stay safe in the path off."], choicesZh: ["路上請注意安全。","「staying」（形式錯）。","「stayed」（形式錯）。","語序錯誤。"], words: ["please","stay","safe","path"], reward: chatReward }
    ]
  },
  threePigsCottage: {
    theme: "chatting with the piglet",
    title: "Chat at the Three Pigs Cottage",
    opening: "Pippo the piglet trots over to say hello.",
    openingZh: "小豬 Pippo 小跑過來打招呼。",
    ending: "Pippo oinks happily. A friendly chat indeed.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly greeting for Pippo.", promptZh: "選出對 Pippo 親切的招呼。", answer: "Hello Pippo, have you built a new house?", choices: ["Hello Pippo, have you built a new house?","Hello Pippo, you have built a new house?","Hello Pippo, have you build a new house?","Hello Pippo, built you have a new house?"], choicesZh: ["你好 Pippo，你蓋了新房子嗎？","語序錯誤。","「have you build」（錯）。","語序錯誤。"], words: ["have","you","built","house"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pippo worries about the wind. Pick the kind, reassuring offer.", promptZh: "Pippo 擔心風。選出親切安慰的提議。", answer: "If the wind comes, I will help you.", choices: ["If the wind comes, I will help you.","If the wind comes, I helped you.","If the wind came, I will help you.","If the wind comes, I will helped you."], choicesZh: ["如果風來了，我會幫你。","「I helped」（時態錯）。","「came」（時態錯）。","「will helped」（錯）。"], words: ["if","wind","comes","will","help"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind compliment for the brick house.", promptZh: "選出對磚房親切的稱讚。", answer: "The house that you built is very strong.", choices: ["The house that you built is very strong.","The house who you built is very strong.","The house that you build is very strong.","The house you built that is very strong."], choicesZh: ["你蓋的那間房子很堅固。","用 who 指物（錯）。","「you build」（時態錯）。","語序錯誤。"], words: ["house","that","built","strong"], reward: chatReward }
    ]
  },
  treeSpiritGrove: {
    theme: "chatting with the tree spirit",
    title: "Chat in the Tree Spirit Grove",
    opening: "Sylvie the tree spirit blinks gently with blue light.",
    openingZh: "樹靈 Sylvie 用藍色的光溫柔地眨眼。",
    ending: "Sylvie's leaves rustle warmly. A gentle chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the gentle greeting for Sylvie.", promptZh: "選出對 Sylvie 溫柔的招呼。", answer: "Hello Sylvie, how have you been?", choices: ["Hello Sylvie, how have you been?","Hello Sylvie, how you have been?","Hello Sylvie, how have you being?","Hello Sylvie, been how have you?"], choicesZh: ["你好 Sylvie，你最近好嗎？","語序錯誤。","「have you being」（錯）。","語序錯誤。"], words: ["how","have","you","been"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Sylvie asks about your day. Pick the past continuous answer.", promptZh: "Sylvie 問你今天如何。選出過去進行式的回答。", answer: "I was helping my friends all day.", choices: ["I was helping my friends all day.","I was help my friends all day.","I am helping my friends all day.","I helped while I was help."], choicesZh: ["我今天一整天都在幫朋友。","「was help」（動詞錯）。","現在進行式（時態不一致）。","「was help」（錯誤）。"], words: ["was","helping","friends","day"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the grateful thing to say to Sylvie.", promptZh: "選出對 Sylvie 感謝的話。", answer: "Thank you for the peaceful grove.", choices: ["Thank you for the peaceful grove.","Thank you for the peaceful grove are.","Thank for the peaceful grove you.","Thank you of the peaceful grove."], choicesZh: ["謝謝你帶來這片寧靜的樹叢。","多餘的 are（錯）。","語序錯誤。","「thank you of」（介系詞錯）。"], words: ["thank","you","peaceful","grove"], reward: chatReward }
    ]
  },
  fairyAtelier: {
    theme: "chatting with the fairy",
    title: "Chat at the Fairy Atelier",
    opening: "Faye the fairy flutters over with a bright smile.",
    openingZh: "仙子 Faye 帶著燦爛的笑容飛過來。",
    ending: "Faye is delighted you stopped to chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly greeting for Faye.", promptZh: "選出對 Faye 親切的招呼。", answer: "Hi Faye, how have you been?", choices: ["Hi Faye, how have you been?","Hi Faye, how you have been?","Hi Faye, how have you was?","Hi Faye, been how have you?"], choicesZh: ["嗨 Faye，你最近好嗎？","語序錯誤。","「how have you was」（錯）。","語序錯誤。"], words: ["how","have","you","been"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind compliment for a dress.", promptZh: "選出稱讚洋裝的好聽話。", answer: "The dress that sparkles is lovely.", choices: ["The dress that sparkles is lovely.","The dress who sparkles is lovely.","The dress that sparkle is lovely.","The dress sparkles that is lovely."], choicesZh: ["那件閃閃發亮的洋裝好美。","用 who 指物（錯）。","「that sparkle」（動詞未變化）。","語序錯誤。"], words: ["dress","that","sparkles","lovely"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Faye looks busy. Pick the kind offer.", promptZh: "Faye 看起來很忙。選出親切的提議。", answer: "If you are busy, I can wait.", choices: ["If you are busy, I can wait.","If you are busy, I waited.","If you were busy, I can wait.","If you busy are, I can wait."], choicesZh: ["如果你在忙，我可以等。","「I waited」（時態錯）。","「were busy」（時態錯）。","語序錯誤。"], words: ["if","busy","I","can","wait"], reward: chatReward }
    ]
  },
  dwarfCottage: {
    theme: "chatting with the dwarf",
    title: "Chat at the Dwarf Cottage",
    opening: "Pip the dwarf sets down a boot and grins hello.",
    openingZh: "小矮人 Pip 放下一隻靴子，咧嘴打招呼。",
    ending: "Pip enjoyed the warm chat.",
    questions: [
      { questionType: "sentence-choice", prompt: "Pick the friendly greeting for Pip.", promptZh: "選出對 Pip 親切的招呼。", answer: "Hello Pip, it is good to see you.", choices: ["Hello Pip, it is good to see you.","Hello Pip, it is good seeing you to.","Hello Pip, it good is to see you.","Hello Pip, good it is see you."], choicesZh: ["你好 Pip，很高興見到你。","語序錯誤。","語序錯誤。","語序錯誤。"], words: ["good","to","see","you"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pick the kind compliment for a coat.", promptZh: "選出稱讚外套的好聽話。", answer: "The coat that you made is warm.", choices: ["The coat that you made is warm.","The coat who you made is warm.","The coat that you make is warm.","The coat you made that is warm."], choicesZh: ["你做的那件外套很暖。","用 who 指物（錯）。","「you make」（時態錯）。","語序錯誤。"], words: ["coat","that","made","warm"], reward: chatReward },
      { questionType: "sentence-choice", prompt: "Pip looks tired. Pick the kind offer.", promptZh: "Pip 看起來累了。選出親切的提議。", answer: "If you are tired, I will help you.", choices: ["If you are tired, I will help you.","If you are tired, I helped you.","If you were tired, I will help you.","If you are tired, I will helped you."], choicesZh: ["如果你累了，我會幫你。","「I helped」（時態錯）。","「were tired」（時態錯）。","「will helped」（錯）。"], words: ["if","tired","will","help"], reward: chatReward }
    ]
  }
});
//#endregion 生活聊天題庫

//#region 對話場景設定
// 每個屬性名稱對應地點或節點，控制對話畫面的背景、NPC 與按鈕文案。
export const wildSceneConfigs = mergeLessons(mergeLessons({
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
}, wildLessonBank, { area: "wild", vocabProfile: wildVocabularyProfile.id }),
  wildChatLessonBank, { area: "wild", vocabProfile: wildVocabularyProfile.id }, "chatLesson");
//#endregion 對話場景設定
