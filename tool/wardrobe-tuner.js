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
// 類型（UI category）多選篩選集（預設全選）。
const allCats = categories.map((c) => c.id);
let selectedCats = new Set(allCats);
// 第一層：類別投影框（= 該類 safeBox）。第二層：各單品 targetBox（覆寫→裁切原始框→safeBox）。
const workingSafeBox = Object.fromEntries(
  Object.entries(wardrobeLayerBoundsByType).map(([type, b]) => [type, b.safeBox ? { ...b.safeBox } : fullCanvas()])
);
const workingItemBox = {}; // key `<pack>/<name>` → { left, top, right, bottom }（lazy seed）
const baseOutfit = Object.fromEntries(Object.keys(wardrobeLayerBoundsByType).map((type) => [type, "none"]));
const state = {
  selectedItemId: firstShownItem()?.id || "",
  editMode: "item", // "type"（① 類型框/safeBox）或 "item"（② 單品框/targetBox）
  zoom: 1,
  outfit: { ...baseOutfit }
};

const dom = {
  summaryLine: q("#summaryLine"), itemList: q("#itemList"),
  packFilterToggle: q("#packFilterToggle"), packFilterMenu: q("#packFilterMenu"),
  packAll: q("#packAll"), packNone: q("#packNone"), packCheckboxes: q("#packCheckboxes"),
  catFilterToggle: q("#catFilterToggle"), catFilterMenu: q("#catFilterMenu"),
  catAll: q("#catAll"), catNone: q("#catNone"), catCheckboxes: q("#catCheckboxes"),
  previewLabel: q("#previewLabel"), previewDoll: q("#previewDoll"), previewStage: q(".preview-stage"),
  typeOverlay: q("#typeOverlay"), itemOverlay: q("#itemOverlay"), selectedInfo: q("#selectedInfo"),
  modeTabs: q("#modeTabs"), modeHelp: q("#modeHelp"),
  applyAll: q("#applyAll"), applyStatus: q("#applyStatus"),
  addItemToggle: q("#addItemToggle"), addItemForm: q("#addItemForm"),
  addPack: q("#addPack"), addType: q("#addType"), addId: q("#addId"),
  addName: q("#addName"), addAsset: q("#addAsset"), addCost: q("#addCost"), addStatus: q("#addStatus")
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
renderCategoryFilter();
populateAddSelects();
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
  dom.catFilterToggle.addEventListener("click", () => { dom.catFilterMenu.hidden = !dom.catFilterMenu.hidden; });
  dom.catAll.addEventListener("click", () => { selectedCats = new Set(allCats); afterCatChange(); });
  dom.catNone.addEventListener("click", () => { selectedCats = new Set(); afterCatChange(); });
  dom.catCheckboxes.addEventListener("change", (e) => {
    const cat = e.target?.value;
    if (!cat) return;
    if (e.target.checked) selectedCats.add(cat); else selectedCats.delete(cat);
    afterCatChange();
  });
  document.addEventListener("click", (e) => {
    document.querySelectorAll(".pack-filter").forEach((dd) => { if (!dd.contains(e.target)) { const m = dd.querySelector(".pack-menu"); if (m) m.hidden = true; } });
  });
  dom.modeTabs.addEventListener("click", (e) => {
    const mode = e.target.closest("button")?.dataset.mode;
    if (mode) { state.editMode = mode; renderAll(); }
  });
  dom.addItemToggle.addEventListener("click", () => { dom.addItemForm.hidden = !dom.addItemForm.hidden; });
  dom.addItemForm.addEventListener("submit", submitAddItem);
  dom.applyAll.addEventListener("click", applyToFiles);
  setupDrag(dom.typeOverlay);
  setupDrag(dom.itemOverlay);
  setupColumnResize();
  window.addEventListener("resize", () => paperDollRenderer.applyLayerTransforms(dom.previewDoll));
  // 中央試穿畫面：滑鼠滾輪縮放（以 stage transform scale；drag 用 getBoundingClientRect 故不受影響）。
  dom.previewStage?.addEventListener("wheel", (e) => {
    e.preventDefault();
    state.zoom = clampN(state.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), 0.4, 4);
    dom.previewStage.style.transform = `scale(${Math.round(state.zoom * 1000) / 1000})`;
  }, { passive: false });
}

