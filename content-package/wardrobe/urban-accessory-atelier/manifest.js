import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("urban-accessory-atelier");

//#region Urban Accessory Atelier 商品
// Accessory Atelier 維護城市帽飾與小配件。
export const urbanAccessoryAtelierItems = [
  wearable({ id: "goldCrown", storeId: "accessoryShop", type: "headTop", name: "Tiny gold crown", cost: 140, icon: "Hat", asset: "headtop-gold-crown" }),
  wearable({ id: "roseCrown", storeId: "accessoryShop", type: "headTop", name: "Tiny rose crown", cost: 160, icon: "Hat", asset: "headtop-rose-crown" }),
  wearable({ id: "silverCrown", storeId: "accessoryShop", type: "headTop", name: "Tiny silver crown", cost: 180, icon: "Hat", asset: "headtop-silver-crown" }),
  wearable({ id: "lilacCrown", storeId: "accessoryShop", type: "headTop", name: "Tiny lilac crown", cost: 200, icon: "Hat", asset: "headtop-lilac-crown" }),
  wearable({ id: "mintCrown", storeId: "accessoryShop", type: "headTop", name: "Tiny mint crown", cost: 220, icon: "Hat", asset: "headtop-mint-crown" }),
  wearable({ id: "silkRibbon", storeId: "accessoryShop", type: "headSide", name: "Silk party ribbon", cost: 120, icon: "Acc", asset: "headside-silk-ribbon" }),
  wearable({ id: "roundGlasses", storeId: "accessoryShop", type: "faceEyes", name: "Round storybook glasses", cost: 120, icon: "Acc", asset: "faceeyes-round-glasses" }),
  wearable({ id: "starMask", storeId: "accessoryShop", type: "faceMask", name: "Lavender star mask", cost: 160, icon: "Acc", asset: "facemask-star-mask" }),
  wearable({ id: "pearlNecklace", storeId: "accessoryShop", type: "neck", name: "Pearl heart necklace", cost: 150, icon: "Acc", asset: "neck-pearl-necklace" }),
  wearable({ id: "pearlBag", storeId: "accessoryShop", type: "hand", name: "Pearl shell bag", cost: 170, icon: "Acc", asset: "hand-pearl-bag" }),
  wearable({ id: "mintRibbon", storeId: "accessoryShop", type: "headSide", name: "Mint party ribbon", cost: 140, icon: "Acc", asset: "headside-mint-ribbon" })
];
//#endregion Urban Accessory Atelier 商品
