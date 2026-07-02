// wardrobe/shop-panel.js — 商店／衣櫃／退款共用貨架面板與交易（issue #298 自 main.js 拆出，行為零變更）。
import {
  allowedShopCategoriesFor,
  categoryLabel,
  hotspotById,
  itemById,
  itemMatchesCategory,
  sceneConfigFor
} from "../core/lookups.js";
import { categories, shopItems } from "../data/game-data.js";
import { renderItemDetailPanel } from "../render/item-panel.js";
import { cssAssetUrl } from "../core/asset-url.js";
import { npcVoiceFor, playTone, speak } from "../scene/speech.js";
import {
  clearTryOnPreview,
  equipOutfitItem,
  isItemEquipped,
  isWearableItem,
  normalizeVisibleOutfit,
  renderActiveTryOnDoll,
  renderPaperDolls,
  toggleEquip,
  unequipOutfitItem
} from "./doll.js";
import { elements, session } from "../core/session.js";
import { addDiary, addUnique, awardBadge, princessName, render, renderHome, updateProgressBadges } from "../render/hud.js";
import { closeAdv, openAdvBase, openRoomScene, openSceneAdv, scheduleAdvFocus, setAdvLine, showRewardBurst } from "../scene/adv-flow.js";
import { persist } from "../system/persistence.js";
export function renderWardrobeTabs() {
  elements.wardrobeTabs.innerHTML = "";
  categories.forEach((category) => {
    const ownedCount = shopItems.filter((item) => itemMatchesCategory(item, category.id) && session.state.owned.includes(item.id)).length;
    if (!ownedCount) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-tab wardrobe-accordion-tab${session.wardrobeCategory === category.id ? " active" : ""}`;
    button.textContent = `${category.label} ${ownedCount}`;
    button.addEventListener("click", () => {
      session.wardrobeCategory = session.wardrobeCategory === category.id ? "" : category.id;
      renderHome();
    });
    elements.wardrobeTabs.appendChild(button);
  });
}

export function renderCategoryTabs(container, active, onClick, includeOwnedOnly = false, allowedCategories = null) {
  container.innerHTML = "";
  categories.forEach((category) => {
    if (allowedCategories && !allowedCategories.includes(category.id)) return;
    if (includeOwnedOnly && !shopItems.some((item) => itemMatchesCategory(item, category.id) && session.state.owned.includes(item.id))) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-tab${active === category.id ? " active" : ""}`;
    button.textContent = category.label;
    button.addEventListener("click", () => onClick(category.id));
    container.appendChild(button);
  });
}

export function renderWardrobe() {
  renderWardrobeTabs();
  elements.wardrobeGrid.innerHTML = "";
  const ownedGroups = categories.map((category) => ({
    category,
    items: shopItems.filter((item) => itemMatchesCategory(item, category.id) && session.state.owned.includes(item.id))
  })).filter((group) => group.items.length);

  if (!ownedGroups.length) {
    elements.wardrobeGrid.innerHTML = `<div class="wardrobe-empty">Buy treasures in town.</div>`;
    return;
  }

  ownedGroups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "wardrobe-section";
    section.innerHTML = `
      <div class="wardrobe-section-title">
        <strong>${group.category.label}</strong>
        <span>${group.items.length}</span>
      </div>
      <div class="wardrobe-section-items"></div>
    `;
    const list = section.querySelector(".wardrobe-section-items");
    group.items.forEach((item) => {
      list.appendChild(createItemCard(item, {
        mode: "wardrobe",
        action: () => toggleEquip(item)
      }));
    });
    elements.wardrobeGrid.appendChild(section);
  });
}

