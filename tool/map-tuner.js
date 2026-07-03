// 地圖設定分頁（issue #218）：檢視各地圖、在大地圖上拖拉調整各場景節點位置、上傳更換地圖。
// 來源為 world.js（destinations）與各區 manifest（area.nodes）；座標／換圖儲存走 server.mjs dev 端點。
// issue #297：未儲存座標調整登記 dirty（離頁防護）；深連結 #map/<mapKey>/<nodeId> 回到原工作點。
import { status as sharedStatus, readFileAsDataUrl, setDirty, setHashSub, hashParts } from "./ui-helpers.js";
import { setupColumnResize } from "./wardrobe-gestures.js";
import { worldMap } from "../content-package/areas/world.js";
import { castleArea } from "../content-package/areas/castle/manifest.js";
import { urbanArea } from "../content-package/areas/urban/manifest.js";
import { ruralArea } from "../content-package/areas/rural/manifest.js";
import { wildArea } from "../content-package/areas/wild/manifest.js";

// 每張可編輯地圖的設定；items 為「可拖拉節點」的工作副本（x/y 為地圖寬高百分比）。
function areaConfig(area) {
  const iconByNode = new Map((area.locations || []).map((loc) => [loc.node, loc.icon]));
  return {
    key: area.id,
    label: area.label,
    file: `content-package/areas/${area.id}/manifest.js`,
    image: area.mapImage,
    imageSize: area.imageSize,
    items: Object.values(area.nodes || {}).map((n) => ({ id: n.id, label: n.label, icon: iconByNode.get(n.id) || "📍", x: n.x, y: n.y }))
  };
}
const maps = {
  world: {
    key: "world", label: "World Map", file: "content-package/areas/world.js",
    image: worldMap.mapImage, imageSize: worldMap.imageSize,
    items: worldMap.destinations.map((d) => ({ id: d.id, label: d.label, icon: d.icon || "📍", x: d.x, y: d.y }))
  },
  castle: areaConfig(castleArea),
  urban: areaConfig(urbanArea),
  rural: areaConfig(ruralArea),
  wild: areaConfig(wildArea)
};
const mapOrder = ["world", "castle", "urban", "rural", "wild"];

const state = { mapKey: "world", selectedId: "", rendered: false };
// 深連結：#map/<mapKey>/<nodeId>
{
  const parts = hashParts();
  if (parts[0] === "map" && maps[parts[1]]) {
    state.mapKey = parts[1];
    if (parts[2] && maps[parts[1]].items.some((it) => it.id === parts[2])) state.selectedId = parts[2];
  }
}

const dom = {
  subtabs: document.querySelector("#mapSubtabs"),
  title: document.querySelector("#mapTitle"),
  summary: document.querySelector("#mapSummary"),
  nodeList: document.querySelector("#mapNodeList"),
  stage: document.querySelector("#mapStage"),
  image: document.querySelector("#mapImage"),
  markers: document.querySelector("#mapMarkers"),
  selectedInfo: document.querySelector("#mapSelectedInfo"),
  x: document.querySelector("#mapX"), y: document.querySelector("#mapY"),
  uploadFile: document.querySelector("#mapUploadFile"), uploadStatus: document.querySelector("#mapUploadStatus"),
  save: document.querySelector("#mapSave"), saveStatus: document.querySelector("#mapSaveStatus")
};

renderSubtabs();
bindEvents();
// 地圖分頁初始為 hidden；待切到此分頁再首次 render，確保圖片量得到尺寸。
window.addEventListener("editor-tab-change", (e) => {
  if (e.detail?.tab !== "map") return;
  if (!state.rendered) { state.rendered = true; renderMap(); }
  setHashSub("map", state.mapKey, state.selectedId);
});

function currentMap() { return maps[state.mapKey]; }
function selectedItem() { return currentMap().items.find((it) => it.id === state.selectedId) || null; }

function renderSubtabs() {
  dom.subtabs.innerHTML = "";
  mapOrder.forEach((key) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `map-subtab${key === state.mapKey ? " active" : ""}`;
    b.textContent = maps[key].label;
    b.addEventListener("click", () => { state.mapKey = key; state.selectedId = ""; setHashSub("map", key); renderSubtabs(); renderMap(); });
    dom.subtabs.append(b);
  });
}

function bindEvents() {
  dom.x.addEventListener("input", () => updateSelectedXY(Number(dom.x.value), null));
  dom.y.addEventListener("input", () => updateSelectedXY(null, Number(dom.y.value)));
  dom.save.addEventListener("click", savePositions);
  dom.uploadFile.addEventListener("change", uploadMap);
  setupMarkerDrag();
  // 欄寬拖曳（#297 B11：與衣物分頁一致）
  setupColumnResize(
    document.querySelector("#panel-map .map-shell"),
    document.querySelector("#panel-map .col-resizer:not(.col-resizer-right)"),
    document.querySelector("#panel-map .col-resizer-right")
  );
}

function renderMap() {
  const map = currentMap();
  dom.title.textContent = `地圖設定 · ${map.label}`;
  dom.summary.textContent = `${map.items.length} 個節點 · 地圖 ${map.imageSize.width}×${map.imageSize.height}`;
  dom.image.src = assetUrl(map.image);
  dom.image.style.aspectRatio = `${map.imageSize.width} / ${map.imageSize.height}`;
  renderNodeList();
  renderMarkers();
  renderSelected();
}

