import { buildInfo } from "./build/version.js";
import {
  areaRegistry,
  castleHotspots,
  castleMapImageSize,
  castleMapNodes,
  categories,
  difficultyConfig,
  hotspots,
  lessons,
  mapActors,
  mapImageSize,
  mapNodes,
  questTemplates,
  sceneConfigs,
  shopItems
} from "./data/game-data.js";
import { defaultState } from "./state/default-state.js";
import { openAISettingsKey, saveMarkerEnd, saveMarkerStart, storageKey } from "./state/storage.js";
import { FLOW_STAGE_LABELS } from "./flow/stages.js";
import { renderBuildInfo } from "./render/settings.js";
import { installTestingHooks } from "./testing/selftests.js";

let state = loadLocalState();
let openAISettings = loadOpenAISettings();
let activeHotspot = null;
let activeLesson = null;
let advMode = "closed";
let shopCategory = "outfit";
let activeShopHotspot = null;
let wardrobeCategory = "outfit";
let princessExpression = "normal";
let npcExpression = "normal";
let advFocusIndex = 0;
let mapLifeFrame = null;
let shopPreviewItemId = "";
let mapPan = { x: 0, y: 0 };
let mapDrag = null;
let pendingMapPositionFrame = 0;
let systemMenuPanel = "diary";
let activeCastleHotspot = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  tabs: $$(".tab-button"),
  views: $$(".view"),
  homeView: $("#homeView"),
  saveButton: $("#saveButton"),
  loadButton: $("#loadButton"),
  loadFileInput: $("#loadFileInput"),
  systemMenuButton: $("#systemMenuButton"),
  systemMenu: $("#systemMenu"),
  systemMenuBook: $(".system-menu-book"),
  systemMenuClose: $("#systemMenuClose"),
  systemMenuTabs: $$(".system-menu-tab"),
  systemPanels: $$(".system-panel"),
  coinValue: $("#coinValue"),
  energyValue: $("#energyValue"),
  levelValue: $("#levelValue"),
  outfitSummary: $("#outfitSummary"),
  statusMessage: $("#statusMessage"),
  goMapButton: $("#goMapButton"),
  wardrobeCount: $("#wardrobeCount"),
  wardrobeTabs: $("#wardrobeTabs"),
  wardrobeGrid: $("#wardrobeGrid"),
  areaNav: $("#areaNav"),
  castleStage: $("#castleStage"),
  castleMarkerLayer: $("#castleMarkerLayer"),
  mapStage: $("#mapStage"),
  mapImage: $("#mapImage"),
  playerToken: $("#playerToken"),
  hotspotLayer: $("#hotspotLayer"),
  nodeLayer: $("#nodeLayer"),
  routeLayer: $("#routeLayer"),
  mapLifeLayer: $("#mapLifeLayer"),
  destinationPanel: $("#destinationPanel"),
  destinationHint: $("#destinationHint"),
  destinationList: $("#destinationList"),
  returnHomeButton: $("#returnHomeButton"),
  advModal: $("#advModal"),
  advScene: $("#advScene"),
  advTitle: $("#advTitle"),
  advNpcPortrait: $("#advNpcPortrait"),
  advSpeaker: $("#advSpeaker"),
  advLine: $("#advLine"),
  advPrompt: $("#advPrompt"),
  choiceList: $("#choiceList"),
  shopArea: $("#shopArea"),
  advShopTabs: $("#advShopTabs"),
  advShopGrid: $("#advShopGrid"),
  advFeedback: $("#advFeedback"),
  speakPromptButton: $("#speakPromptButton"),
  helpButton: $("#helpButton"),
  collectionSummary: $("#collectionSummary"),
  diaryList: $("#diaryList"),
  clearDiaryButton: $("#clearDiaryButton"),
  difficultySelect: $("#difficultySelect"),
  speakToggleButton: $("#speakToggleButton"),
  resetButton: $("#resetButton"),
  openaiSettingsForm: $("#openaiSettingsForm"),
  openaiOrgInput: $("#openaiOrgInput"),
  openaiKeyInput: $("#openaiKeyInput"),
  saveOpenAIButton: $("#saveOpenAIButton"),
  clearOpenAIButton: $("#clearOpenAIButton"),
  aiStatus: $("#aiStatus"),
  versionValue: $("#versionValue"),
  buildDateValue: $("#buildDateValue"),
  roomPropDesk: $("#roomPropDesk"),
  roomPropLamp: $("#roomPropLamp")
};

function loadLocalState() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return freshState();
    return normalizeState(JSON.parse(saved));
  } catch {
    return freshState();
  }
}

function loadOpenAISettings() {
  try {
    const saved = localStorage.getItem(openAISettingsKey);
    if (!saved) return { orgId: "", apiKey: "" };
    const parsed = JSON.parse(saved);
    return {
      orgId: typeof parsed.orgId === "string" ? parsed.orgId : "",
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : ""
    };
  } catch {
    return { orgId: "", apiKey: "" };
  }
}

function persistOpenAISettings() {
  localStorage.setItem(openAISettingsKey, JSON.stringify(openAISettings));
}

function freshState() {
  const stateCopy = JSON.parse(JSON.stringify(defaultState));
  stateCopy.activeQuest = createRandomQuest(null);
  return stateCopy;
}

function normalizeState(candidate = {}) {
  const base = freshState();
  const merged = { ...base, ...candidate };
  merged.owned = Array.isArray(candidate.owned) ? [...new Set(["pinkDress", ...candidate.owned])] : base.owned;
  const candidateOutfit = candidate.outfit || {};
  merged.outfit = { ...base.outfit, ...candidateOutfit };
  if (candidateOutfit.dress && !candidateOutfit.outfit) merged.outfit.outfit = candidateOutfit.dress;
  delete merged.outfit.dress;
  delete merged.outfit.hat;
  delete merged.outfit.pants;
  delete merged.outfit.head;
  merged.diary = Array.isArray(candidate.diary) ? candidate.diary : [];
  merged.completedLessons = Array.isArray(candidate.completedLessons) ? candidate.completedLessons : [];
  merged.metNpcs = Array.isArray(candidate.metNpcs) ? [...new Set(candidate.metNpcs)] : [];
  merged.learnedWords = Array.isArray(candidate.learnedWords) ? [...new Set(candidate.learnedWords)] : [];
  merged.badges = Array.isArray(candidate.badges) ? [...new Set(candidate.badges)] : [];
  merged.area = areaRegistry[candidate.area]?.enabled ? candidate.area : base.area;
  const nodes = nodeMapForArea(merged.area);
  merged.playerNode = nodes[candidate.playerNode] ? candidate.playerNode : areaRegistry[merged.area].defaultNode;
  merged.player = normalizePlayer(candidate.player, merged.playerNode, merged.area);
  merged.difficulty = Number(difficultyConfig[candidate.difficulty] ? candidate.difficulty : base.difficulty);
  merged.activeQuest = normalizeQuest(candidate.activeQuest || candidate.currentQuest) || createRandomQuest(null);
  delete merged.schedule;
  delete merged.currentQuest;
  delete merged.week;
  delete merged.dayIndex;
  return merged;
}

function nodeMapForArea(areaId) {
  return areaRegistry[areaId]?.nodes || mapNodes;
}

function normalizePlayer(player, nodeId, areaId = "kingdom") {
  if (player && typeof player.x === "number" && typeof player.y === "number") {
    return { x: clamp(player.x, 6, 94), y: clamp(player.y, 8, 92) };
  }
  const nodes = nodeMapForArea(areaId);
  const node = nodes[nodeId] || nodes[areaRegistry[areaId]?.defaultNode] || mapNodes.garden;
  return { x: node.x, y: node.y };
}

