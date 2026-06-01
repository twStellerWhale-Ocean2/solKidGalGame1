# I. 緣起目的

本輪依使用者貼上的「手機 ADV 場景、美術與商店語意修正」目標執行，處理 Issue #21、#3、#19、#20。#4 退貨退款與 #6 Energy 休息限制不納入本輪程式修改。

目標是讓手機直向流程穩定符合：

```text
Area Map -> Scene -> Action Choices -> Detail Panel -> Feedback / Return
```

本輪完成後，Market / Bakery、Dress Boutique、Shoe Shop、Accessory Shop 等場景第一眼必須像兒童向日式 ADV 場景，不得仍像幾何佔位圖、表單或商品清單。

# II. 參考準備

- 專案 source of truth：`README.md`
- 執行技能：`m-skill-2tech-children-adv-game-dev`
- 美術測試格式：`m-skill-2tech-children-adv-game-dev/美術性測試範例.md`
- Browser gate：先嘗試 Browser plugin `iab`，只有記錄失敗後才可 fallback。
- 主要 viewport：手機直向 390x844。
- 桌機與寬桌機：只做不破版 smoke check，不取代手機美術驗收。

# III. 內容程序

## 主循環

```text
Castle Map
  -> Kingdom Map
  -> shop marker focus
  -> Scene entry / Action Choices
  -> Chat or Shop Detail Panel
  -> purchase / equip feedback
  -> Leave / return to map or room
```

## 操作流程樹

1. Castle Map 初始畫面。
2. Kingdom Map 初始畫面。
3. Market marker focus。
4. Market scene entry / action choices。
5. Market shop detail。
6. Market shop purchase feedback。
7. Boutique marker focus。
8. Boutique scene entry / action choices。
9. Boutique shop detail。
10. Boutique shop purchase feedback。
11. Shoe Shop marker focus。
12. Shoe Shop scene entry / action choices。
13. Shoe Shop shop detail。
14. Shoe Shop shop purchase feedback。
15. Accessory Shop marker focus。
16. Accessory Shop scene entry / action choices。
17. Accessory Shop shop detail。
18. Accessory Shop shop purchase feedback。
19. Princess Room scene action choices。
20. Wardrobe detail panel。
21. Diary overlay。
22. Settings overlay。
23. Save / Load overlay。

## Screenshot Manifest

