export function createPaperDollRenderer({ baseLayer, getCharacter, itemById, layerOrder, canvasWidth = 512, canvasHeight = 768 }) {
  function avatarMarkup(surface, outfitState, character = getCharacter?.()) {
    const layers = activePaperDollLayers(outfitState, character);
    return `
      <div class="avatar-shadow"></div>
      ${layers.map((layer) => `
        <span
          class="paper-doll-layer paper-doll-layer-${cssName(layer.slot)} paper-doll-layer-type-${cssName(layer.type || layer.slot)}"
          style="--layer-img:url('${assetUrl(layer.src)}');${boundsStyle(layer.bounds)}"
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
    layersBySlot.get("base").push({ slot: "base", type: "base", src: character?.baseLayer || baseLayer });
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

  function boundsStyle(bounds = {}) {
    const box = bounds.targetBox;
    if (box && ["left", "top", "right", "bottom"].every((edge) => Number.isFinite(box[edge]))) {
      // 目標矩形（#176）：以畫布相對百分比定位，任意尺寸素材經 background-size:contain
      // 縮放 fit 進此區域；同類共用同一目標矩形，落點與尺度由矩形決定、不隨來圖外框漂移。
      const pct = {
        top: (box.top / canvasHeight) * 100,
        right: ((canvasWidth - box.right) / canvasWidth) * 100,
        bottom: ((canvasHeight - box.bottom) / canvasHeight) * 100,
        left: (box.left / canvasWidth) * 100
      };
      return ["top", "right", "bottom", "left"]
        .map((edge) => `--layer-${edge}:${Math.round(pct[edge] * 1000) / 1000}%`)
        .join(";");
    }
    return ["top", "right", "bottom", "left"]
      .map((edge) => `--layer-${edge}:${Number.isFinite(bounds[edge]) ? bounds[edge] : 0}px`)
      .join(";");
  }

  function cssName(value = "unknown") {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "-");
  }

  return { avatarMarkup, renderPaperDolls };
}
