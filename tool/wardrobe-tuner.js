import {
  categories,
  defaultActiveCharacterId,
  paperDollBaseLayer,
  paperDollLayerOrder,
  playableCharacterById,
  shopItems,
  wardrobeLayerBoundsByType
} from "../content-package/wardrobe/manifest.js";
import { buildWardrobeItem } from "../content-package/wardrobe/_shared/item-helpers.js";
import { createPaperDollRenderer } from "../game-engine/render/paper-doll.js";
import { cornerOffsets, hasWarp } from "../game-engine/render/warp.js";
import {
  uiConfirm, uiAlert, uiFormDialog, snack, status, postJson, readFileAsDataUrl,
  setDirty, setHashSub, hashParts
} from "./ui-helpers.js";
import { setupStagePanZoom, setupBoxDrag, setupColumnResize, setupClosetDragScroll } from "./wardrobe-gestures.js";

// 主畫面契約（characterScaleContract）。所有框以此 512x768 畫布座標表示（#176）。
const CANVAS = { W: 512, H: 768 };

// issue #297：寫回成功不整頁重載——工具持有 manifest 衣物之「本地可變工作模型」，
// metadata／新增／刪除／重生成功後原地更新此模型並重繪，不再 window.location.reload()。
const items = shopItems.map(cloneItem);
const itemMap = new Map(items.map((item) => [item.id, item]));
// 素材包（content pack）清單與篩選集（預設全選；模組層級，避免 state 初始化前的 TDZ）。
let allPacks = [...new Set(items.map(packOfItem).filter(Boolean))].sort();
let selectedPacks = new Set(allPacks);
// 左欄單品搜尋字串（依名稱／id 即時過濾，與素材包多選＋衣櫃並用）。
let searchText = "";
// 第一層：類別投影框（= 該類 safeBox）。第二層：各單品 targetBox（覆寫→裁切原始框→safeBox）。
const workingSafeBox = Object.fromEntries(
  Object.entries(wardrobeLayerBoundsByType).map(([type, b]) => [type, b.safeBox ? { ...b.safeBox } : fullCanvas()])
);
// 未寫回前的基準（dirty 判定與「還原」對照）；apply 成功後重釘。
let originalSafeBox = deepCopyBoxes(workingSafeBox);
const workingItemBox = {}; // key `<pack>/<name>` → { left, top, right, bottom }（lazy seed）
const workingRotation = {}; // key → number degrees（lazy seed；未觸碰的 key 不在此 map）
const baseOutfit = Object.fromEntries(Object.keys(wardrobeLayerBoundsByType).map((type) => [type, "none"]));
const state = {
  selectedItemId: initialSelectedId(),
  editMode: "item", // "none"（不顯示框）／"type"（① 類型框/safeBox）／"item"（② 單品框/targetBox）
  zoom: 1,
  pan: { x: 0, y: 0 }, // 預覽舞台平移量（px，畫面座標）
  outfit: { ...baseOutfit }
};

