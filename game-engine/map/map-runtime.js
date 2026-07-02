// map/map-runtime.js — 地圖關注點：地區／城堡地圖渲染、移動、hotspot 與視口（issue #298 自 main.js 拆出，行為零變更）。
// issue #178：鍵盤地圖走動參數——自管連續移動迴圈的步進間隔與各面移速，取代倚賴 OS 按鍵自動重複（消除起步停頓、加快移速）。
import { hub } from "../core/hub.js";
import {
  areaRegistry,
  castleHotspots,
  castleMapImageSize,
  castleMapNodes,
  mapImageSize,
  mapNodes,
  worldMap
} from "../data/game-data.js";
import {
  areaForHotspot,
  categoryLabel,
  clamp,
  closestNodeFromLegacy,
  locationsForArea,
  nodeMapForArea,
  sceneConfigFor
} from "../core/lookups.js";
import { isShopHotspot } from "../flow/scene-actions.js";
import { updateMarkerEdgeVisibility } from "./marker-visibility.js";
import { createMapActorRuntime } from "./actors.js";
import { createKeyboardWalkController } from "./keyboard-walk.js";
import { createAreaMapViewportController } from "./viewport.js";
import { cssAssetUrl, domAssetUrl } from "../core/asset-url.js";
import { elements, session } from "../core/session.js";
import { activeWorldDestination, openWorldDestination, worldDestinationForArea } from "./world-map.js";
import { refreshAreaMapPositions } from "./map-gestures.js";
export const MAP_WALK_STEP_MS = 33;   // 連續走動步進間隔（≈30 步/秒）；首步即時、之後每 33ms 推進，免 OS 自動重複初始延遲。
export const MAP_WALK_SPEED = Object.freeze({ area: 2.0, castle: 1.9, world: 2.2 });   // 每步位移量（座標域 0–100；較前 1.45/1.35/1.6 提速約 ⅓）。
export const mapWalkController = createKeyboardWalkController({ stepMs: MAP_WALK_STEP_MS });
export const mapZoomLimits = { min: 1, max: 2.2, mobileBaseScale: 1.06 };
export const areaMapIds = ["castle", "urban", "rural", "wild", "world"];
export const WORLD_TRAVEL_MS = 620; // 走到目的地時長；與 .world-player.traveling 之 CSS transition 對齊
export const areaMapViewportController = createAreaMapViewportController({
  areaIds: areaMapIds,
  clamp,
  getImageSize: areaMapImageSize,
  getStage: areaMapStage,
  isMobile: isMobileTravelMap,
  zoomLimits: mapZoomLimits
});
export const mapActorRuntime = createMapActorRuntime({
  assetUrl: domAssetUrl,
  layer: elements.mapLifeLayer,
  pointToStage: mapPointToStage
});

export function ensureUrbanPosition() {
  if (mapNodes[session.state.playerNode]) return;
  const node = mapNodes[areaRegistry.urban.defaultNode];
  session.state.playerNode = node.id;
  session.state.player = { x: node.x, y: node.y };
}

export function ensureCastlePosition() {
  if (castleMapNodes[session.state.playerNode]) return;
  const node = castleMapNodes[areaRegistry.castle.defaultNode];
  session.state.playerNode = node.id;
  session.state.player = { x: node.x, y: node.y };
}

export function ensureAreaPosition(areaId = session.state.area) {
  if (areaId === "castle") {
    ensureCastlePosition();
    return;
  }
  if (areaId === "urban") {
    ensureUrbanPosition();
    return;
  }
  const area = areaRegistry[areaId];
  const nodes = area?.nodes || {};
  if (nodes[session.state.playerNode]) return;
  const node = nodes[area?.defaultNode] || Object.values(nodes)[0];
  if (!node) return;
  session.state.playerNode = node.id;
  session.state.player = { x: node.x, y: node.y };
}


export function openArea(areaId) {
  const area = areaRegistry[areaId];
  if (!area?.enabled) {
    elements.statusMessage.textContent = `${area?.label || "This area"} is not open yet.`;
    return;
  }
  // issue #164：場景切換亦結束本次造訪——清空歡迎詞旗標，使進入新區地點時重新播放一次歡迎詞。
  session.sceneVisitWelcomeId = "";
  session.state.area = areaId;
  ensureAreaPosition(areaId);
  areaMapViewportController.requestCenter(areaId);
  hub.persist();
  hub.changeView(area.view);
  hub.renderAreaNav();
}

