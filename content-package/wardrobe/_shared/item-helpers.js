import { wardrobePackLayer } from "./paper-doll-assets.js";
import { wardrobeLayerBoundsForType } from "./rules.js";
import { assetContentBoxByPackName } from "./asset-content-box.generated.js";
import { assetTargetOverrides } from "./asset-target-overrides.js";

//#region 資源包工具
// 讓各 pack 只寫商品資料，不重複寫 layer / thumbnail 路徑規則。
export function createWardrobePackTools(packId) {
  // #176：素材去空白邊後為緊貼裁切 bitmap，以 per-item targetBox 等比 fit 回 512x768 對應位置。
  // 解析優先序：人工校準覆寫 → 裁切原始內容框（identity） → 類別 safeBox（新素材預設投影區）。
  const layer = (slot, name, type = slot) => {
    const base = wardrobeLayerBoundsForType(type);
    const key = `${packId}/${name}`;
    const targetBox = assetTargetOverrides[key] || assetContentBoxByPackName[key] || base.safeBox || null;
    return {
      slot,
      type,
      bounds: targetBox ? { ...base, targetBox } : base,
      src: wardrobePackLayer(packId, name)
    };
  };
  function wearable({ id, storeId, type, name, cost, icon, asset, slot = type }) {
    // #196：單一素材——商店預覽 image 即該件 wardrobe layer 素材（image===layers[0].src），不另設分離縮圖。
    const itemLayer = layer(slot, asset, type);
    return {
      id,
      storeId,
      type,
      name,
      cost,
      icon,
      image: itemLayer.src,
      layers: [itemLayer]
    };
  }

  return { wearable };
}
//#endregion 資源包工具
