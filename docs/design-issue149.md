# design-issue149 — 場景對話全量改寫設計note

> 本檔為 issue #149 的 plan 設計note（非 design.md 正本、不受 docLint），是「場景對話全量改寫」的**單一改寫依據**。
> design.md 對應精修：spec#1（對話須由角色第一人稱發話、題幹非 meta 指令）、spec#11（打工選項 4→3）；連動 sysCase#1.1／#11.1／#11.2、intTest#36／#38、＜IV＞成效。
> 目的：把改寫規則「鎖死」，使日後新增或修改任一場景對話時，皆回到本檔對齊，不再漂移回第三人稱旁白或考試式題幹。

---

## 1. 修訂定位

本次不是逐句微調，而是**依既有場景、角色、英文分級與互動模式，重新編寫全部場景對話**。原稿中的第三人稱旁白、考題式 prompt、後設操作指令、缺乏角色陪伴感的句子，原則上全部淘汰、不參考舊句改寫。

**保留（不動）：**

1. 四大地區：Castle、Urban、Rural、Wild。
2. 各地區英文分級：Dolch、Starters、Movers、Flyers（硬限制，見 §9）。
3. 場景與角色配置（各 area manifest 之 `locations`／`sceneConfigs` 之 NPC 與場景）。
4. 場景功能方向（廚房、漁港、圖書館、礦場、巫師小屋……）。
5. 互動模式：生活聊天（Chat）與打工任務（Work）兩種題庫。
6. 獎勵梯度：Castle 20、Urban 100、Rural 500、Wild 2000 coins（`{area}VocabularyProfile.rewardCoins`／`reward.coins`）。
7. **資料結構欄位**：`questionType`、`answer`、`choices`、`choicesZh`、`words`、`reward`、`opening`／`openingZh`、`ending` 等鍵名與型別不變（見 §12）。

**淘汰（重寫）：**

1. 原 `travelLine` 第三人稱旁白句。
2. 原 Chat `opening` 第三人稱旁白句。
3. 原 Work `opening` 第三人稱旁白句。
4. 原 `prompt` 中的 Pick／Tell／Choose／Make a plan 等後設指令。
5. 看起來像考試題目的句子。
6. 與場景生活功能無關的描述句、缺角色陪伴感的台詞。

## 2. 核心修訂目標

把遊戲從「英文選擇題」改成「**小公主與場景角色互動**」。所有玩家可見文字皆須符合：

1. 角色本人直接對玩家公主說話（第一人稱）。
2. 玩家不是考生，而是正在與角色聊天、幫忙、回應或完成任務的小公主。
3. Chat 是生活聊天、不是測驗；Work 是角色請公主幫忙、不是考試。
4. `prompt` 是角色台詞、不是系統題目；`choices` 是公主可以說出的回應／承諾／行動確認／任務回報。
5. 每一句玩家可見英文都必須有對應中文。
6. 每區句型難度必須符合該地區英文分級（§9）。
7. 題材貼近場景功能與兒童日常；奇幻場景可奇幻，但互動功能必須生活化。

## 3. 玩家身分與角色關係

### 3.1 玩家身分（稱呼採名稱無關，勿寫死 Lumi）

玩家扮演小公主。可玩 roster 為 `lumi`／`yumi`／`sol`／`rosa`（且玩家可改名），故對話**不得寫死「Lumi」**；角色稱呼公主一律用名稱無關詞，必要時由程式以玩家名替換：

- EN：`Princess`、`my dear`、`little princess`（必要時帶玩家名）
- ZH：公主、親愛的、小公主

> 舊題庫中「Pick what Lumi wants／can do」之類寫死名稱者一律移除——改寫後選項為公主第一人稱（"I want…／I can…"），名稱問題自然消失。

### 3.2 Castle 親子關係（本案新增設定）

Castle 的 `King Rowan` 與 `Queen Mira` 是**玩家公主的父王與母后**（非一般 NPC）。語氣為親子陪伴。

- **King Rowan（父王）**：父親式溫和、鼓勵公主、帶公主認識城堡生活、用短句建立安全感。
  - 例：`Hello, my dear.`／`Come here, my little princess.`／`Can you help me?`／`Good job, my dear.`
  - 中：早安，親愛的。／過來吧，我的小公主。／你可以幫我嗎？／做得好，親愛的。
- **Queen Mira（母后）**：母親式溫柔、陪伴閱讀、關心公主感受、引導禮貌與生活表達。
  - 例：`Come here, my dear.`／`Let us read together.`／`Do you like this book?`／`Thank you for helping me.`
  - 中：過來吧，親愛的。／我們一起讀書吧。／你喜歡這本書嗎？／謝謝你幫我。