function renderNodeList() {
  dom.nodeList.innerHTML = "";
  currentMap().items.forEach((it) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `map-node-row${it.id === state.selectedId ? " active" : ""}`;
    row.innerHTML = `<span class="map-node-icon">${escapeHtml(it.icon)}</span><span class="map-node-name"><strong>${escapeHtml(it.label)}</strong><span>${escapeHtml(it.id)} · ${fmt(it.x)}, ${fmt(it.y)}</span></span>`;
    row.addEventListener("click", () => { state.selectedId = it.id; setHashSub("map", state.mapKey, it.id); renderNodeList(); renderMarkers(); renderSelected(); });
    dom.nodeList.append(row);
  });
}

function renderMarkers() {
  dom.markers.innerHTML = "";
  currentMap().items.forEach((it) => {
    const m = document.createElement("div");
    m.className = `map-marker${it.id === state.selectedId ? " active" : ""}`;
    m.style.left = `${it.x}%`;
    m.style.top = `${it.y}%`;
    m.dataset.id = it.id;
    m.innerHTML = `<span class="map-marker-dot">${escapeHtml(it.icon)}</span><span class="map-marker-label">${escapeHtml(it.label)}</span>`;
    dom.markers.append(m);
  });
}

function renderSelected() {
  const it = selectedItem();
  dom.selectedInfo.innerHTML = it
    ? `<strong>${escapeHtml(it.label)}</strong><span>id <code>${escapeHtml(it.id)}</code></span>`
    : "（未選節點）";
  dom.x.value = it ? fmt(it.x) : "";
  dom.y.value = it ? fmt(it.y) : "";
  dom.x.disabled = dom.y.disabled = !it;
}

function updateSelectedXY(x, y) {
  const it = selectedItem();
  if (!it) return;
  if (x != null && Number.isFinite(x)) it.x = clampPct(x);
  if (y != null && Number.isFinite(y)) it.y = clampPct(y);
  setDirty("map", true, "地圖座標調整");
  renderMarkers();
  renderNodeList();
}

// 在地圖上直接拖拉標記：以圖片 bounding rect 換算百分比。
function setupMarkerDrag() {
  let active = null;
  dom.markers.addEventListener("pointerdown", (e) => {
    const marker = e.target.closest(".map-marker");
    if (!marker) return;
    e.preventDefault();
    state.selectedId = marker.dataset.id;
    active = marker;
    try { dom.markers.setPointerCapture(e.pointerId); } catch { /* noop */ }
    renderNodeList(); renderMarkers(); renderSelected();
  });
  dom.markers.addEventListener("pointermove", (e) => {
    if (!active) return;
    const rect = dom.image.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    updateSelectedXY(
      clampPct(((e.clientX - rect.left) / rect.width) * 100),
      clampPct(((e.clientY - rect.top) / rect.height) * 100)
    );
    renderSelected();
  });
  const end = () => { active = null; };
  dom.markers.addEventListener("pointerup", end);
  dom.markers.addEventListener("pointercancel", end);
}

async function savePositions() {
  const map = currentMap();
  dom.save.disabled = true;
  setStatus(dom.saveStatus, "儲存中…", "");
  try {
    const positions = map.items.map((it) => ({ id: it.id, x: fmt(it.x), y: fmt(it.y) }));
    const d = await postJson("/tool/save-map-positions", { file: map.file, positions });
    if (!d.ok) throw new Error(d.error);
    setDirty("map", false);
    setStatus(dom.saveStatus, `已儲存 ${d.updated} 個座標 → ${map.file}。重新整理遊戲即可看到。`, "ok");
  } catch (e) {
    setStatus(dom.saveStatus, `儲存失敗：${e.message}（請確認 dev server 為 node server.mjs）`, "err");
  } finally {
    dom.save.disabled = false;
  }
}

async function uploadMap(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const map = currentMap();
  setStatus(dom.uploadStatus, "上傳轉檔中…", "");
  try {
    const imageData = await readFileAsDataUrl(file);
    const d = await postJson("/tool/upload-map", { target: map.key, imageData });
    if (!d.ok) throw new Error(d.error);
    setStatus(dom.uploadStatus, `已換圖並調整到 ${map.imageSize.width}×${map.imageSize.height}。`, "ok");
    dom.image.src = `${assetUrl(map.image).split("?")[0]}?t=${Date.now()}`; // cache-bust 重新載入
  } catch (err) {
    setStatus(dom.uploadStatus, `換圖失敗：${err.message}`, "err");
  } finally {
    dom.uploadFile.value = "";
  }
}

// ===== helpers =====
function assetUrl(src) { if (!src) return ""; return src.startsWith("content-package/") || src.startsWith("content-base/") ? `../${src}` : src; }
function clampPct(v) { return Math.max(0, Math.min(100, v)); }
function fmt(v) { return Math.round(v * 10) / 10; }
function escapeHtml(value = "") { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
const setStatus = sharedStatus; // 統一回饋出口（行內＋snackbar；#297 B9）
async function postJson(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}
