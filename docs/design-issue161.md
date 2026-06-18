# 設計note — issue #161 地圖公主 token 放大並移除識別色背板（feat(map)）

> 本檔為 2plan 設計note。本案對 `docs/design.md` 採 **USR-gated 輕修（spec# 編號不增減）**：精修 **spec#9** 末句（地圖 token 標示）、調整 **solCase#6.2**（識別色用途移除地圖背板）、**intTest#26**（跨地圖頭像改驗放大且無背板）、**intTest#31**（移除地圖識別色斷言）、＜IV.B＞spec#9 觀察項。意旨對應既有 **spec#9**（地圖上公主 token 標示）。⚠️ 審查點見 §4：核心決策為「**地圖上不再呈現各帳號識別色**」，obj 階段 USR 已拍板採方案 1（以視覺簡潔為先，2026-06-19）。

## 1. 現況量測（以產物為準）

* 地圖公主 token 視覺由 `.map-doll` 承載：[styles/paper-doll.css:8]（desktop，`54×70px`）與 [styles/mobile.css:356]（mobile，同 `54×70px`）各定義一份，內含即時穿搭紙娃娃層；於世界地圖 `worldPlayerToken`、城堡地圖 `castlePlayerToken`、區域地圖 `playerToken` 皆套用（[game-engine/main.js:292] `updateProfileColorChrome()` 對三者注入 `--profile-color`）。marker 容器 `.player`／`.world-player`（[styles/map.css:91]，`54×70px`，`translate(-50%,-50%)` 腳下定位）包覆 doll。
* 「圓形背板」＝ `.map-doll::before`（[styles/paper-doll.css:17]）：置於 doll 腳下、`z-index:0` 的識別色半透明橢圓，由 `--profile-color` 上色。#131 引入（取代 #126 識別色光暈 drop-shadow、避免糊化），#153 再調為近實心識別色並收窄柔邊以在花俏地圖上「清楚標示」。
* **圖地分離不只靠背板**：#131 移除了 `.map-doll .paper-doll-layer` 的**識別色光暈** drop-shadow，但**保留深色投影＋白描邊**維持頭像清晰銳利（[styles/paper-doll.css:90-97]：`drop-shadow(0 3px 4px …) drop-shadow(0 0 4px #fff)`）。故去背板後 doll 仍具圖地分離；背板現存主要機能為**承載地圖上各帳號識別色**（地圖上唯一的識別色線索）與提升整體醒目度。
* selftest 對地圖 token 之既有斷言：`?selftest=profile-color` 斷言 `worldPlayerToken` 之 `--profile-color`（[game-engine/testing/selftests.js:509]）；`?selftest=map-avatar` 驗跨地圖頭像顯示（對應 intTest#26）。
* ＜II.D 重點組態＞無地圖 token 專屬參數（`paramCardBackgroundAlpha=0.45` 僅供大頭照卡片底色，與地圖背板無關），故本案無 ＜II.D＞ 變更、無死參數新增。
* 連線檢查：目標 repo [solKidGalGame] Issue 讀寫正常、repo 為 public；本地自最新 `main`（HEAD 為 #170 merge `7bd62ca`、與 `origin/main` 同步）開 `feat/issue161-map-token-enlarge`、工作區乾淨。

## 2. 設計命題（USR 目標）

* 進場原始概念：「地圖上公主圖示加大一倍，去除圓形背板」。
* 目標：地圖公主 token **放大約一倍**（線性尺寸加倍為目標量級）使其更醒目，並**移除腳下的識別色橢圓背板**使視覺更簡潔。
* 識別色決策（obj 階段 USR 拍板，2026-06-19）：採**方案 1——接受地圖上不再呈現各帳號識別色**（以簡潔為先），不另加替代載體；識別色仍用於大頭照卡片底色與帳號辨識。

## 3. 設計決策（確切倍率與斷言留 3code）

### D1：地圖 token 放大約一倍

* 放大 `.map-doll`（[styles/paper-doll.css:8] desktop 與 [styles/mobile.css:356] mobile **兩處須一致**）至約一倍（`54×70` → 目標量級 `≈108×140`），必要時同步其 marker 容器 `.player`／`.world-player`（[styles/map.css:91]），確保**腳下定位錨點放大後仍對齊地圖座標、不偏移**。
* 確切像素／倍率與 mobile 比例由 3code 以實機 visual-qa（寬＋窄）校準，並確認放大後不與地圖 hotspot、地點標籤重疊遮擋，`hop`／`mapIdle` 待機動畫與 `.world-player.traveling` 位移過場比例協調、不於小螢幕過界。