> 釐清同名 NPC：此父王/母后僅指 **Castle** 的 `King Rowan`／`Queen Mira`。Urban 花園 NPC `Mira`（園丁）與 Urban/Rural 的 `Auntie Pom` 為**不同角色**，不套親子設定。

## 4. Chat 與 Work 的重新定義

### 4.1 Chat＝生活聊天

目的：角色陪伴公主、進行簡短生活對話。重點：問候、喜好、心情、禮貌、日常分享、輕量互動。

- **題數**：每場景固定 **2 題**（原為 3 題，本案收斂）。
- **選項數**：每題 **2 個選項**（`paramChatChoiceCount`＝2；沿用 #138 之 `limitChoiceOptions`）。
- **無 opening**：進入 Chat 直接接 Q1，不設題組開場白；角色首句即 Q1 的 `prompt`（由 NPC 音色朗讀）。
- **選項性質**：公主可回應角色的話。

格式示意（取代 `Pick the friendly hello.` 等；無 opening）：

```
Q1 prompt EN: Good morning, Princess. The sea is calm today.   ← 角色（Nami）首句台詞
Q1 prompt ZH: 早安，公主。今天海面很平靜。
A: Good morning, Nami. The sea looks beautiful. ／ 早安，娜米。大海看起來很漂亮。  ← 正解
B: I put the shoes under the bed. ／ 我把鞋子放在床底下。
```

### 4.2 Work＝角色請公主幫忙

目的：角色向公主提出具體請求，公主以合適英文回應、協助、計算、提醒、確認行動或回報結果。重點：幫忙做事、計算數量、找東西、整理物品、安全提醒、完成任務，並使用該地區指定句型。

- **題數**：每場景固定 **3 題**（原為 5 題，本案收斂）。
- **選項數**：每題 **3 個選項**（`paramJobChoiceCount`＝4→**3**；同步 design.md spec#11）。
- **無 opening**：進入 Work 直接接 Q1，不設題組開場白；角色首句即 Q1 的 `prompt`。完成畫面亦不帶 ending 旁白，由引擎以簡短收尾語（Great work!／Nice chat!）替代。
- **選項性質**：公主對角色說出的回應／承諾／行動確認／任務回報。

格式示意（取代 `How many fish are there?` 等考題；無 opening）：

```
Q1 prompt EN: Princess, this box has four fish, and that box has two fish. Please help me count all the fish.   ← 角色（Nami）首句台詞
Q1 prompt ZH: 公主，這個箱子有四條魚，那個箱子有兩條魚。請你幫我計算一共有幾條魚。
A: I counted six fish for you. ／ 我幫你算好了，一共有六條魚。  ← 正解
B: I counted four flowers for you. ／ 我幫你算好了，一共有四朵花。
C: I put the fish in my book. ／ 我把魚放進我的書裡。
```

## 5. Prompt 的正式定義

`prompt` 不再是「題目」，而是**角色對公主說出的一句自然台詞**，用來開啟聊天、提出請求、表達需求、提醒安全、邀請幫忙或共同完成任務。必須：①由角色本人說話；②對象是玩家公主；③不用後設指令；④不像老師出題、不像測驗題幹；⑤嵌入生活情境；⑥能引出公主的自然回應。

## 6. 選項的正式定義

`choices`（含正解 `answer`）為**玩家公主可以說出的回應／行動承諾／任務確認／完成回報**。

- Chat 選項要像公主在聊天：較弱 `Good morning.` → 較佳 `Good morning, Nami. The sea looks beautiful.`
- Work 選項要像公主在幫忙：較弱 `There are six fish.` → 較佳 `I counted six fish for you.`；較弱 `The box is in the back yard.` → 較佳 `Yes. I will carry the box to the back yard.`

## 7. 數學與任務整合原則

Urban 與 Rural 可設計數量計算，但**不得寫成數學考題**，必須包在角色任務裡。

- ❌ `There are four fish in this box and two fish in that box. How many fish are there?`
- ✅ `Nami says, "Princess, this box has four fish, and that box has two fish. Please help me count all the fish."` → 正解 `I counted six fish for you.`／我幫你算好了，一共有六條魚。

## 8. 工作請求句型範本（Work `prompt` 樣式）

