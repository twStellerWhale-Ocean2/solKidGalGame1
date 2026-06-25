import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("urban");

//#region Urban 衣物資源包（城鎮街區）
// 都會區單一服飾店 storeId="boutique"（Dress Boutique）。
export const urbanItems = [
  wearable({ id: "urbanRibbonLongHair", storeId: "boutique", type: "hairstyle", name: "Ribbon long straight hair", cost: 140, icon: "Hair", asset: "hairstyle-ribbon-long-straight" }),
  wearable({ id: "urbanSideBraid", storeId: "boutique", type: "hairstyle", name: "Side braid", cost: 135, icon: "Hair", asset: "hairstyle-side-braid" }),
  wearable({ id: "urbanTwinBraids", storeId: "boutique", type: "hairstyle", name: "Twin braids", cost: 135, icon: "Hair", asset: "hairstyle-twin-braids" }),
  wearable({ id: "urbanLowPonytail", storeId: "boutique", type: "hairstyle", name: "Low ponytail", cost: 130, icon: "Hair", asset: "hairstyle-low-ponytail" }),

  wearable({ id: "urbanMilkTeaCoat", storeId: "boutique", type: "outfit", name: "Milk-tea tailored coat", cost: 220, icon: "Outfit", asset: "outfit-milk-tea-tailored-coat" }),
  wearable({ id: "urbanGreyBlueTownDress", storeId: "boutique", type: "outfit", name: "Grey-blue town dress", cost: 205, icon: "Outfit", asset: "outfit-grey-blue-town-dress" }),
  wearable({ id: "urbanPlaidVestLongSkirt", storeId: "boutique", type: "outfit", name: "Plaid vest long skirt", cost: 215, icon: "Outfit", asset: "outfit-plaid-vest-long-skirt" }),
  wearable({ id: "urbanOliveShortCapeSet", storeId: "boutique", type: "outfit", name: "Olive short cape set", cost: 230, icon: "Outfit", asset: "outfit-olive-short-cape-set" }),

  wearable({ id: "urbanBrownLeatherBoots", storeId: "boutique", type: "shoes", name: "Brown leather ankle boots", cost: 150, icon: "Shoes", asset: "shoes-brown-leather-ankle-boots" }),
  wearable({ id: "urbanBuckleLeatherShoes", storeId: "boutique", type: "shoes", name: "Buckle leather shoes", cost: 140, icon: "Shoes", asset: "shoes-buckle-leather" }),
  wearable({ id: "urbanWalkingBoots", storeId: "boutique", type: "shoes", name: "Town walking boots", cost: 145, icon: "Shoes", asset: "shoes-town-walking-boots" }),
  wearable({ id: "urbanLowHeelLaceShoes", storeId: "boutique", type: "shoes", name: "Low-heel lace shoes", cost: 145, icon: "Shoes", asset: "shoes-low-heel-lace" }),

  wearable({ id: "urbanLeatherWaistBag", storeId: "boutique", type: "hand", name: "Leather waist bag", cost: 130, icon: "Acc", asset: "hand-leather-waist-bag" }),
  wearable({ id: "urbanSmallRoundHat", storeId: "boutique", type: "headTop", name: "Small round hat", cost: 120, icon: "Acc", asset: "headtop-small-round-hat" }),
  wearable({ id: "urbanPlaidScarf", storeId: "boutique", type: "neck", name: "Plaid scarf", cost: 115, icon: "Acc", asset: "neck-plaid-scarf" }),
  wearable({ id: "urbanHandbag", storeId: "boutique", type: "hand", name: "Handheld small bag", cost: 125, icon: "Acc", asset: "hand-small-town-bag" })
];
//#endregion Urban 衣物資源包
