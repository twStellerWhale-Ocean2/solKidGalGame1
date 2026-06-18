import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("rural-workwear-stall");

//#region Rural Workwear Stall 商品
// Workwear Stall 維護郊區工作風上衣與褲裙。
export const ruralWorkwearStallItems = [
  wearable({ id: "violetSailorTop", storeId: "workwearStall", type: "top", name: "Violet workday sailor top", cost: 150, icon: "Top", asset: "top-violet-sailor" }),
  wearable({ id: "butterSailorTop", storeId: "workwearStall", type: "top", name: "Butter workday sailor top", cost: 160, icon: "Top", asset: "top-butter-sailor" }),
  wearable({ id: "mintSkirt", storeId: "workwearStall", type: "bottom", name: "Mint field skirt", cost: 150, icon: "Bottom", asset: "bottom-mint-skirt" }),
  wearable({ id: "sunSkirt", storeId: "workwearStall", type: "bottom", name: "Sun field skirt", cost: 160, icon: "Bottom", asset: "bottom-sun-skirt" }),
  wearable({ id: "coralSkirt", storeId: "workwearStall", type: "bottom", name: "Coral field skirt", cost: 170, icon: "Bottom", asset: "bottom-coral-skirt" })
];
//#endregion Rural Workwear Stall 商品