const dom = {
  summaryLine: q("#summaryLine"), closets: q("#closets"), packButtons: q("#packButtons"),
  previewLabel: q("#previewLabel"), previewDoll: q("#previewDoll"), previewStage: q(".preview-stage"),
  typeOverlay: q("#typeOverlay"), itemOverlay: q("#itemOverlay"), selectedInfo: q("#selectedInfo"),
  modeTabs: q("#modeTabs"), modeHelp: q("#modeHelp"),
  applyAll: q("#applyAll"), applyStatus: q("#applyStatus"),
  addItemToggle: q("#addItemToggle"), addItemForm: q("#addItemForm"),
  addPack: q("#addPack"), addType: q("#addType"), addId: q("#addId"),
  addName: q("#addName"), addAsset: q("#addAsset"), addCost: q("#addCost"),
  addFile: q("#addFile"), addOverwrite: q("#addOverwrite"), addStatus: q("#addStatus"),
  itemSearch: q("#itemSearch"),
  rotationSlider: q("#rotationSlider"), rotationNumber: q("#rotationNumber"), rotationReset: q("#rotationReset"),
  boxL: q("#boxL"), boxT: q("#boxT"), boxR: q("#boxR"), boxB: q("#boxB"),
  restoreItem: q("#restoreItem"), restoreAll: q("#restoreAll"),
  panel: q("#panel-wardrobe")
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
renderPackButtons();
populateAddSelects();
equipSelectedItem();
renderAll();

function cloneItem(item) {
  return {
    ...item,
    layers: (item.layers || []).map((layer) => ({
      ...layer,
      bounds: layer.bounds
        ? { ...layer.bounds, targetBox: layer.bounds.targetBox ? { ...layer.bounds.targetBox } : layer.bounds.targetBox }
        : layer.bounds
    }))
  };
}

// 深連結（#wardrobe/<itemId>）優先，否則第一件可見單品。
function initialSelectedId() {
  const parts = hashParts();
  if (parts[0] === "wardrobe" && parts[1] && items.some((i) => i.id === parts[1])) return parts[1];
  return firstShownItem()?.id || "";
}

function bindEvents() {
  setupClosetDragScroll(dom.closets);
  dom.modeTabs.addEventListener("click", (e) => {
    const mode = e.target.closest("button")?.dataset.mode;
    if (mode) { state.editMode = mode; renderAll(); }
  });
  dom.itemSearch?.addEventListener("input", () => {
    searchText = dom.itemSearch.value.trim().toLowerCase();
    ensureValidSelection();
    renderAll();
  });
  dom.addItemToggle.addEventListener("click", () => { dom.addItemForm.hidden = !dom.addItemForm.hidden; });
  dom.addItemForm.addEventListener("submit", submitAddItem);
  dom.applyAll.addEventListener("click", applyToFiles);
  dom.rotationSlider?.addEventListener("input", () => { setRotation(selectedKey(), Number(dom.rotationSlider.value)); syncRotationNumber(); });
  dom.rotationNumber?.addEventListener("change", () => { const v = clampN(Number(dom.rotationNumber.value) || 0, -180, 180); setRotation(selectedKey(), v); syncRotationSlider(); });
  dom.rotationReset?.addEventListener("click", () => { setRotation(selectedKey(), 0); syncRotationInputs(); });
  bindBoxInputs();
  dom.restoreItem?.addEventListener("click", restoreActive);
  dom.restoreAll?.addEventListener("click", restoreAll);
  document.addEventListener("keydown", onArrowNudge);
  setupDrag(dom.typeOverlay);
  setupDrag(dom.itemOverlay);
  setupColumnResize(
    document.querySelector("#panel-wardrobe .tool-shell"),
    document.querySelector("#panel-wardrobe .col-resizer:not(.col-resizer-right)"),
    document.querySelector("#panel-wardrobe .col-resizer-right")
  );
  window.addEventListener("resize", () => paperDollRenderer.applyLayerTransforms(dom.previewDoll));
  // 切回衣物分頁時（panel 由 hidden→顯示）重算 layer transforms，避免隱藏期間量到 0 尺寸。
  window.addEventListener("editor-tab-change", (e) => {
    if (e.detail?.tab === "wardrobe") {
      paperDollRenderer.applyLayerTransforms(dom.previewDoll);
      setHashSub("wardrobe", state.selectedItemId);
    }
  });
  // 中央試穿畫面：滾輪／單指平移／雙指縮放（接線見 wardrobe-gestures.js；#297 D20）。
  setupStagePanZoom(dom.previewStage, state, applyStageTransform);
}

function applyStageTransform() {
  dom.previewStage.style.transform = `translate(${Math.round(state.pan.x)}px, ${Math.round(state.pan.y)}px) scale(${Math.round(state.zoom * 1000) / 1000})`;
}

function renderAll() {
  renderSummary();
  renderClosets();
  renderModeTabs();
  renderSelectedInfo();
  renderPreview();
  syncRotationInputs();
  syncBoxInputs();
}

function renderModeTabs() {
  [...dom.modeTabs.querySelectorAll("button")].forEach((b) => b.classList.toggle("active", b.dataset.mode === state.editMode));
  dom.modeHelp.textContent = state.editMode === "type"
    ? "編輯此類投影範圍（藍框＝safeBox），套用同類；單品框須落在其內。"
    : state.editMode === "item"
      ? "編輯這一件投影框（綠框）：邊中點縮放、中央移動；四角各自拖拉自由變形（任意四邊形）。"
      : "已隱藏所有框，方便檢視衣物本身；選①或②回到編輯。";
}

function renderSummary() {
  dom.summaryLine.textContent = `${itemsShown().length}/${items.length} items · 素材包多選＋衣櫃依類型（可水平拖動）· 拖綠框（角＝自由變形）· 滾輪／雙指縮放 · canvas ${CANVAS.W}×${CANVAS.H}`;
}

// 類型衣櫃：每個 UI category 一個衣櫃，依 selectedPacks 過濾後水平並列（空衣櫃略過）。
function renderClosets() {
  dom.closets.innerHTML = "";
  const shown = itemsShown();
  categories.forEach((category) => {
    const catItems = shown.filter((item) => catOfItem(item) === category.id);
    if (!catItems.length) return;
    const closet = document.createElement("section");
    closet.className = "closet";
    const head = document.createElement("div");
    head.className = "closet-head";
    head.innerHTML = `<strong>${escapeHtml(category.label)}</strong><em>${catItems.length}</em>`;
    const body = document.createElement("div");
    body.className = "closet-items";
    catItems.forEach((item) => body.append(buildItemRow(item)));
    closet.append(head, body);
    dom.closets.append(closet);
  });
  if (!dom.closets.children.length) {
    dom.closets.innerHTML = `<div class="closet-empty">沒有符合篩選的單品<br>（試著多選幾個素材包）。</div>`;
  }
}

function buildItemRow(item) {
  const row = document.createElement("div");
  row.className = `item-row${item.id === state.selectedItemId ? " active" : ""}`;
  row.innerHTML = `
    <button type="button" class="item-main">
      <img src="${assetUrl(item.image)}" alt="">
      <span class="item-name"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.type)} / ${escapeHtml(item.id)}</span></span>
      <span class="item-price">${priceText(item)}</span>
    </button>
    <button type="button" class="item-act" data-act="meta" data-tip="編輯 metadata（名稱／價錢／描述詞）" aria-label="編輯 metadata">📝</button>
    <button type="button" class="item-act" data-act="regen" data-tip="以目前描述詞重生此單品" aria-label="重生此單品">♻</button>
    <button type="button" class="item-act" data-act="open" data-tip="開啟素材資料夾" aria-label="開啟素材資料夾">📁</button>
    <button type="button" class="item-act item-act-danger" data-act="del" data-tip="刪除此單品" aria-label="刪除此單品">🗑</button>`;
  row.querySelector(".item-main").addEventListener("click", () => {
    state.selectedItemId = item.id;
    setHashSub("wardrobe", item.id);
    equipSelectedItem();
    renderAll();
  });
  row.querySelector('[data-act="meta"]').addEventListener("click", () => editItemMeta(item));
  row.querySelector('[data-act="regen"]').addEventListener("click", () => regenItem(item));
  row.querySelector('[data-act="open"]').addEventListener("click", () => openItemFolder(item));
  row.querySelector('[data-act="del"]').addEventListener("click", () => deleteItem(item));
  return row;
}

function assetOfItem(item) { const m = /assets\/(?:layers|thumbs)\/([^/]+)\.webp/.exec(item?.image || item?.layers?.[0]?.src || ""); return m ? m[1] : ""; }

async function openItemFolder(item) {
  try {
    const d = await postJson("/tool/open-folder", { pack: packOfItem(item) });
    if (!d.ok) snack(`開啟資料夾失敗：${d.error}`, "err");
  } catch (e) { snack(`開啟資料夾失敗：${e.message}`, "err"); }
}

// issue #297：刪除改 MD3 危險確認（error 色）；成功後原地移除本地模型並重繪，不整頁重載。
async function deleteItem(item) {
  const ok = await uiConfirm({
    title: `刪除「${item.name}」？`,
    bodyHtml: `<p>會移除該件 sidecar＋layer webp＋其覆寫，<strong>無法復原</strong>（可用 git 找回）。</p>`,
    confirmText: "刪除",
    danger: true
  });
  if (!ok) return;
  try {
    const d = await postJson("/tool/delete-item", { pack: packOfItem(item), asset: assetOfItem(item), itemId: item.id });
    if (!d.ok) { snack(`刪除失敗：${d.error}`, "err"); return; }
    const key = keyFromSrc(item.layers?.[0]?.src);
    if (key) { delete workingItemBox[key]; delete workingRotation[key]; }
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) items.splice(idx, 1);
    itemMap.delete(item.id);
    refreshPacks();
    ensureValidSelection();
    recomputeDirty();
    renderPackButtons();
    renderAll();
    snack(`已刪除「${item.name}」。`, "ok");
  } catch (e) { snack(`刪除失敗：${e.message}`, "err"); }
}