function closestNodeFromLegacy(player, areaId = "kingdom") {
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

function normalizeQuest(quest) {
  if (!quest || typeof quest !== "object") return null;
  const place = quest.place || quest.targetPlace;
  const template = questTemplates.find((item) => item.id === quest.templateId || item.place === place);
  if (!template) return null;
  const hotspot = hotspotById(template.place);
  const scene = sceneConfigFor(hotspot);
  return {
    id: quest.id || `${Date.now()}-${template.id}`,
    templateId: template.id,
    place: template.place,
    title: template.title,
    opening: template.opening,
    ending: template.ending,
    npc: scene.npc
  };
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hotspotById(id) {
  return [...castleHotspots, ...hotspots].find((hotspot) => hotspot.id === id);
}

function sceneConfigFor(hotspot) {
  if (!hotspot) return {};
  return { ...hotspot, ...(sceneConfigs[hotspot.id] || {}) };
}

function hotspotByNode(nodeId) {
  return [...castleHotspots, ...hotspots].find((hotspot) => hotspot.node === nodeId) || null;
}

function itemById(id) {
  return shopItems.find((item) => item.id === id) || null;
}

function createRandomQuest(previousPlace) {
  const available = questTemplates.filter((quest) => quest.place !== previousPlace);
  const pool = available.length ? available : questTemplates;
  const template = pool[Math.floor(Math.random() * pool.length)];
  return createQuestFromTemplate(template);
}

function createQuestForPlace(place) {
  const template = questTemplates.find((quest) => quest.place === place) || questTemplates[0];
  return createQuestFromTemplate(template);
}

function createQuestFromTemplate(template) {
  const hotspot = hotspotById(template.place);
  const scene = sceneConfigFor(hotspot);
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}-${template.id}`,
    templateId: template.id,
    place: template.place,
    title: template.title,
    opening: template.opening,
    ending: template.ending,
    npc: scene.npc
  };
}

function areaForHotspot(hotspot) {
  if (!hotspot) return state.area || "kingdom";
  if (hotspot.area) return hotspot.area;
  if (castleMapNodes[hotspot.node]) return "castle";
  return "kingdom";
}

function ensureKingdomPosition() {
  if (mapNodes[state.playerNode]) return;
  const target = hotspotById(state.activeQuest?.place) || hotspotById(areaRegistry.kingdom.defaultNode);
  const node = mapNodes[target?.node] || mapNodes[areaRegistry.kingdom.defaultNode];
  state.playerNode = node.id;
  state.player = { x: node.x, y: node.y };
}

function ensureCastlePosition() {
  if (castleMapNodes[state.playerNode]) return;
  const node = castleMapNodes[areaRegistry.castle.defaultNode];
  state.playerNode = node.id;
  state.player = { x: node.x, y: node.y };
}

function openArea(areaId) {
  const area = areaRegistry[areaId];
  if (!area?.enabled) {
    elements.statusMessage.textContent = `${area?.label || "This area"} is not open yet.`;
    return;
  }
  state.area = areaId;
  if (areaId === "kingdom") {
    ensureKingdomPosition();
  } else if (areaId === "castle") {
    ensureCastlePosition();
  }
  persist();
  changeView(area.view);
  renderAreaNav();
}

function changeView(viewName) {
  if (["diary", "settings", "save"].includes(viewName)) {
    openSystemMenu(viewName);
    return;
  }
  if (!document.getElementById(`${viewName}View`)) viewName = "home";
  if (viewName === "home") {
    state.area = "castle";
    ensureCastlePosition();
  } else if (viewName === "map") {
    state.area = "kingdom";
    ensureKingdomPosition();
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
  } else if (viewName === "home") {
    setTimeout(() => {
      renderCastleMap();
      elements.castleStage?.focus({ preventScroll: true });
    }, 0);
  }
  renderAreaNav();
}

function activeViewName() {
  const active = elements.views.find((view) => view.classList.contains("active"));
  return active?.id?.replace(/View$/, "") || "home";
}

function isSystemMenuOpen() {
  return elements.systemMenu?.classList.contains("show");
}

function openSystemMenu(panel = "diary") {
  changeSystemPanel(panel);
  elements.systemMenu.classList.add("show");
  elements.systemMenu.setAttribute("aria-hidden", "false");
  document.body.classList.add("system-menu-open");
  if (location.hash.slice(1) !== panel) history.replaceState(null, "", `#${panel}`);
  setTimeout(() => {
    elements.systemMenuBook?.focus({ preventScroll: true });
  }, 0);
}

function closeSystemMenu() {
  if (!isSystemMenuOpen()) return;
  elements.systemMenu.classList.remove("show");
  elements.systemMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("system-menu-open");
  const viewName = activeViewName();
  if (["diary", "settings", "save"].includes(location.hash.slice(1))) {
    history.replaceState(null, "", `#${viewName}`);
  }
  elements.systemMenuButton?.focus({ preventScroll: true });
}

function changeSystemPanel(panel = "diary") {
  if (!["diary", "settings", "save"].includes(panel)) panel = "diary";
  systemMenuPanel = panel;
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

function applyEffects(effects = {}) {
  state.coins = Math.max(0, state.coins + (effects.coins || 0));
  state.energy = clamp(state.energy + (effects.energy || 0), 0, 100);
  state.vocab += effects.vocab || 0;
  state.expression += effects.expression || 0;
  state.kindness += effects.kindness || 0;
  state.mood = clamp(state.mood + (effects.mood || 0), 0, 100);
}

function effectText(effects = {}) {
  const parts = [];
  if (effects.coins) parts.push(`${effects.coins > 0 ? "+" : ""}${effects.coins} coins`);
  if (effects.energy) parts.push(`${effects.energy > 0 ? "+" : ""}${effects.energy} energy`);
  if (effects.vocab) parts.push(`+${effects.vocab} words`);
  if (effects.expression) parts.push(`+${effects.expression} talk`);
  if (effects.kindness) parts.push(`+${effects.kindness} kind`);
  if (effects.mood) parts.push(`${effects.mood > 0 ? "+" : ""}${effects.mood} mood`);
  return parts.join(", ") || "No change";
}

function addDiary(entry) {
  state.diary.unshift({ at: new Date().toLocaleString("en-US"), ...entry });
  state.diary = state.diary.slice(0, 80);
}

function addUnique(listName, values) {
  values.forEach((value) => {
    if (value && !state[listName].includes(value)) state[listName].push(value);
  });
}

function awardBadge(id) {
  if (!state.badges.includes(id)) state.badges.push(id);
}

function updateProgressBadges() {
  if (state.completedLessons.length >= 1) awardBadge("First Quest");
  if (state.completedLessons.length >= 5) awardBadge("Kind Helper");
  if (state.learnedWords.length >= 5) awardBadge("Word Finder");
  if (state.owned.length >= 4) awardBadge("Doll Stylist");
}

function setExpressions(princess = "normal", npc = "normal") {
  princessExpression = princess;
  npcExpression = npc;
  document.querySelectorAll("[data-doll]").forEach((doll) => {
    doll.dataset.expression = princessExpression;
  });
  elements.advNpcPortrait.dataset.expression = npcExpression;
}

function render() {
  renderStatus();
  renderAreaNav();
  renderPaperDolls();
  renderHome();
  renderCastleMap();
  renderMap();
  renderDiary();
  renderSettings();
}

function renderStatus() {
  elements.coinValue.textContent = state.coins;
  elements.energyValue.textContent = state.energy;
  elements.levelValue.textContent = `Lv ${state.difficulty}`;
  elements.outfitSummary.textContent = outfitSummary();
}

function moodLabel(mood) {
  if (mood >= 82) return "Happy";
  if (mood >= 56) return "OK";
  if (mood >= 30) return "Tired";
  return "Sad";
}

function outfitSummary() {
  const labels = [];
  categories.map((category) => category.id).forEach((type) => {
    if (type === "room") return;
    const item = itemById(state.outfit[type]);
    if (item) labels.push(item.name);
  });
  return labels.join(" / ") || "No outfit";
}

function renderPaperDolls() {
  document.querySelectorAll("[data-doll]").forEach((doll) => {
    doll.innerHTML = avatarMarkup(doll.dataset.doll || "side");
    doll.dataset.outfit = state.outfit.outfit || "none";
    doll.dataset.shoes = state.outfit.shoes || "none";
    doll.dataset.accessory = state.outfit.accessory || "none";
    doll.dataset.expression = princessExpression;
  });
}

function avatarMarkup(surface, outfitState = state.outfit) {
  const outfit = itemById(outfitState.outfit) || itemById("pinkDress");
  const spritePosition = outfit?.sprite || "0%";
  return `
    <div class="avatar-shadow"></div>
    <span class="avatar-base avatar-sprite" style="--sprite-x:${spritePosition}" aria-hidden="true"></span>
    <span class="avatar-layer avatar-shoes" aria-hidden="true"></span>
    <span class="avatar-layer avatar-accessory" aria-hidden="true"></span>
  `;
}

function avatarPoseFor(surface) {
  if (surface === "map") return "happy";
  if (princessExpression === "happy") return "cheer";
  if (princessExpression === "thinking") return "thinking";
  return "happy";
}

function renderHome() {
  renderCastleMap();
}

function renderAreaNav() {
  if (!elements.areaNav) return;
  elements.areaNav.innerHTML = "";
  Object.values(areaRegistry).filter((area) => area.enabled).forEach((area) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `area-button${state.area === area.id ? " active" : ""}`;
    button.textContent = area.label;
    button.addEventListener("click", () => openArea(area.id));
    elements.areaNav.appendChild(button);
  });
}

function renderWardrobeTabs() {
  elements.wardrobeTabs.innerHTML = "";
  categories.forEach((category) => {
    const ownedCount = shopItems.filter((item) => item.type === category.id && state.owned.includes(item.id)).length;
    if (!ownedCount) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-tab wardrobe-accordion-tab${wardrobeCategory === category.id ? " active" : ""}`;
    button.textContent = `${category.label} ${ownedCount}`;
    button.addEventListener("click", () => {
      wardrobeCategory = wardrobeCategory === category.id ? "" : category.id;
      renderHome();
    });
    elements.wardrobeTabs.appendChild(button);
  });
}

function renderCategoryTabs(container, active, onClick, includeOwnedOnly = false, allowedCategories = null) {
  container.innerHTML = "";
  categories.forEach((category) => {
    if (allowedCategories && !allowedCategories.includes(category.id)) return;
    if (includeOwnedOnly && !shopItems.some((item) => item.type === category.id && state.owned.includes(item.id))) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-tab${active === category.id ? " active" : ""}`;
    button.textContent = category.label;
    button.addEventListener("click", () => onClick(category.id));
    container.appendChild(button);
  });
}

function renderWardrobe() {
  renderWardrobeTabs();
  elements.wardrobeGrid.innerHTML = "";
  const ownedGroups = categories.map((category) => ({
    category,
    items: shopItems.filter((item) => item.type === category.id && state.owned.includes(item.id))
  })).filter((group) => group.items.length);

  if (!ownedGroups.length) {
    elements.wardrobeGrid.innerHTML = `<div class="wardrobe-empty">Buy treasures in town.</div>`;
    return;
  }

  ownedGroups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "wardrobe-section";
    section.innerHTML = `
      <div class="wardrobe-section-title">
        <strong>${group.category.label}</strong>
        <span>${group.items.length}</span>
      </div>
      <div class="wardrobe-section-items"></div>
    `;
    const list = section.querySelector(".wardrobe-section-items");
    group.items.forEach((item) => {
      list.appendChild(createItemCard(item, {
        mode: "wardrobe",
        action: () => toggleEquip(item)
      }));
    });
    elements.wardrobeGrid.appendChild(section);
  });
}

