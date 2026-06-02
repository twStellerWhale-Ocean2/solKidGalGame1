# solKidGalGame

# 0. 模組化主軸

本專案後續所有功能開發都必須以「原生 ES Modules 模組化」作為主要架構主軸。功能可以持續擴充，但不能用疊床架屋的方式把新流程、新 UI、新資料規則都堆回單一檔案或單一特殊分支；每一輪功能都必須同時完成對應的模組歸位、測試入口與 README 設計同步。

## 目前模組化結構

目前專案維持 GitHub Pages 可直接部署的靜態網站形態，不導入 React、npm、Vite 或其他 build step。核心程式以 `index.html` 載入 `src/main.js`，再由 `src/main.js` 組裝下列原生 ES modules：

- `src/app/elements.js`：集中取得 DOM elements 與 selector helper。
- `src/build/version.js`：版本資訊與 cache busting 來源。
- `src/data/game-data.js`：area、scene、map node、shop item、lesson、quest template 等資料 registry。
- `src/state/default-state.js`、`src/state/game-state.js`、`src/state/storage.js`：預設狀態、state normalize、進度變更、diary / badge / reward mutation、localStorage 與 Save data shape。
- `src/core/lookups.js`：跨模組查找與純函式，例如 hotspot、scene config、item、area、category、node lookup。
- `src/flow/adv-controls.js`、`src/flow/stages.js`：ADV focus、flow stage 與互動控制。
- `src/render/paper-doll.js`、`src/render/settings.js`：可重用畫面 renderer。
- `src/system/save-load.js`：Save / Load Markdown controller 與匯入匯出規則。
- `src/testing/selftests.js`：`?selftest=save-load`、`?selftest=monkey`、`?selftest=visual-qa` 等測試 hook。
- `src/main.js`：目前仍負責 app bootstrap、module composition、事件綁定，以及尚未完全拆出的 map / scene / shop orchestration。它是下一階段主要瘦身目標，不應再承接大量新功能細節。

## 下一階段模組化方向

後續重構與功能開發應朝下列方向推進：

- 建立 `src/map/`，承接 Castle / Kingdom / future areas 共用的 map metrics、pan / zoom viewport、marker focus、player token、map actors 與 pointer / keyboard travel 行為。
- 建立更完整的 `src/scene/` 或擴充 `src/flow/`，承接 scene entry、action choices、quest、hint、feedback / return 的狀態流程，避免各地點在 `main.js` 形成特殊分支。
- 擴充 `src/render/`，將 Shop detail、Wardrobe detail、Diary / Settings overlay、ADV scene shared layout 等 renderer 從 orchestration 中拆出。
- 將 shop purchase / equip / try-on 的規則集中在 state 或 domain module，UI renderer 只反映狀態，不直接藏業務規則。
- 保留 `src/data/` 作為 registry 型資料來源；新增地區、店家、角色、商品、任務時，優先透過資料定義與共用流程生效，不新增硬寫的 Castle / Kingdom / 某店例外邏輯。
- 讓 `src/main.js` 長期收斂為 bootstrap、composition root、global event delegation、testing hook installation；若新功能讓 `main.js` 明顯變厚，該功能未完成模組化設計。

## 功能開發設計原則

每一個後續 issue、PR 或功能切片都必須符合以下原則：

- 先判定功能歸屬：data、state、core、map、flow、render、system、testing，不能先把流程塞進 `main.js` 再日後整理。
- 新增 gameplay surface 時，必須同步定義資料 registry、state mutation、render path、interaction flow、visual QA surface 與 selftest 需要的 hook。
- 不允許為單一地點或單一商品新增不可擴充的特殊分支；若需求看似特殊，先檢查是否應抽成 config、strategy 或共用 renderer option。
- 不允許複製既有流程後只改文字、圖片或 class name；應用共用 module 與資料設定完成差異化。
- 只共用 renderer 不算完成模組共用。Room / Shop / Refund 這類共用 gameplay surface 必須同時共用資料選擇、empty state、item row、action button、Back / Leave 行為、focus 與手機排版契約；不得只共用畫面產生器，卻在各流程外圍保留互相矛盾的特殊分支。
- 不允許以 CSS 疊層、隱藏 DOM、臨時全域變數或 query string hack 取代正式狀態與流程設計。
- 不允許為了解決單一問題而引入與 GitHub Pages 靜態部署相衝突的 build step、後端依賴或大型框架。
- 每次完成宣告前，必須能說明本輪功能落在哪些 module、是否讓 `main.js` 變薄或至少沒有變厚，以及測試如何覆蓋新增 module 邊界。

# I. 緣起目的

## 使用者描述要求

本專案是一個給年幼英文學習者玩的靜態網頁遊戲。主要體驗不是一般網站、題庫或後台，而是手機直向優先的兒童向日式 ADV：孩子陪 Princess Lumi 去不同地點和角色對話，練習一個短英文句子，答對後拿 coins，再把 coins 立刻轉成可見的換裝、鞋子、配件或房間裝飾獎勵。

使用者要求 `README.md` 改為本案長期 source of truth，採下列固定架構：

1. `I. 緣起目的`：包含使用者描述要求。
2. `II. 參考準備`：研究綜整業界類似遊戲的作法，並比較作為本案參考。
3. `III. 內容程序`：放置建議規劃內容。
4. `IV. 備註紀錄`：說明部署作法、執行狀況及剩餘問題等。

## 專案定位

- 類型：兒童向、可愛、日式 ADV 感的手機直向英文練習與換裝獎勵靜態網頁遊戲。
- 核心玩家：年幼英文學習者。
- 主要裝置：手機瀏覽器直向。
- 次要裝置：桌機瀏覽器可保留可用性，但桌機寬地圖不再是產品完成目標。
- 發布目標：GitHub Pages，repository root 即靜態網站根目錄。
- 技術邊界：維持 `index.html`、`src/` ES modules、`styles/` CSS modules、`assets/` 為主，不引入需要後端或 build step 才能遊玩的核心流程。

## 產品主旨

孩子每次遊玩只需要理解一件事：選地方、聽一句、選一句英文、拿獎勵、幫 Lumi 變得更可愛。

完整主循環：

```text
Area Map (Castle / Kingdom / future areas)
  -> marker focus
  -> Scene entry
  -> Action Choices
  -> Detail Panel (ADV task / Shop / Wardrobe / Settings)
  -> feedback: coins, learned word, diary, item, outfit or room change
  -> repeat
```

舊有桌機式自由探索 kingdom map 仍是專案歷史的一部分，但不應主導完成標準。手機版應以可愛、快速、低挫折的拖拉式地圖旅行與短 ADV 對話為核心。

# II. 參考準備

## 業界類似作法綜整

