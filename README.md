# solKidGalGame

本 README 是本專案的長期 source of truth。後續修改不採「每次新增都往後堆」的流水帳方式；若設計、流程、資料夾或測試規則改變，應更新對應章節，只在第十章保留短版變更紀錄。

# 第一章 緣起與目的

## 1.1 專案緣起

本專案是給年幼英文學習者玩的靜態網頁遊戲。核心需求不是做一個題庫、網站或後台，而是做一個兒童能理解、願意反覆玩的日式 ADV 風格英文練習遊戲。

孩子陪 Princess Lumi 到不同地點和角色對話，練習一個短英文句子；答對後取得 coins、diary record 或 learned words，再把 coins 轉成看得見的髮型、衣服、鞋子、帽子、配件或 outfit set。學英文與換裝獎勵必須形成同一個正向循環。

## 1.2 產品目的

本案目的如下：

- 讓小朋友用短回合、低挫折的方式接觸英文。
- 用角色陪伴、場景探索與立即獎勵提高持續遊玩意願。
- 用換裝與視覺變化讓學習成果可見，而不是只顯示分數。
- 讓家長或維護者能用簡單的靜態網站方式部署與調整內容。
- 讓 area、角色與衣物能被模組化擴充，不因新增內容而讓核心程式失控。

## 1.3 目標玩家與使用情境

- 核心玩家：年幼英文學習者。
- 主要裝置：手機瀏覽器直向。
- 次要裝置：桌機瀏覽器，可保留可用性，但不以寬螢幕完成度取代手機完成度。
- 發布目標：GitHub Pages，repository root 即靜態網站根目錄。
- 本地測試：`server.mjs`，預設 URL 為 `http://127.0.0.1:4174/`。

## 1.4 核心體驗

孩子每次遊玩只需要理解一件事：選地方、聽一句、選一句英文、拿獎勵、幫 Lumi 變得更可愛。

```text
Area Map
  -> marker focus
  -> Scene entry
  -> Action Choices
  -> Detail Panel
  -> Feedback / Return
  -> coins / diary / learned words / item / outfit change
  -> repeat
```

## 1.5 本案不做的事

- 不做 landing page。
- 不做大型課程平台。
- 不做密集 phonics / spelling 課程序列。
- 不做後台式商品清單或管理介面。
- 不做需要 build step、後端服務或大型框架才能遊玩的核心流程。
- 不讓臨時幾何素材、emoji fallback、CSS 色塊或 placeholder 冒充正式美術。

# 第二章 架構主軸

## 2.1 技術邊界

本專案維持 GitHub Pages 可直接部署的靜態網站形態，不導入 React、npm、Vite 或其他 build step。核心程式以 `index.html` 載入 `game-engine/main.js`，再由原生 ES Modules 組裝資料、流程、狀態、渲染與測試入口。

程式與內容的基本邊界：

- `content-package/`：可擴充內容包。新增或移除 area、角色、衣物時，優先只動這裡的單一 package 與少量 registry 設定。
- `content-base/`：固定基礎素材。放不隸屬單一可擴充包、但 runtime 會共用的素材。
- `game-engine/`：遊戲核心原始碼。只放 bootstrap、state、flow、render、map、scene、system、testing 等程式模組，不放地區或衣物素材。
- `styles/`：CSS 樣式檔。只處理呈現，不承載內容資料。

## 2.2 目前資料夾結構