function createItemCard(item, options = {}) {
  const owned = state.owned.includes(item.id);
  const equipped = state.outfit[item.type] === item.id;
  const affordable = state.coins >= item.cost;
  const button = document.createElement("button");
  button.type = "button";
  button.className = `item-card ${item.type}${owned ? " owned" : ""}${equipped ? " equipped" : ""}${!owned && !affordable ? " locked" : ""}${options.selected ? " selected" : ""}`;
  button.dataset.itemId = item.id;
  const previewStyle = `--sprite-x:${item.sprite || "0%"};--c1:${item.colors[0]};--c2:${item.colors[1]};--item-img:url(${item.image})`;
  button.innerHTML = `
    <span class="item-preview item-art item-image ${item.shape}" style="${previewStyle}">
      <span aria-hidden="true">${item.icon || "✦"}</span>
    </span>
    <strong>${item.name}</strong>
    <span>${owned ? equipped ? "Equipped" : "Owned" : `${item.cost} coins`}</span>
    <small>${categoryLabel(item.type)}</small>
  `;
  button.addEventListener("click", options.action || (() => {}));
  if (options.onPreview) {
    button.addEventListener("focus", () => options.onPreview(item));
    button.addEventListener("mouseenter", () => options.onPreview(item));
  }
  return button;
}

function categoryLabel(type) {
  return categories.find((category) => category.id === type)?.label || type;
}

function toggleEquip(item) {
  if (item.type === "room") {
    elements.statusMessage.textContent = `${item.name} is placed in Lumi's room.`;
    persist();
    render();
    return;
  }
  state.outfit[item.type] = state.outfit[item.type] === item.id ? "none" : item.id;
  elements.statusMessage.textContent = state.outfit[item.type] === item.id ? `${item.name} equipped.` : `${item.name} removed.`;
  persist();
  render();
}

function castleCoverMetrics() {
  const rect = elements.castleStage.getBoundingClientRect();
  const imageRatio = castleMapImageSize.width / castleMapImageSize.height;
  const stageRatio = rect.width / rect.height;
  const displayWidth = stageRatio > imageRatio ? rect.width : rect.height * imageRatio;
  const displayHeight = stageRatio > imageRatio ? rect.width / imageRatio : rect.height;
  return {
    width: rect.width,
    height: rect.height,
    displayWidth,
    displayHeight,
    offsetX: (rect.width - displayWidth) / 2,
    offsetY: (rect.height - displayHeight) / 2
  };
}

function castlePointToStage(x, y, metrics = castleCoverMetrics()) {
  return {
    x: metrics.offsetX + (x / 100) * metrics.displayWidth,
    y: metrics.offsetY + (y / 100) * metrics.displayHeight
  };
}

function positionCastleElement(element, x, y, metrics = castleCoverMetrics()) {
  const point = castlePointToStage(x, y, metrics);
  element.style.left = `${point.x}px`;
  element.style.top = `${point.y}px`;
}

function renderCastleMap() {
  if (!elements.castleStage || !elements.castleMarkerLayer) return;
  if (elements.castleStage.offsetParent === null && activeViewName() !== "home") return;
  const metrics = castleCoverMetrics();
  elements.castleMarkerLayer.innerHTML = "";
  castleHotspots.forEach((hotspot) => {
    const node = castleMapNodes[hotspot.node];
    if (!node) return;
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `map-marker hotspot castle-marker${activeCastleHotspot?.id === hotspot.id ? " nearby" : ""}${hotspot.kind === "future" ? " disabled" : ""}`;
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
  });
}

function focusCastleHotspot(hotspotId, rerender = true) {
  activeCastleHotspot = castleHotspots.find((hotspot) => hotspot.id === hotspotId) || castleHotspots[0];
  if (rerender) renderCastleMap();
  elements.castleStage.focus({ preventScroll: true });
}

function handleCastleHotspotClick(hotspotId) {
  if (activeCastleHotspot?.id === hotspotId) {
    interactCastleHotspot();
    return;
  }
  focusCastleHotspot(hotspotId);
}

function interactCastleHotspot() {
  const hotspot = activeCastleHotspot || castleHotspots[0];
  if (!hotspot) return;
  if (hotspot.kind === "gate" && hotspot.targetArea) {
    openArea(hotspot.targetArea);
    return;
  }
  if (hotspot.kind === "future") {
    elements.statusMessage.textContent = `${hotspot.label} is reserved for a later chapter.`;
    return;
  }
  if (hotspot.kind === "room") {
    openRoomScene(hotspot);
  }
}

function renderMap() {
  if (!elements.mapStage || (elements.mapStage.offsetParent === null && activeViewName() !== "map")) return;
  ensureKingdomPosition();
  const target = hotspotById(state.activeQuest.place);
  if (elements.destinationHint) elements.destinationHint.textContent = `${target.icon} ${target.label} is waiting.`;
  elements.routeLayer.innerHTML = "";
  elements.nodeLayer.innerHTML = "";
  const metrics = mapCoverMetrics();
  syncMapPanStyles(metrics);
  renderMapActors(metrics);
  renderHotspots(metrics);
  updatePlayerPosition(metrics);
  updateNearbyHotspot();
  startMapLife();
}

function renderDestinationPicker() {
  if (!elements.destinationList) return;
  const targetId = state.activeQuest.place;
  elements.destinationList.innerHTML = "";
  hotspots.filter((hotspot) => hotspot.kind !== "room").forEach((hotspot) => {
    const isTarget = hotspot.id === targetId;
    const isShop = hotspot.kind === "shop";
    const button = document.createElement("button");
    button.type = "button";
    button.className = `destination-card${isTarget ? " target" : ""}${isShop ? " shop" : ""}`;
    button.dataset.destinationId = hotspot.id;
    button.innerHTML = `
      <span class="destination-icon" aria-hidden="true">${hotspot.icon}</span>
      <span class="destination-copy">
        <strong>${hotspot.label}</strong>
        <small>${destinationActionText(hotspot, isTarget)}</small>
      </span>
      <span class="destination-badge">${isTarget ? "Talk" : isShop ? "Shop" : "Visit"}</span>
    `;
    button.addEventListener("click", () => chooseDestination(hotspot.id));
    elements.destinationList.appendChild(button);
  });
}

function destinationActionText(hotspot, isTarget) {
  if (isTarget) return `${sceneConfigFor(hotspot).npc} has today's English task.`;
  if (hotspot.kind === "shop") {
    const categoriesText = allowedShopCategories(hotspot).map(categoryLabel).join(" / ");
    return `Try ${categoriesText.toLowerCase()} rewards.`;
  }
  return hotspot.hint;
}

function chooseDestination(hotspotId) {
  const hotspot = hotspots.find((item) => item.id === hotspotId);
  if (!hotspot) return;
  const node = mapNodes[hotspot.node];
  if (node) {
    state.playerNode = node.id;
    state.player = { x: node.x, y: node.y };
  }
  persist();
  renderMap();
  activeHotspot = hotspot;
  updateHotspotFocus();
  openSceneAdv(hotspot);
}

function focusTravelHotspot(hotspotId) {
  const hotspot = hotspots.find((item) => item.id === hotspotId);
  const node = mapNodes[hotspot?.node];
  if (!hotspot || !node) return;
  state.playerNode = node.id;
  state.player = { x: node.x, y: node.y };
  activeHotspot = hotspot;
  persist();
  renderMap();
  activeHotspot = hotspot;
  updateHotspotFocus();
  elements.mapStage.focus({ preventScroll: true });
}

function handleTravelHotspotClick(hotspotId) {
  if (activeHotspot?.id === hotspotId) {
    interactNearby();
    return;
  }
  focusTravelHotspot(hotspotId);
}

function isMobileTravelMap() {
  return window.matchMedia("(max-width: 820px)").matches;
}

function clampMapPan(pan, metrics) {
  if (!isMobileTravelMap()) return { x: 0, y: 0 };
  const maxX = Math.max(0, (metrics.displayWidth - metrics.width) / 2);
  const maxY = Math.max(0, (metrics.displayHeight - metrics.height) / 2);
  return {
    x: clamp(pan.x, -maxX, maxX),
    y: clamp(pan.y, -maxY, maxY)
  };
}

function syncMapPanStyles(metrics = mapCoverMetrics()) {
  elements.mapStage.style.setProperty("--map-pan-x", `${metrics.panX}px`);
  elements.mapStage.style.setProperty("--map-pan-y", `${metrics.panY}px`);
}

function mapCoverMetrics() {
  const rect = elements.mapStage.getBoundingClientRect();
  const imageRatio = mapImageSize.width / mapImageSize.height;
  const stageRatio = rect.width / rect.height;
  const useCover = isMobileTravelMap();
  const baseDisplayWidth = useCover
    ? stageRatio > imageRatio ? rect.width : rect.height * imageRatio
    : stageRatio > imageRatio ? rect.height * imageRatio : rect.width;
  const baseDisplayHeight = useCover
    ? stageRatio > imageRatio ? rect.width / imageRatio : rect.height
    : stageRatio > imageRatio ? rect.height : rect.width / imageRatio;
  const mobileMapScale = useCover ? 1.06 : 1;
  const displayWidth = baseDisplayWidth * mobileMapScale;
  const displayHeight = baseDisplayHeight * mobileMapScale;
  const constrainedPan = clampMapPan(mapPan, { width: rect.width, height: rect.height, displayWidth, displayHeight });
  mapPan = constrainedPan;
  return {
    width: rect.width,
    height: rect.height,
    displayWidth,
    displayHeight,
    panX: constrainedPan.x,
    panY: constrainedPan.y,
    offsetX: (rect.width - displayWidth) / 2 + constrainedPan.x,
    offsetY: (rect.height - displayHeight) / 2 + constrainedPan.y
  };
}

