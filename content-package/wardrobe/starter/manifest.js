import { paperDollCharacterThumb } from "../_shared/paper-doll-assets.js";
import { wardrobePackLayer, wardrobePackThumb } from "../_shared/paper-doll-assets.js";

//#region 初始衣物
const hairSalonLayer = (name) => wardrobePackLayer("urban-hair-salon", name);
const tailorLayer = (name) => wardrobePackLayer("urban-tailor-studio", name);

// starter 外觀需以真實 layer 表達，不再依賴 character base baked-in 髮型或衣物。
export const starterItems = [
  {
    id: "softBrownHair",
    storeId: "starter",
    type: "hairstyle",
    name: "Soft brown story hair",
    cost: 0,
    icon: "Hair",
    image: paperDollCharacterThumb,
    layers: [{ slot: "hairstyle", src: hairSalonLayer("hairstyle-twin-braid") }]
  },
  {
    id: "yumiStarterHair",
    storeId: "starter",
    type: "hairstyle",
    name: "Yumi silver bob hair",
    cost: 0,
    icon: "Hair",
    image: paperDollCharacterThumb,
    layers: [{ slot: "hairstyle", src: hairSalonLayer("hairstyle-blonde-bob-silver") }]
  },
  {
    id: "solStarterHair",
    storeId: "starter",
    type: "hairstyle",
    name: "Sol honey bob hair",
    cost: 0,
    icon: "Hair",
    image: paperDollCharacterThumb,
    layers: [{ slot: "hairstyle", src: hairSalonLayer("hairstyle-blonde-bob-honey") }]
  },
  {
    id: "rosaStarterHair",
    storeId: "starter",
    type: "hairstyle",
    name: "Rosa chestnut braid hair",
    cost: 0,
    icon: "Hair",
    image: paperDollCharacterThumb,
    layers: [{ slot: "hairstyle", src: hairSalonLayer("hairstyle-twin-braid-chestnut") }]
  },
  {
    id: "starterPajama",
    storeId: "starter",
    type: "dress",
    name: "Starter rose play outfit",
    cost: 0,
    icon: "Dress",
    image: wardrobePackThumb("starter", "starter-rose-outfit"),
    layers: [
      { slot: "top", src: tailorLayer("top-cream-blouse") },
      { slot: "bottom", src: tailorLayer("bottom-rose-skirt") }
    ]
  }
];
//#endregion 初始衣物
