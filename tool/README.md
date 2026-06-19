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
everything. The **素材包** dropdown above the categories filters items by content
pack (multi-select checkboxes; pick one pack or several, or 全選/全不選). Drag the
splitter between the catalog and the preview to resize the left column.

## Positioning a garment (issue #176)

Wardrobe art is stored tightly trimmed (no transparent margins), and the engine
scales each piece to fill a target rectangle (its **item box**) in `512×768`
canvas coordinates — non-uniform, so the box sets width and height independently.
The selected item shows a green box on the figure; tune it directly:

- drag the centre **✛** square to move it,
- drag the eight edge/corner handles to resize (non-uniform).

The box is seeded from the trimmed art's original content box (identity). Only
items you actually change are exported (as a diff) into
`content-package/wardrobe/_shared/asset-target-overrides.js`; the trim baseline in
`asset-content-box.generated.js` is never hand-edited, so re-running the trim
script will not clobber your overrides. Per-type projection regions
(`wardrobeLayerBoundsByType` `safeBox` in `rules.js`) are written through
unchanged on Apply.

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
