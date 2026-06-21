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
import { cornerOffsets, hasWarp } from "../game-engine/render/warp.js";

// 主畫面契約（characterScaleContract）。所有框以此 512x768 畫布座標表示（#176）。
const CANVAS = { W: 512, H: 768 };

const itemMap = new Map(shopItems.map((item) => [item.id, item]));
// 素材包（content pack）清單與篩選集（預設全選；模組層級，避免 state 初始化前的 TDZ）。
const allPacks = [...new Set(shopItems.map(packOfItem).filter(Boolean))].sort();
let selectedPacks = new Set(allPacks);
// 左欄單品搜尋字串（依名稱／id 即時過濾，與素材包多選＋衣櫃並用）。
let searchText = "";
// 第一層：類別投影框（= 該類 safeBox）。第二層：各單品 targetBox（覆寫→裁切原始框→safeBox）。
const workingSafeBox = Object.fromEntries(
  Object.entries(wardrobeLayerBoundsByType).map(([type, b]) => [type, b.safeBox ? { ...b.safeBox } : fullCanvas()])
);
const workingItemBox = {}; // key `<pack>/<name>` → { left, top, right, bottom }（lazy seed）
const baseOutfit = Object.fromEntries(Object.keys(wardrobeLayerBoundsByType).map((type) => [type, "none"]));
const state = {
  selectedItemId: firstShownItem()?.id || "",
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
  itemSearch: q("#itemSearch")
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

function bindEvents() {
  setupClosetDragScroll();
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
  setupDrag(dom.typeOverlay);
  setupDrag(dom.itemOverlay);
  setupColumnResize();
  window.addEventListener("resize", () => paperDollRenderer.applyLayerTransforms(dom.previewDoll));
  // 切回衣物分頁時（panel 由 hidden→顯示）重算 layer transforms，避免隱藏期間量到 0 尺寸。
  window.addEventListener("editor-tab-change", (e) => {
    if (e.detail?.tab === "wardrobe") paperDollRenderer.applyLayerTransforms(dom.previewDoll);
  });
  // 中央試穿畫面：滑鼠滾輪縮放（以 stage transform；drag 用 getBoundingClientRect 故不受影響）。
  dom.previewStage?.addEventListener("wheel", (e) => {
    e.preventDefault();
    state.zoom = clampN(state.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), 0.4, 4);
    applyStageTransform();
  }, { passive: false });
  setupStagePan();
}

// 預覽舞台平移：在空白處（非框控制點）按住拖曳即平移；框的拖拉仍由 overlay 自行處理。
function setupStagePan() {
  if (!dom.previewStage) return;
  let active = null;
  dom.previewStage.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".box-overlay")) return; // 在框/控制點上 → 讓 overlay 處理，不平移
    active = { sx: e.clientX, sy: e.clientY, px: state.pan.x, py: state.pan.y };
    dom.previewStage.classList.add("panning");
    try { dom.previewStage.setPointerCapture(e.pointerId); } catch { /* noop */ }
  });
  dom.previewStage.addEventListener("pointermove", (e) => {
    if (!active) return;
    state.pan = { x: active.px + (e.clientX - active.sx), y: active.py + (e.clientY - active.sy) };
    applyStageTransform();
  });
  const end = () => { active = null; dom.previewStage.classList.remove("panning"); };
  dom.previewStage.addEventListener("pointerup", end);
  dom.previewStage.addEventListener("pointercancel", end);
}
function applyStageTransform() {
  dom.previewStage.style.transform = `translate(${Math.round(state.pan.x)}px, ${Math.round(state.pan.y)}px) scale(${Math.round(state.zoom * 1000) / 1000})`;
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
  renderClosets();
  renderModeTabs();
  renderSelectedInfo();
  renderPreview();
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
  dom.summaryLine.textContent = `${itemsShown().length}/${shopItems.length} items · 素材包多選＋衣櫃依類型（可水平拖動）· 拖綠框（角＝自由變形）· 滾輪縮放 · canvas ${CANVAS.W}×${CANVAS.H}`;
}

