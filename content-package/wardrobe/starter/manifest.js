import { paperDollBaseLayer } from "../_shared/paper-doll-assets.js";

//#region 初始衣物
// starter 外觀保留為舊存檔相容 item；目前四位公主 base 已包含短髮與 playwear，避免預設外觀重複疊圖。
export const starterItems = [
  {
    id: "softBrownHair",
    storeId: "starter",
    type: "hairstyle",
    name: "Soft brown story hair",
    cost: 0,
    icon: "Hair",
    image: paperDollBaseLayer,
    layers: []
  },
  {
    id: "yumiStarterHair",
    storeId: "starter",
    type: "hairstyle",
    name: "Yumi silver bob hair",
    cost: 0,
    icon: "Hair",
    image: paperDollBaseLayer,
    layers: []
  },
  {
    id: "solStarterHair",
    storeId: "starter",
    type: "hairstyle",
    name: "Mary honey bob hair",
    cost: 0,
    icon: "Hair",
    image: paperDollBaseLayer,
    layers: []
  },
  {
    id: "rosaStarterHair",
    storeId: "starter",
    type: "hairstyle",
    name: "Rosa chestnut braid hair",
    cost: 0,
    icon: "Hair",
    image: paperDollBaseLayer,
    layers: []
  },
  {
    id: "starterPajama",
    storeId: "starter",
    type: "outfit",
    name: "Starter rose play outfit",
    cost: 0,
    icon: "Outfit",
    image: paperDollBaseLayer,
    layers: []
  }
];
//#endregion 初始衣物