export function createItemCard(item, options = {}) {
  const owned = session.state.owned.includes(item.id);
  const equipped = isItemEquipped(item);
  const affordable = session.state.coins >= item.cost;
  const button = document.createElement("button");
  button.type = "button";
  button.className = `item-card ${item.type}${options.mode ? ` ${options.mode}-item-card` : ""}${owned ? " owned" : ""}${equipped ? " equipped" : ""}${!owned && !affordable ? " locked" : ""}${options.selected ? " selected" : ""}`;
  button.dataset.itemId = item.id;
  const previewStyle = itemPreviewStyle(item);
  button.innerHTML = `
    <span class="item-preview item-art item-image" style="${previewStyle}">
      <span aria-hidden="true">${item.icon || "✦"}</span>
    </span>
    <strong>${item.name}</strong>
    <span class="item-state">${owned ? equipped ? "Equipped" : "Owned" : `${item.cost} coins`}</span>
    <small class="item-category">${categoryLabel(item.type)}</small>
  `;
  button.addEventListener("click", options.action || (() => {}));
  return button;
}

export function itemPreviewStyle(item) {
  return `--item-img:url('${cssAssetUrl(item.image)}')`;
}

export function openShopAdv(hotspot) {
  openSceneAdv(hotspot);
}

export function openShopDetail(hotspot) {
  openAdvBase(hotspot, "shop");
  session.activeShopHotspot = hotspot;
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  const firstCategory = hotspot.defaultCategory || hotspot.shopCategories?.[0] || "outfit";
  const stockedCategories = availableShopCategories(hotspot);
  session.shopCategory = stockedCategories.includes(session.shopCategory) ? session.shopCategory : stockedCategories[0] || firstCategory;
  clearTryOnPreview({ renderDoll: false });
  // issue #149：商店招呼由店家第一人稱發話，並支援中文協助（中文鈕播 shopGreetingZh）。
  setAdvLine(shopGreeting(hotspot), sceneConfigFor(hotspot).shopGreetingZh);
  elements.advPrompt.textContent = "Tap to preview. BUY to keep.";
  elements.shopArea.classList.remove("wardrobe-detail", "refund-detail");
  elements.shopArea.classList.add("show");
  renderAdvShop();
  scheduleAdvFocus(0);
  speak(elements.advLine.textContent, npcVoiceFor(hotspot), { source: "npc-shop" });
}

export function openRefundDetail(hotspot) {
  openAdvBase(hotspot, "refund");
  session.activeShopHotspot = hotspot;
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  clearTryOnPreview({ renderDoll: false });
  setAdvLine(`${sceneConfigFor(hotspot).npc} can help return treasures from this shop.`);
  elements.advPrompt.textContent = "Tap an owned treasure, then Refund.";
  elements.shopArea.classList.remove("wardrobe-detail");
  elements.shopArea.classList.add("show", "refund-detail");
  renderRefundDetail();
  scheduleAdvFocus(0);
  speak(elements.advLine.textContent, npcVoiceFor(hotspot), { source: "npc-refund" });
}

export function openWardrobeDetail(category = "outfit") {
  const hotspot = hotspotById("princessRoom");
  session.activeShopHotspot = hotspot;
  session.advMode = "wardrobe";
  session.shopCategory = category;
  clearTryOnPreview({ renderDoll: false });
  // issue #244：公主房衣櫃與商店逛店共用同一套版面——以 data-mode="shop" 直接套用商店多欄貨架 CSS（消除舊
  // wardrobe 單欄版型分岔），另加 .adv-closet 標記僅承載 wear-only 差異（深粉紅穿脫鈕）。session.advMode 維持 "wardrobe"
  // 以走無試穿之焦點與行為（不誤觸購買）。.adv-closet 於 openAdvBase 重設 className 時自動清除、closeAdv 亦清除。
  elements.advScene.dataset.mode = "shop";
  elements.advScene.classList.add("adv-closet");
  setAdvLine(`Pick what ${princessName()} will wear today.`);
  elements.advPrompt.textContent = "Tap to wear; tap again to take off.";
  elements.shopArea.classList.remove("refund-detail");
  elements.shopArea.classList.add("show", "wardrobe-detail");
  renderWardrobeDetail();
}

// issue #244：公主房衣櫃改沿用商店同一多欄貨架面板（closet 模式），不再另維護單類別分頁版型。
export function renderWardrobeDetail(preserveFocus = false) {
  renderAdvShop(preserveFocus, { closet: true });
}

