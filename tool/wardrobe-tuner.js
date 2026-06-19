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
// 素材包（content pack）清單與篩選集（預設全選；模組層級，避免 state 初始化前的 TDZ）。
const allPacks = [...new Set(shopItems.map(packOfItem).filter(Boolean))].sort();
let selectedPacks = new Set(allPacks);
// 第一層：類別投影框（= 該類 safeBox）。第二層：各單品 targetBox（覆寫→裁切原始框→safeBox）。
const workingSafeBox = Object.fromEntries(
  Object.entries(wardrobeLayerBoundsByType).map(([type, b]) => [type, b.safeBox ? { ...b.safeBox } : fullCanvas()])
);
const workingItemBox = {}; // key `<pack>/<name>` → { left, top, right, bottom }（lazy seed）
const baseOutfit = Object.fromEntries(Object.keys(wardrobeLayerBoundsByType).map((type) => [type, "none"]));
const state = {
  categoryId: categories[0]?.id || "",
  selectedItemId: firstItemForCategory(categories[0]?.id)?.id || "",
  editMode: "item", // "type"（① 類型框/safeBox）或 "item"（② 單品框/targetBox）
  outfit: { ...baseOutfit }
};

const dom = {
  summaryLine: q("#summaryLine"), categoryTabs: q("#categoryTabs"), itemList: q("#itemList"),
  packFilterToggle: q("#packFilterToggle"), packFilterMenu: q("#packFilterMenu"),
  packAll: q("#packAll"), packNone: q("#packNone"), packCheckboxes: q("#packCheckboxes"),
  previewLabel: q("#previewLabel"), previewDoll: q("#previewDoll"),
  typeOverlay: q("#typeOverlay"), itemOverlay: q("#itemOverlay"),
  selectedInfo: q("#selectedInfo"),
  modeTabs: q("#modeTabs"), modeHelp: q("#modeHelp"), boxTitle: q("#boxTitle"),
  boxUp: q("#boxUp"), boxDown: q("#boxDown"), boxMoveLeft: q("#boxMoveLeft"), boxMoveRight: q("#boxMoveRight"),
  boxBigger: q("#boxBigger"), boxSmaller: q("#boxSmaller"), resetBox: q("#resetBox"), resetAll: q("#resetAll"),
  applyAll: q("#applyAll"), applyStatus: q("#applyStatus")
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
renderPackFilter();
equipSelectedItem();
renderAll();

function bindEvents() {
  dom.packFilterToggle.addEventListener("click", () => { dom.packFilterMenu.hidden = !dom.packFilterMenu.hidden; });
  dom.packAll.addEventListener("click", () => { selectedPacks = new Set(allPacks); afterPackChange(); });
  dom.packNone.addEventListener("click", () => { selectedPacks = new Set(); afterPackChange(); });
  dom.packCheckboxes.addEventListener("change", (e) => {
    const pack = e.target?.value;
    if (!pack) return;
    if (e.target.checked) selectedPacks.add(pack); else selectedPacks.delete(pack);
    afterPackChange();
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".pack-filter")) dom.packFilterMenu.hidden = true; });
  dom.modeTabs.addEventListener("click", (e) => {
    const mode = e.target.closest("button")?.dataset.mode;
    if (mode) { state.editMode = mode; renderAll(); }
  });
  dom.boxUp.addEventListener("click", () => moveBox(0, -4));
  dom.boxDown.addEventListener("click", () => moveBox(0, 4));
  dom.boxMoveLeft.addEventListener("click", () => moveBox(-4, 0));
  dom.boxMoveRight.addEventListener("click", () => moveBox(4, 0));
  dom.boxBigger.addEventListener("click", () => scaleBox(1.05));
  dom.boxSmaller.addEventListener("click", () => scaleBox(1 / 1.05));
  dom.resetBox.addEventListener("click", resetActiveBox);
  dom.resetAll.addEventListener("click", () => {
    Object.entries(wardrobeLayerBoundsByType).forEach(([type, b]) => { workingSafeBox[type] = b.safeBox ? { ...b.safeBox } : fullCanvas(); });
    for (const k of Object.keys(workingItemBox)) delete workingItemBox[k];
    renderAll();
  });
  dom.applyAll.addEventListener("click", applyToFiles);
  setupDrag(dom.typeOverlay);
  setupDrag(dom.itemOverlay);
}

