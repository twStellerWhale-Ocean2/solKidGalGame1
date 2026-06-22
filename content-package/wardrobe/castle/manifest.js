import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("castle");

//#region Castle 衣物資源包（issue #210：一區一店一包）
// 城堡區單一服飾店 storeId="castleSeamstress"（Castle Seamstress）之資源包，含多類別衣物：
// 髮型／頭飾（原含上衣／下身／外套，分別於 #251／#244 移除；其餘 itemId 保留以相容存檔）。
// 髮型（原 urban hair-salon）於本次調整自 urban 包搬入，itemId 不變以相容既有存檔。
export const castleItems = [
  // 髮型（自 urban 搬入）
  wearable({ id: "twinBraidHair", storeId: "castleSeamstress", type: "hairstyle", name: "Twin-braid story hair", cost: 110, icon: "Hair", asset: "hairstyle-twin-braid" }),
  wearable({ id: "blondeBobHair", storeId: "castleSeamstress", type: "hairstyle", name: "Blonde bob story hair", cost: 130, icon: "Hair", asset: "hairstyle-blonde-bob" }),
  wearable({ id: "chestnutTwinBraidHair", storeId: "castleSeamstress", type: "hairstyle", name: "Chestnut twin-braid hair", cost: 150, icon: "Hair", asset: "hairstyle-twin-braid-chestnut" }),
  wearable({ id: "roseTwinBraidHair", storeId: "castleSeamstress", type: "hairstyle", name: "Rose twin-braid hair", cost: 170, icon: "Hair", asset: "hairstyle-twin-braid-rose" }),
  wearable({ id: "midnightTwinBraidHair", storeId: "castleSeamstress", type: "hairstyle", name: "Midnight twin-braid hair", cost: 190, icon: "Hair", asset: "hairstyle-twin-braid-midnight" }),
  wearable({ id: "auburnTwinBraidHair", storeId: "castleSeamstress", type: "hairstyle", name: "Auburn twin-braid hair", cost: 210, icon: "Hair", asset: "hairstyle-twin-braid-auburn" }),
  wearable({ id: "honeyBobHair", storeId: "castleSeamstress", type: "hairstyle", name: "Honey bob hair", cost: 150, icon: "Hair", asset: "hairstyle-blonde-bob-honey" }),
  wearable({ id: "silverBobHair", storeId: "castleSeamstress", type: "hairstyle", name: "Silver bob hair", cost: 180, icon: "Hair", asset: "hairstyle-blonde-bob-silver" }),
  wearable({ id: "lavenderBobHair", storeId: "castleSeamstress", type: "hairstyle", name: "Lavender bob hair", cost: 200, icon: "Hair", asset: "hairstyle-blonde-bob-lavender" }),
  wearable({ id: "cocoaBobHair", storeId: "castleSeamstress", type: "hairstyle", name: "Cocoa bob hair", cost: 220, icon: "Hair", asset: "hairstyle-blonde-bob-cocoa" }),
  // 頭飾（issue #244：移除 outerwear 外套類型；issue #251：移除分件 tops/bottoms 上衣下身類型）
  wearable({ id: "pearlTiara", storeId: "castleSeamstress", type: "headTop", name: "Pearl royal tiara", cost: 80, icon: "Hat", asset: "headtop-pearl-tiara" }),
  wearable({ id: "starryTiara", storeId: "castleSeamstress", type: "headTop", name: "Starry royal tiara", cost: 100, icon: "Hat", asset: "headtop-starry-tiara" }),
  wearable({ id: "rubyTiara", storeId: "castleSeamstress", type: "headTop", name: "Ruby royal tiara", cost: 120, icon: "Hat", asset: "headtop-ruby-tiara" })
];
//#endregion Castle 衣物資源包
