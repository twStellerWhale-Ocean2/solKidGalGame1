# 設計note — issue #125 場景位置重新配置（地圖地點 marker 對應背景藝術、去群聚）

> 本檔為 2plan 設計note（**Option A**：本議題屬地圖地點配置之沉浸感／可讀性精修，地點座標為內容資料、`docs/design.md`（功能 spec/case/test）無對應像素落點，故 **design.md 與 README 不動、docLint 0**；配置決策以本 note 承載，確切座標留 3code 以實機 visual-qa overlay 逐圖×逐點定案）。對應既有 spec#2（角色陪伴與場景探索）／solCase#2.1（地圖導航與地點進入）。

## 1. 現況（以產物為準）

* **渲染機制**：地點 marker 純由各地區 manifest `nodes` 之 `x`／`y`（相對地圖寬高之百分比）疊在背景 [mapImage] 上繪製（[game-engine/map/viewport.js] `pointToStage`：`offset + (x/100)*displayWidth`）；座標與背景藝術無任何綁定。地圖圖檔 1536×1536（世界地圖 1024×1536）。
* **背景藝術判讀（本 note 配置依據）**：
  * 〔城堡〕藍頂城堡建於丘上、外環城牆帶塔；**中央主塔**居上方中央、**主入口大門＋階梯**居中央、**外牆前門（拱門）**在底部前牆、左下丘腳為樹林、左緣有河。
  * 〔市區〕圓形城牆鎮：**中央噴泉廣場**、上下各一座城牆門、民房（商店）散佈鎮內；**城牆外**僅底部水域之**港口船塢（左下）**與**燈塔（右下）**。
  * 〔鄉野〕**風車**居中偏左、**礦坑入口**在右上岩丘、**村舍群**在左下、**農田**在中／右、**溪流**沿右緣而下、**對外道路**自左緣而出。
  * 〔野地〕多為森林＋山＋**中央偏右瀑布溪流**；唯一**步道沿左側**自下而上（對外出口應在此路上）。
* **現況座標 vs 背景（節錄癥結點，以產物為準）**：

| 地圖 | 地點（node） | 現況 x,y | 與背景藝術之落差 |
|---|---|---|---|
| 城堡 | `kingHall` | 50.8, 35.8 | 未落在中央主塔 |
| 城堡 | `knightsRoom` | 72.3, 43.6 | 比 `queenStudy`(50.8) 高；應在城堡大門旁 |
| 城堡 | `castleSeamstress` | 28.0, 81.4 | 落在左下丘腳樹林；應在城堡底部 |
| 城堡 | `princessRoom` | 50.8, 56.0 | 應更居中（城堡之心） |
| 城堡 | `castleGate`（出口） | 50.5, 85.3 | 應對齊底部前牆城門拱門 |
| 市區 | `luminaraCastle`（對外出口） | 52.7, 15.0 | 在頂端；USR 訴求「在中間」 |
| 市區 | `boutique`/`hairSalon`/`shoeShop`/`accessoryShop`/`tailorStudio` | 群聚 x59–84, y54–70 | 過度群聚於右下角 |
| 市區 | `hairSalon`/`accessoryShop`/`lighthouse` 等 | x80–90 | 疑落城牆外；依設計僅港口／燈塔在城外 |
| 鄉野 | `mill` | 22.1, 67.7 | 應對齊風車（中偏左） |
| 鄉野 | `villageHome` | 26.7, 87.9 | 應對齊左下村舍群 |
| 鄉野 | `fishingShore` | 81.4, 85.9 | 應貼右緣溪流 |
| 野地 | `wildEntrance`（對外出口） | 82.0, 82.0 | 在右下森林；唯一步道在左側，出口應落左側步道 |

> 其餘未列之 node 同以 `nodes` x/y 配置，亦須依 §3 原則逐點對照背景校準。

## 2. 根因

* **座標即自由資料、與藝術無約束**：位置全靠人工目測對位，無「背景地物／城牆內外／道路河岸」之資料界線可循，易與背景脫節。issue #66 map-contract 初配後未再逐點校準。
* **群聚與越界無守門**：同圖多點 x/y 相近造成視覺群聚（市區右下）；部分點落在語意不符的背景區（城外、樹林），無自動檢核。
* **出口語意未對齊**：各地圖對外出口／傳送點（`kind:"gate"`／`markerStyle:"portal"`）未必落在背景的門／路口。

## 3. 設計決策

### D1：配置原則（設計契約，3code 須逐點滿足）

* **P1 對應背景**：每個地點 marker 須落在其語意對應之背景地物上（國王→主塔、釣魚→溪流、出口→城門／道路…）。
* **P2 去群聚**：同一地圖任兩 marker 之間距不得過近（建議下限：marker 中心間距 ≥ 地圖短邊 8%），避免群聚與標籤重疊。
* **P3 出口落門／路**：對外出口與傳送點（castle `castleGate`、urban `luminaraCastle`、rural `ruralExit`、wild `wildExit`）須落在背景的城門或可見道路上。
* **P4 語意分區**：marker 不得落在語意矛盾之背景區。市區**僅** `port`／`harbor`／`lighthouse` 在城牆外（貼港口／燈塔），其餘地點一律在城牆內；其他地圖同理（如水陸、城內外）。
* **P5 不破壞拓樸**：僅改 `x`／`y`；不得更動 node `id`／`links`（路網連通）／`defaultNode`／`entryNode`／`portalId`；marker 不得超出地圖邊界（0–100 安全邊距）或彼此重疊遮擋。

### D2：配置方法（⚠️ USR 待裁，見 §4 ②）

