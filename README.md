# solKidGalGame — Princess English Adventure

> 本 README 是本專案的**產品手冊（productReadme）**，從玩家與家長／維護者「實際怎麼用」的角度撰寫。
> 內部設計與架構的單一事實來源改為 [docs/design.md](docs/design.md)（formatVersion 2.0）；本檔為 2plan 初稿，待 dev／opr 依實作校準。

陪 Princess Lumi 到不同地點和角色用一句短英文對話，答對拿 coins、日記與學到的單字，再把 coins 換成看得見的髮型、衣服、鞋帽、配件與整套穿搭。**學英文與換裝獎勵是同一個正向循環。**

## 這是什麼

- 一個給**年幼英文學習者**玩的靜態網頁、日式 ADV 風格英文練習遊戲。
- 主要在**手機瀏覽器直向**遊玩，桌機也可用。
- 以 **GitHub Pages 純靜態**部署，無需後端、無 build step。

不做的事：不做 landing page、不做大型課程平台、不做密集 phonics 課程、不做後台商品管理、不做網路登入／雲端帳號（選角僅切換本機外觀）。

## 怎麼玩

核心每一輪只需理解一件事：**選地方 → 聽一句 → 選一句英文 → 拿獎勵 → 幫公主變可愛**。

```text
選角＋命名（首次強制）
  → Princess Room → Castle Map → World Map → Area Map
  → 進入地點 Scene → 選動作 → 答題 / 購物 / 換裝
  → 回饋（coins / 日記 / 學到的字 / 換裝）→ 再來一輪
```

- **選角與命名**：首次進入會先選公主外觀並輸入名字；之後可再叫出此畫面重選外觀或改名（不影響既有進度）。
- **地圖導覽**：World Map 選地區（Castle / Urban / Rural / Wild），各地區地圖再選地點；地區間移動一律先回 World Map 再進入。
- **答英文題**：在有 lesson 的地點聽情境句、從選項選出正確英文，答對得 coins 與學習紀錄；遇困難可按 **Help** 取得提示。
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

預設本機網址：`http://127.0.0.1:4174/`。
Help 提示需上述本機 OpenAI proxy；未設定金鑰時遊戲仍可玩，Help 會顯示降級訊息。

## 存檔與還原

- 進度（coins、穿搭、日記、位置、所選角色與名字）會自動存入瀏覽器本機儲存，重整後還原。
- 可於 Save / Load 介面**匯出 Markdown 存檔**並再次**匯入還原**；缺漏或舊格式存檔會自動正規化回安全預設。

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
- 「答題 → 獲獎勵 → 換裝」可在單次遊玩內成環，外觀有看得見的改變。
- 進度可保存並還原；首次選角與命名順暢，遊戲內稱呼隨名字更新（品牌名 Luminara 不變）。
- 維護者能以純靜態方式部署，並可模組化擴充內容而不影響既有功能。

## 參考案例

| 參考 | 借用方向 |
|---|---|
| [Khan Academy Kids](https://en.khanacademy.org/kids) | 角色陪伴、短任務、學習足跡 |
| [Duolingo ABC](https://abc.duolingo.com/) | 短回合、低挫折、即時回饋 |
| [Lingokids](https://help.lingokids.com/hc/en-us/articles/23532720590610-Playlearning-Sections) | Playlearning 與兒童可自行操作的導覽 |
| [Toca Boca World](https://www.tocaboca.com/app/world/) | Dress-up、自我表達、角色扮演 |

## 變更紀錄

- 2026-06-13（issue #88）：導入 2tech 設計方法論。新增內部設計 SSOT [docs/design.md](docs/design.md) 與 [scripts/docLint.ps1](scripts/docLint.ps1)；README 改寫為產品手冊；角色尺度與美術規則拆入 contract-local 契約。先前的詳細開發／架構／QA 內容見本次變更前的 README（git 歷史）與待補契約清單。
