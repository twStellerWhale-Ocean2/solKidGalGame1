import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("wild-dwarf-cottage");

//#region Wild Dwarf Cottage 商品
// Dwarf Cottage 維護 Wild 外套與靴子。
export const wildDwarfCottageItems = [
  wearable({ id: "mossCloak", storeId: "dwarfCottage", type: "outer", name: "Moss helper cloak", cost: 220, icon: "Outer", asset: "outer-moss-cloak", slot: "outerFront" }),
  wearable({ id: "fernCloak", storeId: "dwarfCottage", type: "outer", name: "Fern helper cloak", cost: 230, icon: "Outer", asset: "outer-fern-cloak", slot: "outerFront" }),
  wearable({ id: "violetCloak", storeId: "dwarfCottage", type: "outer", name: "Violet helper cloak", cost: 240, icon: "Outer", asset: "outer-violet-cloak", slot: "outerFront" }),
  wearable({ id: "autumnCloak", storeId: "dwarfCottage", type: "outer", name: "Autumn helper cloak", cost: 250, icon: "Outer", asset: "outer-autumn-cloak", slot: "outerFront" }),
  wearable({ id: "cocoaBoots", storeId: "dwarfCottage", type: "shoes", name: "Cocoa dwarf boots", cost: 200, icon: "Shoes", asset: "shoes-cocoa-boots" }),
  wearable({ id: "silverBoots", storeId: "dwarfCottage", type: "shoes", name: "Silver dwarf boots", cost: 210, icon: "Shoes", asset: "shoes-silver-boots" })
];
//#endregion Wild Dwarf Cottage 商品
