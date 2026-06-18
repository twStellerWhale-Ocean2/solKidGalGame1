export function createPaperDollRenderer({ baseLayer, getCharacter, getFaceConfig, itemById, layerOrder }) {
  function avatarMarkup(surface, outfitState, character = getCharacter?.(), faceConfig = getFaceConfig?.()) {
    const layers = activePaperDollLayers(outfitState, character);
    const mask = assetUrl(character?.baseLayer || baseLayer);
    const face = normalizeFaceConfigForMarkup(faceConfig);
    return `
      <div class="avatar-shadow"></div>
      <span
        class="paper-doll-runtime-layer paper-doll-body-fill"
        style="--body-mask:url('${mask}');--skin-tone:${escapeCssValue(face.skinTone)}"
        aria-hidden="true"
      ></span>
      <span
        class="paper-doll-runtime-layer paper-doll-skin-shade"
        style="--body-mask:url('${mask}')"
        aria-hidden="true"
      ></span>
      ${layers.map((layer) => `
        <span
          class="paper-doll-layer paper-doll-layer-${layer.slot}"
          style="--layer-img:url('${assetUrl(layer.src)}')"
          aria-hidden="true"
        ></span>
      `).join("")}
      <span
        class="paper-doll-feature-root"
        data-hair-style="${escapeAttr(face.hairStyleId)}"
        data-brow="${escapeAttr(face.browId)}"
        data-eye="${escapeAttr(face.eyeId)}"
        data-nose="${escapeAttr(face.noseId)}"
        data-mouth="${escapeAttr(face.mouthId)}"
        style="--hair-color:${escapeCssValue(face.hairColor)}"
        aria-hidden="true"
      >
        <span class="paper-doll-hair"></span>
        <span class="paper-doll-face">
          <span class="paper-doll-brow paper-doll-brow-left"></span>
          <span class="paper-doll-brow paper-doll-brow-right"></span>
          <span class="paper-doll-eye paper-doll-eye-left"></span>
          <span class="paper-doll-eye paper-doll-eye-right"></span>
          <span class="paper-doll-nose"></span>
          <span class="paper-doll-mouth"></span>
        </span>
      </span>
    `;
  }

  function renderPaperDolls(outfit, expression, character = getCharacter?.(), faceConfig = getFaceConfig?.()) {
    document.querySelectorAll("[data-doll]").forEach((doll) => {
      doll.innerHTML = avatarMarkup(doll.dataset.doll || "side", outfit, character, faceConfig);
      doll.dataset.characterId = character?.id || "";
      doll.dataset.hairStyleId = faceConfig?.hairStyleId || "";
      doll.dataset.browId = faceConfig?.browId || "";
      doll.dataset.eyeId = faceConfig?.eyeId || "";
      doll.dataset.noseId = faceConfig?.noseId || "";
      doll.dataset.mouthId = faceConfig?.mouthId || "";
      doll.dataset.skinTone = faceConfig?.skinTone || "";
      doll.dataset.hairColor = faceConfig?.hairColor || "";
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

  function normalizeFaceConfigForMarkup(faceConfig = {}) {
    return {
      hairStyleId: faceConfig.hairStyleId || "bob",
      browId: faceConfig.browId || "soft",
      eyeId: faceConfig.eyeId || "round",
      noseId: faceConfig.noseId || "button",
      mouthId: faceConfig.mouthId || "smile",
      skinTone: faceConfig.skinTone || "#f7c9ad",
      hairColor: faceConfig.hairColor || "#8b5a3c"
    };
  }

  function escapeAttr(value) {
    return String(value).replace(/[&"<>\n\r]/g, "");
  }

  function escapeCssValue(value) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value)) ? value : "#8b5a3c";
  }

  return { avatarMarkup, renderPaperDolls };
}
