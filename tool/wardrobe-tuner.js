import {
  categories,
  defaultActiveCharacterId,
  paperDollBaseLayer,
  paperDollLayerOrder,
  playableCharacterById,
  shopItems,
  wardrobeLayerBoundsByType
} from "../content-package/wardrobe/manifest.js";
import { assetContentBoxByPackName } from "../content-package/wardrobe/_shared/asset-content-box.generated.js";
import { assetTargetOverrides } from "../content-package/wardrobe/_shared/asset-target-overrides.js";
import { createPaperDollRenderer } from "../game-engine/render/paper-doll.js";

// 主畫面契約（characterScaleContract）。所有框以此 512x768 畫布座標表示（#176）。
const CANVAS = { W: 512, H: 768 };

const itemMap = new Map(shopItems.map((item) => [item.id, item]));
// 第一層：類別投影框（= 該類 safeBox）。第二層：各單品 targetBox（覆寫→裁切原始框→safeBox）。
const workingSafeBox = Object.fromEntries(
  Object.entries(wardrobeLayerBoundsByType).map(([type, b]) => [type, b.safeBox ? { ...b.safeBox } : fullCanvas()])
);
const workingItemBox = {}; // key `<pack>/<name>` → { left, top, right, bottom }（lazy seed）
const baseOutfit = Object.fromEntries(Object.keys(wardrobeLayerBoundsByType).map((type) => [type, "none"]));
const state = {
  categoryId: categories[0]?.id || "",
  selectedItemId: firstItemForCategory(categories[0]?.id)?.id || "",
  outfit: { ...baseOutfit },
  testImageByType: {}
};

const dom = {
  summaryLine: q("#summaryLine"),
  categoryTabs: q("#categoryTabs"),
  itemList: q("#itemList"),
  previewLabel: q("#previewLabel"),
  previewDoll: q("#previewDoll"),
  typeOverlay: q("#typeOverlay"),
  itemOverlay: q("#itemOverlay"),
  selectedInfo: q("#selectedInfo"),
  safeLeft: q("#safeLeft"), safeTop: q("#safeTop"), safeRight: q("#safeRight"), safeBottom: q("#safeBottom"),
  itemLeft: q("#itemLeft"), itemTop: q("#itemTop"), itemRight: q("#itemRight"), itemBottom: q("#itemBottom"),
  itemUp: q("#itemUp"), itemDown: q("#itemDown"), itemMoveLeft: q("#itemMoveLeft"), itemMoveRight: q("#itemMoveRight"),
  itemBigger: q("#itemBigger"), itemSmaller: q("#itemSmaller"),
  resetItem: q("#resetItem"), resetType: q("#resetType"), resetAll: q("#resetAll"),
  testImage: q("#testImage"), clearTest: q("#clearTest"),
  outRules: q("#outRules"), copyRules: q("#copyRules"),
  outOverrides: q("#outOverrides"), copyOverrides: q("#copyOverrides")
};

const paperDollRenderer = createPaperDollRenderer({
  baseLayer: paperDollBaseLayer,
  getCharacter: () => playableCharacterById(defaultActiveCharacterId),
  itemById: itemWithWorkingBoxes,
  layerOrder: paperDollLayerOrder,
  canvasWidth: CANVAS.W,
  canvasHeight: CANVAS.H
});

bindEvents();
equipSelectedItem();
renderAll();