// issue #218／#297：metadata 編輯改共用表單對話框；儲存成功後原地更新本地模型（名稱／價錢），
// 不再整頁重載——選取、捲動、篩選與其他分頁未儲存工作全數保留。
async function editItemMeta(item) {
  let meta = { name: item.name || "", cost: Number.isFinite(item.cost) ? item.cost : 0, desc: "" };
  try {
    const cur = await postJson("/tool/get-item-meta", { pack: packOfItem(item), asset: assetOfItem(item), itemId: item.id });
    if (cur.ok) meta = { name: cur.name ?? meta.name, cost: cur.cost ?? meta.cost, desc: cur.desc ?? "" };
  } catch { /* 讀取失敗：用本地既有 name/cost、描述詞留空 */ }
  const next = await uiFormDialog({
    title: "編輯 metadata",
    noteHtml: `<p class="control-help"><code>${escapeHtml(packOfItem(item))}/${escapeHtml(assetOfItem(item))}</code> · id <code>${escapeHtml(item.id)}</code>；名稱／價錢寫回 sidecar，描述詞供 ♻ 重生使用。</p>`,
    fields: [
      { key: "name", label: "名稱", value: meta.name, required: true },
      { key: "cost", label: "價錢 (coins)", type: "number", min: 0, value: meta.cost },
      { key: "desc", label: "描述詞 (itemDesc)", type: "textarea", rows: 4, value: meta.desc }
    ]
  });
  if (!next) return;
  try {
    const d = await postJson("/tool/save-item-meta", {
      pack: packOfItem(item), asset: assetOfItem(item), itemId: item.id,
      name: next.name, cost: next.cost, desc: next.desc
    });
    if (!d.ok) { snack(`儲存失敗：${d.error}`, "err"); return; }
    item.name = next.name;
    item.cost = next.cost;
    renderAll();
    snack(`已儲存「${next.name}」metadata。`, "ok");
  } catch (e) { snack(`儲存 metadata 失敗：${e.message}`, "err"); }
}