export function openWorldMap() {
  session.activeHotspot = null;
  session.activeCastleHotspot = null;
  session.activeWorldDestinationId = worldDestinationForArea(session.state.area)?.id || session.activeWorldDestinationId || "castle";
  areaMapViewportController.requestCenter("world");
  elements.statusMessage.textContent = "Choose a kingdom area.";
  hub.changeView("world");
}


export function areaMapStage(areaId) {
  if (areaId === "world") return elements.worldStage;
  return areaId === "castle" ? elements.castleStage : elements.mapStage;
}

export function areaMapImageSize(areaId) {
  if (areaId === "world") return worldMap.imageSize;
  return areaRegistry[areaId]?.imageSize || mapImageSize;
}

export function areaMapViewport(areaId) {
  return areaMapViewportController.viewport(areaId);
}

export function activeTravelMapArea() {
  return session.state.area !== "castle" && areaRegistry[session.state.area]?.enabled ? session.state.area : "urban";
}

export function baseAreaMapDisplay(areaId, rect) {
  return areaMapViewportController.baseDisplay(areaId, rect);
}

export function clampAreaMapViewport(areaId, viewport, rect = null) {
  return areaMapViewportController.clampViewport(areaId, viewport, rect);
}

export function areaMapMetrics(areaId, viewportOverride = null) {
  return areaMapViewportController.metrics(areaId, viewportOverride);
}

export function syncAreaMapStyles(areaId, metrics = areaMapMetrics(areaId)) {
  areaMapViewportController.syncStyles(areaId, metrics);
}

export function centerAreaMapOnPoint(areaId, x, y) {
  areaMapViewportController.centerOnPoint(areaId, x, y);
}

export function zoomAreaMapAtStagePoint(areaId, stageX, stageY, zoomFactor) {
  areaMapViewportController.zoomAtStagePoint(areaId, stageX, stageY, zoomFactor);
  refreshAreaMapPositions(areaId);
}

export function zoomAreaMapFromKeyboard(areaId, direction) {
  areaMapViewportController.zoomFromKeyboard(areaId, direction);
  refreshAreaMapPositions(areaId);
}

export function centerAreaMapOnCurrentPlayer(areaId) {
  const point = currentPlayerPoint(areaId);
  if (!point) return;
  centerAreaMapOnPoint(areaId, point.x, point.y);
}

export function centerAreaMapIfRequested(areaId) {
  areaMapViewportController.centerIfRequested(areaId, currentPlayerPoint(areaId));
}

export function castleCoverMetrics() {
  return areaMapMetrics("castle");
}

export function castlePointToStage(x, y, metrics = castleCoverMetrics()) {
  return areaMapViewportController.pointToStage(x, y, metrics);
}

export function positionCastleElement(element, x, y, metrics = castleCoverMetrics()) {
  areaMapViewportController.positionElement(element, x, y, metrics);
}

export function currentPlayerPoint(areaId) {
  if (areaId === "world") {
    if (typeof session.state.world?.x === "number" && typeof session.state.world?.y === "number") return session.state.world;
    const destination = activeWorldDestination();
    return destination ? { x: destination.x, y: destination.y } : null;
  }
  const nodes = nodeMapForArea(areaId);
  const fallback = nodes[session.state.playerNode] || nodes[areaRegistry[areaId]?.defaultNode];
  if (
    session.state.area === areaId &&
    typeof session.state.player?.x === "number" &&
    typeof session.state.player?.y === "number"
  ) {
    return session.state.player;
  }
  return fallback || null;
}

export function nearbyAreaHotspot(areaId, defaultRadius = 6.8) {
  const nodes = nodeMapForArea(areaId);
  const player = currentPlayerPoint(areaId);
  if (!player) return null;
  const candidates = (areaRegistry[areaId]?.locations || []).map((hotspot) => {
    const node = nodes[hotspot.node];
    if (!node) return null;
    const radius = hotspot.focusRadius || defaultRadius;
    const distance = Math.hypot(node.x - player.x, (node.y - player.y) * 1.18);
    const score = distance / radius;
    return { hotspot, distance, score, radius };
  }).filter((candidate) => candidate && candidate.distance <= candidate.radius);
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.score - b.score || a.distance - b.distance);
  return candidates[0].hotspot;
}

