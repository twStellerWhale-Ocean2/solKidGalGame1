import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("urban-dress-boutique");

//#region Urban Dress Boutique 洋裝
// Dress Boutique 維護城市洋裝（#195：移除整套穿搭 outfitSet bundle，回歸單品單層）。
export const urbanDressBoutiqueItems = [
  wearable({ id: "blueDress", storeId: "boutique", type: "dress", name: "Blue harbor dress", cost: 100, icon: "Dress", asset: "dress-blue-harbor" }),
  wearable({ id: "roseDress", storeId: "boutique", type: "dress", name: "Rose festival dress", cost: 200, icon: "Dress", asset: "dress-rose-festival" }),
  wearable({ id: "snowDress", storeId: "boutique", type: "dress", name: "Snowflake gown", cost: 260, icon: "Dress", asset: "dress-snowflake-gown" }),
  wearable({ id: "mintHarborDress", storeId: "boutique", type: "dress", name: "Mint harbor dress", cost: 220, icon: "Dress", asset: "dress-mint-harbor" }),
  wearable({ id: "lilacHarborDress", storeId: "boutique", type: "dress", name: "Lilac harbor dress", cost: 240, icon: "Dress", asset: "dress-lilac-harbor" }),
  wearable({ id: "pearlHarborDress", storeId: "boutique", type: "dress", name: "Pearl harbor dress", cost: 260, icon: "Dress", asset: "dress-pearl-harbor" }),
  wearable({ id: "lavenderFestivalDress", storeId: "boutique", type: "dress", name: "Lavender festival dress", cost: 280, icon: "Dress", asset: "dress-lavender-festival" })
];
//#endregion Urban Dress Boutique 洋裝