// issue #244：衣櫃單品於方塊只顯示狀態（Owned／Wearing），右側不渲染 BUY 鈕（noButton）；
// 穿上／脫下一律由左側那顆 try-on 鈕（shopTryOnState／toggleShopTryOn 單一來源）負責，與商店同一套。
export function closetItemStatus(item) {
  return {
    label: "",
    status: isItemEquipped(item) ? "Wearing" : "Owned",
    ariaLabel: "",
    noButton: true
  };
}

// issue #272：overlay 儲存後動態更新 shopItems 中的 live 項目，再重繪紙娃娃與衣櫃。
export function patchWardrobeItem(itemId, newTargetBox, rotation) {
  const live = itemById(itemId);
  if (!live?.layers?.length) return;
  const layer = live.layers[0];
  layer.bounds = { ...layer.bounds, targetBox: { ...newTargetBox } };
  if (Number.isFinite(rotation) && rotation !== 0) {
    layer.rotation = rotation;
    live.rotation = rotation;
  } else {
    delete layer.rotation;
    delete live.rotation;
  }
  renderPaperDolls();
  if (session.advMode === "wardrobe") renderWardrobeDetail(true);
  else if (session.advMode === "shop") renderAdvShop(true);
}

// issue #272：更新浮動「調整」鈕——item 有 pack/asset 則顯示並定位，否則隱藏。
export function updateAdvAdjustBtn(item) {
  session.panelFocusItem = item || null;
  const btn = elements.advAdjustBtn;
  if (!btn) return;
  const shouldShow = !!(item && item.pack && item.asset);
  btn.hidden = !shouldShow;
  if (shouldShow) requestAnimationFrame(_positionAdjustBtn);
}

// 把「調整」鈕定位到公主和衣櫃面板正中間、與面板上緣對齊。
export function _positionAdjustBtn() {
  const btn = elements.advAdjustBtn;
  const scene = elements.advScene;
  if (!btn || !scene || btn.hidden) return;
  const advBox = scene.querySelector(".adv-box");
  if (!advBox) return;
  const sceneRect = scene.getBoundingClientRect();
  const boxRect = advBox.getBoundingClientRect();
  const princess = scene.querySelector(".adv-princess");
  const princessRect = princess ? princess.getBoundingClientRect() : sceneRect;
  const gapStart = princessRect.right - sceneRect.left;
  const gapEnd = boxRect.left - sceneRect.left;
  const cx = (gapStart + gapEnd) / 2;
  btn.style.left = Math.max(0, cx - btn.offsetWidth / 2) + "px";
  btn.style.top = (boxRect.top - sceneRect.top) + "px";
}

export function allowedShopCategories(hotspot = session.activeShopHotspot) {
  return allowedShopCategoriesFor(hotspot);
}

export function unownedShopItemsFor(hotspot = session.activeShopHotspot, category = session.shopCategory) {
  const allowed = allowedShopCategories(hotspot);
  return shopItems.filter((item) => (
    item.storeId === hotspot?.id &&
    itemMatchesCategory(item, category) &&
    allowed.some((allowedCategory) => itemMatchesCategory(item, allowedCategory)) &&
    !session.state.owned.includes(item.id)
  ));
}

// issue #244：公主房衣櫃 = 玩家已擁有之衣物（跨店、依類別分欄），供 renderAdvShop closet 模式列欄。
export function ownedWardrobeItemsFor(category) {
  // issue #244：排除 starter 內建預設外觀（storeId="starter"、layers:[]、image 為 paper-doll 底圖佔位）——
  // 它們是 per-character head 已烘入之預設髮／playwear、非真正可收藏單品，無單品素材，不應列入衣櫃。
  return shopItems.filter((item) => (
    itemMatchesCategory(item, category) &&
    session.state.owned.includes(item.id) &&
    item.storeId !== "starter"
  ));
}

export function ownedWardrobeCategories() {
  return categories.map((category) => category.id).filter((id) => ownedWardrobeItemsFor(id).length);
}

