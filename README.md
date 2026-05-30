# solKidGalGame

A PC-focused static web game for young English learners. The first screen is Princess Lumi's bedroom, where the player dresses her like a paper doll. The main play loop happens on the kingdom map: freely explore safe walk areas, visit quest places or shops, and answer short English ADV scenes.

## Project Scope

- Type: child-friendly, cute Japanese-style MAP ADV English practice static web game.
- Target deployment: GitHub Pages.
- Static entry: `src/index.html`.
- Main source package: `src/index.html`, `src/styles.css`, `src/script.js`, `src/assets/`.
- Optional local server: `src/server.mjs`, defaulting to `http://127.0.0.1:4174/`.
- Documentation layout: root keeps `AGENTS.md` and `README.md`; `doc/` keeps design notes, audit notes, and follow-up issue tracking.

## Current Play Loop

1. Open the room and check Lumi's outfit.
2. Go to the map.
3. Move freely with `WASD` or arrow keys inside safe walk areas.
4. Press `Enter`, `Space`, or the `Talk` / `Shop` button at a place.
5. In quest scenes, read the NPC line and choose one English sentence.
6. Wrong answers show a hint and allow another try.
7. Correct answers give `100 coins`, stats, learned words, diary records, and a closing line.
8. The game stays on the map and creates the next random quest.

## Core Loop Design

1. Room shows Princess Lumi as a full-body paper doll with dress-up support.
2. The player leaves for the kingdom map.
3. The map supports free movement to location hotspots.
4. Near a valid place, `Enter` or `Space` opens an ADV scene.
5. ADV scenes use a place background, character portraits, a bottom dialogue box, vertical choices, and keyboard control.
6. Completed English tasks reward coins, stats, learned words, and diary records.
7. Coins can buy dresses, shoes, accessories, and room items from the matching shops.
8. The player returns to the room to dress up, decorate, and continue exploring.

## Places

- Castle Garden
- Market Square
- Harbor Dock
- Dress Boutique
- Shoe Shop
- Accessory Shop
- Sunny Farm
- Lighthouse

## Dress-Up

Owned items appear in the room wardrobe. Equipment changes are reflected in:

- the room paper doll
- the side status portrait
- the map princess marker
- the ADV princess portrait

Shop categories are location-specific:

- Dress Boutique: dresses
- Shoe Shop: shoes
- Accessory Shop: hats and accessories
- Market: room items

## Word Levels

The Settings page supports five levels:

- Common English 100 words
- Common English 250 words
- Common English 500 words
- Common English 750 words
- Common English 1000 words

The level affects the available sentence pool and reward multiplier.

## Help Teacher

The `?` button gives a short hint during ADV scenes.

- Without an API key, the game uses a local built-in hint.
- With the optional local Node server, `/api/help` can use `OPENAI_API_KEY` and `OPENAI_ORG_ID`.
- Browser-stored help keys are not exported in Markdown saves.

## Save / Load

`Save MD` exports a Markdown save with a readable diary plus a `LUMINARA_SAVE_JSON` data block. `Load MD` restores that file.

Saved data includes coins, energy, stats, difficulty, outfit, owned items, current quest, diary, completed lessons, learned words, met NPCs, and badges.

## Static Deployment

The repository is grouped by role:

- Root: `AGENTS.md` and `README.md`
- `doc/`: design notes, audit notes, and other project documentation
- `src/`: the complete runnable website package, including source files, the optional local server, and assets

For static hosting, serve `src/index.html` as the entry file. The optional `src/server.mjs` is only for local OpenAI help proxy testing.

## Main Files

- `src/index.html`: DOM game shell, Room, Map, Diary, Settings, and ADV modal.
- `src/styles.css`: main visual styling, map, room, ADV, shops, and paper doll styles.
- `src/script.js`: game data, state, map coordinates, hotspots, ADV, shops, save/load, and monkey test.
- `src/server.mjs`: local OpenAI help proxy and static file server.
- `doc/AUDIT-111.md`: broad audit issue source of truth.
- `doc/AUDIT-IMAGE-ISSUES.md`: latest per-page image, UI, and monkey audit notes.

## Asset Status

