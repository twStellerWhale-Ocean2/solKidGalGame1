// issue #272：衣物對位即時調整 overlay（<dialog> 全螢幕覆蓋，獨立容器，不嵌入現有遊戲表單 DOM）。
// 五組滑桿（中心X/Y、寬、高、旋轉）即時更新 paper-doll 預覽（不呼叫 server）；
// 「儲存」POST /tool/apply-wardrobe；「取消」丟棄。

const CANVAS_W = 512;
const CANVAS_H = 768;

export function openAdjustOverlay({ item, outfit, renderer, getCharacter, onSave }) {
  const layer = item.layers?.[0];
  const box = layer?.bounds?.targetBox || null;

  // 初始滑桿值（由 targetBox 換算 center/size，或預設全畫布）
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

  const previewDoll = dialog.querySelector(".adjust-preview-doll");

  // 以暫時穿上目標單品的 outfit 渲染預覽（無論目前是否穿著）
  const previewOutfit = { ...outfit, [item.type]: item.id };
  previewDoll.innerHTML = renderer.avatarMarkup("side", previewOutfit, getCharacter?.());
  renderer.applyLayerTransforms(previewDoll);
  updateTargetLayer();

  // 找目標 layer 元素
  function targetLayerEl() {
    const cssSlot = (item.layers?.[0]?.slot || item.type).replace(/[^a-zA-Z0-9_-]/g, "-");
    return previewDoll.querySelector(`.paper-doll-layer-type-${cssSlot}`);
  }

  // 用滑桿值即時更新目標 layer CSS（不呼叫 server）
  function updateTargetLayer() {
    const el = targetLayerEl();
    if (!el) return;

    let left = sliders.cx - sliders.w / 2;
    let top  = sliders.cy - sliders.h / 2;
    let right  = left + sliders.w;
    let bottom = top  + sliders.h;
    // 邊界保護
    left   = Math.max(0, left);
    top    = Math.max(0, top);
    right  = Math.min(CANVAS_W, right);
    bottom = Math.min(CANVAS_H, bottom);
    if (right <= left)   right  = left + 1;
    if (bottom <= top)   bottom = top  + 1;

    el.style.setProperty("--layer-top",    `${(top                    / CANVAS_H) * 100}%`);
    el.style.setProperty("--layer-right",  `${((CANVAS_W - right)     / CANVAS_W) * 100}%`);
    el.style.setProperty("--layer-bottom", `${((CANVAS_H - bottom)    / CANVAS_H) * 100}%`);
    el.style.setProperty("--layer-left",   `${(left                   / CANVAS_W) * 100}%`);
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

  // 滑桿事件
  const sliderDefs = [
    { id: "adj-cx", key: "cx", valId: "adj-cx-val", fmt: (v) => Math.round(v) },
    { id: "adj-cy", key: "cy", valId: "adj-cy-val", fmt: (v) => Math.round(v) },
    { id: "adj-w",  key: "w",  valId: "adj-w-val",  fmt: (v) => Math.round(v) },
    { id: "adj-h",  key: "h",  valId: "adj-h-val",  fmt: (v) => Math.round(v) },
    { id: "adj-r",  key: "r",  valId: "adj-r-val",  fmt: (v) => `${Math.round(v)}°` }
  ];
  sliderDefs.forEach(({ id, key, valId, fmt }) => {
    const input = dialog.querySelector(`#${id}`);
    const valEl = dialog.querySelector(`#${valId}`);
    if (!input) return;
    input.addEventListener("input", () => {
      sliders[key] = parseFloat(input.value);
      if (valEl) valEl.textContent = fmt(sliders[key]);
      updateTargetLayer();
    });
  });

  // 關閉輔助
  function closeDialog() {
    dialog.close();
    dialog.remove();
  }

  // 取消
  dialog.querySelector("#adj-cancel").addEventListener("click", closeDialog);

  // Escape 鍵取消（<dialog> 預設行為，但要確保移除 DOM）
  dialog.addEventListener("cancel", () => { dialog.remove(); });

  // 儲存
  dialog.querySelector("#adj-save").addEventListener("click", async () => {
    const saveBtn = dialog.querySelector("#adj-save");
    const errEl   = dialog.querySelector("#adj-error");
    saveBtn.disabled = true;
    saveBtn.textContent = "儲存中…";
    errEl.hidden = true;

    // 逆算 targetBox
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
