# Issue #53 surface inventory

## 作業模式

- 本輪模式：修正目前功能 + 測試內容。
- 主要目標：修正 Lumi v3 紙娃娃服裝對位，特別是鞋子與配件；降低 doll runtime/source/thumb 資產尺寸；完成手機直向使用者角度的全流程、全可見按鈕與地圖標記 QA。
- Browser gate：已先嘗試 in-app Browser `iab`，但 list/selected/new/goto 階段都遇到 webview attach timeout，因此本輪瀏覽器驗證改用 fallback Playwright/Chromium 對同一 localhost URL 執行。

## 主循環

Room -> Wardrobe 試穿/換裝 -> Castle/Kingdom/Forest Map 探索 -> marker 聚焦/進入地點 -> ADV 任務、商店、退款、提示 -> coins/reward -> Shop/Dress-up -> Diary/Settings/Save。

## Screenshot manifest

| 類型 | 覆蓋範圍 | 證據 |
| --- | --- | --- |
| 紙娃娃穿搭 | 22 個 doll wearable item；優先檢查 shoes、head/face/neck/hand accessories | `.codex/log/20260602-223322-qa/paper-doll-wearables/` |
| 紙娃娃 contact | 全穿搭總覽與鞋子/配件優先總覽 | `.codex/log/20260602-223322-qa/paper-doll-all-wearables-contact.png`、`.codex/log/20260602-223322-qa/paper-doll-priority-shoes-accessories-contact.png` |
| 全流程 surface | 54 個 surface：castle/kingdom/forest map、Princess Room、7 類 wardrobe、16 個 scene、5 個 shop、5 個 refund、12 個 quest、hint、Diary、Settings、Save/Load | `.codex/log/20260602-223322-qa/full-flow-surfaces/` |
| 全流程 contact | 54 個 surface 手機直向截圖總覽 | `.codex/log/20260602-223322-qa/full-flow-surfaces-contact.png` |
| 地圖 marker | Castle 4 個、Kingdom 11 個、Forest 5 個，共 20 個 marker 聚焦與點擊 | `.codex/log/20260602-223322-qa/map-marker-surfaces/` |
| 地圖 marker contact | 20 個 marker 聚焦截圖總覽 | `.codex/log/20260602-223322-qa/map-marker-surfaces-contact.png` |
| 回歸 selftest | save-load、monkey 300 steps | `.codex/log/20260602-223322-qa/regression-surfaces/` |

## 未納入範圍

- 未重現真實手機瀏覽器 chrome、網址列或系統導覽列造成的可視高度差異；本輪 fallback 使用有效 viewport `390x844`、`isMobile=true`。
- 未對外部 production GitHub Pages cache 做線上重測；本輪驗證目標為本地 `http://127.0.0.1:4174/`。