// issue #196／#297：重生成功後 cache-bust 該件素材原地重繪，不整頁重載。
async function regenItem(item) {
  const ok = await uiConfirm({
    title: `重生「${item.name}」？`,
    bodyHtml: `<p>以目前描述詞呼叫影像模型生成 512×512 並覆蓋素材（約 30–60 秒）。</p>`,
    confirmText: "重生"
  });
  if (!ok) return;
  status(dom.applyStatus, "重生中（約 30–60 秒）…", "");
  try {
    const d = await postJson("/tool/regenerate-wardrobe", { pack: packOfItem(item), asset: assetOfItem(item) });
    if (!d.ok) { snack(`重生失敗：${d.error}`, "err"); return; }
    bustItemImage(item);
    renderAll();
    snack(`已重生「${item.name}」並更新預覽。`, "ok");
  } catch (e) { snack(`重生失敗：${e.message}`, "err"); }
}

function bustItemImage(item) {
  const bust = (src) => src ? `${src.split("?")[0]}?t=${Date.now()}` : src;
  item.image = bust(item.image);
  (item.layers || []).forEach((layer) => { layer.src = bust(layer.src); });
}

function populateAddSelects() {
  dom.addPack.innerHTML = allPacks.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
  dom.addType.innerHTML = Object.keys(wardrobeLayerBoundsByType).map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
}

// issue #297：新增成功後以回傳 contentBox 原地建構本地模型項並選取，不整頁重載。
async function submitAddItem(e) {
  e.preventDefault();
  const body = {
    pack: dom.addPack.value, type: dom.addType.value, id: dom.addId.value.trim(),
    name: dom.addName.value.trim(), asset: dom.addAsset.value.trim(), cost: Number(dom.addCost.value) || 0
  };
  const file = dom.addFile.files?.[0];
  status(dom.addStatus, file ? "上傳轉檔中…" : "新增中…", "");
  try {
    let d;
    if (file) {
      const imageData = await readFileAsDataUrl(file);
      d = await postJson("/tool/upload-item", { ...body, imageData, overwrite: dom.addOverwrite.checked });
    } else {
      d = await postJson("/tool/add-item", body);
    }
    if (!d.ok) { status(dom.addStatus, `失敗：${d.error}`, "err"); return; }
    const newItem = cloneItem(buildWardrobeItem({
      pack: body.pack, id: body.id, storeId: body.pack, type: body.type,
      name: body.name, cost: body.cost, icon: body.type, asset: body.asset,
      targetBox: d.contentBox || null
    }));
    bustItemImage(newItem); // 素材剛落地，避免舊快取
    itemMap.set(newItem.id, newItem);
    items.push(newItem);
    refreshPacks();
    state.selectedItemId = newItem.id;
    setHashSub("wardrobe", newItem.id);
    equipSelectedItem();
    renderPackButtons();
    renderAll();
    dom.addItemForm.reset();
    dom.addItemForm.hidden = true;
    status(dom.addStatus, "", "");
    snack(`已新增「${newItem.name}」。`, "ok");
  } catch (e2) { status(dom.addStatus, `失敗：${e2.message}`, "err"); }
}

function refreshPacks() {
  const known = new Set(allPacks);
  allPacks = [...new Set(items.map(packOfItem).filter(Boolean))].sort();
  selectedPacks = new Set([...selectedPacks].filter((p) => allPacks.includes(p)));
  // 新出現的 pack 預設納入篩選，避免剛新增的單品被藏起來。
  for (const p of allPacks) if (!known.has(p)) selectedPacks.add(p);
  populateAddSelects();
}

// 素材包水平多選按鈕：點按切換包含/排除（.active＝包含）；首顆「全部」一鍵全選/全不選。
function renderPackButtons() {
  dom.packButtons.innerHTML = "";
  const allOn = selectedPacks.size === allPacks.length;
  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = `pack-btn pack-btn-all${allOn ? " active" : ""}`;
  allBtn.textContent = "全部";
  allBtn.addEventListener("click", () => { selectedPacks = new Set(allOn ? [] : allPacks); afterPackChange(); });
  dom.packButtons.append(allBtn);
  allPacks.forEach((pack) => {
    const count = items.filter((i) => packOfItem(i) === pack).length;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `pack-btn${selectedPacks.has(pack) ? " active" : ""}`;
    btn.innerHTML = `${escapeHtml(pack)}<em>${count}</em>`;
    btn.addEventListener("click", () => {
      if (selectedPacks.has(pack)) selectedPacks.delete(pack); else selectedPacks.add(pack);
      afterPackChange();
    });
    dom.packButtons.append(btn);
  });
}

function afterPackChange() {
  ensureValidSelection();
  renderPackButtons();
  renderAll();
}

function ensureValidSelection() {
  const shown = itemsShown();
  if (!shown.some((i) => i.id === state.selectedItemId)) {
    state.selectedItemId = (shown.find((i) => i.storeId !== "starter") || shown[0])?.id || "";
    setHashSub("wardrobe", state.selectedItemId);
  }
  equipSelectedItem();
}

