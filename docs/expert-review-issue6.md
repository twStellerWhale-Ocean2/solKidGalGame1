# 專家評價與完成判斷 — issue #6 遊玩時間限制與護眼休息（gateVersion 1.0）

對應 design.md `spec#9`、`solStory#11`／`sysStory#7`。本檔依 [GATE.md] §2 矩陣與 §6 專家評價產出；機器判定（§1）與測試證據見 `docs/test-summary.html`。

## 完成判斷Gate

### story/case/產品能力/責任邊界矩陣

| 來源 | story/case | 系統類型 | 產品能力 | 設計責任鏈 | 實際責任鏈 | 實作入口 | 測試檔案 | 狀態 | 證據 | 缺口 |
|---|---|---|---|---|---|---|---|---|---|---|
| spec#9 | solCase#11.1／sysCase#7.1 | 本機 WUI | 遊玩時間預算（energy）依真實時間遞減 | modState 計時持久化 | `play-clock.js#playStatus/tick`＋`main.js#tickPlayClock`（每秒）＋HUD `energyValue/energyMeterFill` | `system/play-clock.js`、`main.js` | `selftests.js#runPlayTimerSelfTest`、e2e UI | 已測通過 | mid energy ~50%、耗盡 0%；HUD「PLAY TIME」即時更新 | 無 |
| spec#9 | solCase#11.2／sysCase#7.2 | 本機 WUI | 時間到自動結算本回合成果（金錢/答題數/正確度） | modShell 呈現結算 | `play-clock.js#settlementSummary`＋`main.js#showPlayBreak/renderPlayBreakStats`；答題計數 `main.js#answerLesson→recordAnswer` | `system/play-clock.js`、`main.js`、`index.html#playBreak` | playtimer selftest、e2e UI | 已測通過 | settlement coinsGained/answered=5/correct=4/accuracy=80；e2e overlay 顯示四列 | 無 |
| spec#9 | solCase#11.3／sysCase#7.3 | 本機 WUI | 強制休息鎖定、屆滿才可續玩 | modShell 鎖定入口 | `play-clock.js#enterRest/resumeFromRest`＋`main.js#showPlayBreak/resumePlayFromBreak` | 同上 | playtimer selftest、e2e UI | 已測通過 | 休息中 `resume()`=false（禁用續玩）、屆滿=true；e2e 續玩鈕禁用→啟用→續玩、energy 回 100% | 無 |
| spec#9 | solCase#11.4／sysCase#7.4 | 本機 WUI | 設定每次遊玩／休息時長（各帳號各自） | modState 保存設定 | `main.js#applyPlayLimitSettings/renderSettings`＋`index.html#playLimitForm` | `main.js`、`index.html` | e2e UI | 已測通過 | 設定 15／5 套用至 state 並持久化至帳號進度 | 無 |
| spec#5/#8（連動） | solStory#8／sysStory#4 | 本機 WUI | energy 重定位＋計時/休息狀態各帳號各自持久化與正規化 | modState normalize | `game-state.js#normalizeState→normalizePlayLimit`；`applyEffects` 移除 energy 獎勵語意 | `state/game-state.js`、`state/default-state.js` | save-load selftest、playtimer selftest | 已測通過 | save-load roundtrip 含 playLimit 一致；各帳號 cycle 獨立 | 無 |

**企業常規完整性審查（GATE §5，本機 WUI／兒童 profile）**

* HMI/WUI 常規：互動回饋（HUD 能量條＋結算畫面）✅、空狀態（0 答題→正確度 0%，安全）✅、鎖定狀態（休息閘禁用續玩並提示倒數）✅、錯誤/損壞值（`normalizePlayLimit` 守備）✅、視覺規範（沿用既有 overlay 結構與 CSS 變數）✅、無障礙（overlay 顯示聚焦卡片、休息屆滿聚焦續玩鈕）✅。
* 計時/結算/休息皆為本機行為，無外部服務、IdP 或 API 責任鏈；GATE §3「責任邊界」無跨系統替身問題（無 mock 混入正式路徑）。
* 資料一致性：每次狀態轉換（開始/結算/續玩）即 `persist()` 寫使用中帳號鍵；切換帳號各自獨立。

