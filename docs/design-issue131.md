# 設計note — issue #131 強化公主主題顏色應用（識別色／背景花紋／卡片底色／地圖背版）

> 本檔為 2plan 設計note。**本議題非純 Option A**：除視覺/像素決策以本 note 承載外，因概念引入「粉彩識別色＋調色器自訂、背景花紋、卡片半透明底色、地圖橢圓背版」之能力／行為變更，已對 `docs/design.md` 作 USR-gated 回修（spec#6／#8／#9、solCase#6.2／#6.3、sysCase#5.2／#5.4、[datIntf自訂玩家公主識別設定]、intTest#26／#31／#40、docProgTest#06、e2eTest#10、成效 spec#6／#8／#9）。確切色值（hex）、花紋資產、alpha 與橢圓幾何留 3code visual-QA 定案。主體為公主視覺主題之應用面（`profileColor` 與其衍生視覺），非 #132 的資訊欄版型。

## 1. 現況量測（以產物為準）

* 識別色色盤 `profileColorPalette` = `content-package/characters/manifest.js` L18–35：16 色高飽和 Tailwind-500（`#ef4444`…`#64748b`，`Object.freeze`）。`normalizeProfileColor`（L92–94）採白名單——`palette.includes(color) ? color : defaultProfileColorFor(...)`，即**任何不在色盤內的值（含調色器自訂色）都會被重置**。
* 各可玩公主預設色（`characterRegistry`）：lumi `#ef4444`、yumi `#3b82f6`、sol `#eab308`、rosa `#22c55e`，皆取自上盤。
* 卡片底色三處作法不一致：
  * 選角卡 `.character-portrait`（`styles/character-select.css` L82）：`background-color: var(--active-profile-color, …)` 鋪滿純色。
  * 資訊欄 `.info-portrait`（`styles/base.css` L225）：`background: var(--active-profile-color, #fff5f8)` 鋪滿純色。
  * 帳號卡（`styles/account-select.css` L122）：已用 `color-mix(in srgb, var(--profile-color) 18%, #fff)` 柔化。
* 地圖公主 token 光暈：`.map-doll .paper-doll-layer`（`styles/paper-doll.css` L64–70，#126 導入）以 `drop-shadow(0 0 4px #fff) drop-shadow(0 0 8px var(--profile-color))` 呈現識別色光暈——即 USR 所指「糊糊的」。
* 色盤 grid `.profile-color-grid`（character-select.css L124）：`grid-template-columns: repeat(8, …)`，16 色排兩列。
* 背景花紋：**現行不存在**之新維度；各畫面背景為固定漸層／radial（base.css／map.css／mobile.css）。
* `profileColor` 為 per-account 狀態：`game-engine/state/default-state.js` L6、`game-state.js` L108（normalize）、`main.js` render 鏈（`updateProfileColorChrome` 等）。

## 2. 設計命題與開放點釘清

USR 原始概念（Issue #131＜I＞忠實轉錄）：①識別色太重→改飽和度較低的粉彩 8 色＋調色器自訂；②新增背景花紋（波浪／泡泡／格紋…≥8）；③選角卡與資訊欄卡片底色改用「人物背景顏色」半透明 alpha=0.30；④地圖光暈糊化→改用半透明橢圓當公主背版；⑤增加主題性。

* **「人物背景顏色」＝ `profileColor`（識別色）本身**：對照產物，三處卡片底色現皆鋪 `--active-profile-color`，故「人物背景顏色」即 per-account 識別色。一色多用（accent＋卡片半透明底版＋地圖橢圓背版＋花紋底色）。
* **spec 結構決策（obj 階段委派 plan）＝ Option A（不新增 spec#）**：粉彩＋自訂併入 spec#6（公主視覺主題）、卡片半透明辨識併入 spec#8、地圖橢圓背版精修 spec#9 用詞；背景花紋作為 spec#6 視覺主題之一環（新增 solCase#6.3／sysCase#5.4／intTest#40 承接），**不另立 spec#12**——沿 #101／#111／#120／#132 既例，避免容器級 spec 與下游大幅 renumber。
* **花紋套用範圍**：本案定位為「公主視覺主題」之底層紋理，套用於主題底版（卡片／場景背版層級），不覆蓋 ADV 對話文字 UI（見 D6）。確切套用面與層級留 3code 依 visual-qa 定案。

## 3. 設計決策（確切值留 3code）

### D1：識別色粉彩化（8 色）＋ 調色器自訂