| 參考案例 | 可觀察作法 | 本案可借用 | 本案不照搬 |
|---|---|---|---|
| [Khan Academy Kids](https://en.khanacademy.org/kids) | 以角色、書本、影片與活動形成兒童學習路徑，目標年齡偏低，強調 playful learning。 | 用角色陪伴與短任務降低學習壓力；讓 diary / learned words 像學習足跡。 | 不做大型課程平台，不做大量學科內容。 |
| [Duolingo ABC](https://abc.duolingo.com/) / App Store listing | 以 mini games、獎勵與漸進式閱讀練習建立孩子信心。 | 每回合只練一個短英文目標；答錯提示、答對獎勵，避免挫折。 | 不做密集 phonics / spelling 課程序列。 |
| [Lingokids](https://help.lingokids.com/hc/en-us/articles/23532720590610-Playlearning-Sections) | 以 Playlearning、兒童可自行操作的區塊導覽、遊戲 / 影片 / 歌曲提高參與度。 | 手機導覽要讓孩子一眼知道可以去哪裡；操作要大、直覺、低文字負擔。 | 不做多媒體內容平台或訂閱內容庫。 |
| [Toca Boca World](https://www.tocaboca.com/app/world/) | 強調安全、開放式創造、自我表達、佈置與角色扮演。 | Dress-up、房間裝飾與角色自我表達要成為獎勵主軸。 | 不做大型開放世界、不做社交或複雜創作工具。 |

## 本案設計參考結論

- 兒童學習遊戲應採短回合、低挫折、立即回饋。
- 主角與 NPC 要有陪伴感，不能只有題目與按鈕。
- 手機直向流程要以大目標、大按鈕、明確下一步為準。
- 獎勵必須可見；coins 只有在能買到、試穿到、裝飾到東西時才成立。
- Diary / Save / Settings 是遊戲內道具或書本，不是管理頁面。
- 本案不是純英文 app，也不是純換裝 app；它的差異點是「短英文 ADV 對話 -> coins -> 立即換裝 / 佈置」的閉環。

## 必須避免的方向

- 不能讓首頁看起來像 landing page。
- 不能讓地點選擇看起來像網站卡片列表或 MIS 功能選單。
- 不能讓 ADV 看起來像表單問答。
- 不能讓 Shop 看起來像後台商品清單。
- 不能讓 Dress-up 只是資料狀態；Lumi 身上與房間中必須看得出改變。
- 不能用桌機寬地圖的完成度替代手機直向完成度。

## 正式素材品質 Gate

- 正式遊玩畫面不得使用程式幾何圖、CSS 色塊、SVG 拼貼、emoji fallback、圓形 / 方形 / 三角形或 `clip-path` 形狀冒充美術素材。
- 地圖、ADV 場景背景、NPC 立繪、商店商品、Princess Lumi 身上的髮型 / 上衣 / 褲裙 / 洋裝 / 外套 / 鞋子 / 配件 / 房間擺設都必須使用實際 bitmap 美術資產，例如 PNG 或 WebP。
- CSS 只能負責 UI chrome、排版、陰影、選取狀態與安全的裝飾效果；不能在正式素材路徑中畫衣服、鞋子、皇冠、蝴蝶結、包包、披風、桌子或燈。
- 商品縮圖與穿戴後的上身效果必須分別驗收。商品看起來像圖示不代表穿在 Lumi 身上成立；每個可裝備道具都必須逐一上身截圖確認比例、位置、遮擋順序、美感與兒童吸引力。
- 新增地區或商店時，若美術尚未完成，只能在 README / issue / log 中標為未完成；不得把臨時幾何素材寫成 gameplay complete。
- 完成聲明前必須跑 runtime asset audit，確認正式 runtime 不再引用臨時 SVG 或 CSS shape 素材，並用手機直向瀏覽器截圖覆蓋受影響 surface。

# III. 內容程序

## MVP Vertical Slice

第一條可驗收切片：

```text
Castle Map
  -> Princess Room marker
  -> Princess Room scene
  -> Wardrobe action choices
  -> Wardrobe detail panel
  -> Kingdom Map
  -> Dress Boutique marker
  -> Boutique scene action choices
  -> Shop detail panel
  -> purchase / equip feedback
  -> Diary / Save MD
```

切片完成條件：

- 手機直向可從 Castle Map 或 Kingdom Map 進入場景、完成獎勵並回到地圖或房間。
- ADV 場景有背景、NPC、Princess Lumi、底部 dialogue box 與大尺寸直排選項。
- 答錯時顯示溫和提示並可再試。
- 答對時立即給 coins、learned words、diary record 與正向回應。
- 商品與換裝 detail panel 必須由 action choices 進入；購買後 `Owned`、`Equipped`、coins 變化清楚。
- Lumi 或房間可見獎勵變化。
- Save / Load 不匯出 OpenAI API key。

## 核心場景規格

### Area / Scene Layering

所有主要玩法統一遵循：

```text
Area Map -> Scene -> Action Choices -> Detail Panel -> Feedback / Return
```

- `Area Map` 只負責地區、地標與 marker focus，不直接塞商品清單、換裝清單或系統設定。
- `Scene` 是進入某個地點後的場景畫面，顯示背景、角色 / NPC、地點標記與 action choices。
- `Action Choices` 是兒童可理解的短選項，第一層 gameplay action 統一為 `wardrobe`、`help`、`shop`、`refund` 四種；`Leave` / `Back` 屬於 `navigation`，不算 gameplay type。
- `wardrobe` 用於更換 Lumi 身上的裝扮，可透過 category 呈現 `Hair`、`Tops`、`Bottoms`、`Dresses`、`Outerwear`、`Shoes`、`Accessories`；`help` 代表幫助場景人物並取得回報；`shop` 用於購買獎勵；`refund` 只在原購買商店退還商品。
- `Detail Panel` 只在玩家選擇具體動作後出現，例如購物、換髮型、換上衣、換褲裙、換洋裝、換外套、換鞋子、換配件、Settings、Save / Load。房間佈置未來應以獨立 `decorate` action type 回歸，不混入本階段 Princess Room 第一層。
- `Feedback / Return` 必須顯示結果並保留清楚返回路徑，不讓玩家卡在大型 panel。
- 未來可擴充 action type 包含 `decorate`、`gift`、`inspect`、`miniGame`、`claim`；新增前必須先進入同一套 scene action registry，不得為單一地點硬寫特殊分支。

地區必須透過 area registry 或等效資料結構定義，不把 Castle / Kingdom 寫死成特殊分支。每個 area 至少包含 `id`、`label`、`map image`、`locations`、`default marker`、gate travel 設定與可用 actions。目前啟用地區是 Castle / Kingdom，資料結構需預留 Forest / Ocean 等未來地區。

Issue #47 決議：新增地區應以 area resource pack 進入專案。每個地區包可包含 `manifest.js` runtime 資料、`area.yaml` 作者組態、`area.md` 設計與素材狀態說明，以及該地區專屬臨時或正式素材。瀏覽器 runtime 仍維持 GitHub Pages 可直接使用的 ES Modules；YAML 是作者維護格式，不要求玩家端直接解析 YAML。

跨地區交通由世界層 route 管理，不讓地區包彼此直接相依。地區包只宣告自己的 portal，例如 Kingdom 的 `forestEdge` 或 Forest 的 `entrance`；`src/areas/world.js` / `world.yaml` 決定 portal 如何互相連接。正式遊玩 UI 不使用底部快速地區切換按鈕；Castle、Kingdom、Forest 等地區之間必須走地圖上的 gate / portal marker。

Portal marker 必須與一般 scene marker 有明顯視覺區隔。一般場景點代表可進入對話、商店或幫忙；portal 代表地圖邊界、路牌、門或小徑入口，文案使用 `Enter Forest`、`Back to Kingdom`、`Castle` 這類交通語意，不使用普通 `Visit`。

Forest 最小範例地區包含 `Cave`、`Dwarf Cottage`、`Mountain Peak`、`Tree Spirit Tree` 與回 Kingdom 的 portal。Forest 的正式 runtime 必須使用手繪風格 PNG / WebP 地圖、場景、NPC 與商品素材；臨時 SVG 或 CSS 幾何素材只能留作歷史來源或設計草稿，不得出現在正式遊玩引用中。

### ADV Layout Contract

所有 Scene entry、Quest、Help / Hint、Shop detail、Wardrobe detail、Refund detail 與未來新增地區 / 房間 / 店家的 ADV 介面都必須共用同一套三段式 layout contract：

```text
Fixed Prompt Area
  -> Scrollable Content Area
  -> Fixed Navigation Footer
```

- 下半部 `adv-box` 必須被視為固定 row-based shell：speaker、line、prompt、feedback、content slot、footer slot。前四列依內容自動高度，content slot 吃剩餘高度，footer slot 固定在最後一列。
- 手機直向下半部 `adv-box` 高度由共用 shell 決定，不得再為 `scene`、`hint`、`shop`、`refund`、`wardrobe` 個別設定互相不同的 `max-height` 或讓 mode-specific 規則覆蓋共用高度。
- `Fixed Prompt Area` 放 speaker、主要台詞、任務提示與必要狀態文案；它只佔自己需要的高度，不被選項或商品列推走。
- `Scrollable Content Area` 放一般 action choices、quest answer choices、商品列、換裝列、退款列與 empty state；內容超出時只能此區捲動。
- `Scrollable Content Area` 的高度由 lower panel shell 分配，不得使用商品列數、Help 是否有選項、退款筆數或 empty state 的 intrinsic height 當 flex basis；少於 3 列時保留空白，多於可視高度時只在此區捲動。
- `Fixed Navigation Footer` 放 `Leave`、`Back` 這類 navigation action；它不參與中間清單高度計算，且在手機有效 viewport 內永遠可見、可點。
- 第一層 scene entry 的離開文案一律使用 `Leave`；第二層 Detail Panel / Help / Hint 返回上一層一律使用 `Back`。
- Scene entry 的 `Leave` 與 Detail Panel / Hint 的 `Back` 必須佔用同一個 footer slot；第一層與第二層的下半部 dialogue box 高度、位置、內距與 footer top / bottom 不得因 Help 文案、商品數量、退款筆數或 empty state 而上下跳動。
- 不得把 navigation action 當成一般選項清單最後一列，也不得把 `Back` 放在固定 3 列商品區後面後任由它被實機瀏覽器地址列或系統列裁掉。
- 所有 Castle、Kingdom、Forest、Ocean 等地區與未來新增場景都必須透過同一個 layout / focus / return contract 生效，不得為 Princess Room、單一商店或單一任務寫特殊補丁。
- Scene action choices 與 Detail Panel 都必須保留同一套上半部主舞台：背景是目前場景圖、左側是 Princess Lumi、右側是該場景 NPC；手機直向下上半舞台與下半 dialogue / panel 應接近 1:1，不得因商品數量或分類不同而忽大忽小。
- `Leave` 只屬於 scene-level；進入 Shop、Wardrobe、Refund 或 Room category detail 後，底部 navigation footer 只使用 `Back` 回到上一層 action choices。

### Castle Area

- App 預設畫面應是 Castle Map / Castle Grounds，而不是 Wardrobe、Save / Load 或其他系統工具面板。
- Princess Room 是 Castle Map 上的一個 marker，不是啟動畫面的特殊例外。
- Castle / Kingdom 之間的可見切換必須走地圖上的 gate marker；底部 `Castle` / `Kingdom` area navigation 不再出現在遊玩畫面。
- Castle Map 必須預留 `Princess Room`、`King Room`、`Queen Room` 等房間 marker 的擴充位置。
- Castle 近景圖必須參考現有 kingdom map 中「白色城牆、粉紅屋頂、中央高塔」的城堡語彙；不得使用幾何圖或與原大地圖不一致的臨時圖當正式素材。

### Room / Professional Paper Doll Wardrobe

- Princess Lumi 以固定姿勢、固定畫布的全身紙娃娃呈現；正式 runtime 使用透明分層素材逐層疊合，不再以整套換裝 sprite sheet 切換造型。
- Issue #53 修訂後，Lumi v3 紙娃娃 runtime 與 source 素材採同一張 `512x768` 透明 PNG / WebP 畫布；所有髮型、衣服、鞋子與配件都以同一原點疊圖。不得為單件衣服在 runtime 手動調角色位置；若位移不對，優先修透明圖層本身的像素位置、縮放、裁切與透明邊界。
- `1024x1536` 高解析圖只屬於歷史來源，不再作為本分支 runtime 或 source contract。若需要回到高解析重新製作，應從 Git 歷史或重新生成取得，不在目前工作樹保留大型 source。
- 角色基準為約 10 歲兒童比例，頭部要比 14 歲版本更明顯，目標頭身比約 5.5 至 6 頭身，且在 ADV / Room 場景中必須以主要角色佔比顯示。
- 初始可穿狀態只有 `starterPajama` 粉白棉布短袖睡衣上衣、接近膝蓋的睡褲與預設髮型；睡褲需露出小腿以便搭配裙裝，其他衣服、鞋子與配件需透過 Shop / Wardrobe 主循環取得或試穿。
- 衣物 slot：`hairstyle`、`top`、`bottom`、`dress`、`outer`、`shoes`。`dress` 與 `top` / `bottom` 互斥；穿 `dress` 時上衣與褲裙不顯示，穿 `top` 或 `bottom` 時洋裝不顯示。
- 外套、大外套、披風與斗篷屬於 `outer`，不是 accessory；需要遮擋時可拆為 `outerBack` / `outerFront` 兩層，後片在角色身後，前扣、領口或袖口在衣服前。
- 配件不是單一大類欄位；可依部位同時疊加：`headTop`、`headSide`、`faceEyes`、`faceMask`、`neck`、`hand`。同一子 slot 一次只裝一件，不同子 slot 可共存，例如皇冠 + 蝴蝶結 + 眼鏡 + 小包。
- 可穿戴正式素材都必須由 GPT / `image_gen` 重新產生童話手繪風 bitmap，並搬入 `assets/doll/lumi/v3/`；商品縮圖與上身 layer 分開驗收。
- Issue #53 的穿搭修正優先順序固定為 `shoes` 與 `accessory` 第一批，因為既有截圖中鞋子、頭飾、眼鏡、面具、項鍊與手持物位移落差最大；它們必須先通過腳底接地、左右腳位置、臉部中心、脖子中心與手部接觸點檢查，再處理 tops / bottoms / dresses / outerwear / hair。
- 房間進入後先顯示功能 action choices：`Hair`、`Tops`、`Bottoms`、`Dresses`、`Outerwear`、`Shoes`、`Accessories`、`Leave`。
- Wardrobe detail panel 只能在玩家選擇對應功能後出現。
- 離開房間應是房間 scene 的 `Leave` action choice 或門口 hotspot，不是網站 hero CTA。
- Wardrobe 應像玩具衣櫃或抽屜，支援點選預覽與裝備狀態，但不得在預設畫面直接展開佔據主視覺。
- Wardrobe 的衣物、鞋子與配件試穿必須直接套在上方既有 Princess Lumi 主舞台，不另開獨立小紙娃娃或小試穿畫面；點選商品才進入暫時試穿，按 `Equip` 後才寫入正式 outfit state。
- Wardrobe 的第二層所有分類必須全部走同一個 detail renderer 與同一套手機排版，不得讓單一分類跳成店家 scene、NPC 對話或另一套按鈕配置。
- Wardrobe detail panel 與各商店共用同一套 item detail panel：中段列表最多穩定呈現約 3 列商品並可在列表內捲動；底部 `Back` 屬於固定 navigation footer，不得被列表高度、empty state 或商品文字推離可視區。
- Wardrobe detail panel 必須尊重玩家選擇的分類。點 `Shoes` 就只能顯示 shoes；若該分類尚未擁有物品，顯示分類專屬 empty state，不得 fallback 到 Dresses 或其他已擁有分類。
- 房間佈置與家具管理未來應以獨立 `decorate` action type 與 detail renderer 回歸，不得塞回 `wardrobe` 或 Princess Room 特殊分支。
- Room / Wardrobe 不顯示 refund；退款只能回到原購買店家，在店內 `Refund` action 中處理，避免兒童在換裝時誤按。

### Mobile Travel Map

- 手機直向主流程使用可拖拉的小地圖，不使用卡片清單作為主要地點選擇 UI。
- 地圖可比手機 viewport 稍大，玩家可用手指拖拉地圖，看見不同地點。
- 城堡與王國地圖必須支援單指拖曳與雙指縮放；縮放只作用在地圖、地標、map actors 與小公主圖示，不影響 HUD 與下方地區選單。
- 手機直向地圖允許超出 viewport；超出部分應透過 pan / zoom 可到達，不可因裁切導致王國地圖或城堡地圖的重要區域無法查看。
- 地圖縮放範圍預設為 `1.0` 至 `2.2`，pan 必須限制在可視範圍內，避免拖到只剩空白。
- 每個地點以大尺寸童話地標或標記呈現，點選後顯示遊戲式 preview：NPC 頭像、地點名、今日任務或商店目的、`Visit` / `Shop` / `Help`。
- 可保留一個小型羅盤、推薦地點或回到 Lumi 按鈕，避免年幼玩家拖拉迷路。
- 卡片清單不得作為主畫面；若保留，只能作 accessibility fallback、測試入口或隱藏式輔助。
- Kingdom 地點包含：Luminara Castle、Castle Garden、Market Square / Bakery、Harbor Port、Fish Shop、Dress Boutique、Shoe Shop、Accessory Shop、Sunny Farm、Lighthouse。
- Castle、Kingdom、Forest、Ocean 等地區都必須共用同一套 marker focus、scene entry、action choices、detail panel 與 return path。
- 可見地圖畫面以圖片與地標為主，不顯示 `Luminara Castle`、`Lumi's Travel Map` 這類標題提示詞；必要標題只保留在無障礙語意中。
- 下方地區按鈕全部維持同一套綠色童話按鈕；目前所在地用公主小頭像標示，不用紅 / 綠色差作為主要識別。
- Castle 與 Kingdom 都必須顯示可移動的小公主圖示；小公主圖示永遠位於地點 marker 之前景層，不被地點 icon 遮住，也不阻擋 marker 點擊。

### ADV Conversation

- 每個地點一個短場景：專屬背景、專屬 NPC、Princess Lumi、底部對話框。
- 進入地點時先顯示 scene action choices，不得直接進入商品列表、換裝列表或大型資料 panel。
- 第一層 `Help` 取代舊有 `Chat` / `Talk`，代表幫助場景人物、練習一句短英文，完成後取得 coins、learned words、diary 等回報。
- 非任務 `Help` / hint 流程完成後只提供 `Back` 回目前 scene action choices；`Leave` 只出現在 scene action choices，代表離開地點回 Map。
- 非任務 `Help` / hint 雖然沒有商品列，也必須保留與 Shop / Refund detail 相同的第二層 content slot；不得讓空內容區消失後把 `Back` 貼到文案下方。
- 每回合只練一個短英文句子。
- 選項直排、大尺寸、適合觸控。
- 支援方向鍵 / W/S、數字鍵、Enter / Space。
- Help Teacher `?` 提供短提示；沒有 API key 時使用內建提示。

### Shop

- Shop 是獎勵場景，不是 inventory table。
- 不同店家必須有不同背景、不同 NPC、不同商品語氣與不同短句，但共用同一套手機直向 scene layout。
- 店家分類依紙娃娃 slot 定義：Boutique 負責 `top`、`bottom`、`dress`、`outer`；Shoe Shop 負責 `shoes`；Accessory Shop 負責 `headTop`、`headSide`、`faceEyes`、`faceMask`、`neck`、`hand`；Market 保留 `room`；Dwarf Cottage 可販售森林風 `outer`。
- 地點 / 店內 scene entry 顯示 `Help`、`Shop`、`Refund`、`Leave` 等 action choices；玩家選 `Shop` 或 `Refund` 後才開啟對應 detail panel。
- 玩家選 `Shop` 後仍維持 ADV 場景感，不跳成後台商品清單頁；上方主舞台保留店員、Princess Lumi 與目前試穿結果，下方選項區才切換成採購選項。
- Shop 採購清單只顯示尚未擁有的商品；已購買的 wearable 商品從 Shop 清單消失，後續只能在 Wardrobe 管理與更換。披風、斗篷與外套歸 `outer`，不歸 accessory。既有 room 商品資料保留相容性，未來由 `decorate` 管理。
- 商品要有大預覽與立即 try-on。點商品名稱只做 preview / try-on，不扣 coins、不寫入 outfit state。
- Shop / Wardrobe 的 try-on 不得使用獨立小畫面、小紙娃娃或另外的試穿框；可穿戴商品必須直接暫時套用在上方既有 Princess Lumi 主舞台，房間物件只顯示選取 / 放置狀態。
- 進入 Shop / Wardrobe detail panel 時不自動試穿第一件商品；必須等玩家點選商品後，才讓上方 Princess Lumi 進入暫時試穿狀態。
- Shop、Wardrobe、Refund 共用同一個 item detail panel contract；不同模式只替換資料來源、empty state 與列內 action，不複製互動流程，也不得在 contract 外另寫 Back / focus / 手機排版規則。
- Item detail panel 的列內比例必須固定：item preview、商品名稱 / 狀態文字、inline action button 使用同一套 grid 欄寬；一件商品、多件商品或 empty state 都不得改變整體上下半比例。
- Item detail panel 的中段商品區可穩定呈現約 3 列高度；每列顯示 item preview / name / status / inline action。超過 3 件時只讓商品列表捲動，少於 3 件時可保留空白，但底部 `Back` 必須固定在 navigation footer，不得跟著商品區一起被裁切。
- 手機直向 item row 必須讓商品名稱與狀態保留可理解文字；不得用 `nowrap + ellipsis` 把主要品名截到無法辨識，也不得讓文字、商品圖與 action button 互相覆蓋。
- 每個可買商品必須顯示 price 與列內 `BUY` / `Need N`；點 `BUY` 才扣 coins、加入 owned、立即 equip wearable item，並顯示店員回饋。
- 若 coins 不足，保留試穿 preview 並顯示 `Need more coins` 類回饋，不得扣款或加入 owned。
- Detail panel 底部使用 `Back`，返回目前店家或 Princess Room 的 action choices；scene-level `Leave` 才代表離開地點回到地圖或城堡。
- 離開 Shop detail 或返回店家 scene 時，未購買的 preview 必須消失；只有已購買並 equip 的商品可保留在 Lumi 身上。
- 商店全買完時顯示兒童友善 empty state，例如 `You found all boutique treasures!`，並保留同位置 `Back` 返回路徑。
- `Refund` action 在所有店家 scene 固定顯示；Refund detail panel 只列出從該店購買、已擁有、cost 大於 0 的商品。每列使用 inline `Refund N`，退款金額為 `Math.floor(cost / 2)`，退款後移除 owned、必要時清除已裝備狀態，商品回到原店 Shop 清單。
- 單分類商店不讓 tab 佔主視覺。
- 狀態清楚顯示：price、`BUY`、`Need more coins`、refund amount、sold-out / empty refund state、`Back`；`Owned`、`Equipped` 類管理狀態只出現在 Wardrobe 或未來 `decorate`。
- 購買後應有輕量慶祝、店員回應與 diary 記錄。

### Diary / Settings / Save Load

- Diary 是公主日記本，顯示幫了誰、學到什麼、買了什麼、拿到什麼 badge / sticker。
- Settings 收 word level、voice、Help Teacher，不破壞遊戲沉浸感。
- Diary、Settings、Save、Load 必須收進齒輪或 game menu overlay，不佔用預設主畫面。
- Save MD 匯出可讀 diary 與 `LUMINARA_SAVE_JSON` data block。
- Load MD 還原 coins、energy、stats、difficulty、outfit、owned items、current quest、diary、completed lessons、learned words、met NPCs、badges。
- Settings 的版本卡必須顯示版本號與 build 日期時間；build 時間至少精確到分鐘，建議格式為 `YYYY-MM-DD HH:mm (UTC+8)`，方便同一天多次版本比對。

### HUD

- 預設 HUD 只保留玩家立即需要的 `Coins`、`Energy`、`Level`。
- `Words`、`Talk`、`Kind`、`Mood` 等非即時操作必要數值不放在預設主 HUD；若需要，可放入 Diary、Profile 或 Settings。
- 手機直向 HUD 不得超出 viewport、造成水平捲動或壓縮主場景。

## Word Levels

Settings 支援五個等級：

- Common English 100 words
- Common English 250 words
- Common English 500 words
- Common English 750 words
- Common English 1000 words

等級影響可用句庫與 reward multiplier，但不應讓低年齡玩家感到挫折。

## 素材與畫風規格

目前主要素材：

- Runtime 載入優先使用同名 `.webp` 最佳化版本，例如 `assets/castle-map2.webp`、`assets/kingdom-map2.webp`、`assets/scenes/*.webp`、`assets/characters/npc-*.webp`、`assets/doll/lumi/v3/layers/*.webp`、`assets/doll/lumi/v3/thumbs/*.webp`、`assets/map-layers/*.webp`。
- 原始 PNG 保留作為 source-quality 素材，例如 `assets/bedroom.png`、`assets/castle-map2.png`、`assets/kingdom-map2.png`、`assets/scenes/*.png`、`assets/characters/*.png`、`assets/map-layers/*.png`。

素材來源分類：

- 既有正式素材：目前 repo 內 hand-drawn style PNG。
- 臨時素材：CSS 色塊、程式幾何圖、SVG 拼貼、模糊裁切、placeholder。
- GPT / GPT-5.5 生圖：若使用者要求嚴格 asset provenance，正式美術必須重新用 GPT 圖像生成流程產出並寫回 repo。

正式完成標準：

- 背景、角色、NPC、商品、UI 裝飾要像同一個兒童日式 ADV 世界。
- 每個商店與地點要有自己的背景與人物：例如 Bakery / Market、Dress Boutique、Shoe Shop、Accessory Shop、Garden、Harbor、Farm、Lighthouse 不能只換文字。
- 各地點可共用手機版型，但不得共用同一張泛用背景或同一個 NPC 冒充不同場所。
- Castle 近景必須與 kingdom map 上的城堡可辨識為同一座城堡，保留白色城牆、粉紅屋頂、中央高塔、花園與城牆環繞語彙。
- 商品不能只是色塊，必須像孩子會想買的衣服、鞋、飾品或房間物件。
- 對話框不可壓壞主舞台。
- 手機直向不可因桌機構圖而裁切、留白過多或文字溢出。

## 圖片生成流程

正式遊戲美術若需要新圖，預設使用 Codex 內建 `image_gen` 產生 bitmap image，不用 CSS、SVG 拼貼、Canvas 或本機程式圖假裝正式素材。

專案綁定圖片的流程：

1. 先寫清楚用途、尺寸、風格、角色 / 場景、避免事項與是否需要透明背景。
2. 使用 `image_gen` 產生候選圖。
3. 將選定圖片搬入 `assets/` 下的合理資料夾，例如 `assets/scenes/`、`assets/characters/`、`assets/items/`。
4. 更新 consuming code 或資料設定。
5. 在測試 log 或 README 記錄來源為 `image_gen`，不得寫成手工或既有素材。

透明 PNG 預設先用 `image_gen` 生成純色 chroma-key 背景，再用本機去背工具轉 alpha。只有使用者明確要求 CLI / API / native transparency fallback 時，才改走需要 `OPENAI_API_KEY` 的 CLI 路徑。

## 驗收 Surface 與 Viewport

必要 surface：

- Castle Map
- Castle marker focus
- Princess Room scene action choices
- Wardrobe / Decoration detail panel
- Wardrobe / Decoration feedback
- Kingdom Map
- Kingdom marker focus
- Kingdom scene action choices
- Shop detail panel
- Shop purchase / equip feedback
- Room
- Mobile Travel Map / Area Map
- Diary
- Settings
- Save / Load overlay
- Castle Garden
- Market Square / Bakery
- Harbor Port
- Fish Shop
- Dress Boutique
- Shoe Shop
- Accessory Shop
- Sunny Farm
- Lighthouse

必要 viewport：

- 手機直向是本案主要且必要的截圖與美術驗收 viewport。
- 桌機與寬桌機只做「不破版」smoke check，不納入美術報告必要截圖，也不得用桌機完成度替代手機完成度。

手機直向是產品完成主標準。除非使用者另行要求，後續美術測試報告只嵌入手機直向截圖。

美術與版面驗收必須由操作流程樹產生 screenshot manifest。每列至少包含入口畫面、操作步驟、預期狀態、必要截圖檔名、驗收 viewport、是否已截圖、檢查結論。未列入 manifest 的畫面不得宣稱已測；缺截圖或缺結論的 row 不得標 `Accept`。

Visual surface sweep 應覆蓋所有會改變版面的狀態，不只截最終 panel。最低限度必須分開截：

- Area map 與 marker focus。
- Scene entry / action choices。
- Shop / Wardrobe / Settings 等 detail panel。
- 購買、換裝、答題後 feedback。
- 返回地圖或房間的路徑。

每張圖必須檢查 HUD 是否超界、文字是否裁切、按鈕是否被遮擋、背景 / 角色 / NPC / UI 是否同一空間、角色比例與站位是否自然、對話框或 panel 是否壓壞舞台，以及 scene entry 是否沒有偷塞 detail list。

## 實作順序建議

1. 建立 area registry，讓 Castle / Kingdom 先啟用，Forest / Ocean 可日後擴充。
2. 重整手機直向主流程：Area Map -> Scene -> Action Choices -> Detail Panel -> Feedback / Return。
3. 將預設畫面改為 Castle Map；Princess Room 作為 Castle marker 進入。
4. 將目的地選擇改為可拖拉、可點選地標的手機小地圖，移除卡片清單作為主操作。
5. 建立 `sceneConfig` / `shopConfig` / `roomConfig`，讓不同地點與店家使用不同背景、NPC、商品與台詞，但共用同一手機版型。
6. 將 Princess Room、Shop、Wardrobe 都拆成 scene action choices 與 detail panel 兩層。
7. 強化答對後的 coins / 商品 / 換裝回饋。
8. Shop 改成大預覽、try-on、購買慶祝與店員回應。
9. Diary 改成公主日記與學習足跡。
10. Settings / Save / Load 收進遊戲 overlay。
11. 針對 Castle Map、Princess Room scene、Wardrobe detail、Kingdom Map、各店 scene、Shop detail、feedback、Diary、Settings、Save / Load 做手機直向美術性測試。

## 原生 ES Modules 深化模組化

本節是前述「0. 模組化主軸」在實作與驗測上的落地規格。架構方向固定為原生 ES Modules 深化模組化，不導入 React、npm、Vite 或其他 build step。GitHub Pages 仍以 repository root 的 `index.html`、`src/`、`styles/`、`assets/` 直接部署；核心遊戲流程不得依賴本機 server、bundler 或後端才能遊玩。

後續所有功能開發都必須把模組化視為 Definition of Done 的一部分：功能完成不只代表畫面可用，也代表資料、狀態、流程、渲染、系統工具與測試入口各自落在正確 module，不能讓 `main.js` 或單一 CSS 檔繼續累積無邊界的特殊邏輯。

本輪實作順序固定：

1. 先更新本 README，鎖定架構邊界、驗收 surface 與完整測試規則。
2. 再修改 `src/` 與必要的 `index.html` / `styles/`。
3. 實作時先確認功能歸屬 module，不得先堆進 `main.js` 再視為完成。
4. 測試發現本輪重構造成的問題時，必須直接修復並重跑相關測試，不只記錄問題。

模組邊界：

- `src/main.js` 應退回 app bootstrap、module composition、global event delegation 與 testing hook installation，不再長期承載所有遊戲規則與 UI 細節。
- `src/app/` 負責 DOM element registry 與 shell-level helper。
- `src/data/` 保留 area、scene、shop item、lesson、quest template 等資料 registry。
- `src/state/` 負責 state normalize、localStorage persist、quest creation、diary、badge、reward mutation、save data shape。
- `src/core/` 或等效 helper module 負責跨模組查找與純函式，例如 hotspot、scene config、item、area、category、node lookup。
- `src/map/` 負責 Castle / Kingdom 共用地圖幾何、pan / zoom viewport、marker focus、player movement 與 map actor 定位。
- `src/flow/` 負責 ADV scene、action choices、quest、hint、feedback / return 的狀態流程。
- `src/render/` 負責可重用渲染 helper，例如 paper doll、Shop / Wardrobe / Settings shared DOM renderer。
- `src/system/` 負責 Diary、Settings、Save / Load overlay 與 Markdown save/load。
- `src/testing/` 的 selftest hook 必須維持可用；重構後不能讓 `?selftest=save-load`、`?selftest=monkey`、`?selftest=visual-qa` 失效。

禁止事項：

- 禁止為新地區、新店家或新任務複製整段既有流程後只替換文字或圖片。
- 禁止讓 `main.js` 重新成為商品規則、地圖規則、ADV 規則與系統 overlay 規則的集中堆疊處。
- 禁止用臨時全域狀態、隱藏 DOM 或 CSS 特例繞過 state / flow / render module 的責任。
- 禁止把測試入口綁死在單一 surface，導致新增功能無法被 visual QA 或 monkey test 覆蓋。

本輪完整驗測要求：

- 開始測試前必須建立 `.codex/log/<yyyyMMdd-hhmmss>-surface-inventory.md`，使用繁體中文記錄主循環、操作流程樹、screenshot manifest、受影響 surface 與未觸及 surface。
- 功能性測試必須覆蓋 Castle Map、Kingdom Map、Princess Room scene、Wardrobe detail、Shop scene、Shop detail、Diary、Settings、Save / Load。
- 系統性測試必須覆蓋 Save / Load roundtrip、Settings 生效、console error / warning、coins 不為負、裝備不指向未擁有物、active view 唯一、modal 可離開。
- 介面性測試必須覆蓋手機觸控、方向鍵、W/S、Enter、Space、數字鍵、Back / Leave / system overlay 返回路徑。
- Issue #53 介面性與功能性測試不得只抽查代表頁；必須以 action manifest 逐一列出所有可見頁面、按鈕、marker 與 overlay command，逐項操作並確認點擊後功能正常、返回路徑存在、文字與美術沒有溢出或崩壞。
- 猴子性測試必須執行 `?selftest=monkey`；若 fail，修復後重跑到 pass，或明確列出第三輪後仍無法解的阻塞原因。
- 美術性測試以手機直向為主要必要 viewport，至少截圖並檢查 Castle Map、Castle marker focus、Princess Room scene、Wardrobe detail、Kingdom Map、Kingdom marker focus、Kingdom scene action choices、Shop scene、Shop detail、Shop feedback、Diary、Settings、Save / Load。
- 美術性測試需依 Must Fix / Should Fix / Accept 分組；本輪重構造成的 Must Fix 必須修復、重截同一 manifest row 並複審。
- 好玩性測試必須從兒童玩家角度走一輪「選地點 -> 短英文 -> coins -> Shop / Wardrobe -> Diary」，確認主循環沒有因模組化拆分而變得不清楚或卡住。

完成宣告限制：

- 不得用 `node --check`、console clean 或 monkey pass 取代美術性測試。
- 不得用單張 final panel 截圖取代 Scene entry、Action Choices、Detail Panel、Feedback / Return 的分層驗收。
- 若發現既有、非本輪重構造成的大型美術資產問題，記錄為後續工程項；不得把本輪架構重整宣稱為全遊戲美術重製完成。

# IV. 備註紀錄

## 專案檔案

- `index.html`：DOM game shell、Room、Map、Diary、Settings、ADV modal，載入 `src/main.js` 與 `styles/main.css`。
- `src/`：原生 ES modules；包含 data、state、flow、render、testing、build/version。
- `styles/`：CSS modules；由 `styles/main.css` 依序匯入 base、wardrobe、map、system、paper-doll、ADV、shop、mobile rules。
- `server.mjs`：local OpenAI help proxy 與 static file server。
- `assets/`：背景、角色、商品、map layer 與 UI 圖像。
- `doc/AUDIT-111.md`： broad audit issue source of truth。
- `doc/AUDIT-IMAGE-ISSUES.md`：歷史 page-by-page visual issue list。

## 部署作法

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

- `http://127.0.0.1:4174/`

## QA Entrypoints

- Save/load selftest：`?selftest=save-load`
- Monkey selftest：`?selftest=monkey`
- Visual QA selftest：`?selftest=visual-qa&surface=<surface-id>`
- Visual QA 可用 `owned=all` 或 `owned=itemId,itemId` 注入已擁有物品，專門驗證 Wardrobe detail panel 的多筆 row、empty state 與 footer 位置；此參數只供測試，不是正式遊戲入口。
- Visual QA 可用 `fresh=1&owned=all&equip=<itemId>` 從乾淨狀態截指定穿搭，避免 localStorage 或前一張截圖殘留配件干擾紙娃娃判定。
- Issue #53 完成驗收必須建立全流程 action manifest，逐一操作所有可見頁面與按鈕：Room、Castle / Kingdom / Forest Map、地點 marker、Scene action choices、Quest、Help / Hint、Shop、Refund、Wardrobe、Diary、Settings、Save / Load、menu、Back、Leave、speaker、help、HUD 與 area nav。每個按鈕都要記錄點擊前後狀態、功能結果、返回路徑、console health 與美術判定；不得只用單張 contact sheet 或 monkey pass 取代全流程按鈕驗收。

常用 QA URLs：

- `http://127.0.0.1:4174/#home`
- `http://127.0.0.1:4174/#map`
- `http://127.0.0.1:4174/?selftest=visual-qa&surface=shop-scene&place=boutique#map`
- `http://127.0.0.1:4174/?selftest=visual-qa&surface=wardrobe-detail&category=accessory&owned=all#home`
- `http://127.0.0.1:4174/?selftest=visual-qa&surface=shop-detail&place=boutique&item=blueDress#map`
- `http://127.0.0.1:4174/?selftest=visual-qa&surface=shop-not-enough&place=boutique&item=blueDress#map`
- `http://127.0.0.1:4174/?selftest=visual-qa&surface=shop-sold-out&place=boutique#map`
- `http://127.0.0.1:4174/?selftest=monkey#home`
- `http://127.0.0.1:4174/?selftest=save-load#home`

較大 UI 或 gameplay 變更後：

1. 開啟本機 URL。
2. 先使用 Codex in-app Browser 的 Browser plugin workflow 連到 `iab`。
3. 若 `agent.browsers.get("iab")` 失敗，先確認 Codex 右側 in-app browser 側邊欄是否已開啟；必要時請使用者打開側邊欄，或依 Codex app 的 Browser 開啟方式重新顯示 in-app browser。
4. 不先改用外部 Playwright、系統 Chrome、Computer Use 或 npm browser tooling；只有已嘗試 Browser bootstrap 與 `iab` 取得、並記錄失敗原因後，才可依使用者同意使用替代方案。
5. 檢查或截圖手機直向相關頁面與場景。
6. 桌機與寬桌機只做不破版 smoke check；除非使用者要求，不放入美術報告。
7. 執行 monkey test。
8. 檢查 console errors / warnings。
9. 回報未解問題。

## 2026-05-31 本輪設計決議

- 預設主畫面改以 Castle Map / Castle Grounds 作為起點；Princess Room 是 Castle map 上的地點 marker。
- 系統功能如 Diary、Settings、Save、Load 收進齒輪或 game menu overlay，不在預設畫面長期佔位。
- HUD 預設只保留 `Coins`、`Energy`、`Level`，避免手機直向 stat grid 超界或壓縮主場景。
- Castle / Kingdom 視為兩個 area；未來 Forest / Ocean 等地區應透過 area registry 擴充。
- 所有地區與地點使用同一層級：`Area Map -> Scene -> Action Choices -> Detail Panel -> Feedback / Return`。
- Issue #45 決議：第一層 gameplay action 正規化為 `wardrobe`、`help`、`shop`、`refund`；第一層離開一律用 `Leave`，第二層返回一律用 `Back`。
- Princess Room 進入後先顯示 `Hair`、`Tops`、`Bottoms`、`Dresses`、`Outerwear`、`Shoes`、`Accessories`、`Leave` 等 action choices；選擇後才開 Wardrobe detail panel。
- Shop 進入後先顯示 `Help`、`Shop`、`Refund`、`Leave` 等 action choices；選 `Shop` 或 `Refund` 後才顯示對應 detail panel。
- Princess Room 第一層不再顯示 `Room Treasures`；既有 room item 資料保留相容性，未來以獨立 `decorate` action type 回歸。
- Issue #35 決議：Shop / Wardrobe / Refund 使用同一套固定 3 列高度 item detail panel；底部 `Back` 固定在列表外，Room 不顯示 refund，退款只能在原店家進行。
- Issue #10 / #11 決議：Castle / Kingdom 地圖不顯示場景提示詞、說明卡或 marker 文字 label；點 marker 第一次只以放大 / 高亮表示已選取，再點同一 marker 才進入場景。
- Castle 近景圖必須使用與 kingdom map 城堡一致的手繪風格，不接受程式幾何圖或臨時圖冒充正式素材。
- 美術驗收必須先列操作流程樹與 screenshot manifest；未截圖、未列 manifest 或未檢查的 surface 不得宣稱 Accept。
- 單次 partial manifest 可以用於小改驗證，但不得宣稱已完成全場景美術掃描；全場景掃描必須覆蓋所有 marker focus、scene entry、detail panel、feedback 與返回路徑。

## Mobile Map Interaction v2

本版本為 Issue #13、#14、#15、#16、#17 的地圖操作體驗版，不是完整 README vertical slice 全量重製版。實作順序固定為：

1. 先更新 README，鎖定本版本行為與驗收基準。
2. 再修改實質遊戲網站，範圍限於 Castle / Kingdom 地圖互動、少文字 UI、地區按鈕、小公主圖示與圖層。
3. 結束前依 `m-skill-2tech-children-adv-game-dev` 驗測規範建立同一 run timestamp 的 `.codex/log/<yyyyMMdd-hhmmss>-*` 紀錄與手機直向截圖證據。

行為規格：

- #13：Castle 與 Kingdom 地圖都支援手機單指拖曳與雙指縮放；HUD 與下方地區選單固定在外層，不跟著縮放。
- #14：Kingdom 地圖不以裁切完成為準；圖片可以大於 viewport，但左右與上下可透過拖曳查看，不能出現不可到達的重要區域。
- #15：地圖畫面移除可見標題提示詞，例如 `Luminara Castle`、`Lumi's Travel Map`；畫面以圖像、地標與玩家圖示為主。
- #16：底部 Castle / Kingdom 按鈕全部使用綠色系；目前所在地用公主小頭像標示。
- #17：Castle 地圖新增會移動的小公主圖示；Kingdom 小公主圖示前景層級高於地點 marker。

本版本必測 surface：

- Castle map initial
- Castle marker focus
- Castle pinch zoom / drag
- Kingdom map initial
- Kingdom marker focus
- Kingdom pinch zoom / drag
- Area nav active state
- Map to scene entry
- Return path back to map

## Mobile Map Viewport Architecture v3

本版本處理手機地圖圖層座標錯位問題：拖曳或縮放時，底圖、地點 icon、小公主 token 與 map actors 必須共用同一套 viewport metrics，不得再出現「上層圖示移動，但地圖底圖不動」的分層漂移。

本輪實作順序固定：

1. 先更新本 README，鎖定 `display/offset` viewport contract 與完整測試要求。
2. 再修改實質遊戲網站，範圍限於 Castle / Kingdom 地圖底圖與 viewport metrics 的圖層對齊。
3. 結束前依本節逐字納入的 `m-skill-2tech-children-adv-game-dev` 測試要求建立同一 run timestamp 的 `.codex/log/<yyyyMMdd-hhmmss>-*` 紀錄與手機直向證據。

架構決議：

- `areaMapMetrics()` / `syncAreaMapStyles()` 是 Castle / Kingdom / future areas 的唯一 viewport source of truth。
- CSS 變數正式使用 `--map-display-width`、`--map-display-height`、`--map-offset-x`、`--map-offset-y` 來描述底圖在 stage 中的實際顯示大小與位置。
- `--map-pan-x`、`--map-pan-y` 不再作為地圖底圖 `<img>` 的 pan / zoom contract；不得讓底圖、marker、player token、map actors 分別走兩套座標系。
- 地圖資料座標維持百分比座標：`0-100% map data coordinates -> areaMapMetrics -> stage pixels`。
- 新增 Forest / Ocean 或其他 future areas 時，必須沿用同一個 area map viewport contract，不得新增特殊 transform 或只服務單一地區的圖層修正。

本版本必測 surface：

- Castle map initial
- Castle drag after viewport change
- Castle pinch zoom after viewport change
- Castle marker focus after viewport change
- Kingdom map initial
- Kingdom drag after viewport change
- Kingdom pinch zoom after viewport change
- Kingdom marker focus after viewport change
- Area nav fixed outside zoomed map
- Map to scene entry and return path

本版本完成條件：

- Castle / Kingdom 在手機直向單指拖曳時，底圖、地點 icon、小公主 token、map actors 一起位移。
- Castle / Kingdom 在手機直向雙指縮放時，底圖、地點 icon、小公主 token、map actors 一起縮放與重新定位。
- HUD 與 gate / marker 操作層不跟著地圖縮放。
- 沒有水平捲動、重要地圖區域不可到達、或 icon 與底圖位置錯位。
- 不得用 `node --check`、console clean 或 monkey pass 取代手機直向美術性測試。

本輪逐字納入的 SKILL 測試要求如下；執行時不得刪減、改寫或以摘要取代。

```md
## 執行＜測試與調修＞

所有測試 stage 共用前述 `建立 log 檔案契約` 的 run timestamp 與 `.codex/log` 證據位置。測試規則集中在本章，不回寫到前置契約 stage。

測試紀錄使用 `.codex/log/<yyyyMMdd-hhmmss-OO性測試.md>`；不得使用 `<yyyyMMdd-hhmmss-OO性測試todo.md>` 作為正式報告。截圖、潔圖、contact sheet、前後比較用原始截圖與判定表放在 `.codex/log/<yyyyMMdd-hhmmss>-qa/` 或同一 run timestamp 的對應資料夾；不得同步或替代到 `doc/`。

測試開始前必須確認 surface inventory 已定義 screenshot manifest；screenshot manifest 是所有測試報告的索引來源，測試報告引用的每張圖都必須能回到 manifest row。manifest row 缺截圖、缺 viewport、缺檢查結論或截圖檔無法開啟時，該 row 只能標 `未完成` 或具體阻塞原因，不得寫 `Accept`、`通過` 或 `已驗證`。

進入各 stage 前先讀同 stage log；已記錄問題不得挑簡單項處理，每條都要補上 `已修並複測`、`本輪無法修並說明具體原因`、或 `拆成明確後續工程項且本輪不得宣稱完成`。

凡測試或修訂項目需要圖片證據，報告必須直接嵌入關鍵截圖或明確列出無法取得圖片的原因；只有文字、路徑或縮圖索引不足以支撐完成宣告。contact sheet 只能作索引，不能替代全尺寸截圖審查。

final 與 log 對重大缺陷、修訂優先順序、未修項目必須一致；所有完成宣告都能追溯到 manifest row、測試 log 或截圖證據。

工程測試不能替代美術測試。`node --check`、console clean、無 overflow、selftest / monkey passed 只證明功能或版面未壞；涉及美術、構圖、畫風、貼圖、使用者截圖時，必須進入美術性測試循環。

實際渲染工具選擇遵循全域工具規範；本 SKILL 只要求遊玩驗證、截圖與 log 證據，不規定或替代底層工具流程。

涉及手機 UI、使用者實機截圖或 GitHub Pages 畫面不一致時，驗證必須記錄使用者可視 viewport 條件：URL 來源、`innerWidth`、`innerHeight`、`document.documentElement.clientHeight`、`window.visualViewport.width`、`window.visualViewport.height`、`devicePixelRatio`，並量測第一層 `Leave` 與第二層 `Back` 等 footer action 的 bounding box 是否落在有效 viewport 內。不得用沒有瀏覽器地址列 / 系統列的理想 `390x844` 截圖反駁 Android Chrome 或 iOS Safari 實機截圖。

若使用者只是在討論美術、版面、構圖、視覺焦點，且未說「請修改 / 請執行」，不得直接改檔；先列具體問題、影響與建議，等確認後再修。

### stage: 功能性測試

* **主旨目的**：驗證 Room、Map、ADV、Shop、Wardrobe、Diary 的核心流程可玩。

* **參考準備**
  * [ ] 啟動本機服務或 GitHub Pages 預覽。
  * [ ] 列出 surface：Room、Map、Diary、Settings、hotspots、ADV、Shop。
  * [ ] 全量操作後，將功能問題、重現步驟、證據寫入 `.codex/log/<yyyyMMdd-hhmmss-功能性測試.md>`。

* **作業步驟**
  * [ ] Room 透過 `Leave` 回到 Castle Map。
  * [ ] Map 移動到任務地點並觸發 hotspot focus。
  * [ ] ADV 測試答錯、答對、上下鍵、數字鍵。
  * [ ] Shop 測試進入、試穿、購買、離開。
  * [ ] 回 Room 測試 wardrobe 變化；Hair、Tops、Bottoms、Dresses、Outerwear、Shoes、Accessories 都必須逐一驗證，空分類不得跳到其他分類。
  * [ ] Diary 檢查任務、購買、學習事件是否記錄。

* **完成條件**
  * [ ] 主循環完整可用。
  * [ ] 各 surface 核心功能皆已實際操作。
  * [ ] 未用語法檢查取代遊玩驗證。

### stage: 系統性測試

* **主旨目的**：驗證 Save、Load、Settings、資料保存、狀態不變量與 console health。

* **參考準備**
  * [ ] 準備不同 coins、裝備、任務、位置、menu 狀態。
  * [ ] 全量檢查後，將系統問題、觸發條件、證據寫入 `.codex/log/<yyyyMMdd-hhmmss-系統性測試.md>`。

* **作業步驟**
  * [ ] 測試 Save / Load 可還原 Room、Map、ADV、Shop、Wardrobe 狀態。
  * [ ] 測試 Settings 修改後生效且不破壞流程。
  * [ ] 測試重新整理後能恢復或乾淨重開。
  * [ ] 檢查 coins 不為負、裝備不指向未擁有物、active scene 唯一、modal 可離開。
  * [ ] 檢查 console error / warn；大型原始輸出存檔或摘要，不塞滿對話。

* **完成條件**
  * [ ] Save / Load / Settings / Diary 可用且不破壞沉浸感。
  * [ ] 狀態不變量成立。
  * [ ] 無相關 console error / warn。

### stage: 介面性測試

* **主旨目的**：驗證操作一致、可理解，且符合日式 MAP ADV 操作感。

* **參考準備**
  * [ ] 檢查是否仍有表單、普通 button、網頁 Close、dashboard card。
  * [ ] 全量檢查後，將介面一致性、可讀性、焦點、返回流程問題寫入 `.codex/log/<yyyyMMdd-hhmmss-介面性測試.md>`。

* **作業步驟**
  * [ ] 測試滑鼠、方向鍵、W/S、Enter、Space、數字鍵。
  * [ ] 測試任務、地點、商店選單操作一致。
  * [ ] 測試焦點高亮或 `▶`。
  * [ ] 測試第一層 `Leave`、第二層 `Back`、game menu overlay 返回。
  * [ ] 測試所有 ADV 三段式 layout：上方台詞固定、中段選項 / 商品 / empty state 可捲動、底部 `Leave` / `Back` 在手機有效 viewport 內固定可見且可點。
  * [ ] 測試 Shop / Wardrobe / Refund 共用 item detail contract：長商品名、price / Owned / Equipped / Need / Refund、inline action 與底部 `Back` 在手機直向都可讀、可點且不遮擋。
  * [ ] 測試非任務 `Help` / hint 流程只有 `Back` 回 scene action choices，回到 scene action choices 後才可用 `Leave` 回 Map。
  * [ ] 確認文字大小、行高、按鈕區域適合兒童。
  * [ ] 確認 Help / speaker / menu button 不突兀。

* **完成條件**
  * [ ] 主要操作可用且一致。
  * [ ] 玩家不需理解網站操作即可完成流程。
  * [ ] 不再有明顯表單或後台感。

### stage: 猴子性測試 / 回歸測試

* **主旨目的**：驗證隨機與極端操作不會破壞狀態或卡死。

* **參考準備**
  * [ ] 優先使用既有 `?selftest=monkey` 或專案既有自動化回歸測試入口。
  * [ ] 沒有自動測試時，用人工隨機操作。
  * [ ] 對每個 surface 記錄卡死、狀態破壞、焦點異常、無法返回問題到 `.codex/log/<yyyyMMdd-hhmmss-猴子性測試.md>`。

* **作業步驟**
  * [ ] 隨機移動、進出地點、答題、商店、換裝、Save / Load、menu。
  * [ ] 快速切換 Room、Map、ADV、Shop、Wardrobe。
  * [ ] 快速連按 Enter、Space、方向鍵、數字鍵、Back / Leave。
  * [ ] 在讀檔、開選單、換裝、購買、答題時切換場景。
  * [ ] 檢查 focus 不卡死，Leave 可回 Map。
  * [ ] 若目標是盤點，必須分 surface 記錄，不只回報全域 pass/fail。

* **完成條件**
  * [ ] monkey test 通過。
  * [ ] 隨機操作不造成崩潰、卡死或無法離開狀態。

### stage: 美術性測試

* **主旨目的**：用玩家視角檢查畫面是否真像兒童日式 MAP ADV，而不是網站或半成品。

* **參考準備**
  * [ ] 先讀 README 的 viewport 規格；若 README 指定 mobile-only，美術截圖與報告只要求手機直向。桌機 `1024x768` 與寬桌機 `1800x800` 只在 README 未改寫或使用者要求時作為必要美術 viewport。
  * [ ] 讀取本 SKILL 目錄的 `美術性測試範例.md`；報告可依專案調整內容，但應保留範例示範的嵌圖、Must / Should / Accept 分組、問題編號、修訂分析、畫面小結與總結統計。
  * [ ] 讀取 screenshot manifest，確認 Room、Map、各地點、任務 ADV、Shop、非任務互動、Diary、Settings 與使用者點名畫面是否都已列入。
  * [ ] 全尺寸打開 manifest 指定截圖；contact sheet 只作索引，不是審查替代品。
  * [ ] 先審查正式美術來源。程式幾何圖、CSS 色塊、SVG 拼貼、模糊截圖、placeholder 必列 `Must Fix`；若使用者要求 `image_gen` / GPT 生圖，必須列出非生圖資產並替換或標為未完成。
  * [ ] 將逐 surface 美術問題與證據寫入 `.codex/log/<yyyyMMdd-hhmmss-美術性測試.md>`。

* **作業步驟**
  * [ ] 建立美術檢查批次：以「遊戲畫面」為單位彙整 manifest row，列出 `畫面名稱`、`flow_node_id`、`viewport`、`截圖檔案`、`檢查狀態`、`Must Fix / Should Fix / Accept 數量`、`結案狀態`。
  * [ ] 先保存修改前基準圖；後續每輪修正都保存同一 flow node / viewport 的修改後圖。
  * [ ] 以 `美術性測試範例.md` 的章節形狀撰寫報告：每個遊戲畫面先嵌入本輪檢查截圖，再列 Must / Should / Accept 批評，接著列非 Accept 問題的修訂分析，最後寫畫面小結；不得只在文末集中列圖片或只提供檔案路徑。
  * [ ] 對每個遊戲畫面執行固定檢查清單；缺截圖、截圖無法開啟或不在 manifest 內時，該 row 依「測試與調修共用規則」標 `未完成`，不得進入 `Accept`：
    * [ ] HUD / stat / header 是否完全在 viewport 內，沒有超出邊界、被安全區切掉或造成水平捲動。
    * [ ] 文字是否裁切、擠壓、溢出容器、蓋住其他文字，按鈕與可點擊目標是否被遮擋或太貼邊。
    * [ ] 背景、角色、NPC、道具與 UI 是否像同一個空間與同一套視覺語言，不像截圖、表單或網頁元件拼貼。
    * [ ] 角色比例、站位、裁切、腳底接地、陰影 / 底座與背景透視是否自然；不得有漂浮、截腳、頭身比例突變或髒邊。
    * [ ] 對話框、Shop / Wardrobe panel、設定 panel 是否壓壞舞台構圖；主要角色與背景關鍵物件仍應可辨識。
    * [ ] 進場 Scene 是否只顯示場景、NPC / 角色與 action choices；不得在尚未選擇 `購物`、`換衣服` 等動作前直接塞商品列表、換裝列表或系統設定表單。
    * [ ] `Area Map -> Scene -> Action Choices -> Detail Panel` 層級是否能從截圖辨識；Scene entry 截圖與 detail panel 截圖不得互相代替。
    * [ ] 使用者曾指出或提供截圖的具體畫面，是否在 manifest 與 log 中有同名 row、同名問題、實際截圖證據與結論。
  * [ ] 依檢查清單產生至少 10 個具體批評點；批評點以遊戲畫面為單位，依 `Must Fix`、`Should Fix`、`Accept` 分組。少於 10 點、未分組或無法回到截圖證據時，本畫面未完成。
  * [ ] 只有 `Must Fix` 與 `Should Fix` 建立 `問題#N` 進入修訂循環；`Accept` 只保留在檢討批評中，不膨脹成待處理問題。
  * [ ] 對每個非 Accept 問題執行循環：`解決規劃 -> 最小可驗證改動 -> 重截同一 flow node / viewport -> 重跑固定檢查清單與 10 點批評 -> 誠實結案`。
  * [ ] `解決規劃` 必須說明預計改善、可能變糟處、受影響 flow node / viewport、可接受條件；找不到更好方案時記錄 `找不到更好方案`，不得硬改。
  * [ ] `前後比較` 優先直接嵌入修改前圖與修改後圖；若修改前圖無法補拍，必須像範例一樣明確寫出缺圖原因與替代證據，例如使用者回報、git diff 或舊版 DOM / CSS 結構，且該問題不得被描述為完整圖片前後比較。
  * [ ] 全域 CSS、座標、圖片比例、核心場景層級、角色比例、共用元件等高 blast-radius 改動，必須先列受影響 manifest row 並安排對應截圖。
  * [ ] 修訂後若新增任一 `Must Fix`、整體構圖變差、畫風一致性變差、焦點更亂或玩家第一眼更不清楚，結論必須記為 `修訂失敗`；不得寫成 resolved。
  * [ ] `Must Fix` 修正循環最多 3 輪；第 3 輪仍有 `Must Fix` 時，不得宣稱美術性測試完成，必須列為阻塞或殘留重大問題。
  * [ ] 報告每個非 Accept 問題使用固定欄位：`分類`、`影響尺寸`、`解決規劃`、`前後比較`、`修訂結論`；修訂結論只能是 `修訂完成`、`找不到更好方案`、`修訂失敗`、`未修訂`、`拆成後續工程項`。
  * [ ] 報告最後用互斥分類統計：`建議接受問題`、`完成改善問題`、`尚待處理問題`；三類合計必須等於全部問題數，且每個 `問題#N` 只能歸入一類。

* **完成條件**
  * [ ] 所有必測 manifest row 都已完成截圖、可開啟、已套用固定檢查清單並完成 10 點分組批評。
  * [ ] 任一必測 row 為 `未完成`、缺檔、未檢查或仍有 `Must Fix` 時，本 stage 未完成。
  * [ ] Scene entry、action choices、Shopping / Wardrobe detail panel、購買 / 換裝後 feedback、返回路徑各自有截圖與結論；只截最終 panel 不得宣稱整條 ADV / Shop / Wardrobe 流程已驗證。
  * [ ] 每個修訂項目報告都直接嵌入修改前圖、修改後圖與差異說明，不只有文字、路徑或 contact sheet。
  * [ ] 報告已參考 `美術性測試範例.md` 的基本結構；若缺少修改前圖、部分截圖排除或只驗收單一 viewport，已在報告開頭或對應問題中明確說明限制。
  * [ ] 每個問題都有誠實結論；`找不到更好方案`、`修訂失敗`、`未修訂`、`拆成後續工程項` 不得被 final 改寫成已完成改善。
  * [ ] 不得以 contact sheet、工程測試通過、「比上一版好」或非生圖素材誤報取代美術通過。

### stage: 好玩性測試

* **主旨目的**：確認遊戲具備兒童願意繼續玩的目標、節奏、回饋與獎勵。

* **參考準備**
  * [ ] 從兒童玩家視角準備一輪完整遊玩。
  * [ ] 檢查任務、獎勵、商店、換裝、Diary 是否形成正循環。
  * [ ] 將目標不清、回饋不足、節奏過慢、誘因不足、難度不適寫入 `.codex/log/<yyyyMMdd-hhmmss-好玩性測試.md>`。

* **作業步驟**
  * [ ] 檢查主循環是否清楚：Room -> Map -> ADV -> coins -> Shop -> Room。
  * [ ] 檢查兒童是否知道下一步要做什麼。
  * [ ] 檢查答對、購買、換裝、徽章、存檔是否有明確回饋。
  * [ ] 檢查商店商品是否想買。
  * [ ] 檢查英文選項短、清楚、低挫折。
  * [ ] 檢查節奏是否拖、對話是否長、地圖是否迷路。
  * [ ] 若使用者要求逐頁 / 逐場地列問題，必須逐 surface 輸出，不用總結省略。

* **完成條件**
  * [ ] 遊戲有清楚目標、正向回饋與持續誘因。
  * [ ] 小朋友能理解、願意探索，不覺得只是問答網站或管理介面。
  * [ ] final 說明已驗證流程、仍有風險與截圖證據。

## 整體檢討

### stage: 完成聲明前檢討

* **主旨目的**：防止局部改善後過早宣稱完成。

* **參考準備**
  * [ ] 檢查本次所有明確要求、討論形成的待辦、surface inventory、screenshot manifest 與各測試 log。

* **作業步驟**
  * [ ] 逐項對照需求，不只列已完成項。
  * [ ] 若缺陷清單過大，先建立 / 更新 Markdown source of truth。
  * [ ] 對照 screenshot manifest；任何必測 row 仍是 `未完成`、缺截圖檔、缺 viewport、缺檢查結論或未納入 log 時，final 必須說明未完成，不得宣稱全量完成。
  * [ ] 對照使用者點名畫面；每個具體截圖、surface 或流程都必須能回到 manifest row、同名或可追蹤問題、截圖證據與處理結論。
  * [ ] 逐一檢查 `.codex/log/<yyyyMMdd-hhmmss-OO性測試.md>`；存在未處理項時，不得說測試要求已完成。
  * [ ] 確認實際渲染遊玩、功能測試、系統測試、介面測試、monkey test 與 console health 都有證據。
  * [ ] 確認 smoke test、monkey test、console clean、路由可開啟或沒有 runtime error 沒有被寫成美術性測試、截圖 manifest 或 Scene / Detail Panel 分層驗收的替代證據。
  * [ ] 涉及美術時，確認美術性測試循環已完成：固定檢查清單、10 點分組批評、非 Accept 問題修訂循環、重截複審與誠實結論都存在。
  * [ ] 若仍有背景不成立、網站感、表單感、角色崩壞、UI 切割、焦點混亂、Shop 無誘因，不得宣稱完成。
  * [ ] 若使用者要求 `image_gen` / GPT 生圖，確認 final 與報告沒有把非生圖圖像寫成生圖圖像。
  * [ ] final 提到的重大問題必須已寫入 log / 報告，不得口頭承認但報告漏寫。

* **完成條件**
  * [ ] 所有完成聲明都能追溯到 manifest row、測試 log 或截圖證據。
  * [ ] screenshot manifest 沒有必測 row 殘留 `未完成`、缺截圖、缺 viewport 或缺結論；若有殘留，final 明確說未完成。
  * [ ] 使用者點名畫面都能回到 log 中同名或可追蹤問題與實際截圖證據。
  * [ ] 工程健康證據沒有被寫成美術完成或 ADV / Shop / Wardrobe 流程完成的替代證據。
  * [ ] 完成聲明經得起 Room / Map / ADV / Shop / Wardrobe 逐畫面檢查。
  * [ ] 美術完成聲明經得起美術性測試循環檢查；不能只經得起工程驗收或縮圖瀏覽。
  * [ ] 使用者不需要再指出基本日式 ADV、兒童體驗或美術來源問題。
  * [ ] 測試報告、修訂優先順序與 final response 對重大缺陷描述一致。
```

## 目前已完成狀況

- Fixed layout overflow and the PC game viewport.
- Fixed map coordinates so map, player, hotspots, and map actors use the same transform.
- Corrected the Princess Room and castle gate hotspots near the front gate.
- Removed white translucent arc/spiral decoration from the main map.
- Added image layer support to `mapActors`.
- Replaced windmill, flag, ship, river, harbor, and ocean effects with animated PNG layers under `assets/map-layers/`.
- Split shop categories by place:
  - Boutique: dresses
  - Shoe Shop: shoes
  - Accessory Shop: accessories
  - Market: room items
- Added mobile portrait layout so Room and Map keep a full-width game scene instead of being squeezed by the desktop HUD.
- Reworked shop ADV flow into preview-first reward shopping.
- Replaced `assets/kingdom-map.png` with a hand-drawn style map plate and kept the existing coordinate system.
- Switched the Mobile Map Interaction v2 branch to `assets/castle-map2.png` and `assets/kingdom-map2.png`; the Castle Gate / kingdom castle node now aligns with the purple castle stairway.
- Implemented Mobile Map Interaction v2 for Issue #13-#17:
  - Castle and Kingdom maps support shared mobile pan / zoom behavior.
  - Castle and Kingdom both render movable princess map tokens.
  - Keyboard movement now works on both Castle and Kingdom maps.
  - Keyboard movement updates nearby marker focus, matching pointer/tap marker behavior.
  - Gate hotspots are the visible area travel path; the earlier bottom Castle / Kingdom area navigation was removed for Issue #30.
  - Targeted QA evidence is under `.codex/log/20260531-200857-*`, `.codex/log/20260531-202502-bugfix-keyboard-map.md`, `.codex/log/20260531-211741-stair-map-revision.md`, `.codex/log/20260531-212337-kingdom-castle-marker.md`, `.codex/log/20260531-212822-unrestricted-map-movement.md`, and `.codex/log/20260531-213816-marker-placement-v9.md`.
- Corrected new map marker placement and semantics for the latest map art:
  - Kingdom castle entry marker aligns with the purple castle stairway.
  - Harbor Port is a separate anchor marker and no longer opens the Fish Shop / Nami content.
  - Fish Shop remains at the dock store position.
  - Lighthouse no longer uses a boat / port-looking marker icon.
  - Targeted QA evidence is under `.codex/log/20260531-215208-port-marker-fix.md`.
- Removed the earlier blurred mobile map backdrop in favor of a cleaner hand-drawn map presentation.
- Replaced ADV / Shop scene backgrounds with hand-drawn style PNG scene plates for all eight places.
- Added hand-drawn style PNG item art for all shop rewards and switched Shop item previews away from CSS color blocks.
- Added Diary and Settings book-style PNG backgrounds.
- Fixed Quest ADV choice overflow on desktop and mobile.
- Fixed mobile Shop command / item overflow so Buy and Leave remain visible.
- Optimized large runtime images to WebP for Issue #31 while keeping original PNG sources.
- Compact Shop detail panels now show more visible reward items at once for Issue #32.
- Princess Room keeps the action-first category menu and hides wardrobe category tabs in the advanced detail panel for Issue #33.
- Wrapped the Help Teacher key fields in a form and prevented submit reloads, clearing Chromium password-field console warning during selftests.
- Re-ran full visual QA across 64 desktop/mobile surfaces. Final evidence is under `doc/qa-20260531-final-art-map/`.
- Removed visible map scene hints for Issue #10 and simplified marker entry for Issue #11:
  - Castle / Kingdom no longer show nearby scene explanation cards.
  - Map marker focus no longer renders visible text labels.
  - First tap selects / highlights a marker; second tap enters the selected scene.
  - Targeted mobile QA evidence is under `.codex/log/20260531-190528-qa/`.
- `node --check src/main.js` and module syntax checks have passed multiple times.
- The 300-step monkey test has passed multiple times.

## 剩餘問題

1. Shop、Diary、全場景內容擴展仍保留後續版本處理；本分支完成範圍鎖定在 Mobile Map Interaction v2 與地圖 marker 修正。
2. 需要把本 README 的 area registry 與 scene layering 設計完整落實到程式碼，並避免 Castle / Kingdom 被寫死成不可擴充的特殊分支。
3. 需要將 Princess Room 與各商店都穩定拆成 scene action choices 與 detail panel，避免再次在 scene entry 直接顯示清單。
4. 需要建立全場景 visual surface sweep，覆蓋所有 marker focus、scene entry、detail panel、feedback 與返回路徑，不只測少數截圖。
5. 各店與各地點需要專屬背景、NPC、商品語氣與任務短句，但共用統一手機版型。
6. 手機主循環需要更強的答對後立即換裝回饋。
7. Shop reward appeal 需要加強：try-on 變化、購買慶祝、房間 / outfit 可見效果。
8. Diary / Settings / Save / Load 仍需持續避免變成工具頁或後台表單。
9. 若要求嚴格 asset provenance，所有 generated PNG assets 應透過 `image_gen` 或經使用者確認的 GPT 圖像生成流程重新產出並替換。
10. `doc/AUDIT-IMAGE-ISSUES.md` 仍是歷史視覺問題清單，後續修訂需確認是否仍有效。

## 本 README 變更紀錄

- 2026-06-02：新增 Issue #53 紙娃娃修訂，將 Lumi v3 runtime / source layer contract 從 `1024x1536` 改為 `512x768` 以降低載入，鞋子與配件作為第一批修正與截圖驗收目標，並要求最後建立全流程 action manifest，逐一操作每個頁面、按鈕、marker 與 overlay command，確認功能與美術同時通過。
- 2026-06-02：新增 Issue #51 專業紙娃娃換裝系統規格，要求 Princess Lumi 採固定 `1024x1536` 透明 layer contract、10 歲兒童比例與較大畫面佔比、初始僅粉白棉布短袖睡衣上衣與近膝睡褲、外套 / 披風歸 `outer` 且可拆前後層、配件依 `headTop` / `headSide` / `faceEyes` / `faceMask` / `neck` / `hand` 多部位疊加，所有 wearable 以 GPT / `image_gen` 童話手繪風 bitmap 重繪並放入 `assets/doll/lumi/v3/`。
- 2026-06-02：新增 Issue #49 正式素材品質 Gate，禁止正式遊玩 surface 使用 CSS 幾何圖、SVG 拼貼、emoji fallback 或圓形 / 方形 / 三角形素材；Forest、商品縮圖、Princess Lumi 上身道具與房間擺設都必須用實際 bitmap 美術並逐一渲染驗收。
- 2026-06-02：新增 Issue #40 的 ADV 三段式 layout contract，要求所有 Scene / Detail Panel 共用固定上方文案、中段可捲動內容與固定底部 navigation footer，並補入使用者實機 viewport 驗證規則。
- 2026-06-02：新增 Issue #42 的第一層 / 第二層 ADV 主舞台比例、Room category detail 共用 renderer、detail footer 僅 `Back`、以及 build 時間精確到分鐘規格。
- 2026-06-02：補強 ADV lower panel footer slot 規格，要求第一層 `Leave` 與第二層 `Back` 使用同一固定 footer 位置，Help / Hint 無商品列時也必須保留中段 content slot。
- 2026-06-01：同步 Shop / Wardrobe try-on 規格，要求衣物、鞋子與配件直接套在上方既有 Princess Lumi 主舞台，不再使用獨立小試穿畫面，且點選商品後才進入暫時試穿。
- 2026-06-01：將「模組化主軸」提升到 README 最前段，記錄目前 ES Modules 結構、下一階段拆分方向，並要求後續功能開發不得背離模組化原則。
- 2026-06-01：新增 Mobile Map Viewport Architecture v3，鎖定 `display/offset` 為 Castle / Kingdom / future areas 的唯一地圖 viewport contract，並逐字納入本輪 SKILL 測試要求。
- 2026-05-31：依使用者要求重整為 `I. 緣起目的`、`II. 參考準備`、`III. 內容程序`、`IV. 備註紀錄`。
- 2026-05-31：將本輪新規劃遊戲的 surface inventory 內容吸收為 README 的正式設計基準。
- 2026-05-31：補入 Castle / Kingdom area registry、`Area Map -> Scene -> Action Choices -> Detail Panel`、HUD 三格、齒輪系統 overlay、Castle 圖一致性與 visual surface sweep 驗收規則。
- 2026-05-31：補記 Issue #10 / #11 地圖 marker 互動決議與 targeted mobile QA 證據位置。
- 2026-05-31：新增 Mobile Map Interaction v2，鎖定 Issue #13-#17 的地圖縮放、拖曳、少文字、地區按鈕與小公主圖示驗收規格。
- 2026-05-31：更新 Mobile Map Interaction v2 完成狀態，補記新 Castle / Kingdom map art、鍵盤移動、marker focus、港口 / 魚店 / 燈塔 marker 修正與 QA log 位置。
