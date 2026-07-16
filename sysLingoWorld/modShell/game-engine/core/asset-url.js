// core/asset-url.js — 資產路徑跳脫小工具（issue #298 自 main.js 拆出；map／wardrobe／render 共用）。
export function cssAssetUrl(src) {
  const path = src?.startsWith("content-package/") || src?.startsWith("content-base/") ? `../${src}` : src;
  return path?.replaceAll("'", "%27");
}

export function domAssetUrl(src) {
  return (src || "").replaceAll('"', "%22");
}
