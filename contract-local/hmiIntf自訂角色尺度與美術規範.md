---
name: hmiIntf自訂角色尺度與美術規範
date: 2026/6/18
description: solKidGalGame 紙娃娃與 ADV 場景的角色自然尺度、共用 rig、可玩角色 base／face layer 分層與正式美術資產規範（自 README ch2.7 拆出之 contract-local 契約）。
---

# I. 主旨目的

定義 [sysGame系統] 之 ADV 場景人物、紙娃娃 rig 與正式美術資產的人機介面視覺契約。供 [modWardrobe模組]、[modScene模組] 與美術性測試共同遵循，避免 desktop 正常而 mobile 因比例或 CSS 換算造成身高與構圖不一致。

# II. 參考準備

* 本契約由既有 README 第二章（2.7 素材與畫風規格、2.7.1 角色自然尺度規格）原文拆出，並補入 issue #123 可玩公主 base 分層規格，作為內部設計細則的單一事實來源。
* 主題 token 與元件通則另依 [techStackStaticWeb] 與通用 hmiIntf 視覺規範；本契約只規範角色尺度與美術資產。

# III. 內容程序

## A. 共用 rig 與自然尺度

```text
canvas = 512x768
groundBaselineY = 768
fullCanvasHeightCm = 200
1cm = 3.84px
bodyHeightPx = naturalHeightCm / 200 * 768
NPC stageScale = 1.0
Lumi naturalHeightCm = 125
Lumi ADV stageScale = 1.20
```

* 所有可玩紙娃娃共用同一 `shared-512x768-v1` rig：同畫布尺寸、同 slot 對位、同一套衣物 layer；不得為了角色差異化改 canvas、baseline、slot 或 wardrobe layer 對位。
* 可玩公主 registry 須保留既有 `lumi`、`yumi`、`sol` id 供舊存檔載入；`rosa` id 持續保留。四個 id 語意為臉部設定預設模板與舊存檔相容入口，不要求維護四套差異化身體 base。
* `npcNaturalHeightCm` 寫在各 area 的 scene config，作為 runtime 與 QA 共用的機器可讀尺度來源。
* 特殊矮小或大型角色可有不同 `naturalHeightCm`，但仍須落在同一 `768px = 200cm` 尺度內；超過 200cm 須拆成明確特殊規格，不得偷改 canvas 或 CSS。

## B. 角色與 NPC 美術資產

