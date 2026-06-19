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
- editable `left`, `top`, `right`, and `bottom` render bounds for each layer type
- generated `wardrobeLayerBoundsByType` snippet for copying back into `content-package/wardrobe/_shared/rules.js`

Use paired offsets for pure movement:

- up: decrease `top`, increase `bottom`
- down: increase `top`, decrease `bottom`
- left: decrease `left`, increase `right`
- right: increase `left`, decrease `right`
