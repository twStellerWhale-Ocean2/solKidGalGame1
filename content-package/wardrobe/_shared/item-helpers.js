import { wardrobePackLayer } from "./paper-doll-assets.js";
import { wardrobeLayerBoundsForType } from "./rules.js";
import { assetTargetOverrides } from "./asset-target-overrides.js";

//#region 資源包工具
// 讓各 pack 只寫商品資料，不重複寫 layer 路徑規則。
export function createWardrobePackTools(packId) {
  // #196：素材為 512×512 長邊貼滿透明單品，以 per-item targetBox 投影到 512×768 doll 對應位置。
  // targetBox 解析優先序：維護者人工校準覆寫（asset-target-overrides）→ 類別 safeBox（預設投影區）。
  // （#176 裁切原始內容框 fallback 於 fill 模型下已不適用——素材非裁切，故移除。）
  const layer = (slot, name, type = slot) => {
    const base = wardrobeLayerBoundsForType(type);
    const key = `${packId}/${name}`;
    const targetBox = assetTargetOverrides[key] || base.safeBox || null;
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
