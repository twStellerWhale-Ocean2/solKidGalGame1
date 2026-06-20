# Luminara Editor (Wardrobe + Map)

> issue #218：原 Wardrobe Tuner 重構為比照專業遊戲編輯軟體的**多頁籤編輯器**——最上方是功能
> 頁籤（**衣物設定** / **地圖設定**），左欄是選項清單，右欄是設定與儲存按鈕。檔名維持
> `wardrobe-tuner.html` 不變（server 轉址與遊戲內 dev 入口都指向它）。

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

### In-game dev entry (issue #212)

When the game itself is opened from a **local dev host** (`location.hostname` is
`127.0.0.1`, `localhost` or `[::1]`), the princess **Choose your princess** dialog
shows a **衣物調整工具** button right below the `Start` button — clicking it
navigates to `tool/wardrobe-tuner.html`. This entry is **dev-only**: it is gated by
front-end environment detection and never appears on the public GitHub Pages site.
Full apply/manage actions still require the dev server (`node server.mjs`).

## 衣物設定 (Wardrobe tab)

Pick a garment from the **left** list. The **素材包** (content pack) and **類型**
(category) dropdowns above the list each filter the items by multi-select
checkboxes (pick one or several, or 全選/全不選). On the centre preview the
**mouse wheel zooms** and **dragging an empty area pans** the figure (issue #218);
the splitters on either side resize the left/right columns.

The right-hand **編輯對象** toggle now has **three** states (issue #218):

- **⊘ 無選擇** — hide both boxes so you can inspect the garment art itself.
- **① 類型框** — show/edit only the blue type box (the green item box is hidden).
- **② 單品框** — show/edit only the green item box (the blue type box is hidden).

Each garment row's **📝** button opens a **metadata** dialog (name / price /
description) instead of the old description-only prompt; reads no longer abort when
`style.json` or the asset entry is missing — fields just start empty (issue #218).
Saving writes the name/price back to the pack `manifest.js` and the description back
to `style.json`, then reloads.

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
- on the green item box, the **four corner handles drag freely in both axes**
  (issue #191) — each corner moves independently, warping the art into an arbitrary
  quadrilateral via a projective transform (no longer limited to a left/right
  symmetric trapezoid). Exported as `corners: { nw:[dx,dy], ne, sw, se }` (px
  offsets from the box corners); legacy `topInset`/`bottomInset` entries are still
  read and converted on edit.

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
- **➕ 新增單品** — fill pack / type / id / name / asset (filename without `.webp`)
  / cost, then either:
  - **upload an image** (`圖檔上傳`) — the server converts it to webp, fits it onto
    a 512×768 transparent canvas (centred), generates the thumbnail, then registers
    it; or
  - **leave the file empty** to register an asset you already placed in the pack's
    `layers/`+`thumbs/` (via **📁**).
  Either way it inserts a `wearable({…})` line, trims the layer, and records the
  content box. Tick `覆寫同名素材` to replace an existing asset.

The page reloads after add/delete so the manifests are re-read.

## Trim tool

`node tool/trim-wardrobe-assets.mjs` (dry-run) measures every layer asset's
content box; `--apply` trims the transparent margins in place and regenerates
`asset-content-box.generated.js`. Requires ImageMagick (`magick`).

## 地圖設定 (Map tab, issue #218)

The **地圖設定** function tab edits where each scene sits on a map. The sub-tabs
choose the map: **World Map** (`content-package/areas/world.js` destinations) and
each area — **Castle / Urban / Rural / Wild** (`<area>Area.nodes` in that area's
`manifest.js`). x / y are percentages of the map's width / height.

- **Drag a marker** on the map, or type into the **x / y** boxes on the right —
  both stay in sync. The left list selects/highlights a node.
- **✓ 儲存座標到檔案** writes the changed x / y straight back via the dev endpoint
  `POST /tool/save-map-positions`. It only rewrites the first `x:` / `y:` after each
  `id: "<id>"` (whitelisted to the five map files), preserving line endings.
- **更換地圖** uploads a replacement image; the server cover-fits it to that map's
  exact size/resolution (world `1024×1536`, areas `1536×1536`) with ImageMagick and
  overwrites the map webp (`POST /tool/upload-map`). Reload the game to see it.

Like the wardrobe apply/manage actions, map save/upload require the dev server
(`node server.mjs`) and never run on the public GitHub Pages site.
