// 依內容資料包的兩層導覽（issue #260 / spec#13）：頂層＝content-package 資料包，包內＝既有 panel。
// 既有 .editor-panel[data-panel] 內容與各分頁模組不動；本檔只改「導覽分組與切換」。
// 對被顯示的 panel 仍丟出 editor-tab-change（沿用各分頁模組於 hidden→顯示後重算尺寸）。
// 深連結沿用 panel 名（如 wardrobe-tuner.html#voice），舊連結相容；無對應 panel 的資料包節點（如未來才有頁的「遊戲規則」）不顯示。
const GROUPS = [
  { id: "princess", label: "👑 公主", panels: [{ panel: "defaults", label: "公主起始" }] },
  { id: "wardrobe", label: "👗 衣物", panels: [{ panel: "wardrobe", label: "衣物" }] },
  { id: "areas", label: "🗺 地圖與場景", panels: [{ panel: "map", label: "地圖" }, { panel: "scene", label: "場景" }] },
  { id: "voice", label: "🔊 聲音", panels: [{ panel: "voice", label: "聲音" }] }
];

const panels = new Map([...document.querySelectorAll(".editor-panel")].map((p) => [p.dataset.panel, p]));
const groupsEl = document.getElementById("appGroups");
const subtabsEl = document.getElementById("appSubtabs");

const panelGroup = new Map();
GROUPS.forEach((g) => g.panels.forEach((p) => panelGroup.set(p.panel, g)));

let current = null;

// 頂層資料包按鈕（沿用 .app-tab 既有樣式；視覺收斂於後續切片）。
const groupBtns = new Map();
for (const g of GROUPS) {
  const firstAvail = g.panels.find((p) => panels.has(p.panel));
  if (!firstAvail) continue; // 無對應 panel 的資料包節點不顯示
  const b = document.createElement("button");
  b.type = "button";
  b.className = "app-tab app-group";
  b.dataset.group = g.id;
  b.textContent = g.label;
  b.addEventListener("click", () => selectPanel(firstAvail.panel));
  groupsEl.appendChild(b);
  groupBtns.set(g.id, b);
}

// 包內子分頁（僅當該資料包有多個 panel，如「地圖與場景」）。
function renderSubtabs(group) {
  subtabsEl.replaceChildren();
  const avail = group.panels.filter((p) => panels.has(p.panel));
  if (avail.length <= 1) { subtabsEl.hidden = true; return; }
  subtabsEl.hidden = false;
  for (const p of avail) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "app-subtab";
    b.dataset.panel = p.panel;
    b.textContent = p.label;
    b.classList.toggle("active", p.panel === current);
    b.addEventListener("click", () => selectPanel(p.panel));
    subtabsEl.appendChild(b);
  }
}

function selectPanel(name) {
  if (!panels.has(name)) return;
  current = name;
  const group = panelGroup.get(name);
  groupBtns.forEach((b, id) => b.classList.toggle("active", id === group.id));
  renderSubtabs(group);
  panels.forEach((panel, n) => { panel.hidden = n !== name; });
  if (location.hash.slice(1) !== name) history.replaceState(null, "", "#" + name);
  window.dispatchEvent(new CustomEvent("editor-tab-change", { detail: { tab: name } }));
}

// 初始：hash（panel 名）優先，否則第一個有頁的資料包。
const initial = location.hash.slice(1);
const firstPanel = GROUPS.flatMap((g) => g.panels).map((p) => p.panel).find((p) => panels.has(p));
selectPanel(panels.has(initial) ? initial : firstPanel);
