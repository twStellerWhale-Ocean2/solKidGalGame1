import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { outfitSet, wearable } = createWardrobePackTools("urban-dress-boutique");

//#region Urban Dress Boutique 洋裝
// Dress Boutique 維護城市洋裝與整套穿搭 bundle。
export const urbanDressBoutiqueItems = [
  wearable({ id: "blueDress", storeId: "boutique", type: "dress", name: "Blue harbor dress", cost: 100, icon: "Dress", asset: "dress-blue-harbor" }),
  wearable({ id: "roseDress", storeId: "boutique", type: "dress", name: "Rose festival dress", cost: 200, icon: "Dress", asset: "dress-rose-festival" }),
  wearable({ id: "snowDress", storeId: "boutique", type: "dress", name: "Snowflake gown", cost: 260, icon: "Dress", asset: "dress-snowflake-gown" }),
  wearable({ id: "mintHarborDress", storeId: "boutique", type: "dress", name: "Mint harbor dress", cost: 220, icon: "Dress", asset: "dress-mint-harbor" }),
  wearable({ id: "lilacHarborDress", storeId: "boutique", type: "dress", name: "Lilac harbor dress", cost: 240, icon: "Dress", asset: "dress-lilac-harbor" }),
  wearable({ id: "pearlHarborDress", storeId: "boutique", type: "dress", name: "Pearl harbor dress", cost: 260, icon: "Dress", asset: "dress-pearl-harbor" }),
  wearable({ id: "lavenderFestivalDress", storeId: "boutique", type: "dress", name: "Lavender festival dress", cost: 280, icon: "Dress", asset: "dress-lavender-festival" }),
  outfitSet({ id: "roseClassicSet", name: "Rose classic outfit set", cost: 360, asset: "set-rose-classic", equips: { hairstyle: "twinBraidHair", dress: "roseDress", shoes: "pinkSlippers", headTop: "roseCrown" } }),
  outfitSet({ id: "blueHarborSet", name: "Blue harbor outfit set", cost: 380, asset: "set-blue-harbor", equips: { hairstyle: "blondeBobHair", dress: "blueDress", shoes: "blueBoots", headSide: "silkRibbon" } }),
  outfitSet({ id: "snowPrincessSet", name: "Snow princess outfit set", cost: 520, asset: "set-snow-princess", equips: { hairstyle: "silverBobHair", dress: "snowDress", shoes: "silverBoots", headTop: "silverCrown" } }),
  outfitSet({ id: "mintGardenSet", name: "Mint garden outfit set", cost: 440, asset: "set-mint-garden", equips: { hairstyle: "chestnutTwinBraidHair", dress: "mintHarborDress", shoes: "mintRibbonShoes", headTop: "mintCrown" } }),
  outfitSet({ id: "lilacDreamSet", name: "Lilac dream outfit set", cost: 460, asset: "set-lilac-dream", equips: { hairstyle: "lavenderBobHair", dress: "lilacHarborDress", shoes: "lilacRibbonShoes", headTop: "lilacCrown" } }),
  outfitSet({ id: "tailorDaySet", name: "Tailor day outfit set", cost: 420, asset: "set-tailor-day", equips: { top: "mintBlouse", bottom: "skyShorts", shoes: "mintRibbonShoes", headSide: "mintRibbon" } }),
  outfitSet({ id: "castleHelperSet", name: "Castle helper outfit set", cost: 260, asset: "set-castle-helper", equips: { top: "creamBlouse", bottom: "roseSkirt", outer: "yellowCardigan", headTop: "pearlTiara" } }),
  outfitSet({ id: "wildTrailSet", name: "Wild trail outfit set", cost: 500, asset: "set-wild-trail", equips: { top: "aquaSailorTop", bottom: "wildShorts", outer: "fernCloak", shoes: "wildBoots" } }),
  outfitSet({ id: "starryCapeSet", name: "Starry cape outfit set", cost: 620, asset: "set-starry-cape", equips: { dress: "starlightGown", outer: "moonCape", shoes: "silverBoots", headTop: "starryTiara" } }),
  outfitSet({ id: "auroraFestivalSet", name: "Aurora festival outfit set", cost: 680, asset: "set-aurora-festival", equips: { dress: "auroraGown", outer: "auroraCape", shoes: "lilacRibbonShoes", headTop: "auroraTiara" } })
];
//#endregion Urban Dress Boutique 洋裝
