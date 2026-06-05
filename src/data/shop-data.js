const dollAssetVersion = "?v=20260605-doll-art-r4";

export const paperDollBaseLayer = `assets/doll/lumi/v3/layers/base-starter-pajama.webp${dollAssetVersion}`;

export const paperDollLayerOrder = [
  "outerBack",
  "base",
  "hairstyle",
  "dress",
  "bottom",
  "top",
  "outerFront",
  "shoes",
  "neck",
  "hand",
  "headTop",
  "headSide",
  "faceEyes",
  "faceMask"
];

export const outfitSlots = [
  "hairstyle",
  "top",
  "bottom",
  "dress",
  "outer",
  "shoes",
  "headTop",
  "headSide",
  "faceEyes",
  "faceMask",
  "neck",
  "hand",
  "room"
];

export const categories = [
  { id: "hair", label: "Hair", types: ["hairstyle"] },
  { id: "tops", label: "Tops", types: ["top"] },
  { id: "bottoms", label: "Bottoms", types: ["bottom"] },
  { id: "dresses", label: "Dresses", types: ["dress"] },
  { id: "outerwear", label: "Outerwear", types: ["outer"] },
  { id: "shoes", label: "Shoes", types: ["shoes"] },
  { id: "hats", label: "Hats", types: ["headTop"] },
  { id: "accessories", label: "Accessories", types: ["headSide", "faceEyes", "faceMask", "neck", "hand"] },
  { id: "outfitSets", label: "Outfit Sets", types: ["outfitSet"] }
];

const dollLayer = (name) => `assets/doll/lumi/v3/layers/${name}.webp${dollAssetVersion}`;
const dollThumb = (name) => `assets/doll/lumi/v3/thumbs/${name}.webp${dollAssetVersion}`;
const dollSource = (name) => `assets/doll/lumi/v3/sources/${name}-source.png`;
const layer = (slot, name) => ({ slot, src: dollLayer(name) });

function wearable({ id, storeId, type, name, cost, icon, asset, slot = type }) {
  return {
    id,
    storeId,
    type,
    name,
    cost,
    icon,
    image: dollThumb(asset),
    source: dollSource(asset),
    layers: [layer(slot, asset)]
  };
}

function outfitSet({ id, name, cost, asset, equips }) {
  return {
    id,
    storeId: "boutique",
    type: "outfitSet",
    name,
    cost,
    icon: "✦",
    image: dollThumb(asset),
    source: dollSource(asset),
    layers: [],
    equips
  };
}