### D2：移除識別色背板、地圖不再呈現識別色

* 移除 `.map-doll::before`（[styles/paper-doll.css:17]）橢圓背板樣式；圖地分離續由既有 `.map-doll .paper-doll-layer` 深色投影＋白描邊（[styles/paper-doll.css:92-97]）承擔，**不回到 #126 的糊化光暈**。
* 清理地圖 token 之 `--profile-color` 殘留：`updateProfileColorChrome()`（[game-engine/main.js:292]）對 `worldPlayerToken`／`playerToken`／`castlePlayerToken` 的識別色注入於地圖已無作用，應一併清理；**惟 `--profile-color` 於資訊欄頭像（`sideProfileAvatar`）、帳號／角色選單等他處仍在用，僅清地圖 token 這一路**，不得波及大頭照卡片底色與選色 UI。

### D3：範圍與相容

* **範圍**：[styles/paper-doll.css]（`.map-doll` 尺寸、移除 `.map-doll::before`）、[styles/mobile.css]（`.map-doll` 尺寸）、必要時 [styles/map.css]（marker 容器尺寸）、[game-engine/main.js]（地圖 token 之 `--profile-color` 殘留清理）；變更同時涵蓋世界／城堡／區域三地圖之 token（皆用 `.map-doll`），desktop 與 mobile 兩套尺寸一致調整。
* **相容**：不動換裝紙娃娃 rig、不動地圖導覽／走動／走到再進入（#99）、不動 hotspot 佈局與地點配置（#125）；與 [contract-local/hmiIntf自訂角色尺度與美術規範.md] 比例對齊，放大後不失真。
* **測試斷言調整（交棒 3code）**：`?selftest=profile-color` 移除對 `worldPlayerToken` `--profile-color` 之斷言（[selftests.js:509]）；`?selftest=map-avatar`（對應 intTest#26）改驗「token 放大且無識別色背板（`.map-doll::before` 不渲染、token 未套用 profileColor 背板）」，避免測試與實作漂移。

## 4. 審查點（⚠️ 待 USR 裁決）

* **① 識別色去留（核心）**：去背板使地圖上不再呈現各帳號識別色。obj 階段 USR 已拍板採**方案 1：接受地圖不再呈現識別色、以簡潔為先**（2026-06-19）；plan 沿此定案。若 USR 改要求保留識別色，須另以不糊化之替代載體（如細描邊著色）設計、回修 spec#9。
* **② design.md 落點**：採 USR-gated 輕修——spec#9 末句＋solCase#6.2＋intTest#26／#31＋＜IV.B＞spec#9 觀察項；**spec# 編號不增減**（地圖 token 標示為 spec#9 既有條文之精修，非新 spec/story）。docLint(sol)＝0、repoLint＝0 已驗。
* **③ 放大倍率與視覺校準**：「加大一倍」為線性尺寸加倍之目標量級；確切像素、mobile 比例與不過界／不遮擋由 3code 以實機 visual-qa 校準。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物（plan）**：本設計note ＋ `docs/design.md`（spec#9／solCase#6.2／intTest#26／intTest#31／＜IV.B＞spec#9，docLint sol 0）＋ `README.md` ＜地圖導覽＞／＜成功判定＞／＜變更紀錄＞同步（2plan 初稿，待 dev／opr 校準）。無新增契約引用（契約同步 N/A）。
* **3code 程式產物**（依本 note §3）：[styles/paper-doll.css]（`.map-doll` 放大、移除 `.map-doll::before`）、[styles/mobile.css]（`.map-doll` 放大）、必要時 [styles/map.css]（marker 容器）、[game-engine/main.js]（地圖 token `--profile-color` 殘留清理）、[game-engine/testing/selftests.js]（`profile-color`／`map-avatar` 斷言調整）。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`tsc`／`docLint`(sol 0)／`repoLint` 0；`node --check`；`?selftest=profile-color`／`?selftest=map-avatar` 依新斷言全綠（token 放大、`.map-doll::before` 不渲染、地圖 token 無 profileColor 背板），`monkey` 全綠、console 0 error（對應 intTest#26／#31）。
  * **GATE §5（實機 visual-qa）**：於世界／城堡／區域三地圖、寬與窄視窗確認公主 token 明顯放大、無圓形背板、腳下定位不偏移、不遮擋 hotspot／地點標籤、待機與位移動畫正常。
