---
name: hmiIntf自訂角色尺度與美術規範
date: 2026/6/19
description: solLingoWorld 紙娃娃與 ADV 場景的角色自然尺度、共用 rig、可玩角色 base 分層、透明輪廓描邊、GPT 童話手繪 raster 素材與正式美術資產規範（自 README ch2.7 拆出之 contract-local 契約）。
---

# I. 主旨目的

定義 [sysGame系統] 之 ADV 場景人物、紙娃娃 rig、角色輪廓描邊與正式美術資產的人機介面視覺契約。供 [modWardrobe模組]、[modScene模組] 與美術性測試共同遵循，避免 desktop 正常而 mobile 因比例或 CSS 換算造成身高與構圖不一致。

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

* 所有可玩紙娃娃共用同一 `shared-512x768-v1` rig：同身型、同畫布尺寸、同 slot 對位、同一套衣物 layer。
* 可玩公主 registry 須保留既有 `lumi`、`yumi`、`sol` id 供舊存檔載入；新增可玩公主使用 `rosa` id。
* `npcNaturalHeightCm` 寫在各 area 的 scene config，作為 runtime 與 QA 共用的機器可讀尺度來源。
* 特殊矮小或大型角色可有不同 `naturalHeightCm`，但仍須落在同一 `768px = 200cm` 尺度內；超過 200cm 須拆成明確特殊規格，不得偷改 canvas 或 CSS。

## B. 角色與 NPC 美術資產

