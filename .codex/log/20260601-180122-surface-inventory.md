# 20260601-180122 Surface Inventory

## 本輪作業模式

- 類型：修正目前功能 + 測試內容。
- 目標：採用 README 的 Mobile Map Viewport Architecture v3，修正手機地圖拖曳 / 縮放時底圖與上層 marker / player / map actors 不同步的圖層漂移。
- 架構決議：Castle / Kingdom 共用 `display/offset` viewport contract，`areaMapMetrics()` / `syncAreaMapStyles()` 是唯一 source of truth。
- 本輪不處理：新增地區、全量 `src/map/` 模組拆分、商店 / Wardrobe / Diary 大型重製、正式美術資產替換。

## 主循環

Room -> Area Map -> marker focus -> Scene entry -> Action Choices -> Detail Panel / ADV / Shop -> feedback -> Diary / Save -> return Map / Room。

本輪主要驗證 Area Map 圖層，不改變主循環資料或 Save data shape。

## 操作流程樹

1. `home.castle-map.initial`
   - 入口：`#home`
   - 預期：Castle 地圖底圖、Castle markers、小公主 token 使用同一 viewport metrics。
2. `home.castle-map.drag`
   - 入口：`#home`
   - 操作：手機直向單指拖曳 Castle map。
   - 預期：底圖、markers、小公主 token 同步位移。
3. `home.castle-map.pinch`
   - 入口：`#home`
   - 操作：手機直向雙指縮放 Castle map。
   - 預期：底圖、markers、小公主 token 同步縮放與定位。
4. `home.castle-marker.focus`
   - 入口：`#home`
   - 操作：點選 Castle marker。
   - 預期：marker focus 對準底圖，不發生 icon 與底圖分離。
5. `map.kingdom-map.initial`
   - 入口：`#map`
   - 預期：Kingdom 地圖底圖、hotspots、小公主 token、map actors 使用同一 viewport metrics。
6. `map.kingdom-map.drag`
   - 入口：`#map`
   - 操作：手機直向單指拖曳 Kingdom map。
   - 預期：底圖、hotspots、小公主 token、map actors 同步位移。
7. `map.kingdom-map.pinch`
   - 入口：`#map`
   - 操作：手機直向雙指縮放 Kingdom map。
   - 預期：底圖、hotspots、小公主 token、map actors 同步縮放與定位。
8. `map.kingdom-marker.focus`
   - 入口：`#map`
   - 操作：點選 Kingdom marker。
   - 預期：marker focus 對準底圖，不發生 icon 與底圖分離。
9. `area-nav.fixed`
   - 入口：`#home` / `#map`
   - 操作：拖曳 / 縮放地圖後觀察 HUD 與 bottom area nav。
   - 預期：HUD 與 bottom area nav 不跟著地圖縮放。
10. `map.scene-entry.return`
    - 入口：`#map`
    - 操作：marker focus -> 進入 scene -> Leave / Back to Map。
    - 預期：Scene entry / return path 未被地圖 CSS 改動破壞。

## Screenshot Manifest

| flow_node_id | 入口畫面 | 操作步驟 | 預期狀態 | 必要截圖檔名 | 驗收 viewport | 是否已截圖 | 檢查結論 |
|---|---|---|---|---|---|---|---|
| home.castle-map.initial | `#home` | 開啟 Castle map | 底圖與 marker 初始對齊 | `castle-initial-mobile.png` | mobile portrait | 否 | Browser tool 阻塞，未完成 |
| home.castle-map.drag | `#home` | 單指拖曳 | 底圖與 marker 同步位移 | `castle-drag-mobile.png` | mobile portrait | 否 | Browser tool 阻塞，未完成 |
| home.castle-map.pinch | `#home` | 雙指縮放 | 底圖與 marker 同步縮放 | `castle-pinch-mobile.png` | mobile portrait | 否 | Browser tool 阻塞，未完成 |
| home.castle-marker.focus | `#home` | 點選 marker | focus icon 仍對準底圖 | `castle-focus-mobile.png` | mobile portrait | 否 | Browser tool 阻塞，未完成 |
| map.kingdom-map.initial | `#map` | 開啟 Kingdom map | 底圖、hotspots、actors 初始對齊 | `kingdom-initial-mobile.png` | mobile portrait | 否 | Browser tool 阻塞，未完成 |
| map.kingdom-map.drag | `#map` | 單指拖曳 | 底圖、hotspots、actors 同步位移 | `kingdom-drag-mobile.png` | mobile portrait | 否 | Browser tool 阻塞，未完成 |
| map.kingdom-map.pinch | `#map` | 雙指縮放 | 底圖、hotspots、actors 同步縮放 | `kingdom-pinch-mobile.png` | mobile portrait | 否 | Browser tool 阻塞，未完成 |
| map.kingdom-marker.focus | `#map` | 點選 marker | focus icon 仍對準底圖 | `kingdom-focus-mobile.png` | mobile portrait | 否 | Browser tool 阻塞，未完成 |
| area-nav.fixed | `#home` / `#map` | 拖曳 / 縮放後檢查 HUD/nav | HUD/nav 不跟著縮放 | `area-nav-fixed-mobile.png` | mobile portrait | 否 | Browser tool 阻塞，未完成 |
| map.scene-entry.return | `#map` | focus -> scene -> return | Scene entry / return path 可用 | `scene-entry-return-mobile.png` | mobile portrait | 否 | Browser tool 阻塞，未完成 |

## 未觸及 Surface

- Shop detail、Wardrobe detail、Diary、Settings、Save / Load overlay：本輪只做 smoke / selftest，不做版面重製。
- 全地點 scene art：本輪不新增或替換正式素材。

## Browser Gate

- 已讀 `skill-9general-browser-tooling-guard`。
- 已讀 Browser plugin `browser:browser` workflow。
- 已使用 `tool_search` 查找 `node_repl js JavaScript execution mcp__node_repl__js`。
- 結果：`Found 0 tools`，本 session 沒有可呼叫的 Node REPL JS 工具，無法執行 Browser bootstrap、`agent.browsers.list()` 或 `agent.browsers.get("iab")`。
- 依 AGENTS 瀏覽器政策，本輪未使用外部 Playwright、系統 Chrome / Chromium、Computer Use 或 npm-installed browser tooling。

## Browser Gate 第二次嘗試

- 使用者提醒需先開啟右側 in-app browser 視窗後再找 `iab`。
- 已重新讀取 Browser tooling guard 與 Browser plugin workflow。
- 已重新用 `tool_search` 查找：
  - `node_repl js mcp__node_repl__js JavaScript execution`
  - `browser-client setupBrowserRuntime agent.browsers iab node repl js`
  - `in-app browser iab open visible tabs screenshot navigate`
  - `js_reset js node_repl`
- 結果：
  - 前兩組查詢皆為 `Found 0 tools`。
  - `in-app browser iab open visible tabs screenshot navigate` 只發現 multi-agent tool，沒有 Browser / Node REPL JS execution tool。
  - `js_reset js node_repl` 為 `Found 0 tools`。
- 目前工具面沒有可用的 Node REPL JS tool，也沒有可用的 UI 控制工具可由 Codex 直接打開右側 Browser 面板。
- 因未完成 Browser bootstrap 與 `agent.browsers.get("iab")`，本輪仍未使用外部 Playwright、系統 Chrome / Chromium、Computer Use 或 npm-installed browser tooling。
