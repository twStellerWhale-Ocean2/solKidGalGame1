// 「👑 公主預設」分頁：編輯新遊戲公主的起始 coins／owned／outfit，即時預覽紙娃娃，
// 按「套用」由 dev server 寫回 game-engine/state/default-state.js（白名單 /devtool/save-defaults）。
// issue #297：三欄版面（左＝已有金錢＋擁有清單、依「素材包-名稱」排序；中＝衣物配置下拉；右上＝資訊＋套用、右下＝人物照片），各欄可拖寬。
// 維持「穿著⊆擁有」不變式——穿著下拉僅列已擁有、取消擁有自動脫下正穿之該件；勾選擁有時該部位若空著則預設直接穿上。
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
// issue #297：未儲存編修登記 dirty（離頁防護）；回饋走統一出口（行內＋snackbar）；
// 預覽舞台縮放／位移與衣物頁一致（滾輪／雙指／拖曳）。
import { status as sharedStatus, setDirty } from "./ui-helpers.js";
import { setupStagePanZoom, setupColumnResize } from "./wardrobe-gestures.js";

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
    info: q("#defaultsInfo"), label: q("#defaultsPreviewLabel"),
    previewStage: q("#panel-defaults .preview-stage")
  };

  // 預覽舞台平移＋縮放狀態（與衣物頁同一套接線；#297 預覽一致性）。
  const view = { zoom: 1, pan: { x: 0, y: 0 } };
  function applyStageTransform() {
    if (dom.previewStage) {
      dom.previewStage.style.transform =
        `translate(${Math.round(view.pan.x)}px, ${Math.round(view.pan.y)}px) scale(${Math.round(view.zoom * 1000) / 1000})`;
    }
  }

  const renderer = createPaperDollRenderer({
    baseLayer: paperDollBaseLayer,
    getCharacter: () => playableCharacterById(defaultActiveCharacterId),
    itemById: (id) => itemMap.get(id) || null,
    layerOrder: paperDollLayerOrder,
    canvasWidth: 512,
    canvasHeight: 768
  });

  bindEvents();
  ensureEquippedOwned(); // 初始確保「穿著⊆擁有」不變式（default-state 若不一致亦收斂）
  dom.coins.value = state.coins;
  renderOutfitSelects();
  renderOwned();
  renderPreview();
  renderInfo();

  function bindEvents() {
    dom.coins.addEventListener("input", () => {
      state.coins = Math.max(0, Math.floor(Number(dom.coins.value) || 0));
      markDirty();
      renderInfo();
    });
    dom.outfit.addEventListener("change", (e) => {
      const slot = e.target?.dataset?.slot;
      if (slot) onSlotChange(slot, e.target.value);
    });
    dom.owned.addEventListener("change", (e) => {
      const id = e.target?.value;
      if (!id) return;
      if (e.target.checked) {
        state.owned.add(id);
        // 勾選擁有時，若該部位目前空著（沒穿同類），預設直接穿上；已穿同類則只加入擁有、不搶穿。
        const item = itemMap.get(id);
        const slot = item?.type;
        const wearable = Array.isArray(item?.layers) && item.layers.length > 0;
        if (wearable && slot && outfitSlots.includes(slot) && (!state.outfit[slot] || state.outfit[slot] === "none")) {
          state.outfit[slot] = id;
        }
      } else {
        state.owned.delete(id);
        // 連動：取消擁有→脫下正穿之該件（避免穿著未擁有的矛盾）
        outfitSlots.forEach((slot) => { if (state.outfit[slot] === id) state.outfit[slot] = "none"; });
      }
      markDirty();
      renderOutfitSelects(); // 擁有變動 → 穿著下拉選項連動
      renderOwned();         // equipped 標示連動
      renderPreview();
      renderInfo();
    });
    dom.ownAll.addEventListener("click", () => { shopItems.forEach((i) => state.owned.add(i.id)); markDirty(); renderOutfitSelects(); renderOwned(); renderInfo(); });
    dom.ownNone.addEventListener("click", () => {
      state.owned = new Set();
      outfitSlots.forEach((slot) => { state.outfit[slot] = "none"; }); // 沒擁有就不能穿：一併脫下
      markDirty(); renderOutfitSelects(); renderOwned(); renderPreview(); renderInfo();
    });
    dom.apply.addEventListener("click", apply);
    setupStagePanZoom(dom.previewStage, view, applyStageTransform); // 滾輪／雙指縮放＋空白處拖曳平移
    setupColumnResize( // 三欄各自可拖寬（左分隔條改 --left-w、右分隔條改 --right-w）
      q("#panel-defaults .defaults-shell"),
      q("#panel-defaults .col-resizer:not(.col-resizer-right)"),
      q("#panel-defaults .col-resizer-right")
    );
    window.addEventListener("resize", () => renderer.applyLayerTransforms(dom.doll));
    // 切到本分頁時（panel 由 hidden→顯示）重算 layer transforms，避免隱藏期間量到 0 尺寸。
    window.addEventListener("editor-tab-change", (e) => { if (e.detail?.tab === "defaults") renderPreview(); });
  }

  function onSlotChange(slot, value) {
    // 下拉選項已限「已擁有」，選取即穿上（不需自動加入擁有）；「（無）」＝脫下。
    state.outfit[slot] = value;
    markDirty();
    renderOutfitSelects();
    renderOwned();
    renderPreview();
    renderInfo();
  }

  function renderOutfitSelects() {
    dom.outfit.innerHTML = "";
    slotOrder.forEach((slot) => {
      const allOfSlot = wearableItems.filter((i) => i.type === slot);
      if (!allOfSlot.length) return; // 該 slot 無任何可穿衣物 → 不顯示此列
      // 下拉僅列「已擁有」之該類（避免設出穿著未擁有的矛盾）；依「素材包-名稱」排序。
      const opts = allOfSlot
        .filter((i) => state.owned.has(i.id))
        .sort((a, b) => ownedLabel(a).localeCompare(ownedLabel(b), "en"));
      const row = document.createElement("label");
      row.className = "defaults-slot";
      const cur = state.outfit[slot];
      const value = cur && opts.some((o) => o.id === cur) ? cur : "none";
      row.innerHTML = `<span>${escapeHtml(slotLabel[slot] || slot)}</span>`;
      const sel = document.createElement("select");
      sel.dataset.slot = slot;
      sel.innerHTML = `<option value="none">（無）</option>`
        + (opts.length ? "" : `<option value="none" disabled>（需先於左側擁有此類）</option>`)
        + opts.map((i) => `<option value="${escapeHtml(i.id)}"${i.id === value ? " selected" : ""}>${escapeHtml(ownedLabel(i))}</option>`).join("");
      row.append(sel);
      dom.outfit.append(row);
    });
  }

  function renderOwned() {
    dom.owned.innerHTML = "";
    // 依類別（髮型/整件/鞋…，順序同衣物分類）分組，每組加標題（含件數）；組內仍依「素材包-名稱」排序。
    // 正穿之件標 equipped，仍可取消勾選（取消時由 change handler 連動脫下），不 disabled。
    const groupOrder = categories.flatMap((cat) => cat.types);
    const byType = new Map();
    shopItems.forEach((i) => {
      if (!byType.has(i.type)) byType.set(i.type, []);
      byType.get(i.type).push(i);
    });
    const orderedTypes = [
      ...groupOrder.filter((t) => byType.has(t)),
      ...[...byType.keys()].filter((t) => !groupOrder.includes(t)) // 未列入分類者殿後
    ];
    orderedTypes.forEach((slot) => {
      const group = byType.get(slot).sort((a, b) => ownedLabel(a).localeCompare(ownedLabel(b), "en"));
      const head = document.createElement("div");
      head.className = "defaults-own-group";
      head.textContent = `${slotLabel[slot] || slot}（${group.length}）`;
      dom.owned.append(head);
      group.forEach((i) => {
        const equipped = isEquipped(i.id);
        const lab = document.createElement("label");
        lab.className = `defaults-own-check${equipped ? " equipped" : ""}`;
        lab.innerHTML = `<input type="checkbox" value="${escapeHtml(i.id)}"${state.owned.has(i.id) ? " checked" : ""}>`
          + `<span><span class="defaults-own-pack">${escapeHtml(packOf(i))}-</span>${escapeHtml(i.name)}</span>`;
        dom.owned.append(lab);
      });
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
      const res = await fetch("/devtool/save-defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coins: state.coins, owned: [...state.owned], outfit: state.outfit })
      });
      const data = await res.json();
      if (!data.ok) { setStatus(`儲存失敗：${data.error}`, "err"); return; }
      setDirty("defaults", false);
      setStatus("已寫回 default-state.js（重整、用新帳號即可看到）。", "ok");
    } catch (e) {
      setStatus(`儲存失敗：${e.message}（需 node server.mjs）`, "err");
    }
  }

  function markDirty() { setDirty("defaults", true, "公主預設編修"); }
  function setStatus(text, kind) { sharedStatus(dom.status, text, kind); }
  function pickOutfit(src = {}) {
    return Object.fromEntries(outfitSlots.filter((slot) => typeof src[slot] === "string").map((slot) => [slot, src[slot]]));
  }
}

function q(sel) { return document.querySelector(sel); }
function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
// 素材包名（優先 item.pack；starter 等無 layer 者由 image 解析、再退回 "starter"）。
function packOf(item) {
  if (item?.pack) return item.pack;
  const m = /wardrobe\/([^/]+)\/assets\//.exec(item?.image || "");
  return m ? m[1] : "starter";
}
// 擁有清單／穿著下拉之顯示與排序鍵：「素材包-名稱」。
function ownedLabel(item) { return `${packOf(item)}-${item?.name || item?.id || ""}`; }
