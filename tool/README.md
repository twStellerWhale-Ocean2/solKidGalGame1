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

The tool reads the live wardrobe manifest and shows:

- wardrobe UI categories and all items in each category
- item type, id, thumbnail, and coin price
- full-body paper-doll preview for the selected item or outfit set
- an editable **Target Box** per layer type — the rectangle (in `512×768` canvas
  coordinates) that the garment should project onto the character
- a dashed overlay showing the current Target Box on the preview
- generated `wardrobeLayerBoundsByType` snippet for copying back into
  `content-package/wardrobe/_shared/rules.js`

## Target Box (manual projection, issue #176)

Set, per clothing category, where its art projects onto the `512×768` figure:

- **Left / Top / Right / Bottom** are canvas coordinates (0–512 / 0–768) of the
  target rectangle. Whatever the source image size, the engine scales it to
  *contain* within this box (aspect preserved), so any-size art lands in the
  right place at the right scale.
- **Move Up / Down / Left / Right** shift the whole box by 4px without resizing.
- A Target Box equal to the full canvas (`0,0,512,768`) keeps the previous
  full-canvas behaviour (identity), so untouched categories do not change.
- The exported snippet adds the box as the optional third `layerBounds(...)`
  argument; categories left at full canvas emit no `targetBox` and are unchanged.

## Test Image (any size)

Use **Load Image** to drop in an arbitrary-size picture and preview it fitting
into the current Target Box — this is how you confirm that art with a different
crop/aspect still aligns. **Clear** removes it. The test image is preview-only
and is never exported.
