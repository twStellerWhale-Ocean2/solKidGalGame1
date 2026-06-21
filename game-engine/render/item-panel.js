export function renderItemDetailPanel({
  actionForItem,
  backLabel = "↩ Back",
  categoryLabel,
  emptyText,
  isSelected,
  items,
  listElement,
  mode,
  onAction,
  onBack,
  onPreview,
  onTryOn,
  previewStyleForItem,
  selectedItemId,
  tryOnForItem
}) {
  listElement.innerHTML = "";
  listElement.classList.add("item-panel-list");
  listElement.dataset.panelMode = mode;

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "item-panel-empty";
    empty.textContent = emptyText;
    listElement.appendChild(empty);
  } else {
    items.forEach((item) => {
      listElement.appendChild(createItemPanelRow({
        action: actionForItem(item),
        categoryLabel,
        item,
        mode,
        onAction,
        onPreview,
        onTryOn,
        previewStyle: previewStyleForItem(item),
        selected: isSelected ? isSelected(item) : item.id === selectedItemId,
        tryOn: tryOnForItem ? tryOnForItem(item) : null
      }));
    });
  }

  return createItemPanelBackButton(backLabel, onBack);
}

function createItemPanelRow({ action, categoryLabel, item, mode, onAction, onPreview, onTryOn, previewStyle, selected, tryOn }) {
  const row = document.createElement("div");
  row.className = `shop-buy-row item-panel-row ${mode}-panel-row`;

  const preview = document.createElement("button");
  preview.type = "button";
  preview.className = [
    "item-card",
    "item-panel-card",
    `${mode}-item-card`,
    item.type,
    selected ? "selected" : ""
  ].filter(Boolean).join(" ");
  preview.dataset.itemId = item.id;
  preview.setAttribute("aria-label", `${item.name} ${action.status}`);
  preview.innerHTML = `
    <span class="item-preview item-art item-image" style="${previewStyle}">
      <span aria-hidden="true">${item.icon || "✦"}</span>
    </span>
    <strong>${item.name}</strong>
    <span class="item-state">${action.status}</span>
    <small class="item-category">${categoryLabel(item.type)}</small>
  `;
  preview.addEventListener("click", () => onPreview(item));

  // 試穿切換鈕（issue：商店多件同時試穿）。只有提供 tryOn 設定的模式（商店）才渲染；
  // 衣櫥／退款不傳 tryOnForItem，維持原本「縮圖 + 動作鈕」兩欄版面不受影響。
  let tryOnButton = null;
  if (tryOn) {
    tryOnButton = document.createElement("button");
    tryOnButton.type = "button";
    tryOnButton.className = `item-panel-tryon ${mode}-panel-tryon${tryOn.active ? " active" : ""}`;
    tryOnButton.textContent = tryOn.label;
    tryOnButton.setAttribute("aria-pressed", tryOn.active ? "true" : "false");
    tryOnButton.setAttribute("aria-label", tryOn.ariaLabel || `${tryOn.label} ${item.name}`);
    tryOnButton.addEventListener("click", () => onTryOn(item));
  }

  const actionButton = document.createElement("button");
  actionButton.type = "button";
  actionButton.className = `shop-buy-button item-panel-action ${mode}-panel-action`;
  actionButton.textContent = action.label;
  actionButton.setAttribute("aria-label", action.ariaLabel || `${action.label} ${item.name}`);
  actionButton.disabled = Boolean(action.disabled);
  actionButton.addEventListener("click", () => {
    // 有專屬試穿鈕的模式（商店），縮圖點擊＝切換試穿，故購買鈕不可再走 onPreview（否則買下時會誤切試穿）。
    if (!onTryOn) onPreview(item);
    onAction(item);
  });

  row.append(preview);
  if (tryOnButton) row.append(tryOnButton);
  row.append(actionButton);
  return row;
}

function createItemPanelBackButton(label, onBack) {
  const button = document.createElement("button");
  button.className = "choice-button leave-choice item-panel-back";
  button.type = "button";
  button.textContent = label;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onBack);
  return button;
}