```text
solKidGalGame/
├─ index.html                 # GitHub Pages 與瀏覽器遊戲入口
├─ server.mjs                 # 本機 static server 與本機 OpenAI Help proxy
├─ README.md                  # 專案長期 source of truth
├─ AGENTS.md                  # Codex / agent 操作規則
├─ content-package/           # 可擴充內容包
│  ├─ areas/                  # 地區資源包
│  │  ├─ world.js             # 跨地區 portal route 設定
│  │  ├─ _shared/             # area 共用 helper
│  │  ├─ castle/              # Castle area package
│  │  ├─ urban/               # Urban area package
│  │  ├─ rural/               # Rural area package
│  │  └─ wild/                # Wild area package
│  ├─ characters/             # 可玩角色包
│  │  └─ lumi/
│  │     └─ assets/
│  │        ├─ base.webp      # Lumi 紙娃娃角色基底
│  │        └─ thumb.webp     # Lumi 角色縮圖
│  └─ wardrobe/               # 衣物資源包
│     ├─ manifest.js          # 衣物 runtime 總入口
│     ├─ _shared/             # 分類、slot、helper、素材路徑
│     ├─ starter/             # 初始髮型與睡衣狀態
│     └─ ...                  # 各商店 / 地區衣物 pack
├─ content-base/              # 固定基礎素材
│  └─ ui/                     # 共用 UI 圖像
├─ game-engine/               # 遊戲核心 ES Modules
│  ├─ app/                    # DOM element registry
│  ├─ build/                  # 版本資訊
│  ├─ core/                   # lookup 與純函式
│  ├─ data/                   # registry aggregation
│  ├─ flow/                   # ADV / action flow
│  ├─ map/                    # map actor 與 marker runtime
│  ├─ render/                 # reusable renderer
│  ├─ scene/                  # scene art descriptor renderer
│  ├─ state/                  # state、storage、save data shape
│  ├─ system/                 # Save / Load 等系統工具
│  ├─ testing/                # selftest hooks
│  └─ main.js                 # bootstrap / composition root
└─ styles/                    # CSS 樣式檔
   ├─ main.css
   ├─ base.css
   ├─ map.css
   ├─ mobile.css
   ├─ adv.css
   ├─ shop.css
   ├─ wardrobe.css
   ├─ paper-doll.css
   └─ system.css
```

## 2.3 Content Package 設計

### Area Packages

每個地區以 `content-package/areas/<area>/manifest.js` 作為唯一 runtime 資料來源。地區專屬地圖、NPC、scene art、場景 atlas、map layers、英文題庫與商店設定，都應留在該 area package 內。

新增或移除 area 的預期工作面：

1. 新增或刪除 `content-package/areas/<area>/manifest.js` 與 `content-package/areas/<area>/assets/`。
2. 在 `game-engine/data/game-data.js` 匯入或移除該 area 的 registry export。
3. 必要時更新 `content-package/areas/world.js` 的跨地區 portal route。
4. 只有共享 runtime 行為變更時才修改 `game-engine/`、`styles/` 或 `index.html`。

每個 area manifest 的章節順序：

1. `匯入共用工具`
2. `素材路徑工具`
3. `英文等級與獎勵設定`
4. `題庫資料`
5. `地圖與地點設定`
6. `對話場景設定`
7. `衍生匯出`

area icon 或 marker 在地圖中的位置主要改 `nodes.<node>.x` / `nodes.<node>.y`。

### Wardrobe Packages

衣物資料採 resource pack 模式，避免所有衣物集中在單一大清單。

- `content-package/wardrobe/manifest.js` 是衣物 runtime 總入口。
- `content-package/wardrobe/_shared/` 放跨 pack 共用規則：分類、slot、互斥、layer order、item helper、素材路徑 helper。
- `content-package/wardrobe/<pack>/manifest.js` 只寫該 pack 的商品資料。
- `content-package/wardrobe/<pack>/assets/layers/` 放上身透明 WebP layer。
- `content-package/wardrobe/<pack>/assets/thumbs/` 放商店 / 衣櫃 WebP 縮圖。

新增或移除 wardrobe pack 的預期工作面：

1. 新增或刪除 `content-package/wardrobe/<pack>/manifest.js` 與 `content-package/wardrobe/<pack>/assets/`。
2. 在 `content-package/wardrobe/manifest.js` 匯入或移除該 pack 的 items export。
3. 必要時在對應 area manifest 的店家設定中調整 `shopCategories` 或 `defaultCategory`。
4. 只有新增 slot、分類或裝備規則時才修改 `_shared/`、`game-engine/`、`styles/` 或 `index.html`。