// 類型衣櫃：每個 UI category 一個衣櫃，依 selectedPacks 過濾後水平並列（空衣櫃略過）。
function renderClosets() {
  dom.closets.innerHTML = "";
  const shown = itemsShown();
  categories.forEach((category) => {
    const items = shown.filter((item) => catOfItem(item) === category.id);
    if (!items.length) return;
    const closet = document.createElement("section");
    closet.className = "closet";
    const head = document.createElement("div");
    head.className = "closet-head";
    head.innerHTML = `<strong>${escapeHtml(category.label)}</strong><em>${items.length}</em>`;
    const body = document.createElement("div");
    body.className = "closet-items";
    items.forEach((item) => body.append(buildItemRow(item)));
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
    <button type="button" class="item-act" data-act="meta" title="編輯 metadata（名稱／價錢／描述詞）">📝</button>
    <button type="button" class="item-act" data-act="regen" title="以目前描述詞重生此單品">♻</button>
    <button type="button" class="item-act" data-act="open" title="開啟素材資料夾">📁</button>
    <button type="button" class="item-act" data-act="del" title="刪除此單品">🗑</button>`;
  row.querySelector(".item-main").addEventListener("click", () => { state.selectedItemId = item.id; equipSelectedItem(); renderAll(); });
  row.querySelector('[data-act="meta"]').addEventListener("click", () => editItemMeta(item));
  row.querySelector('[data-act="regen"]').addEventListener("click", () => regenItem(item));
  row.querySelector('[data-act="open"]').addEventListener("click", () => openItemFolder(item));
  row.querySelector('[data-act="del"]').addEventListener("click", () => deleteItem(item));
  return row;
}

// 衣櫃列水平拖曳捲動：在空白或卡片上按住左右拖即可移動到其他衣櫃；越過門檻才算拖曳，
// 並在拖曳後抑制該次 click，避免誤觸選取單品。容器持久存在（只換 innerHTML），故只綁一次。
function setupClosetDragScroll() {
  const el = dom.closets;
  if (!el) return;
  let down = null;
  let moved = false;
  let suppressClick = false;
  el.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    down = { x: e.clientX, scroll: el.scrollLeft, id: e.pointerId };
    moved = false;
  });
  el.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    if (!moved && Math.abs(dx) > 6) {
      moved = true;
      el.classList.add("dragging");
      try { el.setPointerCapture(down.id); } catch { /* noop */ }
    }
    if (moved) { el.scrollLeft = down.scroll - dx; e.preventDefault(); }
  });
  const end = () => {
    if (!down) return;
    try { el.releasePointerCapture(down.id); } catch { /* noop */ }
    el.classList.remove("dragging");
    suppressClick = moved;
    down = null;
    moved = false;
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  el.addEventListener("click", (e) => {
    if (suppressClick) { e.stopPropagation(); e.preventDefault(); suppressClick = false; }
  }, true);
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

// issue #218：把舊「描述詞」按鈕改成可設定 metadata 的編輯器（名稱／價錢／描述詞）。
// 讀取失敗（缺 style.json／asset）不再中止，改以空值起始；儲存就地改 manifest 名稱／價錢與 style.json 描述詞。
async function editItemMeta(item) {
  let meta = { name: item.name || "", cost: Number.isFinite(item.cost) ? item.cost : 0, desc: "" };
  try {
    const cur = await postJson("/tool/get-item-meta", { pack: packOfItem(item), asset: assetOfItem(item), itemId: item.id });
    if (cur.ok) meta = { name: cur.name ?? meta.name, cost: cur.cost ?? meta.cost, desc: cur.desc ?? "" };
  } catch { /* 讀取失敗：用 manifest 既有 name/cost、描述詞留空 */ }
  const next = await openMetaDialog(item, meta);
  if (!next) return;
  try {
    const d = await postJson("/tool/save-item-meta", {
      pack: packOfItem(item), asset: assetOfItem(item), itemId: item.id,
      name: next.name, cost: next.cost, desc: next.desc
    });
    if (!d.ok) { window.alert(`儲存失敗：${d.error}`); return; }
    window.location.reload();
  } catch (e) { window.alert(`儲存 metadata 失敗：${e.message}`); }
}

// 輕量 metadata 對話框：回傳 { name, cost, desc } 或 null（取消）。
function openMetaDialog(item, meta) {
  return new Promise((resolve) => {
    const back = document.createElement("div");
    back.className = "meta-modal-back";
    back.innerHTML = `
      <div class="meta-modal" role="dialog" aria-modal="true">
        <h3>編輯 metadata</h3>
        <p class="control-help"><code>${escapeHtml(packOfItem(item))}/${escapeHtml(assetOfItem(item))}</code> · id <code>${escapeHtml(item.id)}</code></p>
        <label>名稱<input class="meta-name" type="text"></label>
        <label>價錢 (coins)<input class="meta-cost" type="number" min="0"></label>
        <label>描述詞 (itemDesc)<textarea class="meta-desc" rows="4"></textarea></label>
        <p class="control-help">名稱／價錢寫回該包 <code>manifest.js</code>；描述詞寫回 <code>style.json</code>（按 ♻ 重生套用）。儲存後會重新整理。</p>
        <div class="meta-actions">
          <button type="button" class="meta-cancel">取消</button>
          <button type="button" class="meta-save add-submit">儲存</button>
        </div>
      </div>`;
    document.body.append(back);
    const nameEl = back.querySelector(".meta-name");
    const costEl = back.querySelector(".meta-cost");
    const descEl = back.querySelector(".meta-desc");
    nameEl.value = meta.name; costEl.value = meta.cost; descEl.value = meta.desc;
    nameEl.focus();
    const close = (val) => { back.remove(); resolve(val); };
    back.querySelector(".meta-cancel").addEventListener("click", () => close(null));
    back.addEventListener("click", (e) => { if (e.target === back) close(null); });
    back.querySelector(".meta-save").addEventListener("click", () => {
      const name = nameEl.value.trim();
      if (!name) { window.alert("名稱不可為空"); return; }
      close({ name, cost: Number(costEl.value) || 0, desc: descEl.value.trim() });
    });
  });
}

// issue #196：以目前三層描述詞呼叫影像模型重生此單品並覆蓋素材（dev only）。
async function regenItem(item) {
  if (!window.confirm(`重生「${item.name}」？\n以目前描述詞呼叫影像模型生成 512×512 並覆蓋素材（約 30–60 秒）。`)) return;
  try {
    const d = await postJson("/tool/regenerate-wardrobe", { pack: packOfItem(item), asset: assetOfItem(item) });
    if (!d.ok) { window.alert(`重生失敗：${d.error}`); return; }
    window.location.reload();
  } catch (e) { window.alert(`重生失敗：${e.message}`); }
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
  const file = dom.addFile.files?.[0];
  setStatus(dom.addStatus, file ? "上傳轉檔中…" : "新增中…", "");
  try {
    let d;
    if (file) {
      const imageData = await readFileAsDataUrl(file);
      d = await postJson("/tool/upload-item", { ...body, imageData, overwrite: dom.addOverwrite.checked });
    } else {
      d = await postJson("/tool/add-item", body);
    }
    if (!d.ok) { setStatus(dom.addStatus, `失敗：${d.error}`, "err"); return; }
    setStatus(dom.addStatus, "已新增，重新整理…", "ok");
    window.setTimeout(() => window.location.reload(), 700);
  } catch (e2) { setStatus(dom.addStatus, `失敗：${e2.message}`, "err"); }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("讀取圖檔失敗")));
    reader.readAsDataURL(file);
  });
}

async function postJson(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}
function setStatus(el, text, kind) { el.textContent = text; el.className = `apply-status${kind ? ` apply-status-${kind}` : ""}`; }

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
    const count = shopItems.filter((i) => packOfItem(i) === pack).length;
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
  const k = selectedKey(); return k ? itemBoxFor(k) : null;
}
function commitActiveBox(box) {
  const b = { left: Math.round(box.left), top: Math.round(box.top), right: Math.round(box.right), bottom: Math.round(box.bottom) };
  if (state.editMode === "type") { const t = selectedType(); if (t) workingSafeBox[t] = b; return; }
  if (hasWarp(box)) {
    const o = cornerOffsets(box);
    b.corners = { nw: roundPair(o.nw), ne: roundPair(o.ne), sw: roundPair(o.sw), se: roundPair(o.se) };
  }
  const k = selectedKey(); if (k) workingItemBox[k] = b;
}
// 取得 box 正規化後的四角偏移副本（含舊 inset 一律轉成 corners），供拖拉與提交使用。
function cornersOf(box) {
  const o = cornerOffsets(box);
  return { nw: [...o.nw], ne: [...o.ne], sw: [...o.sw], se: [...o.se] };
}
function roundPair(p) { return [Math.round(p[0]), Math.round(p[1])]; }
function afterBoxChange() { renderPreview(); renderSelectedInfo(); }

// ② 圖上拖拉：中央移動、四邊中點非等比縮放；四角在單品框＝自由變形、在類型框＝角落縮放。
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
  if (handle === "move") {
    const w = start.right - start.left; const h = start.bottom - start.top;
    const left = clampN(start.left + (p.x - sx), 0, CANVAS.W - w); const top = clampN(start.top + (p.y - sy), 0, CANVAS.H - h);
    b = { ...start, left, top, right: left + w, bottom: top + h };
  } else if (corner && state.editMode === "item") {
    // 四角形變：角落控制點可各自往任意方向拖拉，成任意四邊形（不改 bounding box）。
    const c = cornersOf(start);
    const ox = handle.includes("e") ? p.x - start.right : p.x - start.left;
    const oy = handle.includes("s") ? p.y - start.bottom : p.y - start.top;
    c[handle] = [ox, oy];
    delete b.topInset; delete b.bottomInset;
    b.corners = c;
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
  return shopItems.filter((item) => selectedPacks.has(packOfItem(item)) && matchesSearch(item));
}
function matchesSearch(item) {
  if (!searchText) return true;
  return `${item.name} ${item.id}`.toLowerCase().includes(searchText);
}
function firstShownItem() { const items = itemsShown(); return items.find((item) => item.storeId !== "starter") || items[0]; }
function assetUrl(src) { if (!src) return ""; return src.startsWith("content-package/") || src.startsWith("content-base/") ? `../${src}` : src; }
function priceText(item) { return Number.isFinite(item.cost) && item.cost > 0 ? `${item.cost} coins` : "Free"; }
function escapeHtml(value = "") { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