// 左右欄皆可拖曳調寬：左分隔條改 --left-w（=clientX）、右分隔條改 --right-w（=innerWidth-clientX）。
function setupColumnResize() {
  const shell = document.querySelector(".tool-shell");
  if (!shell) return;
  const bind = (resizer, side) => {
    if (!resizer) return;
    let active = false;
    resizer.addEventListener("pointerdown", (e) => { active = true; try { resizer.setPointerCapture(e.pointerId); } catch { /* noop */ } e.preventDefault(); });
    resizer.addEventListener("pointermove", (e) => {
      if (!active) return;
      if (side === "left") shell.style.setProperty("--left-w", `${clampN(e.clientX, 220, 680)}px`);
      else shell.style.setProperty("--right-w", `${clampN(window.innerWidth - e.clientX, 240, 640)}px`);
    });
    const end = () => { active = false; };
    resizer.addEventListener("pointerup", end);
    resizer.addEventListener("pointercancel", end);
  };
  bind(document.querySelector(".col-resizer:not(.col-resizer-right)"), "left");
  bind(document.querySelector(".col-resizer-right"), "right");
}

function renderAll() {
  renderSummary();
  renderItemList();
  renderModeTabs();
  renderSelectedInfo();
  renderPreview();
}

function renderModeTabs() {
  [...dom.modeTabs.querySelectorAll("button")].forEach((b) => b.classList.toggle("active", b.dataset.mode === state.editMode));
  dom.modeHelp.textContent = state.editMode === "type"
    ? "編輯此類投影範圍（藍框＝safeBox），套用同類；單品框須落在其內。"
    : "編輯這一件投影矩形（綠框）：邊中點縮放、中央移動；四角拖拉調上/下邊寬（梯形拉伸）。";
}

function renderSummary() {
  dom.summaryLine.textContent = `${itemsShown().length}/${shopItems.length} items · 素材包＋類型多選篩選 · 拖綠框（角＝梯形）· 滾輪縮放 · canvas ${CANVAS.W}×${CANVAS.H}`;
}

function renderCategoryFilter() {
  dom.catCheckboxes.innerHTML = "";
  categories.forEach((category) => {
    const count = shopItems.filter((i) => catOfItem(i) === category.id).length;
    const label = document.createElement("label");
    label.className = "pack-check";
    label.innerHTML = `<input type="checkbox" value="${escapeHtml(category.id)}"${selectedCats.has(category.id) ? " checked" : ""}><span>${escapeHtml(category.label)}</span><em>${count}</em>`;
    dom.catCheckboxes.append(label);
  });
  const n = selectedCats.size;
  const summary = n === allCats.length ? "全部" : n === 0 ? "無" : n === 1 ? (categories.find((c) => c.id === [...selectedCats][0])?.label || "1") : `${n} 類`;
  dom.catFilterToggle.textContent = `類型：${summary} ▾`;
}

function afterCatChange() {
  ensureValidSelection();
  renderCategoryFilter();
  renderAll();
}

function renderItemList() {
  dom.itemList.innerHTML = "";
  itemsShown().forEach((item) => {
    const row = document.createElement("div");
    row.className = `item-row${item.id === state.selectedItemId ? " active" : ""}`;
    row.innerHTML = `
      <button type="button" class="item-main">
        <img src="${assetUrl(item.image)}" alt="">
        <span class="item-name"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.type)} / ${escapeHtml(item.id)}</span></span>
        <span class="item-price">${priceText(item)}</span>
      </button>
      <button type="button" class="item-act" data-act="open" title="開啟素材資料夾">📁</button>
      <button type="button" class="item-act" data-act="del" title="刪除此單品">🗑</button>`;
    row.querySelector(".item-main").addEventListener("click", () => { state.selectedItemId = item.id; equipSelectedItem(); renderAll(); });
    row.querySelector('[data-act="open"]').addEventListener("click", () => openItemFolder(item));
    row.querySelector('[data-act="del"]').addEventListener("click", () => deleteItem(item));
    dom.itemList.append(row);
  });
}

