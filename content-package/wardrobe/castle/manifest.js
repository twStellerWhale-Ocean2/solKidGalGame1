import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("castle");

//#region Castle 衣物資源包（城堡宮廷）
// 城堡區單一服飾店 storeId="castleSeamstress"（Castle Seamstress）。
export const castleItems = [
  wearable({ id: "castleCrownBraidedUpdo", storeId: "castleSeamstress", type: "hairstyle", name: "Crown-braided updo", cost: 220, icon: "Hair", asset: "hairstyle-crown-braided-updo" }),
  wearable({ id: "castlePearlHighBun", storeId: "castleSeamstress", type: "hairstyle", name: "Pearl high bun", cost: 230, icon: "Hair", asset: "hairstyle-pearl-high-bun" }),
  wearable({ id: "castleSideCurlPrincessHair", storeId: "castleSeamstress", type: "hairstyle", name: "Side-curl princess hair", cost: 210, icon: "Hair", asset: "hairstyle-side-curl-princess" }),
  wearable({ id: "castleGoldHairnetLongHair", storeId: "castleSeamstress", type: "hairstyle", name: "Gold hairnet long hair", cost: 240, icon: "Hair", asset: "hairstyle-gold-hairnet-long" }),

  wearable({ id: "castleGoldCourtGown", storeId: "castleSeamstress", type: "outfit", name: "Gold embroidered court gown", cost: 320, icon: "Outfit", asset: "outfit-gold-embroidered-court-gown" }),
  wearable({ id: "castleRoyalBlueTrainDress", storeId: "castleSeamstress", type: "outfit", name: "Royal blue train dress", cost: 300, icon: "Outfit", asset: "outfit-royal-blue-train-dress" }),
  wearable({ id: "castleWineVelvetPrincessDress", storeId: "castleSeamstress", type: "outfit", name: "Wine velvet princess dress", cost: 310, icon: "Outfit", asset: "outfit-wine-velvet-princess-dress" }),
  wearable({ id: "castlePearlWhiteBallGown", storeId: "castleSeamstress", type: "outfit", name: "Pearl white ball gown", cost: 330, icon: "Outfit", asset: "outfit-pearl-white-ball-gown" }),

  wearable({ id: "castlePearlSatinShoes", storeId: "castleSeamstress", type: "shoes", name: "Pearl satin dance shoes", cost: 180, icon: "Shoes", asset: "shoes-pearl-satin-dance" }),
  wearable({ id: "castleGoldTrimCourtHeels", storeId: "castleSeamstress", type: "shoes", name: "Gold-trim court heels", cost: 190, icon: "Shoes", asset: "shoes-gold-trim-court-heels" }),
  wearable({ id: "castleJeweledStrapSoftShoes", storeId: "castleSeamstress", type: "shoes", name: "Jeweled strap soft shoes", cost: 185, icon: "Shoes", asset: "shoes-jeweled-strap-soft" }),
  wearable({ id: "castleRoseEmbroideredShoes", storeId: "castleSeamstress", type: "shoes", name: "Rose embroidered formal shoes", cost: 195, icon: "Shoes", asset: "shoes-rose-embroidered-formal" }),

  wearable({ id: "castleSmallCrown", storeId: "castleSeamstress", type: "headTop", name: "Small royal crown", cost: 240, icon: "Acc", asset: "headtop-small-royal-crown" }),
  wearable({ id: "castlePearlNecklace", storeId: "castleSeamstress", type: "neck", name: "Pearl necklace", cost: 170, icon: "Acc", asset: "neck-pearl-necklace" }),
  wearable({ id: "castleJewelBrooch", storeId: "castleSeamstress", type: "neck", name: "Jewel brooch", cost: 175, icon: "Acc", asset: "neck-jewel-brooch" }),
];
//#endregion Castle 衣物資源包