function mapPointToStage(x, y, metrics = mapCoverMetrics()) {
  return {
    x: metrics.offsetX + (x / 100) * metrics.displayWidth,
    y: metrics.offsetY + (y / 100) * metrics.displayHeight
  };
}

function positionMapElement(element, x, y, metrics = mapCoverMetrics()) {
  const point = mapPointToStage(x, y, metrics);
  element.style.left = `${point.x}px`;
  element.style.top = `${point.y}px`;
}

function renderMapActors(metrics = mapCoverMetrics()) {
  if (!elements.mapLifeLayer) return;
  if (!metrics.width || !metrics.height) return;
  elements.mapLifeLayer.innerHTML = "";
  mapActors.forEach((actor) => {
    const point = mapPointToStage(actor.x, actor.y, metrics);
    const item = document.createElement("span");
    item.className = `map-actor map-actor-${actor.type}${actor.src ? " map-actor-image" : ""}`;
    item.dataset.actorId = actor.id;
    item.dataset.actorType = actor.type;
    item.dataset.phase = String(actor.phase || 0);
    item.dataset.scale = String(actor.scale || 1);
    item.dataset.anchorX = String(actor.anchorX ?? 0.5);
    item.dataset.anchorY = String(actor.anchorY ?? 0.5);
    item.style.left = `${point.x}px`;
    item.style.top = `${point.y}px`;
    item.style.width = `${(actor.w / 100) * metrics.displayWidth}px`;
    item.style.height = `${(actor.h / 100) * metrics.displayHeight}px`;
    item.style.zIndex = String(actor.z || 1);
    if (actor.src) item.style.backgroundImage = `url("${actor.src}")`;
    elements.mapLifeLayer.appendChild(item);
  });
}

function startMapLife() {
  if (mapLifeFrame) return;
  const tick = (time) => {
    const t = time / 1000;
    document.querySelectorAll(".map-actor").forEach((item) => {
      const type = item.dataset.actorType;
      const phase = Number(item.dataset.phase || 0);
      const scale = Number(item.dataset.scale || 1);
      const anchorX = Number(item.dataset.anchorX || 0.5) * -100;
      const anchorY = Number(item.dataset.anchorY || 0.5) * -100;
      let dx = 0;
      let dy = 0;
      let rotate = 0;
      let skew = 0;
      let pulse = 1;
      if (type === "water") {
        dx = Math.sin(t * 0.34 + phase) * 7;
        dy = Math.cos(t * 0.28 + phase) * 4;
        pulse = 1 + Math.sin(t * 0.42 + phase) * 0.012;
        item.style.opacity = String(0.18 + Math.sin(t * 0.46 + phase) * 0.05);
      } else if (type === "ship") {
        dx = Math.sin(t * 0.48 + phase) * 0.9;
        dy = Math.sin(t * 0.72 + phase) * 1.8;
        rotate = Math.sin(t * 0.55 + phase) * 0.18;
        item.style.opacity = "0.38";
      } else if (type === "wave") {
        dx = Math.sin(t * 1.7 + phase) * 10;
        dy = Math.cos(t * 1.3 + phase) * 4;
        pulse = 1 + Math.sin(t * 1.4 + phase) * 0.07;
        item.style.opacity = String(0.44 + Math.sin(t * 1.4 + phase) * 0.22);
      } else if (type === "windmill") {
        rotate = (t * 72 + phase * 90) % 360;
        item.style.opacity = "0.8";
      } else if (type === "flag") {
        skew = Math.sin(t * 3.2 + phase) * 5;
        dx = Math.sin(t * 2.4 + phase) * 1.2;
        item.style.opacity = "0.76";
      } else if (type === "glow") {
        pulse = 1 + Math.sin(t * 1.6 + phase) * 0.16;
        item.style.opacity = String(0.34 + Math.sin(t * 1.6 + phase) * 0.14);
      } else if (type === "bird") {
        dx = ((t * 18 + phase * 40) % 70) - 20;
        dy = Math.sin(t * 2.1 + phase) * 5;
      }
      item.style.transform = `translate(${anchorX}%, ${anchorY}%) translate(${dx}px, ${dy}px) rotate(${rotate}deg) skewY(${skew}deg) scale(${scale * pulse})`;
    });
    mapLifeFrame = requestAnimationFrame(tick);
  };
  mapLifeFrame = requestAnimationFrame(tick);
}

function renderRoutes() {
  const drawn = new Set();
  elements.routeLayer.innerHTML = "";
  Object.values(mapNodes).forEach((node) => {
    node.links.forEach((linkId) => {
      const key = [node.id, linkId].sort().join("-");
      if (drawn.has(key)) return;
      drawn.add(key);
      const other = mapNodes[linkId];
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", node.x);
      line.setAttribute("y1", node.y);
      line.setAttribute("x2", other.x);
      line.setAttribute("y2", other.y);
      elements.routeLayer.appendChild(line);
    });
  });
}

function renderNodes() {
  const metrics = mapCoverMetrics();
  elements.nodeLayer.innerHTML = "";
  Object.values(mapNodes).forEach((node) => {
    const marker = document.createElement("div");
    marker.className = `road-node${node.id === state.playerNode ? " current" : ""}${mapNodes[state.playerNode].links.includes(node.id) ? " reachable" : ""}`;
    positionMapElement(marker, node.x, node.y, metrics);
    elements.nodeLayer.appendChild(marker);
  });
}

function renderHotspots(metrics = mapCoverMetrics()) {
  elements.hotspotLayer.innerHTML = "";
  hotspots.forEach((hotspot) => {
    const node = mapNodes[hotspot.node];
    const marker = document.createElement("button");
    const isTarget = state.activeQuest.place === hotspot.id;
    marker.type = "button";
    marker.className = `map-marker hotspot${isTarget ? " target" : ""}${hotspot.kind === "shop" ? " shop" : ""}`;
    marker.dataset.hotspotId = hotspot.id;
    marker.dataset.label = hotspot.label;
    marker.setAttribute("aria-label", `${hotspot.label}. ${travelActionLabel(hotspot, isTarget)}.`);
    positionMapElement(marker, node.x, node.y, metrics);
    marker.innerHTML = `<span class="hotspot-icon" aria-hidden="true">${hotspot.icon}</span>`;
    marker.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleTravelHotspotClick(hotspot.id);
    });
    elements.hotspotLayer.appendChild(marker);
  });
}

function updatePlayerPosition(metrics = mapCoverMetrics()) {
  positionMapElement(elements.playerToken, state.player.x, state.player.y, metrics);
}

function refreshMapPositions() {
  const metrics = mapCoverMetrics();
  syncMapPanStyles(metrics);
  renderMapActors(metrics);
  renderHotspots(metrics);
  updatePlayerPosition(metrics);
  updateHotspotFocus();
}

function scheduleMapPositionRefresh() {
  if (pendingMapPositionFrame) return;
  pendingMapPositionFrame = requestAnimationFrame(() => {
    pendingMapPositionFrame = 0;
    refreshMapPositions();
  });
}

function travelActionLabel(hotspot, isTarget = hotspot?.id === state.activeQuest.place) {
  if (!hotspot) return "Visit";
  if (hotspot.kind === "room") return "Enter";
  if (hotspot.kind === "gate") return "Kingdom";
  if (hotspot.kind === "future") return "Soon";
  if (isTarget) return "Talk";
  if (hotspot.kind === "shop") return "Shop";
  return sceneConfigFor(hotspot).travelAction || "Visit";
}

function updateNearbyHotspot() {
  if (activeHotspot && !hotspots.some((hotspot) => hotspot.id === activeHotspot.id)) {
    activeHotspot = null;
  }
  updateHotspotFocus();
}

function updateHotspotFocus() {
  document.querySelectorAll(".hotspot").forEach((marker) => {
    marker.classList.toggle("nearby", activeHotspot?.id === marker.dataset.hotspotId);
  });
}

function nearbyHotspot() {
  const candidates = hotspots.map((hotspot) => {
    const node = mapNodes[hotspot.node];
    const radius = hotspot.focusRadius || 6.8;
    const distance = Math.hypot(node.x - state.player.x, (node.y - state.player.y) * 1.18);
    const score = distance / radius;
    return { hotspot, distance, score, radius };
  }).filter((candidate) => candidate.distance <= candidate.radius);
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.score - b.score || a.distance - b.distance);
  return candidates[0].hotspot;
}

function moveOnMap(dx, dy) {
  const speed = 1.45;
  const next = {
    x: clamp(state.player.x + dx * speed, 6, 94),
    y: clamp(state.player.y + dy * speed, 8, 92)
  };
  if (!isWalkable(next.x, next.y)) {
    elements.statusMessage.textContent = "Lumi should stay on safe paths.";
    return;
  }
  state.player = next;
  state.playerNode = closestNodeFromLegacy(state.player);
  elements.playerToken.classList.add("walking");
  window.setTimeout(() => elements.playerToken.classList.remove("walking"), 180);
  persist();
  renderMap();
}

