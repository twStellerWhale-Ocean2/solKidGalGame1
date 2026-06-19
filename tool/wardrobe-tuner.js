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

// 主畫面契約（characterScaleContract）。目標矩形以此畫布座標表示（#176）。
const CANVAS = { W: 512, H: 768 };

const layerTypes = Object.keys(wardrobeLayerBoundsByType);
const itemMap = new Map(shopItems.map((item) => [item.id, item]));
const originalBounds = cloneBoundsMap(wardrobeLayerBoundsByType);
const workingBounds = cloneBoundsMap(wardrobeLayerBoundsByType);
const baseOutfit = Object.fromEntries(layerTypes.map((type) => [type, "none"]));
const state = {
  categoryId: categories[0]?.id || "",
  selectedType: layerTypes[0],
  selectedItemId: firstItemForCategory(categories[0]?.id)?.id || "",
  outfit: { ...baseOutfit },
  testImageByType: {}
};

const dom = {
  summaryLine: document.querySelector("#summaryLine"),
  categoryTabs: document.querySelector("#categoryTabs"),
  itemList: document.querySelector("#itemList"),
  previewLabel: document.querySelector("#previewLabel"),
  previewDoll: document.querySelector("#previewDoll"),
  targetOverlay: document.querySelector("#targetOverlay"),
  typeTabs: document.querySelector("#typeTabs"),
  targetLeft: document.querySelector("#targetLeft"),
  targetTop: document.querySelector("#targetTop"),
  targetRight: document.querySelector("#targetRight"),
  targetBottom: document.querySelector("#targetBottom"),
  nudgeUp: document.querySelector("#nudgeUp"),
  nudgeDown: document.querySelector("#nudgeDown"),
  nudgeLeft: document.querySelector("#nudgeLeft"),
  nudgeRight: document.querySelector("#nudgeRight"),
  resetType: document.querySelector("#resetType"),
  resetAll: document.querySelector("#resetAll"),
  testImage: document.querySelector("#testImage"),
  clearTest: document.querySelector("#clearTest"),
  outputSnippet: document.querySelector("#outputSnippet"),
  copyOutput: document.querySelector("#copyOutput")
};

const paperDollRenderer = createPaperDollRenderer({
  baseLayer: paperDollBaseLayer,
  getCharacter: () => playableCharacterById(defaultActiveCharacterId),
  itemById: itemWithWorkingBounds,
  layerOrder: paperDollLayerOrder,
  canvasWidth: CANVAS.W,
  canvasHeight: CANVAS.H
});

bindEvents();
equipSelectedItem();
renderAll();