function bindEvents() {
  ["Left", "Top", "Right", "Bottom"].forEach((edge) => {
    dom[`safe${edge}`].addEventListener("input", () => setSafeEdge(edge.toLowerCase(), Number(dom[`safe${edge}`].value)));
    dom[`item${edge}`].addEventListener("input", () => setItemEdge(edge.toLowerCase(), Number(dom[`item${edge}`].value)));
  });
  dom.itemUp.addEventListener("click", () => moveItem(0, -4));
  dom.itemDown.addEventListener("click", () => moveItem(0, 4));
  dom.itemMoveLeft.addEventListener("click", () => moveItem(-4, 0));
  dom.itemMoveRight.addEventListener("click", () => moveItem(4, 0));
  dom.itemBigger.addEventListener("click", () => scaleItem(1.05));
  dom.itemSmaller.addEventListener("click", () => scaleItem(1 / 1.05));
  dom.resetItem.addEventListener("click", () => { delete workingItemBox[selectedKey()]; renderAll(); });
  dom.resetType.addEventListener("click", () => {
    const type = selectedType();
    workingSafeBox[type] = wardrobeLayerBoundsByType[type]?.safeBox ? { ...wardrobeLayerBoundsByType[type].safeBox } : fullCanvas();
    renderAll();
  });
  dom.resetAll.addEventListener("click", () => {
    Object.entries(wardrobeLayerBoundsByType).forEach(([type, b]) => { workingSafeBox[type] = b.safeBox ? { ...b.safeBox } : fullCanvas(); });
    for (const k of Object.keys(workingItemBox)) delete workingItemBox[k];
    renderAll();
  });
  dom.testImage.addEventListener("change", () => {
    const file = dom.testImage.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => { state.testImageByType[selectedType()] = reader.result; renderPreview(); });
    reader.readAsDataURL(file);
  });
  dom.clearTest.addEventListener("click", () => { delete state.testImageByType[selectedType()]; dom.testImage.value = ""; renderPreview(); });
  dom.copyRules.addEventListener("click", () => copy(dom.outRules, dom.copyRules, "Copy rules.js safeBox"));
  dom.copyOverrides.addEventListener("click", () => copy(dom.outOverrides, dom.copyOverrides, "Copy per-item overrides"));
}

function renderAll() {
  renderSummary();
  renderCategoryTabs();
  renderItemList();
  renderSelectedInfo();
  renderControls();
  renderPreview();
  renderOutput();
}

function renderSummary() {
  dom.summaryLine.textContent = `${shopItems.length} items / ${categories.length} categories · 左選單品 → 右① 類型框（套同類）② 單品框（僅此件） · canvas ${CANVAS.W}×${CANVAS.H}`;
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
      state.selectedItemId = firstItemForCategory(category.id)?.id || "";
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
    row.addEventListener("click", () => { state.selectedItemId = item.id; equipSelectedItem(); renderAll(); });
    dom.itemList.append(row);
  });
}

function renderSelectedInfo() {
  const item = selectedItem();
  const key = selectedKey();
  const overridden = key && key in workingItemBox && !sameBox(workingItemBox[key], seedItemBox(key));
  dom.selectedInfo.innerHTML = item
    ? `<strong>${escapeHtml(item.name)}</strong><span>type <code>${escapeHtml(selectedType() || "—")}</code> · ${key ? `<code>${escapeHtml(key)}</code>` : "（無單一 layer）"}${overridden ? " · <em>已覆寫</em>" : ""}</span>`
    : "（未選單品）";
}

function renderControls() {
  const safe = workingSafeBox[selectedType()] || fullCanvas();
  dom.safeLeft.value = safe.left; dom.safeTop.value = safe.top; dom.safeRight.value = safe.right; dom.safeBottom.value = safe.bottom;
  const key = selectedKey();
  const disabled = !key;
  const box = key ? itemBoxFor(key) : fullCanvas();
  ["Left", "Top", "Right", "Bottom"].forEach((edge) => { dom[`item${edge}`].value = box[edge.toLowerCase()]; dom[`item${edge}`].disabled = disabled; });
  [dom.itemUp, dom.itemDown, dom.itemMoveLeft, dom.itemMoveRight, dom.itemBigger, dom.itemSmaller, dom.resetItem].forEach((b) => { b.disabled = disabled; });
}

function renderPreview() {
  const item = selectedItem();
  const character = playableCharacterById(defaultActiveCharacterId);
  dom.previewLabel.innerHTML = `<strong>${escapeHtml(item?.type || "outfit")}</strong><span>${escapeHtml(item?.name || "Current outfit")}</span>`;
  dom.previewDoll.innerHTML = paperDollRenderer.avatarMarkup("tuner", state.outfit, character) + testLayerMarkup();
  // ① 類型框（faint）依 selectedType safeBox；② 單品框（solid）依 selectedKey targetBox。
  setOverlay(dom.typeOverlay, workingSafeBox[selectedType()], selectedType() ? `${selectedType()} safeBox` : "");
  const key = selectedKey();
  setOverlay(dom.itemOverlay, key ? itemBoxFor(key) : null, key ? "item box" : "");
}

