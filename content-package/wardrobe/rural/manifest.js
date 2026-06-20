import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("rural");

//#region Rural 衣物資源包（issue #210：一區一店一包）
// 郊區單一服飾店 storeId="workwearStall"（Workwear Stall）之資源包，含多類別衣物：
// 上衣／下身／鞋／頭飾（由原 rural-workwear-stall／rural-field-cobbler 兩包合併，itemId 全數保留）。
export const ruralItems = [
  // 上衣／下身（原 rural-workwear-stall）
  wearable({ id: "violetSailorTop", storeId: "workwearStall", type: "top", name: "Violet workday sailor top", cost: 150, icon: "Top", asset: "top-violet-sailor" }),
  wearable({ id: "butterSailorTop", storeId: "workwearStall", type: "top", name: "Butter workday sailor top", cost: 160, icon: "Top", asset: "top-butter-sailor" }),
  wearable({ id: "mintSkirt", storeId: "workwearStall", type: "bottom", name: "Mint field skirt", cost: 150, icon: "Bottom", asset: "bottom-mint-skirt" }),
  wearable({ id: "sunSkirt", storeId: "workwearStall", type: "bottom", name: "Sun field skirt", cost: 160, icon: "Bottom", asset: "bottom-sun-skirt" }),
  wearable({ id: "coralSkirt", storeId: "workwearStall", type: "bottom", name: "Coral field skirt", cost: 170, icon: "Bottom", asset: "bottom-coral-skirt" }),
  // 鞋／頭飾（原 rural-field-cobbler）
  wearable({ id: "wildBoots", storeId: "workwearStall", type: "shoes", name: "Wild trail boots", cost: 160, icon: "Shoes", asset: "shoes-wild-boots" }),
  wearable({ id: "plumBoots", storeId: "workwearStall", type: "shoes", name: "Plum field boots", cost: 170, icon: "Shoes", asset: "shoes-plum-boots" }),
  wearable({ id: "wildTiara", storeId: "workwearStall", type: "headTop", name: "Wild trail tiara", cost: 150, icon: "Hat", asset: "headtop-wild-tiara" }),
  wearable({ id: "auroraTiara", storeId: "workwearStall", type: "headTop", name: "Aurora field tiara", cost: 160, icon: "Hat", asset: "headtop-aurora-tiara" })
];
//#endregion Rural 衣物資源包
