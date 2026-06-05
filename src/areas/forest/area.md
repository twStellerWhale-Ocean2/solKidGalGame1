# Forest Area Pack

Forest is the wide zoomed-in fantasy region from the left mountain / forest / river side of the Kingdom panorama. Runtime data lives in `manifest.js`; this document and `area.yaml` are the authoring description.

## Gameplay

- `Kingdom Path`: right-side portal marker back to Kingdom.
- `Elf Glade`, `Dwarf Cottage`, `Stone Golem Pass`, `Halfling Village`, `Wizard Hut`, `Red Riding Hood Path`, `Three Pigs Cottage`, and `Tree Spirit Grove`: Help scenes using Cambridge A2 Flyers-style story vocabulary.
- `Dwarf Cottage`: forest shop scene for `outerwear` and `shoes`.
- `Fairy Atelier`: forest shop scene for `dresses` and `accessories`.
- Each Help scene owns five local questions in `manifest.js`.

## Asset Status

- Uses `assets/areas/forest/map-pure.webp` as the runtime map plate. The map is location-only art; Little Red Riding Hood, the Three Pigs, fairies, dwarves, tree spirits, and other people do not appear on the map layer.
- Forest scene, shop scene, and NPC portrait assets live under `assets/areas/forest/`, keeping them independent from Castle / Kingdom / Suburb assets.
- Forest characters appear through scene NPC portraits configured in `manifest.js`, not as permanent map actors on the Forest map.
