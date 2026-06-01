export function renderItemDetailPanel({
  actionForItem,
  backLabel = "↩ Back",
  categoryLabel,
  emptyText,
  items,
  listElement,
  mode,
  onAction,
  onBack,
  onPreview,
  previewStyleForItem,
  selectedItemId
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
        previewStyle: previewStyleForItem(item),
        selected: item.id === selectedItemId
      }));
    });
  }

  return createItemPanelBackButton(backLabel, onBack);
}

function createItemPanelRow({ action, categoryLabel, item, mode, onAction, onPreview, previewStyle, selected }) {
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
    <span class="item-preview item-art item-image ${item.shape}" style="${previewStyle}">
      <span aria-hidden="true">${item.icon || "✦"}</span>
    </span>
    <strong>${item.name}</strong>
    <span class="item-state">${action.status}</span>
    <small class="item-category">${categoryLabel(item.type)}</small>
  `;
  preview.addEventListener("click", () => onPreview(item));

  const actionButton = document.createElement("button");
  actionButton.type = "button";
  actionButton.className = `shop-buy-button item-panel-action ${mode}-panel-action`;
  actionButton.textContent = action.label;
  actionButton.setAttribute("aria-label", action.ariaLabel || `${action.label} ${item.name}`);
  actionButton.disabled = Boolean(action.disabled);
  actionButton.addEventListener("click", () => {
    onPreview(item);
    onAction(item);
  });

  row.append(preview, actionButton);
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
