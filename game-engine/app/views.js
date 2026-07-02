// app/views.js — 檢視切換與系統選單調度（issue #298 自 main.js 拆出，行為零變更）。
import {
  areaMapViewportController,
  ensureAreaPosition,
  ensureCastlePosition,
  mapWalkController,
  renderCastleMap,
  renderMap
} from "../map/map-runtime.js";
import { renderWorldMap, worldDestinationForArea } from "../map/world-map.js";
import { areaRegistry } from "../data/game-data.js";
import { renderAreaNav } from "../render/hud.js";
import { elements, session } from "../core/session.js";
export function changeView(viewName) {
  mapWalkController.clear();   // issue #178：切換畫面即停走動，避免按住狀態跨畫面殘留卡走
  if (["diary", "settings", "english", "save"].includes(viewName)) {
    openSystemMenu(viewName);
    return;
  }
  if (!document.getElementById(`${viewName}View`)) viewName = "home";
  if (viewName === "home") {
    session.state.area = "castle";
    ensureCastlePosition();
  } else if (viewName === "map") {
    if (session.state.area === "castle" || !areaRegistry[session.state.area]?.enabled) session.state.area = "urban";
    ensureAreaPosition(session.state.area);
  } else if (viewName === "world") {
    session.activeWorldDestinationId = worldDestinationForArea(session.state.area)?.id || session.activeWorldDestinationId || "castle";
    areaMapViewportController.requestCenter("world");
  }
  elements.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  elements.views.forEach((view) => view.classList.toggle("active", view.id === `${viewName}View`));
  if (location.hash.slice(1) !== viewName) {
    history.replaceState(null, "", `#${viewName}`);
  }
  if (viewName === "map") {
    setTimeout(() => {
      renderMap();
      elements.mapStage.focus({ preventScroll: true });
    }, 0);
  } else if (viewName === "world") {
    setTimeout(() => {
      renderWorldMap();
      elements.worldStage?.focus({ preventScroll: true });
    }, 0);
  } else if (viewName === "home") {
    setTimeout(() => {
      renderCastleMap();
      elements.castleStage?.focus({ preventScroll: true });
    }, 0);
  }
  renderAreaNav();
}

export function activeViewName() {
  const active = elements.views.find((view) => view.classList.contains("active"));
  return active?.id?.replace(/View$/, "") || "home";
}

export function isSystemMenuOpen() {
  return elements.systemMenu?.classList.contains("show");
}

export function openSystemMenu(panel = "diary") {
  changeSystemPanel(panel);
  elements.systemMenu.classList.add("show");
  elements.systemMenu.setAttribute("aria-hidden", "false");
  document.body.classList.add("system-menu-open");
  if (location.hash.slice(1) !== panel) history.replaceState(null, "", `#${panel}`);
  setTimeout(() => {
    elements.systemMenuBook?.focus({ preventScroll: true });
  }, 0);
}

export function closeSystemMenu() {
  if (!isSystemMenuOpen()) return;
  elements.systemMenu.classList.remove("show");
  elements.systemMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("system-menu-open");
  const viewName = activeViewName();
  if (["diary", "settings", "english", "save", "about"].includes(location.hash.slice(1))) {
    history.replaceState(null, "", `#${viewName}`);
  }
  elements.systemMenuButton?.focus({ preventScroll: true });
}

export function changeSystemPanel(panel = "diary") {
  if (!["diary", "settings", "english", "save", "about"].includes(panel)) panel = "diary";
  session.systemMenuPanel = panel;
  elements.systemMenuTabs.forEach((tab) => {
    const isActive = tab.dataset.menuPanel === panel;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
  elements.systemPanels.forEach((item) => {
    const isActive = item.dataset.menuPanel === panel;
    item.classList.toggle("active", isActive);
    item.hidden = !isActive;
  });
  if (isSystemMenuOpen() && location.hash.slice(1) !== panel) {
    history.replaceState(null, "", `#${panel}`);
  }
}

