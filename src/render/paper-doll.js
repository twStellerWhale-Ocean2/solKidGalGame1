export function createPaperDollRenderer({ itemById }) {
  function avatarMarkup(surface, outfitState) {
    const outfit = itemById(outfitState.outfit) || itemById("pinkDress");
    const spritePosition = outfit?.sprite || "0%";
    return `
      <div class="avatar-shadow"></div>
      <span class="avatar-base avatar-sprite" style="--sprite-x:${spritePosition}" aria-hidden="true"></span>
      <span class="avatar-layer avatar-shoes" aria-hidden="true"></span>
      <span class="avatar-layer avatar-accessory" aria-hidden="true"></span>
    `;
  }

  function renderPaperDolls(outfit, expression) {
    document.querySelectorAll("[data-doll]").forEach((doll) => {
      doll.innerHTML = avatarMarkup(doll.dataset.doll || "side", outfit);
      doll.dataset.outfit = outfit.outfit || "none";
      doll.dataset.shoes = outfit.shoes || "none";
      doll.dataset.accessory = outfit.accessory || "none";
      doll.dataset.expression = expression;
    });
  }

  return { avatarMarkup, renderPaperDolls };
}
