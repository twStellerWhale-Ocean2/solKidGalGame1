# 取消公主鍵盤移動範圍限制驗測

- Run timestamp: `20260531-212822`
- 分支: `codex/issue-13-17-map-v2`
- 測試 URL: `http://127.0.0.1:4175/`
- Browser gate: 使用 Browser plugin 的 in-app Browser `iab`；未使用替代瀏覽器。

## 修訂內容

1. Kingdom 鍵盤移動不再呼叫道路 / 安全區 `isWalkable()` 阻擋。
2. Kingdom 原本 `x 6..94`、`y 8..92` 改為圖片座標邊界 `0..100`。
3. Castle 原本 `x 18..82`、`y 18..84` 改為圖片座標邊界 `0..100`。
4. `isWalkable()` 僅保留給 monkey selftest 作為圖片座標有效性檢查。
5. cache buster 更新到 `script.js?v=20260531-map-v2-6`、`styles.css?v=20260531-map-v2-6`。

## iab 驗測

| 項目 | 證據 | 結果 |
|---|---|---|
| 新資產載入 | `script.js?v=20260531-map-v2-6`、`styles.css?v=20260531-map-v2-6` | Pass |
| Kingdom 原安全區外移動 | 在 Kingdom 連續按 `ArrowLeft` / `ArrowUp`，`#playerToken` 移到 `left -879.623px / top -50.688px` | Pass |
| Kingdom 不再被擋 | 沒有出現 `Lumi should stay on safe paths.` | Pass |
| Castle 原窄範圍外移動 | 在 Castle 連續按 `ArrowRight` / `ArrowDown`，`#castlePlayerToken` 移到 `left 693.138px / top 844.8px` | Pass |

## 工程檢查

| 檢查 | 結果 |
|---|---|
| `node --check script.js` | Pass |
| `?selftest=save-load&qa=unrestricted-map-move#home` | Pass |
| `?selftest=monkey&qa=unrestricted-map-move#home` | Pass |
| Console error/warn for `20260531-map-v2-6` | Pass，空清單 |
| `git diff --check` | Pass，僅 Git CRLF 換行提示 |
