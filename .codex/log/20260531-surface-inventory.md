# 20260531 Surface Inventory

## Goal

Run the complete test-revision pass for the child-friendly Japanese MAP ADV game in this repo.

Current user-selected mode: `3. 測試內容` -> `3. 完整測試修訂`.

## Source Of Truth

- `AGENTS.md`
- `README.md`
- Skill: `m-skill-2tech-children-adv-game-dev`

## Browser Gate

- Browser plugin skill read: yes.
- `agent.browsers.list()` included `Codex In-app Browser` with `iab` type.
- `agent.browsers.get("iab")` succeeded.
- `http://127.0.0.1:4174/` and `http://localhost:4174/` were blocked or served by another process, so this repo was launched on `http://127.0.0.1:4176/`.
- `iab` later timed out on new-tab `about:blank` after the initial monkey run opened native confirm dialogs. Fallback verification used installed Chrome headless with isolated `--user-data-dir` profiles.
- Current pass reconnected to Browser/iab successfully and opened the game at `http://127.0.0.1:4176/#home`.
- `4176` was then found to serve stale cached HTML/assets for this working tree, so a clean current-worktree server was launched at `http://127.0.0.1:4177/`.
- Current post-map-fix screenshots and selftests use `http://127.0.0.1:4177/`.

## Surfaces In Scope

- Room / Wardrobe
- Map exploration
- Quest ADV
- Shop ADV
- Diary
- Settings
- Save / Load selftest
- Monkey selftest

## Viewports

- Mobile portrait: `390x844`
- Desktop: `1024x768`
- Wide desktop: `1800x800`

## Main Loop Under Test

Room -> Map -> ADV quest -> reward coins / diary -> Shop -> buy / try on -> Room wardrobe -> Save / Load.

## Asset Source Notes

- Existing repo PNG assets are treated as existing assets.
- No new GPT image generation was requested in this turn.
- CSS/SVG/programmatic geometry must not be newly introduced as final art.
- `assets/kingdom-map.png` was restored to the previous hand-drawn Git version after the user rejected the flat geometric map.
- `index.html` references `assets/kingdom-map.png?v=handdrawn-20260531` so browser/GitHub Pages caches do not keep showing the rejected map.

## Initial Worktree Note

The worktree was already dirty before this pass. Existing changes are preserved and not reverted.

## Completed In This Pass

- Wardrobe / item preview image rendering.
- Mobile map visual scale and matching coordinate metrics.
- Monkey test native-confirm exclusion.
- Logs and before/after screenshot evidence under `.codex/log/20260531-game-qa/`.
- Restored the map art from the flat geometric map to the previous hand-drawn kingdom map.
- Verified restored hand-drawn map on mobile portrait, desktop `1024x768`, and wide desktop `1800x800` through Browser/iab on `4177`.

## Current Evidence Added

- `.codex/log/20260531-game-qa/mobile-map-handdrawn-4177.png`
- `.codex/log/20260531-game-qa/desktop-map-handdrawn-4177.png`
- `.codex/log/20260531-game-qa/wide-map-handdrawn-4177.png`
- `.codex/log/20260531-game-qa/mobile-map-fulltest.png`
- `.codex/log/20260531-game-qa/desktop-map-fulltest.png`
- `.codex/log/20260531-game-qa/wide-map-fulltest.png`

## Residual / Not Fully Closed

- Natural keyboard movement to a hotspot and pressing Enter was not proven end-to-end in the manual pass. Browser-assisted movement reached near Sunny Farm visually, but Enter did not open ADV in that attempt; save/load and monkey automation still passed. Treat this as an interface/manual-flow residual until a focused movement/interaction fix is done.

## Skill Compliance Correction

User feedback: "你沒有照SKILL在做".

Correction accepted. The current pass must be treated as partial, not complete, because it did not satisfy the full `m-skill-2tech-children-adv-game-dev` testing contract:

- 美術性測試 did not complete a per-image checklist for every required screenshot.
- 美術性測試 did not perform and record 3 concrete critiques for every declared surface / viewport.
- 修訂報告 did not provide normalized `問題說明 / 解決規劃 / 前後比較 / 修訂結論` entries for every affected visual issue.
- 功能性 / 介面性測試 left manual keyboard hotspot activation unresolved.
- The final response should have said the pass was partial with a fixed map Must Fix, not implied the complete test-revision scope was finished.

Revised status:

- Map art Must Fix: fixed and verified on Browser/iab at `4177`.
- Automated save/load and monkey: passing.
- Complete skill-compliant test-revision pass: not complete.
- Remaining required work: rerun the skill workflow from surface inventory through per-surface functional/system/interface/monkey/art/fun logs, with exact screenshots and per-problem conclusions.
