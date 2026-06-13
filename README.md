# solKidGalGame — Princess English Adventure

> 本 README 是本專案的**產品手冊（productReadme）**，從玩家與家長／維護者「實際怎麼用」的角度撰寫。
> 內部設計與架構的單一事實來源改為 [docs/design.md](docs/design.md)（formatVersion 2.0）；本檔為 2plan 初稿，待 dev／opr 依實作校準。

陪 Princess Lumi 到不同地點和角色用一句短英文對話，答對拿 coins、日記與學到的單字，再把 coins 換成看得見的髮型、衣服、鞋帽、配件與整套穿搭。**學英文與換裝獎勵是同一個正向循環。**

## 這是什麼

- 一個給**年幼英文學習者**玩的靜態網頁、日式 ADV 風格英文練習遊戲。
- 主要在**手機瀏覽器直向**遊玩，桌機也可用。
- 以 **GitHub Pages 純靜態**部署，無需後端、無 build step。

不做的事：不做 landing page、不做大型課程平台、不做密集 phonics 課程、不做後台商品管理、不做網路登入／密碼／雲端同步（多人帳號為同一瀏覽器內的本機帳號，選角僅切換本機外觀）。

## 怎麼玩

核心每一輪只需理解一件事：**選地方 → 聽一句 → 選一句英文 → 拿獎勵 → 幫公主變可愛**。

```text
選擇帳號（每次進入先選，可新增／刪除帳號）
  → 選角＋命名（新帳號首次強制）
  → Princess Room → Castle Map → World Map → Area Map
  → 進入地點 Scene → 選動作 → 答題 / 購物 / 換裝
  → 回饋（coins / 日記 / 學到的字 / 換裝）→ 再來一輪
```

- **選擇帳號**：每次進入遊戲會先到帳號選擇畫面，選擇要用哪個帳號遊玩；可新增帳號（建立全新進度）或刪除帳號。不同帳號的 coins、日記、學到的字、擁有與穿搭、所在位置都各自獨立、互不混用，多人共用同一裝置時不會洗掉彼此的進度。帳號只存在這台裝置的這個瀏覽器，不需要也不會做網路登入或雲端同步。
- **選角與命名**：首次進入會先選公主外觀並輸入名字；之後可再叫出此畫面重選外觀或改名（不影響既有進度）。
- **地圖導覽**：World Map 選地區（Castle / Urban / Rural / Wild），各地區地圖再選地點；地區間移動一律先回 World Map 再進入。
- **答英文題**：在有 lesson 的地點聽情境句、從選項選出正確英文，答對得 coins 與學習紀錄；遇困難可按 **Help** 取得提示。題目與每個選項都可分別**撥放英文**或**撥放中文**，但用中文會影響獎勵——見下節〈中文協助與獎勵階梯〉。
- **商店與換裝**：用 coins 在各地商店購買外觀，於衣櫃試穿與穿戴；不需要的可退款換回 coins。
- **操作**：支援觸控、滑鼠、方向鍵 / W·S、Enter、Space、數字鍵；場景內第一層用 `Leave` 回地圖，進入細項面板後用 `Back` 回上一層。

## 快速開始

線上：開啟你部署的 GitHub Pages 網址即可遊玩。

本機（純靜態）：

```powershell
python -m http.server 4173
```

本機（含英文 Help 提示，選配）：

```powershell
$env:OPENAI_API_KEY="sk-..."
$env:OPENAI_ORG_ID="org_..."   # 選配
node server.mjs
```

本機網址依所用指令：`python -m http.server 4173` → `http://127.0.0.1:4173/`；`node server.mjs` →（預設）`http://127.0.0.1:4174/`。
Help 提示需 `node server.mjs` 本機 OpenAI proxy；純靜態方式或未設定金鑰時遊戲仍可玩，Help 會顯示降級訊息。

## 存檔與還原

- 進度（coins、穿搭、日記、位置、所選角色與名字）會以**目前帳號**為單位自動存入瀏覽器本機儲存，重整後還原；切換帳號會載入該帳號自己的進度。
- 可於 Save / Load 介面**匯出 Markdown 存檔**並再次**匯入還原**（以目前帳號為範圍）；缺漏或舊格式存檔會自動正規化回安全預設。

## 遊玩時間與休息（護眼）

> 本項為 2plan 初稿，行為細節待 dev／opr 校準。

為保護兒童視力，連續遊玩會逐步用掉「遊玩時間」（畫面上的 energy 即此預算）：

- 開始遊玩後，遊玩時間會依真實時間逐步減少；用完時會自動結算這一回合的成果（這回合獲得的金錢、答題數與答題正確度）。
- 結算後進入**強制休息**，休息時間結束前無法繼續遊玩，時間到才解鎖。
- 每次**遊玩時長**與**休息時長**預設各 10 分鐘，可在設定調整。
- 遊玩時間與休息以**各帳號各自計算**，切換帳號各自獨立計時。

