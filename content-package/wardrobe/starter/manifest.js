import { paperDollCharacterThumb } from "../_shared/paper-doll-assets.js";

//#region 初始衣物
// starter 不放獨立衣物 layer；角色 base 已經包含初始睡衣與預設髮型。
export const starterItems = [
  {
    id: "softBrownHair",
    storeId: "starter",
    type: "hairstyle",
    name: "Soft brown hair",
    cost: 0,
    icon: "Hair",
    image: paperDollCharacterThumb,
    layers: []
  },
  {
    id: "starterPajama",
    storeId: "starter",
    type: "dress",
    name: "Pink-white cotton pajama",
    cost: 0,
    icon: "PJs",
    image: paperDollCharacterThumb,
    layers: []
  }
];
//#endregion 初始衣物
