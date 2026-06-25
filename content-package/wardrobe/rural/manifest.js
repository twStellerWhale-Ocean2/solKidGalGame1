import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("rural");

//#region Countryside 衣物資源包（郊區鄉村）
// 內部 pack id 維持 rural；郊區單一服飾店 storeId="workwearStall"（Workwear Stall）。
export const ruralItems = [
  wearable({ id: "countrysideKerchiefShortHair", storeId: "workwearStall", type: "hairstyle", name: "Kerchief short hair", cost: 120, icon: "Hair", asset: "hairstyle-kerchief-short-hair" }),
  wearable({ id: "countrysideLowPonytail", storeId: "workwearStall", type: "hairstyle", name: "Simple low ponytail", cost: 110, icon: "Hair", asset: "hairstyle-simple-low-ponytail" }),
  wearable({ id: "countrysideLinenBraid", storeId: "workwearStall", type: "hairstyle", name: "Linen-tie braid", cost: 115, icon: "Hair", asset: "hairstyle-linen-tie-braid" }),
  wearable({ id: "countrysideNaturalShortCurls", storeId: "workwearStall", type: "hairstyle", name: "Natural short curls", cost: 115, icon: "Hair", asset: "hairstyle-natural-short-curls" }),

  wearable({ id: "countrysideLinenApronDress", storeId: "workwearStall", type: "outfit", name: "Linen white apron dress", cost: 170, icon: "Outfit", asset: "outfit-linen-white-apron-dress" }),
  wearable({ id: "countrysideBeigeLinenDress", storeId: "workwearStall", type: "outfit", name: "Beige cotton-linen dress", cost: 160, icon: "Outfit", asset: "outfit-beige-linen-dress" }),
  wearable({ id: "countrysideGrassGreenVillageDress", storeId: "workwearStall", type: "outfit", name: "Grass green village dress", cost: 165, icon: "Outfit", asset: "outfit-grass-green-village-dress" }),
  wearable({ id: "countrysideTerracottaJacketSkirt", storeId: "workwearStall", type: "outfit", name: "Terracotta jacket skirt", cost: 175, icon: "Outfit", asset: "outfit-terracotta-jacket-skirt" }),

  wearable({ id: "countrysideWoodenClogs", storeId: "workwearStall", type: "shoes", name: "Wooden clogs", cost: 90, icon: "Shoes", asset: "shoes-wooden-clogs" }),
  wearable({ id: "countrysideRoughLeatherBoots", storeId: "workwearStall", type: "shoes", name: "Rough leather short boots", cost: 105, icon: "Shoes", asset: "shoes-rough-leather-short-boots" }),
  wearable({ id: "countrysideGrassWalkingShoes", storeId: "workwearStall", type: "shoes", name: "Grass walking shoes", cost: 95, icon: "Shoes", asset: "shoes-grass-walking" }),
  wearable({ id: "countrysideSimpleClothShoes", storeId: "workwearStall", type: "shoes", name: "Simple cloth shoes", cost: 85, icon: "Shoes", asset: "shoes-simple-cloth" }),

  wearable({ id: "countrysideHeadKerchief", storeId: "workwearStall", type: "headTop", name: "Head kerchief", cost: 80, icon: "Acc", asset: "headtop-head-kerchief" }),
  wearable({ id: "countrysideStrawBasket", storeId: "workwearStall", type: "hand", name: "Straw basket", cost: 110, icon: "Acc", asset: "hand-straw-basket" }),
  wearable({ id: "countrysideClothCap", storeId: "workwearStall", type: "headTop", name: "Cloth cap", cost: 90, icon: "Acc", asset: "headtop-cloth-cap" }),
  wearable({ id: "countrysideWoodBracelet", storeId: "workwearStall", type: "hand", name: "Wooden bracelet", cost: 75, icon: "Acc", asset: "hand-wooden-bracelet" })
];
//#endregion Countryside 衣物資源包