目前 wardrobe runtime 匯總 92 件 items，其中 90 件是付費商品；`starter` store 保留初始髮型與初始睡衣狀態。

| Category | Item type | Items / Paid |
|---|---|---:|
| Hair | `hairstyle` | 11 / 10 |
| Tops | `top` | 10 / 10 |
| Bottoms | `bottom` | 10 / 10 |
| Dresses | `dress` | 11 / 10 |
| Outerwear | `outer` | 10 / 10 |
| Shoes | `shoes` | 10 / 10 |
| Hats | `headTop` | 10 / 10 |
| Accessories | `headSide`、`faceEyes`、`faceMask`、`neck`、`hand` | 10 / 10 |
| Outfit Sets | `outfitSet` | 10 / 10 |

### Character Packages

紙娃娃採共用 rig 概念：所有可玩娃娃共用同一身型、同一畫布尺寸、同一 slot 對位與同一套衣物 layer。

角色資料夾只放角色本體，例如膚色、臉型與預設外觀；衣服、鞋子、髮型與配件放在 wardrobe packages，不歸屬於單一角色。

目前 Lumi 放在 `content-package/characters/lumi/assets/`。未來新增角色時，只新增：

- `content-package/characters/<character-id>/assets/base.webp`
- `content-package/characters/<character-id>/assets/thumb.webp`

只要新角色遵守同一個 `512x768` rig，既有 wardrobe layer 與 thumbs 都能共用。

## 2.4 Manifest 格式

runtime manifest 使用原生 ES Modules，不使用 YAML 作為 runtime source。理由是 browser 可以直接 import `.js`，且 manifest 內需要 helper、derived export 與 asset descriptor。

維護慣例：

- imports 在最上方。
- 使用 named exports。
- helper 先於資料。
- 資料本身不產生 side effect。
- 使用 `//#region ...` / `//#endregion ...` 固定章節，方便 VS Code Outline 摺疊與定位。
- region 標題使用繁體中文，region 內適度保留中文註解。

## 2.5 遊戲流程架構

所有主要玩法統一遵循：

```text
Area Map -> Scene -> Action Choices -> Detail Panel -> Feedback / Return
```

- `Area Map`：只負責地區、地標、marker focus、portal，不直接塞商品清單或系統設定。
- `Scene`：進入某個地點後的 ADV 場景，顯示背景、Princess Lumi、NPC、地點名稱與 action choices。
- `Action Choices`：第一層 scene action 由 `game-engine/flow/scene-actions.js` 產生，handler type 包含 `wardrobe`、`help`、`shop`、`refund` 與 navigation `leave`。
- `Detail Panel`：玩家選擇具體動作後才顯示，例如答題、購物、換裝、退款、設定、存讀檔。
- `Feedback / Return`：顯示結果並提供清楚返回路徑，不讓玩家卡在大型 panel。

目前 runtime 實際支援的第一層 action：

| 場景類型 | 第一層 action |
|---|---|
| Princess Room | Hair、Tops、Bottoms、Dresses、Outerwear、Shoes、Hats、Accessories、Outfit Sets、Leave |
| Shop scene | 若該地點有 lesson 則顯示 Help，並顯示 Shop、Refund、Leave |
| 一般 NPC scene | 若該地點有 lesson 則顯示 Help，並顯示 Leave |
| 無 lesson 的一般 scene / portal | 顯示 Leave；hint 類 detail 由測試或特定 flow 進入 |

ADV 介面採三段式 layout：

```text
Fixed Prompt Area
  -> Scrollable Content Area
  -> Fixed Navigation Footer
```

`Leave` 只屬於 scene-level；進入 Shop、Wardrobe、Refund、Quest 或 Hint detail 後，底部 navigation footer 只使用 `Back` 回到上一層 action choices。

## 2.6 地區與英文難度

目前 `game-engine/data/game-data.js` 匯總的 area registry：