export const shopItems = [
  { id: "softBrownHair", storeId: "starter", type: "hairstyle", name: "Soft brown hair", cost: 0, icon: "Hair", image: dollThumb("base-starter-pajama"), source: dollSource("base-starter-pajama"), layers: [] },
  { id: "starterPajama", storeId: "starter", type: "dress", name: "Pink-white cotton pajama", cost: 0, icon: "PJs", image: dollThumb("base-starter-pajama"), source: dollSource("base-starter-pajama"), layers: [] },

  wearable({ id: "twinBraidHair", storeId: "hairSalon", type: "hairstyle", name: "Twin-braid story hair", cost: 110, icon: "Hair", asset: "hairstyle-twin-braid" }),
  wearable({ id: "blondeBobHair", storeId: "hairSalon", type: "hairstyle", name: "Blonde bob story hair", cost: 130, icon: "Hair", asset: "hairstyle-blonde-bob" }),
  wearable({ id: "chestnutTwinBraidHair", storeId: "hairSalon", type: "hairstyle", name: "Chestnut twin-braid hair", cost: 150, icon: "Hair", asset: "hairstyle-twin-braid-chestnut" }),
  wearable({ id: "roseTwinBraidHair", storeId: "hairSalon", type: "hairstyle", name: "Rose twin-braid hair", cost: 170, icon: "Hair", asset: "hairstyle-twin-braid-rose" }),
  wearable({ id: "midnightTwinBraidHair", storeId: "hairSalon", type: "hairstyle", name: "Midnight twin-braid hair", cost: 190, icon: "Hair", asset: "hairstyle-twin-braid-midnight" }),
  wearable({ id: "auburnTwinBraidHair", storeId: "hairSalon", type: "hairstyle", name: "Auburn twin-braid hair", cost: 210, icon: "Hair", asset: "hairstyle-twin-braid-auburn" }),
  wearable({ id: "honeyBobHair", storeId: "hairSalon", type: "hairstyle", name: "Honey bob hair", cost: 150, icon: "Hair", asset: "hairstyle-blonde-bob-honey" }),
  wearable({ id: "silverBobHair", storeId: "hairSalon", type: "hairstyle", name: "Silver bob hair", cost: 180, icon: "Hair", asset: "hairstyle-blonde-bob-silver" }),
  wearable({ id: "lavenderBobHair", storeId: "hairSalon", type: "hairstyle", name: "Lavender bob hair", cost: 200, icon: "Hair", asset: "hairstyle-blonde-bob-lavender" }),
  wearable({ id: "cocoaBobHair", storeId: "hairSalon", type: "hairstyle", name: "Cocoa bob hair", cost: 220, icon: "Hair", asset: "hairstyle-blonde-bob-cocoa" }),

  wearable({ id: "skyBlouse", storeId: "tailorStudio", type: "top", name: "Sky blue puff blouse", cost: 100, icon: "Top", asset: "top-sky-blouse" }),
  wearable({ id: "peachSailorTop", storeId: "tailorStudio", type: "top", name: "Peach sailor top", cost: 120, icon: "Top", asset: "top-peach-sailor" }),
  wearable({ id: "mintBlouse", storeId: "tailorStudio", type: "top", name: "Mint puff blouse", cost: 130, icon: "Top", asset: "top-mint-blouse" }),
  wearable({ id: "lilacBlouse", storeId: "tailorStudio", type: "top", name: "Lilac puff blouse", cost: 140, icon: "Top", asset: "top-lilac-blouse" }),
  wearable({ id: "creamBlouse", storeId: "tailorStudio", type: "top", name: "Cream puff blouse", cost: 150, icon: "Top", asset: "top-cream-blouse" }),
  wearable({ id: "coralBlouse", storeId: "castleSeamstress", type: "top", name: "Coral castle blouse", cost: 90, icon: "Top", asset: "top-coral-blouse" }),
  wearable({ id: "roseSailorTop", storeId: "castleSeamstress", type: "top", name: "Rose sailor top", cost: 110, icon: "Top", asset: "top-rose-sailor" }),
  wearable({ id: "aquaSailorTop", storeId: "castleSeamstress", type: "top", name: "Aqua sailor top", cost: 130, icon: "Top", asset: "top-aqua-sailor" }),
  wearable({ id: "violetSailorTop", storeId: "workwearStall", type: "top", name: "Violet workday sailor top", cost: 520, icon: "Top", asset: "top-violet-sailor" }),
  wearable({ id: "butterSailorTop", storeId: "workwearStall", type: "top", name: "Butter workday sailor top", cost: 540, icon: "Top", asset: "top-butter-sailor" }),

  wearable({ id: "navyShorts", storeId: "tailorStudio", type: "bottom", name: "Navy story shorts", cost: 90, icon: "Bottom", asset: "bottom-navy-shorts" }),
  wearable({ id: "roseSkirt", storeId: "tailorStudio", type: "bottom", name: "Rose ribbon skirt", cost: 110, icon: "Bottom", asset: "bottom-rose-skirt" }),
  wearable({ id: "forestShorts", storeId: "tailorStudio", type: "bottom", name: "Forest story shorts", cost: 130, icon: "Bottom", asset: "bottom-forest-shorts" }),
  wearable({ id: "plumShorts", storeId: "tailorStudio", type: "bottom", name: "Plum story shorts", cost: 150, icon: "Bottom", asset: "bottom-plum-shorts" }),
  wearable({ id: "cocoaShorts", storeId: "tailorStudio", type: "bottom", name: "Cocoa story shorts", cost: 170, icon: "Bottom", asset: "bottom-cocoa-shorts" }),
  wearable({ id: "skyShorts", storeId: "castleSeamstress", type: "bottom", name: "Sky castle shorts", cost: 100, icon: "Bottom", asset: "bottom-sky-shorts" }),
  wearable({ id: "lilacSkirt", storeId: "castleSeamstress", type: "bottom", name: "Lilac castle skirt", cost: 120, icon: "Bottom", asset: "bottom-lilac-skirt" }),
  wearable({ id: "mintSkirt", storeId: "workwearStall", type: "bottom", name: "Mint field skirt", cost: 520, icon: "Bottom", asset: "bottom-mint-skirt" }),
  wearable({ id: "sunSkirt", storeId: "workwearStall", type: "bottom", name: "Sun field skirt", cost: 540, icon: "Bottom", asset: "bottom-sun-skirt" }),
  wearable({ id: "coralSkirt", storeId: "workwearStall", type: "bottom", name: "Coral field skirt", cost: 560, icon: "Bottom", asset: "bottom-coral-skirt" }),

  wearable({ id: "blueDress", storeId: "boutique", type: "dress", name: "Blue harbor dress", cost: 100, icon: "Dress", asset: "dress-blue-harbor" }),
  wearable({ id: "roseDress", storeId: "boutique", type: "dress", name: "Rose festival dress", cost: 200, icon: "Dress", asset: "dress-rose-festival" }),
  wearable({ id: "snowDress", storeId: "boutique", type: "dress", name: "Snowflake gown", cost: 260, icon: "Dress", asset: "dress-snowflake-gown" }),
  wearable({ id: "mintHarborDress", storeId: "boutique", type: "dress", name: "Mint harbor dress", cost: 220, icon: "Dress", asset: "dress-mint-harbor" }),
  wearable({ id: "lilacHarborDress", storeId: "boutique", type: "dress", name: "Lilac harbor dress", cost: 240, icon: "Dress", asset: "dress-lilac-harbor" }),
  wearable({ id: "pearlHarborDress", storeId: "boutique", type: "dress", name: "Pearl harbor dress", cost: 260, icon: "Dress", asset: "dress-pearl-harbor" }),
  wearable({ id: "lavenderFestivalDress", storeId: "boutique", type: "dress", name: "Lavender festival dress", cost: 280, icon: "Dress", asset: "dress-lavender-festival" }),
  wearable({ id: "coralFestivalDress", storeId: "fairyAtelier", type: "dress", name: "Coral fairy festival dress", cost: 2050, icon: "Dress", asset: "dress-coral-festival" }),
  wearable({ id: "starlightGown", storeId: "fairyAtelier", type: "dress", name: "Starlight fairy gown", cost: 2200, icon: "Dress", asset: "dress-starlight-gown" }),
  wearable({ id: "auroraGown", storeId: "fairyAtelier", type: "dress", name: "Aurora fairy gown", cost: 2400, icon: "Dress", asset: "dress-aurora-gown" }),

  wearable({ id: "yellowCardigan", storeId: "royalCloakRoom", type: "outer", name: "Little yellow cardigan", cost: 150, icon: "Outer", asset: "outer-yellow-cardigan", slot: "outerFront" }),
  wearable({ id: "starCape", storeId: "royalCloakRoom", type: "outer", name: "Starry helper cape", cost: 240, icon: "Outer", asset: "outer-starry-cape", slot: "outerFront" }),
  wearable({ id: "mintCardigan", storeId: "royalCloakRoom", type: "outer", name: "Mint royal cardigan", cost: 80, icon: "Outer", asset: "outer-mint-cardigan", slot: "outerFront" }),
  wearable({ id: "roseCardigan", storeId: "royalCloakRoom", type: "outer", name: "Rose royal cardigan", cost: 90, icon: "Outer", asset: "outer-rose-cardigan", slot: "outerFront" }),
  wearable({ id: "moonCape", storeId: "royalCloakRoom", type: "outer", name: "Moon royal cape", cost: 120, icon: "Outer", asset: "outer-moon-cape", slot: "outerFront" }),
  wearable({ id: "auroraCape", storeId: "royalCloakRoom", type: "outer", name: "Aurora royal cape", cost: 140, icon: "Outer", asset: "outer-aurora-cape", slot: "outerFront" }),
  wearable({ id: "mossCloak", storeId: "dwarfCottage", type: "outer", name: "Moss helper cloak", cost: 2050, icon: "Outer", asset: "outer-moss-cloak", slot: "outerFront" }),
  wearable({ id: "fernCloak", storeId: "dwarfCottage", type: "outer", name: "Fern helper cloak", cost: 2100, icon: "Outer", asset: "outer-fern-cloak", slot: "outerFront" }),
  wearable({ id: "violetCloak", storeId: "dwarfCottage", type: "outer", name: "Violet helper cloak", cost: 2200, icon: "Outer", asset: "outer-violet-cloak", slot: "outerFront" }),
  wearable({ id: "autumnCloak", storeId: "dwarfCottage", type: "outer", name: "Autumn helper cloak", cost: 2300, icon: "Outer", asset: "outer-autumn-cloak", slot: "outerFront" }),

  wearable({ id: "pinkSlippers", storeId: "shoeShop", type: "shoes", name: "Ribbon walking shoes", cost: 90, icon: "Shoes", asset: "shoes-pink-ribbon" }),
  wearable({ id: "blueBoots", storeId: "shoeShop", type: "shoes", name: "Blue seaside boots", cost: 150, icon: "Shoes", asset: "shoes-blue-boots" }),
  wearable({ id: "mintRibbonShoes", storeId: "shoeShop", type: "shoes", name: "Mint ribbon shoes", cost: 130, icon: "Shoes", asset: "shoes-mint-ribbon" }),
  wearable({ id: "lilacRibbonShoes", storeId: "shoeShop", type: "shoes", name: "Lilac ribbon shoes", cost: 150, icon: "Shoes", asset: "shoes-lilac-ribbon" }),
  wearable({ id: "sunRibbonShoes", storeId: "shoeShop", type: "shoes", name: "Sun ribbon shoes", cost: 170, icon: "Shoes", asset: "shoes-sun-ribbon" }),
  wearable({ id: "coralRibbonShoes", storeId: "shoeShop", type: "shoes", name: "Coral ribbon shoes", cost: 190, icon: "Shoes", asset: "shoes-coral-ribbon" }),
  wearable({ id: "forestBoots", storeId: "fieldCobbler", type: "shoes", name: "Forest field boots", cost: 520, icon: "Shoes", asset: "shoes-forest-boots" }),
  wearable({ id: "plumBoots", storeId: "fieldCobbler", type: "shoes", name: "Plum field boots", cost: 540, icon: "Shoes", asset: "shoes-plum-boots" }),
  wearable({ id: "cocoaBoots", storeId: "dwarfCottage", type: "shoes", name: "Cocoa dwarf boots", cost: 2050, icon: "Shoes", asset: "shoes-cocoa-boots" }),
  wearable({ id: "silverBoots", storeId: "dwarfCottage", type: "shoes", name: "Silver dwarf boots", cost: 2150, icon: "Shoes", asset: "shoes-silver-boots" }),

  wearable({ id: "goldCrown", storeId: "accessoryShop", type: "headTop", name: "Tiny gold crown", cost: 140, icon: "Hat", asset: "headtop-gold-crown" }),
  wearable({ id: "roseCrown", storeId: "accessoryShop", type: "headTop", name: "Tiny rose crown", cost: 160, icon: "Hat", asset: "headtop-rose-crown" }),
  wearable({ id: "silverCrown", storeId: "accessoryShop", type: "headTop", name: "Tiny silver crown", cost: 180, icon: "Hat", asset: "headtop-silver-crown" }),
  wearable({ id: "lilacCrown", storeId: "accessoryShop", type: "headTop", name: "Tiny lilac crown", cost: 200, icon: "Hat", asset: "headtop-lilac-crown" }),
  wearable({ id: "mintCrown", storeId: "accessoryShop", type: "headTop", name: "Tiny mint crown", cost: 220, icon: "Hat", asset: "headtop-mint-crown" }),
  wearable({ id: "pearlTiara", storeId: "royalCloakRoom", type: "headTop", name: "Pearl royal tiara", cost: 80, icon: "Hat", asset: "headtop-pearl-tiara" }),
  wearable({ id: "starryTiara", storeId: "royalCloakRoom", type: "headTop", name: "Starry royal tiara", cost: 100, icon: "Hat", asset: "headtop-starry-tiara" }),
  wearable({ id: "rubyTiara", storeId: "royalCloakRoom", type: "headTop", name: "Ruby royal tiara", cost: 120, icon: "Hat", asset: "headtop-ruby-tiara" }),
  wearable({ id: "forestTiara", storeId: "fieldCobbler", type: "headTop", name: "Forest field tiara", cost: 520, icon: "Hat", asset: "headtop-forest-tiara" }),
  wearable({ id: "auroraTiara", storeId: "fieldCobbler", type: "headTop", name: "Aurora field tiara", cost: 560, icon: "Hat", asset: "headtop-aurora-tiara" }),

  wearable({ id: "silkRibbon", storeId: "accessoryShop", type: "headSide", name: "Silk party ribbon", cost: 120, icon: "Acc", asset: "headside-silk-ribbon" }),
  wearable({ id: "roundGlasses", storeId: "accessoryShop", type: "faceEyes", name: "Round storybook glasses", cost: 120, icon: "Acc", asset: "faceeyes-round-glasses" }),
  wearable({ id: "starMask", storeId: "accessoryShop", type: "faceMask", name: "Lavender star mask", cost: 160, icon: "Acc", asset: "facemask-star-mask" }),
  wearable({ id: "pearlNecklace", storeId: "accessoryShop", type: "neck", name: "Pearl heart necklace", cost: 150, icon: "Acc", asset: "neck-pearl-necklace" }),
  wearable({ id: "pearlBag", storeId: "accessoryShop", type: "hand", name: "Pearl shell bag", cost: 170, icon: "Acc", asset: "hand-pearl-bag" }),
  wearable({ id: "mintRibbon", storeId: "accessoryShop", type: "headSide", name: "Mint party ribbon", cost: 140, icon: "Acc", asset: "headside-mint-ribbon" }),
  wearable({ id: "silverGlasses", storeId: "fairyAtelier", type: "faceEyes", name: "Silver fairy glasses", cost: 2050, icon: "Acc", asset: "faceeyes-silver-glasses" }),
  wearable({ id: "moonMask", storeId: "fairyAtelier", type: "faceMask", name: "Moon fairy mask", cost: 2100, icon: "Acc", asset: "facemask-moon-mask" }),
  wearable({ id: "roseNecklace", storeId: "fairyAtelier", type: "neck", name: "Rose fairy necklace", cost: 2150, icon: "Acc", asset: "neck-rose-necklace" }),
  wearable({ id: "lilacBag", storeId: "fairyAtelier", type: "hand", name: "Lilac fairy bag", cost: 2200, icon: "Acc", asset: "hand-lilac-bag" }),

  outfitSet({ id: "roseClassicSet", name: "Rose classic outfit set", cost: 360, asset: "set-rose-classic", equips: { hairstyle: "twinBraidHair", dress: "roseDress", shoes: "pinkSlippers", headTop: "roseCrown" } }),
  outfitSet({ id: "blueHarborSet", name: "Blue harbor outfit set", cost: 380, asset: "set-blue-harbor", equips: { hairstyle: "blondeBobHair", dress: "blueDress", shoes: "blueBoots", headSide: "silkRibbon" } }),
  outfitSet({ id: "snowPrincessSet", name: "Snow princess outfit set", cost: 520, asset: "set-snow-princess", equips: { hairstyle: "silverBobHair", dress: "snowDress", shoes: "silverBoots", headTop: "silverCrown" } }),
  outfitSet({ id: "mintGardenSet", name: "Mint garden outfit set", cost: 440, asset: "set-mint-garden", equips: { hairstyle: "chestnutTwinBraidHair", dress: "mintHarborDress", shoes: "mintRibbonShoes", headTop: "mintCrown" } }),
  outfitSet({ id: "lilacDreamSet", name: "Lilac dream outfit set", cost: 460, asset: "set-lilac-dream", equips: { hairstyle: "lavenderBobHair", dress: "lilacHarborDress", shoes: "lilacRibbonShoes", headTop: "lilacCrown" } }),
  outfitSet({ id: "tailorDaySet", name: "Tailor day outfit set", cost: 420, asset: "set-tailor-day", equips: { top: "mintBlouse", bottom: "skyShorts", shoes: "mintRibbonShoes", headSide: "mintRibbon" } }),
  outfitSet({ id: "castleHelperSet", name: "Castle helper outfit set", cost: 260, asset: "set-castle-helper", equips: { top: "creamBlouse", bottom: "roseSkirt", outer: "yellowCardigan", headTop: "pearlTiara" } }),
  outfitSet({ id: "forestTrailSet", name: "Forest trail outfit set", cost: 2450, asset: "set-forest-trail", equips: { top: "aquaSailorTop", bottom: "forestShorts", outer: "fernCloak", shoes: "forestBoots" } }),
  outfitSet({ id: "starryCapeSet", name: "Starry cape outfit set", cost: 620, asset: "set-starry-cape", equips: { dress: "starlightGown", outer: "moonCape", shoes: "silverBoots", headTop: "starryTiara" } }),
  outfitSet({ id: "auroraFestivalSet", name: "Aurora festival outfit set", cost: 680, asset: "set-aurora-festival", equips: { dress: "auroraGown", outer: "auroraCape", shoes: "lilacRibbonShoes", headTop: "auroraTiara" } })
];
