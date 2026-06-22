// 「👑 公主預設」分頁：編輯新遊戲公主的起始 coins／owned／outfit，即時預覽紙娃娃，
// 按「套用」由 dev server 寫回 game-engine/state/default-state.js（白名單 /tool/save-defaults）。
// 規則對齊遊戲 normalizeOutfit：洋裝與上衣/下身互斥；裝備中的單品自動視為已擁有。
import {
  categories,
  outfitSlots,
  paperDollBaseLayer,
  paperDollLayerOrder,
  playableCharacterById,
  defaultActiveCharacterId,
  shopItems
} from "../content-package/wardrobe/manifest.js";
import { defaultState } from "../game-engine/state/default-state.js";
import { createPaperDollRenderer } from "../game-engine/render/paper-doll.js";

const panel = document.getElementById("panel-defaults");
if (panel) initDefaultsTab();

function initDefaultsTab() {
  const itemMap = new Map(shopItems.map((item) => [item.id, item]));
  // 有實際 overlay layer 的單品才放進 outfit 下拉（starter 單品 layers 為空、穿了等於沒穿，排除以免誤會）。
  const wearableItems = shopItems.filter((item) => Array.isArray(item.layers) && item.layers.length > 0);
  // outfit slot 顯示順序＝類別顯示順序攤平（hair→outfit→shoes→accessories 各 slot；#251 移除 tops/bottoms、dress→outfit）。
  const slotOrder = categories.flatMap((cat) => cat.types).filter((slot) => outfitSlots.includes(slot));
  const slotLabel = {
    hairstyle: "髮型 Hair", outfit: "整件 Outfit",
    shoes: "鞋 Shoes", headTop: "帽飾 Hats", headSide: "頭側 Ribbon",
    faceEyes: "眼鏡 Glasses", faceMask: "面飾 Mask", neck: "頸飾 Necklace", hand: "手持 Bag"
  };

  const emptyOutfit = () => Object.fromEntries(outfitSlots.map((slot) => [slot, "none"]));
  const state = {
    coins: Number.isFinite(defaultState.coins) ? defaultState.coins : 0,
    outfit: { ...emptyOutfit(), ...pickOutfit(defaultState.outfit) },
    owned: new Set((defaultState.owned || []).filter((id) => itemMap.has(id)))
  };

  const dom = {
    coins: q("#defaultsCoins"), outfit: q("#defaultsOutfit"), owned: q("#defaultsOwned"),
    ownAll: q("#defaultsOwnAll"), ownNone: q("#defaultsOwnNone"),
    doll: q("#defaultsDoll"), apply: q("#defaultsApply"), status: q("#defaultsStatus"),
    info: q("#defaultsInfo"), label: q("#defaultsPreviewLabel")
  };

  const renderer = createPaperDollRenderer({
    baseLayer: paperDollBaseLayer,
    getCharacter: () => playableCharacterById(defaultActiveCharacterId),
    itemById: (id) => itemMap.get(id) || null,
    layerOrder: paperDollLayerOrder,
    canvasWidth: 512,
    canvasHeight: 768
  });

  bindEvents();
  dom.coins.value = state.coins;
  renderOutfitSelects();
  renderOwned();
  renderPreview();
  renderInfo();

  function bindEvents() {
    dom.coins.addEventListener("input", () => {
      state.coins = Math.max(0, Math.floor(Number(dom.coins.value) || 0));
      renderInfo();
    });
    dom.outfit.addEventListener("change", (e) => {
      const slot = e.target?.dataset?.slot;
      if (slot) onSlotChange(slot, e.target.value);
    });
    dom.owned.addEventListener("change", (e) => {
      const id = e.target?.value;
      if (!id) return;
      if (e.target.checked) state.owned.add(id); else state.owned.delete(id);
      renderInfo();
    });
    dom.ownAll.addEventListener("click", () => { shopItems.forEach((i) => state.owned.add(i.id)); renderOwned(); renderInfo(); });
    dom.ownNone.addEventListener("click", () => { state.owned = new Set(); ensureEquippedOwned(); renderOwned(); renderInfo(); });
    dom.apply.addEventListener("click", apply);
    window.addEventListener("resize", () => renderer.applyLayerTransforms(dom.doll));
    // 切到本分頁時（panel 由 hidden→顯示）重算 layer transforms，避免隱藏期間量到 0 尺寸。
    window.addEventListener("editor-tab-change", (e) => { if (e.detail?.tab === "defaults") renderPreview(); });
  }

  function onSlotChange(slot, value) {
    state.outfit[slot] = value;
    if (value !== "none") state.owned.add(value); // 裝備中的單品自動視為已擁有
    renderOutfitSelects();
    renderOwned();
    renderPreview();
    renderInfo();
  }

  function renderOutfitSelects() {
    dom.outfit.innerHTML = "";
    slotOrder.forEach((slot) => {
      const opts = wearableItems.filter((i) => i.type === slot);
      if (!opts.length) return;
      const row = document.createElement("label");
      row.className = "defaults-slot";
      const cur = state.outfit[slot];
      const value = cur && opts.some((o) => o.id === cur) ? cur : "none";
      row.innerHTML = `<span>${escapeHtml(slotLabel[slot] || slot)}</span>`;
      const sel = document.createElement("select");
      sel.dataset.slot = slot;
      sel.innerHTML = `<option value="none">（無）</option>`
        + opts.map((i) => `<option value="${escapeHtml(i.id)}"${i.id === value ? " selected" : ""}>${escapeHtml(i.name)}</option>`).join("");
      row.append(sel);
      dom.outfit.append(row);
    });
  }

  function renderOwned() {
    dom.owned.innerHTML = "";
    categories.forEach((cat) => {
      const items = shopItems.filter((i) => cat.types.includes(i.type));
      if (!items.length) return;
      const ownedCount = items.filter((i) => state.owned.has(i.id)).length;
      const group = document.createElement("div");
      group.className = "defaults-own-group";
      group.innerHTML = `<div class="defaults-own-head">${escapeHtml(cat.label)} <em>${ownedCount}/${items.length}</em></div>`;
      const body = document.createElement("div");
      body.className = "defaults-own-body";
      items.forEach((i) => {
        const equipped = isEquipped(i.id);
        const lab = document.createElement("label");
        lab.className = `defaults-own-check${equipped ? " equipped" : ""}`;
        lab.innerHTML = `<input type="checkbox" value="${escapeHtml(i.id)}"${state.owned.has(i.id) ? " checked" : ""}${equipped ? " disabled" : ""}><span>${escapeHtml(i.name)}</span>`;
        body.append(lab);
      });
      group.append(body);
      dom.owned.append(group);
    });
  }

  function renderPreview() {
    const character = playableCharacterById(defaultActiveCharacterId);
    dom.label.textContent = `${character?.label || "Princess"} · 預設外觀`;
    dom.doll.innerHTML = renderer.avatarMarkup("defaults", state.outfit, character);
    renderer.applyLayerTransforms(dom.doll);
  }

  function renderInfo() {
    const worn = outfitSlots.filter((slot) => state.outfit[slot] && state.outfit[slot] !== "none").length;
    dom.info.innerHTML = `<strong>起始金幣 ${state.coins}</strong><span>穿戴 ${worn} 件 · 擁有 ${state.owned.size} 件</span>`;
  }

  function isEquipped(id) {
    return outfitSlots.some((slot) => state.outfit[slot] === id);
  }

  function ensureEquippedOwned() {
    outfitSlots.forEach((slot) => {
      const id = state.outfit[slot];
      if (id && id !== "none") state.owned.add(id);
    });
  }

  async function apply() {
    ensureEquippedOwned();
    setStatus("儲存中…");
    try {
      const res = await fetch("/tool/save-defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coins: state.coins, owned: [...state.owned], outfit: state.outfit })
      });
      const data = await res.json();
      if (!data.ok) { setStatus(`儲存失敗：${data.error}`, "err"); return; }
      setStatus("已寫回 default-state.js（重整、用新帳號即可看到）。", "ok");
    } catch (e) {
      setStatus(`儲存失敗：${e.message}（需 node server.mjs）`, "err");
    }
  }

  function setStatus(text, kind) { dom.status.textContent = text; dom.status.className = `apply-status${kind ? ` apply-status-${kind}` : ""}`; }
  function pickOutfit(src = {}) {
    return Object.fromEntries(outfitSlots.filter((slot) => typeof src[slot] === "string").map((slot) => [slot, src[slot]]));
  }
}

function q(sel) { return document.querySelector(sel); }
function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