Main backgrounds:

- `src/assets/bedroom.png`
- `src/assets/kingdom-map.png`
- `src/assets/scenes/*.png`

Characters:

- `src/assets/characters/npc-*.png`
- `src/assets/characters/princess-*.png`
- `src/assets/characters/princess-outfits-sheet.png`

Animated map layer PNGs:

- `src/assets/map-layers/windmill-blades.png`
- `src/assets/map-layers/castle-flag.png`
- `src/assets/map-layers/harbor-ship-large.png`
- `src/assets/map-layers/harbor-ship-small.png`
- `src/assets/map-layers/lighthouse-boat.png`
- `src/assets/map-layers/river-flow.png`
- `src/assets/map-layers/harbor-flow.png`
- `src/assets/map-layers/ocean-flow.png`

Cleaned up:

- Root QA screenshots were removed.
- Old `src/assets/scenes/*.svg` placeholders were removed.
- Unused scene thumbnails and `princess-main.png` were removed.

## Completed Work

- Fixed layout overflow and the PC game viewport.
- Fixed map coordinates so map, player, hotspots, and map actors use the same transform.
- Corrected the Princess Room and castle gate hotspots near the front gate.
- Removed white translucent arc/spiral decoration from the main map.
- Added image layer support to `mapActors`.
- Replaced windmill, flag, ship, river, harbor, and ocean effects with animated PNG layers under `src/assets/map-layers/`.
- Split shop categories by place:
  - Boutique: dresses
  - Shoe Shop: shoes
  - Accessory Shop: accessories
  - Market: room items
- `node --check src/script.js` has passed multiple times.
- The 300-step monkey test has passed multiple times.

## Remaining Issues

1. The kingdom map background is not yet a clean plate:
   - The original windmill blades, flag, and ships are still baked into `src/assets/kingdom-map.png`.
   - The new PNG layers can create slight ghosting.
   - Next step: create `src/assets/kingdom-map-clean.png` with those baked-in moving objects locally removed.
2. Many ADV backgrounds are still map crops rather than true close-up ADV scene backgrounds.
3. Room, Wardrobe, Shop, Diary, and Settings still feel too much like a web shell or form UI.
4. Product images still read as icons and need stronger reward appeal.
5. NPC cutouts still have dirty edges.
6. `doc/AUDIT-IMAGE-ISSUES.md` remains the detailed page-by-page visual issue list.

## Design Direction

- This is a game first, not a general website.
- Room should feel like Princess Lumi's living base, not a landing page.
- Map should feel like a free-exploration MAP ADV, not a web marker page.
- ADV scenes should use close-up backgrounds, transparent PNG character art, a bottom dialogue box, and vertical choices.
- Shops should create reward motivation through large product previews, try-on behavior, owned/equipped/buy states, and purchase feedback.
- Diary, Settings, Save, and Load should feel like game overlays, not admin forms.
- Dynamic map elements should use a clean background plate plus independent PNG sprite layers, not CSS geometry overlays.

## Local Run

Static-only:

```powershell
cd src
python -m http.server 4173
```

Optional local help proxy:

```powershell
$env:OPENAI_API_KEY="sk-..."
$env:OPENAI_ORG_ID="org_..."
node src/server.mjs
```

Default local server URL:

- `http://127.0.0.1:4174/`

## QA Entrypoints

- Save/load selftest: `?selftest=save-load`
- Monkey selftest: `?selftest=monkey`

Common QA URLs:

- `http://127.0.0.1:4174/#home`
- `http://127.0.0.1:4174/#map`
- `http://127.0.0.1:4174/?selftest=monkey#home`
- `http://127.0.0.1:4174/?selftest=save-load#home`

Validation surfaces:

- Room
- Map
- Diary
- Settings
- Castle Garden
- Market Square
- Harbor Dock
- Dress Boutique
- Shoe Shop
- Accessory Shop
- Sunny Farm
- Lighthouse

After larger UI or gameplay changes:

1. Open the local URL in a real browser.
2. Check or screenshot each relevant page and scene.
3. Run the monkey test.
4. Check console errors and warnings.
5. Report remaining unresolved issues.
