import {
  categories,
  defaultActiveCharacterId,
  paperDollBaseLayer,
  paperDollLayerOrder,
  playableCharacterById,
  shopItems,
  wardrobeLayerBoundsByType
} from "../content-package/wardrobe/manifest.js";
import { createPaperDollRenderer } from "../game-engine/render/paper-doll.js";

const layerTypes = Object.keys(wardrobeLayerBoundsByType);
const itemMap = new Map(shopItems.map((item) => [item.id, item]));
const originalBounds = cloneBoundsMap(wardrobeLayerBoundsByType);
const workingBounds = cloneBoundsMap(wardrobeLayerBoundsByType);
const baseOutfit = Object.fromEntries(layerTypes.map((type) => [type, "none"]));
const state = {
  categoryId: categories[0]?.id || "",
  selectedType: layerTypes[0],
  selectedItemId: firstItemForCategory(categories[0]?.id)?.id || "",
  outfit: { ...baseOutfit }
};

const dom = {
  summaryLine: document.querySelector("#summaryLine"),
  categoryTabs: document.querySelector("#categoryTabs"),
  itemList: document.querySelector("#itemList"),
  previewLabel: document.querySelector("#previewLabel"),
  previewDoll: document.querySelector("#previewDoll"),
  typeTabs: document.querySelector("#typeTabs"),
  boundTop: document.querySelector("#boundTop"),
  boundRight: document.querySelector("#boundRight"),
  boundBottom: document.querySelector("#boundBottom"),
  boundLeft: document.querySelector("#boundLeft"),
  nudgeUp: document.querySelector("#nudgeUp"),
  nudgeDown: document.querySelector("#nudgeDown"),
  nudgeLeft: document.querySelector("#nudgeLeft"),
  nudgeRight: document.querySelector("#nudgeRight"),
  resetType: document.querySelector("#resetType"),
  resetAll: document.querySelector("#resetAll"),
  outputSnippet: document.querySelector("#outputSnippet"),
  copyOutput: document.querySelector("#copyOutput")
};

const paperDollRenderer = createPaperDollRenderer({
  baseLayer: paperDollBaseLayer,
  getCharacter: () => playableCharacterById(defaultActiveCharacterId),
  itemById: itemWithWorkingBounds,
  layerOrder: paperDollLayerOrder
});

bindEvents();
equipSelectedItem();
renderAll();

function bindEvents() {
  ["Top", "Right", "Bottom", "Left"].forEach((edge) => {
    dom[`bound${edge}`].addEventListener("input", () => {
      setBound(edge.toLowerCase(), Number(dom[`bound${edge}`].value) || 0);
    });
  });
  dom.nudgeUp.addEventListener("click", () => nudge(0, -1));
  dom.nudgeDown.addEventListener("click", () => nudge(0, 1));
  dom.nudgeLeft.addEventListener("click", () => nudge(-1, 0));
  dom.nudgeRight.addEventListener("click", () => nudge(1, 0));
  dom.resetType.addEventListener("click", () => {
    workingBounds[state.selectedType] = { ...originalBounds[state.selectedType] };
    renderAll();
  });
  dom.resetAll.addEventListener("click", () => {
    Object.assign(workingBounds, cloneBoundsMap(wardrobeLayerBoundsByType));
    renderAll();
  });
  dom.copyOutput.addEventListener("click", async () => {
    await navigator.clipboard?.writeText(dom.outputSnippet.value);
    dom.copyOutput.textContent = "Copied";
    window.setTimeout(() => {
      dom.copyOutput.textContent = "Copy Parameters";
    }, 900);
  });
}

function renderAll() {
  renderSummary();
  renderCategoryTabs();
  renderItemList();
  renderTypeTabs();
  renderControls();
  renderPreview();
  renderOutput();
}

function renderSummary() {
  dom.summaryLine.textContent = `${shopItems.length} items / ${categories.length} UI categories / ${layerTypes.length} tunable layer types`;
}

function renderCategoryTabs() {
  dom.categoryTabs.innerHTML = "";
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = category.id === state.categoryId ? "active" : "";
    button.textContent = `${category.label} (${itemsForCategory(category.id).length})`;
    button.addEventListener("click", () => {
      state.categoryId = category.id;
      const firstItem = firstItemForCategory(category.id);
      state.selectedItemId = firstItem?.id || "";
      if (layerTypes.includes(firstItem?.type)) state.selectedType = firstItem.type;
      equipSelectedItem();
      renderAll();
    });
    dom.categoryTabs.append(button);
  });
}

