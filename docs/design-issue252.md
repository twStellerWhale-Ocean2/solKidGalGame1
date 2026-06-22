# 設計note — issue #252 城堡地圖入口圖示在公主接近時異常消失

> 本檔為 2plan 設計note。**初判 Option A**（obj 已預核此方向）：本項為既有方案下之地圖標記顯示機制修正，於 `docs/design.md` ＜I／II＞無須增刪修改 **spec# 編號**；規則由本 note 承載、由 3code 落地並以 selftest／實機 visual-qa 守回歸。意旨對應既有 **spec#2**（可用角色陪伴與場景探索維持遊玩意願——含「公主頭像在世界／城堡／地區地圖一致地移動並進入地點場景」，對應 **solCase#2.1** [runAct自訂玩家地圖導航]）：城堡入口（城門）在公主接近時消失，使「各地圖一致移動並進入地點場景」之承諾於入口處未被滿足，本案回復其一致性。⚠️ 審查點見 §4。

## 1. 現況量測（以產物為準，已實機坐實）

### 城堡入口＝ `castleGate`，節點貼地圖底緣

* 城堡地圖入口對應 [content-package/areas/castle/manifest.js] 之 `castleGate` 地點（`icon=🏰`、`kind="gate"`、`markerStyle="portal"`、`portalId="castleGate"`），是公主返回世界地圖之傳送門。
* `castleGate` 節點座標 `x=39`、`y=95.3`——緊貼 `1536×1536` 城堡地圖**底緣**（為全城堡地圖最貼邊之節點）。

### 地圖標記顯示為單一統一機制（無 gate 專屬隱藏碼）

* 全 [game-engine/main.js] 三 renderer（`renderCastleMap`／`renderWorldMap`／`renderHotspots`）皆對每個 marker 呼叫 [game-engine/map/marker-visibility.js] 之 `updateMarkerEdgeVisibility`：當 marker 之 `getBoundingClientRect()` **整個外框**未完全落在 `stage ∩ visualViewport`（預設 `padding=2`）內，即掛 `.map-marker-offscreen`（[styles/map.css] `visibility:hidden; opacity:0; pointer-events:none`）。
* marker 一律以 [styles/map.css] `.map-marker { transform: translate(-50%, -50%); }` 將**圖示中心**對位到座標點。
* `.nearby` 高亮（公主進入 `focusRadius`＝城堡 5.8 之地點時套用）會將 portal marker 由 `58px` 放大為 `72px`（[styles/map.css] `.hotspot.portal` 與 `.nearby` 互動）。
* 經 grep（`markerStyle`／`portal`／`hideMarker`／`currentNode` 等）查無針對 gate／portal 或「公主所在 marker」之專屬隱藏舊碼——使用者所疑之「舊程式碼殘存」不成立，隱藏唯一來源為上述統一邊界裁切。

### 癥結＝統一裁切以「整個外框」判定，誤殺貼邊放大之入口（實機證據）

* 桌機（1280×800、contain-fit、`pan=0`，穩定可重現）量測城堡各 marker：

  | marker | `y%` | 中心 `cy` | 外框 bottom | `.map-marker-offscreen` |
  |---|---|---|---|---|
  | princessRoom | 42.4 | 340 | 361 | 否（顯示） |
  | castleSeamstress | 64 | 513 | 534 | 否（顯示） |
  | **castleGate**（`.nearby` 72px） | **95.3** | **763** | **799** | **是（隱藏）** |

  裁切界 `stageBottom - padding = 800 - 2 = 798`；gate 外框 bottom `799 > 798`，**差 1px 即整顆被裁**。但 gate 之**中心 `cy=763` 明在 stage 內（< 800）**。
* mobile（375×812、cover-fit＋pan，mobile-first 實際情境）：以實際 `.map-marker-offscreen` class 為真值，公主置於入口時**全城堡僅 `castleGate` 一顆被裁**，其餘地點皆顯示——與使用者回報「只有入口消失」完全吻合；gate 中心 `cy≈772` 亦恆落在 stage（0–812）內。
* **「靠近時才消失」之精確成因**：公主走進入口 `focusRadius` → `castleGate` 成為 `activeCastleHotspot` → 套 `.nearby` 放大 `58→72px` → 放大後外框下緣戳破裁切界數 px → 統一裁切將整顆入口隱藏。此為「`.nearby` 放大 × 邊界裁切 × 節點貼邊」三者交互之**統一機制副作用**，非個別異常或舊碼。