| Area | 狀態 | View | Default node | Nodes / Locations | 英文等級 | Reward |
|---|---:|---|---|---:|---|---:|
| Castle | enabled | `home` | `princessRoom` | 9 / 9 | Dolch Sight Words 220 | 20 coins |
| Urban | enabled | `map` | `garden` | 17 / 17 | Cambridge Starters | 100 coins |
| Rural | enabled | `map` | `ruralEntrance` | 10 / 10 | Cambridge Movers | 500 coins |
| Wild | enabled | `map` | `wildEntrance` | 10 / 10 | Cambridge Flyers | 2000 coins |
| Ocean | disabled placeholder | - | - | 0 / 0 | - | - |

目前 shop 設定：

| Area | Shop | Categories |
|---|---|---|
| Castle | Royal Cloak Room | Outerwear、Hats |
| Castle | Castle Seamstress | Tops、Bottoms |
| Urban | Dress Boutique | Dresses、Outfit Sets |
| Urban | Hair Salon | Hair |
| Urban | Tailor Studio | Tops、Bottoms |
| Urban | Shoe Shop | Shoes |
| Urban | Accessory Atelier | Hats、Accessories |
| Rural | Workwear Stall | Tops、Bottoms |
| Rural | Field Cobbler | Shoes、Hats |
| Wild | Fairy Atelier | Dresses、Accessories |
| Wild | Dwarf Cottage | Outerwear、Shoes |

地區間移動由 `content-package/areas/world.js` 管理，不讓地區包彼此直接相依。正式遊玩 UI 不使用底部快速地區切換按鈕；Castle、Urban、Rural、Wild 之間必須走地圖上的 gate / portal marker。

目前 world routes：

- Castle `castleGate` -> Urban `castleRoom`
- Urban `castleStair` -> Castle `castleGate`
- Urban `wildEdge` -> Wild `wildEntrance`
- Urban `ruralGate` -> Rural `ruralEntrance`
- Wild `entrance` -> Urban `wildEdge`
- Rural `entrance` -> Urban `ruralGate`

## 2.7 素材與畫風規格

- 正式 runtime 素材統一使用 WebP。
- 地圖、ADV 背景、NPC、角色、衣物 layer、商品縮圖都必須是正式 bitmap 美術資產。
- `content-package/areas/*/assets/characters/*.webp` 的 NPC portrait 必須保留 alpha 透明背景，不得把場景、紙張、純色或漸層矩形背景烘進角色圖。
- CSS 只能處理 UI chrome、排版、陰影、選取狀態與安全的裝飾效果。
- 不得用 CSS 幾何、SVG 拼貼、emoji fallback 或 placeholder 宣稱 gameplay complete。
- 商品縮圖與穿戴後上身效果必須分別驗收。
- 若美術尚未完成，應在測試或 issue 中標為未完成，不得把臨時素材寫成完成。

### 2.7.1 角色自然尺度規格

所有 ADV 場景人物必須遵守同一個自然尺度契約，避免 desktop 看似正常、mobile 因圖檔比例或 CSS 寬度換算而出現身高不一致。

角色尺度契約：

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

維護規則：

- `content-package/areas/*/assets/characters/*.webp` 的 NPC 圖必須是 `512x768` 透明 WebP。
- NPC 腳底必須貼近 canvas 最底端；底部透明留白不得用來調整人物站位。
- NPC 可視人物高度必須由 `npcNaturalHeightCm` 換算，不得由 WebP canvas 比例、mobile CSS 個別縮放或透明留白意外造成。
- `npcNaturalHeightCm` 寫在各 area 的 scene config，作為 runtime 與 QA 共用的機器可讀尺度來源。
- Lumi 與 wardrobe layer 共用同一個 `512x768` paper-doll rig；衣物 layer 必須和 Lumi base 做同一幾何對位，不得各自縮放。
- Lumi 的主角感只由 ADV 舞台倍率 `1.20` 表達，不得把 Lumi base 或衣物 layer 做成不同自然尺度。
- 特殊矮小或大型角色可以有不同 `naturalHeightCm`，但仍必須落在同一 `768px = 200cm` 尺度內；若超過 200cm，必須拆成明確的特殊規格，不可偷偷改 canvas 或 CSS。