## 中文協助與獎勵階梯

> 本項為 2plan 初稿，行為細節待 dev／opr 校準。

看不懂英文時可以先用中文理解題意再作答；但為了鼓勵先試英文，用不用中文會影響獎勵：

- 答題畫面的**題目**與**每個選項**都有兩個語音鈕：**撥放英文**與**撥放中文**。
- 獎勵階梯（每題各自計算）：
  - 沒按中文、**第一次**就答對 → **全額** coins。
  - 沒按中文、**第二次**才答對 → **半額** coins。
  - **按過中文**，或**第三次（含）以後**才答對 → **沒有** coins。
- 撥放英文不影響獎勵，只有按中文才算使用協助；換到下一題時重新計算。

## 部署（GitHub Pages）

- 使用 `Deploy from a branch`，靜態網站 root 選 **repository root**，入口為 `index.html`。
- repository root 必須保留 `.nojekyll`（否則 `_shared` 等底線開頭資料夾會被 Jekyll 略過，造成 ES module 404）。
- `server.mjs` 只用於本機 Help proxy，不是 GitHub Pages 必需項。

## 擴充內容（給維護者）

area、角色與衣物都是 `content-package/` 下的**模組化內容包**，新增／調整內容時優先只動單一包與少量 registry 設定，不必改核心引擎。資料夾慣例、manifest 章節、角色 `512×768` rig 與美術尺度等細部規則，見：

- 內部設計 SSOT：[docs/design.md](docs/design.md)
- 角色尺度與美術契約：[contract-local/hmiIntf自訂角色尺度與美術規範.md](contract-local/hmiIntf自訂角色尺度與美術規範.md)
- 技術選型與契約：[contract-common/](contract-common/)、[contract-local/contract-index.md](contract-local/contract-index.md)
- agent 操作規則：[AGENTS.md](AGENTS.md)

## 成功判定

- 兒童能在短回合、低挫折下完成英文練習並獲得即時回饋。
- 看不懂英文時能用中文理解題意，且獎勵階梯鼓勵先試英文（越早不靠中文答對獎勵越高、用過中文則該題無獎勵）。
- 「答題 → 獲獎勵 → 換裝」可在單次遊玩內成環，外觀有看得見的改變。
- 進度可保存並還原；首次選角與命名順暢，遊戲內稱呼隨名字更新（品牌名 Luminara 不變）。
- 多人共用同一裝置時，可用各自帳號保留獨立進度；新增、選擇與刪除帳號順暢，刪除使用中或最後一個帳號後回到帳號選擇而不殘留錯誤進度。
- 連續遊玩達設定時長會結算本回合成果並進入休息，休息結束前無法續玩；遊玩與休息時長可於設定調整、各帳號各自計算。
- 維護者能以純靜態方式部署，並可模組化擴充內容而不影響既有功能。

## 參考案例

| 參考 | 借用方向 |
|---|---|
| [Khan Academy Kids](https://en.khanacademy.org/kids) | 角色陪伴、短任務、學習足跡 |
| [Duolingo ABC](https://abc.duolingo.com/) | 短回合、低挫折、即時回饋 |
| [Lingokids](https://help.lingokids.com/hc/en-us/articles/23532720590610-Playlearning-Sections) | Playlearning 與兒童可自行操作的導覽 |
| [Toca Boca World](https://www.tocaboca.com/app/world/) | Dress-up、自我表達、角色扮演 |

## 變更紀錄

- 2026-06-14（issue #73）：設計新增中文協助與獎勵階梯。答題時題目與每個選項都可撥放英文或中文；未用中文且越早答對獎勵越高（第一次全額、第二次半額），用過中文或第三次以後答對則該題無獎勵，鼓勵以英文為主、中文為輔。本項為 2plan 初稿，待 dev／opr 校準。
- 2026-06-13（issue #88）：導入 2tech 設計方法論。新增內部設計 SSOT [docs/design.md](docs/design.md) 與 [scripts/docLint.ps1](scripts/docLint.ps1)；README 改寫為產品手冊；角色尺度與美術規則拆入 contract-local 契約。先前的詳細開發／架構／QA 內容見本次變更前的 README（git 歷史）與待補契約清單。
- 2026-06-13（issue #63）：設計新增本機多帳號（Account Select）。進入遊戲先選帳號，可新增／刪除帳號，各帳號 coins、日記、穿搭與進度互不混用；明確不做網路登入／密碼／雲端同步。本項為 2plan 初稿，待 dev／opr 校準。
- 2026-06-13（issue #6）：設計新增遊玩時間限制與護眼休息。連續遊玩達設定時長（預設 10 分鐘、可調）會結算本回合成果並進入強制休息（預設 10 分鐘），休息結束前不可續玩；遊玩時間即各帳號的 energy 預算、各帳號各自計算。本項為 2plan 初稿，待 dev／opr 校準。
