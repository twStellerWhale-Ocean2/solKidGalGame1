import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("wild");

//#region Fairy Forest 衣物資源包（童話森林）
// 內部 pack id 維持 wild；野地單一服飾店 storeId="fairyAtelier"（Fairy Atelier）。
export const wildItems = [
  wearable({ id: "fairyFlowerWaveHair", storeId: "fairyAtelier", type: "hairstyle", name: "Flower wreath long waves", cost: 210, icon: "Hair", asset: "hairstyle-flower-wreath-long-waves" }),
  wearable({ id: "fairyVineBraid", storeId: "fairyAtelier", type: "hairstyle", name: "Vine-braided hair", cost: 205, icon: "Hair", asset: "hairstyle-vine-braid" }),
  wearable({ id: "fairyElfSideBraid", storeId: "fairyAtelier", type: "hairstyle", name: "Elf side braid", cost: 200, icon: "Hair", asset: "hairstyle-elf-side-braid" }),
  wearable({ id: "fairyStarlightHalfUpHair", storeId: "fairyAtelier", type: "hairstyle", name: "Starlight half-up hair", cost: 215, icon: "Hair", asset: "hairstyle-starlight-half-up" }),

  wearable({ id: "fairyPetalDress", storeId: "fairyAtelier", type: "outfit", name: "Petal fairy dress", cost: 280, icon: "Outfit", asset: "outfit-petal-fairy-dress" }),
  wearable({ id: "fairyVineLongSkirt", storeId: "fairyAtelier", type: "outfit", name: "Vine-decorated long skirt", cost: 270, icon: "Outfit", asset: "outfit-vine-decorated-long-skirt" }),
  wearable({ id: "fairyGauzeForestPrincessDress", storeId: "fairyAtelier", type: "outfit", name: "Gauze forest princess dress", cost: 285, icon: "Outfit", asset: "outfit-gauze-forest-princess-dress" }),
  wearable({ id: "fairyAquaMagicDress", storeId: "fairyAtelier", type: "outfit", name: "Aqua magic dress", cost: 290, icon: "Outfit", asset: "outfit-aqua-magic-dress" }),

  wearable({ id: "fairyVineSandals", storeId: "fairyAtelier", type: "shoes", name: "Vine-lace sandals", cost: 180, icon: "Shoes", asset: "shoes-vine-lace-sandals" }),
  wearable({ id: "fairyFlowerShoes", storeId: "fairyAtelier", type: "shoes", name: "Flower-decorated shoes", cost: 175, icon: "Shoes", asset: "shoes-flower-decorated" }),
  wearable({ id: "fairyElfShortBoots", storeId: "fairyAtelier", type: "shoes", name: "Elf short boots", cost: 185, icon: "Shoes", asset: "shoes-elf-short-boots" }),
  wearable({ id: "fairyLeafSoftShoes", storeId: "fairyAtelier", type: "shoes", name: "Leaf soft-sole shoes", cost: 170, icon: "Shoes", asset: "shoes-leaf-soft-sole" }),

  wearable({ id: "fairyFlowerWreath", storeId: "fairyAtelier", type: "headTop", name: "Flower wreath", cost: 160, icon: "Acc", asset: "headtop-flower-wreath" }),
  wearable({ id: "fairyCrystalPendant", storeId: "fairyAtelier", type: "neck", name: "Crystal pendant", cost: 190, icon: "Acc", asset: "neck-crystal-pendant" }),
  wearable({ id: "fairyStarHairClip", storeId: "fairyAtelier", type: "headSide", name: "Star hair clip", cost: 150, icon: "Acc", asset: "headside-star-hair-clip" }),
  wearable({ id: "fairyVineBracelet", storeId: "fairyAtelier", type: "hand", name: "Vine bracelet", cost: 145, icon: "Acc", asset: "hand-vine-bracelet" })
];
//#endregion Fairy Forest 衣物資源包
