import { wardrobePackLayer, wardrobePackThumb } from "./paper-doll-assets.js";
import { wardrobeLayerBoundsForType } from "./rules.js";

//#region 資源包工具
// 讓各 pack 只寫商品資料，不重複寫 layer / thumbnail 路徑規則。
export function createWardrobePackTools(packId) {
  const layer = (slot, name, type = slot) => ({
    slot,
    type,
    bounds: wardrobeLayerBoundsForType(type),
    src: wardrobePackLayer(packId, name)
  });
  const thumb = (name) => wardrobePackThumb(packId, name);

  function wearable({ id, storeId, type, name, cost, icon, asset, slot = type }) {
    return {
      id,
      storeId,
      type,
      name,
      cost,
      icon,
      image: thumb(asset),
      layers: [layer(slot, asset, type)]
    };
  }

  function outfitSet({ id, storeId = "boutique", name, cost, asset, equips }) {
    return {
      id,
      storeId,
      type: "outfitSet",
      name,
      cost,
      icon: "Set",
      image: thumb(asset),
      layers: [],
      equips
    };
  }

  return { outfitSet, wearable };
}
//#endregion 資源包工具
