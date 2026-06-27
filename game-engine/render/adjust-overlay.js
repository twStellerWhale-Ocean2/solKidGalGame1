// issue #272: cloth alignment overlay (<dialog>).
// Left panel: zoomable/pannable paper-doll preview with SVG drag handles.
// Right panel: sliders (Center X/Y, Width, Height, Rotate) synced bidirectionally.
// Actions: Cancel | Reset | Save (POST /tool/apply-wardrobe).

const CANVAS_W  = 512;
const CANVAS_H  = 768;
const HANDLE_R  = 5;
const ROT_R     = 6;
const ROT_OFFSET = 30;
const ZOOM_MIN  = 0.5;
const ZOOM_MAX  = 5;
const ZOOM_STEP = 1.3;

export function openAdjustOverlay({ item, outfit, renderer, getCharacter, onSave }) {
  const layer = item.layers?.[0];
  const box   = layer?.bounds?.targetBox || null;

  const initCX = box ? (box.left + box.right)  / 2 : CANVAS_W / 2;
  const initCY = box ? (box.top  + box.bottom) / 2 : CANVAS_H / 2;
  const initW  = box ? (box.right  - box.left) : CANVAS_W;
  const initH  = box ? (box.bottom - box.top)  : CANVAS_H;
  const initR  = item.rotation ?? 0;

  const sliders = { cx: initCX, cy: initCY, w: initW, h: initH, r: initR };

  const dialog = document.createElement("dialog");
  dialog.className = "adjust-overlay";
  dialog.innerHTML = `
    <div class="adjust-overlay-content">
      <div class="adjust-overlay-preview">
        <div class="adjust-preview-inner">
          <div class="paper-doll adjust-preview-doll" aria-hidden="true"></div>
          <svg class="adjust-handles-svg" aria-hidden="true"></svg>
        </div>
        <div class="adjust-zoom-controls">
          <button type="button" class="adj-zoom-btn" data-zoom="out"   aria-label="Zoom out">−</button>
          <button type="button" class="adj-zoom-btn" data-zoom="reset" aria-label="Reset zoom">⊙</button>
          <button type="button" class="adj-zoom-btn" data-zoom="in"    aria-label="Zoom in">＋</button>
        </div>
      </div>
      <div class="adjust-overlay-controls">
        <h2 class="adjust-title">${escHtml(item.name)}</h2>
        <div class="adjust-sliders">
          <label class="adjust-slider-row">
            <span class="adjust-slider-label">Center X</span>
            <span class="adjust-slider-val" id="adj-cx-val">${Math.round(initCX)}</span>
            <input class="adjust-range" type="range" id="adj-cx" min="0" max="${CANVAS_W}" step="1" value="${Math.round(initCX)}">
          </label>
          <label class="adjust-slider-row">
            <span class="adjust-slider-label">Center Y</span>
            <span class="adjust-slider-val" id="adj-cy-val">${Math.round(initCY)}</span>
            <input class="adjust-range" type="range" id="adj-cy" min="0" max="${CANVAS_H}" step="1" value="${Math.round(initCY)}">
          </label>
          <label class="adjust-slider-row">
            <span class="adjust-slider-label">Width</span>
            <span class="adjust-slider-val" id="adj-w-val">${Math.round(initW)}</span>
            <input class="adjust-range" type="range" id="adj-w" min="1" max="${CANVAS_W}" step="1" value="${Math.round(initW)}">
          </label>
          <label class="adjust-slider-row">
            <span class="adjust-slider-label">Height</span>
            <span class="adjust-slider-val" id="adj-h-val">${Math.round(initH)}</span>
            <input class="adjust-range" type="range" id="adj-h" min="1" max="${CANVAS_H}" step="1" value="${Math.round(initH)}">
          </label>
          <label class="adjust-slider-row">
            <span class="adjust-slider-label">Rotate</span>
            <span class="adjust-slider-val" id="adj-r-val">${Math.round(initR)}°</span>
            <input class="adjust-range" type="range" id="adj-r" min="-180" max="180" step="1" value="${Math.round(initR)}">
          </label>
        </div>
        <p class="adjust-error" id="adj-error" hidden></p>
        <div class="adjust-overlay-actions">
          <button type="button" id="adj-cancel" class="choice-button leave-choice">Cancel</button>
          <button type="button" id="adj-reset"  class="choice-button">Reset</button>
          <button type="button" id="adj-save"   class="shop-buy-button">Save</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  const outerPreview = dialog.querySelector(".adjust-overlay-preview");
  const innerEl      = dialog.querySelector(".adjust-preview-inner");
  const previewDoll  = dialog.querySelector(".adjust-preview-doll");
  const svgEl        = dialog.querySelector(".adjust-handles-svg");

  // ── View state (zoom + pan) ──────────────────────────────────────────────
  let viewZoom = 1;
  let viewPanX = 0;
  let viewPanY = 0;

  function applyViewState() {
    const ow = outerPreview.clientWidth;
    const oh = outerPreview.clientHeight;
    if (!ow || !oh) return;
    const iw = ow * viewZoom;
    const ih = oh * viewZoom;
    innerEl.style.width  = iw + "px";
    innerEl.style.height = ih + "px";
    innerEl.style.left   = ((ow - iw) / 2 + viewPanX) + "px";
    innerEl.style.top    = ((oh - ih) / 2 + viewPanY) + "px";
    renderHandles();
  }

  const ro = new ResizeObserver(() => applyViewState());
  ro.observe(outerPreview);
  dialog.addEventListener("close", () => ro.disconnect());

  // ── Paper-doll preview ───────────────────────────────────────────────────
  const previewOutfit = { ...outfit, [item.type]: item.id };
  previewDoll.innerHTML = renderer.avatarMarkup("side", previewOutfit, getCharacter?.());
  renderer.applyLayerTransforms(previewDoll);

  function targetLayerEl() {
    const slot = (item.layers?.[0]?.slot || item.type).replace(/[^a-zA-Z0-9_-]/g, "-");
    return previewDoll.querySelector(`.paper-doll-layer-type-${slot}`);
  }

  function updateTargetLayer() {
    const el = targetLayerEl();
    if (!el) return;
    let l = sliders.cx - sliders.w / 2;
    let t = sliders.cy - sliders.h / 2;
    let r = l + sliders.w;
    let b = t + sliders.h;
    l = Math.max(0, l); t = Math.max(0, t);
    r = Math.min(CANVAS_W, r); b = Math.min(CANVAS_H, b);
    if (r <= l) r = l + 1;
    if (b <= t) b = t + 1;
    el.style.setProperty("--layer-top",    `${(t              / CANVAS_H) * 100}%`);
    el.style.setProperty("--layer-right",  `${((CANVAS_W - r) / CANVAS_W) * 100}%`);
    el.style.setProperty("--layer-bottom", `${((CANVAS_H - b) / CANVAS_H) * 100}%`);
    el.style.setProperty("--layer-left",   `${(l              / CANVAS_W) * 100}%`);
    el.style.setProperty("--layer-fit",    "100% 100%");
    if (sliders.r !== 0) {
      el.style.transformOrigin = "center center";
      el.style.transform = `rotate(${sliders.r}deg)`;
    } else {
      el.style.transform = "";
      el.style.transformOrigin = "";
    }
  }

  // ── Sliders ──────────────────────────────────────────────────────────────
  const sliderDefs = [
    { id: "adj-cx", key: "cx", valId: "adj-cx-val", fmt: (v) => Math.round(v) },
    { id: "adj-cy", key: "cy", valId: "adj-cy-val", fmt: (v) => Math.round(v) },
    { id: "adj-w",  key: "w",  valId: "adj-w-val",  fmt: (v) => Math.round(v) },
    { id: "adj-h",  key: "h",  valId: "adj-h-val",  fmt: (v) => Math.round(v) },
    { id: "adj-r",  key: "r",  valId: "adj-r-val",  fmt: (v) => `${Math.round(v)}°` },
  ];

  function syncSliderDisplay() {
    sliderDefs.forEach(({ id, key, valId, fmt }) => {
      const inp = dialog.querySelector(`#${id}`);
      const val = dialog.querySelector(`#${valId}`);
      if (inp) inp.value = sliders[key];
      if (val) val.textContent = fmt(sliders[key]);
    });
  }

  sliderDefs.forEach(({ id, key }) => {
    dialog.querySelector(`#${id}`)?.addEventListener("input", (e) => {
      sliders[key] = parseFloat(e.target.value);
      syncSliderDisplay();
      updateTargetLayer();
      renderHandles();
    });
  });

  // ── SVG handles (coordinate space = inner div) ───────────────────────────
  function renderHandles() {
    const w = innerEl.clientWidth;
    const h = innerEl.clientHeight;
    if (!w || !h) return;
    const sx = w / CANVAS_W, sy = h / CANVAS_H;
    const bl = (sliders.cx - sliders.w / 2) * sx;
    const bt = (sliders.cy - sliders.h / 2) * sy;
    const br = (sliders.cx + sliders.w / 2) * sx;
    const bb = (sliders.cy + sliders.h / 2) * sy;
    const mx = (bl + br) / 2, my = (bt + bb) / 2;
    const ry = Math.max(ROT_R, bt - ROT_OFFSET);
    svgEl.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svgEl.setAttribute("width", w);
    svgEl.setAttribute("height", h);
    const hc = (cx, cy, r, hdl, cur, fill, stroke) =>
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" data-handle="${hdl}" style="cursor:${cur}"/>`;
    svgEl.innerHTML = `
      <rect x="${bl}" y="${bt}" width="${br-bl}" height="${bb-bt}"
        fill="none" stroke="rgba(194,23,90,0.85)" stroke-width="1.5" stroke-dasharray="5 3" pointer-events="none"/>
      <line x1="${mx}" y1="${bt}" x2="${mx}" y2="${ry}"
        stroke="rgba(194,23,90,0.65)" stroke-width="1.5" pointer-events="none"/>
      ${hc(mx,my,5,"move","move","rgba(194,23,90,0.45)","rgba(194,23,90,0.7)")}
      ${["nw","ne","sw","se"].map((h,i)=>hc(i%2?br:bl,i<2?bt:bb,HANDLE_R,h,`${h}-resize`,"rgba(255,255,255,0.92)","rgba(194,23,90,0.9)")).join("")}
      ${[["n",mx,bt,"ns-resize"],["s",mx,bb,"ns-resize"],["w",bl,my,"ew-resize"],["e",br,my,"ew-resize"]]
          .map(([h,cx,cy,cur])=>hc(cx,cy,HANDLE_R-1,h,cur,"rgba(255,255,255,0.85)","rgba(194,23,90,0.75)")).join("")}
      ${hc(mx,ry,ROT_R,"rotate","grab","rgba(255,255,255,0.96)","rgba(194,23,90,0.9)")}
    `;
    svgEl.style.cursor = "grab";
  }

  // ── Pointer events: handle drag + background pan ──────────────────────────
  let dragState = null;
  let panState  = null;

  svgEl.addEventListener("pointerdown", (e) => {
    const hdl = e.target.dataset?.handle;
    e.preventDefault();
    svgEl.setPointerCapture(e.pointerId);
    if (hdl) {
      const rect = innerEl.getBoundingClientRect();
      dragState = { handle: hdl, startX: e.clientX, startY: e.clientY,
        s: { ...sliders }, sx: CANVAS_W / rect.width, sy: CANVAS_H / rect.height, rect };
      panState = null;
    } else {
      panState  = { startX: e.clientX, startY: e.clientY, startPanX: viewPanX, startPanY: viewPanY };
      dragState = null;
      svgEl.style.cursor = "grabbing";
    }
  });

  svgEl.addEventListener("pointermove", (e) => {
    if (panState) {
      viewPanX = panState.startPanX + (e.clientX - panState.startX);
      viewPanY = panState.startPanY + (e.clientY - panState.startY);
      applyViewState();
      return;
    }
    if (!dragState) return;
    const { handle, startX, startY, s, sx, sy, rect } = dragState;
    const dx = (e.clientX - startX) * sx;
    const dy = (e.clientY - startY) * sy;
    switch (handle) {
      case "move": sliders.cx = Math.max(0,Math.min(CANVAS_W,s.cx+dx)); sliders.cy = Math.max(0,Math.min(CANVAS_H,s.cy+dy)); break;
      case "nw":   sliders.cx=s.cx+dx/2; sliders.cy=s.cy+dy/2; sliders.w=Math.max(10,s.w-dx); sliders.h=Math.max(10,s.h-dy); break;
      case "ne":   sliders.cx=s.cx+dx/2; sliders.cy=s.cy+dy/2; sliders.w=Math.max(10,s.w+dx); sliders.h=Math.max(10,s.h-dy); break;
      case "sw":   sliders.cx=s.cx+dx/2; sliders.cy=s.cy+dy/2; sliders.w=Math.max(10,s.w-dx); sliders.h=Math.max(10,s.h+dy); break;
      case "se":   sliders.cx=s.cx+dx/2; sliders.cy=s.cy+dy/2; sliders.w=Math.max(10,s.w+dx); sliders.h=Math.max(10,s.h+dy); break;
      case "n":    sliders.cy=s.cy+dy/2; sliders.h=Math.max(10,s.h-dy); break;
      case "s":    sliders.cy=s.cy+dy/2; sliders.h=Math.max(10,s.h+dy); break;
      case "w":    sliders.cx=s.cx+dx/2; sliders.w=Math.max(10,s.w-dx); break;
      case "e":    sliders.cx=s.cx+dx/2; sliders.w=Math.max(10,s.w+dx); break;
      case "rotate": {
        const cxPx = rect.left + (s.cx / CANVAS_W) * rect.width;
        const cyPx = rect.top  + (s.cy / CANVAS_H) * rect.height;
        const a0 = Math.atan2(startY - cyPx, startX - cxPx);
        const a1 = Math.atan2(e.clientY - cyPx, e.clientX - cxPx);
        sliders.r = Math.max(-180, Math.min(180, s.r + (a1 - a0) * 180 / Math.PI));
        break;
      }
    }
    syncSliderDisplay(); updateTargetLayer(); renderHandles();
  });

  function endDrag() { dragState = null; panState = null; svgEl.style.cursor = "grab"; }
  svgEl.addEventListener("pointerup",     endDrag);
  svgEl.addEventListener("pointercancel", endDrag);

  // ── Wheel zoom (centered on mouse) ───────────────────────────────────────
  outerPreview.addEventListener("wheel", (e) => {
    e.preventDefault();
    const factor   = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    const newZoom  = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, viewZoom * factor));
    const or       = outerPreview.getBoundingClientRect();
    const mx       = e.clientX - or.left - or.width  / 2;
    const my       = e.clientY - or.top  - or.height / 2;
    const zf       = newZoom / viewZoom;
    viewPanX = mx + (viewPanX - mx) * zf;
    viewPanY = my + (viewPanY - my) * zf;
    viewZoom = newZoom;
    applyViewState();
  }, { passive: false });

  // ── Zoom buttons ─────────────────────────────────────────────────────────
  outerPreview.querySelector('[data-zoom="in"]').addEventListener("click", () => {
    viewZoom = Math.min(ZOOM_MAX, viewZoom * ZOOM_STEP); applyViewState();
  });
  outerPreview.querySelector('[data-zoom="out"]').addEventListener("click", () => {
    viewZoom = Math.max(ZOOM_MIN, viewZoom / ZOOM_STEP); applyViewState();
  });
  outerPreview.querySelector('[data-zoom="reset"]').addEventListener("click", () => {
    viewZoom = 1; viewPanX = 0; viewPanY = 0; applyViewState();
  });

  // ── Initial render ───────────────────────────────────────────────────────
  updateTargetLayer();
  renderHandles();
  requestAnimationFrame(() => applyViewState());

  // ── Dialog actions ───────────────────────────────────────────────────────
  function closeDialog() { dialog.close(); dialog.remove(); }

  dialog.querySelector("#adj-cancel").addEventListener("click", closeDialog);
  dialog.addEventListener("cancel", () => dialog.remove());

  dialog.querySelector("#adj-reset").addEventListener("click", () => {
    sliders.cx = initCX; sliders.cy = initCY;
    sliders.w  = initW;  sliders.h  = initH;  sliders.r = initR;
    syncSliderDisplay(); updateTargetLayer(); renderHandles();
  });

  dialog.querySelector("#adj-save").addEventListener("click", async () => {
    const saveBtn = dialog.querySelector("#adj-save");
    const errEl   = dialog.querySelector("#adj-error");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";
    errEl.hidden = true;

    let l = sliders.cx - sliders.w / 2, t = sliders.cy - sliders.h / 2;
    let r = l + sliders.w,              b = t + sliders.h;
    l = Math.max(0, l); t = Math.max(0, t);
    r = Math.min(CANVAS_W, r); b = Math.min(CANVAS_H, b);
    if (r <= l) r = l + 1; if (b <= t) b = t + 1;

    const newTargetBox = { left: l, top: t, right: r, bottom: b };
    const newRotation  = sliders.r;
    const packKey      = `${item.pack}/${item.asset}`;
    const payload      = { ...newTargetBox, ...(newRotation !== 0 ? { rotation: newRotation } : {}) };

    try {
      const res    = await fetch("/tool/apply-wardrobe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxes: { [packKey]: payload } }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || "server error");
      closeDialog();
      onSave?.(item.id, newTargetBox, newRotation);
    } catch (err) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save";
      errEl.textContent = `Save failed: ${err.message}`;
      errEl.hidden = false;
    }
  });

  dialog.showModal();
  return dialog;
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
