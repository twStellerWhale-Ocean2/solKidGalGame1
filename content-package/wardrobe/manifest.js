import { categories } from "./_shared/categories.js";
import {
  characterRegistry,
  defaultProfileColorFor,
  defaultActiveCharacterId,
  paperDollBaseLayer,
  isPlayableCharacterId,
  normalizeProfileColor,
  profileColorPalette,
  playableCharacterById,
  backgroundPatternIds,
  normalizeBackgroundPattern,
  randomProfileColor,
  randomBackgroundPattern
} from "./_shared/paper-doll-assets.js";
import {
  outfitSlots,
  paperDollLayerOrder,
  wardrobeLayerBoundsByType,
  wardrobeLayerBoundsForType
} from "./_shared/rules.js";
import { castleItems } from "./castle/manifest.js";
import { ruralItems } from "./rural/manifest.js";
import { starterItems } from "./starter/manifest.js";
import { urbanItems } from "./urban/manifest.js";
import { wildItems } from "./wild/manifest.js";

//#region 匯出共用規則
// Runtime 只從這裡拿衣櫃分類、slot 規則與紙娃娃底圖。
export {
  categories,
  characterRegistry,
  defaultActiveCharacterId,
  defaultProfileColorFor,
  outfitSlots,
  paperDollBaseLayer,
  paperDollLayerOrder,
  wardrobeLayerBoundsByType,
  wardrobeLayerBoundsForType,
  isPlayableCharacterId,
  normalizeProfileColor,
  playableCharacterById,
  profileColorPalette,
  backgroundPatternIds,
  normalizeBackgroundPattern,
  randomProfileColor,
  randomBackgroundPattern
};
//#endregion 匯出共用規則

//#region 衣物包匯總
// 新增衣物包時只新增 content-package/wardrobe/<pack>/manifest.js，再在這裡匯入與展開。
export const wardrobeItems = [
  ...starterItems,
  ...urbanItems,
  ...castleItems,
  ...ruralItems,
  ...wildItems
];

// 既有 runtime 名稱仍叫 shopItems；此 alias 讓舊流程不用同步大改。
export const shopItems = wardrobeItems;
//#endregion 衣物包匯總
