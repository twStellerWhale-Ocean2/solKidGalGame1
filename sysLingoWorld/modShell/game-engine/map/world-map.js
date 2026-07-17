// map/world-map.js — 世界地圖：目的地、走到再進入之旅行動線（issue #298 自 main.js 拆出，行為零變更）。
import { activeViewName } from "../app/views.js";
import { persist } from "../system/persistence.js";
import { areaRegistry, worldMap } from "../data/game-data.js";
import { clamp, locationsForArea } from "../core/lookups.js";
import { updateMarkerEdgeVisibility } from "./marker-visibility.js";
import { cssAssetUrl, domAssetUrl } from "../core/asset-url.js";
import { elements, session } from "../core/session.js";
import {
  MAP_WALK_SPEED,
  WORLD_TRAVEL_MS,
  areaMapMetrics,
  areaMapViewportController,
  centerAreaMapIfRequested,
  centerAreaMapOnPoint,
  currentPlayerPoint,
  openArea,
  syncAreaMapStyles
} from "./map-runtime.js";
export function worldDestinationById(destinationId) {
  return worldMap.destinations.find((destination) => destination.id === destinationId) || null;
}

export function worldDestinationForArea(areaId) {
  return worldMap.destinations.find((destination) => destination.area === areaId) || null;
}

export function enabledWorldDestinations() {
  return worldMap.destinations.filter((destination) => destination.enabled);
}

export function activeWorldDestination() {
  return worldDestinationById(session.activeWorldDestinationId) || worldDestinationForArea(session.state.area) || enabledWorldDestinations()[0] || worldMap.destinations[0] || null;
}

export function worldMapMetrics() {
  return areaMapMetrics("world");
}

export function positionWorldElement(element, x, y, metrics = worldMapMetrics()) {
  areaMapViewportController.positionElement(element, x, y, metrics);
}

export function renderWorldMap() {
  if (!elements.worldStage || !elements.worldMarkerLayer) return;
  if (elements.worldStage.offsetParent === null && activeViewName() !== "world") return;
  session.activeWorldDestinationId = activeWorldDestination()?.id || "castle";
  centerAreaMapIfRequested("world");
  const metrics = worldMapMetrics();
  syncAreaMapStyles("world", metrics);
  elements.worldStage.style.setProperty("--map-backdrop-image", `url("${cssAssetUrl(worldMap.mapImage)}")`);
  if (elements.worldImage && worldMap.mapImage && !elements.worldImage.src.endsWith(worldMap.mapImage)) {
    elements.worldImage.src = domAssetUrl(worldMap.mapImage);
    elements.worldImage.alt = worldMap.label;
  }
  elements.worldMarkerLayer.innerHTML = "";
  worldMap.destinations.forEach((destination) => {
    const marker = document.createElement("button");
    const active = destination.id === session.activeWorldDestinationId;
    marker.type = "button";
    marker.className = `map-marker hotspot world-marker portal${active ? " nearby" : ""}${destination.enabled ? "" : " disabled"}`;
    marker.dataset.destinationId = destination.id;
    marker.dataset.label = destination.label;
    marker.disabled = !destination.enabled;
    marker.setAttribute("aria-label", destination.enabled ? `${destination.label}. Enter area.` : `${destination.label}. Not open yet.`);
    marker.setAttribute("aria-current", active ? "location" : "false");
    marker.innerHTML = `<span class="hotspot-icon" aria-hidden="true">${destination.icon}</span>`;
    positionWorldElement(marker, destination.x, destination.y, metrics);
    marker.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      requestWorldTravel(destination.id);
    });
    elements.worldMarkerLayer.appendChild(marker);
    updateMarkerEdgeVisibility(marker, elements.worldStage);
  });
  updateWorldPlayerPosition(metrics);
  renderWorldDestinationList();
}

export function renderWorldDestinationList() {
  if (!elements.worldDestinationList) return;
  const active = activeWorldDestination();
  elements.worldDestinationHint.textContent = active?.hint || "Choose an area.";
  if (elements.worldDestinationPanel) elements.worldDestinationPanel.hidden = true;
  elements.worldDestinationList.innerHTML = "";
  elements.worldDestinationList.hidden = true;
}

export function focusWorldDestination(destinationId, rerender = true) {
  const destination = worldDestinationById(destinationId);
  if (!destination) return;
  session.activeWorldDestinationId = destination.id;
  centerAreaMapOnPoint("world", destination.x, destination.y);
  if (rerender) renderWorldMap();
  elements.worldStage?.focus({ preventScroll: true });
}

