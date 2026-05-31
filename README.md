# solKidGalGame

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
- 技術邊界：維持 `index.html`、`styles.css`、`script.js`、`assets/` 為主，不引入需要後端才能遊玩的核心流程。

## 產品主旨

孩子每次遊玩只需要理解一件事：選地方、聽一句、選一句英文、拿獎勵、幫 Lumi 變得更可愛。

完整主循環：

```text
Room
  -> Mobile Travel Map
  -> ADV conversation
  -> correct answer reward: coins + learned word + diary
  -> Shop / Wardrobe reward preview
  -> Dress-up feedback in Room
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
Room
  -> Mobile Travel Map
  -> Market Square / Bakery ADV
  -> coins reward
  -> Dress Boutique or Market reward preview
  -> Wardrobe / Room visible change
  -> Diary record
  -> Save MD
```

切片完成條件：

- 手機直向可從 Room 玩到獎勵並回 Room。
- ADV 場景有背景、NPC、Princess Lumi、底部 dialogue box 與大尺寸直排選項。
- 答錯時顯示溫和提示並可再試。
- 答對時立即給 coins、learned words、diary record 與正向回應。
- 商品可以 preview / try on，購買後 `Owned`、`Equipped`、coins 變化清楚。
- Lumi 或房間可見獎勵變化。
- Save / Load 不匯出 OpenAI API key。

## 核心場景規格

### Room

- Princess Lumi 以全身紙娃娃呈現。
- 穿搭、鞋子、帽飾、配件、房間物件必須有可見差異。
- 出門應是場景內行動，不是網站 hero CTA。
- Wardrobe 應像玩具衣櫃或抽屜，支援點選預覽與裝備狀態。

### Mobile Travel Map

- 手機直向主流程使用可拖拉的小地圖，不使用卡片清單作為主要地點選擇 UI。
- 地圖可比手機 viewport 稍大，玩家可用手指拖拉地圖，看見不同地點。
- 每個地點以大尺寸童話地標或標記呈現，點選後顯示遊戲式 preview：NPC 頭像、地點名、今日任務或商店目的、`Visit` / `Shop` / `Talk`。
- 可保留一個小型羅盤、推薦地點或回到 Lumi 按鈕，避免年幼玩家拖拉迷路。
- 卡片清單不得作為主畫面；若保留，只能作 accessibility fallback、測試入口或隱藏式輔助。
- 地點包含：Castle Garden、Market Square / Bakery、Harbor Dock、Dress Boutique、Shoe Shop、Accessory Shop、Sunny Farm、Lighthouse。

### ADV Conversation

- 每個地點一個短場景：專屬背景、專屬 NPC、Princess Lumi、底部對話框。
- 每回合只練一個短英文句子。
- 選項直排、大尺寸、適合觸控。
- 支援方向鍵 / W/S、數字鍵、Enter / Space。
- Help Teacher `?` 提供短提示；沒有 API key 時使用內建提示。

### Shop

- Shop 是獎勵場景，不是 inventory table。
- 不同店家必須有不同背景、不同 NPC、不同商品語氣與不同短句，但共用同一套手機直向 scene layout。
- 商品要有大預覽與立即 try-on。
- 單分類商店不讓 tab 佔主視覺。
- 狀態清楚顯示：`Owned`、`Equipped`、price、`Need more coins`、`Buy`、`Leave`。
- 購買後應有輕量慶祝、店員回應與 diary 記錄。

### Diary / Settings / Save Load

- Diary 是公主日記本，顯示幫了誰、學到什麼、買了什麼、拿到什麼 badge / sticker。
- Settings 收 word level、voice、Help Teacher，不破壞遊戲沉浸感。
- Save MD 匯出可讀 diary 與 `LUMINARA_SAVE_JSON` data block。
- Load MD 還原 coins、energy、stats、difficulty、outfit、owned items、current quest、diary、completed lessons、learned words、met NPCs、badges。

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
- `assets/kingdom-map.png`
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