1. **請幫忙搬東西**：`Paul says, "Princess, I am too busy now. Can you carry this box to the back yard?"` → `Yes. I will carry this box to the back yard.`
2. **請幫忙計算**：`Nami says, "Princess, I have four fish here and two fish there. Please help me count them."` → `I counted six fish for you.`
3. **請幫忙找東西**：`Librarian Nola says, "Princess, I cannot find the story books. Can you look on the shelf?"` → `Yes. I found the story books on the shelf.`
4. **請幫忙提醒安全**：`Captain Sol says, "Princess, the dock is wet. Can you remind the children?"` → `Please walk slowly on the dock.`
5. **請幫忙做計畫**：`Pip says, "Princess, the cart wheel is broken. What should we do first?"` → `We should find the missing wheel first.`

## 9. 四區英文分級（硬限制，分級不可動）

階梯由淺到深，句型逐級進階並補齊缺口；改寫只動**敘述觀點與文案**，**不得改變分級**。

| 地區 | 分級（`vocabularyProfile`） | 獎勵 | 句型重點 | 避免 |
|---|---|---|---|---|
| **Castle** | Dolch Sight Words 220（`dolch-220`） | 20 | be 動詞、can、I am／see／have／like、This is、簡單祈使、招呼與禮貌語；最短單句 | 過去式、because 複句、比較級、現在完成式、if 條件句、關係子句、過長句 |
| **Urban** | Cambridge Pre-A1 Starters（`cambridge-pre-a1-starters`） | 100 | 現在簡單式、現在進行式（is/are+V-ing）、can、have、this/these、What／Where／How many、on/in/under/by、祈使句、簡易加總 | 明顯過去式、because 複句、比較級、if、現在完成式、關係子句 |
| **Rural** | Cambridge A1 Movers（`cambridge-a1-movers`） | 500 | 規則／常見不規則過去式（was/were、found/sold/caught/made/cut）、because 原因子句（首見複句）、比較級（-er than）、going to／will、must／have to、before/after、加減法應用 | — |
| **Wild** | Cambridge A2 Flyers（`cambridge-a2-flyers`） | 2000 | 現在完成式（have/has+p.p.）、過去進行式＋when、第一條件句（if … will）、關係子句（who/which/that）、間接問句語序、should/could/would、較長句 | 無功能魔法句、超現實干擾項、只為奇幻而奇幻、與兒童生活溝通無關的句子 |

各區範例：

- **Castle**：父王 `Hello, my dear. Can you help me?`（你好，親愛的。你可以幫我嗎？）→ 正解 `Yes, I can help.`（好的，我可以幫忙。）
- **Urban**：`Nami says, "Princess, this box has four fish, and that box has two fish. Please help me count all the fish."` → `I counted six fish for you.`
- **Rural**：`Gemma says, "Princess, I found ten stones this morning and sold four. Please help me check how many stones are left."` → `Six stones are left.`（還剩六顆石頭。）
- **Wild**：`Elia says, "Princess, I have lost the silver bell that calls the elves. Could you help me look among the glowing flowers?"` → `Yes. I will look for the bell that calls the elves.`

## 10. Chat 與 Work 的訓練深度差異

- **Chat**：取該分級的「生活面」（問候、感受、禮貌、喜好、輕量互動）；2 題、每題 2 選項；語氣輕短親切。答對加心情、在護眼上限內延長可玩時間（刻意社交設計，沿用既有，不改）。
- **Work**：取該分級的「訓練面」（任務協助、文法重點、數量判斷、安全、流程）；3 題、每題 3 選項；角色提出具體請求、公主回應或回報。答對發 coins（沿用既有獎勵階梯）。

## 11. 中英文呈現規則

每一句玩家可見文字皆須有英文與中文：`travelLine`、`shopGreeting`、Chat `opening`／`prompt`／`choices`、Work `opening`／`prompt`／`choices`、任務完成回應、鼓勵語。中文原則：自然口語、不逐字硬翻、保留角色關係與公主稱呼；Castle 親子場景要翻出父王／母后／親愛的／小公主；不把英文翻成考題語氣。

## 12. 固定輸出格式與資料結構落地

### 12.1 每場景撰寫格式（給內容撰寫）

```
# 場景名稱 / 角色名稱   （地區｜分級｜獎勵｜角色關係｜場景功能｜互動類型）

## travelLine        EN：角色直接對公主說話。  ZH：中文。
                     （商店另寫 shopGreeting：店主第一人稱招呼。）

## Chat（2 題；無 opening，直接 Q1）
Q1/Q2 prompt         EN：角色第一人稱對公主說話（首句即 Q1）。  ZH：中文。
       A/B           EN：公主回應選項。   ZH：中文。   Answer：A 或 B

## Work（3 題；無 opening，直接 Q1）
Q1/Q2/Q3 prompt      EN：角色第一人稱提出具體任務／請求／提醒（首句即 Q1）。  ZH：中文。
       A/B/C         EN：公主回應／承諾／回報；B、C 為干擾。 ZH：中文。 Answer：A／B／C
```

