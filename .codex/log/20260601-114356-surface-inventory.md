# 20260601-114356 surface inventory

## 本輪作業模式

- 模式：測試內容 / 完整驗測盤點。
- 範圍：依 `m-skill-2tech-children-adv-game-dev` 驗測目前 #22 + #5 後的遊戲狀態；本輪不修程式、不處理 #19/#20/#21。
- 目標玩家：年幼英文學習者，手機直向優先，低挫折、短英文、立即獎勵。
- 技術邊界：GitHub Pages 靜態網站；`index.html` + `src/` ES modules + `styles/` CSS modules + `assets/`。

## 主循環

```text
Area Map (Castle / Kingdom)
  -> marker focus
  -> Scene entry
  -> Action Choices
  -> Detail Panel (ADV task / Shop / Wardrobe / Settings)
  -> feedback: coins, learned word, diary, item, outfit or room change
  -> return to Map / Room
```

本次代表鏈：

```text
Castle Map
  -> Princess Room scene
  -> Dresses action
  -> Wardrobe detail
  -> Kingdom Map
  -> Dress Boutique scene
  -> Shop detail
  -> purchase / equip feedback
  -> Diary / Settings / Save MD
```

## 操作流程樹

| flow_node_id | 入口 | 操作 | 預期狀態 | 本輪狀態 |
|---|---|---|---|---|
| castle-map | `#home` | 開啟 Castle area | 顯示 castle map、HUD、area nav | 已測 |
| castle-marker-focus | Castle map | marker focus | Princess Room marker 可辨識 | 已測；與 castle-map 共用入口 |
| princess-room-scene | Princess Room marker | 進入 room scene | 顯示 action choices | 已測 |
| wardrobe-detail | Room scene | 點 `Dresses` | 顯示 wardrobe detail panel | 已測 |
| kingdom-map | area nav | 切 Kingdom | 顯示 kingdom travel map | 已測 |
| kingdom-marker-focus | Kingdom map | 對 boutique marker 定位 | marker / map 狀態可用 | 已測 |
| shop-scene | boutique marker | 進入 boutique scene | 顯示 `Shop / Chat / Leave` | 已測 |
| shop-detail | shop scene | 點 `Shop` | 顯示商品 detail panel | 已測 |
| shop-feedback | shop detail | 購買 / 裝備 | 顯示商品回饋與 diary 更新 | 已測 |
| quest | garden scene | 答英文選項 | 正確答案給 coins / words / diary | 已測 |
| hint | garden scene | Help Teacher | 無 key 時顯示本地提示 | 已測 |
| diary | system menu | 開 diary tab | 顯示 words/friends/badges/records | 已測 |
| settings | system menu | 開 settings tab | 顯示 word level、version、build date | 已測 |
| save-overlay | system menu | 開 save tab | 顯示 Save MD / Load MD | 已測 |
| save-load-selftest | `?selftest=save-load` | 自測 | `passed: true` | 已測 |
| monkey-selftest | `?selftest=monkey` | 300 steps monkey | `passed: true` | 已測 |

## screenshot manifest

截圖資料夾：`.codex/log/20260601-114356-qa/`

| flow_node_id | 必要截圖檔名 | viewport | 是否已截圖 | 檢查結論 |
|---|---|---:|---|---|
| castle-map | `mobile-castle-map.png` | 390x844 | 是 | 可用；美術強，但 HUD portrait 偏空 |
| castle-marker-focus | `mobile-castle-marker-focus.png` | 390x844 | 是 | 可用；與 castle-map 視覺相近 |
| princess-room-scene | `mobile-princess-room-scene.png` | 390x844 | 是 | 功能可用；美術 gate 有 Must Fix，room backdrop 不像 room |
| wardrobe-detail | `mobile-wardrobe-detail.png` | 390x844 | 是 | 功能可用；list 可捲動，商品視覺誘因偏弱 |
| kingdom-map | `mobile-kingdom-map.png` | 390x844 | 是 | 可用；地圖探索感成立 |
| kingdom-marker-focus | `mobile-kingdom-marker-focus.png` | 390x844 | 是 | 可用；與 kingdom-map 視覺相近 |
| shop-scene | `mobile-shop-scene.png` | 390x844 | 是 | 功能可用；美術 gate 有 Must Fix，scene entry 仍像 map overlay |
| shop-detail | `mobile-shop-detail.png` | 390x844 | 是 | 功能可用；panel 擁擠列 Should Fix |
| shop-feedback | `mobile-shop-feedback.png` | 390x844 | 是 | 回饋可見；panel 擁擠列 Should Fix |
| quest | `mobile-quest.png` | 390x844 | 是 | 低挫折英文流程可用 |
| hint | `mobile-hint.png` | 390x844 | 是 | 本地提示可用 |
| diary | `mobile-diary.png` | 390x844 | 是 | 可用；日記本語彙成立 |
| settings | `mobile-settings.png` | 390x844 | 是 | #5 pass；Settings 偏表單感列 Should Fix |
| save-overlay | `mobile-save-overlay.png` | 390x844 | 是 | 可用；Save / Load 清楚 |
| save-load-selftest | `mobile-save-load-selftest.png` | 390x844 | 是 | dev-only raw JSON 造成 body width 943，不算產品 UI |
| monkey-selftest | `mobile-monkey-selftest.png` | 390x844 | 是 | dev-only raw JSON 造成 body width 943，不算產品 UI |
| desktop-smoke | `desktop-castle-smoke.png` | 833x735 | 是 | 無 runtime error、無明顯破版 |

機器可讀證據：

- `iab-browser-gate.json`
- `iab-dom-results.json`
- `iab-mobile-shot-results.json`
- `iab-interaction-results.json`
- `visual-shot-manifest.json`
- `desktop-smoke.json`
