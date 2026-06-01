# 20260601-195656 surface inventory

## 主循環

Room -> Kingdom Map -> Shop scene -> Shop detail -> preview / BUY -> feedback -> Wardrobe / Room Treasures -> Diary / Save。

## 操作流程樹

| flow_node_id | 狀態 | 本輪處理 |
|---|---|---|
| shop-scene-action-choices | 商店 scene 顯示 Chat / Shop / Leave | 修改後必測 |
| shop-detail-unsold-list | 點 Shop 後只列未購買商品 | 新增規則 |
| shop-detail-preview | 點商品只在上方舞台 preview / try-on | 修改後必測 |
| shop-detail-buy-success | BUY 後扣 coins、owned、auto equip、商品消失 | 新增規則 |
| shop-detail-not-enough | coins 不足不改 state | 修改後必測 |
| shop-detail-sold-out | 全買完顯示 empty state | 新增規則 |
| wardrobe-owned-management | 已購買商品只能在 Wardrobe / Room Treasures 管理 | 受影響 |
| diary-shop-record | 購買後 diary 記錄 | 受影響 |

## screenshot manifest

| flow_node_id | 入口畫面 | 操作步驟 | 預期狀態 | 必要截圖檔名 | 驗收 viewport | 是否已截圖 | 檢查結論 |
|---|---|---|---|---|---|---|---|
| shop-scene-action-choices | Kingdom Map | open boutique scene | Chat / Shop / Leave 清楚 | shop-scene-boutique-mobile.png | mobile portrait | 未截圖 | 未完成 |
| shop-detail-unsold-list | Shop scene | 點 Shop | 僅未購買商品可見 | shop-detail-unsold-mobile.png | mobile portrait | 未截圖 | 未完成 |
| shop-detail-preview | Shop detail | 點未購買商品 | Lumi 上方主舞台試穿 | shop-preview-blue-dress-mobile.png | mobile portrait | 未截圖 | 未完成 |
| shop-detail-buy-success | Shop detail | BUY 商品 | 扣 coins、商品消失、feedback | shop-buy-feedback-mobile.png | mobile portrait | 未截圖 | 未完成 |
| shop-detail-sold-out | Shop detail | 全商品 owned | sold-out empty state 與 Leave | shop-sold-out-mobile.png | mobile portrait | 未截圖 | 未完成 |
| wardrobe-owned-management | Room | 打開 Wardrobe | 已購買商品在 Wardrobe 管理 | wardrobe-owned-mobile.png | mobile portrait | 未截圖 | 未完成 |

## 備註

本輪重點是 Shop 採購行為與手機直向美術檢查；桌機只做不破版 smoke check。
