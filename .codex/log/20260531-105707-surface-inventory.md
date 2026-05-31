# 20260531-105707 Surface Inventory：新規劃遊戲

# I. 緣起目的

本輪作業模式：`1. 新規劃遊戲`。

本輪目標是把 `README.md` 目前定義的產品方向整理成可驗收的兒童向日式 ADV 遊戲規劃基準。此基準聚焦手機直向、短英文對話、低挫折回饋、coins 獎勵與立即換裝，不以桌機寬地圖作為主要完成目標。

本輪不修改 `index.html`、`styles.css`、`script.js` 或任何素材檔；也不宣稱已完成遊戲實作或瀏覽器驗證。

# II. 參考準備

## 來源文件

- `AGENTS.md`：本 repo 操作規則。
- `README.md`：設計內容、遊戲流程、部署方式與驗證方式的 source of truth。

## 目標玩家與設計假設

- 目標玩家：年幼英文學習者。
- 裝置優先順序：手機瀏覽器直向優先，桌機僅作開發與次要使用。
- 低挫折需求：每次只練一段短英文句子，答錯提供溫和提示，答對立即給 coins 與正向回饋。
- 學習目標：透過場所對話練習常用短句，並用 diary / learned words 讓孩子知道自己完成了什麼。
- 遊戲目標：幫 Princess Lumi 去不同地點對話、學英文、賺 coins、買可見的換裝與房間獎勵。

## 本輪主循環

```text
Room
  -> Destination Picker / lightweight Map
  -> ADV conversation
  -> correct answer reward: coins + learned word + diary
  -> Shop / Wardrobe reward preview
  -> Dress-up feedback in Room
  -> repeat
```

本輪核心不是傳統網站頁面清單，而是一條遊戲流程：

1. 玩家在 Princess Lumi 的房間看到目前穿搭與房間狀態。
2. 玩家用主要行動進入手機直向友善的目的地選擇。
3. 玩家選擇 bakery、garden、boutique、shoe shop、accessory shop、farm、harbor 或 lighthouse。
4. 進入該地點的 ADV 場景：背景、NPC、Princess Lumi、底部對話框與大尺寸直排選項。
5. 答錯時顯示短提示並可再試；答對時取得 coins、學到單字、更新 diary。
6. 地點若是商店，coins 立即轉化成可試穿、可購買、可裝備的獎勵。
7. 回房間後，孩子能在 Lumi 或房間內直接看到獎勵改變。

# III. 內容程序

## A. 必測 / 必規劃 Surface

| Surface | 角色 | 本輪狀態 | 必要互動路徑 | 驗收重點 |
|---|---|---|---|---|
| Room | 生活基地與換裝入口 | 必規劃 | 看 Lumi -> 打開 wardrobe -> 出門 | 第一眼像公主房間，不像 landing page；換裝變化明顯 |
| Destination Picker / Map | 快速選地點 | 必規劃 | Room -> 選地點 -> ADV | 手機直向不被寬地圖拖累；地點可愛且易懂 |
| ADV Conversation | 英文練習主流程 | 必規劃 | NPC line -> 選英文句 -> 答錯提示 / 答對獎勵 | 底部對話框、直排選項、低挫折、日式 ADV 感 |
| Shop | coins 轉獎勵 | 必規劃 | 選商品 -> try on -> buy / leave | 商品有想買誘因，非表格或後台清單 |
| Wardrobe | 回房間換裝 | 必規劃 | 已購商品 -> 裝備 -> Lumi 改變 | 像玩紙娃娃 / 玩具衣櫃 |
| Diary | 成就與學習回顧 | 必規劃 | menu -> diary -> 看任務、單字、購買 | 像公主日記本，不像資料列表 |
| Settings | 難度與 Help Teacher | 必規劃 | menu -> settings -> word level / help | 不破壞遊戲沉浸感 |
| Save / Load | 保存遊戲資料 | 必規劃 | Save MD -> Load MD | 不匯出 OpenAI API key；恢復 coins、裝備與 diary |
| Menu Overlay | 系統功能入口 | 必規劃 | 開啟 / 返回遊戲 | 像遊戲內 overlay，不像網站 nav |

## B. 必測 Viewport

後續進入實作或測試時，本輪規劃要求至少驗證：

- 手機直向。
- 桌機 `1024x768`。
- 寬桌機 `1800x800`。

手機直向是產品完成主目標；桌機與寬桌機用於確認畫面沒有破版、過空、比例失衡或 UI 遮擋。

## C. 場景與內容規格

### Room

- Lumi 以全身紙娃娃形式呈現，穿搭、鞋子、帽飾、配件要能明顯變化。
- 房間內有出門 hotspot 或主要行動按鈕，但不能做成網站 hero CTA。
- Wardrobe 應像玩具衣櫃或抽屜，點選即預覽，已裝備狀態清楚。
- 買到房間物件後，房間視覺要有可見變化。