export function refundableItemsFor(hotspot = session.activeShopHotspot) {
  return shopItems.filter((item) => (
    item.storeId === hotspot?.id &&
    item.cost > 0 &&
    session.state.owned.includes(item.id) &&
    purchaseSourceFor(item) === hotspot?.id
  ));
}

export function purchaseSourceFor(item) {
  ensurePurchaseStoreIdsState();
  return session.state.purchaseStoreIds[item.id] || item.storeId;
}

export function availableShopCategories(hotspot = session.activeShopHotspot) {
  return allowedShopCategories(hotspot).filter((category) => unownedShopItemsFor(hotspot, category).length);
}

export function firstUnownedShopItem(hotspot = session.activeShopHotspot) {
  const category = availableShopCategories(hotspot)[0];
  return category ? unownedShopItemsFor(hotspot, category)[0] : null;
}

export function shopGreeting(hotspot) {
  return sceneConfigFor(hotspot).shopGreeting || "Welcome, Princess. Pick a lovely item.";
}

// issue #244：公主房衣櫃與商店逛店共用同一套多欄貨架面板（單一機制、非兩套）。
// closet=true（公主房衣櫃）：列出已擁有衣物、動作鈕為 wear-only 穿脫切換（深粉紅）、無試穿與購買、Back 回房間；
// closet=false（商店逛店）：列未擁有商品、試穿＋購買、Back 回店家。僅以參數區分。
export function renderAdvShop(preserveFocus = false, { closet = false } = {}) {
  const stockedCategories = closet ? ownedWardrobeCategories() : availableShopCategories();
  if (!closet && !stockedCategories.includes(session.shopCategory)) {
    session.shopCategory = stockedCategories[0] || allowedShopCategories()[0] || "outfit";
  }
  elements.advShopTabs.innerHTML = ""; // 多欄貨架已含類別標題，不再需要上方類別分頁。
  // issue #244：商店與衣櫃為單一機制——穿脫互動一律走同一來源 shopTryOnState／toggleShopTryOn／updateShopTileStates
  // （內部依 session.advMode 區分：衣櫃持久穿戴、商店暫時試穿）。穿脫鈕＝同一顆左側 try-on 鈕。差異僅：衣櫃不渲染右側 BUY
  // 鈕（actionForItem 回 noButton 之狀態）、不需 onAction、Back 回房間。mode 一律 "shop" 使元件類別與版面完全一致。
  const panel = {
    actionForItem: closet ? closetItemStatus : shopPanelAction,
    categoryLabel,
    emptyText: closet ? "Buy treasures in town first, then dress up here." : `You found all ${session.activeShopHotspot?.label || "shop"} treasures!`,
    isSelected: shopItemTriedOn,
    items: [],
    listElement: elements.advShopGrid,
    mode: "shop",
    onAction: closet ? undefined : buyItemInAdv,
    onBack: closet ? backToRoomScene : backToStoreScene,
    onPreview: toggleShopTryOn,
    onTryOn: toggleShopTryOn,
    previewStyleForItem: itemPreviewStyle,
    tryOnForItem: shopTryOnState
  };
  if (!stockedCategories.length) {
    clearTryOnPreview({ renderDoll: false });
    if (!closet) renderShopSoldOut();
    const backButton = renderItemDetailPanel({ ...panel, items: [] });
    renderItemPanelCommands(backButton);
    scheduleAdvFocus(0);
    return;
  }
  renderActiveTryOnDoll();
  // 每個類別一欄：衣櫃列已擁有、商店列未擁有。
  const columns = stockedCategories.map((category) => ({
    label: categoryLabel(category),
    items: closet ? ownedWardrobeItemsFor(category) : unownedShopItemsFor(session.activeShopHotspot, category)
  }));
  const backButton = renderItemDetailPanel({ ...panel, columns });
  renderItemPanelCommands(backButton);
  scheduleAdvFocus(preserveFocus ? session.advFocusIndex : 0);
}

export function shopItemTriedOn(item) {
  // issue #244：衣櫃以「是否穿戴」為選取態，商店以「是否試穿中」；共用此單一判定。
  return session.advMode === "wardrobe" ? isItemEquipped(item) : session.shopTryOnIds.includes(item.id);
}

