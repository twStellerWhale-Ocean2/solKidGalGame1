import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("urban-tailor-studio");

//#region Urban Tailor Studio 商品
// Tailor Studio 維護城市日常上衣與褲裙。
export const urbanTailorStudioItems = [
  wearable({ id: "skyBlouse", storeId: "tailorStudio", type: "top", name: "Sky blue puff blouse", cost: 100, icon: "Top", asset: "top-sky-blouse" }),
  wearable({ id: "peachSailorTop", storeId: "tailorStudio", type: "top", name: "Peach sailor top", cost: 120, icon: "Top", asset: "top-peach-sailor" }),
  wearable({ id: "mintBlouse", storeId: "tailorStudio", type: "top", name: "Mint puff blouse", cost: 130, icon: "Top", asset: "top-mint-blouse" }),
  wearable({ id: "lilacBlouse", storeId: "tailorStudio", type: "top", name: "Lilac puff blouse", cost: 140, icon: "Top", asset: "top-lilac-blouse" }),
  wearable({ id: "creamBlouse", storeId: "tailorStudio", type: "top", name: "Cream puff blouse", cost: 150, icon: "Top", asset: "top-cream-blouse" }),
  wearable({ id: "navyShorts", storeId: "tailorStudio", type: "bottom", name: "Navy story shorts", cost: 90, icon: "Bottom", asset: "bottom-navy-shorts" }),
  wearable({ id: "roseSkirt", storeId: "tailorStudio", type: "bottom", name: "Rose ribbon skirt", cost: 110, icon: "Bottom", asset: "bottom-rose-skirt" }),
  wearable({ id: "wildShorts", storeId: "tailorStudio", type: "bottom", name: "Wild story shorts", cost: 130, icon: "Bottom", asset: "bottom-wild-shorts" }),
  wearable({ id: "plumShorts", storeId: "tailorStudio", type: "bottom", name: "Plum story shorts", cost: 150, icon: "Bottom", asset: "bottom-plum-shorts" }),
  wearable({ id: "cocoaShorts", storeId: "tailorStudio", type: "bottom", name: "Cocoa story shorts", cost: 170, icon: "Bottom", asset: "bottom-cocoa-shorts" })
];
//#endregion Urban Tailor Studio 商品