### Destination Picker / Map

- 以手機直向目的地選擇為主，寬地圖只作歷史或次要模式。
- 每個地點需要有可愛圖示、短名稱與可理解目的。
- Map 若保留，應作為輕量 travel screen，不要求玩家在手機上操作寬幅探索。
- 不使用 dashboard card、固定 sidebar、傳統頁籤作為主要地點選擇。

### ADV

- 每個地點一個短場景：背景、NPC、Princess Lumi、底部 dialogue box。
- 每輪只練一個短英文句子。
- 選項直排、大尺寸、可用觸控與鍵盤操作。
- 答錯：短提示、允許再試，不扣過重懲罰。
- 答對：coins、learned words、diary record、NPC 正向回應。

### Shop

- Shop 是獎勵場景，不是 inventory table。
- 商品需有大預覽與立即 try-on。
- `Owned`、`Equipped`、`price`、`Need more coins`、`Buy`、`Leave` 狀態要明確。
- 購買後要有輕量慶祝、coins 變化、店員回應與 diary 記錄。

### Diary / Settings / Save Load

- Diary 做成公主日記本，顯示幫了誰、學到什麼、買了什麼。
- Settings 收 word level、voice、Help Teacher，不佔用主舞台。
- Save MD 匯出可讀 diary 與 `LUMINARA_SAVE_JSON`，不可匯出 API key。

## D. 素材來源規格

目前 `README.md` 記錄已有 hand-drawn style PNG 素材：

- `assets/bedroom.png`
- `assets/kingdom-map.png`
- `assets/scenes/*.png`
- `assets/characters/npc-*.png`
- `assets/characters/princess-*.png`
- `assets/characters/princess-outfits-sheet.png`
- `assets/map-layers/*.png`

本輪規劃採用以下來源分類：

- 既有正式素材：README 已列出的 PNG 美術資產，後續可作為目前版本基準。
- 臨時素材：若發現商品、背景、UI 裝飾仍為色塊、CSS 幾何圖、SVG 拼貼或 placeholder，後續測試須列入 `Must Fix`。
- GPT / GPT-5.5 生圖：若使用者要求嚴格資產來源，必須重新用 GPT 圖像生成檔案寫回 repo；不得把本機程式生成圖或 CSS 幾何圖報告為 GPT 生圖。

## E. Vertical Slice 建議

第一個完整切片建議採用：

```text
Room -> Destination Picker -> Market Square / Bakery ADV -> coins reward -> Dress Boutique or Market reward -> Wardrobe -> Diary -> Save
```

選這條切片的理由：

- Bakery / Market 容易設計短英文句，例如 greeting、buying、thank you。
- coins reward 能直接導向商店與房間變化。
- 可一次驗證 Room、ADV、Shop、Wardrobe、Diary、Save。

切片通過條件：

- 手機直向可從 Room 玩到 reward 並回 Room。
- 答錯不挫折，答對回饋清楚。
- 買到的東西在 Lumi 或房間裡立刻可見。
- 畫面第一眼是遊戲，不像網站表單或管理介面。

## F. 後續工作拆分

### 第一優先

- 重整手機直向主流程：Room -> Destination Picker -> ADV -> reward -> Wardrobe。
- 弱化寬地圖在手機上的主導地位。
- 強化答對後的 coins / 商品 / 換裝回饋。

### 第二優先

- Shop 改成獎勵展示與 try-on 流程。
- Diary 改成更明確的公主日記與學習足跡。
- Settings / Save / Load 收進遊戲 overlay。

### 第三優先

- 全量美術性測試：Room、Destination Picker / Map、8 個 ADV 地點、Shop、Wardrobe、Diary、Settings。
- 若要求嚴格 GPT / GPT-5.5 provenance，重新產製並替換所有正式 PNG 資產。

# IV. 備註紀錄

## 本輪已完成

- 已記錄作業模式：`1. 新規劃遊戲`。
- 已以 `README.md` 為 source of truth 整理主循環。
- 已列出本輪規劃所需 surface、viewport、互動路徑與素材來源規格。
- 已明確定義第一條 vertical slice 建議。

## 本輪未執行

- 未修改遊戲程式碼。
- 未替換素材。
- 未啟動本機 server。
- 未做瀏覽器渲染、截圖、monkey test 或 console 檢查。

## 風險與限制

- `README.md` 目前仍有既有未提交變更，本輪未碰該檔。
- 若後續要宣稱新規劃已實作完成，必須進入實作、瀏覽器 QA、手機直向截圖與至少 monkey / console 驗證。
- 若後續要宣稱美術完成，必須依美術性測試規格逐畫面、跨 viewport、每畫面至少 10 點批評並修完 `Must Fix`。
