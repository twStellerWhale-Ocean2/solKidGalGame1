import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("urban-hair-salon");

//#region Urban Hair Salon 商品
// Hair Salon 只維護髮型類商品。
export const urbanHairSalonItems = [
  wearable({ id: "twinBraidHair", storeId: "hairSalon", type: "hairstyle", name: "Twin-braid story hair", cost: 110, icon: "Hair", asset: "hairstyle-twin-braid" }),
  wearable({ id: "blondeBobHair", storeId: "hairSalon", type: "hairstyle", name: "Blonde bob story hair", cost: 130, icon: "Hair", asset: "hairstyle-blonde-bob" }),
  wearable({ id: "chestnutTwinBraidHair", storeId: "hairSalon", type: "hairstyle", name: "Chestnut twin-braid hair", cost: 150, icon: "Hair", asset: "hairstyle-twin-braid-chestnut" }),
  wearable({ id: "roseTwinBraidHair", storeId: "hairSalon", type: "hairstyle", name: "Rose twin-braid hair", cost: 170, icon: "Hair", asset: "hairstyle-twin-braid-rose" }),
  wearable({ id: "midnightTwinBraidHair", storeId: "hairSalon", type: "hairstyle", name: "Midnight twin-braid hair", cost: 190, icon: "Hair", asset: "hairstyle-twin-braid-midnight" }),
  wearable({ id: "auburnTwinBraidHair", storeId: "hairSalon", type: "hairstyle", name: "Auburn twin-braid hair", cost: 210, icon: "Hair", asset: "hairstyle-twin-braid-auburn" }),
  wearable({ id: "honeyBobHair", storeId: "hairSalon", type: "hairstyle", name: "Honey bob hair", cost: 150, icon: "Hair", asset: "hairstyle-blonde-bob-honey" }),
  wearable({ id: "silverBobHair", storeId: "hairSalon", type: "hairstyle", name: "Silver bob hair", cost: 180, icon: "Hair", asset: "hairstyle-blonde-bob-silver" }),
  wearable({ id: "lavenderBobHair", storeId: "hairSalon", type: "hairstyle", name: "Lavender bob hair", cost: 200, icon: "Hair", asset: "hairstyle-blonde-bob-lavender" }),
  wearable({ id: "cocoaBobHair", storeId: "hairSalon", type: "hairstyle", name: "Cocoa bob hair", cost: 220, icon: "Hair", asset: "hairstyle-blonde-bob-cocoa" })
];
//#endregion Urban Hair Salon 商品
