// 衣物分頁手勢互動（issue #297 自 wardrobe-tuner.js 抽出；行為不變＋pinch 縮放）。
// 內容：預覽舞台平移／滾輪／雙指縮放、框拖拉（移動／縮放／四角形變）、
// 左右欄寬拖曳分隔條、類型衣櫃水平拖曳捲動。
// 皆為純互動接線：吃 DOM 與共享 view/state 物件（就地變更），重繪由呼叫端 callback 決定。
import { cornerOffsets } from "../game-engine/render/warp.js";

function clampN(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ② 圖上拖拉：中央移動、四邊中點非等比縮放；四角在單品框＝自由變形、在類型框＝角落縮放。
// opts={ doll, canvas:{W,H}, getBox, isItemMode, commit(box) }；commit 端負責寫入與重繪。
export function setupBoxDrag(overlay, opts) {
  const { doll, canvas, getBox, isItemMode, commit } = opts;
  const pointerCanvas = (e) => {
    const rect = doll.getBoundingClientRect();
    return {
      x: clampN(((e.clientX - rect.left) / rect.width) * canvas.W, 0, canvas.W),
      y: clampN(((e.clientY - rect.top) / rect.height) * canvas.H, 0, canvas.H)
    };
  };
  // 取得 box 正規化後的四角偏移副本（含舊 inset 一律轉成 corners），供拖拉使用。
  const cornersOf = (box) => {
    const o = cornerOffsets(box);
    return { nw: [...o.nw], ne: [...o.ne], sw: [...o.sw], se: [...o.se] };
  };
  const applyDrag = (active, p) => {
    const { handle, start, sx, sy } = active;
    let b = { ...start };
    const corner = handle.length === 2; // nw/ne/sw/se
    if (handle === "move") {
      const w = start.right - start.left; const h = start.bottom - start.top;
      const left = clampN(start.left + (p.x - sx), 0, canvas.W - w); const top = clampN(start.top + (p.y - sy), 0, canvas.H - h);
      b = { ...start, left, top, right: left + w, bottom: top + h };
    } else if (corner && isItemMode()) {
      // 四角形變：角落控制點可各自往任意方向拖拉，成任意四邊形（不改 bounding box）。
      const c = cornersOf(start);
      const ox = handle.includes("e") ? p.x - start.right : p.x - start.left;
      const oy = handle.includes("s") ? p.y - start.bottom : p.y - start.top;
      c[handle] = [ox, oy];
      delete b.topInset; delete b.bottomInset;
      b.corners = c;
    } else {
      if (handle.includes("w")) b.left = clampN(p.x, 0, b.right - 4);
      if (handle.includes("e")) b.right = clampN(p.x, b.left + 4, canvas.W);
      if (handle.includes("n")) b.top = clampN(p.y, 0, b.bottom - 4);
      if (handle.includes("s")) b.bottom = clampN(p.y, b.top + 4, canvas.H);
    }
    commit(b);
  };
  let active = null;
  overlay.addEventListener("pointerdown", (e) => {
    const handle = e.target?.dataset?.h;
    const box = getBox();
    if (!handle || !box) return;
    e.preventDefault();
    try { overlay.setPointerCapture(e.pointerId); } catch { /* noop */ }
    const p = pointerCanvas(e);
    active = { handle, start: { ...box }, sx: p.x, sy: p.y };
  });
  overlay.addEventListener("pointermove", (e) => { if (active) applyDrag(active, pointerCanvas(e)); });
  const end = () => { active = null; };
  overlay.addEventListener("pointerup", end);
  overlay.addEventListener("pointercancel", end);
}

// 預覽舞台平移＋縮放（#297 D20）：單指在空白處拖曳＝平移；滾輪或雙指 pinch＝縮放。
// view={zoom, pan:{x,y}} 為呼叫端共享狀態（就地變更）；apply() 套用 transform。
export function setupStagePanZoom(stage, view, apply) {
  if (!stage) return;
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    view.zoom = clampN(view.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), 0.4, 4);
    apply();
  }, { passive: false });

  const pointers = new Map(); // pointerId → {x,y}
  let pan = null; // 單指平移基準
  let pinch = null; // 雙指縮放基準 {dist, zoom}
  const dist = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  };
  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".box-overlay")) return; // 在框/控制點上 → 讓 overlay 處理
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { stage.setPointerCapture(e.pointerId); } catch { /* noop */ }
    if (pointers.size === 2) {
      pinch = { dist: dist(), zoom: view.zoom };
      pan = null;
    } else if (pointers.size === 1) {
      pan = { sx: e.clientX, sy: e.clientY, px: view.pan.x, py: view.pan.y };
      stage.classList.add("panning");
    }
  });
  stage.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      view.zoom = clampN(pinch.zoom * (dist() / pinch.dist), 0.4, 4);
      apply();
    } else if (pan) {
      view.pan = { x: pan.px + (e.clientX - pan.sx), y: pan.py + (e.clientY - pan.sy) };
      apply();
    }
  });
  const end = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!pointers.size) { pan = null; stage.classList.remove("panning"); }
  };
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
}

// 左右欄皆可拖曳調寬：左分隔條改 --left-w（=clientX）、右分隔條改 --right-w（=innerWidth-clientX）。
export function setupColumnResize(shell, leftResizer, rightResizer) {
  if (!shell) return;
  const bind = (resizer, side) => {
    if (!resizer) return;
    let active = false;
    resizer.addEventListener("pointerdown", (e) => { active = true; try { resizer.setPointerCapture(e.pointerId); } catch { /* noop */ } e.preventDefault(); });
    resizer.addEventListener("pointermove", (e) => {
      if (!active) return;
      if (side === "left") shell.style.setProperty("--left-w", `${clampN(e.clientX, 220, 680)}px`);
      else shell.style.setProperty("--right-w", `${clampN(window.innerWidth - e.clientX, 240, 640)}px`);
    });
    const end = () => { active = false; };
    resizer.addEventListener("pointerup", end);
    resizer.addEventListener("pointercancel", end);
  };
  bind(leftResizer, "left");
  bind(rightResizer, "right");
}

// 衣櫃列水平拖曳捲動：在空白或卡片上按住左右拖即可移動到其他衣櫃；越過門檻才算拖曳，
// 並在拖曳後抑制該次 click，避免誤觸選取單品。容器持久存在（只換 innerHTML），故只綁一次。
export function setupClosetDragScroll(el) {
  if (!el) return;
  let down = null;
  let moved = false;
  let suppressClick = false;
  el.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    down = { x: e.clientX, scroll: el.scrollLeft, id: e.pointerId };
    moved = false;
  });
  el.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    if (!moved && Math.abs(dx) > 6) {
      moved = true;
      el.classList.add("dragging");
      try { el.setPointerCapture(down.id); } catch { /* noop */ }
    }
    if (moved) { el.scrollLeft = down.scroll - dx; e.preventDefault(); }
  });
  const end = () => {
    if (!down) return;
    try { el.releasePointerCapture(down.id); } catch { /* noop */ }
    el.classList.remove("dragging");
    suppressClick = moved;
    down = null;
    moved = false;
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  el.addEventListener("click", (e) => {
    if (suppressClick) { e.stopPropagation(); e.preventDefault(); suppressClick = false; }
  }, true);
}
