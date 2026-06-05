# Kingdom Area Pack

Kingdom is the root panorama map for Castle, Suburb, and Forest zoom-in regions. Runtime data lives in `manifest.js`; this document and `area.yaml` are the authoring description.

## Gameplay

- Kingdom city shops are split so each shop sells at most two product categories.
- `Hair Salon`: hair only.
- `Dress Boutique`: dresses and outfit sets.
- `Tailor Studio`: tops and bottoms.
- `Shoe Shop`: shoes only.
- `Accessory Atelier`: hats and accessories.
- `Market Square` is a food/help scene, not a furniture or room-item shop.
- Town shops and help scenes use Cambridge Pre-A1 Starters-style questions.
- `School Classroom`, `Library`, `Temple`, and `Administration Building` are civic / learning places near the castle front.
- `Luminara Castle` is a portal marker back to Castle.
- `Forest Path` is a portal marker to the widened Forest area.
- `Suburb Road` replaces the old right-upper farm scene and is a portal marker to the Suburb production area.
- Each Help scene owns five local questions in `manifest.js`.

## Asset Status

- Uses existing `assets/kingdom-map2.webp` and map actor assets.
- New shop scene copies live under `assets/areas/kingdom/scenes/`.
- New NPC portraits for city split shops and civic scenes live under `assets/areas/kingdom/characters/`.
- Uses `assets/scenes/kingdom-civic-atlas.png`, generated as finished bitmap storybook art for the civic / learning scenes.
