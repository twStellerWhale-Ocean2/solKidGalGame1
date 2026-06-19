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
  outfit: { ...baseOutfit }
};

const dom = {
  summaryLine: q("#summaryLine"), categoryTabs: q("#categoryTabs"), itemList: q("#itemList"),
  packFilterToggle: q("#packFilterToggle"), packFilterMenu: q("#packFilterMenu"),
  packAll: q("#packAll"), packNone: q("#packNone"), packCheckboxes: q("#packCheckboxes"),
  previewLabel: q("#previewLabel"), previewDoll: q("#previewDoll"),
  itemOverlay: q("#itemOverlay"), selectedInfo: q("#selectedInfo"),
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
  dom.applyAll.addEventListener("click", applyToFiles);
  setupDrag(dom.itemOverlay);
  setupColumnResize();
}

// 左欄可拖曳調整欄寬：拖 .col-resizer 改 .tool-shell 的 --left-w。
function setupColumnResize() {
  const shell = document.querySelector(".tool-shell");
  const resizer = document.querySelector(".col-resizer");
  if (!shell || !resizer) return;
  let active = false;
  resizer.addEventListener("pointerdown", (e) => { active = true; try { resizer.setPointerCapture(e.pointerId); } catch { /* noop */ } e.preventDefault(); });
  resizer.addEventListener("pointermove", (e) => { if (active) shell.style.setProperty("--left-w", `${clampN(e.clientX, 220, 680)}px`); });
  const end = () => { active = false; };
  resizer.addEventListener("pointerup", end);
  resizer.addEventListener("pointercancel", end);
}

function renderAll() {
  renderSummary();
  renderCategoryTabs();
  renderItemList();
  renderSelectedInfo();
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

function renderSelectedInfo() {
  const item = selectedItem();
  const key = selectedKey();
  const overridden = key && key in workingItemBox && !sameBox(workingItemBox[key], seedItemBox(key));
  dom.selectedInfo.innerHTML = item
    ? `<strong>${escapeHtml(item.name)}</strong><span>type <code>${escapeHtml(selectedType() || "—")}</code> · ${key ? `<code>${escapeHtml(key)}</code>` : "（無單一 layer）"}${overridden ? " · <em>已覆寫</em>" : ""}</span>`
    : "（未選單品）";
}

function renderPreview() {
  const item = selectedItem();
  const character = playableCharacterById(defaultActiveCharacterId);
  dom.previewLabel.innerHTML = `<strong>${escapeHtml(item?.type || "outfit")}</strong><span>${escapeHtml(item?.name || "Current outfit")}</span>`;
  dom.previewDoll.innerHTML = paperDollRenderer.avatarMarkup("tuner", state.outfit, character);
  const key = selectedKey();
  setOverlay(dom.itemOverlay, key ? itemBoxFor(key) : null, key ? escapeHtml(item?.name || "item") : "", true);
}

function setOverlay(el, box, label, active) {
  el.classList.toggle("active", !!active && !!box);
  if (!box) { el.style.display = "none"; return; }
  const pct = insetPct(box);
  el.style.display = "block";
  el.style.inset = `${pct.top}% ${pct.right}% ${pct.bottom}% ${pct.left}%`;
  el.dataset.label = label || "";
}

// ===== active box（單品框 targetBox，唯一可編輯之框） =====
function activeBox() { const k = selectedKey(); return k ? itemBoxFor(k) : null; }
function commitActiveBox(box) {
  const k = selectedKey();
  if (k) workingItemBox[k] = { left: Math.round(box.left), top: Math.round(box.top), right: Math.round(box.right), bottom: Math.round(box.bottom) };
}
function afterBoxChange() { renderPreview(); renderSelectedInfo(); }

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
