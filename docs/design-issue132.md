# 設計note — issue #132 人物資訊欄（`.side-panel`）排版重整

> 本檔為 2plan 設計note。**本議題非純 Option A**：除版型/視覺決策以本 note 承載外，因 USR 於 obj→plan 對話確認了兩項行為變更（時間顯示由「開始時間」改為「可玩時間額度」、大頭照由「基本造型」升級為「即時穿搭」），已對 `docs/design.md` 作 USR-gated 回修（spec#9、sysCase#7.5、sysCase#5.2、intTest#17/#31、e2eTest#05）並同步 `README.md`。確切像素/響應式值留 3code visual-QA 定案。主體為人物資訊側欄 `.side-panel`（非 #111/#120 的對話框 `.adv-scene`）。

## 1. 現況量測（以產物為準）

* 資訊欄 = `<aside class="side-panel">`（`index.html` L13–34）。由上而下：⚙ 系統選單鈕（`#systemMenuButton`）、大頭照框 `.mini-doll-frame`＞`.side-avatar`（`#sideProfileAvatar`）、`<h1 #princessNameTitle>`「Princess ○○」、`.subtitle` 說明句、`.status-grid`（Coins／Mood／Play time 三格）、`.energy-meter`（百分比橫條）、`.equipped-box`（裝備文字）、`.notice-box`（`#statusMessage` 提示）、整寬「Switch player」鈕（`.switch-player-quick`）。
* 版型分歧（同 #101/#120 型態）：桌機寬版基準在 `styles/base.css`（`.side-panel` L199、`.mini-doll-frame` L205 高 178、`.status-grid` L233 三欄等寬、`.switch-player-quick` L269 整寬）；窄版由 `styles/mobile.css` 多段 media query 大幅覆寫，且窄版已將 `.subtitle/.equipped-box/.notice-box/.energy-meter` 設 `display:none`（L1355–1359）。
* 大頭照現況：`applyProfileAvatar`（`game-engine/main.js` L207–223、L251）只用 `character.baseLayer` 單張底圖、以 CSS 裁切頭胸（`background-size:190%`、`position:50% 43%`），**不反映目前穿搭**（換髮/換衣不變）。
* 時間現況：`playClockHudText`（`main.js` L232–238）play 階段已輸出「開始時間 · 剩餘」合併字串（如 `06:56 AM · 8:14`），塞在單一 Play time 格；另有 `.energy-meter` 百分比橫條。
* 心情現況：`state.mood`（生活聊天答對 +1，並在護眼上限內延長當次可玩時間；`main.js` L106–107、L2610–2615）；`#moodValue` 於 `.status-grid` 顯示一個數字（USR 表示看不出意義）。

## 2. 設計命題（USR 目標稿）

USR 提供窄版／寬版現況＋目標稿各一（GitHub user-attachments，已轉錄於 Issue #132＜I＞）：

* 窄版目標：切三欄＝左大頭照放大佔兩列（正方）｜中 2×2 欄位（Player/Coins、Play time/Left time）｜右系統功能雙鈕直放（⚙設定、🔄更換玩家）；去「Princess」字。
* 寬版目標：上排大頭照＋雙鈕；下方 4 列帶 icon 直向堆疊（Player/Coins/Play time/Left time）。
* 兩版收斂到**同一套資訊結構**，差異僅排列方向。

## 3. 設計決策

### D1：寬窄共用單一資訊結構

* 資訊欄收斂為單一資訊結構＝大頭照 ＋ 四欄位（Player／Coins／Play time／Time left）＋ 兩系統鈕（⚙設定、🔄更換玩家）。寬窄差異僅止於排列（窄＝三欄橫向、寬＝直向堆疊）與斷點容性，不再寬窄各自為政（同 #111/#120「同元件單一機制」philosophy，惟對象為 `.side-panel`）。
* 名字去除「Princess」綴字（`#princessNameTitle` 只顯示玩家命名）。

### D2：時間顯示＝可玩時間額度（含聊天延長）＋ 剩餘倒數（對齊 sysCase#7.5）

* **Play time**＝本次「可玩時間額度」：基礎時長（預設 15 分、各帳號設定可調），生活聊天延長時把增加量一起標示——格式 `15 +3😄 min`（`+3` 用成功色、😄 緊接其後；無延長時僅 `15 min`，😄 只在有延長時出現）。把原本看不懂的「心情數字」轉為看得見、有回饋感的延長時間（心情機制本身不動）。
* **Time left**＝剩餘可玩時間倒數（如 `9:42`）。
* 移除 `.energy-meter` 百分比橫條（與 sysCase#7.5「不以百分比作為主要呈現」一致；時間改以上述文字呈現）。
* 確切標記樣式（顏色、😄 字符、倒數 mm:ss 或整數）留 3code 定案；行為已落 design.md spec#9／sysCase#7.5。

