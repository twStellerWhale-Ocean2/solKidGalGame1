// wardrobe/doll.js — 紙娃娃與穿脫：合成 markup、試穿預覽、equip 核心（issue #298 自 main.js 拆出，行為零變更）。
import { createPaperDollRenderer } from "../render/paper-doll.js";
import { itemById } from "../core/lookups.js";
import { paperDollBaseLayer, paperDollLayerOrder, playableCharacterById } from "../data/game-data.js";
import { outfitSummary as stateOutfitSummary } from "../state/game-state.js";
import { elements, session } from "../core/session.js";
import { updateAdvAdjustBtn } from "./shop-panel.js";
import { hub } from "../core/hub.js";
export const paperDollRenderer = createPaperDollRenderer({
  baseLayer: paperDollBaseLayer,
  getCharacter: activePaperDollCharacter,
  itemById,
  layerOrder: paperDollLayerOrder
});

export function outfitSummary() {
  return stateOutfitSummary(session.state);
}

export function renderPaperDolls() {
  paperDollRenderer.renderPaperDolls(session.state.outfit, session.princessExpression, activePaperDollCharacter());
  renderActiveTryOnDoll();
}

export function avatarMarkup(surface, outfitState = session.state.outfit) {
  return paperDollRenderer.avatarMarkup(surface, outfitState, activePaperDollCharacter());
}

// 頭胸 bust 紙娃娃層（issue #132）：供帳號卡以各帳號自己的角色＋穿搭渲染即時衣著（資訊欄則由 renderPaperDolls 以使用中狀態填層）。
export function bustMarkupFor(characterId, outfitState) {
  return paperDollRenderer.avatarMarkup("side-bust", outfitState || {}, playableCharacterById(characterId));
}

export function activePaperDollCharacter() {
  return playableCharacterById(session.state.activeCharacterId);
}

export function tryOnOutfitFor(item) {
  const previewOutfit = { ...session.state.outfit };
  if (isWearableItem(item)) equipOutfitItem(item, previewOutfit);
  return previewOutfit;
}

export function renderAdvDoll(outfitState, isTryOn = false) {
  const doll = elements.advScene?.querySelector('[data-doll="adv"]');
  if (!doll) return;
  doll.innerHTML = avatarMarkup("adv", outfitState);
  doll.dataset.hairstyle = outfitState.hairstyle || "none";
  doll.dataset.outfit = outfitState.outfit || "none";
  doll.dataset.shoes = outfitState.shoes || "none";
  doll.dataset.headTop = outfitState.headTop || "none";
  doll.dataset.headSide = outfitState.headSide || "none";
  doll.dataset.faceEyes = outfitState.faceEyes || "none";
  doll.dataset.faceMask = outfitState.faceMask || "none";
  doll.dataset.neck = outfitState.neck || "none";
  doll.dataset.hand = outfitState.hand || "none";
  doll.dataset.expression = session.princessExpression;
  doll.classList.toggle("try-on-active", isTryOn);
}

export function activeTryOnItem() {
  if (session.advMode !== "shop" && session.advMode !== "wardrobe" && session.advMode !== "refund") return null;
  const item = itemById(session.shopPreviewItemId);
  return item && item.type !== "room" ? item : null;
}

export function shopTryOnItems() {
  return session.shopTryOnIds.map((id) => itemById(id)).filter((item) => item && item.type !== "room");
}

export function tryOnOutfitForItems(items) {
  const previewOutfit = { ...session.state.outfit };
  items.forEach((item) => {
    if (isWearableItem(item)) equipOutfitItem(item, previewOutfit);
  });
  return previewOutfit;
}

export function renderActiveTryOnDoll() {
  // 商店：以累加的試穿清單疊穿多件；其餘模式（衣櫥／退款）維持單件預覽。
  if (session.advMode === "shop") {
    const items = shopTryOnItems();
    renderAdvDoll(items.length ? tryOnOutfitForItems(items) : session.state.outfit, items.length > 0);
    return;
  }
  const item = activeTryOnItem();
  if (!item) {
    renderAdvDoll(session.state.outfit, false);
    return;
  }
  renderAdvDoll(tryOnOutfitFor(item), true);
}

export function clearTryOnPreview({ renderDoll = true } = {}) {
  session.shopPreviewItemId = "";
  updateAdvAdjustBtn(null);
  if (renderDoll) renderPaperDolls();
}

export function isWearableItem(item) {
  return item && item.type !== "room";
}

export function isItemEquipped(item, outfit = session.state.outfit) {
  if (!item) return false;
  if (item.type === "room") return outfit.room === item.id;
  return outfit[item.type] === item.id;
}

export function equipOutfitItem(item, outfit = session.state.outfit) {
  if (!item) return outfit;
  if (item.type === "room") {
    outfit.room = item.id;
    return outfit;
  }
  outfit[item.type] = item.id;
  return normalizeVisibleOutfit(outfit);
}

export function unequipOutfitItem(item, outfit = session.state.outfit) {
  if (!item || item.type === "room") return outfit;
  outfit[item.type] = "none";
  return normalizeVisibleOutfit(outfit);
}

export function normalizeVisibleOutfit(outfit = session.state.outfit) {
  if (!outfit.hairstyle || outfit.hairstyle === "none") outfit.hairstyle = "softBrownHair";
  // #251：身上恆有整件 outfit（無分件上下身）；空 outfit 退回 starter 整件，避免下半身裸露。
  if (!outfit.outfit || outfit.outfit === "none") outfit.outfit = "starterPajama";
  return outfit;
}

export function toggleEquip(item) {
  if (item.type === "room") {
    session.state.outfit.room = item.id;
    elements.statusMessage.textContent = `${item.name} is placed in ${hub.princessName()}'s room.`;
    hub.persist();
    hub.render();
    return;
  }
  if (isItemEquipped(item)) {
    unequipOutfitItem(item);
    elements.statusMessage.textContent = `${item.name} removed.`;
  } else {
    equipOutfitItem(item);
    elements.statusMessage.textContent = `${item.name} equipped.`;
  }
  hub.persist();
  hub.render();
}

