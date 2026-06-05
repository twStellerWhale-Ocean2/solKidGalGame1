# Castle Area Pack

Castle is the zoomed-in detail of the central castle from the Kingdom panorama. Runtime data lives in `manifest.js`; this document and `area.yaml` are the authoring description.

## Gameplay

- `Princess Room`: room scene with wardrobe actions only; it has no English Help because Lumi cannot reward herself.
- `King's Hall`, `Queen's Study`, `Kitchen`, `Knights' Room`, and `Maid's Room`: Help scenes using Dolch Sight Words 220.
- `Royal Cloak Room`: shop scene for outerwear and hats.
- `Castle Seamstress`: shop scene for tops and bottoms.
- `Castle Gate`: portal marker connected by `src/areas/world.js`.
- Each Help scene owns five local questions in `manifest.js`.

## Asset Status

- Uses existing `assets/castle-map2.webp` for the castle map.
- Uses `assets/scenes/castle-rooms-atlas.png`, generated as finished bitmap storybook room art for this region.
- New castle shop scene copies live under `assets/areas/castle/scenes/`.
- New castle NPC portraits live under `assets/areas/castle/characters/`.
