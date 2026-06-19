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
everything; there is no separate layer-type picker. The right pane then exposes
two layers of positioning over a live paper-doll preview.

## Two-layer positioning (issue #176)

Wardrobe art is stored tightly trimmed (no transparent margins), and the engine
scales each piece to *contain* within a target rectangle in `512×768` canvas
coordinates. You set that rectangle in two layers:

- **① Type Box** (`Type Box · 套同類`) — the type's projection region
  (its `safeBox`). Shown as a faint dashed overlay. Editing it affects every item
  of that `type`; per-item boxes must stay inside it, and a brand-new asset with
  no per-item box defaults to projecting here. Exports into
  `content-package/wardrobe/_shared/rules.js` (`wardrobeLayerBoundsByType`).
- **② Item Box** (`Item Box · 僅此件`) — the exact rectangle the *selected* item
  projects onto. Shown as the solid pink overlay. Seeded from the trimmed art's
  original content box (identity), then adjust per item:
  - **Left / Top / Right / Bottom** — canvas coordinates (0–512 / 0–768).
  - **Move Up/Down/Left/Right** — shift the box by 4px without resizing.
  - **Bigger / Smaller** — scale the box ±5% around its centre.
  - **Reset Item** — back to the trimmed/override seed.
  Only items you actually change are exported (as a diff) into
  `content-package/wardrobe/_shared/asset-target-overrides.js`. The trim baseline
  in `asset-content-box.generated.js` is never hand-edited, so re-running the
  trim script will not clobber your overrides.

## Apply your tuning

- **✓ 套用到檔案 (Apply)** writes both blocks straight back to disk via the local
  `server.mjs` dev endpoint (`POST /tool/apply-wardrobe`) — no copy-paste. It only
  rewrites the `wardrobeLayerBoundsByType` block in `rules.js` and the
  `assetTargetOverrides` block in `asset-target-overrides.js` (whitelisted files).
  Reload the game to see the result. (Requires the server to be `node server.mjs`.)
- Manual fallback if you prefer: **Copy rules.js safeBox** → paste into `rules.js`;
  **Copy per-item overrides** → paste into `asset-target-overrides.js`.

## Test Image (any size)

Use **Load Image** to drop in an arbitrary-size picture and preview it fitting
into the current **Item Box** — this is how you confirm that art with a different
crop/aspect still aligns. **Clear** removes it. The test image is preview-only
and is never exported.

## Trim tool

`node tool/trim-wardrobe-assets.mjs` (dry-run) measures every layer asset's
content box; `--apply` trims the transparent margins in place and regenerates
`asset-content-box.generated.js`. Requires ImageMagick (`magick`).