* NPC 圖（`content-package/areas/*/assets/characters/*.webp`）必須是 `512x768` 透明 WebP，保留 alpha，不得把場景、紙張、純色或漸層矩形背景烘進角色。
* NPC 身體視覺中心須對齊 `x=256` 附近；偏移屬素材錯誤須改圖，不得在 runtime 為個別 NPC 加水平 nudge。
* NPC 腳底須貼近 canvas 最底端；底部透明留白不得用來調整站位。
* 可視人物高度由 `npcNaturalHeightCm` 換算，不得由 WebP 比例、mobile CSS 個別縮放或透明留白意外造成。
* Lumi、Yumi、Sol、Rosa 與 wardrobe layer 共用同一 `512x768` paper-doll rig，須同一幾何對位；主角感只由 ADV 舞台倍率 `1.20` 表達，不得把 base 或衣物 layer 做成不同自然尺度。
* 可玩公主 `base.webp` 在目前實作中作為 body mask 與頭胸裁切來源；正式素材方向須收斂為無固定五官、無固定髮型、無固定衣著、無固定膚色的人形 alpha mask。runtime 以 `skinTone` 填入 body mask，透明區不得被染色。
* body mask 上層須可疊加 skin shade／紅潤／陰影效果；這些效果只補明暗與膚色質感，不得烘入最終髮型、長袖、睡衣、禮服、鞋帽、皇冠、場景、黑色／純色背景或不可調的衣著。
* 可玩公主變化性由 face layer 與 hair layer 提供，不靠持續新增差異化 `base.webp` 範例。face layer 至少包含髮型、眉毛、眼睛、鼻子、嘴巴五類零件，並支援膚色與髮色參數；髮色須同步套用眉毛顏色。
* face layer 須固定對齊頭胸部座標，不得為個別模板新增 CSS nudge、改畫布尺寸或以透明留白調整對位；對位錯誤須回到素材修正。
* 選角畫面須直接以 CSS 裁切 `base.webp` 的頭部、肩膀與胸口上緣並疊加 face layer 作為 portrait，不另維護角色 `thumb.webp`。
* starter items（例如 `softBrownHair`、`starterPajama` 或後續替代品）保留為舊存檔相容項；在 body mask／face layer／wardrobe layer 策略下可為空 layer/no-op，但預設與舊存檔正規化不得造成 starter 髮型或 starter 服裝重複疊圖。
* 四位可玩公主的預設模板方向：Lumi 為明亮經典方向；Yumi 為冷色、安靜、優雅方向；Sol 為陽光、俐落、活動感方向；Rosa 為甜美、溫暖方向。模板差異由 face config 預設值與識別色／背景花紋組成，正式素材仍須同 rig、透明背景、同 baseline。
* 露膚衣物層（短袖、涼鞋／赤腳、手部配件邊界）須逐一在各膚色角色上檢查接縫，不得殘留為單一膚色繪製的色塊。
* 臉部編輯器 UI 須適合手機觸控：右側垂直控制列由上到下排列髮型、眉毛、眼睛、鼻子、嘴巴，每列以左右水平按鈕切換上一個／下一個選項；膚色與髮色控制不得擠壓主預覽，且文字不得溢出控制容器。

## C. 場景與素材通則

* 正式 runtime 素材統一使用 WebP；地圖、ADV 背景、NPC、角色、衣物 layer、商品縮圖都須為正式 bitmap 美術。
* World Map：`content-base/world/assets/world-map.webp`，實際像素與 manifest 須為 `1024x1536`。
* Area Map：每個 enabled area 用 `content-package/areas/<area>/assets/map-1536.webp`，實際像素與 manifest 須為 `1536x1536`。
* Scene background：每個 runtime ADV 場景背景須為單張 `1024x1024` WebP，由 sceneArt renderer 統一載入；場景 CSS 不得硬編碼背景 URL 或建立 fallback 背景圖。
* 手機直向寬度不足時以正式 `1024x1024` 圖中央裁切左右，不得疊加 blur／frosted cover。
* ADV 對話 UI 採低飽和深色高不透明底，維持高對比；不得用白霧洗掉人物、衣物或背景。
* CSS 只處理 UI chrome、排版、陰影、選取與安全裝飾；不得用幾何、SVG 拼貼、emoji fallback 或 placeholder 宣稱完成。

# IV. 備註紀錄

* 2026/6/13：自 README ch2.7／2.7.1 原文拆出，建立為 contract-local 契約（issue #88 方法論導入）。對應 [hmiIntf通用視覺規範] 為上位 UX 通則。
* 2026/6/15：補入 issue #123 可玩公主 base 分層、四角色 roster、starter 外觀與舊 id 相容規格。
* 2026/6/16：依使用者改圖決策調整 issue #123 契約，改採四張指定 PNG 轉 WebP 的 baked-in 短髮 playwear base，starter items 改為相容 no-op 以避免預設重複疊圖。
* 2026/6/16：依使用者要求移除角色 `thumb.webp` runtime 用途，選角 portrait 改由 `base.webp` CSS 裁切頭胸部。
* 2026/6/18：依 issue #130 將可玩公主變化性方向改為 body mask／skin shade／face layer／hair layer／wardrobe layer 疊合；Lumi／Yumi／Sol／Rosa 改作預設模板，臉部零件與膚色／髮色參數承接辨識差異。