* 色盤由 16 高飽和色改為 **8 種低飽和粉彩**。候選 hex（Tailwind 200/300 級，**僅候選、final 留 visual-qa**）：rose `#fda4af`、peach/amber `#fcd34d`、butter `#fde68a`、mint `#86efac`、sky `#93c5fd`、lavender `#c4b5fd`、lilac `#d8b4fe`、neutral `#cbd5e1`。
* 新增**調色器**（`<input type="color">` 或等效）供自訂任一色。
* `.profile-color-grid` 由 `repeat(8,…)` 兩列改為一列 8 色 ＋ 一個自訂入口。
* 對應 design.md：`paramProfileColorPalette=8 pastel preset colors`、`paramProfileColorCustomEnabled=true`、`paramDefaultProfileColors=lumi:rose,yumi:sky,sol:amber,rosa:mint`（保留舊預設色之色相家族：紅→rose、藍→sky、黃→amber、綠→mint）。

### D2：`normalizeProfileColor` 放寬 ＋ 舊存檔相容（無遷移損失）

* 驗證由「白名單 `palette.includes`」改為「**格式驗證**」——接受任何合法 hex（`#rgb`／`#rrggbb`），僅在缺漏或格式非法時才回退角色預設色。
* 效果：①調色器自訂色可存活；②**舊 16 色存檔之 `profileColor` 為合法 hex、原值保留、不被重置**（零遷移損失）。
* 須同步檢視所有 `profileColor` 消費點（`main.js` render、選角／帳號／側欄／地圖 token），確認放寬後無預期外行為。

### D3：背景花紋（≥8，per-account）

* 新增 per-account `backgroundPattern` 狀態（隨 `profileColor` 同層持久化，循既有 save/restore 管線；缺漏回退無花紋預設）。
* ≥8 種花紋，**優先 CSS 圖樣**（`repeating-linear-gradient`／`radial-gradient`／inline SVG data-uri，純靜態友善、零額外資產載入）：波浪、泡泡、格紋、圓點、條紋、星星、愛心、碎花。
* 花紋資產集登錄於 `content-package`（比照識別色，可模組化擴充，呼應 spec#7）。
* design.md：`paramBackgroundPatterns=8 (wave,bubble,grid,...)`。

### D4：卡片半透明底色 alpha=0.30（收斂三處為單一作法）

* 選角卡 `.character-portrait`、資訊欄 `.info-portrait`、帳號卡三處統一改為「識別色 @ alpha≈0.30」鋪底（`rgba()`／`color-mix(... 30%, transparent)` 或 CSS var），取代現行「純色鋪滿」與帳號卡的 `color-mix 18%, #fff`——**收斂為單一柔化來源**，不再三處各自為政（呼應「別疊床架屋」）。
* design.md：`paramCardBackgroundAlpha=0.30`。
* 頭胸 bust 疊於底版之上，0.30 淡色底不影響頭像與文字辨識；確切 alpha 微調與深/淺場景對比留 visual-qa。

### D5：地圖橢圓背版取代 drop-shadow 光暈（移除舊規則）

* `.map-doll .paper-doll-layer` 之 `drop-shadow(... var(--profile-color))` 光暈**移除**，改以公主 token 腳下一個半透明識別色**橢圓背版**（`::before`／背版層，填 `profileColor` 低 alpha），維持白色描邊 drop-shadow 以保清晰。
* 橢圓尺寸／位置（貼腳底）／alpha 留 3code visual-qa；**上線須移除舊光暈規則、不可新舊並存**（別疊床架屋）。

### D6：與既有視覺契約協調

* [hmiIntf自訂角色尺度與美術規範] 只規範角色尺度／rig／美術資產，**不涵蓋** UI 主題色／花紋／卡片／token——本案無須改該契約、亦不新增契約。
* 該契約 C 節「ADV 對話 UI 採低飽和深色高不透明底、不得白霧洗掉人物」針對**對話文字 UI**；本案花紋／半透明底版作用於**大頭照卡片與地圖 token 背版**，與對話 UI 分離、不衝突。花紋不得降低對話文字或選項可讀性（兒童遊戲可讀性優先）。

## 4. 本次設計文件變更（USR-gated 回修，已落地）

`docs/design.md`（docLint sol = **0 違規**）：

