# I. 緣起目的

本輪作業模式：修正目前功能。目標是把 Android 手機預設畫面下方常駐的 `Diary / Settings / Save MD / Load MD` 系統操作移出主遊戲畫面，改為 Princess Lumi 狀態區右上齒輪開啟的遊戲內書本選單。

# II. 參考準備

- Source of truth：`README.md` 指定手機直向優先，且 `Diary / Settings / Save Load` 應是遊戲內日記本或道具，不是管理頁面。
- 使用技能：`m-skill-2tech-children-adv-game-dev`、`skill-9general-browser-tooling-guard`、`browser:browser`、`skill-9general-pwsh-command-quoting`、GitHub `yeet`。
- 瀏覽器政策：已使用 Browser plugin 的 `iab`，並設定 390x844 mobile viewport 進行主要驗證。

# III. 內容程序

## 本輪修改 surface

- Room：新增 Lumi 狀態區齒輪；移除預設畫面的系統 strip。
- System Menu：新增 `Lumi Diary` 書本 overlay，含 `Diary`、`Settings`、`Save / Load` 三頁。
- Diary：保留日記、collection summary、Clear Diary。
- Settings：保留 Word Level、Voice、Reset、Help Teacher local key 設定。
- Save / Load：保留 `Save MD`、`Load MD` 與 Markdown file input；Save schema 不變。

## 本輪 smoke surface

- Mobile Travel Map：確認 Room -> Map 仍可進入；既有 mobile map 使用 Room hotspot 返回。
- ADV：Garden quest 可答對並寫入 diary / reward。
- Shop：Dress Boutique shop overlay 可開啟。
- Desktop：只做不破版 smoke check。

## 未納入本輪全量重做

- 不重做地圖、商店商品、美術資產、任務資料、存檔 schema。
- 不新增 `image_gen` 圖；本輪使用既有 diary/settings book asset。
- 未全量逐地點截圖 Lighthouse / Harbor / Farm 等全部場景；本輪以受影響系統選單與代表 ADV / Shop smoke 為主。

# IV. 備註紀錄

- QA 圖片資料夾：`.codex/log/20260531-140659-qa/`
- 本輪使用的 localhost：`http://127.0.0.1:4175/`
- `4174` 已被另一個 `node src/server.mjs` process 佔用且對本 repo 回 404，因此改用 `4175`。
