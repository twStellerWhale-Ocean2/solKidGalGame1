# 20260531-170817 surface inventory

## 本輪作業模式

- 類型：修正目前功能 + 完整測試修訂。
- 目標：依使用者指出的手機實機問題，重做 Castle / Kingdom 分區、HUD、Scene entry 與 Detail Panel 分層。
- 美術來源：Castle 區域底圖使用使用者提供圖片 `D:/OneDrive/Desktop/24755f2f-aec9-4e3b-8325-764dd4bb33b1.png`，已複製為 `assets/castle-map.png`。本輪不再使用先前生成的城堡圖。

## 主循環

```text
Castle Area Map
  -> Princess Room marker
  -> Princess Room scene action choices
  -> Wardrobe / accessory / shoes / room detail panel
  -> Castle / Kingdom bottom area navigation
  -> Kingdom Area Map marker focus
  -> Scene action choices
  -> Talk quest or Shop detail panel
  -> Buy / equip feedback
  -> Diary / Settings / Save Load in system overlay
```

## 操作流程樹

- `area.castle.map`：首頁為 Castle 地區圖，不直接顯示衣櫃 detail。
- `area.castle.princessRoom.scene`：點 Princess Room marker 後進入房間場景，只顯示 `Dresses / Accessories / Shoes / Room Treasures / Go Outside`。
- `area.castle.princessRoom.wardrobeDetail`：選擇衣物類別後才顯示可換穿 detail panel。
- `area.kingdom.map`：Kingdom 地圖保留地點探索與 marker focus。
- `area.kingdom.shop.scene`：店家進場只顯示 `Shop / Chat / Leave` 或 `Shop / Talk / Leave`。
- `area.kingdom.shop.detail`：選 `Shop` 後才顯示商品 detail panel。
- `area.kingdom.shop.feedback`：購買或裝備後顯示狀態、Diary 事件與可見換裝回饋。
- `system.overlay`：Diary、Settings、Save / Load 維持在齒輪 overlay 內。

## screenshot manifest

| flow_node_id | 入口畫面 | 操作步驟 | 預期狀態 | 必要截圖檔名 | 驗收 viewport | 是否已截圖 | 檢查結論 |
|---|---|---|---|---|---|---|---|
| area.castle.map | `#home` | fresh state 開啟 Castle | HUD 只顯示 Coins / Energy / Level，Castle map 使用使用者提供圖片，底部顯示 Castle / Kingdom | `mobile-castle-map.png` | 390x844 mobile | 已截圖 | Accept：無水平 overflow，HUD 在 viewport 內 |
| area.castle.princessRoom.scene | Castle map | 點 Princess Room marker，再 Enter | 房間場景只顯示功能 action choices，未顯示衣櫃 detail | `mobile-princess-room-scene.png` | 390x844 mobile | 已截圖 | Accept：scene 與 action choices 分層成立 |
| area.castle.princessRoom.wardrobeDetail | Princess Room scene | 選 Dresses | 顯示 wardrobe detail panel，可預覽 / Equip，並可 Back / Leave | `mobile-wardrobe-detail.png` | 390x844 mobile | 已截圖 | Accept：detail panel 與 scene entry 分離 |
| area.kingdom.map | bottom nav | 點 Kingdom | Kingdom map 顯示地點 marker，底部仍只有 Castle / Kingdom | `mobile-kingdom-map.png` | 390x844 mobile | 已截圖 | Accept：area nav 一致，無水平 overflow |
| area.kingdom.shop.scene | Kingdom map | focus Dress Boutique，Enter | 店家 scene 只顯示 Shop / Chat / Leave，不直接顯示商品列表 | `mobile-shop-scene.png` | 390x844 mobile | 已截圖 | Accept：未直接塞商品列表 |
| area.kingdom.shop.detail | Shop scene | 點 Shop | 商品 detail panel 顯示試穿、公主預覽、Buy / Leave | `mobile-shop-detail.png` | 390x844 mobile | 已截圖 | Accept：detail panel 顯示商品與購買指令 |
| area.kingdom.shop.feedback | Shop detail | 購買可負擔商品 | coins / owned / equipped / feedback 更新，畫面不卡死 | `mobile-shop-feedback.png` | 390x844 mobile | 已截圖 | Accept：購買後 feedback 與 equipped 狀態可見 |
| system.overlay.save | 齒輪 menu | 開 Save / Load | 系統設定不佔預設主畫面，仍在 overlay | `mobile-system-save.png` | 390x844 mobile | 已截圖 | Accept：Save / Load 收在 system overlay |

## 證據檔案

- Browser plugin / in-app Browser 已成功連線到 `iab`，並使用 viewport capability 設定 mobile viewport。
- 截圖索引：`.codex/log/20260531-170817-qa/visual-shot-manifest.json`
- 功能操作紀錄：`.codex/log/20260531-170817-qa/functional-flow-result.json`
- Save / Load 與 monkey 結果：`.codex/log/20260531-170817-qa/selftest-results.json`
- console warn/error：`.codex/log/20260531-170817-qa/browser-console-warn-error.json`