### 既有回歸測試未守邊界裁切語意

* `?selftest=map-avatar`（[game-engine/testing/selftests.js]）守跨地圖 token 一致、商店方形 marker、#180 token z-order，但**未驗** `updateMarkerEdgeVisibility` 對「中心在界內、外框戳邊」之貼邊 marker 是否誤裁。

## 2. 設計命題（USR 目標）

* 目標①**入口恆顯示**：城堡入口（城門）marker 在公主接近（含 `.nearby` 放大）時維持顯示、可點擊，與其他地點、其他地圖之標記行為一致。
* 目標②**統一不特例**：修正須落在**單一共用機制**上、跨三地圖一致，不得為城堡入口加 `castleGate` id 級特例或改其座標硬閃避（否則正中使用者所慮之技術債）。
* 目標③**不退化既有裁切意圖**：真正被平移／縮放移出可視範圍（panned-away）之 marker 仍須隱藏並移除其 tab／aria 可達性，避免畫面外的隱形可點擊死角。
* 範圍界定：主體＝ [game-engine/map/marker-visibility.js] `updateMarkerEdgeVisibility` 之**判定基準**；節點座標、`.nearby` 放大、token z-order（#180）、走動輸入等**不在本案改動範圍**。

## 3. 設計決策（確切實作細節見 §6）

### D1：根因＝裁切以「整個外框落在界內」判定，對貼邊放大 marker 過嚴

* marker 以中心錨點（`translate(-50%,-50%)`）對位座標；要求**整個外框**都在界內，等同要求座標點離邊至少半個圖示寬高。貼邊節點（入口 `y=95.3`）放大後外框必然戳邊而被整顆裁掉。

### D2：改以「marker 錨點（中心）是否在可視範圍內」判定（統一、最小改動）

* 將 `updateMarkerEdgeVisibility` 之 `visible` 由「外框四邊皆在 `bounds` 內」改為「**marker 中心點 (cx, cy) 在 `bounds` 內**」。
* 語意：marker 中心（即其對位之地圖座標點）落在可視範圍內＝該地點可達、應顯示；中心被平移／縮放移出可視範圍才隱藏。
* 此判據**只會比原本更寬鬆**（原顯示者恆顯示，部分原被裁之貼邊 marker 轉為顯示），**不會新增任何隱藏**，故不可能令任何 marker 消失而退化。
* 一處共用函式、三 renderer 自動受惠（D 跨地圖一致），無 id 特例、不動節點座標、不動 `.nearby` 放大。

### D3：保留 panned-away 隱藏與可達性處理（不退化目標③）

* 中心移出 `bounds` 時仍掛 `.map-marker-offscreen` 並設 `aria-hidden`／`tabIndex=-1`（維持原行為），確保畫面外 marker 不可 tab／點擊。
* `padding` 與 `stage ∩ visualViewport` 之 `bounds` 計算維持不變，僅改比較對象（外框→中心）。

### D4：回歸守門——補可機判的中心錨點裁切斷言

* 新增 `?selftest=marker-visibility`：以固定尺寸 stage 與合成探針 marker，驗證
  * (A) 貼邊 marker（中心在界內、外框戳出底緣）**不**被判 offscreen；
  * (B) 中心移出視口之 marker **仍**被判 offscreen；
  * (C) 置中 marker 顯示。
  此測試獨立於地圖實際幾何、可機判，直接守住 D2 語意（舊「外框」判據下 (A) 必失敗）。

## 4. 審查點（⚠️ 待 USR 裁決）

* **① design.md 落點 → 初判 Option A（建議，obj 已預核）**：本機制規則由本 note 承載、3code 落地、selftest／實機 visual-qa 守回歸；`docs/design.md` ＜I／II＞ spec# 編號不增刪、文字不改（docLint sol 維持 0）。
  * **可選 Option B（USR-gated）**：因 design.md 已以 `solCase#2.1` 記錄跨地圖一致導航，可於 `spec#2` 句末微修補述「地圖地點標記以其中心錨點是否在可視範圍判定顯示，貼邊入口不因外框戳邊被裁」（屬 ＜I＞ 回修、USR-gated）；spec# 編號不增減。預設不做、維持 Option A。
