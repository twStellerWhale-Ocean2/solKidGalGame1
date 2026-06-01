# Issue 35 Item Panel QA

## Scope

- GitHub issue: https://github.com/twStellerWhale-Ocean2/solKidGalGame/issues/35
- Target viewport: in-app Browser, mobile portrait 390 x 844.
- Target flow: store scene -> shop detail -> buy item -> leave store -> room -> wardrobe -> change dress -> leave room.

## Screenshot Manifest

| Surface | Evidence | Result |
| --- | --- | --- |
| Boutique shop detail | `.codex/log/20260602-issue35-item-panels-qa/shop-detail-boutique.jpg` | Accept: 3 fixed rows visible, inline BUY actions, Back outside list. |
| Boutique refund detail | `.codex/log/20260602-issue35-item-panels-qa/refund-detail-boutique.jpg` | Accept: same row/action layout, store-only refundable item, Back outside list. |
| Room wardrobe detail | `.codex/log/20260602-issue35-item-panels-qa/wardrobe-detail-dresses.jpg` | Accept: same row/action layout, no refund action in room, Back outside list. |

## Manual Browser Flow

- Opened Dress Boutique with test coins and used visible Browser controls.
- Entered Shop, bought Blue harbor dress, confirmed coins changed 300 -> 200 and list height stayed fixed at 218 px after item count dropped.
- Left the store, returned to Princess Room, opened Dresses, changed outfit from Blue harbor dress to Pink academy dress, then used Back and Go Outside.
- Opened Refund detail for Dress Boutique, refunded Blue harbor dress for 50 coins, confirmed coins changed 100 -> 150 and empty state retained the same 218 px list height.
- Opened Refund detail for Shoe Shop while only a Boutique item was owned; confirmed no refundable rows were shown.

## Automated Checks

- `node --check src/main.js`: pass
- `node --check src/flow/adv-controls.js`: pass
- `node --check src/render/item-panel.js`: pass
- `node --check src/testing/selftests.js`: pass
- `node --check src/data/game-data.js`: pass
- `?selftest=save-load`: pass
- `?selftest=monkey`: pass, 300 steps, 0 errors
- `git diff --check`: pass; only CRLF normalization warnings from Git.
