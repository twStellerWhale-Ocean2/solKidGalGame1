# 20260601-110623 Surface Inventory

## 本輪模式

- 作業類型：修正目前功能 / 架構優化。
- Issue 範圍：#22 遊戲網站架構優化、#5 設定頁版本與產製日期顯示。
- 明確不處理：#19 背景重繪、#20 NPC 去背與構圖重產、#21 手機場景配置調整。
- 技術邊界：維持 GitHub Pages 靜態網站；不引入 React、Vite、npm build step。

## 主循環

```text
Castle Map
  -> Princess Room marker focus
  -> Princess Room scene action choices
  -> Wardrobe detail
  -> Kingdom Map
  -> Boutique marker focus
  -> Boutique scene action choices
  -> Shop detail
  -> Settings / Save Load overlay
```

## 操作流程樹

| flow_node_id | 入口畫面 | 操作步驟 | 預期狀態 | 本輪狀態 |
|---|---|---|---|---|
| castle-map | `#home` | 開啟首頁 | Castle Map 顯示，marker 可點選 | 受影響 |
| princess-room-scene | Castle Map | 點 Princess Room marker 兩次 | 進入 Princess Room scene action choices | 受影響 |
| wardrobe-detail | Princess Room scene | 選 Dresses / Accessories / Shoes / Room Treasures | 顯示 wardrobe detail panel | 受影響 |
| kingdom-map | `#map` | 切換 Kingdom | Kingdom Map 顯示，marker 可點選 | 受影響 |
| boutique-scene | Kingdom Map | 點 Boutique marker 兩次 | 進入 Boutique scene action choices | 受影響 |
| shop-detail | Boutique scene | 選 Shop | 顯示 shop detail panel | 受影響 |
| settings-version | Gear menu | 開啟 Settings | 顯示 Version / Build date | 新增 |
| save-load | Gear menu | 開啟 Save / Load | Save MD / Load MD 可用 | 受影響 |
| save-load-selftest | `?selftest=save-load` | 自動測試 | 通過 Save / Load round trip | 受影響 |
| monkey-selftest | `?selftest=monkey` | 自動測試 | 300 step monkey pass | 受影響 |

## Screenshot Manifest

| flow_node_id | 必要截圖檔名 | 驗收 viewport | 是否已截圖 | 檢查結論 |
|---|---|---|---|---|
| castle-map | mobile-castle-map.png | mobile portrait | 已截圖 | 可渲染，Castle marker 存在 |
| princess-room-scene | mobile-princess-room-scene.png | mobile portrait | 已截圖 | 可渲染，ADV modal 可開啟 |
| wardrobe-detail | mobile-wardrobe-detail.png | mobile portrait | 已截圖 | 可渲染，Wardrobe detail 可開啟 |
| kingdom-map | mobile-kingdom-map.png | mobile portrait | 已截圖 | 可渲染，Kingdom map 可開啟 |
| boutique-scene | mobile-shop-scene.png | mobile portrait | 已截圖 | 可渲染，Boutique scene 可開啟 |
| shop-detail | mobile-shop-detail.png | mobile portrait | 已截圖 | 可渲染，Shop detail 可開啟 |
| settings-version | mobile-settings-version.png | mobile portrait | 已截圖 | Version / Build date 可見 |
| save-load-selftest | mobile-save-load-selftest.png | mobile portrait | 已截圖 | selftest passed |
| monkey-selftest | mobile-monkey-selftest.png | mobile portrait | 已截圖 | monkey test passed |

## Browser Tooling Record

- 已讀 `browser:browser` 與 browser tooling guard。
- 已透過 Browser plugin bootstrap 成功取得 `iab`，並成功導航至 `http://127.0.0.1:4174/`。
- `iab` DOM 驗證與自動測試通過，但 `iabTab.screenshot({ fullPage: false })` 持續出現 `Timed out running CDP command Page.captureScreenshot for tab 1`。
- 失敗證據：`.codex/log/20260601-110623-qa/browser-plugin-screenshot-failure.json`。
- 截圖 fallback：本機 Chrome headless CLI，固定同一 localhost URL 與 `390x844` mobile portrait viewport。
