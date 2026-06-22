import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("castle");

//#region Castle 衣物資源包（issue #210：一區一店一包）
// 城堡區單一服飾店 storeId="castleSeamstress"（Castle Seamstress）之資源包，含多類別衣物：
// 髮型／上衣／下身／外套／頭飾（由原 castle-seamstress／castle-royal-cloak-room 合併，itemId 全數保留）。
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
  // 上衣／下身（原 castle-seamstress）
  wearable({ id: "coralBlouse", storeId: "castleSeamstress", type: "top", name: "Coral castle blouse", cost: 90, icon: "Top", asset: "top-coral-blouse" }),
  wearable({ id: "roseSailorTop", storeId: "castleSeamstress", type: "top", name: "Rose sailor top", cost: 110, icon: "Top", asset: "top-rose-sailor" }),
  wearable({ id: "aquaSailorTop", storeId: "castleSeamstress", type: "top", name: "Aqua sailor top", cost: 130, icon: "Top", asset: "top-aqua-sailor" }),
  wearable({ id: "skyShorts", storeId: "castleSeamstress", type: "bottom", name: "Sky castle shorts", cost: 100, icon: "Bottom", asset: "bottom-sky-shorts" }),
  wearable({ id: "lilacSkirt", storeId: "castleSeamstress", type: "bottom", name: "Lilac castle skirt", cost: 120, icon: "Bottom", asset: "bottom-lilac-skirt" }),
  // 頭飾（issue #244：移除 outerwear 外套類型）
  wearable({ id: "pearlTiara", storeId: "castleSeamstress", type: "headTop", name: "Pearl royal tiara", cost: 80, icon: "Hat", asset: "headtop-pearl-tiara" }),
  wearable({ id: "starryTiara", storeId: "castleSeamstress", type: "headTop", name: "Starry royal tiara", cost: 100, icon: "Hat", asset: "headtop-starry-tiara" }),
  wearable({ id: "rubyTiara", storeId: "castleSeamstress", type: "headTop", name: "Ruby royal tiara", cost: 120, icon: "Hat", asset: "headtop-ruby-tiara" })
];
//#endregion Castle 衣物資源包