function renderAll() {
  renderSummary();
  renderCategoryTabs();
  renderItemList();
  renderModeTabs();
  renderSelectedInfo();
  renderControls();
  renderPreview();
}

function renderSummary() {
  dom.summaryLine.textContent = `${shopItems.length} items / ${categories.length} categories · 左選單品 → 上選①/② → 圖上拖拉或右側數值 · canvas ${CANVAS.W}×${CANVAS.H}`;
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
      <span class="item-name"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.type)} / ${escapeHtml(item.id)}</span></span>
      <span class="item-price">${priceText(item)}</span>`;
    row.addEventListener("click", () => { state.selectedItemId = item.id; equipSelectedItem(); renderAll(); });
    dom.itemList.append(row);
  });
}

function renderPackFilter() {
  dom.packCheckboxes.innerHTML = "";
  allPacks.forEach((pack) => {
    const count = shopItems.filter((i) => packOfItem(i) === pack).length;
    const label = document.createElement("label");
    label.className = "pack-check";
    label.innerHTML = `<input type="checkbox" value="${escapeHtml(pack)}"${selectedPacks.has(pack) ? " checked" : ""}><span>${escapeHtml(pack)}</span><em>${count}</em>`;
    dom.packCheckboxes.append(label);
  });
  const n = selectedPacks.size;
  const summary = n === allPacks.length ? "全部" : n === 0 ? "無" : n === 1 ? [...selectedPacks][0] : `${n} 包`;
  dom.packFilterToggle.textContent = `素材包：${summary} ▾`;
}

function afterPackChange() {
  ensureValidSelection();
  renderPackFilter();
  renderAll();
}

function ensureValidSelection() {
  let items = itemsForCategory(state.categoryId);
  if (!items.length) {
    const cat = categories.find((c) => itemsForCategory(c.id).length);
    if (cat) { state.categoryId = cat.id; items = itemsForCategory(cat.id); }
  }
  if (!items.some((i) => i.id === state.selectedItemId)) state.selectedItemId = items[0]?.id || "";
  equipSelectedItem();
}

function renderModeTabs() {
  [...dom.modeTabs.querySelectorAll("button")].forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === state.editMode);
  });
  dom.boxTitle.firstChild.textContent = state.editMode === "type" ? "① 類型框 " : "② 單品框 ";
  dom.modeHelp.textContent = state.editMode === "type"
    ? "編輯此類的投影範圍（safeBox），套用到同類所有單品；單品框須落在其內。"
    : "編輯這一件實際投影的矩形（targetBox），只影響目前選取的單品。";
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
  const disabled = !activeBox();
  [dom.boxUp, dom.boxDown, dom.boxMoveLeft, dom.boxMoveRight, dom.boxBigger, dom.boxSmaller, dom.resetBox]
    .forEach((el) => { el.disabled = disabled; });
}

function renderPreview() {
  const item = selectedItem();
  const character = playableCharacterById(defaultActiveCharacterId);
  dom.previewLabel.innerHTML = `<strong>${escapeHtml(item?.type || "outfit")}</strong><span>${escapeHtml(item?.name || "Current outfit")}</span>`;
  dom.previewDoll.innerHTML = paperDollRenderer.avatarMarkup("tuner", state.outfit, character);
  const type = selectedType();
  const key = selectedKey();
  setOverlay(dom.typeOverlay, type ? workingSafeBox[type] : null, type ? `① ${type} safeBox` : "", state.editMode === "type");
  setOverlay(dom.itemOverlay, key ? itemBoxFor(key) : null, key ? "② item box" : "", state.editMode === "item");
}

function setOverlay(el, box, label, active) {
  el.classList.toggle("active", !!active && !!box);
  if (!box) { el.style.display = "none"; return; }
  const pct = insetPct(box);
  el.style.display = "block";
  el.style.inset = `${pct.top}% ${pct.right}% ${pct.bottom}% ${pct.left}%`;
  el.dataset.label = label || "";
}

// ===== active box（依 editMode 指向類型框或單品框） =====
function activeBox() {
  if (state.editMode === "type") { const t = selectedType(); return t ? workingSafeBox[t] : null; }
  const k = selectedKey(); return k ? itemBoxFor(k) : null;
}
function commitActiveBox(box) {
  const b = { left: Math.round(box.left), top: Math.round(box.top), right: Math.round(box.right), bottom: Math.round(box.bottom) };
  if (state.editMode === "type") { const t = selectedType(); if (t) workingSafeBox[t] = b; }
  else { const k = selectedKey(); if (k) workingItemBox[k] = b; }
}
function resetActiveBox() {
  if (state.editMode === "type") {
    const t = selectedType(); if (!t) return;
    workingSafeBox[t] = wardrobeLayerBoundsByType[t]?.safeBox ? { ...wardrobeLayerBoundsByType[t].safeBox } : fullCanvas();
  } else {
    const k = selectedKey(); if (k) delete workingItemBox[k];
  }
  renderAll();
}

function moveBox(dx, dy) {
  const box = activeBox(); if (!box) return;
  const w = box.right - box.left; const h = box.bottom - box.top;
  const left = clampN(box.left + dx, 0, CANVAS.W - w); const top = clampN(box.top + dy, 0, CANVAS.H - h);
  commitActiveBox({ left, top, right: left + w, bottom: top + h });
  afterBoxChange();
}
function scaleBox(factor) {
  const box = activeBox(); if (!box) return;
  const cx = (box.left + box.right) / 2; const cy = (box.top + box.bottom) / 2;
  const hw = ((box.right - box.left) * factor) / 2; const hh = ((box.bottom - box.top) * factor) / 2;
  commitActiveBox({ left: clampN(cx - hw, 0, CANVAS.W), top: clampN(cy - hh, 0, CANVAS.H), right: clampN(cx + hw, 0, CANVAS.W), bottom: clampN(cy + hh, 0, CANVAS.H) });
  afterBoxChange();
}
function afterBoxChange() { renderControls(); renderPreview(); renderSelectedInfo(); }

// ② 圖上拖拉：中央方塊移動、四邊四角 8 點非等比縮放（作用於目前所選的框）。
function setupDrag(overlay) {
  let active = null;
  overlay.addEventListener("pointerdown", (e) => {
    const handle = e.target?.dataset?.h;
    const box = activeBox();
    if (!handle || !box) return;
    e.preventDefault();
    try { overlay.setPointerCapture(e.pointerId); } catch { /* noop */ }
    const p = pointerCanvas(e);
    active = { handle, start: { ...box }, sx: p.x, sy: p.y };
  });
  overlay.addEventListener("pointermove", (e) => { if (active) applyDrag(active, pointerCanvas(e)); });
  const end = () => { active = null; };
  overlay.addEventListener("pointerup", end);
  overlay.addEventListener("pointercancel", end);
}
function pointerCanvas(e) {
  const rect = dom.previewDoll.getBoundingClientRect();
  return {
    x: clampN(((e.clientX - rect.left) / rect.width) * CANVAS.W, 0, CANVAS.W),
    y: clampN(((e.clientY - rect.top) / rect.height) * CANVAS.H, 0, CANVAS.H)
  };
}
function applyDrag(active, p) {
  const { handle, start, sx, sy } = active;
  let b = { ...start };
  if (handle === "move") {
    const w = start.right - start.left; const h = start.bottom - start.top;
    const left = clampN(start.left + (p.x - sx), 0, CANVAS.W - w); const top = clampN(start.top + (p.y - sy), 0, CANVAS.H - h);
    b = { left, top, right: left + w, bottom: top + h };
  } else {
    if (handle.includes("w")) b.left = clampN(p.x, 0, b.right - 4);
    if (handle.includes("e")) b.right = clampN(p.x, b.left + 4, CANVAS.W);
    if (handle.includes("n")) b.top = clampN(p.y, 0, b.bottom - 4);
    if (handle.includes("s")) b.bottom = clampN(p.y, b.top + 4, CANVAS.H);
  }
  commitActiveBox(b);
  afterBoxChange();
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
      return { ...layer, bounds: { ...(wardrobeLayerBoundsByType[type] || {}), targetBox: key ? itemBoxFor(key) : null } };
    })
  };
}
function selectedItem() { return itemMap.get(state.selectedItemId) || null; }
function selectedType() { const it = selectedItem(); return it?.layers?.[0]?.type || it?.type || ""; }
function selectedKey() { const it = selectedItem(); const src = it?.layers?.[0]?.src; return src ? keyFromSrc(src) : ""; }
function seedItemBox(key) { return assetTargetOverrides[key] || assetContentBoxByPackName[key] || workingSafeBox[typeOfKey(key)] || fullCanvas(); }
function itemBoxFor(key) { if (!(key in workingItemBox)) workingItemBox[key] = { ...seedItemBox(key) }; return workingItemBox[key]; }
function typeOfKey(key) {
  for (const item of shopItems) for (const layer of item.layers || []) if (keyFromSrc(layer.src) === key) return layer.type || item.type;
  return "";
}

// ===== export snippets + apply =====
function buildRulesSnippet() {
  return `export const wardrobeLayerBoundsByType = Object.freeze({\n${Object.keys(wardrobeLayerBoundsByType).map((type) => {
    const orig = wardrobeLayerBoundsByType[type];
    const render = hasRenderOffset(orig) ? `, ${boxLiteral(renderBoundsOf(orig))}` : "";
    return `  ${type}: layerBounds(${boxLiteral(workingSafeBox[type])}${render})`;
  }).join(",\n")}\n});`;
}
function buildOverridesSnippet() {
  // 合併「既有已存覆寫」（本次工具未碰到的單品須保留，避免套用時被洗掉）與本次編輯；
  // 本次調回與裁切原始框相同者視為還原 identity、不寫入。
  const merged = { ...assetTargetOverrides };
  for (const key of Object.keys(workingItemBox)) {
    if (sameBox(workingItemBox[key], assetContentBoxByPackName[key] || null)) delete merged[key];
    else merged[key] = { ...workingItemBox[key] };
  }
  const entries = Object.keys(merged).sort().map((key) => `  ${JSON.stringify(key)}: ${boxLiteral(merged[key])}`);
  return `export const assetTargetOverrides = Object.freeze({\n${entries.join(",\n")}${entries.length ? "\n" : ""}});`;
}
async function applyToFiles() {
  dom.applyAll.disabled = true;
  setApplyStatus("套用中…", "");
  try {
    const res = await fetch("/tool/apply-wardrobe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules: buildRulesSnippet(), overrides: buildOverridesSnippet() })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
    setApplyStatus(`已套用 → ${data.written.join("、")}。重新整理遊戲即可看到。`, "ok");
  } catch (error) {
    setApplyStatus(`套用失敗：${error.message}（請確認 dev server 為 server.mjs）`, "err");
  } finally {
    dom.applyAll.disabled = false;
  }
}
function setApplyStatus(text, kind) { dom.applyStatus.textContent = text; dom.applyStatus.className = `apply-status${kind ? ` apply-status-${kind}` : ""}`; }

// ===== helpers =====
function q(sel) { return document.querySelector(sel); }
function fullCanvas() { return { left: 0, top: 0, right: CANVAS.W, bottom: CANVAS.H }; }
function keyFromSrc(src) { const m = /wardrobe\/([^/]+)\/assets\/layers\/([^/]+)\.webp/.exec(src || ""); return m ? `${m[1]}/${m[2]}` : ""; }
function clampN(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
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
function packOfItem(item) { const m = /wardrobe\/([^/]+)\/assets\//.exec(item?.image || ""); return m ? m[1] : ""; }
function itemsForCategory(categoryId) { const c = categories.find((x) => x.id === categoryId); return c ? shopItems.filter((item) => c.types.includes(item.type) && selectedPacks.has(packOfItem(item))) : []; }
function firstItemForCategory(categoryId) { return itemsForCategory(categoryId).find((item) => item.storeId !== "starter") || itemsForCategory(categoryId)[0]; }
function assetUrl(src) { if (!src) return ""; return src.startsWith("content-package/") || src.startsWith("content-base/") ? `../${src}` : src; }
function priceText(item) { return Number.isFinite(item.cost) && item.cost > 0 ? `${item.cost} coins` : "Free"; }
function escapeHtml(value = "") { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