export function updateWorldPlayerPosition(metrics = worldMapMetrics()) {
  if (!elements.worldPlayerToken) return;
  const point = currentPlayerPoint("world");
  if (!point) return;
  positionWorldElement(elements.worldPlayerToken, point.x, point.y, metrics);
}

// issue #99：世界地圖鄰近目的地偵測（比照地區地圖 nearbyAreaHotspot），供鍵盤走近後 Enter 進入與狀態提示。
export function nearbyWorldDestination(radius = 9) {
  const player = currentPlayerPoint("world");
  if (!player) return null;
  const candidates = worldMap.destinations
    .map((destination) => ({
      destination,
      distance: Math.hypot(destination.x - player.x, (destination.y - player.y) * 1.18)
    }))
    .filter((candidate) => candidate.distance <= radius);
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0].destination;
}

// issue #99：世界地圖鍵盤自由走動（比照地區地圖 moveOnAreaMap）。
export function moveOnWorldMap(dx, dy) {
  const speed = MAP_WALK_SPEED.world;
  const current = currentPlayerPoint("world") || { x: 51, y: 32 };
  session.state.world = {
    x: clamp(current.x + dx * speed, 0, 100),
    y: clamp(current.y + dy * speed, 0, 100)
  };
  const nearby = nearbyWorldDestination();
  if (nearby) {
    session.activeWorldDestinationId = nearby.id;
    elements.statusMessage.textContent = nearby.enabled
      ? `${nearby.label}: press Enter to visit.`
      : `${nearby.label} is not open yet.`;
  }
  elements.worldPlayerToken?.classList.add("walking");
  window.setTimeout(() => elements.worldPlayerToken?.classList.remove("walking"), 180);
  persist();
  renderWorldMap();
}

// issue #99：點選目的地 → 公主先走到該座標再進入；移動途中再次點選即略過、立即進入。
export function requestWorldTravel(destinationId) {
  const destination = worldDestinationById(destinationId);
  if (!destination) return;
  if (!destination.enabled) {
    openWorldDestination(destination.id);
    return;
  }
  if (session.worldTravelTargetId) {
    finishWorldTravel();
    return;
  }
  session.activeWorldDestinationId = destination.id;
  session.worldTravelTargetId = destination.id;
  session.state.world = { x: destination.x, y: destination.y };
  elements.worldPlayerToken?.classList.add("traveling");
  persist();
  renderWorldMap();
  session.worldTravelTimer = window.setTimeout(finishWorldTravel, WORLD_TRAVEL_MS);
}

export function finishWorldTravel() {
  if (session.worldTravelTimer) {
    window.clearTimeout(session.worldTravelTimer);
    session.worldTravelTimer = null;
  }
  elements.worldPlayerToken?.classList.remove("traveling");
  const id = session.worldTravelTargetId;
  session.worldTravelTargetId = null;
  if (id) openWorldDestination(id);
}

export function openWorldDestination(destinationId = session.activeWorldDestinationId) {
  const destination = worldDestinationById(destinationId);
  if (!destination) return;
  // 取消任何進行中的「走到再進入」，避免計時器於已進入後再次觸發（issue #99）。
  if (session.worldTravelTimer) {
    window.clearTimeout(session.worldTravelTimer);
    session.worldTravelTimer = null;
  }
  session.worldTravelTargetId = null;
  elements.worldPlayerToken?.classList.remove("traveling");
  if (!destination.enabled) {
    elements.statusMessage.textContent = `${destination.label} is not open yet.`;
    session.activeWorldDestinationId = destination.id;
    renderWorldMap();
    return;
  }
  const targetArea = areaRegistry[destination.area];
  const targetNode = targetArea?.nodes?.[destination.entryNode] || targetArea?.nodes?.[targetArea.defaultNode] || Object.values(targetArea?.nodes || {})[0];
  if (!targetArea?.enabled || !targetNode) {
    elements.statusMessage.textContent = `${destination.label} is not open yet.`;
    return;
  }
  session.state.area = targetArea.id;
  session.state.playerNode = targetNode.id;
  session.state.player = { x: targetNode.x, y: targetNode.y };
  session.activeWorldDestinationId = destination.id;
  session.state.world = { x: destination.x, y: destination.y };
  session.activeHotspot = targetArea.id === "castle" ? null : locationsForArea(targetArea.id).find((item) => item.node === targetNode.id) || null;
  session.activeCastleHotspot = targetArea.id === "castle" ? locationsForArea("castle").find((item) => item.node === targetNode.id) || null : null;
  elements.statusMessage.textContent = `${destination.label} area opened.`;
  persist();
  openArea(targetArea.id);
}
