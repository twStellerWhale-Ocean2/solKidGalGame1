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
import { buildWardrobeItem } from "./_shared/item-helpers.js";
import { wardrobeRaw } from "./index.generated.js";

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

//#region 衣物 registry（衍生式）
// issue #267：衣物單品單一事實來源＝各包素材旁 sidecar（content-package/wardrobe/<pack>/assets/layers/<slug>.metadata.json）。
// scripts/genWardrobeIndex.mjs 掃描衍生出 committed index.generated.js（wardrobeRaw），runtime 只讀生成檔（純靜態相容、不 readdir）。
// 新增/移除單品＝增刪素材及其 sidecar 後重生 index，不需手動同步多檔；buildWardrobeItem 由 raw 還原既有 item 形狀（image≡layers[0].src）。
export const wardrobeItems = wardrobeRaw.map(buildWardrobeItem);

// 既有 runtime 名稱仍叫 shopItems；此 alias 讓舊流程不用同步大改。
export const shopItems = wardrobeItems;
//#endregion 衣物 registry
