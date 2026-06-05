import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("castle-seamstress");

//#region Castle Seamstress 商品
// Castle Seamstress 維護城堡風上衣與褲裙。
export const castleSeamstressItems = [
  wearable({ id: "coralBlouse", storeId: "castleSeamstress", type: "top", name: "Coral castle blouse", cost: 90, icon: "Top", asset: "top-coral-blouse" }),
  wearable({ id: "roseSailorTop", storeId: "castleSeamstress", type: "top", name: "Rose sailor top", cost: 110, icon: "Top", asset: "top-rose-sailor" }),
  wearable({ id: "aquaSailorTop", storeId: "castleSeamstress", type: "top", name: "Aqua sailor top", cost: 130, icon: "Top", asset: "top-aqua-sailor" }),
  wearable({ id: "skyShorts", storeId: "castleSeamstress", type: "bottom", name: "Sky castle shorts", cost: 100, icon: "Bottom", asset: "bottom-sky-shorts" }),
  wearable({ id: "lilacSkirt", storeId: "castleSeamstress", type: "bottom", name: "Lilac castle skirt", cost: 120, icon: "Bottom", asset: "bottom-lilac-skirt" })
];
//#endregion Castle Seamstress 商品
