export function createPaperDollRenderer({ baseLayer, itemById, layerOrder }) {
  function avatarMarkup(surface, outfitState) {
    const layers = activePaperDollLayers(outfitState);
    return `
      <div class="avatar-shadow"></div>
      ${layers.map((layer) => `
        <span
          class="lumi-layer lumi-layer-${layer.slot}"
          style="--layer-img:url('${assetUrl(layer.src)}')"
          aria-hidden="true"
        ></span>
      `).join("")}
    `;
  }

  function renderPaperDolls(outfit, expression) {
    document.querySelectorAll("[data-doll]").forEach((doll) => {
      doll.innerHTML = avatarMarkup(doll.dataset.doll || "side", outfit);
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

  function activePaperDollLayers(outfitState = {}) {
    const layersBySlot = new Map(layerOrder.map((slot) => [slot, []]));
    layersBySlot.get("base").push({ slot: "base", src: baseLayer });
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
    const path = src?.startsWith("assets/") ? `../${src}` : src;
    return path?.replaceAll("'", "%27");
  }

  return { avatarMarkup, renderPaperDolls };
}