* **spec#6**：識別色加「飽和度較低粉彩色盤＋調色器自訂（既有存檔相容保留）」、可選背景花紋組成公主視覺主題。
* **spec#8**：大頭照卡片以帳號識別色之半透明底色鋪底辨識。
* **spec#9**：地圖 token「光暈」→「半透明識別色橢圓背版（取代光暈、避免邊緣糊化）」。
* **solCase#6.2**：識別色改粉彩色盤／調色器自訂、用於卡片半透明底色與地圖橢圓背版。
* **solCase#6.3（新增）**：[runAct自訂玩家設定公主背景花紋]。
* **sysCase#5.2**：放寬色盤白名單→格式驗證＋舊存檔相容、卡片底色 profileColor 半透明。
* **sysCase#5.4（新增）**：[modShell模組]承接背景花紋設定與持久化。
* **[datIntf自訂玩家公主識別設定]**：新增 `backgroundPattern` 欄位、放寬 profileColor 來源、token 光暈→橢圓背版。
* **(B)/(D) 重點組態**：`paramProfileColorPalette`→`8 pastel`、新增 `paramProfileColorCustomEnabled`／`paramBackgroundPatterns`／`paramCardBackgroundAlpha`、`paramDefaultProfileColors` 改粉彩名。
* **intTest#26／#31**：光暈→橢圓背版、粉彩 8 色＋自訂色＋卡片半透明。
* **intTest#40（新增）**：背景花紋 per-account 儲存還原＋自訂色容許＋舊存檔色值相容。
* **docProgTest#06／e2eTest#10**：選角說明同步粉彩／自訂色／背景花紋。
* **成效 spec#6／#8／#9**：補粉彩辨識度、自訂色保存率、背景花紋套用率、卡片半透明辨識、地圖橢圓背版呈現正確率。

`README.md`（plan 初稿，待 code/release 校準）：識別色／選角段落同步粉彩色盤＋調色器自訂、背景花紋、卡片半透明主題底色、地圖橢圓背版。

## 5. CHECKLIST 判定（plan 審查點）

* [✅] **A. 語意品質**：spec#6/#8/#9 仍為客戶目的／辨識成效；token 視覺、卡片辨識用詞沿既有 spec#8/#9 既定粒度（原 spec#9 即含「token 光暈用識別色」），未新增工程手段層級。
  **結果**：粉彩／自訂／花紋為使用者可見之個人化能力，非工程手段；格式驗證、alpha 等實作細節留於 sysCase／note，未上滲 spec。
* [✅] **B. 責任邊界**：solCase#6.3／sysCase#5.4 各為單一行為；層級邊界（sol→sys→mod）正確；花紋走 modShell 設定＋既有 save 持久化，未越界。
  **結果**：新增個案一案一主行為，與既有 selectActor/persist 分工一致。
* [✅] **C. 契約一致**：無新增契約引用；`backgroundPattern` 併入既有 [datIntf自訂玩家公主識別設定]；無孤兒／錯名。
  **結果**：[hmiIntf自訂角色尺度與美術規範] 不涵蓋本案視覺維度、無須改；契約同步無待補項。
* [✅] **D. 測試可執行**：intTest#40 步驟（設定→重整→還原／載入舊存檔）可腳本化、預期結果不需人工判斷；六類測試未互混（視覺美感歸 GATE visual-qa，不混入 intTest）。
  **結果**：自訂色保存、舊存檔相容、花紋持久化皆 selftest 可驗。
* [✅] **E. 開發備便**：design.md＋本 note 已提供 code 所需輸入（色盤／驗證放寬／花紋集／卡片 alpha／橢圓背版／移除舊光暈）；確切 hex／資產／alpha／幾何屬 code visual-qa，不列為缺漏。
  **結果**：備便，可交棒 code。

## 6. GATE（留待 3code）

* GATE §1：`tsc` 0／`docLint`(sol) 0／`repoLint` 0；selftest **profile-color**（擴充涵蓋 intTest#31/#40：粉彩 8 色、調色器自訂色容許、舊存檔色值相容、背景花紋 per-account 儲存還原）、save-load、accounts、map-avatar、data-audit 全 passed、console 0。
* GATE §5：實機 visual-qa（含行動直向）對照——8 粉彩色辨識度、調色器自訂、卡片半透明 alpha=0.30（選角／資訊欄／帳號卡三處一致）、地圖橢圓背版取代光暈（無糊化、無殘留舊 drop-shadow）、背景花紋 ≥8 套用且不損文字可讀性、多帳號識別色辨識。
* 「別疊床架屋」收尾檢核：橢圓背版上線後**確認舊光暈規則已移除**、舊 16 色色盤無硬編碼殘留引用（含 selftests／build/version.js）。
