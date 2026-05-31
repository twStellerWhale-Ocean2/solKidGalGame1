# 20260531 Restart Surface Inventory

## Stage A: 確認目的

- 本輪作業模式：`3. 測試內容` -> `3. 完整測試修訂`.
- 使用者最新要求：`重啟 skill 從最前面全部重做`.
- 目標：兒童向日式 MAP ADV English practice web game.
- 目標玩家：young English learners；以低挫折、短英文選項、可愛探索與獎勵循環為 gate.
- 不是：dashboard、傳統網站、RPG 戰鬥地圖、純題庫。

## Stage B: 技能基礎

- 技術選型：GitHub Pages-compatible static `index.html` + `styles.css` + `script.js` + `assets/`.
- 必須做實際 Browser/iab 渲染與遊玩驗證。
- Save MD must not export OpenAI API key.
- Current worktree is dirty; per repo AGENTS, preserve existing changes and do not stop on Git state.

## Stage C: 專項準備

### Surface Inventory

| Surface | Required states | Viewports | Status |
| --- | --- | --- | --- |
| Room / Wardrobe | default, item equipped/owned | mobile 390x844, desktop 1024x768, wide 1800x800 | captured / accepted |
| Map | default, near hotspot focus, target state | mobile, desktop, wide | fixed hotspot / mobile composition residual |
| Quest ADV | opening, wrong answer, correct answer / reward | mobile, desktop, wide | captured / functional flow passed |
| Shop ADV | item preview, command list, buy/owned/equipped/leave | mobile, desktop, wide | label fixed / buy flow passed |
| Diary | empty/non-empty after quest/shop | mobile, desktop, wide | captured / records verified |
| Settings | difficulty, voice, Help Teacher form | mobile, desktop, wide | captured / no horizontal overflow |
| Save / Load | Markdown roundtrip, no OpenAI key export | functional/system test | passed |
| Menu / HUD | navigation and overlay behavior | mobile, desktop, wide | captured / accepted with map residual |

### Required Locations

- Castle Garden
- Market Square
- Harbor Dock
- Dress Boutique
- Shoe Shop
- Accessory Shop
- Sunny Farm
- Lighthouse

### Main Loop Under Test

Room / Wardrobe -> Map free exploration -> hotspot focus -> Quest ADV wrong/correct -> coins/diary reward -> Shop ADV preview/buy/equip -> Room wardrobe -> Diary -> Save/Load.

## Stage D: 作業通則

- Do not claim completion until every listed stage is logged.
- Engineering checks cannot replace visual QA.
- Every visual screenshot declared as tested needs 3 concrete critiques and classification.
- Every visual fix needs normalized `問題說明 / 解決規劃 / 前後比較 / 修訂結論`.
- Contact sheets are index only, not proof.

## Browser Gate

- Browser plugin workflow used.
- `agent.browsers.list()` returned `Codex In-app Browser` with type `iab`.
- `agent.browsers.get("iab")` succeeded.
- Current restart URL opened in iab: `http://127.0.0.1:4177/?restart=1#home`.

## Test Artifact Plan

- Screenshot folder: `.codex/log/20260531-restart-qa/`
- Functional log: `.codex/log/20260531-功能性測試.md`, restart section.
- System log: `.codex/log/20260531-系統性測試.md`, restart section.
- Interface log: `.codex/log/20260531-介面性測試.md`, restart section.
- Monkey log: `.codex/log/20260531-猴子性測試.md`, restart section.
- Visual log: `.codex/log/20260531-美術性測試.md`, restart section with per-image checklist.
- Fun log: `.codex/log/20260531-好玩性測試.md`, restart section.

## Known From Previous Attempt, Not Treated As Complete

- Hand-drawn map restore appears fixed but must be reverified in this restart pass.
- Save/load and monkey passed once but must be rerun after any new fix.
- Manual keyboard hotspot activation failed to close and is a restart-pass Must Fix candidate.

## Restart Pass Results

| Surface | Result |
| --- | --- |
| Room / Wardrobe | captured and accepted |
| Map | hand-drawn art accepted; hotspot Enter fixed; mobile portrait composition remains follow-up |
| Quest ADV | captured across 8 places and 3 viewports; functional wrong/correct flow passed |
| Shop ADV | captured across 4 shops and 3 viewports; affordability label fixed; buy flow passed |
| Diary | captured; quest/shop records verified after manual flow |
| Settings | captured; no horizontal overflow |
| Save / Load | passed final selftest |
| Monkey | passed final 300-step selftest |
| Console | no page warn/error after final selftests |

## Restart Pass Files

- `.codex/log/20260531-restart-功能性測試.md`
- `.codex/log/20260531-restart-系統性測試.md`
- `.codex/log/20260531-restart-介面性測試.md`
- `.codex/log/20260531-restart-猴子性測試.md`
- `.codex/log/20260531-restart-美術性測試.md`
- `.codex/log/20260531-restart-好玩性測試.md`

## Restart Pass Completion Guard

Do not claim perfect/full completion. Correct wording:

- Fixed and verified: hand-drawn map restore, hotspot Enter flow, Shop Need-more-coins command.
- Passing: save/load, monkey, console, syntax.
- Remaining: portrait-native mobile map composition is a follow-up; two small CSS attempts failed and were reverted.
