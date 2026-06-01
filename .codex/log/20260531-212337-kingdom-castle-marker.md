# 王國進入城堡 marker 修訂驗測

- Run timestamp: `20260531-212337`
- 分支: `codex/issue-13-17-map-v2`
- 測試 URL: `http://127.0.0.1:4175/`
- Browser gate: 使用 Browser plugin 的 in-app Browser `iab`；未使用替代瀏覽器。

## 修訂內容

1. 在 Kingdom `hotspots` 新增 `luminaraCastle`。
2. marker 位置綁定 `castleRoom` / `Castle Stairway`，位於紫色城堡往下樓梯端。
3. `travelActionLabel()` 對 `targetArea: "castle"` 顯示 `Castle`。
4. `interactNearby()` 支援 Kingdom gate：滑鼠第二次點擊或鍵盤 Enter 會進 Castle。
5. 進 Castle 時公主落在 Castle map 的 `castleGate`，也就是城堡正門往下樓梯位置。
6. cache buster 更新到 `script.js?v=20260531-map-v2-5`、`styles.css?v=20260531-map-v2-5`。

## iab 驗測

| 項目 | 證據 | 結果 |
|---|---|---|
| Kingdom 城堡 marker 存在 | `#hotspotLayer [data-hotspot-id="luminaraCastle"]` count = `1` | Pass |
| marker 標籤 | aria = `Luminara Castle. Castle.` | Pass |
| marker 座標 | `left 192.159px / top 320.585px` | Pass |
| 滑鼠第一下點擊 | `luminaraCastle` 套上 `nearby`，仍在 `#map` | Pass |
| 滑鼠第二下點擊 | 進入 `#home`，Castle Gate nearby | Pass |
| 鍵盤路徑 | Castle Gate 按 Enter 到 Kingdom 後，`luminaraCastle` nearby；在 Kingdom 按 Enter 回 `#home` | Pass |
| Castle 端落點 | `#castlePlayerToken` = `left 195.339px / top 667.493px`，Castle Gate nearby | Pass |

## 工程檢查

| 檢查 | 結果 |
|---|---|
| `node --check script.js` | Pass |
| `?selftest=save-load&qa=kingdom-castle-marker#home` | Pass |
| `?selftest=monkey&qa=kingdom-castle-marker#home` | Pass |
| Console error/warn for `20260531-map-v2-5` | Pass，空清單 |
| `git diff --check` | Pass，僅 Git CRLF 換行提示 |
