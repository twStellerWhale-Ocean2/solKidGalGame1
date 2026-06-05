import { categories } from "./_shared/categories.js";
import { paperDollBaseLayer, paperDollCharacterThumb } from "./_shared/paper-doll-assets.js";
import { outfitSlots, paperDollLayerOrder } from "./_shared/rules.js";
import { castleRoyalCloakRoomItems } from "./castle-royal-cloak-room/manifest.js";
import { castleSeamstressItems } from "./castle-seamstress/manifest.js";
import { ruralFieldCobblerItems } from "./rural-field-cobbler/manifest.js";
import { ruralWorkwearStallItems } from "./rural-workwear-stall/manifest.js";
import { starterItems } from "./starter/manifest.js";
import { urbanAccessoryAtelierItems } from "./urban-accessory-atelier/manifest.js";
import { urbanDressBoutiqueItems } from "./urban-dress-boutique/manifest.js";
import { urbanHairSalonItems } from "./urban-hair-salon/manifest.js";
import { urbanShoeShopItems } from "./urban-shoe-shop/manifest.js";
import { urbanTailorStudioItems } from "./urban-tailor-studio/manifest.js";
import { wildDwarfCottageItems } from "./wild-dwarf-cottage/manifest.js";
import { wildFairyAtelierItems } from "./wild-fairy-atelier/manifest.js";

//#region 匯出共用規則
// Runtime 只從這裡拿衣櫃分類、slot 規則與紙娃娃底圖。
export { categories, outfitSlots, paperDollBaseLayer, paperDollCharacterThumb, paperDollLayerOrder };
//#endregion 匯出共用規則

//#region 衣物包匯總
// 新增衣物包時只新增 content-package/wardrobe/<pack>/manifest.js，再在這裡匯入與展開。
export const wardrobeItems = [
  ...starterItems,
  ...urbanHairSalonItems,
  ...urbanTailorStudioItems,
  ...urbanDressBoutiqueItems,
  ...urbanShoeShopItems,
  ...urbanAccessoryAtelierItems,
  ...castleSeamstressItems,
  ...castleRoyalCloakRoomItems,
  ...ruralWorkwearStallItems,
  ...ruralFieldCobblerItems,
  ...wildDwarfCottageItems,
  ...wildFairyAtelierItems
];

// 既有 runtime 名稱仍叫 shopItems；此 alias 讓舊流程不用同步大改。
export const shopItems = wardrobeItems;
//#endregion 衣物包匯總