export function shopTryOnState(item) {
  if (!isWearableItem(item)) return null; // 房間擺設不能穿在身上，不給穿脫鈕。
  // issue #244：衣櫃＝持久穿脫（Wear／Take Off，依 isItemEquipped）；商店＝暫時試穿（Try on／✓ On）。同一顆左側鈕、同一來源。
  if (session.advMode === "wardrobe") {
    const equipped = isItemEquipped(item);
    return {
      active: equipped,
      label: equipped ? "Take Off" : "Wear",
      ariaLabel: equipped ? `Take off ${item.name}` : `Wear ${item.name}`
    };
  }
  const active = session.shopTryOnIds.includes(item.id);
  return {
    active,
    label: active ? "✓ On" : "Try on",
    ariaLabel: active ? `Stop trying on ${item.name}` : `Try on ${item.name}`
  };
}

export function toggleShopTryOn(item) {
  if (!item || !isWearableItem(item)) return;
  updateAdvAdjustBtn(item); // issue #272：每次點選面板單品即更新浮動調整按鈕
  // issue #244：公主房衣櫃（session.advMode==="wardrobe"）與商店逛店共用此單一穿脫來源。
  // 衣櫃＝已擁有衣物之持久穿脫：直接 equip/unequip 至 session.state.outfit 並 persist，再以同一套就地更新
  // （renderActiveTryOnDoll＋updateShopTileStates，不重建貨架）反映，故面板不跑、與商店行為一致。
  if (session.advMode === "wardrobe") {
    if (isItemEquipped(item)) unequipOutfitItem(item); else equipOutfitItem(item);
    persist();
    // 與商店 try-on 同一套就地更新：只更新 ADV 娃娃與各方塊狀態，不重建貨架（面板不跑）。
    renderActiveTryOnDoll();
    updateShopTileStates();
    return;
  }
  session.shopPreviewItemId = item.id; // 記住最後操作的單品，供鍵盤「b」購買。
  const idx = session.shopTryOnIds.indexOf(item.id);
  if (idx >= 0) {
    session.shopTryOnIds.splice(idx, 1);
  } else {
    // 維持試穿清單同部位互斥，與 equipOutfitItem 的穿戴規則一致（同 type、洋裝↔上下身）。
    session.shopTryOnIds = session.shopTryOnIds.filter((id) => {
      const other = itemById(id);
      if (!other) return false;
      if (other.type === item.type) return false;
      return true;
    });
    session.shopTryOnIds.push(item.id);
  }
  elements.advFeedback.textContent = "";
  // 只更新試穿娃娃與各方塊狀態（就地更新、不重建貨架），保留水平拖曳位置與焦點。
  renderActiveTryOnDoll();
  updateShopTileStates();
}

export function updateShopTileStates() {
  if (!elements.advShopGrid) return;
  // issue #244：商店試穿與衣櫃穿脫共用此就地更新——衣櫃以 isItemEquipped 為態（並更新所有方塊以反映同槽互斥），
  // 商店以 session.shopTryOnIds 為態；不重建貨架，故面板不跑。
  const closet = session.advMode === "wardrobe";
  elements.advShopGrid.querySelectorAll(".item-panel-row").forEach((row) => {
    const card = row.querySelector(".item-panel-card");
    const id = card?.dataset.itemId;
    if (!id) return;
    const item = itemById(id);
    const active = closet ? Boolean(item && isItemEquipped(item)) : session.shopTryOnIds.includes(id);
    card.classList.toggle("selected", active);
    const button = row.querySelector(".item-panel-tryon");
    if (!button) return;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.textContent = closet ? (active ? "Take Off" : "Wear") : (active ? "✓ On" : "Try on");
    if (item) button.setAttribute("aria-label", closet
      ? (active ? `Take off ${item.name}` : `Wear ${item.name}`)
      : (active ? `Stop trying on ${item.name}` : `Try on ${item.name}`));
  });
}