function isWalkable(x, y) {
  if (y > 78 && (x < 28 || x > 76)) return false;
  if (y > 70 && x > 77) return false;
  if (x < 16 && y < 24) return false;
  if (x > 84 && y < 17) return false;
  const zones = [
    [58, 51, 36, 31],
    [55, 68, 35, 18],
    [70, 35, 21, 24],
    [49, 28, 12, 10],
    [43, 44, 16, 12],
    [51, 60, 25, 15],
    [38, 75, 19, 10],
    [73, 78, 11, 9],
    [77, 24, 20, 13],
    [65, 55, 15, 11],
    [58, 69, 16, 10],
    [72, 47, 16, 11],
    [30, 52, 18, 12],
    [38, 61, 17, 11]
  ];
  return zones.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1);
}

function interactNearby() {
  if (!activeHotspot) return;
  openSceneAdv(activeHotspot);
}

function openAdvBase(hotspot, mode) {
  const areaId = areaForHotspot(hotspot);
  state.area = areaId;
  changeView(areaRegistry[areaId]?.view || "map");
  clearRewardBursts();
  const scene = sceneConfigFor(hotspot);
  advMode = mode;
  activeLesson = null;
  activeShopHotspot = null;
  advFocusIndex = 0;
  setExpressions("normal", "normal");
  elements.advScene.dataset.mode = mode;
  elements.shopArea.before(elements.choiceList);
  elements.choiceList.classList.remove("shop-command-list");
  elements.advModal.classList.add("show");
  elements.advModal.setAttribute("aria-hidden", "false");
  elements.advScene.className = `adv-scene ${scene.scene}`;
  elements.advTitle.textContent = hotspot.label;
  elements.advNpcPortrait.className = `portrait-card adv-npc ${scene.npcClass}`;
  elements.advNpcPortrait.dataset.expression = npcExpression;
  elements.advSpeaker.textContent = scene.npc;
  elements.choiceList.innerHTML = "";
  elements.advShopGrid.innerHTML = "";
  elements.shopArea.classList.remove("show", "wardrobe-detail");
  elements.advFeedback.textContent = "";
  renderPaperDolls();
  requestAnimationFrame(() => {
    elements.advModal.classList.toggle("show", advMode !== "closed");
    elements.advModal.setAttribute("aria-hidden", advMode === "closed" ? "true" : "false");
  });
}

function openSceneAdv(hotspot) {
  if (!hotspot) return;
  if (hotspot.kind === "room") {
    openRoomScene(hotspot);
    return;
  }
  openAdvBase(hotspot, "scene");
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  const scene = sceneConfigFor(hotspot);
  const isTarget = hotspot.id === state.activeQuest.place;
  elements.advLine.textContent = scene.travelLine || hotspot.hint;
  elements.advPrompt.textContent = "Choose what to do here.";
  if (hotspot.kind === "shop") addAdvOption("Shop", () => openShopDetail(hotspot));
  if (isTarget) {
    addAdvOption("Talk", () => openQuestAdv(hotspot));
  } else {
    addAdvOption(hotspot.kind === "shop" ? "Chat" : "Talk", () => openHintAdv(hotspot));
  }
  addAdvOption("Leave", closeAdv, { leave: true });
  window.setTimeout(() => setAdvFocus(0), 0);
  speak(elements.advLine.textContent);
}

function openRoomScene(hotspot = hotspotById("princessRoom")) {
  openAdvBase(hotspot, "scene");
  addUnique("metNpcs", ["Lumi"]);
  elements.advLine.textContent = "Lumi is in her room. What should we change today?";
  elements.advPrompt.textContent = "Choose a room action.";
  addAdvOption("Dresses", () => openWardrobeDetail("outfit"));
  addAdvOption("Accessories", () => openWardrobeDetail("accessory"));
  addAdvOption("Shoes", () => openWardrobeDetail("shoes"));
  addAdvOption("Room Treasures", () => openWardrobeDetail("room"));
  addAdvOption("Go Outside", () => {
    closeAdv();
    openArea("castle");
  }, { leave: true });
  window.setTimeout(() => setAdvFocus(0), 0);
}

function addAdvOption(label, onClick, options = {}) {
  const button = document.createElement("button");
  button.className = `choice-button${options.leave ? " leave-choice" : ""}`;
  button.type = "button";
  button.textContent = options.number ? `${options.number}. ${label}` : label;
  button.setAttribute("aria-label", label);
  if (options.choice) button.dataset.choice = options.choice;
  button.addEventListener("click", onClick);
  elements.choiceList.appendChild(button);
  return button;
}

function advFocusableButtons() {
  if (!elements.advModal.classList.contains("show")) return [];
  const selectors = advMode === "shop" || advMode === "wardrobe"
    ? ["#advShopGrid .item-card:not(:disabled)", "#choiceList .choice-button:not(:disabled)"]
    : ["#choiceList .choice-button:not(:disabled)", "#advShopGrid .item-card:not(:disabled)"];
  return selectors.flatMap((selector) => [...document.querySelectorAll(selector)]).filter((button) => button.offsetParent !== null);
}

function setAdvFocus(index = 0) {
  const buttons = advFocusableButtons();
  document.querySelectorAll(".adv-focus").forEach((button) => button.classList.remove("adv-focus"));
  if (!buttons.length) return;
  advFocusIndex = (index + buttons.length) % buttons.length;
  const button = buttons[advFocusIndex];
  button.classList.add("adv-focus");
  button.focus({ preventScroll: true });
  button.scrollIntoView({ block: "nearest" });
}

function moveAdvFocus(delta) {
  const buttons = advFocusableButtons();
  if (!buttons.length) return;
  setAdvFocus(advFocusIndex + delta);
}

function confirmAdvFocus() {
  const buttons = advFocusableButtons();
  if (!buttons.length) return false;
  buttons[advFocusIndex]?.click();
  return true;
}

function openQuestAdv(hotspot) {
  const lesson = pickLesson(hotspot.id);
  if (!lesson) {
    openHintAdv(hotspot, `No task for ${state.difficulty} words here. Try another word level.`);
    return;
  }
  openAdvBase(hotspot, "quest");
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  activeLesson = lesson;
  elements.advLine.textContent = state.activeQuest.opening;
  elements.advPrompt.textContent = `${state.activeQuest.title}: ${lesson.prompt}`;
  shuffled(lesson.choices).forEach((choice, index) => {
    let button;
    button = addAdvOption(choice, () => answerLesson(button, choice), { number: index + 1, choice });
  });
  addAdvOption("Leave", closeAdv, { leave: true });
  window.setTimeout(() => setAdvFocus(0), 0);
  speak(state.activeQuest.opening);
}

function openHintAdv(hotspot, line = hotspot.hint) {
  openAdvBase(hotspot, "hint");
  setExpressions("thinking", "normal");
  elements.advLine.textContent = line;
  elements.advPrompt.textContent = `Hint: today's quest is at ${hotspotById(state.activeQuest.place).label}.`;
  elements.advFeedback.textContent = "";
  addAdvOption("Leave", closeAdv, { leave: true });
  window.setTimeout(() => setAdvFocus(0), 0);
}

function openShopAdv(hotspot) {
  openSceneAdv(hotspot);
}

function openShopDetail(hotspot) {
  openAdvBase(hotspot, "shop");
  activeShopHotspot = hotspot;
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  const firstCategory = hotspot.defaultCategory || hotspot.shopCategories?.[0] || "outfit";
  shopCategory = allowedShopCategories(hotspot).includes(shopCategory) ? shopCategory : firstCategory;
  shopPreviewItemId = shopItems.find((item) => item.type === shopCategory && allowedShopCategories(hotspot).includes(item.type))?.id || "";
  elements.advLine.textContent = shopGreeting(hotspot);
  elements.advPrompt.textContent = "Choose a treasure to preview. Press B or Buy when Lumi wants it.";
  elements.shopArea.classList.remove("wardrobe-detail");
  elements.shopArea.classList.add("show");
  renderAdvShop();
  window.setTimeout(() => setAdvFocus(0), 0);
  speak(elements.advLine.textContent);
}

function openWardrobeDetail(category = "outfit") {
  const hotspot = hotspotById("princessRoom");
  activeShopHotspot = hotspot;
  advMode = "wardrobe";
  shopCategory = category;
  elements.advScene.dataset.mode = "wardrobe";
  elements.advLine.textContent = `Choose ${categoryLabel(category).toLowerCase()} for Lumi.`;
  elements.advPrompt.textContent = "Pick a treasure to preview, then equip it.";
  elements.shopArea.classList.add("show", "wardrobe-detail");
  renderWardrobeDetail();
}