* NPC 圖（`content-package/areas/*/assets/characters/*.webp`）必須是 `512x768` 透明 WebP，保留 alpha，不得把場景、紙張、純色或漸層矩形背景烘進角色。
* NPC 身體視覺中心須對齊 `x=256` 附近；偏移屬素材錯誤須改圖，不得在 runtime 為個別 NPC 加水平 nudge。
* NPC 腳底須貼近 canvas 最底端；底部透明留白不得用來調整站位。
* 可視人物高度由 `npcNaturalHeightCm` 換算，不得由 WebP 比例、mobile CSS 個別縮放或透明留白意外造成。
* Lumi、Yumi、Mary、Rosa base 共用同一 `512x768` paper-doll rig；wardrobe layer 對位到同一 rig 之對應位置（見下方 layer 對位條）。Mary 沿用歷史 stable id `sol`，主角感只由 ADV 舞台倍率 `1.20` 表達，不得把 base 做成不同自然尺度。
* 可玩公主 `base.webp` 目前採使用者指定的 baked-in 短髮 playwear base：可包含短髮、粉紅短袖上衣與紅短褲，但不得烘入長髮、長袖、睡衣、禮服、鞋帽、皇冠、場景或黑色／純色背景。角色 base 須使用 GPT 產生或修圖之童話手繪風格 raster 素材（PNG／WebP），不得以 SVG、CSS 濾鏡、向量拼貼或 renderer 特例代替。
* 可玩公主 runtime 角色圖只保留 `base.webp`；選角畫面須直接以 CSS 裁切 `base.webp` 的頭部、肩膀與胸口上緣作為 portrait，不另維護角色 `thumb.webp`。
* starter items（例如 `softBrownHair`、`starterPajama` 或後續替代品）保留為舊存檔相容項；在 baked-in playwear base 策略下可為空 layer/no-op，但預設與舊存檔正規化不得造成 starter 髮型或 starter 服裝重複疊圖。
* 四位可玩公主的美術方向：Lumi、Yumi、Mary、Rosa 依使用者指定方向對應，並轉為同 rig、透明背景、同 baseline 的正式 WebP；其中 Yumi 僅改深藍髮、Mary 僅改深綠髮，除髮色外不得改動服裝、姿勢、比例、臉型、透明底或 rig 對位。若未來要完全自由替換髮型或衣物，需另行改回中性 base + 髮型 layer + 衣物 layer 策略。
* wardrobe 單品須為 GPT／影像模型產生或修圖之童話手繪風格 bitmap 素材，正式交付為**單一 `512×512` 透明 WebP／PNG**，同時作為投影層與商店商品預覽（不另設分離商品縮圖）；不得使用 SVG、CSS 幾何、向量拼貼、emoji 或 placeholder 作為正式服裝素材或完成品替代素材。
* wardrobe 單品素材為 **`512×512` 長邊貼滿（fill）之透明 bitmap**（issue #196，取代 #176 去白邊緊貼裁切之可變尺寸畫布；兼作投影層與商店預覽）：等比縮放使內容長邊貼滿至少一對對邊、短邊置中留透明、不變形。投影對位仍以**類別級 `safeBox`（該類投影範圍）＋ per-item `targetBox`（canvas `512x768` 座標，由維護者精確校準）**管理：引擎把 `512×512` 素材等比映射進 `targetBox`，落點與尺度由 `targetBox` 決定。`targetBox` 預設落在該 item type／slot（如 hairstyle、top、bottom、dress、outer、shoes、headTop、headSide、faceEyes、faceMask、neck、hand）之類別 `safeBox` 內，`safeBox` 為軟性指引——手動 per-item 校準（含四角自由形變 `corners`：四角各自 px 偏移成任意四邊形，issue #191；相容舊梯形 `topInset`／`bottomInset`）可超出 `safeBox`，落在 `512×768` 畫布內即可（data-audit 對超出 safeBox 僅告警、落在畫布外才報錯）；新增同類衣物預設繼承類別 `safeBox`／`targetBox`，不得每件各自新增一次性 nudge、改 CSS selector 或靠透明留白調整位置。
* wardrobe layer 完成判定須實際穿到角色 base 上檢查，不得只檢查檔案存在；手機直向與桌機尺寸皆須抽查代表性類別，確認衣物位置、比例、接縫與跨角色共用 layer 對位。
* 露膚衣物層（短袖、涼鞋／赤腳、手部配件邊界）須逐一在各膚色角色上檢查接縫，不得殘留為單一膚色繪製的色塊。
* 不得為個別可玩公主新增 CSS nudge 或改畫布尺寸調整 layer 對位；wardrobe 對位錯誤回到 `targetBox` 校準或素材修正。
* wardrobe 單品素材以**三層描述詞**驅動影像模型生成：全域 `houseStyle`（全作品統一童話手繪底層繪法）＋ 每個素材包 `packStyle`（`name`／`reference`／`palette`／`motifs`／`linework`／`mood`，僅變母題與配色、不改底層繪法）＋ 單品 `itemDesc`；產圖以同包既有 2–3 件素材為風格錨（影像 API `image[]`），以文字描述遊戲定位與紙娃娃用途（不把場景背景圖當輸入），排除身體／場景／邊框／文字／投影、要求透明底與單件，使同包一致、跨件有別。
* wardrobe 素材採「**生成一張 → 不滿意改描述詞 → 重生**」流程（不採多候選自動挑選）；維護工具（[devtool/wardrobe-tuner.js]）於現有 `📁資料夾`／`🗑刪除` 外提供 `📝描述詞`（編輯三層描述詞 JSON）與 `♻重生`（依目前描述詞重生並覆蓋）。
* 素材**留痕寫入圖檔本身 metadata**（WebP comment／XMP：`model`／`prompt`／`date`），不另存 sidecar 檔；產圖與壓縮流程不得 `-strip` 掉該 metadata（如需壓縮去其餘 metadata，須保留或重寫 provenance）。
* 影像生成屬 **dev 期維護工具**、產出 commit 為 raster；runtime 不得即時呼叫影像模型，亦不得以 SVG／濾鏡代替素材。
* wardrobe 單品須畫成**穿戴正視（worn front view）**：以穿在隱形正面站姿身上的形狀呈現、**只見外側表面、單層**，不露內裡／背面／底面、非俯視、非平攤商品照。披風／外套採**前面閉合之斗篷形**以維持單層（不需背片，呼應 #195 單品單層、移除 outerBack）；鞋類採**正視圖、優先靴子**（長短靴皆可），不俯視露鞋底。留痕（model／prompt／date）因環境工具限制暫存各包 `style.json` 之 `items[asset]._gen`（待 cwebp／exiftool 等可寫 WebP metadata 之工具到位再內嵌圖檔）。

## C. 場景與素材通則

* 正式 runtime 素材統一使用 WebP；地圖、ADV 背景、NPC、角色、衣物 layer（兼商店預覽）都須為正式 bitmap 美術。
* World Map：`content-base/world/assets/world-map.webp`，實際像素與 manifest 須為 `1536x1536`。
* Area Map：每個 enabled area 用 `content-package/areas/<area>/assets/map-1536.webp`，實際像素與 manifest 須為 `1536x1536`。
* Scene background：每個 runtime ADV 場景背景須為單張 `1024x1024` WebP，由 sceneArt renderer 統一載入；場景 CSS 不得硬編碼背景 URL 或建立 fallback 背景圖。
* 場景背景整張圖皆須為正式繪製內容；不得以上下模糊、延展、frosted cover、失焦補版或 renderer 特例補足尺寸。合理景深、霧氣、光暈可保留，但不得替代原本應可辨識的場景區域。
* 手機直向寬度不足時以正式 `1024x1024` 圖中央裁切左右，不得疊加 blur／frosted cover。
* ADV 對話 UI 採低飽和深色高不透明底，維持高對比；不得用白霧洗掉人物、衣物或背景。
* CSS 只處理 UI chrome、排版、陰影、選取與安全裝飾；不得用幾何、SVG 拼貼、emoji fallback 或 placeholder 宣稱完成。