export function renderCastleMap() {
  if (!elements.castleStage || !elements.castleMarkerLayer) return;
  if (elements.castleStage.offsetParent === null && hub.activeViewName() !== "home") return;
  centerAreaMapIfRequested("castle");
  const metrics = castleCoverMetrics();
  syncAreaMapStyles("castle", metrics);
  // issue #226：城堡固定比例地圖之視口 letterbox 留白模糊鋪底來源（同地圖機制 --map-backdrop-image）。
  if (areaRegistry.castle?.mapImage) {
    elements.castleStage.style.setProperty("--map-backdrop-image", `url("${cssAssetUrl(areaRegistry.castle.mapImage)}")`);
  }
  elements.castleMarkerLayer.innerHTML = "";
  castleHotspots.forEach((hotspot) => {
    const node = castleMapNodes[hotspot.node];
    if (!node) return;
    const marker = document.createElement("button");
    const isPortal = hotspot.kind === "gate" || hotspot.markerStyle === "portal";
    marker.type = "button";
    marker.className = `map-marker hotspot castle-marker${isShopHotspot(hotspot) ? " shop" : ""}${session.activeCastleHotspot?.id === hotspot.id ? " nearby" : ""}${hotspot.kind === "future" ? " disabled" : ""}${isPortal ? " portal" : ""}`;
    marker.dataset.hotspotId = hotspot.id;
    marker.dataset.label = hotspot.label;
    marker.setAttribute("aria-label", `${hotspot.label}. ${travelActionLabel(hotspot)}.`);
    positionCastleElement(marker, node.x, node.y, metrics);
    marker.innerHTML = `<span class="hotspot-icon" aria-hidden="true">${hotspot.icon}</span>`;
    marker.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleCastleHotspotClick(hotspot.id);
    });
    elements.castleMarkerLayer.appendChild(marker);
    updateMarkerEdgeVisibility(marker, elements.castleStage);
  });
  updateCastlePlayerPosition(metrics);
  updateNearbyCastleHotspot();
}

export function focusCastleHotspot(hotspotId, rerender = true) {
  session.activeCastleHotspot = castleHotspots.find((hotspot) => hotspot.id === hotspotId) || castleHotspots[0];
  const node = castleMapNodes[session.activeCastleHotspot?.node];
  if (node) {
    session.state.playerNode = node.id;
    session.state.player = { x: node.x, y: node.y };
    centerAreaMapOnPoint("castle", node.x, node.y);
    hub.persist();
  }
  if (rerender) renderCastleMap();
  elements.castleStage.focus({ preventScroll: true });
}

export function handleCastleHotspotClick(hotspotId) {
  if (session.activeCastleHotspot?.id === hotspotId) {
    interactCastleHotspot();
    return;
  }
  focusCastleHotspot(hotspotId);
}

export function updateCastlePlayerPosition(metrics = castleCoverMetrics()) {
  if (!elements.castlePlayerToken) return;
  const point = currentPlayerPoint("castle");
  if (!point) return;
  positionCastleElement(elements.castlePlayerToken, point.x, point.y, metrics);
}

export function refreshCastleMapPositions() {
  const metrics = castleCoverMetrics();
  syncAreaMapStyles("castle", metrics);
  castleHotspots.forEach((hotspot) => {
    const marker = elements.castleMarkerLayer?.querySelector(`[data-hotspot-id="${hotspot.id}"]`);
    const node = castleMapNodes[hotspot.node];
    if (marker && node) {
      positionCastleElement(marker, node.x, node.y, metrics);
      updateMarkerEdgeVisibility(marker, elements.castleStage);
    }
  });
  updateCastlePlayerPosition(metrics);
  updateCastleHotspotFocus();
}

export function interactCastleHotspot() {
  const hotspot = session.activeCastleHotspot || nearbyCastleHotspot();
  if (!hotspot) return;
  session.activeCastleHotspot = hotspot;
  if (hotspot.kind === "gate") {
    enterTravelGate(hotspot);
    return;
  }
  if (hotspot.kind === "room") {
    hub.openRoomScene(hotspot);
    return;
  }
  hub.openSceneAdv(hotspot);
}