function renderWardrobeDetail(preserveFocus = false) {
  const ownedCategories = categories
    .filter((category) => shopItems.some((item) => item.type === category.id && state.owned.includes(item.id)))
    .map((category) => category.id);
  const allowed = ownedCategories.length ? ownedCategories : categories.map((category) => category.id);
  if (!allowed.includes(shopCategory)) shopCategory = allowed[0] || "outfit";
  const categoryItems = shopItems.filter((item) => item.type === shopCategory && state.owned.includes(item.id));
  if (!categoryItems.some((item) => item.id === shopPreviewItemId)) shopPreviewItemId = categoryItems[0]?.id || "";
  const previewItem = itemById(shopPreviewItemId) || categoryItems[0];
  renderCategoryTabs(elements.advShopTabs, shopCategory, (nextCategory) => {
    shopCategory = nextCategory;
    shopPreviewItemId = "";
    renderWardrobeDetail();
  }, true);
  renderShopPreview(previewItem);
  elements.advShopGrid.innerHTML = "";
  if (!categoryItems.length) {
    elements.advShopGrid.innerHTML = `<div class="wardrobe-empty">Buy treasures in the kingdom first.</div>`;
  } else {
    categoryItems.forEach((item) => {
      elements.advShopGrid.appendChild(createItemCard(item, {
        mode: "wardrobe",
        selected: item.id === shopPreviewItemId,
        onPreview: previewWardrobeItem,
        action: () => previewWardrobeItem(item)
      }));
    });
  }
  elements.choiceList.innerHTML = "";
  addAdvOption(wardrobeActionLabel(previewItem), () => equipWardrobePreview(previewItem), { leave: false });
  addAdvOption("Back", () => openRoomScene(hotspotById("princessRoom")));
  addAdvOption("Leave", closeAdv, { leave: true });
  elements.choiceList.classList.add("shop-command-list");
  elements.shopArea.appendChild(elements.choiceList);
  const focusIndex = preserveFocus ? Math.max(0, categoryItems.findIndex((item) => item.id === shopPreviewItemId)) : 0;
  window.setTimeout(() => setAdvFocus(focusIndex), 0);
}

function previewWardrobeItem(item) {
  if (!item || shopPreviewItemId === item.id) return;
  shopPreviewItemId = item.id;
  renderWardrobeDetail(true);
}

function wardrobeActionLabel(item) {
  if (!item) return "No item";
  if (item.type === "room") return "Place";
  return state.outfit[item.type] === item.id ? "Equipped" : "Equip";
}

function equipWardrobePreview(item) {
  if (!item) return;
  if (item.type === "room") {
    elements.advFeedback.textContent = `${item.name} is placed in Lumi's room.`;
  } else {
    state.outfit[item.type] = item.id;
    elements.advFeedback.textContent = `${item.name} equipped.`;
  }
  persist();
  render();
  renderWardrobeDetail(true);
}

function allowedShopCategories(hotspot = activeShopHotspot) {
  return hotspot?.shopCategories?.length ? hotspot.shopCategories : categories.map((category) => category.id);
}

function shopGreeting(hotspot) {
  return sceneConfigFor(hotspot).shopGreeting || "Welcome, Princess. Pick a lovely item.";
}

function renderAdvShop(preserveFocus = false) {
  const allowed = allowedShopCategories();
  if (!allowed.includes(shopCategory)) shopCategory = allowed[0] || "outfit";
  const categoryItems = shopItems.filter((item) => item.type === shopCategory && allowed.includes(item.type));
  if (!categoryItems.some((item) => item.id === shopPreviewItemId)) shopPreviewItemId = categoryItems[0]?.id || "";
  const previewItem = itemById(shopPreviewItemId) || categoryItems[0];
  renderCategoryTabs(elements.advShopTabs, shopCategory, (category) => {
    shopCategory = category;
    shopPreviewItemId = "";
    renderAdvShop();
  }, false, allowed);
  renderShopPreview(previewItem);
  elements.advShopGrid.innerHTML = "";
  categoryItems.forEach((item) => {
    elements.advShopGrid.appendChild(createItemCard(item, {
      mode: "shop",
      selected: item.id === shopPreviewItemId,
      onPreview: previewShopItem,
      action: () => previewShopItem(item)
    }));
  });
  elements.choiceList.innerHTML = "";
  addAdvOption(shopActionLabel(previewItem), () => buyItemInAdv(previewItem), { leave: false });
  addAdvOption("Leave", closeAdv, { leave: true });
  elements.choiceList.classList.add("shop-command-list");
  elements.shopArea.appendChild(elements.choiceList);
  const focusIndex = preserveFocus ? Math.max(0, categoryItems.findIndex((item) => item.id === shopPreviewItemId)) : 0;
  window.setTimeout(() => setAdvFocus(focusIndex), 0);
}

function previewShopItem(item) {
  if (!item || shopPreviewItemId === item.id) return;
  shopPreviewItemId = item.id;
  renderAdvShop(true);
}

function shopActionLabel(item) {
  if (!item) return "Buy";
  if (state.owned.includes(item.id)) {
    if (item.type === "room") return "Placed";
    return state.outfit[item.type] === item.id ? "Equipped" : "Equip";
  }
  if (state.coins < item.cost) return `Need ${item.cost - state.coins} more coins`;
  return `Buy ${item.cost} coins`;
}

function renderShopPreview(item) {
  let feature = elements.shopArea.querySelector(".shop-feature");
  if (!feature) {
    feature = document.createElement("div");
    feature.className = "shop-feature";
    elements.shopArea.prepend(feature);
  }
  if (!item) {
    feature.innerHTML = "";
    return;
  }
  const owned = state.owned.includes(item.id);
  const equipped = state.outfit[item.type] === item.id;
  const affordable = state.coins >= item.cost;
  const previewOutfit = { ...state.outfit };
  if (item.type !== "room") previewOutfit[item.type] = item.id;
  const status = owned ? equipped ? "Equipped now" : "Owned treasure" : affordable ? "Ready to buy" : `Need ${item.cost - state.coins} more coins`;
  feature.innerHTML = `
    <div class="shop-feature-stage">
      <div class="paper-doll shop-preview-doll" data-outfit="${previewOutfit.outfit || "none"}" data-shoes="${previewOutfit.shoes || "none"}" data-accessory="${previewOutfit.accessory || "none"}" data-expression="happy">
        ${avatarMarkup("shop", previewOutfit)}
      </div>
      <div class="shop-feature-item item-preview item-art item-image ${item.shape}" style="--c1:${item.colors[0]};--c2:${item.colors[1]};--sprite-x:${item.sprite || "0%"};--item-img:url('${item.image}')">
        <span aria-hidden="true">${item.icon || "✦"}</span>
      </div>
    </div>
    <div class="shop-feature-copy">
      <strong>${item.name}</strong>
      <span>${status}</span>
      <p>${itemWishText(item)}</p>
    </div>
  `;
}

function itemWishText(item) {
  const lines = {
    pinkDress: "Lumi's first dress for gentle castle mornings.",
    blueDress: "A seaside dress for walking near bright waves.",
    roseDress: "A festival dress that makes every thank-you sparkle.",
    snowDress: "A soft gown for winter stories and moonlit dances.",
    pinkSlippers: "Ribbon shoes for tiny steps across the kingdom.",
    blueBoots: "Sturdy boots for brave harbor walks.",
    goldCrown: "A tiny crown for a very kind princess helper.",
    silkRibbon: "A party ribbon that bounces when Lumi smiles.",
    pearlBag: "A shell bag for keeping little treasure notes.",
    starCape: "A helper cape for night quests and lighthouse wishes.",
    studyDesk: "A cozy desk where new English words can rest.",
    seaLamp: "A sea-glass lamp that makes bedtime stories glow."
  };
  return lines[item.id] || "A lovely treasure for Lumi's next adventure.";
}

function buyItemInAdv(item) {
  if (!item) return;
  if (state.owned.includes(item.id)) {
    if (item.type !== "room") {
      toggleEquip(item);
    } else {
      elements.advFeedback.textContent = `${item.name} is already in Lumi's room.`;
    }
    renderAdvShop();
    window.setTimeout(() => setAdvFocus(advFocusIndex), 0);
    return;
  }
  if (state.coins < item.cost) {
    elements.advFeedback.textContent = `Not enough coins. Need ${item.cost - state.coins} more.`;
    playTone("wrong");
    speak("Not enough coins.");
    return;
  }
  state.coins -= item.cost;
  playTone("buy");
  state.owned.push(item.id);
  if (item.type !== "room") state.outfit[item.type] = item.id;
  awardBadge("First Shopping");
  updateProgressBadges();
  addDiary({ type: "shop", title: activeShopHotspot?.label || "Shop", body: `Bought ${item.name}.`, result: `-${item.cost} coins` });
  const feedbackText = item.type === "room" ? `${item.name} is in Lumi's room now.` : `${item.name} is on Lumi now.`;
  elements.advLine.textContent = `${item.name} is yours now. It looks wonderful.`;
  elements.advFeedback.textContent = feedbackText;
  elements.statusMessage.textContent = feedbackText;
  showRewardBurst(`${item.name} ✦`);
  persist();
  render();
  renderAdvShop(true);
}

function recommendedShopHotspot() {
  const shopHotspots = hotspots.filter((hotspot) => hotspot.kind === "shop");
  const affordableShop = shopHotspots.find((hotspot) => {
    const allowed = allowedShopCategories(hotspot);
    return shopItems.some((item) => allowed.includes(item.type) && !state.owned.includes(item.id) && state.coins >= item.cost);
  });
  return affordableShop || shopHotspots[0] || null;
}

function openRewardShop() {
  const hotspot = recommendedShopHotspot();
  if (!hotspot) {
    closeAdv();
    return;
  }
  const node = mapNodes[hotspot.node];
  if (node) {
    state.playerNode = node.id;
    state.player = { x: node.x, y: node.y };
  }
  persist();
  renderMap();
  openShopDetail(hotspot);
}

function closeAdvThenHome() {
  closeAdv();
  changeView("home");
}

function showRewardBurst(text) {
  clearRewardBursts();
  const burst = document.createElement("div");
  burst.className = "reward-burst";
  burst.textContent = text;
  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 1400);
}

function clearRewardBursts() {
  document.querySelectorAll(".reward-burst").forEach((item) => item.remove());
}