* **方案甲（建議）**：純手調各 `nodes` x/y，以實機 visual-qa overlay（marker 疊背景）逐圖×逐點校驗。**最小變更、限內容資料層**，不新增資料結構、不動引擎與遊戲邏輯。
* **方案乙**：另立「背景地物分區參考」資料（城牆內外多邊形／道路線／河岸線）供配置與**自動越界／群聚檢核**。較能防未來換圖漂移，但增建模與維護成本。

### D3：各地圖目標配置（landmark→marker，提案座標待 3code visual-qa 微調定案）

> 以下為依背景藝術判讀之**提案目標**（百分比座標），非定值；3code 以 overlay 逐點微調至滿足 D1。未列之 node 依 P1–P4 原則就近對應背景。

* **城堡（castle）**
  * `kingHall` → 中央主塔頂：~50, 24
  * `princessRoom` → 城堡之心（正中）：~50, 50
  * `queenStudy` → 左上側塔：~36, 34
  * `knightsRoom` → 城堡大門旁（前庭側）：~60, 76
  * `castleSeamstress` → 城堡底部（前牆內側偏左）：~33, 70
  * `castleKitchen` → 右側下翼：~66, 58
  * `maidsRoom` → 左側中翼：~38, 60
  * `royalCloakRoom` → 右側塔翼：~67, 44
  * `castleGate`（出口）→ 底部前牆城門拱門：~42, 85
* **市區（urban）**
  * `luminaraCastle`（對外出口）→ 城牆門（見 §4 ③）：提案頂門中央 ~47, 7
  * 鎮內地點（`market`/`schoolClassroom`/`library`/`temple`/`administration`/`garden`/`boutique`/`hairSalon`/`tailorStudio`/`shoeShop`/`accessoryShop`/`dressBoutique` 等）→ **散佈城牆內民房**（約 x15–78, y15–50），相互拉開、去右下群聚
  * `harbor`（Fish Shop）→ 港口船塢（城外左下）：~25, 80
  * `port`（Harbor Port）→ 港口船群（城外）：~35, 86
  * `lighthouse` → 燈塔（城外右下）：~88, 80
* **鄉野（rural）**
  * `mill` → 風車：~33, 62
  * `mine` → 礦坑入口：~65, 18
  * `villageHome` → 左下村舍群：~13, 82
  * `fishingShore` → 右緣溪流：~82, 72
  * `farm` → 農田：~60, 50
  * `pasture` → 上方開闊牧地：~55, 32
  * `loggingCamp` → 堆木處：~46, 30
  * `ruralEntrance`（World Road）→ 左緣對外道路：~7, 80
* **野地（wild）**
  * `wildEntrance`（World Path，對外出口）→ **左側步道**：~14, 88
  * 童話地點（`elfGlade`/`fairyAtelier`/`dwarfCottage`/`halflingVillage`/`wizardHut`/`threePigsCottage`/`treeSpiritGrove`/`stoneGolemPass`/`redHoodPath`）→ 森林無具象地標，依 P2 去群聚均勻散佈，臨水者貼中央偏右溪流；確保對外出口落於左側步道（與 `redHoodPath` 之左下路段不重疊）

### D4：範圍與相容

* **範圍**：城堡／市區／鄉野／野地四張地區地圖之 `nodes` x/y。世界地圖 [content-package/areas/world.js] 之四區 destination 座標 USR 未指明問題，**提案不納入本案**（見 §4 ④）。
* **相容**：純內容資料（`nodes` x/y）調整，不動 [game-engine/map] 渲染（viewport／actors）、不動遊戲邏輯、不動 DOM；`links`／`portalId`／`defaultNode`／`entryNode` 保持不變。

## 4. 審查點（⚠️ USR 待裁，plan 交棒前確認）

* **① design.md 落點**：
  * **Option A（建議）**：地點座標屬內容資料、design.md＜I＞無像素落點，維持 spec#1–#11 與條文不變，配置決策以本 note 承載（同 #120／#132）。
  * **備選（輕修）**：將「地圖地點配置須對應背景藝術且不過度群聚」提升為 design 級需求，對 spec#2／solCase#2.1（或 solCase#7.2 維護者擴充內容）作 USR-gated 文字精修（不增減 spec# 編號），使未來新增地圖內容有設計錨點。
* **② 配置方法**：方案甲（手調＋visual-qa，建議）vs 方案乙（背景分區參考＋自動檢核）。
* **③ 市區對外出口「在中間」之確切落點**：提案落於**頂門中央**（~47, 7，城牆門上、水平置中）；若 USR 指「中央廣場」或「下門」另有所指，請於 PR 指明。
* **④ 範圍**：是否一併校準世界地圖 [world.js] 四區 destination？提案**不納入**（USR 未指出問題）。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **不動** `docs/design.md`（docLint sol 0，已驗）與 `README.md`（無對外行為變更）；本案產物為各地區 manifest `nodes` x/y 之重排，配置依據記於本 note。
* 3code 完成判定：
  * **GATE §1（機器判定）**：`tsc`／`docLint`／`repoLint` 0；`?selftest=save-load`／`monkey` passed、console 0；地圖 marker 結構／路網 selftest（如 `map-avatar`）passed。
  * **GATE §5（實機 visual-qa，逐圖×逐點）**：城堡／市區／鄉野／野地四圖，將 marker 疊背景圖佐證——每點落在 D1 對應地物（P1）、無群聚與標籤重疊（P2，量測最小間距）、出口落城門／道路（P3）、市區僅港口／燈塔在城外（P4）、無越界重疊（P5）；行動直向為主、桌機寬版併驗。

## 6. 實作與驗證結果（3code 填寫）

> 待 3code 實作後回填（沿 Option A：focused 內容修正不另產 `docs/test-summary.html`，GATE 驗證結果記於本節）。