### D3：大頭照升級為即時穿搭頭胸照（單一共用渲染，對齊 sysCase#5.2／intTest#31）

* 把資訊欄大頭照由「單張 baseLayer 裁切」升級為「目前角色之即時穿搭頭胸裁切」：沿用既有紙娃娃層合成（`game-engine/render/paper-doll.js` 之 `activePaperDollLayers`／`avatarMarkup`），新增一個裁切為頭胸的 bust 呈現，餵入目前 outfit 即反映換裝。
* **統一**（USR 指示「統一簡單」，正好對齊 design.md 既有「同一個共用頭胸渲染函式」）：資訊欄與帳號卡顯示即時穿搭；選角畫面與公主選單因選角當下尚未套衣櫥，同一函式自然呈現各公主基本造型——不設特例。仍為頭胸裁切、不顯示全身紙娃娃。
* 既有 profileColor 背景、地圖光暈不變。

### D4：精簡側欄（移除冗餘元素）

* 移除：`.status-grid` 的 Mood 數字格、`.energy-meter` 橫條、`.equipped-box` 裝備文字框（穿搭已可由大頭照看見，文字重複）、`.notice-box`／`#statusMessage` 提示訊息框（USR 指定取消）、`.subtitle` 說明句、名字「Princess」綴字。
* 心情機制（聊天 +mood、延長時間）保留於邏輯層，僅移除其數字顯示。

### D5：版型方向（確切值留 3code）

* 窄版：`grid` 三欄＝`[大頭照 佔兩列 正方]｜[2×2 欄位]｜[雙鈕 直放]`。
* 寬版：直向＝`[大頭照 ＋ 雙鈕]` 一排，下接 4 列帶 icon 欄位。
* 通盤檢視 `styles/base.css` 與 `styles/mobile.css` 對 `.side-panel` 家族之規則，寬窄共用結構、差異僅斷點容性；像素/響應式值以實機 visual-qa（至少寬版＋窄版）定案。
* 與 #111 外框 `--adv-scene-height`、#120 內層 `--adv-dialog-height`、#103 底色家族協調，不互相打架；本案僅動側欄、不動對話框。

## 4. 本次設計文件變更（USR-gated 回修，已落地）

* `docs/design.md`（docLint sol = 0）：
  * spec#9：顯示「本次**開始時間**」→「本次**可玩時間額度**（基礎時長與生活聊天延長之合計，並使聊天延長可被看見）」。
  * sysCase#7.5：同上，延長量以清楚可見方式標記。
  * sysCase#5.2：頭胸大頭照渲染函式改「以目前角色之即時穿搭呈現」，選角呈現基本造型。
  * intTest#17／e2eTest#05：時間呈現用詞同步為「可玩時間額度」。
  * intTest#31：大頭照於資訊欄／帳號卡反映即時衣著、選角呈現基本造型（仍頭胸裁切、不顯示全身）。
* `README.md`（產品手冊初稿）：大頭照即時穿搭（L85、L159）、時間額度顯示（L94）對齊更新。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* design.md／README 已於本棒更新（上 §4）；3code 不再改 spec，只實作並回寫實況。
* 影響面：版型層 `styles/base.css`／`styles/mobile.css`（`.side-panel` 家族）、`index.html` L13–34（DOM 結構調整：去 subtitle/equipped/notice、四欄位、雙鈕、bust 容器）、`game-engine`（時間額度文字組裝、大頭照改用紙娃娃 bust 渲染、移除 mood/energy 顯示綁定）。
* 3code 完成判定：
  * GATE §1：`tsc`／`docLint`（sol 0）／`repoLint` 0；`?selftest=save-load`／`monkey`／`mood-extend` passed、console 0。
  * GATE §5（有畫面）：實機 visual-qa **寬版＋窄版**對照 USR 目標稿——三欄/直向結構正確、四欄位齊備、雙鈕可達、大頭照反映換裝、`15 +3😄 min`／剩餘倒數呈現正確、已移除元素不殘留；與 #111/#120 對話框、地圖光暈共存。

## 6. 實作與驗證結果（3code）

> 待 3code 實作後回填（沿 #101/#111/#120：本焦點 UI 修正不另產 `docs/test-summary.html`，GATE 驗證結果記於本節）。
