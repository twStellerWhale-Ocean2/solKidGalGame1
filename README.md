# Luminara Princess Map ADV

A PC-focused static web game for young English learners. The first screen is Princess Lumi's bedroom, where the player dresses her like a paper doll. The main play loop happens on the kingdom map: freely explore safe walk areas, visit quest places or shops, and answer short English ADV scenes.

## Current Play Loop

1. Open the room and check Lumi's outfit.
2. Go to the map.
3. Move freely with `WASD` or arrow keys inside safe walk areas.
4. Press `Enter`, `Space`, or the `Talk` / `Shop` button at a place.
5. In quest scenes, read the NPC line and choose one English sentence.
6. Wrong answers show a hint and allow another try.
7. Correct answers give `100 coins`, stats, learned words, diary records, and a closing line.
8. The game stays on the map and creates the next random quest.

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

- Dress Boutique: dresses and room items
- Shoe Shop: shoes
- Accessory Shop: hats and accessories

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

The game is static and can be deployed to GitHub Pages with:

- `index.html`
- `styles.css`
- `script.js`
- `assets/`

The optional `server.mjs` is only for local OpenAI help proxy testing.

## Local Run

Static-only:

```powershell
python -m http.server 4173
```

Optional local help proxy:

```powershell
$env:OPENAI_API_KEY="sk-..."
$env:OPENAI_ORG_ID="org_..."
node server.mjs
```

## QA Entrypoints

- Save/load selftest: `?selftest=save-load`
- Monkey selftest: `?selftest=monkey`
