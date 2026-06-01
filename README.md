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
- `Action Choices` 是兒童可理解的短選項，例如 `Shop`、`Talk`、`Dresses`、`Accessories`、`Shoes`、`Go Outside`。
- `Detail Panel` 只在玩家選擇具體動作後出現，例如購物、換衣服、換配件、換鞋子、換擺設、Settings、Save / Load。
- `Feedback / Return` 必須顯示結果並保留清楚返回路徑，不讓玩家卡在大型 panel。

地區必須透過 area registry 或等效資料結構定義，不把 Castle / Kingdom 寫死成特殊分支。每個 area 至少包含 `id`、`label`、`map image`、`locations`、`default marker`、`bottom navigation label` 與可用 actions。目前啟用地區是 Castle / Kingdom，資料結構需預留 Forest / Ocean 等未來地區。

### Castle Area

- App 預設畫面應是 Castle Map / Castle Grounds，而不是 Wardrobe、Save / Load 或其他系統工具面板。
- Princess Room 是 Castle Map 上的一個 marker，不是啟動畫面的特殊例外。
- Castle Map 底部 area navigation 與 Kingdom Map 使用同一套地區切換規則，目前顯示 `Castle`、`Kingdom`，未來可由 registry 加入 Forest / Ocean。
- Castle Map 必須預留 `Princess Room`、`King Room`、`Queen Room` 等房間 marker 的擴充位置。
- Castle 近景圖必須參考現有 kingdom map 中「白色城牆、粉紅屋頂、中央高塔」的城堡語彙；不得使用幾何圖或與原大地圖不一致的臨時圖當正式素材。

### Room

- Princess Lumi 以全身紙娃娃呈現。
- 穿搭、鞋子、帽飾、配件、房間物件必須有可見差異。
- 房間進入後先顯示功能 action choices，例如 `Dresses`、`Accessories`、`Shoes`、`Room Treasures`、`Go Outside`。
- Wardrobe / Decoration detail panel 只能在玩家選擇對應功能後出現。
- 出門應是房間 scene 的 action choice 或門口 hotspot，不是網站 hero CTA。
- Wardrobe 應像玩具衣櫃或抽屜，支援點選預覽與裝備狀態，但不得在預設畫面直接展開佔據主視覺。

### Mobile Travel Map

- 手機直向主流程使用可拖拉的小地圖，不使用卡片清單作為主要地點選擇 UI。
- 地圖可比手機 viewport 稍大，玩家可用手指拖拉地圖，看見不同地點。
- 城堡與王國地圖必須支援單指拖曳與雙指縮放；縮放只作用在地圖、地標、map actors 與小公主圖示，不影響 HUD 與下方地區選單。
- 手機直向地圖允許超出 viewport；超出部分應透過 pan / zoom 可到達，不可因裁切導致王國地圖或城堡地圖的重要區域無法查看。
- 地圖縮放範圍預設為 `1.0` 至 `2.2`，pan 必須限制在可視範圍內，避免拖到只剩空白。
- 每個地點以大尺寸童話地標或標記呈現，點選後顯示遊戲式 preview：NPC 頭像、地點名、今日任務或商店目的、`Visit` / `Shop` / `Talk`。
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
- 每回合只練一個短英文句子。
- 選項直排、大尺寸、適合觸控。
- 支援方向鍵 / W/S、數字鍵、Enter / Space。
- Help Teacher `?` 提供短提示；沒有 API key 時使用內建提示。

### Shop

- Shop 是獎勵場景，不是 inventory table。
- 不同店家必須有不同背景、不同 NPC、不同商品語氣與不同短句，但共用同一套手機直向 scene layout。
- 地點 / 店內 scene entry 只顯示 `Shop`、`Talk`、`Leave` 等 action choices；玩家選 `Shop` 後才開啟商品 detail panel。
- 商品要有大預覽與立即 try-on。
- 單分類商店不讓 tab 佔主視覺。
- 狀態清楚顯示：`Owned`、`Equipped`、price、`Need more coins`、`Buy`、`Leave`。
- 購買後應有輕量慶祝、店員回應與 diary 記錄。

### Diary / Settings / Save Load

- Diary 是公主日記本，顯示幫了誰、學到什麼、買了什麼、拿到什麼 badge / sticker。
- Settings 收 word level、voice、Help Teacher，不破壞遊戲沉浸感。
- Diary、Settings、Save、Load 必須收進齒輪或 game menu overlay，不佔用預設主畫面。
- Save MD 匯出可讀 diary 與 `LUMINARA_SAVE_JSON` data block。
- Load MD 還原 coins、energy、stats、difficulty、outfit、owned items、current quest、diary、completed lessons、learned words、met NPCs、badges。

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

- `assets/bedroom.png`
- `assets/castle-map2.png`
- `assets/kingdom-map2.png`
- `assets/scenes/*.png`
- `assets/characters/npc-*.png`
- `assets/characters/princess-*.png`
- `assets/characters/princess-outfits-sheet.png`
- `assets/map-layers/*.png`

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

常用 QA URLs：

- `http://127.0.0.1:4174/#home`
- `http://127.0.0.1:4174/#map`
- `http://127.0.0.1:4174/?selftest=visual-qa&surface=shop-scene&place=boutique#map`
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
- Princess Room 進入後先顯示 `Dresses`、`Accessories`、`Shoes`、`Room Treasures`、`Go Outside` 等 action choices；選擇後才開 Wardrobe / Decoration detail panel。
- Shop 進入後先顯示 `Shop`、`Talk`、`Leave` 等 action choices；選 `Shop` 後才顯示商品 detail panel。
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
  - Bottom area navigation stays outside the zoomed map and marks the current area with a princess avatar.
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

- 2026-06-01：將「模組化主軸」提升到 README 最前段，記錄目前 ES Modules 結構、下一階段拆分方向，並要求後續功能開發不得背離模組化原則。
- 2026-05-31：依使用者要求重整為 `I. 緣起目的`、`II. 參考準備`、`III. 內容程序`、`IV. 備註紀錄`。
- 2026-05-31：將本輪新規劃遊戲的 surface inventory 內容吸收為 README 的正式設計基準。
- 2026-05-31：補入 Castle / Kingdom area registry、`Area Map -> Scene -> Action Choices -> Detail Panel`、HUD 三格、齒輪系統 overlay、Castle 圖一致性與 visual surface sweep 驗收規則。
- 2026-05-31：補記 Issue #10 / #11 地圖 marker 互動決議與 targeted mobile QA 證據位置。
- 2026-05-31：新增 Mobile Map Interaction v2，鎖定 Issue #13-#17 的地圖縮放、拖曳、少文字、地區按鈕與小公主圖示驗收規格。
- 2026-05-31：更新 Mobile Map Interaction v2 完成狀態，補記新 Castle / Kingdom map art、鍵盤移動、marker focus、港口 / 魚店 / 燈塔 marker 修正與 QA log 位置。