export function updateNearbyCastleHotspot() {
  session.activeCastleHotspot = nearbyCastleHotspot();
  updateCastleHotspotFocus();
}

export function updateCastleHotspotFocus() {
  elements.castleMarkerLayer?.querySelectorAll(".hotspot").forEach((marker) => {
    marker.classList.toggle("nearby", session.activeCastleHotspot?.id === marker.dataset.hotspotId);
  });
}

export function nearbyCastleHotspot() {
  return nearbyAreaHotspot("castle", 5.8);
}

export function moveOnAreaMap(areaId, dx, dy, options = {}) {
  const speed = options.speed || MAP_WALK_SPEED.area;
  const token = options.token || elements.playerToken;
  const current = currentPlayerPoint(areaId) || nodeMapForArea(areaId)[areaRegistry[areaId]?.defaultNode];
  if (!current) return;
  const next = {
    x: clamp(current.x + dx * speed, 0, 100),
    y: clamp(current.y + dy * speed, 0, 100)
  };
  session.state.area = areaId;
  session.state.player = next;
  session.state.playerNode = closestNodeFromLegacy(session.state.player, areaId);
  const nearby = nearbyAreaHotspot(areaId, options.nearbyRadius || 6.8);
  if (nearby) {
    elements.statusMessage.textContent = `${nearby.label}: ${travelActionLabel(nearby)}.`;
  }
  options.onNearby?.(nearby);
  token?.classList.add("walking");
  window.setTimeout(() => token?.classList.remove("walking"), 180);
  hub.persist();
  options.render?.();
}

export function moveOnCastleMap(dx, dy) {
  moveOnAreaMap("castle", dx, dy, {
    speed: MAP_WALK_SPEED.castle,
    nearbyRadius: 5.8,
    token: elements.castlePlayerToken,
    onNearby: (hotspot) => { session.activeCastleHotspot = hotspot; },
    render: renderCastleMap
  });
}


export function renderMap() {
  if (!elements.mapStage || (elements.mapStage.offsetParent === null && hub.activeViewName() !== "map")) return;
  const areaId = activeTravelMapArea();
  ensureAreaPosition(areaId);
  centerAreaMapIfRequested(areaId);
  if (elements.destinationHint) elements.destinationHint.textContent = "Choose any place to help.";
  const area = areaRegistry[areaId];
  elements.mapStage.style.setProperty("--map-backdrop-image", `url("${cssAssetUrl(area?.mapImage || "")}")`);
  if (elements.mapImage && area?.mapImage && !elements.mapImage.src.endsWith(area.mapImage)) {
    elements.mapImage.src = area.mapImage;
    elements.mapImage.alt = `${area.label} travel map`;
  }
  if (elements.mapTitle) elements.mapTitle.textContent = `${area?.label || "Area"} Map`;
  elements.mapStage.setAttribute("aria-label", `${area?.label || "Area"} travel map. Drag to look around, tap a place, or use keyboard arrows.`);
  elements.routeLayer.innerHTML = "";
  elements.nodeLayer.innerHTML = "";
  const metrics = mapCoverMetrics(areaId);
  syncMapPanStyles(metrics, areaId);
  renderMapActors(metrics, areaId);
  renderHotspots(metrics, areaId);
  updatePlayerPosition(metrics, areaId);
  updateNearbyHotspot();
  startMapLife();
}

export function renderDestinationPicker() {
  if (!elements.destinationList) return;
  const areaId = activeTravelMapArea();
  elements.destinationList.innerHTML = "";
  locationsForArea(areaId).filter((hotspot) => hotspot.kind !== "room").forEach((hotspot) => {
    const isShop = isShopHotspot(hotspot);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `destination-card${isShop ? " shop" : ""}`;
    button.dataset.destinationId = hotspot.id;
    button.innerHTML = `
      <span class="destination-icon" aria-hidden="true">${hotspot.icon}</span>
      <span class="destination-copy">
        <strong>${hotspot.label}</strong>
        <small>${destinationActionText(hotspot)}</small>
      </span>
      <span class="destination-badge">${hub.jobAvailableForPlace(hotspot.id) ? "Practice" : isShop ? "Shop" : "Visit"}</span>
    `;
    button.addEventListener("click", () => chooseDestination(hotspot.id));
    elements.destinationList.appendChild(button);
  });
}