function testLayerMarkup() {
  const url = state.testImageByType[selectedType()];
  const key = selectedKey();
  if (!url || !key) return "";
  const pct = insetPct(itemBoxFor(key));
  const style = `--layer-img:url('${url}');--layer-top:${pct.top}%;--layer-right:${pct.right}%;--layer-bottom:${pct.bottom}%;--layer-left:${pct.left}%`;
  return `<span class="paper-doll-layer paper-doll-layer-type-test" style="${style}" aria-hidden="true"></span>`;
}

function setOverlay(el, box, label) {
  if (!box) { el.style.display = "none"; return; }
  const pct = insetPct(box);
  el.style.display = "block";
  el.style.inset = `${pct.top}% ${pct.right}% ${pct.bottom}% ${pct.left}%`;
  el.dataset.label = label || "";
}

function renderOutput() {
  // ① 類型框 → rules.js wardrobeLayerBoundsByType（safeBox 改為工作值，保留 render bounds）。
  dom.outRules.value = `export const wardrobeLayerBoundsByType = Object.freeze({\n${Object.keys(wardrobeLayerBoundsByType).map((type) => {
    const orig = wardrobeLayerBoundsByType[type];
    const safe = workingSafeBox[type];
    const render = hasRenderOffset(orig) ? `, ${boxLiteral(renderBoundsOf(orig))}` : "";
    return `  ${type}: layerBounds(${boxLiteral(safe)}${render})`;
  }).join(",\n")}\n});`;
  // ② 單品框覆寫 → asset-target-overrides.js（只列與裁切原始框不同者）。
  const entries = Object.keys(workingItemBox)
    .filter((key) => !sameBox(workingItemBox[key], assetContentBoxByPackName[key] || null))
    .sort()
    .map((key) => `  ${JSON.stringify(key)}: ${boxLiteral(workingItemBox[key])}`);
  dom.outOverrides.value = `export const assetTargetOverrides = Object.freeze({\n${entries.join(",\n")}${entries.length ? "\n" : ""}});`;
}

// ===== selection / model =====
function equipSelectedItem() { state.outfit = { ...baseOutfit }; equipItem(selectedItem(), state.outfit); }

function equipItem(item, outfit) {
  if (!item) return;
  if (item.type === "outfitSet") { Object.values(item.equips || {}).forEach((id) => equipItem(itemMap.get(id), outfit)); return; }
  if (item.type === "dress") { outfit.top = "none"; outfit.bottom = "none"; }
  if (item.type === "top" || item.type === "bottom") outfit.dress = "none";
  outfit[item.type] = item.id;
}

function itemWithWorkingBoxes(id) {
  const item = itemMap.get(id);
  if (!item) return null;
  return {
    ...item,
    layers: (item.layers || []).map((layer) => {
      const key = keyFromSrc(layer.src);
      const type = layer.type || item.type;
      const targetBox = key ? itemBoxFor(key) : null;
      return { ...layer, bounds: { ...(wardrobeLayerBoundsByType[type] || {}), targetBox } };
    })
  };
}

function selectedItem() { return itemMap.get(state.selectedItemId) || null; }
function selectedType() { const it = selectedItem(); return it?.layers?.[0]?.type || it?.type || ""; }
function selectedKey() { const it = selectedItem(); const src = it?.layers?.[0]?.src; return src ? keyFromSrc(src) : ""; }

function seedItemBox(key) {
  return assetTargetOverrides[key] || assetContentBoxByPackName[key] || workingSafeBox[typeOfKey(key)] || fullCanvas();
}
function itemBoxFor(key) { if (!(key in workingItemBox)) workingItemBox[key] = { ...seedItemBox(key) }; return workingItemBox[key]; }
function typeOfKey(key) {
  for (const item of shopItems) for (const layer of item.layers || []) if (keyFromSrc(layer.src) === key) return layer.type || item.type;
  return "";
}

function setSafeEdge(edge, raw) {
  if (!Number.isFinite(raw)) return;
  const type = selectedType(); if (!type) return;
  const box = workingSafeBox[type];
  const value = clampEdge(edge, raw, box);
  workingSafeBox[type] = { ...box, [edge]: value };
  dom[`safe${cap(edge)}`].value = value;
  renderPreview(); renderOutput();
}

