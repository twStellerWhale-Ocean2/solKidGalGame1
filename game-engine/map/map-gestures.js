// map/map-gestures.js — 地圖手勢：拖曳、雙指縮放與視口套用（issue #298 自 main.js 拆出，行為零變更）。
import { clamp } from "../core/lookups.js";
import { session } from "../core/session.js";
import {
  activeTravelMapArea,
  areaMapMetrics,
  areaMapStage,
  areaMapViewport,
  areaMapViewportController,
  baseAreaMapDisplay,
  isMobileTravelMap,
  refreshCastleMapPositions,
  refreshMapPositions
} from "./map-runtime.js";
import { renderWorldMap } from "./world-map.js";
export function relativeStagePoint(stage, pointer) {
  const rect = stage.getBoundingClientRect();
  return {
    x: pointer.clientX - rect.left,
    y: pointer.clientY - rect.top
  };
}

export function pointerDistance(a, b) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export function pointerCenter(a, b) {
  return {
    clientX: (a.clientX + b.clientX) / 2,
    clientY: (a.clientY + b.clientY) / 2
  };
}

export function resetMapGestureStart() {
  if (!session.mapGesture) return;
  const viewport = areaMapViewport(session.mapGesture.areaId);
  const metrics = areaMapMetrics(session.mapGesture.areaId);
  const pointers = [...session.mapGesture.pointers.values()];
  session.mapGesture.startPan = { ...viewport.pan };
  session.mapGesture.startZoom = viewport.zoom;
  session.mapGesture.startPoints = pointers.map((pointer) => ({ ...pointer }));
  if (pointers.length >= 2) {
    const center = pointerCenter(pointers[0], pointers[1]);
    const centerStage = relativeStagePoint(session.mapGesture.stage, center);
    session.mapGesture.startDistance = Math.max(1, pointerDistance(pointers[0], pointers[1]));
    session.mapGesture.startCenterStage = centerStage;
    session.mapGesture.startMapFocus = {
      x: clamp((centerStage.x - metrics.offsetX) / metrics.displayWidth, 0, 1),
      y: clamp((centerStage.y - metrics.offsetY) / metrics.displayHeight, 0, 1)
    };
  } else if (pointers.length === 1) {
    session.mapGesture.startCenterStage = relativeStagePoint(session.mapGesture.stage, pointers[0]);
  }
}

export function applyAreaMapViewport(areaId, viewport) {
  areaMapViewportController.applyViewport(areaId, viewport);
}

export function refreshAreaMapPositions(areaId) {
  if (areaId === "castle") {
    refreshCastleMapPositions();
  } else if (areaId === "world") {
    renderWorldMap();
  } else {
    refreshMapPositions();
  }
}

export function scheduleAreaMapPositionRefresh(areaId) {
  session.pendingMapRefreshArea = areaId;
  if (session.pendingMapPositionFrame) return;
  session.pendingMapPositionFrame = requestAnimationFrame(() => {
    const areaToRefresh = session.pendingMapRefreshArea || session.state.area || "urban";
    session.pendingMapPositionFrame = 0;
    session.pendingMapRefreshArea = "";
    refreshAreaMapPositions(areaToRefresh);
  });
}

export function mapGestureBlocked(event) {
  return Boolean(event.target.closest("button, .nearby-card, .destination-panel, .area-nav"));
}

export function beginAreaMapGesture(areaId, event) {
  if (!isMobileTravelMap()) return;
  if (mapGestureBlocked(event)) return;
  const stage = areaMapStage(areaId);
  if (!session.mapGesture || session.mapGesture.areaId !== areaId) {
    session.mapGesture = {
      areaId,
      stage,
      pointers: new Map(),
      moved: false
    };
  }
  session.mapGesture.pointers.set(event.pointerId, { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY });
  resetMapGestureStart();
  stage.classList.add("is-dragging");
  stage.setPointerCapture?.(event.pointerId);
}

export function moveAreaMapGesture(areaId, event) {
  if (!session.mapGesture || session.mapGesture.areaId !== areaId || !session.mapGesture.pointers.has(event.pointerId)) return;
  session.mapGesture.pointers.set(event.pointerId, { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY });
  const pointers = [...session.mapGesture.pointers.values()];
  if (pointers.length >= 2) {
    const center = pointerCenter(pointers[0], pointers[1]);
    const centerStage = relativeStagePoint(session.mapGesture.stage, center);
    const distance = Math.max(1, pointerDistance(pointers[0], pointers[1]));
    const zoom = clamp(
      session.mapGesture.startZoom * (distance / session.mapGesture.startDistance),
      areaMapViewportController.zoomLimits.min,
      areaMapViewportController.zoomLimits.max
    );
    const stageRect = session.mapGesture.stage.getBoundingClientRect();
    const baseDisplay = baseAreaMapDisplay(areaId, stageRect);
    const displayWidth = baseDisplay.width * zoom;
    const displayHeight = baseDisplay.height * zoom;
    const pan = {
      x: centerStage.x - session.mapGesture.startMapFocus.x * displayWidth - (stageRect.width - displayWidth) / 2,
      y: centerStage.y - session.mapGesture.startMapFocus.y * displayHeight - (stageRect.height - displayHeight) / 2
    };
    applyAreaMapViewport(areaId, { pan, zoom });
  } else if (pointers.length === 1) {
    const pointer = pointers[0];
    const startPoint = session.mapGesture.startPoints[0];
    const dx = pointer.clientX - startPoint.clientX;
    const dy = pointer.clientY - startPoint.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 4) session.mapGesture.moved = true;
    applyAreaMapViewport(areaId, {
      pan: { x: session.mapGesture.startPan.x + dx, y: session.mapGesture.startPan.y + dy },
      zoom: session.mapGesture.startZoom
    });
  }
  event.preventDefault();
  scheduleAreaMapPositionRefresh(areaId);
}

export function finishAreaMapGesture(areaId, event) {
  if (!session.mapGesture || session.mapGesture.areaId !== areaId || !session.mapGesture.pointers.has(event.pointerId)) return;
  const stage = areaMapStage(areaId);
  session.mapGesture.pointers.delete(event.pointerId);
  stage.releasePointerCapture?.(event.pointerId);
  if (session.mapGesture.pointers.size) {
    resetMapGestureStart();
    return;
  }
  stage.classList.remove("is-dragging");
  session.mapGesture = null;
}

export function beginMapDrag(event) {
  beginAreaMapGesture(activeTravelMapArea(), event);
}

export function moveMapDrag(event) {
  moveAreaMapGesture(activeTravelMapArea(), event);
}

export function finishMapDrag(event) {
  finishAreaMapGesture(activeTravelMapArea(), event);
}

export function beginCastleMapDrag(event) {
  beginAreaMapGesture("castle", event);
}

export function moveCastleMapDrag(event) {
  moveAreaMapGesture("castle", event);
}

export function finishCastleMapDrag(event) {
  finishAreaMapGesture("castle", event);
}

export function beginWorldMapDrag(event) {
  beginAreaMapGesture("world", event);
}

export function moveWorldMapDrag(event) {
  moveAreaMapGesture("world", event);
}

export function finishWorldMapDrag(event) {
  finishAreaMapGesture("world", event);
}