## D. 角色輪廓與陰影

* ADV NPC 立繪、可玩公主紙娃娃、地圖 token 與頭胸照須以透明素材 alpha 為基準形成常態圖地分離；主要手段為貼合透明外框的深色描邊與位移較大的自然景深陰影。
* 常態角色輪廓不得以大範圍亮色光暈、背景洗白或場景遮罩取代；光暈只可作為互動狀態提示（例如試穿中）或場景美術本身，不得混作角色本體可讀性的主要來源。
* 不同 surface 可有不同強度：ADV 立繪可使用較明顯的輪廓與景深，地圖 token 與頭胸照須較銳利且不遮擋周邊 UI，紙娃娃全身著裝須避免多層 wardrobe layer 各自累積過重髒邊。
* 若以 CSS `filter: drop-shadow()` 實作，應使用多層陰影區分輪廓描邊與自然陰影；描邊層偏深色、短距離、低模糊，景深層可較大位移與較柔和，但不得糊成不分透明輪廓的發光團。
* 完成判定須以手機直向與桌機視口截圖檢查 ADV NPC、可玩公主紙娃娃、地圖 token、頭胸照與試穿狀態；確認常態輪廓清楚、試穿光暈僅於狀態中出現、關閉狀態後不殘留，且文字與操作控制不被陰影遮擋。

# IV. 備註紀錄

* 2026/6/13：自 README ch2.7／2.7.1 原文拆出，建立為 contract-local 契約（issue #88 方法論導入）。對應 [hmiIntf通用視覺規範] 為上位 UX 通則。
* 2026/6/15：補入 issue #123 可玩公主 base 分層、四角色 roster、starter 外觀與舊 id 相容規格。
* 2026/6/16：依使用者改圖決策調整 issue #123 契約，改採四張指定 PNG 轉 WebP 的 baked-in 短髮 playwear base，starter items 改為相容 no-op 以避免預設重複疊圖。
* 2026/6/16：依使用者要求移除角色 `thumb.webp` runtime 用途，選角 portrait 改由 `base.webp` CSS 裁切頭胸部。
* 2026/6/19：依 issue #163 補入 Yumi 深藍髮、Mary 深綠髮、Mary 沿用 `sol` stable id，以及角色 base 須以 GPT 產生或修圖為童話手繪 raster 素材且不得以 SVG／濾鏡／renderer 特例代替之限制。
* 2026/6/19：依 issue #168 補入 wardrobe layer 類別級對位、GPT 童話手繪 bitmap 素材與禁止 SVG 作為正式服裝素材之規則。
* 2026/6/19：依 issue #179 補入 ADV 場景背景不得以上下模糊、延展或 renderer 特例補版之規則。
* 2026/6/19：依 issue #176 將 wardrobe layer 由 512×768 滿版對齊改為**去空白邊緊貼裁切 bitmap ＋ per-item `targetBox`（canvas 座標）等比 fit** 對位；類別 `safeBox` 續界定該類投影範圍，base 角色 rig 仍為 512×768。`devtool/trim-wardrobe-assets.mjs` 量測/裁切並產生內容框對照表；`data-audit` 改驗 `targetBox` 落於 `safeBox` 內且素材已緊貼裁切。
* 2026/6/20：依 issue #199 補入透明角色輪廓描邊與自然陰影規範，區分常態角色圖地分離與試穿等互動狀態光暈。
* 2026/6/20：依 issue #196 將 wardrobe 單品由 #176 去白邊緊貼裁切（≤512×768）＋分離 256×256 商品縮圖，改為**單一 `512×512` 長邊貼滿透明素材**兼作投影層與商店預覽（移除分離縮圖）；素材由全域 houseStyle＋packStyle＋itemDesc 三層描述詞經影像模型生成、留痕寫入圖檔 metadata，維護工具加描述詞編輯與重生；資產標準 `wardrobe` 改為 fill 模式 512×512（取代 wardrobeThumb／wardrobeLayer 雙類，見 [docs/design.md] ＜II.D＞ paramAssetStandards、intTest#49）。投影仍以 per-item `targetBox` 由維護者校準。
