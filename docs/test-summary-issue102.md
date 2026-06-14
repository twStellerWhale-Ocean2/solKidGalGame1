# test-summary — issue #102 語音朗讀整體放慢為原速 75%

* **議題**：[#102](https://github.com/twStellerWhale-Ocean2/solKidGalGame/issues/102) 語音聲音太快，調整為現在的 75%（含中文協助）。
* **分支／PR**：`feat/issue102-slow-voice` ／ PR #107。
* **日期**：2026-06-14。
* **變更性質**：純音訊參數（發聲端語速倍率），**零畫面／DOM／視覺變更**。
* **報告型態**：依 [GATE.md §5]「無畫面→獨立報告」；不覆寫 #103 的 15 頁視覺基線 `docs/test-summary.html`（仍為當前視覺 SSOT，保留於 git）。

---

## 1. 機器判定（GATE §1）

| 判定 | 指令 | 結果 |
|---|---|---|
| 型別檢查 | `npx -p typescript tsc --noEmit --project jsconfig.json` | **exit 0** |
| 結構合規 | `pwsh scripts/repoLint.ps1 -Path .` | **PASS（0 違規）** |
| 設計合規 | `pwsh scripts/docLint.ps1 -Path docs/design.md -Level sol` | **PASS（0 違規）** |
| selftest 角色配音 | `?selftest=voice`（intTest#24–27） | **passed:true，errors:[]**，NPC 覆蓋 41/43（兩告示牌刻意降級） |
| selftest 資料稽核 | `?selftest=data-audit` | **passed:true**，0 error／0 warning |
| selftest 中文協助獎勵 | `?selftest=help-reward` | **passed:true**，0 error |
| Console | 三項 selftest 執行期間 | **0 error** |
| 依賴安全 | （無 `package.json`／無 runtime 依賴；純靜態） | **N/A** |

## 2. 產品能力矩陣（GATE §2）

| 來源 | story/case | 系統類型 | 產品能力 | 設計責任鏈 | 實際責任鏈 | 實作入口 | 測試檔案 | 狀態 | 證據 | 缺口 |
|---|---|---|---|---|---|---|---|---|---|---|
| design.md ＜II.B＞ sysCase#9.1 ／＜III.D＞ intTest#27 | sysCase#9.1（全域語速倍率） | 純前端靜態 web（瀏覽器 TTS） | 所有發聲（角色配音／公主朗讀作答／中文協助）以原速 75% 放慢，且角色相對快慢維持 | modScene 發聲端套用 `paramSpeechRateScale` | `main.js speak()` → `effectiveSpeechRate(profile.rate)=round2(rate×0.75)` | `main.js` `effectiveSpeechRate`／`SPEECH_RATE_SCALE=0.75` | `selftests.js` `runCharacterVoiceSelfTest`（intTest#27 純函數＋端對端 spy） | **已測通過** | `?selftest=voice` passed；端對端 utterance.rate＝eff(rate)；下方縮放實證 | 無（使用者自訂語速屬後續辦理） |

**結論：可宣稱完成**（1/1 已測通過，0 未實作，0 責任邊界不符）。

## 3. 業界水準審查（GATE §5）

### 鏡頭 A／B：能力盤點＋專家缺口（音訊維度）

| # | 檢視項（AI/外部服務—瀏覽器 TTS 之最低能力與專家缺口） | 判定 | 分級 |
|---|---|---|---|
| 1 | Voice On/Off 開關仍有效：關閉時不發聲 | 滿足（`speak()` 開頭 early-return；intTest#25 涵蓋） | 可以接受 |
| 2 | 角色配音整體放慢為 75% | 滿足（端對端 spy 驗 utterance.rate） | 可以接受 |
| 3 | 中文協助（`zh-TW`）也放慢（議題要求「全部」） | 滿足（走同一 `speak()`，預設 profile rate 0.86→0.65） | 可以接受 |
| 4 | 公主朗讀作答放慢 | 滿足（intTest#27 端對端：princess utterance.rate＝eff(profile.rate)） | 可以接受 |
| 5 | 各角色相對快慢差異維持（差異化配音不退化） | 滿足（intTest#27 順序不變；Lumi 0.75＞Wiz 0.47） | 可以接受 |
| 6 | rate 缺漏時降級仍套用倍率、不丟錯 | 滿足（`effectiveSpeechRate` 非數值→基準 0.86 再縮放） | 可以接受 |
| 7 | 合成層不動，避免撞 `RATE_RANGE` 下限壓平相對差異 | 滿足（於發聲端套用，`composeVoiceProfile` 未改） | 可以接受 |
| 8 | NPC 開場→公主朗讀 `then` 串接不因倍率中斷 | 滿足（voice selftest 整合段通過） | 可以接受 |
| 9 | 倍率定值集中、無散落魔術數字 | 滿足（單一 `SPEECH_RATE_SCALE` + design `paramSpeechRateScale`） | 可以接受 |
| 10 | 跨裝置語音引擎一致性 | 滿足（rate 為相對倍率，對所有引擎一致縮放） | 可以接受 |
| 11 | 使用者可自訂語速（無障礙/家長微調） | 未提供（倍率已集中，易擴充為設定項） | 後續辦理 |
| 12 | 0.75 對兒童是否最適（可能仍偏快/偏慢） | 主觀，需實際家長/兒童回饋；倍率集中便於調整 | 後續辦理 |

### 鏡頭 C：逐頁 UI/UX＋美術一致性

* **不適用本次變更**：#102 不涉任何畫面、DOM 或視覺輸出（純發聲端語速倍率）。逐頁視覺/美術一致性與 #103「專家會審」之 15 頁基線 `docs/test-summary.html` 完全一致、無新增視覺面，故本報告不重跑 15 頁視覺稽核，改以音訊維度（鏡頭 A/B）為審查重心。視覺基線仍以 #103 報告為準。

### 分級彙總與處置

* **務必要修：0**。本變更為單點、機器判定全通過、無視覺/功能回歸；零務必要修屬合理（已自我檢視非分級過鬆——所有核心音訊能力均經 selftest 端對端佐證）。
* **後續辦理：2**（#11 使用者自訂語速、#12 倍率值微調）——非阻斷，留待家長回饋；`SPEECH_RATE_SCALE` 已集中，未來可低成本擴充為設定項。
* **可以接受：10**。

## 4. 語速縮放實證（動態 import voice 模組實算）

| 對象 | 原 rate | ×0.75 後 |
|---|---|---|
| 中文協助／預設 default | 0.86 | **0.65** |
| 公主 Lumi（female child cheerful） | 1.00 | **0.75** |
| King Rowan（male middle bold） | 0.90 | **0.68** |
| Queen Mira（female middle graceful） | 0.80 | **0.60** |
| Wiz Beryl（male elderly melancholy） | 0.62 | **0.47** |

* 全員放慢為原速 75%；相對快慢順序維持（Lumi 最快、Wiz 最慢，縮放前後一致）。
* `?selftest=voice` 結果：`{"test":"character-voice","passed":true,"coverage":{"total":43,"declared":41,"fellBack":["Rural Sign","Wild Sign"]},"errors":[]}`。