# 第三章 測試與品質驗收

## 3.1 測試總原則

本案是 ADV game，不是一般網站。因此測試不能只看「頁面有載入」或「console clean」。必須用玩家視角驗證每個 flow node：地圖、scene entry、action choices、detail panel、feedback、return path，以及 Lumi 身上的視覺變化。

基本規則：

- 測試必須先定義 surface inventory 與 screenshot manifest。
- 每張測試截圖都要能回到 manifest row。
- contact sheet 只能當索引，不能替代全尺寸截圖審查。
- `node --check`、console clean、DOM exists、monkey pass 不能替代美術測試。
- 涉及手機 UI 時，必須記錄實際 viewport 條件：`innerWidth`、`innerHeight`、`documentElement.clientHeight`、`visualViewport.width`、`visualViewport.height`、`devicePixelRatio`。
- 第一層 `Leave` 與第二層 `Back` 必須量測 bounding box，確認在有效 viewport 內可見且可點。
- Browser / localhost / rendered UI QA 優先使用 Codex in-app Browser；若無法使用，才記錄原因並使用同一 URL 的 fallback 工具。
- 測試報告與截圖放在 `.codex/log/`，不把 QA 截圖或暫存 JSON 放回 `doc/` 當常駐 source。

## 3.2 測試紀錄格式

建議紀錄：

```text
.codex/log/<yyyyMMdd-hhmmss-功能性測試.md>
.codex/log/<yyyyMMdd-hhmmss-系統性測試.md>
.codex/log/<yyyyMMdd-hhmmss-介面性測試.md>
.codex/log/<yyyyMMdd-hhmmss-猴子性測試.md>
.codex/log/<yyyyMMdd-hhmmss-美術性測試.md>
.codex/log/<yyyyMMdd-hhmmss-好玩性測試.md>
.codex/log/<yyyyMMdd-hhmmss>-qa/
```

每份測試報告至少包含：

- URL 與 viewport。
- 測試 surface / flow node。
- 操作步驟。
- 預期結果。
- 實際結果。
- console / page error 狀態。
- 截圖或無法截圖的具體原因。
- 結論：`通過`、`未完成`、`Must Fix`、`Should Fix`、`Accept`、`阻塞`。

## 3.3 功能性測試

目的：驗證 Room、Map、ADV、Shop、Wardrobe、Diary 的核心流程可玩。

必測項目：

- Room 透過 `Leave` 回到 Castle Map。
- Castle / Urban / Rural / Wild Map 可移動、可進入 marker、可使用 portal。
- ADV 測試答錯、答對、上下鍵、數字鍵、speaker / help button。
- Shop 測試進入、試穿、購買、owned 狀態、equipped 狀態、離開。
- Wardrobe 測試 Hair、Tops、Bottoms、Dresses、Outerwear、Shoes、Hats、Accessories、Outfit Sets。
- 空分類顯示 empty state，不得 fallback 到其他分類。
- Diary 檢查任務、購買、學習事件是否記錄。
- Save MD / Load MD 可保存並還原進度。

完成條件：

- 主循環完整可用。
- 所有核心 surface 已實際操作。
- 沒有用語法檢查取代遊玩驗證。

## 3.4 系統性測試

目的：驗證 Save、Load、Settings、資料保存、狀態不變量與 console health。

必測項目：

- 不同 coins、裝備、任務、位置、menu 狀態下都可保存與還原。
- localStorage 重新整理後能恢復或乾淨重開。
- coins 不為負。
- 裝備不指向未擁有物。
- active scene 唯一。
- modal 可離開。
- console error / warning 需記錄並判斷是否相關。

完成條件：

- Save / Load / Settings / Diary 可用且不破壞沉浸感。
- 狀態不變量成立。
- 無相關 console error / warning。

## 3.5 介面性測試

