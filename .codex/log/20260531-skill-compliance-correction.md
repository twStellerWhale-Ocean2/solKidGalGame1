# 20260531 Skill Compliance Correction

## Trigger

User stated: `你沒有照SKILL在做`.

## Finding

The criticism is valid. The previous response mixed real work with an overbroad completion signal.

## Deviations

1. The selected mode was `完整測試修訂`, but the pass did not complete all required stages.
2. 美術性測試 did not include a per-image checklist for every required surface / viewport.
3. 美術性測試 did not perform 3-point critique for every screenshot.
4. Visual issue entries were not all written in the normalized required format.
5. Manual keyboard hotspot interaction remained unresolved, so functional/interface completion should not have been implied.
6. The report should have clearly separated:
   - fixed: hand-drawn map restore
   - passed: automated save/load and monkey checks
   - incomplete: full skill-compliant testing pass

## Corrected Status

- `assets/kingdom-map.png`: restored to previous hand-drawn Git version.
- `index.html`: cache-busted map reference added.
- Browser/iab screenshot evidence: present for restored map on mobile, desktop, and wide.
- Full test-revision workflow: incomplete.

## Required Next Pass

1. Build a complete surface inventory table covering Room, Map, Quest ADV, Shop ADV, Wardrobe, Diary, Settings, Save/Load, and menu overlays.
2. Capture baseline screenshots for mobile portrait, `1024x768`, and `1800x800`.
3. For every declared visual screenshot, record 3 concrete critiques and classify them as `Must Fix`, `Should Fix`, or `Accept`.
4. For every issue, write `問題說明`, `解決規劃`, `前後比較`, and `修訂結論`.
5. Fix only selected Must Fix items, then retake matching screenshots and re-critique.
6. Keep final wording aligned with the logs and do not claim completion while any required stage remains incomplete.