function pickLesson(place) {
  const maxTier = difficultyConfig[state.difficulty].maxTier;
  const pool = lessons.filter((lesson) => lesson.place === place && lesson.tier <= maxTier);
  if (!pool.length) return null;
  const unfinished = pool.filter((lesson) => !state.completedLessons.includes(lesson.id));
  const candidates = unfinished.length ? unfinished : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function answerLesson(button, choice) {
  if (!activeLesson || advMode !== "quest") return;
  const correct = choice === activeLesson.answer;
  if (!correct) {
    button.classList.add("wrong");
    setExpressions("thinking", "surprised");
    elements.advFeedback.textContent = "Try again.";
    playTone("wrong");
    speak("Try again.");
    return;
  }

  const multiplier = difficultyConfig[state.difficulty].reward;
  const reward = {
    coins: 100,
    vocab: Math.max(1, Math.round((activeLesson.reward.vocab || 0) * multiplier)),
    expression: Math.max(0, Math.round((activeLesson.reward.expression || 0) * multiplier)),
    kindness: Math.max(0, Math.round((activeLesson.reward.kindness || 0) * multiplier)),
    energy: -3,
    mood: 2
  };
  applyEffects(reward);
  playTone("correct");
  addUnique("completedLessons", [activeLesson.id]);
  addUnique("learnedWords", activeLesson.words);
  addUnique("metNpcs", [sceneConfigFor(hotspotById(state.activeQuest.place)).npc]);
  updateProgressBadges();
  setExpressions("happy", "happy");
  button.classList.add("correct");
  showRewardBurst(`+${reward.coins} coins`);
  elements.choiceList.querySelectorAll("button").forEach((item) => {
    item.disabled = true;
    if (item.dataset.choice === activeLesson.answer) item.classList.add("correct");
  });
  addDiary({
    type: "quest",
    title: `${state.activeQuest.title} at ${hotspotById(state.activeQuest.place).label}`,
    body: `Sentence: "${activeLesson.answer}"`,
    result: effectText(reward),
    lessonId: activeLesson.id,
    words: activeLesson.words,
    difficulty: state.difficulty
  });
  const oldPlace = state.activeQuest.place;
  const completedHotspot = hotspotById(oldPlace);
  elements.advLine.textContent = state.activeQuest.ending;
  elements.advPrompt.textContent = "Talk complete. Try a reward now, or go back to Lumi's room.";
  elements.advFeedback.textContent = `${effectText(reward)}.`;
  state.activeQuest = createRandomQuest(oldPlace);
  activeLesson = null;
  advMode = "complete";
  elements.advScene.dataset.mode = "complete";
  elements.choiceList.innerHTML = "";
  if (completedHotspot?.kind === "shop") {
    addAdvOption("Shop", () => openShopDetail(completedHotspot));
    addAdvOption("Back to Room", closeAdvThenHome);
    addAdvOption("Leave", closeAdv, { leave: true });
  } else {
    addAdvOption("Choose Reward", openRewardShop);
    addAdvOption("Back to Room", closeAdvThenHome);
    addAdvOption("Leave", closeAdv, { leave: true });
  }
  elements.statusMessage.textContent = `Talk complete. Next place: ${hotspotById(state.activeQuest.place).label}.`;
  persist();
  render();
  window.setTimeout(() => setAdvFocus(0), 0);
  speak(elements.advLine.textContent);
}

function closeAdv() {
  elements.advModal.classList.remove("show");
  elements.advModal.setAttribute("aria-hidden", "true");
  advMode = "closed";
  elements.advScene.dataset.mode = "closed";
  activeLesson = null;
  activeShopHotspot = null;
  setExpressions("normal", "normal");
  const focusTarget = activeViewName() === "home" ? elements.castleStage : elements.mapStage;
  focusTarget?.focus({ preventScroll: true });
}

async function showHelp() {
  if (advMode === "closed") return;
  const line = elements.advLine.textContent;
  const prompt = activeLesson?.prompt || elements.advPrompt.textContent;
  elements.advFeedback.textContent = "Help teacher is thinking...";
  try {
    const choices = [...elements.choiceList.querySelectorAll("button")].map((button) => button.dataset.choice || button.textContent);
    const proxyResponse = await fetch("/api/help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ line, prompt, choices })
    });
    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      elements.advFeedback.textContent = data.text || localHelpText(line, prompt);
      return;
    }
    if (!openAISettings.apiKey) {
      elements.advFeedback.textContent = localHelpText(line, prompt);
      return;
    }
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAISettings.apiKey}`,
        ...(openAISettings.orgId ? { "OpenAI-Organization": openAISettings.orgId } : {})
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content: "You are a kind English helper for a young child. Give one short hint. Do not directly reveal the answer."
          },
          {
            role: "user",
            content: `NPC line: ${line}\nTask: ${prompt}\nChoices: ${choices.join(" | ")}`
          }
        ],
        max_output_tokens: 90
      })
    });
    if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
    const data = await response.json();
    const text = data.output_text || data.output?.flatMap((item) => item.content || []).map((part) => part.text).filter(Boolean).join(" ");
    elements.advFeedback.textContent = text || localHelpText(line, prompt);
  } catch (error) {
    elements.advFeedback.textContent = `${localHelpText(line, prompt)} Help API was not available: ${error.message}`;
  }
}

function localHelpText(line, prompt) {
  return `Hint: "${line}" is the clue. ${prompt} Look for the main word in the choices.`;
}

function shuffled(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function renderDiary() {
  renderCollectionSummary();
  elements.diaryList.innerHTML = "";
  if (!state.diary.length) {
    elements.diaryList.innerHTML = `<div class="diary-entry"><strong>No diary yet</strong><span>Finish quests or buy items to see records here.</span></div>`;
    return;
  }
  state.diary.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "diary-entry";
    row.innerHTML = `<strong>${entry.title}</strong><span>${entry.body}</span><span>${entry.result || ""}</span><small>${entry.at}</small>`;
    elements.diaryList.appendChild(row);
  });
}

function renderCollectionSummary() {
  if (!elements.collectionSummary) return;
  const badgeText = state.badges.length ? state.badges.join(" / ") : "No badges yet";
  const npcText = state.metNpcs.length ? state.metNpcs.join(" / ") : "No friends met yet";
  const wordText = state.learnedWords.length ? state.learnedWords.slice(0, 12).join(" / ") : "No words yet";
  elements.collectionSummary.innerHTML = `
    <div><strong>${state.learnedWords.length}</strong><span>Words</span><small>${wordText}</small></div>
    <div><strong>${state.metNpcs.length}</strong><span>Friends</span><small>${npcText}</small></div>
    <div><strong>${state.badges.length}</strong><span>Badges</span><small>${badgeText}</small></div>
  `;
}

function renderSettings() {
  elements.difficultySelect.value = String(state.difficulty);
  elements.speakToggleButton.textContent = `Voice: ${state.speechEnabled ? "On" : "Off"}`;
  elements.openaiOrgInput.value = openAISettings.orgId;
  elements.openaiKeyInput.value = openAISettings.apiKey ? "••••••••" : "";
  elements.aiStatus.textContent = openAISettings.apiKey
    ? "Help key saved locally in this browser. Save MD will not export it."
    : "No help key saved. The ? button will use local hints.";
  renderBuildInfo(elements, buildInfo);
}

function speak(text) {
  if (!state.speechEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.86;
  window.speechSynthesis.speak(utterance);
}

function playTone(kind) {
  try {
    if (new URLSearchParams(location.search).has("selftest")) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequencies = { correct: 660, wrong: 180, buy: 820 };
    oscillator.frequency.value = frequencies[kind] || 440;
    oscillator.type = "sine";
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.09);
  } catch {}
}

function buildSaveMarkdown() {
  const questRows = state.diary.filter((entry) => entry.type === "quest");
  const exportState = JSON.parse(JSON.stringify(state));
  delete exportState.openaiApiKey;
  const rows = state.diary.length
    ? state.diary.map((entry) => `| ${entry.title} | ${entry.body.replaceAll("|", "/")} | ${entry.result || ""} |`).join("\n")
    : "| - | - | - |";
  const payload = JSON.stringify(exportState, null, 2);
  return `# solKidGalGame Save

- Saved at: ${new Date().toLocaleString("en-US")}
- Difficulty: ${difficultyConfig[state.difficulty].label}
- Coins: ${state.coins}
- Energy: ${state.energy}
- Vocabulary: ${state.vocab}
- Expression: ${state.expression}
- Kindness: ${state.kindness}
- Mood: ${moodLabel(state.mood)}
- Quests completed: ${questRows.length}
- Outfit: ${outfitSummary()}
- Current quest: ${state.activeQuest.title}
- Learned words: ${state.learnedWords.join(", ") || "-"}
- Friends met: ${state.metNpcs.join(", ") || "-"}
- Badges: ${state.badges.join(", ") || "-"}

## Diary

| Title | Detail | Result |
| --- | --- | --- |
${rows}

