// issue #272：衣物對位即時調整 overlay（<dialog> 全螢幕覆蓋，獨立容器）。
// 左側 paper-doll 預覽含 SVG 互動拖拽框（8 縮放 handle + 旋轉 handle + 移動）；
// 右側五組滑桿（中心X/Y、寬、高、旋轉），雙向同步。
// 「儲存」POST /tool/apply-wardrobe；「取消」丟棄。

const CANVAS_W = 512;
const CANVAS_H = 768;
const HANDLE_R = 5;
const ROT_R = 6;
const ROT_OFFSET = 30;

export function openAdjustOverlay({ item, outfit, renderer, getCharacter, onSave }) {
  const layer = item.layers?.[0];
  const box = layer?.bounds?.targetBox || null;

  const initCX = box ? (box.left + box.right) / 2 : CANVAS_W / 2;
  const initCY = box ? (box.top + box.bottom) / 2 : CANVAS_H / 2;
  const initW  = box ? (box.right - box.left) : CANVAS_W;
  const initH  = box ? (box.bottom - box.top) : CANVAS_H;
  const initR  = item.rotation ?? 0;

  const sliders = { cx: initCX, cy: initCY, w: initW, h: initH, r: initR };

  const dialog = document.createElement("dialog");
  dialog.className = "adjust-overlay";
  dialog.innerHTML = `
    <div class="adjust-overlay-content">
      <div class="adjust-overlay-preview">
        <div class="paper-doll adjust-preview-doll" aria-hidden="true"></div>
        <svg class="adjust-handles-svg" aria-hidden="true"></svg>
      </div>
      <div class="adjust-overlay-controls">
        <h2 class="adjust-title">${escHtml(item.name)}</h2>
        <div class="adjust-sliders">
          <label class="adjust-slider-row">
            <span class="adjust-slider-label">中心 X</span>
            <span class="adjust-slider-val" id="adj-cx-val">${Math.round(initCX)}</span>
            <input class="adjust-range" type="range" id="adj-cx" min="0" max="${CANVAS_W}" step="1" value="${Math.round(initCX)}">
          </label>
          <label class="adjust-slider-row">
            <span class="adjust-slider-label">中心 Y</span>
            <span class="adjust-slider-val" id="adj-cy-val">${Math.round(initCY)}</span>
            <input class="adjust-range" type="range" id="adj-cy" min="0" max="${CANVAS_H}" step="1" value="${Math.round(initCY)}">
          </label>
          <label class="adjust-slider-row">
            <span class="adjust-slider-label">寬</span>
            <span class="adjust-slider-val" id="adj-w-val">${Math.round(initW)}</span>
            <input class="adjust-range" type="range" id="adj-w" min="1" max="${CANVAS_W}" step="1" value="${Math.round(initW)}">
          </label>
          <label class="adjust-slider-row">
            <span class="adjust-slider-label">高</span>
            <span class="adjust-slider-val" id="adj-h-val">${Math.round(initH)}</span>
            <input class="adjust-range" type="range" id="adj-h" min="1" max="${CANVAS_H}" step="1" value="${Math.round(initH)}">
          </label>
          <label class="adjust-slider-row">
            <span class="adjust-slider-label">旋轉</span>
            <span class="adjust-slider-val" id="adj-r-val">${Math.round(initR)}°</span>
            <input class="adjust-range" type="range" id="adj-r" min="-180" max="180" step="1" value="${Math.round(initR)}">
          </label>
        </div>
        <p class="adjust-error" id="adj-error" hidden></p>
        <div class="adjust-overlay-actions">
          <button type="button" id="adj-cancel" class="choice-button leave-choice">取消</button>
          <button type="button" id="adj-save" class="shop-buy-button">儲存</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  const previewContainer = dialog.querySelector(".adjust-overlay-preview");
  const previewDoll = dialog.querySelector(".adjust-preview-doll");
  const svgEl = dialog.querySelector(".adjust-handles-svg");

  // 渲染預覽娃娃（暫時穿上目標單品）
  const previewOutfit = { ...outfit, [item.type]: item.id };
  previewDoll.innerHTML = renderer.avatarMarkup("side", previewOutfit, getCharacter?.());
  renderer.applyLayerTransforms(previewDoll);

  // 找目標 layer 元素
  function targetLayerEl() {
    const cssSlot = (item.layers?.[0]?.slot || item.type).replace(/[^a-zA-Z0-9_-]/g, "-");
    return previewDoll.querySelector(`.paper-doll-layer-type-${cssSlot}`);
  }

  // 用 sliders 即時更新目標 layer CSS（不呼叫 server）
  function updateTargetLayer() {
    const el = targetLayerEl();
    if (!el) return;

    let left   = sliders.cx - sliders.w / 2;
    let top    = sliders.cy - sliders.h / 2;
    let right  = left + sliders.w;
    let bottom = top  + sliders.h;
    left   = Math.max(0, left);
    top    = Math.max(0, top);
    right  = Math.min(CANVAS_W, right);
    bottom = Math.min(CANVAS_H, bottom);
    if (right <= left)   right  = left + 1;
    if (bottom <= top)   bottom = top  + 1;

    el.style.setProperty("--layer-top",    `${(top                 / CANVAS_H) * 100}%`);
    el.style.setProperty("--layer-right",  `${((CANVAS_W - right)  / CANVAS_W) * 100}%`);
    el.style.setProperty("--layer-bottom", `${((CANVAS_H - bottom) / CANVAS_H) * 100}%`);
    el.style.setProperty("--layer-left",   `${(left                / CANVAS_W) * 100}%`);
    el.style.setProperty("--layer-fit",    "100% 100%");

    const r = sliders.r;
    if (r !== 0) {
      el.style.transformOrigin = "center center";
      el.style.transform = `rotate(${r}deg)`;
    } else {
      el.style.transform = "";
      el.style.transformOrigin = "";
    }
  }

  // 同步滑桿 input 值與顯示文字
  const sliderDefs = [
    { id: "adj-cx", key: "cx", valId: "adj-cx-val", fmt: (v) => Math.round(v) },
    { id: "adj-cy", key: "cy", valId: "adj-cy-val", fmt: (v) => Math.round(v) },
    { id: "adj-w",  key: "w",  valId: "adj-w-val",  fmt: (v) => Math.round(v) },
    { id: "adj-h",  key: "h",  valId: "adj-h-val",  fmt: (v) => Math.round(v) },
    { id: "adj-r",  key: "r",  valId: "adj-r-val",  fmt: (v) => `${Math.round(v)}°` }
  ];

  function syncSliderDisplay() {
    sliderDefs.forEach(({ id, key, valId, fmt }) => {
      const inp = dialog.querySelector(`#${id}`);
      const val = dialog.querySelector(`#${valId}`);
      if (inp) inp.value = sliders[key];
      if (val) val.textContent = fmt(sliders[key]);
    });
  }

  // SVG 互動拖拽框
  function renderHandles() {
    const w = previewContainer.clientWidth;
    const h = previewContainer.clientHeight;
    if (!w || !h) return;

    const sx = w / CANVAS_W;
    const sy = h / CANVAS_H;
    const bl = (sliders.cx - sliders.w / 2) * sx;
    const bt = (sliders.cy - sliders.h / 2) * sy;
    const br = (sliders.cx + sliders.w / 2) * sx;
    const bb = (sliders.cy + sliders.h / 2) * sy;
    const mx = (bl + br) / 2;
    const my = (bt + bb) / 2;
    const ry = Math.max(ROT_R, bt - ROT_OFFSET);

    svgEl.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svgEl.setAttribute("width", w);
    svgEl.setAttribute("height", h);

    const hCircle = (cx, cy, r, handle, cursor, fill, stroke) =>
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" data-handle="${handle}" style="cursor:${cursor}"/>`;

    svgEl.innerHTML = `
      <rect x="${bl}" y="${bt}" width="${br - bl}" height="${bb - bt}"
        fill="none" stroke="rgba(194,23,90,0.85)" stroke-width="1.5" stroke-dasharray="5 3" pointer-events="none"/>
      <line x1="${mx}" y1="${bt}" x2="${mx}" y2="${ry}"
        stroke="rgba(194,23,90,0.65)" stroke-width="1.5" pointer-events="none"/>
      ${hCircle(mx, my, 5, "move", "move", "rgba(194,23,90,0.45)", "rgba(194,23,90,0.7)")}
      ${["nw","ne","sw","se"].map((h, i) => {
        const cx = i % 2 === 0 ? bl : br;
        const cy = i < 2 ? bt : bb;
        const cur = `${h}-resize`;
        return hCircle(cx, cy, HANDLE_R, h, cur, "rgba(255,255,255,0.92)", "rgba(194,23,90,0.9)");
      }).join("")}
      ${[["n",mx,bt,"ns-resize"],["s",mx,bb,"ns-resize"],["w",bl,my,"ew-resize"],["e",br,my,"ew-resize"]].map(
        ([h, cx, cy, cur]) => hCircle(cx, cy, HANDLE_R - 1, h, cur, "rgba(255,255,255,0.85)", "rgba(194,23,90,0.75)")
      ).join("")}
      ${hCircle(mx, ry, ROT_R, "rotate", "grab", "rgba(255,255,255,0.96)", "rgba(194,23,90,0.9)")}
    `;
  }

  // 拖拽狀態
  let dragState = null;

  svgEl.addEventListener("pointerdown", (e) => {
    const handle = e.target.dataset.handle;
    if (!handle) return;
    e.preventDefault();
    svgEl.setPointerCapture(e.pointerId);
    const rect = previewContainer.getBoundingClientRect();
    dragState = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      s: { ...sliders },
      sx: CANVAS_W / rect.width,
      sy: CANVAS_H / rect.height,
      rect
    };
  });

  svgEl.addEventListener("pointermove", (e) => {
    if (!dragState) return;
    const { handle, startX, startY, s, sx, sy, rect } = dragState;
    const dx = (e.clientX - startX) * sx;
    const dy = (e.clientY - startY) * sy;

    switch (handle) {
      case "move":
        sliders.cx = Math.max(0, Math.min(CANVAS_W, s.cx + dx));
        sliders.cy = Math.max(0, Math.min(CANVAS_H, s.cy + dy));
        break;
      case "nw":
        sliders.cx = s.cx + dx / 2; sliders.cy = s.cy + dy / 2;
        sliders.w = Math.max(10, s.w - dx); sliders.h = Math.max(10, s.h - dy);
        break;
      case "ne":
        sliders.cx = s.cx + dx / 2; sliders.cy = s.cy + dy / 2;
        sliders.w = Math.max(10, s.w + dx); sliders.h = Math.max(10, s.h - dy);
        break;
      case "sw":
        sliders.cx = s.cx + dx / 2; sliders.cy = s.cy + dy / 2;
        sliders.w = Math.max(10, s.w - dx); sliders.h = Math.max(10, s.h + dy);
        break;
      case "se":
        sliders.cx = s.cx + dx / 2; sliders.cy = s.cy + dy / 2;
        sliders.w = Math.max(10, s.w + dx); sliders.h = Math.max(10, s.h + dy);
        break;
      case "n":
        sliders.cy = s.cy + dy / 2; sliders.h = Math.max(10, s.h - dy);
        break;
      case "s":
        sliders.cy = s.cy + dy / 2; sliders.h = Math.max(10, s.h + dy);
        break;
      case "w":
        sliders.cx = s.cx + dx / 2; sliders.w = Math.max(10, s.w - dx);
        break;
      case "e":
        sliders.cx = s.cx + dx / 2; sliders.w = Math.max(10, s.w + dx);
        break;
      case "rotate": {
        const cxPx = rect.left + (s.cx / CANVAS_W) * rect.width;
        const cyPx = rect.top  + (s.cy / CANVAS_H) * rect.height;
        const a0 = Math.atan2(startY - cyPx, startX - cxPx);
        const a1 = Math.atan2(e.clientY - cyPx, e.clientX - cxPx);
        const delta = (a1 - a0) * 180 / Math.PI;
        sliders.r = Math.max(-180, Math.min(180, s.r + delta));
        break;
      }
    }

    syncSliderDisplay();
    updateTargetLayer();
    renderHandles();
  });

  svgEl.addEventListener("pointerup",     () => { dragState = null; });
  svgEl.addEventListener("pointercancel", () => { dragState = null; });

  // 滑桿 input 事件（使用者拖滑桿時也更新 handles）
  sliderDefs.forEach(({ id, key }) => {
    const inp = dialog.querySelector(`#${id}`);
    if (!inp) return;
    inp.addEventListener("input", () => {
      sliders[key] = parseFloat(inp.value);
      syncSliderDisplay();
      updateTargetLayer();
      renderHandles();
    });
  });

  // 初始渲染
  updateTargetLayer();
  renderHandles();

  // 關閉輔助
  function closeDialog() {
    dialog.close();
    dialog.remove();
  }

  dialog.querySelector("#adj-cancel").addEventListener("click", closeDialog);
  dialog.addEventListener("cancel", () => { dialog.remove(); });

  // 儲存
  dialog.querySelector("#adj-save").addEventListener("click", async () => {
    const saveBtn = dialog.querySelector("#adj-save");
    const errEl   = dialog.querySelector("#adj-error");
    saveBtn.disabled = true;
    saveBtn.textContent = "儲存中…";
    errEl.hidden = true;

    let left   = sliders.cx - sliders.w / 2;
    let top    = sliders.cy - sliders.h / 2;
    let right  = left + sliders.w;
    let bottom = top  + sliders.h;
    left   = Math.max(0, left);
    top    = Math.max(0, top);
    right  = Math.min(CANVAS_W, right);
    bottom = Math.min(CANVAS_H, bottom);
    if (right <= left)   right  = left + 1;
    if (bottom <= top)   bottom = top  + 1;

    const newTargetBox = { left, top, right, bottom };
    const newRotation  = sliders.r;
    const packKey = `${item.pack}/${item.asset}`;
    const boxPayload = { ...newTargetBox, ...(newRotation !== 0 ? { rotation: newRotation } : {}) };

    try {
      const res = await fetch("/tool/apply-wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxes: { [packKey]: boxPayload } })
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || "server error");
      closeDialog();
      onSave?.(item.id, newTargetBox, newRotation);
    } catch (err) {
      saveBtn.disabled = false;
      saveBtn.textContent = "儲存";
      errEl.textContent = `儲存失敗：${err.message}`;
      errEl.hidden = false;
    }
  });

  dialog.showModal();
  return dialog;
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
