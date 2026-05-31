# 地圖鍵盤互動 bugfix 驗測

- Run timestamp: `20260531-202502`
- 分支: `codex/issue-13-17-map-v2`
- 測試 URL: `http://127.0.0.1:4175/`
- Browser gate: 已使用 Browser plugin 的 in-app Browser `iab`，未使用替代瀏覽器。
- 當次資產: `script.js?v=20260531-map-v2-3`、`styles.css?v=20260531-map-v2-3`

## 修正項目

1. Castle 地圖補上 Arrow / WASD 鍵盤移動小公主。
2. Castle / Kingdom 鍵盤移動後會重新計算附近地點，讓 marker 套用 `nearby` 狀態，並讓 Enter 可對目前靠近的地點互動。

## 重測結果

| Bug | 操作 | 證據 | 結果 |
|---|---|---|---|
| 城堡鍵盤無法移動小公主 | 在 Castle map focus 後按 `ArrowDown` 12 次 | `#castlePlayerToken` top 從 `422.4px` 變成 `567.469px` | Pass |
| 城堡鍵盤接近地點無反應 | 同上 | `#castleMarkerLayer .hotspot.nearby` 從 `princessRoom` 變成 `castleGate`，status 顯示 `Castle Gate: Kingdom.` | Pass |
| 王國鍵盤接近地點無反應 | Castle Gate 按 Enter 到 Kingdom，focus map 後按方向鍵 | `#hotspotLayer .hotspot.nearby` 為 `accessoryShop`，status 顯示 `Accessory Shop: Talk.` | Pass |
| 王國鍵盤互動 | nearby 後按 Enter | ADV modal 開啟，標題為 `Accessory Shop` | Pass |

## 工程檢查

| 檢查 | 結果 |
|---|---|
| `node --check script.js` | Pass |
| `?selftest=save-load&qa=bugfix-keyboard-map-v2#home` | Pass |
| `?selftest=monkey&qa=bugfix-keyboard-map-v2#home` | Pass |
| Console error/warn for `20260531-map-v2-3` | Pass，空清單 |
| `git diff --check` | Pass，僅 Git CRLF 換行提示 |

## 結論

兩個回報 bug 均已修正並通過 iab 實測。未發現新的 Must Fix。
