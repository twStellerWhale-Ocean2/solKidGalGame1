export function createAdvControls({ elements, getFocusIndex, getMode, setFocusIndex }) {
  function addOption(label, onClick, options = {}) {
    const button = document.createElement("button");
    button.className = `choice-button${options.leave ? " leave-choice" : ""}`;
    button.type = "button";
    button.textContent = options.number ? `${options.number}. ${label}` : label;
    button.setAttribute("aria-label", label);
    if (options.disabled) button.disabled = true;
    if (options.choice) button.dataset.choice = options.choice;
    button.addEventListener("click", onClick);
    elements.choiceList.appendChild(button);
    return button;
  }

  function focusableButtons() {
    if (!elements.advModal.classList.contains("show")) return [];
    const mode = getMode();
    const selectors = mode === "shop" || mode === "wardrobe"
      ? ["#advShopGrid .item-card:not(:disabled)", "#advShopGrid .shop-buy-button:not(:disabled)", "#choiceList .choice-button:not(:disabled)"]
      : ["#choiceList .choice-button:not(:disabled)", "#advShopGrid .item-card:not(:disabled)"];
    return selectors.flatMap((selector) => [...document.querySelectorAll(selector)]).filter((button) => button.offsetParent !== null);
  }

  function setFocus(index = 0) {
    const buttons = focusableButtons();
    document.querySelectorAll(".adv-focus").forEach((button) => button.classList.remove("adv-focus"));
    if (!buttons.length) return;
    const focusIndex = (index + buttons.length) % buttons.length;
    setFocusIndex(focusIndex);
    const button = buttons[focusIndex];
    button.classList.add("adv-focus");
    button.focus({ preventScroll: true });
    const shopGrid = button.closest("#advShopGrid");
    if (shopGrid) {
      const gridRect = shopGrid.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      if (buttonRect.top < gridRect.top) shopGrid.scrollTop -= gridRect.top - buttonRect.top;
      if (buttonRect.bottom > gridRect.bottom) shopGrid.scrollTop += buttonRect.bottom - gridRect.bottom;
      return;
    }
    button.scrollIntoView({ block: "nearest" });
  }

  function moveFocus(delta) {
    const buttons = focusableButtons();
    if (!buttons.length) return;
    setFocus(getFocusIndex() + delta);
  }

  function confirmFocus() {
    const buttons = focusableButtons();
    if (!buttons.length) return false;
    buttons[getFocusIndex()]?.click();
    return true;
  }

  return { addOption, confirmFocus, focusableButtons, moveFocus, setFocus };
}
