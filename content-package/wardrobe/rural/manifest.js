import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("rural");

//#region Rural 衣物資源包（issue #210：一區一店一包）
// 郊區單一服飾店 storeId="workwearStall"（Workwear Stall）之資源包，含多類別衣物：
// 鞋／頭飾（原含上衣／下身，issue #251 移除；其餘由原 rural-workwear-stall／rural-field-cobbler 合併，itemId 保留）。
export const ruralItems = [
  // 鞋／頭飾（原 rural-field-cobbler）
  wearable({ id: "wildBoots", storeId: "workwearStall", type: "shoes", name: "Wild trail boots", cost: 160, icon: "Shoes", asset: "shoes-wild-boots" }),
  wearable({ id: "plumBoots", storeId: "workwearStall", type: "shoes", name: "Plum field boots", cost: 170, icon: "Shoes", asset: "shoes-plum-boots" }),
  wearable({ id: "wildTiara", storeId: "workwearStall", type: "headTop", name: "Wild trail tiara", cost: 150, icon: "Hat", asset: "headtop-wild-tiara" }),
  wearable({ id: "auroraTiara", storeId: "workwearStall", type: "headTop", name: "Aurora field tiara", cost: 160, icon: "Hat", asset: "headtop-aurora-tiara" })
];
//#endregion Rural 衣物資源包
