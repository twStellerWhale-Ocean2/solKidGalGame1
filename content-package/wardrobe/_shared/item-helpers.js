import { wardrobePackLayer, wardrobePackThumb } from "./paper-doll-assets.js";
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

  return { wearable };
}
//#endregion 資源包工具
