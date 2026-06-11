export function createPaperDollRenderer({ baseLayer, getCharacter, itemById, layerOrder }) {
  function avatarMarkup(surface, outfitState, character = getCharacter?.()) {
    const layers = activePaperDollLayers(outfitState, character);
    return `
      <div class="avatar-shadow"></div>
      ${layers.map((layer) => `
        <span
          class="paper-doll-layer paper-doll-layer-${layer.slot}"
          style="--layer-img:url('${assetUrl(layer.src)}')"
          aria-hidden="true"
        ></span>
      `).join("")}
    `;
  }

  function renderPaperDolls(outfit, expression, character = getCharacter?.()) {
    document.querySelectorAll("[data-doll]").forEach((doll) => {
      doll.innerHTML = avatarMarkup(doll.dataset.doll || "side", outfit, character);
      doll.dataset.characterId = character?.id || "";
      doll.dataset.hairstyle = outfit.hairstyle || "none";
      doll.dataset.top = outfit.top || "none";
      doll.dataset.bottom = outfit.bottom || "none";
      doll.dataset.dress = outfit.dress || "none";
      doll.dataset.outer = outfit.outer || "none";
      doll.dataset.shoes = outfit.shoes || "none";
      doll.dataset.headTop = outfit.headTop || "none";
      doll.dataset.headSide = outfit.headSide || "none";
      doll.dataset.faceEyes = outfit.faceEyes || "none";
      doll.dataset.faceMask = outfit.faceMask || "none";
      doll.dataset.neck = outfit.neck || "none";
      doll.dataset.hand = outfit.hand || "none";
      doll.dataset.expression = expression;
    });
  }

  function activePaperDollLayers(outfitState = {}, character = getCharacter?.()) {
    const layersBySlot = new Map(layerOrder.map((slot) => [slot, []]));
    layersBySlot.get("base").push({ slot: "base", src: character?.baseLayer || baseLayer });
    const slots = [
      "hairstyle",
      outfitState.dress && outfitState.dress !== "none" ? "dress" : "bottom",
      outfitState.dress && outfitState.dress !== "none" ? null : "top",
      "outer",
      "shoes",
      "headTop",
      "headSide",
      "faceEyes",
      "faceMask",
      "neck",
      "hand"
    ].filter(Boolean);

    slots.forEach((slot) => {
      const item = itemById(outfitState[slot]);
      (item?.layers || []).forEach((layer) => {
        if (!layersBySlot.has(layer.slot)) layersBySlot.set(layer.slot, []);
        layersBySlot.get(layer.slot).push(layer);
      });
    });

    return layerOrder.flatMap((slot) => layersBySlot.get(slot) || []);
  }

  function assetUrl(src) {
    const path = src?.startsWith("content-package/") || src?.startsWith("content-base/") ? `../${src}` : src;
    return path?.replaceAll("'", "%27");
  }

  return { avatarMarkup, renderPaperDolls };
}
