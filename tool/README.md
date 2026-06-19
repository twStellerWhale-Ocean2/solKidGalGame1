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

Pick a garment from the **left** list. The **素材包** (content pack) and **類型**
(category) dropdowns above the list each filter the items by multi-select
checkboxes (pick one or several, or 全選/全不選). The **mouse wheel zooms** the
preview, and the splitters on either side of the preview resize the left/right
columns.

## Positioning a garment (issue #176)

Wardrobe art is stored tightly trimmed (no transparent margins), and the engine
fills a target box in `512×768` canvas coordinates — non-uniform, so the box sets
width and height independently. The **編輯對象** toggle picks which box you edit:

- **① 類型框** (blue) — the type's projection region (`safeBox`, a soft guide /
  default; exports to `wardrobeLayerBoundsByType` in `rules.js`).
- **② 單品框** (green) — the selected item's exact box (exports as a diff to
  `asset-target-overrides.js`; seeded from the trimmed art's content box).

Drag the selected box directly on the figure:

- the centre **✛** square to move it,
- the four edge-midpoint handles to resize (non-uniform),
- on the green item box, the **four corner handles taper the top/bottom edge
  width** — an isosceles-trapezoid warp (left/right symmetric) applied to the art
  via a projective transform.

The trim baseline in `asset-content-box.generated.js` is never hand-edited, so
re-running the trim script will not clobber your overrides. A per-item box may
extend beyond its type `safeBox` (manual tuning is allowed anywhere on the
canvas; `data-audit` only warns, and errors only if it leaves the canvas).

## Apply your tuning

**✓ 套用到檔案 (Apply)** (bottom of the right pane) writes both layers straight
back to disk via the local `server.mjs` dev endpoint (`POST /tool/apply-wardrobe`)
— no copy-paste. It only rewrites the `wardrobeLayerBoundsByType` block in
`rules.js` and the `assetTargetOverrides` block in `asset-target-overrides.js`
(whitelisted files), preserving each file's line endings. Reload the game to see
the result. (Requires the dev server to be `node server.mjs`.)

## Managing items (dev-server endpoints)

Each item row has two actions, and there is an **➕ 新增單品** form above the list.
These write to the pack manifests / asset files via `server.mjs` (dev only,
`127.0.0.1`, whitelisted to `content-package/wardrobe/<pack>/`):

- **📁** — open the pack's `assets` folder in the OS file explorer.
- **🗑** — delete the item: removes its `wearable({…})` line from the pack
  `manifest.js`, deletes its `layers/`+`thumbs/` webp, and drops any override /
  content-box entry. Asks for confirmation; **not undoable** (use git to recover).
- **➕ 新增單品** — register an item already dropped into the pack folder: fill
  pack / type / id / name / asset (filename without `.webp`) / cost → inserts a
  `wearable({…})` line, then trims the new layer and records its content box.
  (Upload-and-convert is a planned follow-up; for now place the `.webp` yourself
  via **📁** first.)

The page reloads after add/delete so the manifests are re-read.

## Trim tool

`node tool/trim-wardrobe-assets.mjs` (dry-run) measures every layer asset's
content box; `--apply` trims the transparent margins in place and regenerates
`asset-content-box.generated.js`. Requires ImageMagick (`magick`).