function renderSelectedInfo() {
  const item = selectedItem();
  const key = selectedKey();
  const overridden = key && boxDirty(key);
  const rotOverridden = key && rotDirty(key);
  const tags = [overridden && "框已改", rotOverridden && `旋轉 ${workingRotation[key]}°`].filter(Boolean).join(" · ");
  dom.selectedInfo.innerHTML = item
    ? `<strong>${escapeHtml(item.name)}</strong><span>type <code>${escapeHtml(selectedType() || "—")}</code> · ${key ? `<code>${escapeHtml(key)}</code>` : "（無單一 layer）"}${tags ? ` · <em>${tags}（未套用）</em>` : ""}</span>`
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
  // 一次只顯示與目前 editMode 對應的框；none 兩框皆隱藏（#218）。
  setOverlay(dom.typeOverlay, state.editMode === "type" && type ? workingSafeBox[type] : null, type ? `① ${type}` : "", state.editMode === "type");
  setOverlay(dom.itemOverlay, state.editMode === "item" && key ? itemBoxFor(key) : null, key ? `② ${escapeHtml(item?.name || "item")}` : "", state.editMode === "item");
}

function setOverlay(el, box, label, active) {
  el.classList.toggle("active", !!active && !!box);
  if (!box) { el.style.display = "none"; return; }
  const pct = insetPct(box);
  el.style.display = "block";
  el.style.inset = `${pct.top}% ${pct.right}% ${pct.bottom}% ${pct.left}%`;
  el.dataset.label = label || "";
  // 四角形變：把四角控制點移到實際角位（綠框＝單品框可各自自由變形；無形變時即回到矩形四角）。
  const w = (box.right - box.left) || 1;
  const h = (box.bottom - box.top) || 1;
  const o = cornerOffsets(box);
  positionCorner(el, "nw", `${(o.nw[0] / w) * 100}%`, `${(o.nw[1] / h) * 100}%`);
  positionCorner(el, "ne", `${100 + (o.ne[0] / w) * 100}%`, `${(o.ne[1] / h) * 100}%`);
  positionCorner(el, "sw", `${(o.sw[0] / w) * 100}%`, `${100 + (o.sw[1] / h) * 100}%`);
  positionCorner(el, "se", `${100 + (o.se[0] / w) * 100}%`, `${100 + (o.se[1] / h) * 100}%`);
}
function positionCorner(el, cls, left, top) {
  const h = el.querySelector(`.drag-handle.${cls}`);
  if (!h) return;
  h.style.left = left; h.style.top = top; h.style.right = "auto"; h.style.bottom = "auto"; h.style.transform = "translate(-50%, -50%)";
}

// ===== active box（依 editMode 指向類型框或單品框） =====
function activeBox() {
  if (state.editMode === "type") { const t = selectedType(); return t ? workingSafeBox[t] : null; }
  if (state.editMode === "item") { const k = selectedKey(); return k ? itemBoxFor(k) : null; }
  return null;
}
function commitActiveBox(box) {
  const b = { left: Math.round(box.left), top: Math.round(box.top), right: Math.round(box.right), bottom: Math.round(box.bottom) };
  if (state.editMode === "type") { const t = selectedType(); if (t) workingSafeBox[t] = b; recomputeDirty(); return; }
  if (hasWarp(box)) {
    const o = cornerOffsets(box);
    b.corners = { nw: roundPair(o.nw), ne: roundPair(o.ne), sw: roundPair(o.sw), se: roundPair(o.se) };
  }
  const k = selectedKey(); if (k) workingItemBox[k] = b;
  recomputeDirty();
}
function roundPair(p) { return [Math.round(p[0]), Math.round(p[1])]; }
function afterBoxChange() { renderPreview(); renderSelectedInfo(); syncBoxInputs(); }

// ② 圖上拖拉：接線見 wardrobe-gestures.js setupBoxDrag（移動／縮放／四角形變，行為同前）。
function setupDrag(overlay) {
  setupBoxDrag(overlay, {
    doll: dom.previewDoll,
    canvas: CANVAS,
    getBox: activeBox,
    isItemMode: () => state.editMode === "item",
    commit: (b) => { commitActiveBox(b); afterBoxChange(); }
  });
}

// ===== 框數值輸入與鍵盤微調（#297 C13／C14）=====
function bindBoxInputs() {
  const inputs = [dom.boxL, dom.boxT, dom.boxR, dom.boxB];
  if (inputs.some((el) => !el)) return;
  const onChange = () => {
    const box = activeBox();
    if (!box) return;
    let left = Math.round(Number(dom.boxL.value));
    let top = Math.round(Number(dom.boxT.value));
    let right = Math.round(Number(dom.boxR.value));
    let bottom = Math.round(Number(dom.boxB.value));
    if (![left, top, right, bottom].every(Number.isFinite)) { syncBoxInputs(); return; }
    left = clampN(left, 0, CANVAS.W - 4);
    top = clampN(top, 0, CANVAS.H - 4);
    right = clampN(right, left + 4, CANVAS.W);
    bottom = clampN(bottom, top + 4, CANVAS.H);
    commitActiveBox({ ...box, left, top, right, bottom });
    afterBoxChange();
  };
  inputs.forEach((el) => el.addEventListener("change", onChange));
}

