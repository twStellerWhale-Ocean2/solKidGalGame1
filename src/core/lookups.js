import {
  areaRegistry,
  castleHotspots,
  castleMapNodes,
  categories,
  hotspots,
  mapNodes,
  sceneConfigs,
  shopItems
} from "../data/game-data.js";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function nodeMapForArea(areaId) {
  return areaRegistry[areaId]?.nodes || mapNodes;
}

export function hotspotById(id) {
  return [...castleHotspots, ...hotspots].find((hotspot) => hotspot.id === id);
}

export function sceneConfigFor(hotspot) {
  if (!hotspot) return {};
  return { ...hotspot, ...(sceneConfigs[hotspot.id] || {}) };
}

export function hotspotByNode(nodeId) {
  return [...castleHotspots, ...hotspots].find((hotspot) => hotspot.node === nodeId) || null;
}

export function itemById(id) {
  return shopItems.find((item) => item.id === id) || null;
}

export function areaForHotspot(hotspot) {
  if (!hotspot) return "kingdom";
  if (hotspot.area) return hotspot.area;
  if (castleMapNodes[hotspot.node]) return "castle";
  return "kingdom";
}

export function closestNodeFromLegacy(player, areaId = "kingdom") {
  const nodes = nodeMapForArea(areaId);
  const defaultNode = areaRegistry[areaId]?.defaultNode || "garden";
  if (!player || typeof player.x !== "number") return defaultNode;
  let best = defaultNode;
  let bestDistance = Infinity;
  Object.values(nodes).forEach((node) => {
    const distance = Math.hypot(node.x - player.x, node.y - player.y);
    if (distance < bestDistance) {
      best = node.id;
      bestDistance = distance;
    }
  });
  return best;
}

export function categoryLabel(type) {
  return categories.find((category) => category.id === type)?.label || type;
}

export function allowedShopCategoriesFor(hotspot) {
  return hotspot?.shopCategories?.length ? hotspot.shopCategories : categories.map((category) => category.id);
}
