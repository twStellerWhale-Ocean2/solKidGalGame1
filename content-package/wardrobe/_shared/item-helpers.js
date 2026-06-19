import { wardrobePackLayer, wardrobePackThumb } from "./paper-doll-assets.js";
import { wardrobeLayerBoundsForType } from "./rules.js";
import { assetContentBoxByPackName } from "./asset-content-box.generated.js";

//#region 資源包工具
// 讓各 pack 只寫商品資料，不重複寫 layer / thumbnail 路徑規則。
export function createWardrobePackTools(packId) {
  // #176：素材去空白邊後為緊貼裁切 bitmap；以裁切前記錄之原始內容框作 per-item targetBox，
  // 引擎據此把素材等比 fit 回 512x768 對應位置（targetBox = 原始內容框時即與裁切前畫面一致）。
  const layer = (slot, name, type = slot) => {
    const base = wardrobeLayerBoundsForType(type);
    const targetBox = assetContentBoxByPackName[`${packId}/${name}`];
    return {
      slot,
      type,
      bounds: targetBox ? { ...base, targetBox } : base,
      src: wardrobePackLayer(packId, name)
    };
  };
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