function syncBoxInputs() {
  const inputs = [dom.boxL, dom.boxT, dom.boxR, dom.boxB];
  if (inputs.some((el) => !el)) return;
  const box = activeBox();
  inputs.forEach((el) => { el.disabled = !box; });
  if (dom.restoreItem) dom.restoreItem.disabled = !box;
  if (!box) { inputs.forEach((el) => { el.value = ""; }); return; }
  dom.boxL.value = Math.round(box.left);
  dom.boxT.value = Math.round(box.top);
  dom.boxR.value = Math.round(box.right);
  dom.boxB.value = Math.round(box.bottom);
}

// 方向鍵微調：1px、Shift＝10px 平移目前所選框；輸入框聚焦時不攔截。
function onArrowNudge(e) {
  if (dom.panel?.hidden) return;
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
  const box = activeBox();
  if (!box) return;
  e.preventDefault();
  const step = e.shiftKey ? 10 : 1;
  const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
  const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
  const w = box.right - box.left; const h = box.bottom - box.top;
  const left = clampN(box.left + dx, 0, CANVAS.W - w);
  const top = clampN(box.top + dy, 0, CANVAS.H - h);
  commitActiveBox({ ...box, left, top, right: left + w, bottom: top + h });
  afterBoxChange();
}

// ===== 還原（#297 C15）=====
function restoreActive() {
  if (state.editMode === "none") return;
  if (state.editMode === "type") {
    const t = selectedType();
    if (t) workingSafeBox[t] = { ...originalSafeBox[t] };
  } else {
    // 「還原此框」只還原框位置／變形；旋轉屬另一控制項（旋轉區「歸零」），保留未存旋轉不誤刪。
    const k = selectedKey();
    if (k) delete workingItemBox[k];
  }
  recomputeDirty();
  renderAll();
  snack("已還原目前選取的框（旋轉不變）。", "ok");
}

async function restoreAll() {
  const p = pendingChanges();
  const total = p.boxes.length + p.rots.length + p.safe.length;
  if (!total) { snack("目前沒有未套用的調整。", "info"); return; }
  const ok = await uiConfirm({
    title: "還原全部未套用的調整？",
    bodyHtml: `<p>將丟棄 ${p.boxes.length} 件單品框、${p.rots.length} 件旋轉、${p.safe.length} 個類型框的未套用調整。</p>`,
    confirmText: "全部還原",
    danger: true
  });
  if (!ok) return;
  for (const k of Object.keys(workingItemBox)) delete workingItemBox[k];
  for (const k of Object.keys(workingRotation)) delete workingRotation[k];
  Object.assign(workingSafeBox, deepCopyBoxes(originalSafeBox));
  recomputeDirty();
  renderAll();
  snack("已還原全部未套用調整。", "ok");
}

// ===== selection / model =====
function equipSelectedItem() { state.outfit = { ...baseOutfit }; equipItem(selectedItem(), state.outfit); }
function equipItem(item, outfit) {
  if (!item) return;
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
      const rotation = key in workingRotation ? workingRotation[key] : (layer.rotation ?? 0);
      return { ...layer, rotation, bounds: { ...(wardrobeLayerBoundsByType[type] || {}), targetBox: key ? itemBoxFor(key) : null } };
    })
  };
}
function selectedItem() { return itemMap.get(state.selectedItemId) || null; }
function selectedType() { const it = selectedItem(); return it?.layers?.[0]?.type || it?.type || ""; }
function selectedKey() { const it = selectedItem(); const src = it?.layers?.[0]?.src; return src ? keyFromSrc(src) : ""; }
// issue #267：targetBox 來源改自記憶體中該件 layer.bounds.targetBox（由 sidecar 經衍生 index 帶入）；
// 與類別 safeBox 相同視為無 per-item 覆寫，改 seed 可編輯的 workingSafeBox。
function currentItemBox(key) {
  for (const item of items) for (const layer of item.layers || []) {
    if (keyFromSrc(layer.src) !== key) continue;
    const tb = layer.bounds?.targetBox || null;
    const safe = wardrobeLayerBoundsByType[layer.type || item.type]?.safeBox || null;
    return tb && !sameBox(tb, safe) ? tb : null;
  }
  return null;
}
function seedItemBox(key) { return currentItemBox(key) || workingSafeBox[typeOfKey(key)] || fullCanvas(); }
function itemBoxFor(key) { if (!(key in workingItemBox)) workingItemBox[key] = { ...seedItemBox(key) }; return workingItemBox[key]; }
function typeOfKey(key) {
  for (const item of items) for (const layer of item.layers || []) if (keyFromSrc(layer.src) === key) return layer.type || item.type;
  return "";
}

