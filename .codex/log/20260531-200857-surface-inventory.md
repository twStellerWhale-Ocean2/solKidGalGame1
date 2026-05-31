# Mobile Map Interaction v2 Surface Inventory

- Run timestamp: `20260531-200857`
- 作業分支: `codex/issue-13-17-map-v2`
- 測試 URL: `http://127.0.0.1:4175/`
- 預設 URL `http://127.0.0.1:4174/` 當次回應 `Not found`，因此改用同一 repo 內容啟動的 `4175` 靜態服務。
- Browser gate: 已先讀取 Browser plugin skill，並透過 in-app Browser `iab` 建立測試分頁；本輪沒有使用外部 Playwright 或系統 Chrome 作為替代瀏覽器。

## 主循環

1. 進入 Castle 地圖。
2. 透過底部地區選單在 Castle / Kingdom 間切換。
3. 在地圖上點擊 marker 或熱點，公主圖示移動到目標附近並維持在同一套 pan / zoom 座標系。
4. 手機直向地圖可拖曳與放大；HUD 與底部地區選單保持固定，不跟著縮放。
5. 從地圖進入場景，完成互動後可回到地圖。

## 操作流程樹

```text
Home / Castle map
├─ Castle marker focus
│  ├─ 點 Princess Room marker
│  ├─ 公主圖示移動到 marker
│  └─ 可由 marker 進入 Princess Room 場景
├─ Castle drag / zoom
│  ├─ 單指拖曳地圖
│  ├─ 雙指縮放或鍵盤測試 zoom
│  └─ pan clamp 不露出空白
├─ Area nav
│  ├─ Castle 按鈕維持綠色
│  ├─ Kingdom 按鈕維持綠色
│  └─ 目前所在地以公主小頭像表示
└─ Kingdom map
   ├─ Kingdom marker focus
   │  ├─ 點地點 marker
   │  ├─ 公主圖示高於地點 icon
   │  └─ 公主圖示不阻擋 marker 點擊
   ├─ Kingdom drag / zoom
   │  ├─ 單指拖曳地圖
   │  ├─ 雙指縮放或鍵盤測試 zoom
   │  └─ pan clamp 不露出空白
   └─ Scene entry / return
      ├─ 從地圖進入 Dress Boutique 場景
      └─ Leave / Go Outside 返回地圖
```

## Screenshot Manifest

| Surface | Screenshot | 結論 |
|---|---|---|
| Castle map initial | `.codex/log/20260531-200857-qa/01-castle-initial.png` | Accept：地圖初始畫面無可見標題，Castle 底部按鈕為綠色且顯示公主頭像，HUD 未縮放。 |
| Castle marker focus | `.codex/log/20260531-200857-qa/02-castle-marker-focus.png` | Accept：Princess Room marker 可 focus，公主圖示維持在地圖座標層。 |
| Castle pinch zoom / drag | `.codex/log/20260531-200857-qa/03-castle-zoom-drag.png` | Accept：地圖可放大與拖曳，畫面未露出空白，底部選單固定。 |
| Kingdom map initial | `.codex/log/20260531-200857-qa/04-kingdom-initial.png` | Accept：Kingdom 地圖初始畫面無可見標題，公主圖示位於地圖上層。 |
| Kingdom marker focus | `.codex/log/20260531-200857-qa/05-kingdom-marker-focus.png` | Accept：marker focus ring 可見，公主圖示高於地點 icon，未阻擋點擊。 |
| Kingdom pinch zoom / drag | `.codex/log/20260531-200857-qa/06-kingdom-zoom-drag.png` | Accept：Kingdom 地圖可放大與拖曳，座標換算一致。 |
| Area nav active state | `.codex/log/20260531-200857-qa/07-area-nav-active.png` | Accept：所有地區按鈕維持綠色，目前所在地以公主小頭像標示。 |
| Map to scene entry | `.codex/log/20260531-200857-qa/08-map-to-scene-entry.png` | Accept：可從 Kingdom marker 進入 Dress Boutique 場景。 |
| Return path back to map | `.codex/log/20260531-200857-qa/09-return-path-map.png` | Accept：從場景返回地圖後，地圖 UI 與 focus 狀態仍可用。 |

## Issue 對照

| Issue | 本輪 surface | 結論 |
|---|---|---|
| #13 | Castle / Kingdom mobile map drag | 已實作並驗測。 |
| #14 | map zoom and clamp | 已實作 zoom `1.0` 到 `2.2` 與 clamp，截圖未露出空白。 |
| #15 | 少文字地圖 UI | 已移除可見地圖標題，保留 hidden heading / aria label。 |
| #16 | 地區按鈕 active state | 已改為全綠按鈕，active 使用公主小頭像。 |
| #17 | 公主圖示層級與座標一致 | Castle 新增公主圖示，Kingdom 公主圖示高於 marker 且不阻擋點擊。 |
