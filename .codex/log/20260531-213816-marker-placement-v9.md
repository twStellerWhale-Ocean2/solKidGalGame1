# 王國 marker 精準重校驗測

- Run timestamp: `20260531-213816`
- 分支: `codex/issue-13-17-map-v2`
- 測試 URL: `http://127.0.0.1:4175/`
- Browser gate: 使用 Browser plugin 的 in-app Browser `iab`；未使用替代瀏覽器。

## 修訂內容

1. 依使用者新換的 `assets/castle-map2.png`、`assets/kingdom-map2.png` 重新讀取尺寸：
   - Castle: `1312x1199`
   - Kingdom: `1672x941`
2. 更新 `castleMapImageSize` 與 `mapImageSize`。
3. Castle marker 依新城堡圖重放：
   - `princessRoom` 放在正門上方主建築入口區。
   - `kingRoom` 放在中央主塔上層。
   - `queenRoom` 放在左翼建築。
   - `castleGate` 放在正門往下樓梯。
4. Kingdom marker 依使用者指定修正：
   - `Harbor Port` 新增並放在原魚店所在碼頭。
   - `Fish Shop` 放在原服裝店，也就是左側碼頭商店區。
   - `Dress Boutique` 移到配飾店 / 鞋店旁邊。
   - `Market Square / Bakery` 移到左側住宅區。
5. cache buster 更新到 `script.js?v=20260531-map-v2-9`、`styles.css?v=20260531-map-v2-9`。
6. README 的 Kingdom 地點列表同步加入 `Harbor Port`、`Fish Shop`。

## iab 視覺與 DOM 驗證

| Marker | DOM 位置 | 視覺結論 |
|---|---|---|
| Luminara Castle | `left 507.121px / top 287.413px` | 位於紫色城堡樓梯端。 |
| Harbor Port | `left 418.837px / top 577.442px` | 位於碼頭水岸。 |
| Market Square / Bakery | `left 287.437px / top 427.227px` | 位於左側住宅區。 |
| Fish Shop | `left 365.456px / top 435.316px` | 位於左側碼頭商店區。 |
| Dress Boutique | `left 656.999px / top 412.206px` | 移到鞋店 / 配飾店旁。 |
| Shoe Shop | `left 692.929px / top 446.871px` | 位於右側商店群。 |
| Accessory Shop | `left 761.708px / top 424.339px` | 位於右側商店群。 |
| Sunny Farm | `left 893.108px / top 185.729px` | 位於右上農田 / 風車區。 |
| Lighthouse | `left 793.532px / top 523.134px` | 位於右下燈塔。 |

截圖證據：

- `.codex/log/20260531-213816-qa/kingdom-marker-requested-v9.png`
- `.codex/log/20260531-213816-qa/kingdom-marker-wide.png`
- `.codex/log/20260531-213816-qa/castle-marker-wide.png`

## 工程檢查

| 檢查 | 結果 |
|---|---|
| `node --check script.js` | Pass |
| `?selftest=save-load&qa=requested-marker-placement-v9#home` | Pass |
| `?selftest=monkey&qa=requested-marker-placement-v9#home` | Pass |
| Console error/warn for `20260531-map-v2-9` | Pass，空清單 |
| `git diff --check` | Pass，僅 Git CRLF 換行提示 |
