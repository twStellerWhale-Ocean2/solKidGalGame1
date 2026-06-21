// 上方功能頁籤切換（衣物設定／地圖設定）。只切換 panel 顯示，並丟出
// editor-tab-change 事件讓各分頁模組在被啟用時重算尺寸（hidden→顯示後才量得到）。
const tabs = [...document.querySelectorAll(".app-tab")];
const panels = new Map([...document.querySelectorAll(".editor-panel")].map((p) => [p.dataset.panel, p]));

function activate(tab) {
  tabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  panels.forEach((panel, name) => { panel.hidden = name !== tab; });
  window.dispatchEvent(new CustomEvent("editor-tab-change", { detail: { tab } }));
}

tabs.forEach((b) => b.addEventListener("click", () => activate(b.dataset.tab)));