export function destinationActionText(hotspot) {
  if (hub.jobAvailableForPlace(hotspot.id)) return `${sceneConfigFor(hotspot).npc} has a local English task.`;
  if (isShopHotspot(hotspot)) {
    const categoriesText = hub.allowedShopCategories(hotspot).map(categoryLabel).join(" / ");
    return `Try ${categoriesText.toLowerCase()} rewards.`;
  }
  return hotspot.hint;
}

export function chooseDestination(hotspotId) {
  const areaId = activeTravelMapArea();
  const hotspot = locationsForArea(areaId).find((item) => item.id === hotspotId);
  if (!hotspot) return;
  const node = nodeMapForArea(areaId)[hotspot.node];
  if (node) {
    session.state.area = areaId;
    session.state.playerNode = node.id;
    session.state.player = { x: node.x, y: node.y };
  }
  hub.persist();
  renderMap();
  session.activeHotspot = hotspot;
  updateHotspotFocus();
  if (hotspot.kind === "gate") {
    enterTravelGate(hotspot);
    return;
  }
  hub.openSceneAdv(hotspot);
}

export function focusTravelHotspot(hotspotId, areaId = activeTravelMapArea()) {
  const hotspot = locationsForArea(areaId).find((item) => item.id === hotspotId);
  const node = nodeMapForArea(areaId)[hotspot?.node];
  if (!hotspot || !node) return;
  session.state.area = areaId;
  session.state.playerNode = node.id;
  session.state.player = { x: node.x, y: node.y };
  session.activeHotspot = hotspot;
  centerAreaMapOnPoint(areaId, node.x, node.y);
  hub.persist();
  renderMap();
  session.activeHotspot = hotspot;
  updateHotspotFocus();
  elements.mapStage.focus({ preventScroll: true });
}

export function handleTravelHotspotClick(hotspotId) {
  if (session.activeHotspot?.id === hotspotId) {
    interactNearby();
    return;
  }
  focusTravelHotspot(hotspotId);
}

export function isMobileTravelMap() {
  return window.matchMedia("(max-width: 820px)").matches;
}

export function syncMapPanStyles(metrics = mapCoverMetrics()) {
  syncAreaMapStyles(activeTravelMapArea(), metrics);
}

export function mapCoverMetrics(areaId = activeTravelMapArea()) {
  return areaMapMetrics(areaId);
}

export function mapPointToStage(x, y, metrics = mapCoverMetrics()) {
  return areaMapViewportController.pointToStage(x, y, metrics);
}

export function positionMapElement(element, x, y, metrics = mapCoverMetrics()) {
  areaMapViewportController.positionElement(element, x, y, metrics);
}

export function renderMapActors(metrics = mapCoverMetrics(), areaId = activeTravelMapArea()) {
  mapActorRuntime.render(areaRegistry[areaId]?.actors || [], metrics);
}

export function startMapLife() {
  mapActorRuntime.start();
}

export function renderRoutes() {
  const drawn = new Set();
  const nodes = nodeMapForArea(activeTravelMapArea());
  elements.routeLayer.innerHTML = "";
  Object.values(nodes).forEach((node) => {
    (node.links || []).forEach((linkId) => {
      const key = [node.id, linkId].sort().join("-");
      if (drawn.has(key)) return;
      drawn.add(key);
      const other = nodes[linkId];
      if (!other) return;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", node.x);
      line.setAttribute("y1", node.y);
      line.setAttribute("x2", other.x);
      line.setAttribute("y2", other.y);
      elements.routeLayer.appendChild(line);
    });
  });
}

export function renderNodes() {
  const areaId = activeTravelMapArea();
  const nodes = nodeMapForArea(areaId);
  const metrics = mapCoverMetrics();
  elements.nodeLayer.innerHTML = "";
  Object.values(nodes).forEach((node) => {
    const marker = document.createElement("div");
    const currentLinks = nodes[session.state.playerNode]?.links || [];
    marker.className = `road-node${node.id === session.state.playerNode ? " current" : ""}${currentLinks.includes(node.id) ? " reachable" : ""}`;
    positionMapElement(marker, node.x, node.y, metrics);
    elements.nodeLayer.appendChild(marker);
  });
}

