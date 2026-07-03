// 管理網站版面導覽（issue #260 / spec#13；issue #297 / spec#22 導覽補強）。
// 左側 Navigation Drawer：Main Navigation＝content-package 資料包；Sub Navigation＝該包子頁（如地圖/場景）。
// 既有 .editor-panel[data-panel] 內容與各分頁模組不動；本檔只管導覽分組、切換、breadcrumb/title 與抽屜收合。
// 對被顯示的 panel 仍丟出 editor-tab-change（沿用各分頁模組於 hidden→顯示後重算尺寸）。
// 深連結為 #panel[/子狀態…]：本檔只管第一段（panel），子狀態由各分頁模組經 ui-helpers setHashSub 維護；
// 同 panel 內切換不清子狀態，跨 panel 切換時重設為 #panel。窄視口（≤980px）抽屜改 overlay 模式（#297 D19）。
import { hashParts } from "./ui-helpers.js";

const GROUPS = [
  { id: "princess", label: "👑 公主", panels: [{ panel: "defaults", label: "公主起始" }] },
  { id: "wardrobe", label: "👗 衣物", panels: [{ panel: "wardrobe", label: "衣物" }] },
  { id: "areas", label: "🗺 地圖與場景", panels: [{ panel: "map", label: "地圖" }, { panel: "scene", label: "場景" }] },
  { id: "voice", label: "🔊 聲音", panels: [{ panel: "voice", label: "聲音" }] }
];

const panels = new Map([...document.querySelectorAll(".editor-panel")].map((p) => [p.dataset.panel, p]));
const navEl = document.getElementById("appGroups");
const subNavEl = document.getElementById("appSubtabs");
const titleEl = document.getElementById("appTitle");
const crumbEl = document.getElementById("appBreadcrumb");
const menuBtn = document.getElementById("appMenuBtn");
const shell = document.getElementById("adminShell");

const panelGroup = new Map();
GROUPS.forEach((g) => g.panels.forEach((p) => panelGroup.set(p.panel, g)));

let current = null;

// 窄視口＝overlay 抽屜（開關 drawer-open＋scrim）；寬視口＝collapsed 收合。
const narrowMq = window.matchMedia("(max-width: 980px)");
const scrim = document.createElement("div");
scrim.className = "drawer-scrim";
scrim.addEventListener("click", closeDrawer);
shell.append(scrim);

function closeDrawer() { shell.classList.remove("drawer-open"); }

menuBtn?.addEventListener("click", () => {
  if (narrowMq.matches) shell.classList.toggle("drawer-open");
  else shell.classList.toggle("collapsed");
});
narrowMq.addEventListener?.("change", () => { closeDrawer(); });

// Main Navigation：各內容資料包（沿用既有 emoji 標籤，與遊戲一致）。
// 收合狀態只剩 icon，補 data-tip（CSS tooltip）＋ aria-label 供辨識（#297 A1）。
const groupBtns = new Map();
for (const g of GROUPS) {
  const firstAvail = g.panels.find((p) => panels.has(p.panel));
  if (!firstAvail) continue; // 無對應 panel 的資料包節點不顯示
  const b = document.createElement("button");
  b.type = "button";
  b.className = "nav-item";
  b.dataset.group = g.id;
  const sp = g.label.indexOf(" ");
  const txt = g.label.slice(sp + 1);
  b.innerHTML = `<span class="nav-ico">${g.label.slice(0, sp)}</span><span class="nav-txt">${txt}</span>`;
  b.dataset.tip = txt;
  b.setAttribute("aria-label", txt);
  b.addEventListener("click", () => selectPanel(firstAvail.panel));
  navEl.appendChild(b);
  groupBtns.set(g.id, b);
}

// Sub Navigation：僅當該資料包有多個 panel（如「地圖與場景」）。
function renderSubNav(group) {
  subNavEl.replaceChildren();
  const avail = group.panels.filter((p) => panels.has(p.panel));
  if (avail.length <= 1) { subNavEl.hidden = true; return; }
  subNavEl.hidden = false;
  for (const p of avail) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "nav-subitem";
    b.dataset.panel = p.panel;
    b.innerHTML = `<span class="nav-txt">${p.label}</span>`;
    b.classList.toggle("active", p.panel === current);
    b.addEventListener("click", () => selectPanel(p.panel));
    subNavEl.appendChild(b);
  }
  // 子導覽移到「作用中資料包」按鈕正下方；否則固定停在整份主導覽之後，
  // 會顯示在最後一個資料包（聲音）之下，看起來像聲音的子頁。
  groupBtns.get(group.id)?.after(subNavEl);
}

function selectPanel(name) {
  if (!panels.has(name)) return;
  current = name;
  const group = panelGroup.get(name);
  groupBtns.forEach((b, id) => b.classList.toggle("active", id === group.id));
  renderSubNav(group);
  panels.forEach((panel, n) => { panel.hidden = n !== name; });
  // Breadcrumb（管理工具 › 資料包，資料包段可點回該包首頁 #297 A2）＋ Page Title（葉節點）。
  const leaf = group.panels.find((p) => p.panel === name)?.label || name;
  if (crumbEl) {
    crumbEl.replaceChildren();
    crumbEl.append("管理工具 › ");
    const gBtn = document.createElement("button");
    gBtn.type = "button";
    gBtn.className = "crumb-link";
    gBtn.textContent = group.label.slice(group.label.indexOf(" ") + 1);
    gBtn.addEventListener("click", () => selectPanel(group.panels.find((p) => panels.has(p.panel)).panel));
    crumbEl.append(gBtn);
  }
  if (titleEl) titleEl.textContent = leaf;
  // 跨 panel 切換重設 hash；同 panel（含初載）保留其子狀態段。
  if (hashParts()[0] !== name) history.replaceState(null, "", "#" + name);
  if (narrowMq.matches) closeDrawer(); // overlay 模式選定後自動收合
  window.dispatchEvent(new CustomEvent("editor-tab-change", { detail: { tab: name } }));
}

// 初始：hash 第一段（panel 名）優先，否則第一個有頁的資料包；子狀態段由各分頁模組自行解讀。
const initial = hashParts()[0];
const firstPanel = GROUPS.flatMap((g) => g.panels).map((p) => p.panel).find((p) => panels.has(p));
selectPanel(panels.has(initial) ? initial : firstPanel);

// 手動改 hash／瀏覽器前進後退也切換 panel（#297 A3；同 panel 之子狀態改寫不觸發切換）。
window.addEventListener("hashchange", () => {
  const p = hashParts()[0];
  if (p && p !== current && panels.has(p)) selectPanel(p);
});
