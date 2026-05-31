# 20260531-110841 Surface Inventory：修正目前功能 + 測試內容

# I. 緣起目的

本輪作業模式：

- `2. 修正目前功能`
- `3. 測試內容`

本輪採「盤點後修訂並回歸測試」方式執行。目標是依 README 新規劃，先處理最高影響的手機直向主流程問題：寬地圖不應是手機玩家的主要操作入口，答對後 coins 應能更快導向 dress-up reward。

# II. 參考準備

## 本輪 source of truth

- `README.md`
- `.codex/log/20260531-105707-surface-inventory.md`

## Browser 工具 gate

已先嘗試 Browser plugin：

- 已載入 `browser:browser` workflow。
- 已執行 Browser bootstrap。
- `agent.browsers.list()` 回傳 `Codex In-app Browser` (`iab`) 與 Chrome extension backend。
- `agent.browsers.get("iab")` 成功，但開啟 `http://127.0.0.1:4174/#home` 與 `http://localhost:4174/#home` 均回報 `net::ERR_BLOCKED_BY_CLIENT`。
- Chrome extension backend 開啟 `http://127.0.0.1:4174/#home` 也回報 `net::ERR_BLOCKED_BY_CLIENT`。

因此本輪依 repo AGENTS 規則與 Browser tooling guard 記錄失敗後，使用 fallback：

- `playwright-core@1.60.0` 安裝於 `C:\Users\User\AppData\Local\Temp\codex-pw-1.60`。
- 瀏覽器 executable：`C:\Program Files\Google\Chrome\Application\chrome.exe`。
- 本專案 server 因 `4174` 被其他 process 佔用且回應 `Not found`，改於 `http://127.0.0.1:4175/` 驗證。

# III. 內容程序

## 本輪受影響 surface

| Surface | 狀態 | 本輪處理 |
|---|---|---|
| Room | 修改 | `Go to Map` 改為 `Choose Place`，文案改成短對話與 dress-up reward |
| Destination Picker / Map | 修改 | 新增 destination panel，手機可直接點地點進任務 / 商店 / 提示 |
| ADV Conversation | 修改 | 答對後新增 reward path CTA，並同步 `data-mode="complete"` |
| Shop | 修改 | 從 reward path 直接進 shop，購買 / 裝備後有更清楚回饋 |
| Wardrobe | 間接受影響 | 購買 / equip 後仍回寫紙娃娃狀態 |
| Diary | 間接受影響 | 任務與購買紀錄維持原流程 |
| Settings | 未修改 | 本輪只做回歸檢查 |
| Save / Load | 未修改 | 本輪只跑 selftest |

## 本輪必要 viewport

- 手機直向：`390x844`
- 桌機：`1024x768`
- 寬桌機：`1800x800`

## 截圖證據

截圖與 QA JSON 放在：

- `.codex/log/20260531-110841-qa/`

主要截圖：

- `mobile-home.png`
- `mobile-places.png`
- `mobile-adv.png`
- `mobile-reward-complete.png`
- `mobile-shop.png`
- `mobile-after-buy.png`
- `desktop-1024-places.png`
- `wide-1800-places.png`
- `fallback-qa-result.json`

# IV. 備註紀錄

本輪完成：

- 手機主流程可由 Room 直接進入 destination picker。
- destination picker 顯示 8 個地點，且標記本輪 target。
- 點 target 可開啟 ADV 任務。
- 答對後可進入 reward path。
- reward path 可進入 shop。
- Shop primary command 可執行 equip / buy 狀態。
- Save/load selftest 通過。
- 300-step monkey selftest 通過。

本輪未宣稱完成：

- 未執行全量美術性測試的逐畫面 10 點批評格式。
- 未重新產製 GPT / GPT-5.5 正式美術資產。
- 未完整重構桌機寬地圖，只是將手機主操作轉為 destination picker。