${saveMarkerStart}
${payload}
${saveMarkerEnd}
`;
}

async function saveMarkdown() {
  const markdown = buildSaveMarkdown();
  const filename = "luminara-adv-dressup-save.md";
  if ("showSaveFilePicker" in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: "Markdown Save", accept: { "text/markdown": [".md"] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(markdown);
      await writable.close();
      elements.statusMessage.textContent = "Save complete.";
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  elements.statusMessage.textContent = "Markdown save downloaded.";
}

function loadMarkdownText(text) {
  const start = text.indexOf(saveMarkerStart);
  const end = text.indexOf(saveMarkerEnd);
  if (start === -1 || end === -1 || end <= start) throw new Error("Luminara save data block was not found.");
  const json = text.slice(start + saveMarkerStart.length, end).trim();
  state = normalizeState(JSON.parse(json));
  persist();
  elements.statusMessage.textContent = "Load complete. Progress restored.";
  render();
}

async function loadMarkdown() {
  if ("showOpenFilePicker" in window) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: "Markdown Save", accept: { "text/markdown": [".md"], "text/plain": [".md", ".txt"] } }]
      });
      const file = await handle.getFile();
      loadMarkdownText(await file.text());
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  elements.loadFileInput.click();
}

function resetProgress() {
  state = freshState();
  persist();
  elements.statusMessage.textContent = "Progress reset. A new short talk is ready.";
  render();
}

function beginMapDrag(event) {
  if (!isMobileTravelMap()) return;
  if (event.target.closest("button, .nearby-card, .destination-panel")) return;
  mapDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    panX: mapPan.x,
    panY: mapPan.y,
    moved: false
  };
  elements.mapStage.classList.add("is-dragging");
  elements.mapStage.setPointerCapture?.(event.pointerId);
}

function moveMapDrag(event) {
  if (!mapDrag || mapDrag.pointerId !== event.pointerId) return;
  const dx = event.clientX - mapDrag.startX;
  const dy = event.clientY - mapDrag.startY;
  if (Math.abs(dx) + Math.abs(dy) > 4) mapDrag.moved = true;
  mapPan = { x: mapDrag.panX + dx, y: mapDrag.panY + dy };
  event.preventDefault();
  scheduleMapPositionRefresh();
}

function finishMapDrag(event) {
  if (!mapDrag || mapDrag.pointerId !== event.pointerId) return;
  elements.mapStage.classList.remove("is-dragging");
  elements.mapStage.releasePointerCapture?.(event.pointerId);
  mapDrag = null;
}

function bindEvents() {
  elements.tabs.forEach((tab) => tab.addEventListener("click", () => changeView(tab.dataset.view)));
  window.addEventListener("hashchange", () => changeView(location.hash ? location.hash.slice(1) : "home"));
  elements.systemMenuButton.addEventListener("click", () => openSystemMenu(systemMenuPanel || "diary"));
  elements.systemMenuClose.addEventListener("click", closeSystemMenu);
  elements.systemMenu.addEventListener("click", (event) => {
    if (event.target.matches("[data-system-close]")) closeSystemMenu();
  });
  elements.systemMenuTabs.forEach((tab) => tab.addEventListener("click", () => changeSystemPanel(tab.dataset.menuPanel)));
  elements.goMapButton?.addEventListener("click", () => openArea("kingdom"));
  elements.returnHomeButton.addEventListener("click", () => openArea("castle"));
  elements.helpButton.addEventListener("click", showHelp);
  elements.speakPromptButton.addEventListener("click", () => speak(elements.advLine.textContent));
  elements.saveButton.addEventListener("click", saveMarkdown);
  elements.loadButton.addEventListener("click", loadMarkdown);
  elements.loadFileInput.addEventListener("change", async () => {
    const file = elements.loadFileInput.files[0];
    if (!file) return;
    try {
      loadMarkdownText(await file.text());
    } catch (error) {
      elements.statusMessage.textContent = `Load failed: ${error.message}`;
    } finally {
      elements.loadFileInput.value = "";
    }
  });
  elements.difficultySelect.addEventListener("change", () => {
    state.difficulty = Number(elements.difficultySelect.value);
    persist();
    render();
  });
  elements.speakToggleButton.addEventListener("click", () => {
    state.speechEnabled = !state.speechEnabled;
    persist();
    renderSettings();
  });
  elements.clearDiaryButton.addEventListener("click", () => {
    if (!window.confirm("Clear Lumi's diary pages?")) return;
    state.diary = [];
    persist();
    render();
  });
  elements.resetButton.addEventListener("click", () => {
    if (!window.confirm("Reset Lumi's coins, clothes, quests, and diary?")) return;
    resetProgress();
  });
  elements.openaiSettingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
  elements.saveOpenAIButton.addEventListener("click", () => {
    const typedKey = elements.openaiKeyInput.value.trim();
    openAISettings = {
      orgId: elements.openaiOrgInput.value.trim(),
      apiKey: typedKey && typedKey !== "••••••••" ? typedKey : openAISettings.apiKey
    };
    persistOpenAISettings();
    renderSettings();
  });
  elements.clearOpenAIButton.addEventListener("click", () => {
    openAISettings = { orgId: "", apiKey: "" };
    localStorage.removeItem(openAISettingsKey);
    renderSettings();
  });
  window.addEventListener("resize", () => {
    if (elements.mapStage?.offsetParent !== null) renderMap();
    if (elements.castleStage?.offsetParent !== null) renderCastleMap();
  });
  elements.castleStage?.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && activeCastleHotspot) {
      event.preventDefault();
      interactCastleHotspot();
    }
  });
  elements.mapStage.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (event.key === "ArrowUp" || key === "w") {
      event.preventDefault();
      event.stopPropagation();
      moveOnMap(0, -1);
    } else if (event.key === "ArrowDown" || key === "s") {
      event.preventDefault();
      event.stopPropagation();
      moveOnMap(0, 1);
    } else if (event.key === "ArrowLeft" || key === "a") {
      event.preventDefault();
      event.stopPropagation();
      moveOnMap(-1, 0);
    } else if (event.key === "ArrowRight" || key === "d") {
      event.preventDefault();
      event.stopPropagation();
      moveOnMap(1, 0);
    } else if ((event.key === "Enter" || event.key === " ") && activeHotspot) {
      event.preventDefault();
      event.stopPropagation();
      interactNearby();
    }
  });
  elements.mapStage.addEventListener("pointerdown", beginMapDrag);
  elements.mapStage.addEventListener("pointermove", moveMapDrag);
  elements.mapStage.addEventListener("pointerup", finishMapDrag);
  elements.mapStage.addEventListener("pointercancel", finishMapDrag);
  window.addEventListener("keydown", (event) => {
    if (isSystemMenuOpen()) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSystemMenu();
      }
      return;
    }
    if (!elements.advModal.classList.contains("show")) {
      if (
        (event.key === "Enter" || event.key === " ") &&
        elements.mapStage?.offsetParent !== null &&
        activeHotspot
      ) {
        event.preventDefault();
        interactNearby();
        return;
      }
      if ((event.key === "g" || event.key === "G") && elements.homeView?.classList.contains("active")) {
        event.preventDefault();
        openArea("kingdom");
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeAdv();
      return;
    }
    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
      event.preventDefault();
      moveAdvFocus(-1);
      return;
    }
    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
      event.preventDefault();
      moveAdvFocus(1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!confirmAdvFocus() && advMode === "complete") closeAdv();
      return;
    }
    if ((event.key === "b" || event.key === "B") && advMode === "shop") {
      event.preventDefault();
      buyItemInAdv(itemById(shopPreviewItemId));
      return;
    }
    if (/^[1-9]$/.test(event.key) && advMode === "quest") {
      const answerButtons = [...elements.choiceList.querySelectorAll("button[data-choice]")];
      const button = answerButtons[Number(event.key) - 1];
      if (button && !button.disabled) {
        event.preventDefault();
        button.click();
      }
    }
  });
}

Object.defineProperty(window, "__luminaraTest", {
  value: {
    saveRoundtrip() {
      const before = {
        coins: state.coins,
        energy: state.energy,
        vocab: state.vocab,
        expression: state.expression,
        kindness: state.kindness,
        difficulty: state.difficulty,
        outfit: { ...state.outfit },
        owned: [...state.owned],
        activeQuest: state.activeQuest?.id || ""
      };
      const markdown = buildSaveMarkdown();
      const hasMarkers = markdown.includes(saveMarkerStart) && markdown.includes(saveMarkerEnd);
      const hasNoOpenAIKey = !markdown.includes(openAISettings.apiKey || "___NO_KEY___");
      loadMarkdownText(markdown);
      const after = {
        coins: state.coins,
        energy: state.energy,
        vocab: state.vocab,
        expression: state.expression,
        kindness: state.kindness,
        difficulty: state.difficulty,
        outfit: { ...state.outfit },
        owned: [...state.owned],
        activeQuest: state.activeQuest?.id || ""
      };
      return {
        hasMarkers,
        hasNoOpenAIKey,
        roundtripSame: JSON.stringify(before) === JSON.stringify(after),
        before,
        after
      };
    }
  }
});

bindEvents();
render();
changeView(location.hash ? location.hash.slice(1) : "home");

installTestingHooks({
  get state() { return state; },
  set state(nextState) { state = nextState; },
  get shopPreviewItemId() { return shopPreviewItemId; },
  set shopPreviewItemId(nextItemId) { shopPreviewItemId = nextItemId; },
  $$,
  allowedShopCategories,
  answerLesson,
  buildSaveMarkdown,
  buyItemInAdv,
  castleMapNodes,
  changeView,
  closeAdv,
  closeSystemMenu,
  createQuestForPlace,
  createRandomQuest,
  difficultyConfig,
  elements,
  freshState,
  hotspotById,
  interactNearby,
  isWalkable,
  itemById,
  loadMarkdownText,
  mapNodes,
  moveOnMap,
  openArea,
  openHintAdv,
  openQuestAdv,
  openRoomScene,
  openSceneAdv,
  openShopDetail,
  openSystemMenu,
  openWardrobeDetail,
  persist,
  render,
  renderAdvShop,
  renderMap,
  shopItems,
  showHelp,
  toggleEquip
});