* **② 實作手法（中心判據 vs 其他）**：建議 **D2 中心錨點判據**（最小改動、統一、不可能退化可見性）。其餘方案（豁免 portal 類、調 `castleGate` 座標、置中留底 padding）皆為個別特例或治標，已於 §3 否決。
* **③ 範圍確認**：建議僅改 `updateMarkerEdgeVisibility` 判定基準（D1–D4），節點座標／`.nearby`／token z-order 不動。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物（plan）**：本設計note（Option A）＋ [README.md] ＜變更紀錄＞補一筆。`docs/design.md` 未改（docLint sol 維持 0）。
* **3code 程式產物**（依本 note §3）：
  * [game-engine/map/marker-visibility.js]：`updateMarkerEdgeVisibility` 改中心錨點判據（D2／D3），加註 issue #252 約定。
  * [game-engine/testing/selftests.js]：新增 `runMarkerVisibilitySelfTest`（D4）並於 `installTestingHooks` 註冊；bump [game-engine/main.js] 之 `selftests.js?v=`。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`node --check`（改動檔）／`docLint docs/design.md`（sol 0）／`repoLint .` 0；headless selftest PASS、console 0 error；新增 `marker-visibility` PASS、既有 `map-avatar`／`map-walk`／`scene-nav`／`data-audit`／`monkey` 維持綠燈。
  * **GATE §5（實機 visual-qa，異動渲染顯示）**：公主接近城堡入口（桌機＋手機直向）入口 🏰 完整顯示且可點擊進入世界地圖；修前／修後對照；確認其他地點與其他地圖標記不退化。

## 6. 實作與驗證結果（3code，2026-06-22）

> 沿既有焦點修正慣例：本焦點變更之 GATE 驗證結果記於本節與 PR 留言。`docs/design.md` 未改（Option A，docLint sol 0）。三審查點均採 §4 建議預設（Option A／中心判據／僅改判定基準，USR 於本對話以「PLAN+CODE+MERGE」核准）。

### 實作（依 §3 D1–D4）

* **D1／D2／D3（[game-engine/map/marker-visibility.js]）**：`updateMarkerEdgeVisibility` 之 `visible` 改為比較 marker 中心點 `((left+right)/2, (top+bottom)/2)` 是否落在 `bounds`（原 `stage ∩ visualViewport - padding`）內；`.map-marker-offscreen` 切換與 `aria-hidden`／`tabIndex` 處理維持不變（D3）。加註 #252 約定與「只放寬、不新增隱藏」之不變式。
* **D4（[game-engine/testing/selftests.js]）**：新增 `runMarkerVisibilitySelfTest`（`?selftest=marker-visibility`），合成固定 stage 與三探針 marker 驗 (A)/(B)/(C)；於 `installTestingHooks` 註冊；bump [game-engine/main.js] `selftests.js?v=20260622-issue252-marker-center`。

### GATE §1（機器判定）

* `node --check`：`game-engine/map/marker-visibility.js`／`game-engine/testing/selftests.js`／`game-engine/main.js` → OK。
* headless selftest（本機 server :4174 服務本分支檔案）：`marker-visibility` PASS（含舊判據下必失敗之貼邊 (A) 案例）；`map-avatar`／`map-walk`／`scene-nav`／`data-audit`／`monkey`(300) 全 PASS、console 0 error。
* 依賴安全：純靜態網站、無 package 相依（STACK techStackStaticWeb），`npm audit` 不適用。

### GATE §5（實機 visual-qa）

* 桌機 1280×800：修前 公主接近入口時 `castleGate` 標記 `.map-marker-offscreen`（`visibility:hidden`，外框 bottom 799 > 界 798）；修後 同一狀態 `castleGate` 中心 `cy=763` 在界內 → 顯示、可點擊。
* 手機 375×812：修前 公主置於入口時全城堡僅 `castleGate` 被裁；修後 顯示，其餘地點與其他地圖標記不退化。
* **分級**：`務必要修` 0。**結論：可宣稱完成。**