- Room
- Mobile Travel Map
- Diary
- Settings
- Castle Garden
- Market Square / Bakery
- Harbor Dock
- Dress Boutique
- Shoe Shop
- Accessory Shop
- Sunny Farm
- Lighthouse

必要 viewport：

- 手機直向是本案主要且必要的截圖與美術驗收 viewport。
- 桌機與寬桌機只做「不破版」smoke check，不納入美術報告必要截圖，也不得用桌機完成度替代手機完成度。

手機直向是產品完成主標準。除非使用者另行要求，後續美術測試報告只嵌入手機直向截圖。

## 實作順序建議

1. 重整手機直向主流程：Room -> Mobile Travel Map -> ADV -> reward -> Wardrobe。
2. 將目的地選擇改為可拖拉、可點選地標的手機小地圖，移除卡片清單作為主操作。
3. 建立 `sceneConfig` / `shopConfig`，讓不同地點與店家使用不同背景、NPC、商品與台詞，但共用同一手機版型。
4. 強化答對後的 coins / 商品 / 換裝回饋。
5. Shop 改成大預覽、try-on、購買慶祝與店員回應。
6. Diary 改成公主日記與學習足跡。
7. Settings / Save / Load 收進遊戲 overlay。
8. 針對 Room、Mobile Travel Map、8 個 ADV 地點、Shop、Wardrobe、Diary、Settings 做手機直向美術性測試。

# IV. 備註紀錄

## 專案檔案

- `index.html`：DOM game shell、Room、Map、Diary、Settings、ADV modal。
- `styles.css`：主要視覺樣式、map、room、ADV、shops、paper doll。
- `script.js`：game data、state、map coordinates、hotspots、ADV、shops、save/load、monkey test。
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

常用 QA URLs：

- `http://127.0.0.1:4174/#home`
- `http://127.0.0.1:4174/#map`
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
- Removed the earlier blurred mobile map backdrop in favor of a cleaner hand-drawn map presentation.
- Replaced ADV / Shop scene backgrounds with hand-drawn style PNG scene plates for all eight places.
- Added hand-drawn style PNG item art for all shop rewards and switched Shop item previews away from CSS color blocks.
- Added Diary and Settings book-style PNG backgrounds.
- Fixed Quest ADV choice overflow on desktop and mobile.
- Fixed mobile Shop command / item overflow so Buy and Leave remain visible.
- Wrapped the Help Teacher key fields in a form and prevented submit reloads, clearing Chromium password-field console warning during selftests.
- Re-ran full visual QA across 64 desktop/mobile surfaces. Final evidence is under `doc/qa-20260531-final-art-map/`.
- `node --check script.js` has passed multiple times.
- The 300-step monkey test has passed multiple times.

## 剩餘問題

1. 目前手機目的地選擇仍偏向卡片清單 / MIS 選單感，應改為可拖拉、可點選地標的 Mobile Travel Map。
2. 各店與各地點需要專屬背景、NPC、商品語氣與任務短句，但共用統一手機版型。
3. 手機主循環需要更強的答對後立即換裝回饋。
4. Shop reward appeal 需要加強：try-on 變化、購買慶祝、房間 / outfit 可見效果。
5. Diary / Settings / Save / Load 仍需持續避免變成工具頁或後台表單。
6. 若要求嚴格 asset provenance，所有 generated PNG assets 應透過 `image_gen` 或經使用者確認的 GPT 圖像生成流程重新產出並替換。
7. `doc/AUDIT-IMAGE-ISSUES.md` 仍是歷史視覺問題清單，後續修訂需確認是否仍有效。

## 本 README 變更紀錄

- 2026-05-31：依使用者要求重整為 `I. 緣起目的`、`II. 參考準備`、`III. 內容程序`、`IV. 備註紀錄`。
- 2026-05-31：將本輪新規劃遊戲的 surface inventory 內容吸收為 README 的正式設計基準。