// ===== dirty 判定（#297 A5：與 seed 比對，lazy-seed 不誤報）=====
function boxDirty(key) { return key in workingItemBox && !sameBox(workingItemBox[key], seedItemBox(key)); }
function rotDirty(key) { return key in workingRotation && workingRotation[key] !== seedRotation(key); }
function pendingChanges() {
  return {
    boxes: Object.keys(workingItemBox).filter(boxDirty),
    rots: Object.keys(workingRotation).filter(rotDirty),
    safe: Object.keys(workingSafeBox).filter((t) => !sameBox(workingSafeBox[t], originalSafeBox[t]))
  };
}
function recomputeDirty() {
  const p = pendingChanges();
  setDirty("wardrobe", p.boxes.length + p.rots.length + p.safe.length > 0, "衣物框／旋轉調整");
  return p;
}

// ===== export snippets + apply =====
function buildRulesSnippet() {
  return `export const wardrobeLayerBoundsByType = Object.freeze({\n${Object.keys(wardrobeLayerBoundsByType).map((type) => {
    const orig = wardrobeLayerBoundsByType[type];
    const render = hasRenderOffset(orig) ? `, ${boxLiteral(renderBoundsOf(orig))}` : "";
    return `  ${type}: layerBounds(${boxLiteral(workingSafeBox[type])}${render})`;
  }).join(",\n")}\n});`;
}
function buildItemBoxes() {
  // issue #267：只送本次工具碰過的單品（workingItemBox），各寫回其 sidecar 的 targetBox；
  // 與類別 safeBox 相同視為還原 → 送 null 清除該 sidecar 之 targetBox（退回 safeBox）。未碰到者不送、其 sidecar 不動。
  // issue #270：觸碰過旋轉（workingRotation）的 key 亦納入，box 帶 rotation 欄位寫回 sidecar。
  const keys = new Set([...Object.keys(workingItemBox), ...Object.keys(workingRotation)]);
  const boxes = {};
  for (const key of keys) {
    const safe = workingSafeBox[typeOfKey(key)] || null;
    const hasBox = key in workingItemBox;
    const rotation = workingRotation[key] ?? seedRotation(key);
    if (hasBox && sameBox(workingItemBox[key], safe) && !rotation) {
      boxes[key] = null; // 位置還原且旋轉為 0 → 清除 sidecar 所有覆寫
    } else if (hasBox && sameBox(workingItemBox[key], safe)) {
      boxes[key] = rotation ? { rotation } : null; // 只剩旋轉
    } else if (hasBox) {
      boxes[key] = { ...workingItemBox[key], ...(rotation ? { rotation } : {}) };
    } else {
      boxes[key] = rotation ? { rotation } : null; // 只改過旋轉、未觸碰 box
    }
  }
  return boxes;
}

function seedRotation(key) {
  for (const item of items) for (const layer of item.layers || []) {
    if (keyFromSrc(layer.src) === key) return layer.rotation ?? 0;
  }
  return 0;
}
function rotationFor(key) { return key in workingRotation ? workingRotation[key] : seedRotation(key); }
function setRotation(key, deg) {
  if (!key) return;
  workingRotation[key] = Math.round(clampN(deg, -180, 180));
  recomputeDirty();
  renderPreview();
  renderSelectedInfo();
}
function syncRotationSlider() { if (dom.rotationSlider) dom.rotationSlider.value = String(rotationFor(selectedKey())); }
function syncRotationNumber() { if (dom.rotationNumber) dom.rotationNumber.value = String(rotationFor(selectedKey())); }
function syncRotationInputs() { syncRotationSlider(); syncRotationNumber(); }