function setItemEdge(edge, raw) {
  const key = selectedKey(); if (!key || !Number.isFinite(raw)) return;
  const box = itemBoxFor(key);
  const value = clampEdge(edge, raw, box);
  workingItemBox[key] = { ...box, [edge]: value };
  dom[`item${cap(edge)}`].value = value;
  renderPreview(); renderOutput(); renderSelectedInfo();
}

function moveItem(dx, dy) {
  const key = selectedKey(); if (!key) return;
  const box = itemBoxFor(key);
  const w = box.right - box.left; const h = box.bottom - box.top;
  const left = Math.max(0, Math.min(CANVAS.W - w, box.left + dx));
  const top = Math.max(0, Math.min(CANVAS.H - h, box.top + dy));
  workingItemBox[key] = { left, top, right: left + w, bottom: top + h };
  renderAll();
}

function scaleItem(factor) {
  const key = selectedKey(); if (!key) return;
  const box = itemBoxFor(key);
  const cx = (box.left + box.right) / 2; const cy = (box.top + box.bottom) / 2;
  const hw = ((box.right - box.left) * factor) / 2; const hh = ((box.bottom - box.top) * factor) / 2;
  workingItemBox[key] = {
    left: Math.round(Math.max(0, cx - hw)), top: Math.round(Math.max(0, cy - hh)),
    right: Math.round(Math.min(CANVAS.W, cx + hw)), bottom: Math.round(Math.min(CANVAS.H, cy + hh))
  };
  renderAll();
}

// ===== helpers =====
function q(sel) { return document.querySelector(sel); }
function cap(s) { return s[0].toUpperCase() + s.slice(1); }
function fullCanvas() { return { left: 0, top: 0, right: CANVAS.W, bottom: CANVAS.H }; }
function keyFromSrc(src) { const m = /wardrobe\/([^/]+)\/assets\/layers\/([^/]+)\.webp/.exec(src || ""); return m ? `${m[1]}/${m[2]}` : ""; }
function clampEdge(edge, raw, box) {
  const limit = edge === "left" || edge === "right" ? CANVAS.W : CANVAS.H;
  let v = Math.max(0, Math.min(limit, Math.round(raw)));
  if (edge === "left") v = Math.min(v, box.right);
  else if (edge === "right") v = Math.max(v, box.left);
  else if (edge === "top") v = Math.min(v, box.bottom);
  else if (edge === "bottom") v = Math.max(v, box.top);
  return v;
}
function insetPct(box) {
  return {
    top: r3((box.top / CANVAS.H) * 100), right: r3(((CANVAS.W - box.right) / CANVAS.W) * 100),
    bottom: r3(((CANVAS.H - box.bottom) / CANVAS.H) * 100), left: r3((box.left / CANVAS.W) * 100)
  };
}
function sameBox(a, b) { return !!a && !!b && a.left === b.left && a.top === b.top && a.right === b.right && a.bottom === b.bottom; }
function boxLiteral(b) { return `{ left: ${b.left}, top: ${b.top}, right: ${b.right}, bottom: ${b.bottom} }`; }
function renderBoundsOf(b) { return { left: b.left || 0, top: b.top || 0, right: b.right || 0, bottom: b.bottom || 0 }; }
function hasRenderOffset(b) { return (b.left || 0) !== 0 || (b.top || 0) !== 0 || (b.right || 0) !== 0 || (b.bottom || 0) !== 0; }
function r3(v) { return Math.round(v * 1000) / 1000; }
function itemsForCategory(categoryId) {
  const category = categories.find((c) => c.id === categoryId);
  return category ? shopItems.filter((item) => category.types.includes(item.type)) : [];
}
function firstItemForCategory(categoryId) {
  return itemsForCategory(categoryId).find((item) => item.storeId !== "starter") || itemsForCategory(categoryId)[0];
}
function assetUrl(src) { if (!src) return ""; return src.startsWith("content-package/") || src.startsWith("content-base/") ? `../${src}` : src; }
function priceText(item) { return Number.isFinite(item.cost) && item.cost > 0 ? `${item.cost} coins` : "Free"; }
async function copy(area, button, label) {
  await navigator.clipboard?.writeText(area.value);
  button.textContent = "Copied";
  window.setTimeout(() => { button.textContent = label; }, 900);
}
function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