function assetOfItem(item) { const m = /assets\/(?:layers|thumbs)\/([^/]+)\.webp/.exec(item?.image || item?.layers?.[0]?.src || ""); return m ? m[1] : ""; }

async function openItemFolder(item) {
  try {
    const d = await postJson("/tool/open-folder", { pack: packOfItem(item) });
    if (!d.ok) window.alert(`開啟資料夾失敗：${d.error}`);
  } catch (e) { window.alert(`開啟資料夾失敗：${e.message}`); }
}

async function deleteItem(item) {
  if (!window.confirm(`刪除「${item.name}」？\n會移除 manifest 該行＋layer/thumb webp＋其覆寫，無法復原。`)) return;
  try {
    const d = await postJson("/tool/delete-item", { pack: packOfItem(item), asset: assetOfItem(item), itemId: item.id });
    if (!d.ok) { window.alert(`刪除失敗：${d.error}`); return; }
    window.location.reload();
  } catch (e) { window.alert(`刪除失敗：${e.message}`); }
}

function populateAddSelects() {
  dom.addPack.innerHTML = allPacks.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
  dom.addType.innerHTML = Object.keys(wardrobeLayerBoundsByType).map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
}

async function submitAddItem(e) {
  e.preventDefault();
  const body = {
    pack: dom.addPack.value, type: dom.addType.value, id: dom.addId.value.trim(),
    name: dom.addName.value.trim(), asset: dom.addAsset.value.trim(), cost: Number(dom.addCost.value) || 0
  };
  setStatus(dom.addStatus, "新增中…", "");
  try {
    const d = await postJson("/tool/add-item", body);
    if (!d.ok) { setStatus(dom.addStatus, `失敗：${d.error}`, "err"); return; }
    setStatus(dom.addStatus, "已新增，重新整理…", "ok");
    window.setTimeout(() => window.location.reload(), 700);
  } catch (e2) { setStatus(dom.addStatus, `失敗：${e2.message}`, "err"); }
}

async function postJson(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}
function setStatus(el, text, kind) { el.textContent = text; el.className = `apply-status${kind ? ` apply-status-${kind}` : ""}`; }

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
  const items = itemsShown();
  if (!items.some((i) => i.id === state.selectedItemId)) {
    state.selectedItemId = (items.find((i) => i.storeId !== "starter") || items[0])?.id || "";
  }
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
  paperDollRenderer.applyLayerTransforms(dom.previewDoll);
  const type = selectedType();
  const key = selectedKey();
  setOverlay(dom.typeOverlay, type ? workingSafeBox[type] : null, type ? `① ${type}` : "", state.editMode === "type");
  setOverlay(dom.itemOverlay, key ? itemBoxFor(key) : null, key ? `② ${escapeHtml(item?.name || "item")}` : "", state.editMode === "item");
}

function setOverlay(el, box, label, active) {
  el.classList.toggle("active", !!active && !!box);
  if (!box) { el.style.display = "none"; return; }
  const pct = insetPct(box);
  el.style.display = "block";
  el.style.inset = `${pct.top}% ${pct.right}% ${pct.bottom}% ${pct.left}%`;
  el.dataset.label = label || "";
  // 梯形：把上/下角控制點移到梯形角（綠框＝單品框才有梯形；矩形時即回到四角）。
  const w = box.right - box.left;
  const tf = w ? ((Number(box.topInset) || 0) / w) * 100 : 0;
  const bf = w ? ((Number(box.bottomInset) || 0) / w) * 100 : 0;
  positionCorner(el, "nw", `${tf}%`, "0");
  positionCorner(el, "ne", `${100 - tf}%`, "0");
  positionCorner(el, "sw", `${bf}%`, "100%");
  positionCorner(el, "se", `${100 - bf}%`, "100%");
}
function positionCorner(el, cls, left, top) {
  const h = el.querySelector(`.drag-handle.${cls}`);
  if (!h) return;
  h.style.left = left; h.style.top = top; h.style.right = "auto"; h.style.bottom = "auto"; h.style.transform = "translate(-50%, -50%)";
}