### 12.2 落地到既有資料結構（給 code）

- 撰寫產物映射回 `content-package/areas/{area}/manifest.js`：`{area}ChatLessonBank`（Chat）、`{area}LessonBank`（Work）、`{area}SceneConfigs` 之 `travelLine`／`shopGreeting`。
- 欄位：`prompt`/`promptZh`＝角色台詞；`answer`＋`choices`/`choicesZh`＝公主回應（正解放 `answer`）；`opening`/`openingZh`＝角色開場台詞；`words`、`reward`、`questionType` 沿用。
- 數量：Chat 每題 `choices` 撰寫 **2** 項；Work 每題 `choices` 撰寫 **3** 項（顯示由 `paramChatChoiceCount`=2／`paramJobChoiceCount`=3 控制）。Chat 每場景 **2** 題、Work 每場景 **3** 題。
- 中文鏡像（`*Zh`）必填且與英文對齊；`selftest`（chat/job 題庫結構）須維持綠燈。

## 13. 四區逐場景改寫方向（依現有 NPC／場景）

### 13.1 Castle（父王／母后＝親子；Dolch 短句）

- King's Hall / King Rowan（**父王**）：問候公主、帶看王冠與大廳、請公主做簡單禮貌回應。
- Queen's Study / Queen Mira（**母后**）：邀請閱讀、整理書本、表達喜好與感謝。
- Kitchen / Cook Panna：請公主拿湯、拿水、放麵包、提醒廚房不要跑。
- Knights' Room / Knight Theo：請公主看盾牌、站安全位置、一起練習鼓勵語。
- Maid's Room / Maid Lala：請公主折布、放進籃子、整理房間。
- Royal Cloak Room / Cloak Keeper（商店）：招呼公主試外套與帽子（Chat；無 Work）。
- Castle Seamstress / Seamstress Bea（商店）：招呼公主看上衣、下身與柔軟布料（Chat；無 Work）。
- Princess Room / Lumi：換裝房，功能性提示為主（非寒暄、無 Chat/Work）。
- Castle Gate / Gate Guard：城門，簡短功能性提示前往世界地圖。

### 13.2 Urban（Starters 單句、位置與數量）

- Castle Garden / Mira（園丁）：談玫瑰、貓、澆花與數花。
- School Classroom / Teacher Bell：請公主發書、數學生、提醒安靜。
- Library / Librarian Nola：請公主找故事書、放書、提醒輕聲說話。
- Temple / Sister Luma：請公主澆花、數蠟燭、保持安靜。
- Administration Building / Clerk Otto：請公主分類便條、數郵票、找地圖。
- Market Square / Auntie Pom：請公主賣麵包、數水果、回答顧客。
- Fish Shop / Nami：請公主數魚、把魚放冰上、向顧客說明魚很新鮮。
- Harbor Port / Dock Guide：請公主數船、提醒不要奔跑、引導船靠岸。
- Dress Boutique / Rena（商店）：試裙、整理衣架、幫顧客挑衣服。
- Hair Salon / Stylist Lina（商店）：拿梳子、整理鏡台、詢問髮型喜好。
- Tailor Studio / Tailor Tess（商店）：摺衣服、數襯衫、放架上。
- Shoe Shop / Mina（商店）：配鞋、數鞋子、幫顧客試尺寸。
- Accessory Atelier / Lili（商店）：分類緞帶、數皇冠、幫顧客選顏色。
- Lighthouse / Captain Sol：看船、開燈、提醒海上安全。
- Luminara Castle / Gate Guard：城門，功能性提示回世界地圖。

> Urban 商店（Boutique/Salon/Tailor/Shoe/Accessory）現有 Chat＋Work 兩者皆具；維持其既有開啟模組，不增減。

### 13.3 Rural（Movers 過去式、because、比較級、未來式；加減法）

- Mine / Miner Gemma：數石頭、找石頭、推車、戴安全帽。
- Logging Camp / Logger Rowan：數木頭、比較木頭長短、注意搬運安全。
- Fishing Shore / Fisher Nami：拉網、數魚、提醒碼頭濕滑。
- Pasture / Farmer Theo：數羊、餵牛、比較動物大小。
- Farm / Auntie Pom：採紅蘿蔔、澆水、計算剩餘數量。
- Mill / Miller Bell：搬麵粉袋、掃地、說明麵粉會滑。
- Village Home / Grandma Fina：整理門廊、數蘋果、準備點心。
- Workwear Stall / Workwear Keeper（商店）：看工作服、談耐用衣物（Chat；無 Work）。
- Field Cobbler / Field Cobbler（商店）：看鞋帽、談長路行走（Chat；無 Work）。
- World Road / Rural Sign：出口，功能性提示回世界地圖。