export function shopPanelAction(item) {
  const affordable = session.state.coins >= item.cost;
  const label = affordable ? "BUY" : `Need ${item.cost - session.state.coins}`;
  return {
    label,
    status: `${item.cost} coins`,
    ariaLabel: affordable ? `BUY ${item.name} for ${item.cost} coins` : `Need ${item.cost - session.state.coins} more coins for ${item.name}`,
    disabled: false
  };
}

export function renderItemPanelCommands(backButton) {
  elements.choiceList.innerHTML = "";
  elements.choiceList.classList.remove("shop-command-list");
  elements.advActionFooter.innerHTML = "";
  elements.advActionFooter.appendChild(backButton);
}

export function backToStoreScene() {
  const hotspot = session.activeShopHotspot;
  clearTryOnPreview({ renderDoll: false });
  if (hotspot) {
    openSceneAdv(hotspot);
  } else {
    closeAdv();
  }
}

export function backToRoomScene() {
  clearTryOnPreview({ renderDoll: false });
  openRoomScene(hotspotById("princessRoom"));
}

export function shopActionLabel(item) {
  if (!item) return "Pick a treasure";
  if (session.state.owned.includes(item.id)) {
    return item.type === "room" ? `Already in ${princessName()}'s room` : "Already in wardrobe";
  }
  if (session.state.coins < item.cost) return `Need ${item.cost - session.state.coins} more coins`;
  return `BUY ${item.cost} coins`;
}

export function tryOnFeedbackText(item, source) {
  const owned = session.state.owned.includes(item.id);
  const equipped = isItemEquipped(item);
  const affordable = session.state.coins >= item.cost;
  const status = owned ? equipped ? "Equipped now" : "Owned treasure" : affordable ? "Ready to buy" : `Need ${item.cost - session.state.coins} more coins`;
  if (item.type === "room") return `${item.name}: ${status}.`;
  const action = source === "wardrobe" ? `Trying it on ${princessName()}` : `Trying it on ${princessName()} before buying`;
  return `${item.name}: ${action}. ${status}.`;
}

export function renderShopSoldOut() {
  elements.shopArea.querySelector(".shop-feature")?.remove();
  renderPaperDolls();
  setAdvLine("You found every treasure in this shop.");
  elements.advPrompt.textContent = "Visit the wardrobe to wear owned treasures.";
  elements.advFeedback.textContent = `${sceneConfigFor(session.activeShopHotspot).npc} smiles. ${princessName()} can wear owned treasures from the wardrobe.`;
}

export function buyItemInAdv(item) {
  if (!item) return;
  if (session.state.owned.includes(item.id)) {
    elements.advFeedback.textContent = item.type === "room"
      ? `${item.name} is already in ${princessName()}'s room.`
      : `${item.name} is already in the wardrobe.`;
    session.shopPreviewItemId = "";
    renderAdvShop(true);
    scheduleAdvFocus(session.advFocusIndex);
    return;
  }
  if (session.state.coins < item.cost) {
    elements.advFeedback.textContent = `Not enough coins. Need ${item.cost - session.state.coins} more.`;
    playTone("wrong");
    speak("Not enough coins.", "en-US", { source: "system-feedback" });
    return;
  }
  session.state.coins -= item.cost;
  playTone("buy");
  session.state.owned.push(item.id);
  recordPurchaseSources(item);
  if (item.type !== "room") equipOutfitItem(item);
  awardBadge("First Shopping");
  updateProgressBadges();
  addDiary({ type: "shop", title: session.activeShopHotspot?.label || "Shop", body: `Bought ${item.name}.`, result: `-${item.cost} coins` });
  const feedbackText = item.type === "room" ? `${item.name} is in ${princessName()}'s room now.` : `${item.name} is on ${princessName()} now.`;
  setAdvLine(`${item.name} is yours now. It looks wonderful.`);
  elements.advFeedback.textContent = feedbackText;
  elements.statusMessage.textContent = feedbackText;
  showRewardBurst(`${item.name} ✦`);
  persist();
  render();
  session.shopPreviewItemId = "";
  // 已買下＝實際穿上，從試穿清單移除（其餘試穿維持）。
  session.shopTryOnIds = session.shopTryOnIds.filter((id) => id !== item.id);
  renderAdvShop(true);
}