// 套用寫回：先呈現待寫回變更清單（#297 C16），確認後 POST；成功後把寫回值
// 同步進本地模型並重釘 dirty 基準（保留畫面工作狀態、不整頁重載）。
async function applyToFiles() {
  const p = pendingChanges();
  const total = p.boxes.length + p.rots.length + p.safe.length;
  if (!total) { await uiAlert("沒有待寫回的變更", "<p>先在預覽圖上調整框或旋轉，再按套用。</p>"); return; }
  const listOf = (keys) => keys.slice(0, 8).map((k) => `<code>${escapeHtml(k)}</code>`).join("、") + (keys.length > 8 ? ` …共 ${keys.length} 件` : "");
  const ok = await uiConfirm({
    title: "套用到檔案？",
    bodyHtml: `
      <ul class="ui-change-list">
        ${p.boxes.length ? `<li>單品框 ${p.boxes.length} 件：${listOf(p.boxes)}</li>` : ""}
        ${p.rots.length ? `<li>旋轉 ${p.rots.length} 件：${listOf(p.rots)}</li>` : ""}
        ${p.safe.length ? `<li>類型框（rules.js）${p.safe.length} 類：${listOf(p.safe)}</li>` : `<li>rules.js 不變動</li>`}
      </ul>
      <p class="control-help">寫回各件 sidecar 與 <code>rules.js</code>；重新整理遊戲即可看到。</p>`,
    confirmText: "套用寫回"
  });
  if (!ok) return;
  dom.applyAll.disabled = true;
  status(dom.applyStatus, "套用中…", "");
  try {
    const boxes = buildItemBoxes();
    const res = await fetch("/tool/apply-wardrobe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules: buildRulesSnippet(), boxes })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
    persistLocal(boxes);
    status(dom.applyStatus, `已套用 → ${data.written.join("、")}。重新整理遊戲即可看到。`, "ok");
  } catch (error) {
    status(dom.applyStatus, `套用失敗：${error.message}（請確認 dev server 為 server.mjs）`, "err");
  } finally {
    dom.applyAll.disabled = false;
  }
}

// 寫回成功後同步本地模型：sidecar 現值＝剛送出的值；dirty 基準重釘、工作副本清空。
function persistLocal(boxes) {
  for (const [key, val] of Object.entries(boxes)) {
    for (const item of items) for (const layer of item.layers || []) {
      if (keyFromSrc(layer.src) !== key) continue;
      const type = layer.type || item.type;
      const safe = workingSafeBox[type] || null;
      if (!val) {
        layer.bounds = { ...(layer.bounds || {}), targetBox: safe ? { ...safe } : null };
        delete layer.rotation;
      } else {
        const { rotation, ...box } = val;
        layer.bounds = { ...(layer.bounds || {}), targetBox: Object.keys(box).length ? box : (safe ? { ...safe } : null) };
        if (rotation) layer.rotation = rotation; else delete layer.rotation;
      }
    }
  }
  // rules.js 已寫回 → 目前 workingSafeBox 即新基準；工作副本清空、dirty 歸零。
  originalSafeBox = deepCopyBoxes(workingSafeBox);
  for (const k of Object.keys(workingItemBox)) delete workingItemBox[k];
  for (const k of Object.keys(workingRotation)) delete workingRotation[k];
  recomputeDirty();
  renderAll();
}

// ===== helpers =====
function q(sel) { return document.querySelector(sel); }
function fullCanvas() { return { left: 0, top: 0, right: CANVAS.W, bottom: CANVAS.H }; }
function deepCopyBoxes(byType) { return Object.fromEntries(Object.entries(byType).map(([t, b]) => [t, { ...b }])); }
function keyFromSrc(src) { const m = /wardrobe\/([^/]+)\/assets\/layers\/([^/]+)\.webp/.exec(src || ""); return m ? `${m[1]}/${m[2]}` : ""; }
function clampN(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function insetPct(box) {
  return {
    top: r3((box.top / CANVAS.H) * 100), right: r3(((CANVAS.W - box.right) / CANVAS.W) * 100),
    bottom: r3(((CANVAS.H - box.bottom) / CANVAS.H) * 100), left: r3((box.left / CANVAS.W) * 100)
  };
}
function sameBox(a, b) {
  if (!a || !b) return false;
  if (a.left !== b.left || a.top !== b.top || a.right !== b.right || a.bottom !== b.bottom) return false;
  const oa = cornerOffsets(a); const ob = cornerOffsets(b);
  return ["nw", "ne", "sw", "se"].every((k) => oa[k][0] === ob[k][0] && oa[k][1] === ob[k][1]);
}
function boxLiteral(b) {
  let extra = "";
  if (hasWarp(b)) {
    const o = cornerOffsets(b);
    extra = `, corners: { nw: ${fmtPair(o.nw)}, ne: ${fmtPair(o.ne)}, sw: ${fmtPair(o.sw)}, se: ${fmtPair(o.se)} }`;
  }
  return `{ left: ${b.left}, top: ${b.top}, right: ${b.right}, bottom: ${b.bottom}${extra} }`;
}
function fmtPair(p) { return `[${Math.round(p[0])}, ${Math.round(p[1])}]`; }
function renderBoundsOf(b) { return { left: b.left || 0, top: b.top || 0, right: b.right || 0, bottom: b.bottom || 0 }; }
function hasRenderOffset(b) { return (b.left || 0) !== 0 || (b.top || 0) !== 0 || (b.right || 0) !== 0 || (b.bottom || 0) !== 0; }
function r3(v) { return Math.round(v * 1000) / 1000; }
function packOfItem(item) { const m = /wardrobe\/([^/]+)\/assets\//.exec(item?.image || ""); return m ? m[1] : ""; }
function catOfItem(item) { const c = categories.find((cat) => cat.types.includes(item.type)); return c ? c.id : ""; }
function itemsShown() {
  return items.filter((item) => selectedPacks.has(packOfItem(item)) && matchesSearch(item));
}
function matchesSearch(item) {
  if (!searchText) return true;
  return `${item.name} ${item.id}`.toLowerCase().includes(searchText);
}
function firstShownItem() { const shown = itemsShown(); return shown.find((item) => item.storeId !== "starter") || shown[0]; }
function assetUrl(src) { if (!src) return ""; return src.startsWith("content-package/") || src.startsWith("content-base/") ? `../${src}` : src; }
function priceText(item) { return Number.isFinite(item.cost) && item.cost > 0 ? `${item.cost} coins` : "Free"; }
function escapeHtml(value = "") { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
