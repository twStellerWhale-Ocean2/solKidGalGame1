import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("wild");

//#region Wild 衣物資源包（issue #210：一區一店一包）
// 野地單一服飾店 storeId="fairyAtelier"（Fairy Atelier）之資源包，含多類別衣物：
// 洋裝／配件／外套／鞋（由原 wild-fairy-atelier／wild-dwarf-cottage 兩包合併，itemId 全數保留）。
export const wildItems = [
  // 洋裝／配件（原 wild-fairy-atelier）
  wearable({ id: "coralFestivalDress", storeId: "fairyAtelier", type: "dress", name: "Coral fairy festival dress", cost: 250, icon: "Dress", asset: "dress-coral-festival" }),
  wearable({ id: "starlightGown", storeId: "fairyAtelier", type: "dress", name: "Starlight fairy gown", cost: 270, icon: "Dress", asset: "dress-starlight-gown" }),
  wearable({ id: "auroraGown", storeId: "fairyAtelier", type: "dress", name: "Aurora fairy gown", cost: 290, icon: "Dress", asset: "dress-aurora-gown" }),
  wearable({ id: "silverGlasses", storeId: "fairyAtelier", type: "faceEyes", name: "Silver fairy glasses", cost: 190, icon: "Acc", asset: "faceeyes-silver-glasses" }),
  wearable({ id: "moonMask", storeId: "fairyAtelier", type: "faceMask", name: "Moon fairy mask", cost: 200, icon: "Acc", asset: "facemask-moon-mask" }),
  wearable({ id: "roseNecklace", storeId: "fairyAtelier", type: "neck", name: "Rose fairy necklace", cost: 210, icon: "Acc", asset: "neck-rose-necklace" }),
  wearable({ id: "lilacBag", storeId: "fairyAtelier", type: "hand", name: "Lilac fairy bag", cost: 220, icon: "Acc", asset: "hand-lilac-bag" }),
  // 鞋（issue #244：移除 outerwear 外套類型）
  wearable({ id: "cocoaBoots", storeId: "fairyAtelier", type: "shoes", name: "Cocoa dwarf boots", cost: 200, icon: "Shoes", asset: "shoes-cocoa-boots" }),
  wearable({ id: "silverBoots", storeId: "fairyAtelier", type: "shoes", name: "Silver dwarf boots", cost: 210, icon: "Shoes", asset: "shoes-silver-boots" })
];
//#endregion Wild 衣物資源包
