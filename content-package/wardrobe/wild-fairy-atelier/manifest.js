import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("wild-fairy-atelier");

//#region Wild Fairy Atelier 商品
// Fairy Atelier 維護 Wild 洋裝與童話配件。
export const wildFairyAtelierItems = [
  wearable({ id: "coralFestivalDress", storeId: "fairyAtelier", type: "dress", name: "Coral fairy festival dress", cost: 250, icon: "Dress", asset: "dress-coral-festival" }),
  wearable({ id: "starlightGown", storeId: "fairyAtelier", type: "dress", name: "Starlight fairy gown", cost: 270, icon: "Dress", asset: "dress-starlight-gown" }),
  wearable({ id: "auroraGown", storeId: "fairyAtelier", type: "dress", name: "Aurora fairy gown", cost: 290, icon: "Dress", asset: "dress-aurora-gown" }),
  wearable({ id: "silverGlasses", storeId: "fairyAtelier", type: "faceEyes", name: "Silver fairy glasses", cost: 190, icon: "Acc", asset: "faceeyes-silver-glasses" }),
  wearable({ id: "moonMask", storeId: "fairyAtelier", type: "faceMask", name: "Moon fairy mask", cost: 200, icon: "Acc", asset: "facemask-moon-mask" }),
  wearable({ id: "roseNecklace", storeId: "fairyAtelier", type: "neck", name: "Rose fairy necklace", cost: 210, icon: "Acc", asset: "neck-rose-necklace" }),
  wearable({ id: "lilacBag", storeId: "fairyAtelier", type: "hand", name: "Lilac fairy bag", cost: 220, icon: "Acc", asset: "hand-lilac-bag" })
];
//#endregion Wild Fairy Atelier 商品
