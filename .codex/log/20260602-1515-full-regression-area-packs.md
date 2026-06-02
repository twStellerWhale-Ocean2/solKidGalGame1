# 20260602-1515 full regression: area packs / forest

## Scope

本輪依使用者要求，針對 Issue #47 地區資源包模組化後的實際瀏覽器互動做完整功能回歸。使用者要求不要再截圖，因此本紀錄只記錄功能、狀態與按鈕覆蓋，不作美術截圖驗收。

Browser gate:

- 已先嘗試 Browser plugin 的 Codex In-app Browser `iab`。
- `agent.browsers.get("iab")` 可取得 browser instance，但 `tabs.selected()` / `tabs.new()` 仍停在 webview attach timeout，且 visibility 設定後仍回報不可見。
- 依 browser tooling guard fallback 規則，改用同一 Browser plugin 列出的 Chrome extension backend 操作 `http://127.0.0.1:4174/`。

## Map / Area / Portal

通過：

- Castle map: 4 markers，包含 `castleGate` portal。
- Kingdom map: 11 markers，包含 `luminaraCastle`、`forestEdge` 兩個 portal。
- Forest map: 5 markers，包含 `forestExit` portal，且 map image 來源為 `src/areas/forest/assets/forest-map.svg`。
- 底部快速地區切換按鈕未出現在 DOM 可見畫面。
- Route 實測：
  - Castle `castleGate` -> Kingdom。
  - Kingdom `forestEdge` -> Forest。
  - Forest `forestExit` -> Kingdom。
  - Kingdom `luminaraCastle` -> Castle。
- 鍵盤移動實測：
  - Castle `#castleStage` ArrowRight 會改變 player position。
  - Kingdom `#mapStage` ArrowRight 會改變 player position。
  - Forest `#mapStage` ArrowRight 會改變 player position。

備註：

- Forest exit retest 中，因角色初始就在出口附近，第一次點擊 marker 即完成 route；原本測試腳本預期第二次點擊，已判定為測試假失敗並補測通過。

## Scene First Layer

通過：

- Princess Room 第一層：
  - `Dresses` -> Wardrobe detail -> `Back` 回 Princess Room。
  - `Accessories` -> Wardrobe detail -> `Back` 回 Princess Room。
  - `Shoes` -> Wardrobe detail -> `Back` 回 Princess Room。
  - `Leave` -> 回 Castle map。
- Castle future markers:
  - `kingRoom` 不進場，只顯示 later chapter status。
  - `queenRoom` 不進場，只顯示 later chapter status。
- 全部 13 個可進場非 portal 場景均測過第一層：
  - Kingdom: `port`、`garden`、`market`、`harbor`、`boutique`、`shoeShop`、`accessoryShop`、`farm`、`lighthouse`。
  - Forest: `cave`、`dwarfCottage`、`mountainPeak`、`treeSpirit`。
- 一般 NPC 場景第一層有 `Help` + footer `Leave`。
- Shop 場景第一層有 `Help` / `Shop` / `Refund` + footer `Leave`。
- `Help` 進入 hint 或 quest 後，navigation footer 可返回或離開。

## Quest / Help

全 12 個 lesson place 都完成：地圖 marker 進場 -> 第一層 `Help` -> quest -> 錯答 -> 正答 -> complete state。

通過地點：

- Kingdom: `garden`、`market`、`harbor`、`boutique`、`shoeShop`、`accessoryShop`、`farm`、`lighthouse`。
- Forest: `cave`、`treeSpirit`、`mountainPeak`、`dwarfCottage`。

完成畫面按鈕通過：

- 非 shop quest representative:
  - `Choose Reward` -> reward shop。
  - `Back to Room` -> Castle / Princess Room map view。
  - `Leave` -> 關閉 ADV。
- Shop quest representative:
  - `Shop` -> 原店 shop detail。
  - `Back to Room` -> Castle / Princess Room map view。
  - `Leave` -> 關閉 ADV。

## Shop

使用 `coins=5000` 實測所有店家可購買流程，逐一 preview 與 buy。

通過：

- `market`: `studyDesk`、`seaLamp`。
- `boutique`: `blueDress`、`roseDress`、`snowDress`。
- `shoeShop`: `pinkSlippers`、`blueBoots`。
- `accessoryShop`: `goldCrown`、`silkRibbon`、`pearlBag`、`starCape`。
- `dwarfCottage`: `mossCloak`。

每店購買完畢後均進入 sold-out state，且 footer `Back` 回第一層 scene。

不足額流程：

- `market`、`boutique`、`shoeShop`、`accessoryShop`、`dwarfCottage` 均用 `coins=0` 測過。
- `Need N` action 可點；點擊後顯示 `Not enough coins`，商品仍留在清單，coins 保持 0。

## Refund

使用 `owned=all` 實測每間店的所有可退款品項，逐一 preview 與 refund。

通過：

- `market`: `studyDesk`、`seaLamp`。
- `boutique`: `blueDress`、`roseDress`、`snowDress`。
- `shoeShop`: `pinkSlippers`、`blueBoots`。
- `accessoryShop`: `goldCrown`、`silkRibbon`、`pearlBag`、`starCape`。
- `dwarfCottage`: `mossCloak`。

每店退款完畢後均顯示 no treasures to refund，且 footer `Back` 回第一層 scene。

空退款狀態：

- 使用 fresh state 從第一層 scene 點 `Refund`，`market`、`boutique`、`shoeShop`、`accessoryShop`、`dwarfCottage` 均顯示空清單，且 `Back` 回 scene。

## Wardrobe

使用 `owned=all` 實測全部 wardrobe 分類與品項。

通過：

- Dresses:
  - Preview: `pinkDress`、`blueDress`、`roseDress`、`snowDress`。
  - Equip: `blueDress`、`roseDress`、`snowDress`。
- Accessories:
  - Preview + Equip: `goldCrown`、`silkRibbon`、`pearlBag`、`starCape`、`mossCloak`。
- Shoes:
  - Preview + Equip: `pinkSlippers`、`blueBoots`。
- Room Treasures:
  - Preview + Place: `studyDesk`、`seaLamp`。

空分類：

- Fresh state 下 `accessory`、`shoes`、`room` 分類均顯示空狀態，且 `Back` 回 Princess Room。

## System / Regression

通過：

- `?selftest=save-load`: passed。
- `?selftest=monkey`: 300 steps passed，errors 為空。
- System menu:
  - Gear opens Diary。
  - Settings tab 可開啟，版本顯示 `2026.06.02-area-packs-forest`。
  - Save / Load tab 可開啟，`Save MD` / `Load MD` button 可見。
  - Diary tab 可切回。
  - Back 關閉 system menu。
- Console error/warn: 測試 tab 最終讀取結果為空。

## Code Checks

通過：

- `node --check src/main.js`
- `node --check src/data/game-data.js`
- `node --check src/areas/forest/manifest.js`
- `git diff --check`

備註：

- `git diff --check` 僅輸出 LF/CRLF line ending warning，未回報 whitespace error。
