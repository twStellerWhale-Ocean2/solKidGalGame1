# 紫色城堡樓梯地圖修訂驗測

- Run timestamp: `20260531-211741`
- 分支: `codex/issue-13-17-map-v2`
- 測試 URL: `http://127.0.0.1:4175/`
- Browser gate: 使用 Browser plugin 的 in-app Browser `iab`；未使用外部 Playwright、系統 Chrome 或 Computer Use。

## 修訂內容

1. Castle 地圖改引用 `assets/castle-map2.png?v=20260531-stair-map`。
2. Kingdom 地圖改引用 `assets/kingdom-map2.png?v=20260531-stair-map`。
3. 更新圖片尺寸：
   - Castle: `1325x1187`
   - Kingdom: `1671x941`
4. 重校 Castle / Kingdom marker node 座標。
5. `Castle Gate` 放到 Castle 圖正門往下樓梯中段。
6. Kingdom 的 `castleRoom` node 改為 `Castle Stairway`，落在紫色城堡往下樓梯連接主路的位置。
7. 從 Castle Gate 進入 Kingdom 時，公主落點改為 `Castle Stairway`，不再被 active quest 拉到任務地點。
8. 重校 Kingdom map actors 與 keyboard walkable zones，避免新圖的海港、燈塔與農場被舊圖邊界擋住。

## iab 驗測

| 項目 | 證據 | 結果 |
|---|---|---|
| 新 Castle 圖載入 | `#castleStage img` = `assets/castle-map2.png?v=20260531-stair-map`，natural size `1325x1187` | Pass |
| 新 Kingdom 圖載入 | `#mapImage` = `assets/kingdom-map2.png?v=20260531-stair-map`，natural size `1671x941` | Pass |
| Castle Gate 對準樓梯 | `#castleMarkerLayer [data-hotspot-id="castleGate"]` = `left 113.372px / top 692.837px`，視覺落在正門往下樓梯中段 | Pass |
| Castle Gate 轉場 | iab 座標點擊 Castle Gate 後進入 `#map` | Pass |
| Kingdom 樓梯落點 | 轉場後 `#playerToken` = `left 195.339px / top 320.585px`，附近沒有誤觸發其他地點 marker | Pass |
| Cache buster | `script.js?v=20260531-map-v2-4`、`styles.css?v=20260531-map-v2-4` | Pass |

## 工程檢查

| 檢查 | 結果 |
|---|---|
| `node --check script.js` | Pass |
| `?selftest=save-load&qa=stair-map-v2#home` | Pass |
| `?selftest=monkey&qa=stair-map-v2#home` | Pass |
| Console error/warn for `20260531-map-v2-4` | Pass，空清單 |
| `git diff --check` | Pass，僅 Git CRLF 換行提示 |

## 備註

- iab 的 screenshot API 在 Kingdom 大圖截圖時逾時，因此本次以 iab DOM、實際點擊轉場與座標證據完成驗測。
- Castle 畫面曾以 iab 成功截圖檢視，並據此將 `Castle Gate` 從草地旁調整到樓梯中段。