目的：驗證操作一致、可理解，且符合日式 MAP ADV 操作感。

必測項目：

- 滑鼠、觸控、方向鍵、W/S、Enter、Space、數字鍵可用。
- 任務、地點、商店、換裝選單操作一致。
- focus 高亮或 `▶` 清楚。
- 第一層 `Leave`、第二層 `Back`、game menu overlay 返回一致。
- ADV 三段式 layout 成立：上方台詞固定、中段內容可捲動、底部 navigation footer 固定可見。
- Shop / Wardrobe / Refund 共用 item detail contract。
- 長商品名、price、Owned、Equipped、Need、Refund、inline action 在手機直向可讀可點。
- Quest / Hint / Shop / Wardrobe / Refund detail 只用 `Back` 回 scene action choices，回到 scene action choices 後才用 `Leave` 回 Map；沒有 lesson 的一般 scene 不應硬顯示 Help。
- 文字大小、行高、按鈕區域適合兒童。

完成條件：

- 玩家不需理解網站操作即可完成流程。
- 不再有明顯表單、後台、landing page 或 dashboard card 感。

## 3.6 猴子性測試與回歸測試

目的：驗證隨機與極端操作不會破壞狀態或卡死。

優先入口：

- `?selftest=monkey`
- `?selftest=save-load`
- `?selftest=data-audit`
- `?selftest=visual-qa&surface=<surface-id>`

必測項目：

- 隨機移動、進出地點、答題、商店、換裝、Save / Load、menu。
- 快速切換 Room、Map、ADV、Shop、Wardrobe。
- 快速連按 Enter、Space、方向鍵、數字鍵、Back / Leave。
- 在讀檔、開選單、換裝、購買、答題時切換場景。
- 檢查 focus 不卡死，Leave / Back 仍可返回。

完成條件：

- 隨機操作不造成崩潰、卡死或無法離開狀態。
- 若目標是盤點，必須分 surface 記錄，不只回報全域 pass/fail。

## 3.7 美術性測試

目的：用玩家視角檢查畫面是否真像兒童日式 MAP ADV，而不是網站或半成品。

美術測試是本案最重要的 QA 類型之一。工程測試通過不代表美術通過。

### 3.7.1 準備

- 先定義 screenshot manifest，列出 Room、Map、各地點、任務 ADV、Shop、Refund、Wardrobe、Diary、Settings、Save / Load。
- 全尺寸打開每張截圖；contact sheet 只作索引。
- 先審查正式美術來源。程式幾何圖、CSS 色塊、SVG 拼貼、模糊截圖、placeholder 必列 `Must Fix`。
- 若使用者提供實機截圖，必須把該截圖條件納入驗證，不得用理想 viewport 反駁。
- 修改前保存 baseline，修改後重截同一 flow node / viewport。

### 3.7.2 每張遊戲畫面的固定檢查清單

每個 surface 至少檢查：

- HUD / stat / header 是否完全在 viewport 內。
- 是否有水平捲動、安全區裁切、地址列遮擋。
- 文字是否裁切、擠壓、溢出、互相覆蓋。
- 可點擊目標是否太小、太貼邊或被遮擋。
- 背景、角色、NPC、道具與 UI 是否像同一個空間與同一套視覺語言。
- 角色比例、站位、裁切、腳底接地、陰影 / 底座與背景透視是否自然。
- 對話框、Shop / Wardrobe panel、設定 panel 是否壓壞舞台構圖。
- Scene entry 是否只顯示場景、角色與 action choices，不提前塞商品列表或換裝列表。
- `Area Map -> Scene -> Action Choices -> Detail Panel` 層級是否能從截圖辨識。
- 使用者曾指出的具體畫面是否有同名 row、同名問題、實際截圖證據與結論。

### 3.7.3 批評點與修訂循環

每個遊戲畫面要產生具體批評點，依下列分類：

- `Must Fix`：會讓畫面看起來壞掉、不可玩、不像正式遊戲或違反需求。
- `Should Fix`：不一定阻塞，但會降低完成度、可讀性或美感。
- `Accept`：可以接受，保留作為通過點或不改原因。

