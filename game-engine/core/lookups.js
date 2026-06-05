import {
  areaRegistry,
  categories,
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

export function locationsForArea(areaId) {
  return areaRegistry[areaId]?.locations || [];
}

export function allHotspots() {
  return Object.values(areaRegistry).flatMap((area) => area.locations || []);
}

export function hotspotById(id) {
  return allHotspots().find((hotspot) => hotspot.id === id);
}

export function sceneConfigFor(hotspot) {
  if (!hotspot) return {};
  return { ...hotspot, ...(sceneConfigs[hotspot.id] || {}) };
}

export function hotspotByNode(nodeId) {
  return allHotspots().find((hotspot) => hotspot.node === nodeId) || null;
}

export function itemById(id) {
  return shopItems.find((item) => item.id === id) || null;
}

export function categoryTypes(categoryId) {
  const category = categories.find((candidate) => candidate.id === categoryId);
  return category?.types?.length ? category.types : [categoryId];
}

export function categoryForType(type) {
  return categories.find((category) => category.id === type || categoryTypes(category.id).includes(type)) || null;
}

export function areaForHotspot(hotspot) {
  if (!hotspot) return "urban";
  if (hotspot.area) return hotspot.area;
  const area = Object.values(areaRegistry).find((candidate) => candidate.nodes?.[hotspot.node]);
  if (area) return area.id;
  return "urban";
}

export function closestNodeFromLegacy(player, areaId = "urban") {
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
  return categoryForType(type)?.label || type;
}

export function itemMatchesCategory(item, categoryId) {
  return categoryTypes(categoryId).includes(item?.type);
}

export function allowedShopCategoriesFor(hotspot) {
  return hotspot?.shopCategories?.length ? hotspot.shopCategories : categories.map((category) => category.id);
}
