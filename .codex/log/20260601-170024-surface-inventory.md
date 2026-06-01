# 20260601-170024 Surface Inventory

測試工具：Browser plugin / in-app browser iab。Viewport override 目標 390x844，實測約 391x845。

人工複核：已用 contact sheet 檢視全部 28 張手機直向截圖；自動 offscreen 偵測中的地圖 marker 屬於可拖曳地圖內容，不是 document overflow。

| # | Surface | 操作步驟 | 預期狀態 | 截圖檔名 | 實測 Viewport | 已截圖 | 結論 |
|---:|---|---|---|---|---|---|---|
| 1 | Castle Map | visual-qa castle-map | Castle area map loads with HUD, green area buttons, princess token, and room markers. | mobile-castle-map.png | 391x845 | 是 | Accept |
| 2 | Castle marker focus | visual-qa castle-map + scripted interaction | A castle marker can be tapped once to focus/highlight without opening a detail list. | mobile-castle-marker-focus.png | 391x845 | 是 | Accept |
| 3 | Princess Room scene action choices | visual-qa princess-room-scene | Room opens as ADV scene with Lumi and action choices before any wardrobe detail. | mobile-princess-room-scene.png | 391x845 | 是 | Accept |
| 4 | Wardrobe detail | visual-qa wardrobe-detail | Wardrobe detail appears only after choosing a room action and shows item preview/equip states. | mobile-wardrobe-detail.png | 391x845 | 是 | Accept |
| 5 | Kingdom Map | visual-qa kingdom-map | Kingdom map loads with draggable scene layer, markers, and foreground princess token. | mobile-kingdom-map.png | 391x845 | 是 | Accept |
| 6 | Kingdom marker focus | visual-qa map-near | A kingdom marker can be tapped once to focus/highlight without entering the scene. | mobile-kingdom-marker-focus.png | 391x845 | 是 | Accept |
| 7 | Castle Garden scene | visual-qa shop-scene / garden | Garden scene uses its own background/NPC and only action choices are shown first. | mobile-garden-scene.png | 391x845 | 是 | Accept |
| 8 | Garden English quest | visual-qa quest / garden | Short English choices are vertically touchable and not clipped. | mobile-garden-quest.png | 391x845 | 是 | Accept |
| 9 | Garden quest feedback | visual-qa quest / garden + scripted interaction | Correct answer gives kind feedback, coins, and no broken modal layout. | mobile-garden-quest-feedback.png | 391x845 | 是 | Accept |
| 10 | Market/Bakery scene | visual-qa shop-scene / market | Market/Bakery has distinct warm shop background and NPC before Shop detail. | mobile-market-scene.png | 391x845 | 是 | Accept |
| 11 | Market shop detail | visual-qa shop-detail / market | Room-treasure items show image previews, price, buy/leave states, and no overflow. | mobile-market-detail.png | 391x845 | 是 | Accept |
| 12 | Market shop feedback | visual-qa shop-feedback / market | Purchase feedback is visible and coins remain valid. | mobile-market-feedback.png | 391x845 | 是 | Accept |
| 13 | Harbor Port scene | visual-qa shop-scene / port | Harbor Port uses sea/dock background without being confused with Fish Shop detail. | mobile-harbor-port-scene.png | 391x845 | 是 | Accept；Should Fix 註記 |
| 14 | Fish Shop scene | visual-qa shop-scene / harbor | Fish Shop/Nami scene uses harbor/fish context and action choices first. | mobile-fish-shop-scene.png | 391x845 | 是 | Accept；Should Fix 註記 |
| 15 | Dress Boutique scene | visual-qa shop-scene / boutique | Boutique has dress-shop background/NPC and action choices before detail. | mobile-boutique-scene.png | 391x845 | 是 | Accept |
| 16 | Dress Boutique detail | visual-qa shop-detail / boutique | Dress item art and try-on preview are visible without CSS color-block fallback. | mobile-boutique-detail.png | 391x845 | 是 | Accept |
| 17 | Dress Boutique feedback | visual-qa shop-feedback / boutique | Dress purchase/equip feedback appears and the modal remains readable. | mobile-boutique-feedback.png | 391x845 | 是 | Accept |
| 18 | Shoe Shop scene | visual-qa shop-scene / shoeShop | Shoe Shop has shoe-store background and Mina NPC. | mobile-shoes-scene.png | 391x845 | 是 | Accept |
| 19 | Shoe Shop detail | visual-qa shop-detail / shoeShop | Shoe item image previews and actions fit mobile viewport. | mobile-shoes-detail.png | 391x845 | 是 | Accept |
| 20 | Shoe Shop feedback | visual-qa shop-feedback / shoeShop | Shoe purchase/equip feedback is visible and not clipped. | mobile-shoes-feedback.png | 391x845 | 是 | Accept |
| 21 | Accessory Shop scene | visual-qa shop-scene / accessoryShop | Accessory Shop has accessory-store background and Lili NPC. | mobile-accessory-scene.png | 391x845 | 是 | Accept |
| 22 | Accessory Shop detail | visual-qa shop-detail / accessoryShop | Accessory item image previews and actions fit mobile viewport. | mobile-accessory-detail.png | 391x845 | 是 | Accept |
| 23 | Accessory Shop feedback | visual-qa shop-feedback / accessoryShop | Accessory purchase/equip feedback is visible and not clipped. | mobile-accessory-feedback.png | 391x845 | 是 | Accept |
| 24 | Sunny Farm scene | visual-qa shop-scene / farm | Farm scene uses its own background/NPC and action choices first. | mobile-farm-scene.png | 391x845 | 是 | Accept |
| 25 | Lighthouse scene | visual-qa shop-scene / lighthouse | Lighthouse scene uses its own sea/lighthouse setting and action choices first. | mobile-lighthouse-scene.png | 391x845 | 是 | Accept |
| 26 | Diary overlay | visual-qa diary | Diary opens as game-style book overlay and remains dismissible. | mobile-diary.png | 391x845 | 是 | Accept |
| 27 | Settings overlay | visual-qa settings | Settings opens in overlay, controls fit mobile width, and game scene is not destroyed. | mobile-settings.png | 391x845 | 是 | Accept |
| 28 | Save / Load overlay | visual-qa save | Save/Load overlay is readable, export/import controls fit, and no API key is exposed. | mobile-save-load.png | 391x845 | 是 | Accept |