export function renderHotspots(metrics = mapCoverMetrics(), areaId = activeTravelMapArea()) {
  const nodes = nodeMapForArea(areaId);
  elements.hotspotLayer.innerHTML = "";
  locationsForArea(areaId).forEach((hotspot) => {
    const node = nodes[hotspot.node];
    if (!node) return;
    const marker = document.createElement("button");
    const isPortal = hotspot.kind === "gate" || hotspot.markerStyle === "portal";
    marker.type = "button";
    marker.className = `map-marker hotspot${isShopHotspot(hotspot) ? " shop" : ""}${isPortal ? " portal" : ""}`;
    marker.dataset.hotspotId = hotspot.id;
    marker.dataset.label = hotspot.label;
    marker.setAttribute("aria-label", `${hotspot.label}. ${travelActionLabel(hotspot)}.`);
    positionMapElement(marker, node.x, node.y, metrics);
    marker.innerHTML = `<span class="hotspot-icon" aria-hidden="true">${hotspot.icon}</span>`;
    marker.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleTravelHotspotClick(hotspot.id);
    });
    elements.hotspotLayer.appendChild(marker);
    updateMarkerEdgeVisibility(marker, elements.mapStage);
  });
}

export function updatePlayerPosition(metrics = mapCoverMetrics(), areaId = activeTravelMapArea()) {
  const point = currentPlayerPoint(areaId);
  if (!point) return;
  positionMapElement(elements.playerToken, point.x, point.y, metrics);
}

export function refreshMapPositions() {
  const areaId = activeTravelMapArea();
  const metrics = mapCoverMetrics(areaId);
  syncMapPanStyles(metrics);
  renderMapActors(metrics, areaId);
  renderHotspots(metrics, areaId);
  updatePlayerPosition(metrics, areaId);
  updateHotspotFocus();
}

export function travelActionLabel(hotspot) {
  if (!hotspot) return "Visit";
  if (hotspot.kind === "room") return "Enter";
  if (hotspot.kind === "gate") {
    return sceneConfigFor(hotspot).travelAction || "World Map";
  }
  if (hotspot.kind === "future") return "Soon";
  if (hub.jobAvailableForPlace(hotspot.id)) return "Practice";
  if (isShopHotspot(hotspot)) return "Shop";
  return sceneConfigFor(hotspot).travelAction || "Visit";
}

export function updateNearbyHotspot() {
  session.activeHotspot = nearbyHotspot();
  updateHotspotFocus();
}

export function updateHotspotFocus() {
  elements.hotspotLayer?.querySelectorAll(".hotspot").forEach((marker) => {
    marker.classList.toggle("nearby", session.activeHotspot?.id === marker.dataset.hotspotId);
  });
}

export function nearbyHotspot() {
  return nearbyAreaHotspot(activeTravelMapArea(), 6.8);
}

export function moveOnMap(dx, dy) {
  const areaId = activeTravelMapArea();
  moveOnAreaMap(areaId, dx, dy, {
    token: elements.playerToken,
    onNearby: (hotspot) => { session.activeHotspot = hotspot; },
    render: renderMap
  });
}

export function isWalkable(x, y) {
  return x >= 0 && x <= 100 && y >= 0 && y <= 100;
}

export function interactNearby() {
  const hotspot = session.activeHotspot || nearbyHotspot();
  if (!hotspot) return;
  session.activeHotspot = hotspot;
  if (hotspot.kind === "gate") {
    enterTravelGate(hotspot);
    return;
  }
  hub.openSceneAdv(hotspot);
}

export function interactCurrentLocation() {
  if (hub.activeViewName() === "home") {
    interactCastleHotspot();
    return;
  }
  if (hub.activeViewName() === "world") {
    openWorldDestination(session.activeWorldDestinationId);
    return;
  }
  interactNearby();
}

export function enterTravelGate(hotspot) {
  session.activeWorldDestinationId = worldDestinationForArea(areaForHotspot(hotspot))?.id || session.activeWorldDestinationId;
  openWorldMap();
}