// ===== active box（依 editMode 指向類型框或單品框） =====
function activeBox() {
  if (state.editMode === "type") { const t = selectedType(); return t ? workingSafeBox[t] : null; }
  const k = selectedKey(); return k ? itemBoxFor(k) : null;
}
function commitActiveBox(box) {
  const b = { left: Math.round(box.left), top: Math.round(box.top), right: Math.round(box.right), bottom: Math.round(box.bottom) };
  const halfMax = (b.right - b.left) / 2 - 2;
  if (Number(box.topInset) > 0) b.topInset = Math.round(clampN(box.topInset, 0, halfMax));
  if (Number(box.bottomInset) > 0) b.bottomInset = Math.round(clampN(box.bottomInset, 0, halfMax));
  if (state.editMode === "type") { const t = selectedType(); if (t) workingSafeBox[t] = b; }
  else { const k = selectedKey(); if (k) workingItemBox[k] = b; }
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
  const corner = handle.length === 2; // nw/ne/sw/se
  const halfMax = (start.right - start.left) / 2 - 2;
  if (handle === "move") {
    const w = start.right - start.left; const h = start.bottom - start.top;
    const left = clampN(start.left + (p.x - sx), 0, CANVAS.W - w); const top = clampN(start.top + (p.y - sy), 0, CANVAS.H - h);
    b = { ...start, left, top, right: left + w, bottom: top + h };
  } else if (corner && state.editMode === "item") {
    // 梯形：角落控制點調上/下邊內縮量（左右對稱），不改 bounding box。
    if (handle === "nw") b.topInset = clampN(p.x - start.left, 0, halfMax);
    else if (handle === "ne") b.topInset = clampN(start.right - p.x, 0, halfMax);
    else if (handle === "sw") b.bottomInset = clampN(p.x - start.left, 0, halfMax);
    else if (handle === "se") b.bottomInset = clampN(start.right - p.x, 0, halfMax);
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
function sameBox(a, b) {
  return !!a && !!b && a.left === b.left && a.top === b.top && a.right === b.right && a.bottom === b.bottom
    && (a.topInset || 0) === (b.topInset || 0) && (a.bottomInset || 0) === (b.bottomInset || 0);
}
function boxLiteral(b) {
  const extra = [];
  if (Number(b.topInset) > 0) extra.push(`topInset: ${b.topInset}`);
  if (Number(b.bottomInset) > 0) extra.push(`bottomInset: ${b.bottomInset}`);
  return `{ left: ${b.left}, top: ${b.top}, right: ${b.right}, bottom: ${b.bottom}${extra.length ? `, ${extra.join(", ")}` : ""} }`;
}
function renderBoundsOf(b) { return { left: b.left || 0, top: b.top || 0, right: b.right || 0, bottom: b.bottom || 0 }; }
function hasRenderOffset(b) { return (b.left || 0) !== 0 || (b.top || 0) !== 0 || (b.right || 0) !== 0 || (b.bottom || 0) !== 0; }
function r3(v) { return Math.round(v * 1000) / 1000; }
function packOfItem(item) { const m = /wardrobe\/([^/]+)\/assets\//.exec(item?.image || ""); return m ? m[1] : ""; }
function catOfItem(item) { const c = categories.find((cat) => cat.types.includes(item.type)); return c ? c.id : ""; }
function itemsShown() { return shopItems.filter((item) => selectedCats.has(catOfItem(item)) && selectedPacks.has(packOfItem(item))); }
function firstShownItem() { const items = itemsShown(); return items.find((item) => item.storeId !== "starter") || items[0]; }
function assetUrl(src) { if (!src) return ""; return src.startsWith("content-package/") || src.startsWith("content-base/") ? `../${src}` : src; }
function priceText(item) { return Number.isFinite(item.cost) && item.cost > 0 ? `${item.cost} coins` : "Free"; }
function escapeHtml(value = "") { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
