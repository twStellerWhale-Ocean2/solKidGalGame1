# Wardrobe Tuner

Open from the local server:

```text
http://127.0.0.1:4174/tool/wardrobe-tuner.html
```

On Windows, you can start the local server and open the tool with:

```powershell
.\tool\start-wardrobe-tuner.ps1
```

This is still a static site flow. The local server only avoids Chrome `file://`
module loading restrictions during development.

Pick a garment on the **left** (category → item) — that selection drives
everything. The right pane then edits two layers of positioning over a live
paper-doll preview; you tune by dragging boxes directly on the figure.

## Two-layer positioning (issue #176)

Wardrobe art is stored tightly trimmed (no transparent margins), and the engine
scales each piece to fill a target rectangle in `512×768` canvas coordinates
(non-uniform — the box sets width and height independently). You set that
rectangle in two layers, chosen via the **編輯對象** toggle:

- **① Type Box** (blue) — the type's projection region (its `safeBox`). Affects
  every item of that `type`; per-item boxes should stay inside it, and a brand-new
  asset with no per-item box defaults to projecting here. Exports into
  `content-package/wardrobe/_shared/rules.js` (`wardrobeLayerBoundsByType`).
- **② Item Box** (green) — the exact rectangle the *selected* item projects onto,
  seeded from the trimmed art's original content box (identity). Only items you
  actually change are exported (as a diff) into
  `content-package/wardrobe/_shared/asset-target-overrides.js`. The trim baseline
  in `asset-content-box.generated.js` is never hand-edited, so re-running the trim
  script will not clobber your overrides.

The selected layer is drawn solid with hollow drag handles; the other is a faint
reference outline. On the figure: drag the centre **✛** to move, the eight edge/
corner handles to resize (non-uniform). The **Move / Bigger / Smaller** buttons
nudge, **Reset This Box** reverts the active box, **Reset All** reverts everything.

## Apply your tuning

**✓ 套用到檔案 (Apply)** (bottom of the right pane) writes both layers straight
back to disk via the local `server.mjs` dev endpoint (`POST /tool/apply-wardrobe`)
— no copy-paste. It only rewrites the `wardrobeLayerBoundsByType` block in
`rules.js` and the `assetTargetOverrides` block in `asset-target-overrides.js`
(whitelisted files), preserving each file's line endings. Reload the game to see
the result. (Requires the dev server to be `node server.mjs`.)

## Trim tool

`node tool/trim-wardrobe-assets.mjs` (dry-run) measures every layer asset's
content box; `--apply` trims the transparent margins in place and regenerates
`asset-content-box.generated.js`. Requires ImageMagick (`magick`).
