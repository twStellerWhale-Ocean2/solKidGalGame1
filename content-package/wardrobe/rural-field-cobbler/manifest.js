import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("rural-field-cobbler");

//#region Rural Field Cobbler 商品
// Field Cobbler 維護郊區鞋子與戶外頭飾。
export const ruralFieldCobblerItems = [
  wearable({ id: "wildBoots", storeId: "fieldCobbler", type: "shoes", name: "Wild trail boots", cost: 160, icon: "Shoes", asset: "shoes-wild-boots" }),
  wearable({ id: "plumBoots", storeId: "fieldCobbler", type: "shoes", name: "Plum field boots", cost: 170, icon: "Shoes", asset: "shoes-plum-boots" }),
  wearable({ id: "wildTiara", storeId: "fieldCobbler", type: "headTop", name: "Wild trail tiara", cost: 150, icon: "Hat", asset: "headtop-wild-tiara" }),
  wearable({ id: "auroraTiara", storeId: "fieldCobbler", type: "headTop", name: "Aurora field tiara", cost: 160, icon: "Hat", asset: "headtop-aurora-tiara" })
];
//#endregion Rural Field Cobbler 商品