export function ensurePurchaseStoreIdsState() {
  if (!session.state.purchaseStoreIds || Array.isArray(session.state.purchaseStoreIds) || typeof session.state.purchaseStoreIds !== "object") {
    session.state.purchaseStoreIds = {};
  }
}

export function recordPurchaseSources(item) {
  ensurePurchaseStoreIdsState();
  session.state.purchaseStoreIds[item.id] = item.storeId;
}

export function renderRefundDetail(preserveFocus = false) {
  const refundableItems = refundableItemsFor(session.activeShopHotspot);
  if (session.shopPreviewItemId && !refundableItems.some((item) => item.id === session.shopPreviewItemId)) clearTryOnPreview({ renderDoll: false });
  renderCategoryTabs(elements.advShopTabs, session.shopCategory, () => {}, false, []);
  renderActiveTryOnDoll();
  const backButton = renderItemDetailPanel({
    actionForItem: refundPanelAction,
    categoryLabel,
    emptyText: `No ${session.activeShopHotspot?.label || "shop"} treasures to refund.`,
    items: refundableItems,
    listElement: elements.advShopGrid,
    mode: "refund",
    onAction: refundItemInAdv,
    onBack: backToStoreScene,
    onPreview: previewRefundItem,
    previewStyleForItem: itemPreviewStyle,
    selectedItemId: session.shopPreviewItemId
  });
  renderItemPanelCommands(backButton);
  const focusIndex = preserveFocus ? Math.max(0, refundableItems.findIndex((item) => item.id === session.shopPreviewItemId)) : 0;
  scheduleAdvFocus(focusIndex);
}

export function previewRefundItem(item) {
  if (!item) return;
  session.shopPreviewItemId = item.id;
  elements.advFeedback.textContent = `${item.name}: Refund for ${refundAmount(item)} coins.`;
  renderRefundDetail(true);
}

export function refundPanelAction(item) {
  const amount = refundAmount(item);
  return {
    label: `Refund ${amount}`,
    status: "Owned",
    ariaLabel: `Refund ${item.name} for ${amount} coins`,
    disabled: false
  };
}

export function refundAmount(item) {
  return Math.floor((item?.cost || 0) / 2);
}

export function refundItemInAdv(item) {
  if (!item || item.storeId !== session.activeShopHotspot?.id || item.cost <= 0 || !session.state.owned.includes(item.id)) return;
  const amount = refundAmount(item);
  const removedOwnedIds = refundRemovalIds(item);
  session.state.coins += amount;
  session.state.owned = session.state.owned.filter((ownedId) => !removedOwnedIds.includes(ownedId));
  clearRemovedEquippedItems(removedOwnedIds);
  session.shopPreviewItemId = "";
  const feedbackText = `Refunded ${item.name} for ${amount} coins.`;
  setAdvLine(feedbackText);
  elements.advFeedback.textContent = feedbackText;
  elements.statusMessage.textContent = feedbackText;
  addDiary({ type: "shop", title: session.activeShopHotspot?.label || "Refund", body: `Refunded ${item.name}.`, result: `+${amount} coins` });
  persist();
  render();
  renderRefundDetail(true);
}

export function refundRemovalIds(item) {
  ensurePurchaseStoreIdsState();
  delete session.state.purchaseStoreIds[item.id];
  return [item.id];
}

export function clearRemovedEquippedItems(itemIds) {
  const removed = new Set(itemIds);
  let changed = false;
  Object.entries(session.state.outfit).forEach(([slot, itemId]) => {
    if (!removed.has(itemId)) return;
    session.state.outfit[slot] = fallbackOwnedItemForSlot(slot);
    changed = true;
  });
  if (changed) normalizeVisibleOutfit();
}

export function fallbackOwnedItemForSlot(type) {
  const ownedItems = shopItems.filter((item) => item.type === type && session.state.owned.includes(item.id));
  return ownedItems.find((item) => item.cost === 0)?.id || ownedItems[0]?.id || "none";
}

