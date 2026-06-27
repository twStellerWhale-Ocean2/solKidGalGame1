import { paperDollBaseLayer, wardrobePackLayer } from "./paper-doll-assets.js";
import { wardrobeLayerBoundsForType } from "./rules.js";

//#region 資源包工具
// issue #267：自衍生 registry（index.generated.js）之 raw 項目建構 runtime 衣物單品；單一事實來源＝各包素材旁
// sidecar（<slug>.metadata.json）。raw＝{ pack, id, storeId, type, name, cost, icon, asset, targetBox? }；
// asset=null＝starter 無正式 layer 之舊存檔相容外觀。
//
// #196 單一素材：商店預覽 image 即該件 wardrobe layer 素材（image===layers[0].src），不另設分離縮圖。
// targetBox 解析優先序：sidecar 人工校準（raw.targetBox）→ 類別 safeBox（預設投影區）。
export function buildWardrobeItem(raw) {
  const { id, storeId, type, name, cost, icon } = raw;
  if (!raw.asset) {
    return { id, storeId, type, name, cost, icon, image: paperDollBaseLayer, layers: [] };
  }
  const base = wardrobeLayerBoundsForType(type);
  const targetBox = raw.targetBox || base.safeBox || null;
  const rotation = raw.rotation ?? 0;
  const src = wardrobePackLayer(raw.pack, raw.asset);
  const layer = { slot: type, type, bounds: targetBox ? { ...base, targetBox } : base, src, ...(rotation ? { rotation } : {}) };
  return { id, storeId, type, name, cost, icon, image: src, layers: [layer], pack: raw.pack, asset: raw.asset, ...(rotation ? { rotation } : {}) };
}
//#endregion 資源包工具
