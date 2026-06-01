# 20260601-123945 surface inventory

## 主循環

本輪作業模式：修正目前功能與架構重整。目標是維持原生 ES Modules 與 GitHub Pages 靜態部署，同時把 `src/main.js` 的 state、lookup、DOM registry、paper-doll、Save / Load、ADV focus 控制拆成可維護模組。

主循環：

```text
Castle Map -> marker focus -> Princess Room scene -> Wardrobe detail
Kingdom Map -> marker focus -> Scene entry -> Quest / Shop detail -> feedback
System menu -> Diary / Settings / Save Load -> return
```

## 操作流程樹

- F01 Castle Map initial：開啟 `#home`，顯示 Castle 地圖、HUD、地區導航、小公主圖示。
- F02 Castle marker focus：選取 Princess Room marker，只高亮 marker，不直接展開 detail list。
- F03 Princess Room scene：第二次確認 Princess Room，進入 scene action choices。
- F04 Wardrobe detail：從 Princess Room 選 Dresses，進入 Wardrobe detail panel。
- F05 Kingdom Map initial：切換 Kingdom，顯示 Kingdom map、marker 與小公主圖示。
- F06 Kingdom marker focus：選取 boutique marker，只高亮 marker。
- F07 Shop scene：第二次確認 boutique，進入 scene action choices。
- F08 Shop detail：選 Shop，顯示商品 detail、preview、Buy / Leave。
- F09 Shop feedback：購買或裝備商品後顯示 feedback 並更新 state。
- F10 Diary：開啟 system menu 的 Diary page。
- F11 Settings：切換 Settings page。
- F12 Save Load：切換 Save / Load page 並執行 Save / Load selftest。
- F13 Monkey：執行 300-step monkey selftest。

## screenshot manifest

| flow_node_id | 入口畫面 | 操作步驟 | 預期狀態 | 必要截圖檔名 | 驗收 viewport | 是否已截圖 | 檢查結論 |
|---|---|---|---|---|---|---|---|
| F01 | `#home` | 載入首頁 | Castle Map 可見且沒有 runtime error | mobile-castle-map.png | mobile portrait | 未截圖 | 待測 |
| F02 | `visual-qa&surface=castle-map` | focus Princess Room | marker focus 清楚，未展開 detail list | mobile-castle-focus.png | mobile portrait | 未截圖 | 待測 |
| F03 | `visual-qa&surface=princess-room-scene` | 進入房間 scene | action choices 可見 | mobile-princess-room-scene.png | mobile portrait | 未截圖 | 待測 |
| F04 | `visual-qa&surface=wardrobe-detail` | Dresses detail | Wardrobe panel 可操作且不溢出 | mobile-wardrobe-detail.png | mobile portrait | 未截圖 | 待測 |
| F05 | `visual-qa&surface=kingdom-map` | 切到 Kingdom | Kingdom Map 可見且 marker / player 層級正確 | mobile-kingdom-map.png | mobile portrait | 未截圖 | 待測 |
| F06 | `visual-qa&surface=map-near&place=boutique` | focus boutique | marker focus 清楚，未展開 detail list | mobile-kingdom-focus.png | mobile portrait | 未截圖 | 待測 |
| F07 | `visual-qa&surface=shop-scene&place=boutique` | 進入 boutique scene | Shop / Talk / Leave choices 可見 | mobile-shop-scene.png | mobile portrait | 未截圖 | 待測 |
| F08 | `visual-qa&surface=shop-detail&place=boutique` | 開啟 shop detail | 商品 preview、Buy / Leave 可見 | mobile-shop-detail.png | mobile portrait | 未截圖 | 待測 |
| F09 | `visual-qa&surface=shop-feedback&place=boutique` | 購買或裝備商品 | feedback 與裝備/coins 狀態可見 | mobile-shop-feedback.png | mobile portrait | 未截圖 | 待測 |
| F10 | `visual-qa&surface=diary` | 開 system Diary | Diary book panel 可見 | mobile-diary.png | mobile portrait | 未截圖 | 待測 |
| F11 | `visual-qa&surface=settings` | 切 Settings | Settings 可見且欄位不破版 | mobile-settings.png | mobile portrait | 未截圖 | 待測 |
| F12 | `visual-qa&surface=save` | 切 Save / Load | Save / Load panel 可見 | mobile-save-load.png | mobile portrait | 未截圖 | 待測 |
| F13 | `?selftest=monkey#home` | 執行 monkey | selftest passed | mobile-monkey-selftest.png | mobile portrait | 未截圖 | 待測 |

## 本輪受影響 surface

- 受影響：State load / normalize / persist、Save / Load、paper doll rendering、ADV focus / keyboard confirm、所有依賴 hotspot / item / scene lookup 的流程。
- 未重製：正式美術資產、地圖圖像、Shop 商品圖、NPC 圖像。
