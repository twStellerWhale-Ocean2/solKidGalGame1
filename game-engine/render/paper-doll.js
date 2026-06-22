import { warpFractions } from "./warp.js";

export function createPaperDollRenderer({ baseLayer, getCharacter, itemById, layerOrder, canvasWidth = 512, canvasHeight = 768 }) {
  function avatarMarkup(surface, outfitState, character = getCharacter?.()) {
    const layers = activePaperDollLayers(outfitState, character);
    // issue #194：所有 layer 包進單一 .paper-doll-stage（代表 512:768 合成）。全身 doll 之 stage 為 inset:0
    // 透明殼、不改變呈現；頭胸照（.bust-doll）則對整個 stage 施加單一等比裁切，使 base 與 wardrobe layer
    // 沿用完全相同的對位幾何（不再逐 layer 重縮放 background 而讓衣物脫離身體）。
    return `
      <div class="paper-doll-stage">
        ${layers.map((layer) => `
          <span
            class="paper-doll-layer paper-doll-layer-${cssName(layer.slot)} paper-doll-layer-type-${cssName(layer.type || layer.slot)}"
            style="--layer-img:url('${assetUrl(layer.src)}');${boundsStyle(layer.bounds)}"
            ${warpAttr(layer.bounds)}
            aria-hidden="true"
          ></span>
        `).join("")}
      </div>
    `;
  }

  function renderPaperDolls(outfit, expression, character = getCharacter?.()) {
    document.querySelectorAll("[data-doll]").forEach((doll) => {
      doll.innerHTML = avatarMarkup(doll.dataset.doll || "side", outfit, character);
      doll.dataset.characterId = character?.id || "";
      doll.dataset.hairstyle = outfit.hairstyle || "none";
      doll.dataset.outfit = outfit.outfit || "none";
      doll.dataset.shoes = outfit.shoes || "none";
      doll.dataset.headTop = outfit.headTop || "none";
      doll.dataset.headSide = outfit.headSide || "none";
      doll.dataset.faceEyes = outfit.faceEyes || "none";
      doll.dataset.faceMask = outfit.faceMask || "none";
      doll.dataset.neck = outfit.neck || "none";
      doll.dataset.hand = outfit.hand || "none";
      doll.dataset.expression = expression;
      applyLayerTransforms(doll);
      warpObserver?.observe(doll);
    });
  }

  function activePaperDollLayers(outfitState = {}, character = getCharacter?.()) {
    const layersBySlot = new Map(layerOrder.map((slot) => [slot, []]));
    layersBySlot.get("base").push({ slot: "base", type: "base", src: character?.baseLayer || baseLayer });
    // issue #214：base＝共用 neck-down body，其上疊 per-character head（臉＋預設髮）。
    // head 為角色識別層、置於 base 與 hairstyle 之間，使髮型 wardrobe layer 可完全覆蓋預設髮。
    if (character?.headLayer) {
      layersBySlot.get("head")?.push({ slot: "head", type: "head", src: character.headLayer });
    }
    const slots = [
      "hairstyle",
      "outfit",
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
      // 目標矩形（#176）：以畫布相對百分比定位，素材經 background-size 非等比填滿；
      // 落點與尺度由矩形決定、不隨來圖外框漂移。四角形變 warp（corners／舊 inset）另由
      // applyLayerTransforms 以投影 matrix3d 套用（見下，issue #191）。
      const pct = {
        top: (box.top / canvasHeight) * 100,
        right: ((canvasWidth - box.right) / canvasWidth) * 100,
        bottom: ((canvasHeight - box.bottom) / canvasHeight) * 100,
        left: (box.left / canvasWidth) * 100
      };
      return [
        ...["top", "right", "bottom", "left"].map((edge) => `--layer-${edge}:${Math.round(pct[edge] * 1000) / 1000}%`),
        "--layer-fit:100% 100%"
      ].join(";");
    }
    return ["top", "right", "bottom", "left"]
      .map((edge) => `--layer-${edge}:${Number.isFinite(bounds[edge]) ? bounds[edge] : 0}px`)
      .join(";");
  }

  // 四角形變（#191）：targetBox 帶 corners（或舊 topInset／bottomInset）時，warpFractions
  // 換算成四角相對渲染元素之比例存進 data-warp，渲染後由 applyLayerTransforms 套 matrix3d。
  function warpAttr(bounds = {}) {
    const box = bounds.targetBox;
    if (!box) return "";
    const fr = warpFractions(box);
    return fr ? `data-warp="${fr.map((v) => Math.round(v * 1e4) / 1e4).join(",")}"` : "";
  }

  // 對帶 data-warp 的 layer 以實際渲染尺寸算投影 matrix3d，把矩形映到任意四邊形。
  function applyLayerTransforms(container) {
    if (!container) return;
    container.querySelectorAll(".paper-doll-layer[data-warp]").forEach((el) => {
      const f = String(el.dataset.warp).split(",").map(Number);
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h || f.length < 8 || f.some((v) => !Number.isFinite(v))) { el.style.transform = ""; return; }
      el.style.transformOrigin = "0 0";
      el.style.transform = warpMatrix(w, h, f);
    });
  }

  // f = [nwX,nwY, neX,neY, swX,swY, seX,seY]，比例 → 乘渲染寬高得目標四角（順序 nw,ne,sw,se）。
  function warpMatrix(w, h, f) {
    const t = general2DProjection(
      0, 0, w, 0, 0, h, w, h,
      f[0] * w, f[1] * h, f[2] * w, f[3] * h, f[4] * w, f[5] * h, f[6] * w, f[7] * h
    );
    for (let i = 0; i < 9; i++) t[i] = t[i] / t[8];
    const m = [t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]];
    return `matrix3d(${m.map((v) => Math.round(v * 1e6) / 1e6).join(",")})`;
  }

  // 投影矩陣工具（map 任意四邊形）。
  function adj(m) {
    return [
      m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
      m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
      m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]
    ];
  }
  function multmm(a, b) {
    const c = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j]; c[3 * i + j] = s; }
    return c;
  }
  function multmv(m, v) {
    return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
  }
  function basisToPoints(x1, y1, x2, y2, x3, y3, x4, y4) {
    const m = [x1, x2, x3, y1, y2, y3, 1, 1, 1];
    const v = multmv(adj(m), [x4, y4, 1]);
    return multmm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
  }
  function general2DProjection(a1, b1, a2, b2, a3, b3, a4, b4, x1, y1, x2, y2, x3, y3, x4, y4) {
    const s = basisToPoints(a1, b1, a2, b2, a3, b3, a4, b4);
    const d = basisToPoints(x1, y1, x2, y2, x3, y3, x4, y4);
    return multmm(d, adj(s));
  }

  const warpObserver = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver((entries) => entries.forEach((e) => applyLayerTransforms(e.target)))
    : null;

  function cssName(value = "unknown") {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "-");
  }

  return { avatarMarkup, renderPaperDolls, applyLayerTransforms };
}