非 Accept 問題進入修訂循環：

```text
解決規劃
  -> 最小可驗證改動
  -> 重截同一 flow node / viewport
  -> 重跑固定檢查清單
  -> 誠實結案
```

報告每個非 Accept 問題使用固定欄位：

- `分類`
- `影響尺寸`
- `解決規劃`
- `前後比較`
- `修訂結論`

修訂結論只能是：

- `修訂完成`
- `找不到更好方案`
- `修訂失敗`
- `未修訂`
- `拆成後續工程項`

`Must Fix` 修正循環最多 3 輪；第 3 輪仍有 `Must Fix` 時，不得宣稱美術性測試完成。

### 3.7.4 美術測試完成條件

- 所有必測 manifest row 都已截圖、可開啟、已檢查。
- Scene entry、action choices、detail panel、feedback、返回路徑各自有截圖與結論。
- 每個修訂項目都有修改前圖、修改後圖或明確缺圖原因。
- 任一必測 row 為 `未完成`、缺檔、未檢查或仍有 `Must Fix` 時，本 stage 未完成。
- 不得以 contact sheet、工程測試通過、「比上一版好」或非正式素材替代美術通過。

### 3.7.5 角色尺度 QA

角色尺度變更必須同時做自動檢查與截圖檢查。

自動檢查至少包含：

- 每個有 `npcImage` 的 scene config 都有 `npcNaturalHeightCm`。
- 每張 NPC WebP 都是 `512x768`，有 alpha，且腳底 alpha bbox 貼近 `groundBaselineY = 768`。
- NPC alpha bbox 高度必須符合 `naturalHeightCm / 200 * 768`，容許誤差只能用於抗鋸齒、鞋底或少量髮絲。
- Lumi `base.webp` 是 `512x768`，可視高度符合 `125cm` 的自然尺度，腳底貼近底線。
- 所有 wardrobe layer 都是 `512x768`，並和 Lumi base 維持同一 paper-doll rig 對位。

截圖檢查至少包含：

- mobile 與 desktop 各截一次 King Hall 與 Farm，確認 King Rowan / Auntie Pom 的差異只來自 `naturalHeightCm`，不是 canvas 比例。
- 截 Princess Room 與每個 wardrobe category，確認 Lumi 縮放後衣物、鞋子、帽子、髮型與配件沒有漂移、裁切、浮空或穿幫。
- 若使用者提供實機截圖，必須用相同 flow node 與等效 viewport 重測，不得用理想 viewport 取代。

## 3.8 好玩性測試

目的：確認遊戲具備兒童願意繼續玩的目標、節奏、回饋與獎勵。

必測項目：

- 主循環是否清楚：Room -> Map -> ADV -> coins -> Shop -> Room。
- 小朋友是否知道下一步要做什麼。
- 答對、購買、換裝、徽章、存檔是否有明確回饋。
- 商店商品是否想買。
- 英文選項是否短、清楚、低挫折。
- 對話是否太長、節奏是否拖、地圖是否容易迷路。

完成條件：

- 遊戲有清楚目標、正向回饋與持續誘因。
- 小朋友能理解、願意探索，不覺得只是問答網站或管理介面。

## 3.9 常用 QA URL

```text
http://127.0.0.1:4174/#home
http://127.0.0.1:4174/#map
http://127.0.0.1:4174/?selftest=data-audit
http://127.0.0.1:4174/?selftest=save-load
http://127.0.0.1:4174/?selftest=monkey
http://127.0.0.1:4174/?selftest=visual-qa&surface=wardrobe-detail&category=accessories&owned=all#home
http://127.0.0.1:4174/?selftest=visual-qa&surface=wardrobe-detail&category=outfitSets&owned=all#home
```

`visual-qa` 目前由 `game-engine/testing/selftests.js` 支援下列 surface：