function renderItemList() {
  dom.itemList.innerHTML = "";
  itemsForCategory(state.categoryId).forEach((item) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `item-row${item.id === state.selectedItemId ? " active" : ""}`;
    row.innerHTML = `
      <img src="${assetUrl(item.image)}" alt="">
      <span class="item-name">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.type)} / ${escapeHtml(item.id)}</span>
      </span>
      <span class="item-price">${priceText(item)}</span>
    `;
    row.addEventListener("click", () => {
      state.selectedItemId = item.id;
      if (layerTypes.includes(item.type)) state.selectedType = item.type;
      equipSelectedItem();
      renderAll();
    });
    dom.itemList.append(row);
  });
}

function renderTypeTabs() {
  dom.typeTabs.innerHTML = "";
  layerTypes.forEach((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = type === state.selectedType ? "active" : "";
    button.textContent = type;
    button.addEventListener("click", () => {
      state.selectedType = type;
      renderAll();
    });
    dom.typeTabs.append(button);
  });
}

function renderControls() {
  const bounds = workingBounds[state.selectedType];
  dom.boundTop.value = bounds.top;
  dom.boundRight.value = bounds.right;
  dom.boundBottom.value = bounds.bottom;
  dom.boundLeft.value = bounds.left;
}

function renderPreview() {
  const item = itemMap.get(state.selectedItemId);
  const character = playableCharacterById(defaultActiveCharacterId);
  dom.previewLabel.innerHTML = `
    <strong>${escapeHtml(item?.type || "outfit")}</strong>
    <span>${escapeHtml(item?.name || "Current outfit")}</span>
  `;
  dom.previewDoll.innerHTML = paperDollRenderer.avatarMarkup("tool", state.outfit, character);
}

function renderOutput() {
  dom.outputSnippet.value = `export const wardrobeLayerBoundsByType = Object.freeze({\n${layerTypes.map((type) => {
    const safe = originalBounds[type].safeBox;
    const bounds = workingBounds[type];
    const render = hasRenderOffset(bounds)
      ? `, { left: ${bounds.left}, top: ${bounds.top}, right: ${bounds.right}, bottom: ${bounds.bottom} }`
      : "";
    return `  ${type}: layerBounds({ left: ${safe.left}, top: ${safe.top}, right: ${safe.right}, bottom: ${safe.bottom} }${render})`;
  }).join(",\n")}\n});`;
}

function equipSelectedItem() {
  state.outfit = { ...baseOutfit };
  const item = itemMap.get(state.selectedItemId);
  equipItem(item, state.outfit);
}

function equipItem(item, outfit) {
  if (!item) return;
  if (item.type === "outfitSet") {
    Object.values(item.equips || {}).forEach((itemId) => equipItem(itemMap.get(itemId), outfit));
    return;
  }
  if (item.type === "dress") {
    outfit.top = "none";
    outfit.bottom = "none";
  }
  if (item.type === "top" || item.type === "bottom") outfit.dress = "none";
  outfit[item.type] = item.id;
}

function itemWithWorkingBounds(id) {
  const item = itemMap.get(id);
  if (!item) return null;
  return {
    ...item,
    layers: (item.layers || []).map((layer) => ({
      ...layer,
      bounds: workingBounds[layer.type || item.type] || layer.bounds
    }))
  };
}

function itemsForCategory(categoryId) {
  const category = categories.find((candidate) => candidate.id === categoryId);
  if (!category) return [];
  return shopItems.filter((item) => category.types.includes(item.type));
}

function firstItemForCategory(categoryId) {
  return itemsForCategory(categoryId).find((item) => item.storeId !== "starter") || itemsForCategory(categoryId)[0];
}

function setBound(edge, value) {
  workingBounds[state.selectedType] = {
    ...workingBounds[state.selectedType],
    [edge]: value
  };
  renderPreview();
  renderOutput();
}

function nudge(dx, dy) {
  const bounds = workingBounds[state.selectedType];
  workingBounds[state.selectedType] = {
    ...bounds,
    left: bounds.left + dx,
    right: bounds.right - dx,
    top: bounds.top + dy,
    bottom: bounds.bottom - dy
  };
  renderAll();
}

function cloneBoundsMap(source) {
  return Object.fromEntries(Object.entries(source).map(([type, bounds]) => [
    type,
    {
      left: bounds.left || 0,
      top: bounds.top || 0,
      right: bounds.right || 0,
      bottom: bounds.bottom || 0,
      safeBox: bounds.safeBox ? { ...bounds.safeBox } : null
    }
  ]));
}

function hasRenderOffset(bounds) {
  return bounds.left !== 0 || bounds.top !== 0 || bounds.right !== 0 || bounds.bottom !== 0;
}

function assetUrl(src) {
  if (!src) return "";
  return src.startsWith("content-package/") || src.startsWith("content-base/") ? `../${src}` : src;
}

function priceText(item) {
  if (!Number.isFinite(item.cost) || item.cost <= 0) return "Free";
  return `${item.cost} coins`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
