export function createAdvControls({ elements, getFocusIndex, getMode, setFocusIndex }) {
  function addOption(label, onClick, options = {}) {
    const button = document.createElement("button");
    const isNavigation = options.leave || options.navigation;
    button.className = `choice-button${isNavigation ? " leave-choice" : ""}`;
    button.type = "button";
    button.textContent = options.number ? `${options.number}. ${label}` : label;
    button.setAttribute("aria-label", label);
    if (options.disabled) button.disabled = true;
    if (options.choice) button.dataset.choice = options.choice;
    button.addEventListener("click", onClick);
    (isNavigation ? elements.advActionFooter : elements.choiceList).appendChild(button);
    return button;
  }

  function focusableButtons() {
    if (!elements.advModal.classList.contains("show")) return [];
    const mode = getMode();
    // issue #244：衣櫃（wardrobe）穿脫＝商店左側同一顆 try-on 鈕（單一來源），故焦點順序與商店相同（試穿/穿脫鈕＋動作鈕）。
    const selectors = (mode === "shop" || mode === "wardrobe")
      ? ["#advShopGrid .item-panel-tryon:not(:disabled), #advShopGrid .item-panel-action:not(:disabled)", "#advActionFooter .choice-button:not(:disabled)"]
      : mode === "refund"
        ? ["#advShopGrid .item-card:not(:disabled), #advShopGrid .item-panel-action:not(:disabled)", "#advActionFooter .choice-button:not(:disabled)"]
      : ["#choiceList .choice-button:not(:disabled)", "#advShopGrid .item-card:not(:disabled)", "#advActionFooter .choice-button:not(:disabled)"];
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
      // 商店櫥窗為水平捲動，焦點移動時一併把方塊帶進可視範圍。
      if (buttonRect.left < gridRect.left) shopGrid.scrollLeft -= gridRect.left - buttonRect.left;
      if (buttonRect.right > gridRect.right) shopGrid.scrollLeft += buttonRect.right - gridRect.right;
      return;
    }
    if (button.closest("#advActionFooter")) return;
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