| flow_node_id | 入口畫面 | 操作步驟 | 預期狀態 | 必要截圖檔名 | 驗收 viewport | 是否已截圖 | 檢查結論 |
|---|---|---|---|---|---|---|---|
| castle-map | Castle Map | 開啟 `?selftest=visual-qa&fresh=1&surface=castle-map#home` | Castle 地圖、HUD、area nav 可讀 | mobile-castle-map-before.png / mobile-castle-map-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| kingdom-map | Kingdom Map | 開啟 `?selftest=visual-qa&fresh=1&surface=kingdom-map#map` | Kingdom 地圖與 area nav 可讀 | mobile-kingdom-map-before.png / mobile-kingdom-map-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| market-scene | Market Scene | 開啟 `?selftest=visual-qa&fresh=1&surface=shop-scene&place=market#map` | 只顯示場景、NPC、Action Choices | mobile-market-scene-before.png / mobile-market-scene-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| market-detail | Market Shop | 開啟 `?selftest=visual-qa&fresh=1&surface=shop-detail&place=market&coins=500#map` | 顯示 room treasures detail panel | mobile-market-detail-before.png / mobile-market-detail-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| market-feedback | Market Feedback | 開啟 `?selftest=visual-qa&fresh=1&surface=shop-feedback&place=market&coins=500#map` | 購買後有 feedback / diary path | mobile-market-feedback-before.png / mobile-market-feedback-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| boutique-scene | Boutique Scene | 開啟 `?selftest=visual-qa&fresh=1&surface=shop-scene&place=boutique#map` | 只顯示場景、NPC、Action Choices | mobile-boutique-scene-before.png / mobile-boutique-scene-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| boutique-detail | Boutique Shop | 開啟 `?selftest=visual-qa&fresh=1&surface=shop-detail&place=boutique&coins=500#map` | 顯示 dress detail panel | mobile-boutique-detail-before.png / mobile-boutique-detail-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| boutique-feedback | Boutique Feedback | 開啟 `?selftest=visual-qa&fresh=1&surface=shop-feedback&place=boutique&coins=500#map` | 購買後有 feedback / try-on | mobile-boutique-feedback-before.png / mobile-boutique-feedback-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| shoes-scene | Shoe Scene | 開啟 `?selftest=visual-qa&fresh=1&surface=shop-scene&place=shoeShop#map` | 只顯示場景、NPC、Action Choices | mobile-shoes-scene-before.png / mobile-shoes-scene-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| shoes-detail | Shoe Shop | 開啟 `?selftest=visual-qa&fresh=1&surface=shop-detail&place=shoeShop&coins=500#map` | 顯示 shoe detail panel | mobile-shoes-detail-before.png / mobile-shoes-detail-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| shoes-feedback | Shoe Feedback | 開啟 `?selftest=visual-qa&fresh=1&surface=shop-feedback&place=shoeShop&coins=500#map` | 購買後有 feedback / try-on | mobile-shoes-feedback-before.png / mobile-shoes-feedback-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| accessory-scene | Accessory Scene | 開啟 `?selftest=visual-qa&fresh=1&surface=shop-scene&place=accessoryShop#map` | 只顯示場景、NPC、Action Choices | mobile-accessory-scene-before.png / mobile-accessory-scene-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| accessory-detail | Accessory Shop | 開啟 `?selftest=visual-qa&fresh=1&surface=shop-detail&place=accessoryShop&coins=500#map` | 顯示 accessory detail panel | mobile-accessory-detail-before.png / mobile-accessory-detail-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| accessory-feedback | Accessory Feedback | 開啟 `?selftest=visual-qa&fresh=1&surface=shop-feedback&place=accessoryShop&coins=500#map` | 購買後有 feedback / try-on | mobile-accessory-feedback-before.png / mobile-accessory-feedback-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| princess-room-scene | Princess Room | 開啟 `?selftest=visual-qa&fresh=1&surface=princess-room-scene#home` | Room action choices 清楚 | mobile-princess-room-scene-before.png / mobile-princess-room-scene-after.png | 390x844 | 已截圖 | 已修正選項裁切；Accept |
| wardrobe-detail | Wardrobe Detail | 開啟 `?selftest=visual-qa&fresh=1&surface=wardrobe-detail&category=outfit#home` | Wardrobe detail panel 清楚 | mobile-wardrobe-detail-before.png / mobile-wardrobe-detail-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| diary | Diary Overlay | 開啟 `?selftest=visual-qa&fresh=1&surface=diary#home` | Diary 在書本 overlay 內 | mobile-diary-before.png / mobile-diary-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| settings | Settings Overlay | 開啟 `?selftest=visual-qa&fresh=1&surface=settings#home` | Settings 不破壞沉浸感 | mobile-settings-before.png / mobile-settings-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |
| save-load | Save Load Overlay | 開啟 `?selftest=visual-qa&fresh=1&surface=save#home` | Save / Load 在書本 overlay 內 | mobile-save-before.png / mobile-save-after.png | 390x844 | 已截圖 | Accept；無 Must Fix |

# IV. 備註紀錄

- 本輪所有截圖放在 `.codex/log/20260601-135745-qa/`。
- 本輪測試報告須使用繁體中文撰寫。
- 美術性測試報告必須依 `美術性測試範例.md` 的 `(A) 現有截圖`、`(B) 檢討批評`、`(C) 修訂分析`、`(D) 畫面小結` 格式。
- 修改前 baseline 已由 detached `HEAD` worktree 補拍，記錄於 `.codex/log/20260601-135745-qa/chrome-cdp-capture-results-before.json`。
- Browser plugin `iab` 已先完成同批截圖與 console log 檢查；後續 fresh 重截時 `Page.captureScreenshot` 對 tab 3 / tab 4 連續逾時，因此最終 fresh 截圖使用 Chrome CDP fallback，並在 `.codex/log/20260601-135745-qa/chrome-cdp-capture-results.json` 記錄 19 個 390x844 surface、`consoleIssueCount: 0`。