### 13.4 Wild（Flyers 高階句型；奇幻角色、生活化任務）

- Elf Glade / Elia：找銀鈴、觀察發光花、用 if 計畫呼喚精靈。
- Fairy Atelier / Faye（商店）：看裙子、試配件、等待忙碌的仙子（Chat；無 Work）。
- Dwarf Cottage / Pip（商店＋打工）：找車輪、拿工具、修推車（既有 Chat＋Work 皆具，維持）。
- Stone Golem Pass / Goro：清苔蘚、讀路牌、移開擋路石頭。
- Halfling Village / Penny：找野餐籃、數圓門、詢問線索。
- Wizard Hut / Wiz Beryl：整理藥草罐、用梯子、注意玻璃罐安全。
- Red Riding Hood Path / Ruby：清葉子、保護籃子、提醒走安全路線。
- Three Pigs Cottage / Pippo：固定屋頂、比較房子、討論風來時的計畫。
- Tree Spirit Grove / Sylvie：種發光種子、找月光、感謝幫忙。
- World Path / Wild Sign：出口，功能性提示回世界地圖。

## 14. 干擾項設計規則（不破壞世界觀、合該分級）

干擾項須符合該地區英文程度，但在語意／場景／禮貌／數量／時態／句型上**不適合**；不得使用過度荒謬句。

- **Castle**：可錯在語意不合、禮貌不合、場景不合、簡單句錯配；避免過長、過難、複句、過去式或高階時態。
- **Urban**：可錯在數量、位置、動作、現在式 vs 進行式錯配、場景物品錯配。
- **Rural**：可錯在過去式、加減法、because 原因、比較級、未來式、must/have to 誤用。
- **Wild**：可錯在現在完成式、when 子句、if 條件句、關係代名詞、間接問句語序、should/could 誤用、時態不一致。

## 15. 品質檢查清單（每場景完成後逐項核）

1. `travelLine` 是否由角色本人對公主說話？
2. Chat `opening` 是否由角色本人開口？
3. Work `opening` 是否由角色本人提出幫忙需求？
4. `prompt` 是否為角色台詞、而非系統題目？
5. 是否完全避免 Pick／Choose／Tell／Correct answer 等考試語氣？
6. Chat 是否固定 2 題、每題 2 選項？
7. Work 是否固定 3 題、每題 3 選項？
8. 每句英文是否都有中文？中文是否自然口語、非逐字硬翻？
9. 玩家是否明確是小公主？稱呼是否名稱無關（未寫死 Lumi）？
10. Castle 的 King／Queen 是否呈現父王／母后語氣？
11. Castle Dolch 短句？Urban Starters 單句／位置／數量？Rural Movers 過去式／because／比較級／未來式？Wild Flyers 現在完成式／過去進行式／if／關係子句／間接問句？
12. 數學是否包在生活任務裡（非裸算術題）？
13. 正解是否像公主的自然回應？干擾項是否合理、不破壞世界觀、合該分級？
14. 場景任務是否符合該地點功能？是否避免抽象旁白／超現實無功能句？
15. 是否保留角色陪伴感、讓玩家感覺正在幫助角色、自然使用英文？
16. 是否維持地區難度由淺到深？
17. 是否可直接落地到既有資料結構（§12.2）、`selftest` 綠燈？

## 16. 建議執行順序

1. **Castle**：先建最基礎規格（短句、親子語氣、第一人稱、非考試 prompt、最短可用格式）。
2. **Urban**：生活場景任務、Starters 單句、位置與簡易數量、數學任務化。
3. **Rural**：Movers 過去式／because／比較級／未來式與加減法應用。
4. **Wild**：Flyers 高階句型，但維持功能性對話與合理奇幻任務。

## 17. 最終判準

玩家不是在作答，而是在扮演小公主；角色不是被旁白介紹，而是在親自和公主說話；Chat 是生活聊天、Work 是角色請公主幫忙、數學是角色工作中的真實需求；英文分級是每區句型難度的硬限制；奇幻是用奇幻角色承載真實生活溝通功能。所有台詞都要讓玩家感覺：我正在和角色互動、正在被角色陪伴、正在幫助這個場景裡的人、正在自然地使用英文。