### 重大缺口與是否可宣稱完成

* 機器判定（§1）：tsc `--noEmit` exit 0、repoLint 0、docLint 0、npm audit N/A（無 package.json、0 依賴）。單元覆蓋率本 repo 未插樁，沿用瀏覽器 selftest 為可重跑測試機制（見發現#13）。
* 矩陣：5/5 核心項目 `已測通過`，0 未實作、0 責任邊界不符。
* 結論：**可宣稱完成**（5/5 已測通過，0 未實作，0 責任邊界不符）。

## 專家評價（≥10 發現與處置）

1. **[已修復] 結算/休息 overlay z-index 過低**：原 `z-index:70` 低於 ADV 場景 modal（adv.css `z-index:80`）與行動版 90/100；時間到若正處於場景中，護眼鎖定畫面會被蓋住、形同失效。已提高至 `200`，確保鎖定畫面蓋過一切。e2e 驗證 overlay 正常顯示於最上層。
2. **[已修復] overlay 無焦點管理（無障礙）**：原顯示時不移動焦點，鍵盤使用者易迷失。已於顯示時聚焦 `.play-break-card`，並在休息屆滿、續玩鈕由禁用轉可用時聚焦續玩鈕（鍵盤可直接續玩）。e2e：`focusInCard=true`、屆滿 `focusedResume=true`。
3. **[依 USR 裁定] 各帳號各自計時可被切換帳號繞過**：以裝置層級計時最符護眼，但 USR 於 2plan 審查門 1 明確裁定「各帳號各自」。照辦；此護眼取捨已載明於 Issue 與 README，非疏漏。
4. **[依 USR 裁定] 未強化防作弊**：改系統時鐘、重整、關分頁可影響計時；USR 裁定兒童遊戲可簡化、防作弊非重點。採 wall-clock 時戳、簡化處理。
5. **[可接受/設計簡化] wall-clock 計時於關閉期間照算**：久未遊玩回來可能立即結算並進入休息。對護眼屬防禦性正向結果；列為簡化取捨，README 已說明「依真實時間」。
6. **[增強/未做] 無「即將時間到」預警**：時間到為直接歸零。建議未來加「剩 1 分鐘」柔性提示，對兒童更友善；不阻擋本議題完成。
7. **[優雅處理] 本回合金錢採差額且 clamp ≥0**：若本回合淨花費大於獲得，顯示 `+0` 而非負值；語意為「本回合獲得」，可接受。
8. **[優雅處理] 0 答題時正確度為 0%**：邊界安全（未除以零）；UX 上可改顯「—」，列為次要增強。
9. **[優雅處理] normalizePlayLimit 守備損壞/缺漏**：分鐘 clamp 至 `[1,120]`、時戳非負、cycle 數值化；符合 solCase#8.1，save-load selftest 通過。
10. **[正向] Reset Progress 重置 playLimit**：`resetProgress→freshState` 使 playLimit 回 `10/10` 且 idle，不殘留舊計時與休息鎖。已驗。
11. **[已知測試面/低風險] 測試時鐘 hook 隨建置出貨**：`window.LuminaraTest.playClock`（注入時鐘）於正式建置可由主控台呼叫繞過休息；與既有 `LuminaraTest`（含 `accounts.remove` 等）一致，本機兒童遊戲可接受，列為已知測試面。
12. **[增強/未做] HUD 能量條低量不變色**：純美觀；可於低量轉紅提醒。不影響功能。
13. **[測試機制] 單元覆蓋率未插樁**：本 repo 無單元測試框架/覆蓋率工具，沿用瀏覽器 selftest（新增 `playtimer` ＋既有 save-load/data-audit/monkey/accounts）作為可重跑證據，與既有專案一致，非本議題引入之缺口。
14. **[次要] energy 仍存在於存檔 JSON payload**：作為遊玩時間預算顯示值持久化；Save MD 之 human-readable 區未列 energy，無誤導。