- `castle-map`
- `princess-room-scene`
- `wardrobe-detail`
- `urban-map`
- `wild-map`
- `rural-map`
- `map-near`
- `quest`
- `shop-scene`
- `shop` / `shop-detail`
- `refund-detail`
- `shop-sold-out`
- `shop-not-enough`
- `hint`
- `shop-feedback`
- `diary`
- `settings`
- `english`
- `save`

`visual-qa` 可使用：

- `fresh=1`：從乾淨狀態開始。
- `place=<hotspot-id>`：指定地點；未指定時預設 `garden`。
- `category=<wardrobe-category>`：指定 wardrobe detail category。
- `item=<item-id>`：指定 shop / refund / feedback surface 要聚焦的 item。
- `coins=<number>`：指定測試 coins。
- `owned=all`：注入全部已擁有物品。
- `owned=itemId,itemId`：指定已擁有物品。
- `equip=itemId,itemId`：指定穿搭。
- `report=1`：產生頁面端 visual QA metrics report。

這些 query 只供測試，不是正式遊戲入口。

# 第十章 結論、註記與維護紀錄

## 10.1 結論

本專案的核心價值是「短英文 ADV 對話 -> coins / diary -> 立即換裝回饋」的閉環。未來所有功能都應服務這個閉環，不應把專案推回普通網站、題庫、後台商品清單或沒有視覺獎勵的學習工具。

架構上，`content-package/`、`content-base/`、`game-engine/`、`styles/` 是目前固定的第一層分類。新增內容時優先新增 package；只有 shared runtime 行為真的改變時才修改 core engine。

## 10.2 部署作法

GitHub Pages：

- 使用 `Deploy from a branch`。
- 靜態網站 root 選 repository root。
- `index.html` 為入口。
- `server.mjs` 只用於本機 OpenAI Help proxy 測試，不是 GitHub Pages 必需項。

本機 static-only：

```powershell
python -m http.server 4173
```

本機 optional help proxy：

```powershell
$env:OPENAI_API_KEY="sk-..."
$env:OPENAI_ORG_ID="org_..."
node server.mjs
```

預設本機 server URL：

```text
http://127.0.0.1:4174/
```

## 10.3 維護規則

- README 不再保留完整歷史流水帳。
- 若設計改變，更新對應章節。
- 若資料夾改變，更新第二章。
- 若測試規則改變，更新第三章。
- 若只是短期 bug、QA 截圖、selftest JSON、臨時 audit artifact，不提交為專案常駐文件。
- 舊討論、舊截圖、舊報告若需要追蹤，放在 `.codex/log/` 或 issue，不放回 README 主體。

## 10.4 參考資料

| 參考案例 | 本案借用方向 |
|---|---|
| [Khan Academy Kids](https://en.khanacademy.org/kids) | 角色陪伴、短任務、學習足跡 |
| [Duolingo ABC](https://abc.duolingo.com/) | 短回合、低挫折、即時回饋 |
| [Lingokids](https://help.lingokids.com/hc/en-us/articles/23532720590610-Playlearning-Sections) | Playlearning 與兒童可自行操作的導覽 |
| [Toca Boca World](https://www.tocaboca.com/app/world/) | Dress-up、自我表達、角色扮演 |

## 10.5 變更紀錄

- 2026-06-05：整理 repo 第一層為 `content-package/`、`content-base/`、`game-engine/`、`styles/`。
- 2026-06-05：Area 改為 `castle`、`urban`、`rural`、`wild`。
- 2026-06-05：衣物資源包集中到 `content-package/wardrobe/<pack>/`。
- 2026-06-05：可玩角色素材集中到 `content-package/characters/<character-id>/assets/`。
- 2026-06-05：正式 runtime 素材統一使用 WebP。
- 2026-06-05：README 重整為第一章緣起與目的、第二章架構主軸、第三章測試與品質驗收、第十章結論與註記。
- 2026-06-06：新增角色自然尺度規格：`512x768`、底線 `y=768`、`768px = 200cm`、Lumi ADV stageScale `1.20`。