function bindEvents() {
  ["Left", "Top", "Right", "Bottom"].forEach((edge) => {
    dom[`target${edge}`].addEventListener("input", () => {
      setTargetEdge(edge.toLowerCase(), Number(dom[`target${edge}`].value));
    });
  });
  dom.nudgeUp.addEventListener("click", () => moveTarget(0, -4));
  dom.nudgeDown.addEventListener("click", () => moveTarget(0, 4));
  dom.nudgeLeft.addEventListener("click", () => moveTarget(-4, 0));
  dom.nudgeRight.addEventListener("click", () => moveTarget(4, 0));
  dom.resetType.addEventListener("click", () => {
    workingBounds[state.selectedType] = cloneBounds(originalBounds[state.selectedType]);
    renderAll();
  });
  dom.resetAll.addEventListener("click", () => {
    Object.assign(workingBounds, cloneBoundsMap(wardrobeLayerBoundsByType));
    renderAll();
  });
  dom.testImage.addEventListener("change", () => {
    const file = dom.testImage.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      state.testImageByType[state.selectedType] = reader.result;
      renderPreview();
    });
    reader.readAsDataURL(file);
  });
  dom.clearTest.addEventListener("click", () => {
    delete state.testImageByType[state.selectedType];
    dom.testImage.value = "";
    renderPreview();
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
  dom.summaryLine.textContent = `${shopItems.length} items / ${categories.length} UI categories / ${layerTypes.length} tunable layer types · canvas ${CANVAS.W}×${CANVAS.H}`;
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
  const box = targetBoxFor(state.selectedType);
  dom.targetLeft.value = box.left;
  dom.targetTop.value = box.top;
  dom.targetRight.value = box.right;
  dom.targetBottom.value = box.bottom;
}

function renderPreview() {
  const item = itemMap.get(state.selectedItemId);
  const character = playableCharacterById(defaultActiveCharacterId);
  dom.previewLabel.innerHTML = `
    <strong>${escapeHtml(item?.type || "outfit")}</strong>
    <span>${escapeHtml(item?.name || "Current outfit")}</span>
  `;
  const dollMarkup = paperDollRenderer.avatarMarkup("tuner", state.outfit, character);
  dom.previewDoll.innerHTML = dollMarkup + testLayerMarkup();
  renderTargetOverlay();
}

// 把使用者載入的任意尺寸測試圖，依目前類別目標矩形 contain-fit 疊在最上層，
// 直接驗證「來圖無論多大多小都落在正確投影範圍」。
function testLayerMarkup() {
  const url = state.testImageByType[state.selectedType];
  if (!url) return "";
  const pct = targetInsetPct(targetBoxFor(state.selectedType));
  const style = [
    `--layer-img:url('${url}')`,
    `--layer-top:${pct.top}%`,
    `--layer-right:${pct.right}%`,
    `--layer-bottom:${pct.bottom}%`,
    `--layer-left:${pct.left}%`
  ].join(";");
  return `<span class="paper-doll-layer paper-doll-layer-type-test" style="${style}" aria-hidden="true"></span>`;
}

function renderTargetOverlay() {
  const pct = targetInsetPct(targetBoxFor(state.selectedType));
  dom.targetOverlay.style.inset = `${pct.top}% ${pct.right}% ${pct.bottom}% ${pct.left}%`;
  dom.targetOverlay.dataset.type = state.selectedType;
}

function renderOutput() {
  dom.outputSnippet.value = `export const wardrobeLayerBoundsByType = Object.freeze({\n${layerTypes.map((type) => {
    const safe = originalBounds[type].safeBox;
    const bounds = workingBounds[type];
    const safeArg = boxLiteral(safe);
    const renderArg = hasRenderOffset(bounds) ? boxLiteral(bounds) : null;
    const targetArg = isFullCanvas(bounds.targetBox) ? null : boxLiteral(bounds.targetBox);
    let args = safeArg;
    if (targetArg) args += `, ${renderArg || boxLiteral({ left: 0, top: 0, right: 0, bottom: 0 })}, ${targetArg}`;
    else if (renderArg) args += `, ${renderArg}`;
    return `  ${type}: layerBounds(${args})`;
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

function targetBoxFor(type) {
  return workingBounds[type].targetBox;
}

function setTargetEdge(edge, rawValue) {
  if (!Number.isFinite(rawValue)) return;
  const limit = edge === "left" || edge === "right" ? CANVAS.W : CANVAS.H;
  const value = Math.max(0, Math.min(limit, Math.round(rawValue)));
  workingBounds[state.selectedType] = {
    ...workingBounds[state.selectedType],
    targetBox: { ...targetBoxFor(state.selectedType), [edge]: value }
  };
  renderPreview();
  renderOutput();
}

// 平移整個目標矩形（不改變大小）：dx 右為正、dy 下為正。
function moveTarget(dx, dy) {
  const box = targetBoxFor(state.selectedType);
  const width = box.right - box.left;
  const height = box.bottom - box.top;
  const left = Math.max(0, Math.min(CANVAS.W - width, box.left + dx));
  const top = Math.max(0, Math.min(CANVAS.H - height, box.top + dy));
  workingBounds[state.selectedType] = {
    ...workingBounds[state.selectedType],
    targetBox: { left, top, right: left + width, bottom: top + height }
  };
  renderAll();
}

function targetInsetPct(box) {
  return {
    top: round3((box.top / CANVAS.H) * 100),
    right: round3(((CANVAS.W - box.right) / CANVAS.W) * 100),
    bottom: round3(((CANVAS.H - box.bottom) / CANVAS.H) * 100),
    left: round3((box.left / CANVAS.W) * 100)
  };
}

function cloneBoundsMap(source) {
  return Object.fromEntries(Object.entries(source).map(([type, bounds]) => [type, cloneBounds(bounds)]));
}

// 目標矩形預設為全畫布（identity，等同現行滿版 contain）；使用者依各類來圖版型自行收斂。
function cloneBounds(bounds) {
  const safeBox = bounds.safeBox ? { ...bounds.safeBox } : null;
  const targetBox = bounds.targetBox
    ? { ...bounds.targetBox }
    : { left: 0, top: 0, right: CANVAS.W, bottom: CANVAS.H };
  return {
    left: bounds.left || 0,
    top: bounds.top || 0,
    right: bounds.right || 0,
    bottom: bounds.bottom || 0,
    safeBox,
    targetBox
  };
}

function hasRenderOffset(bounds) {
  return bounds.left !== 0 || bounds.top !== 0 || bounds.right !== 0 || bounds.bottom !== 0;
}

function isFullCanvas(box) {
  return !box || (box.left === 0 && box.top === 0 && box.right === CANVAS.W && box.bottom === CANVAS.H);
}

function boxLiteral(box) {
  return `{ left: ${box.left}, top: ${box.top}, right: ${box.right}, bottom: ${box.bottom} }`;
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
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
