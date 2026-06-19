// 衣物單品投影框的四角自由形變（issue #191）。
//
// targetBox 除矩形 left/top/right/bottom（canvas px）外，可帶 corners：四角相對該矩形
// 對應角的 canvas px 偏移，順序固定 nw/ne/sw/se：
//   corners = { nw: [dx, dy], ne: [dx, dy], sw: [dx, dy], se: [dx, dy] }
// 預設（無形變）四角偏移皆為 0、corners 省略。四角可各自往任意方向移動，使投影區成為
// 任意四邊形（非僅左右對稱梯形）。
//
// 相容：舊資料的 topInset/bottomInset（左右對稱等腰梯形，issue #176）等價於
//   nw=[+topInset,0], ne=[-topInset,0], sw=[+bottomInset,0], se=[-bottomInset,0]
// 讀取一律經 cornerOffsets() 正規化為四角偏移，新匯出只寫 corners、汰除 inset，維持單一真相。

const CORNER_KEYS = ["nw", "ne", "sw", "se"];

function pair(v) {
  return Array.isArray(v) ? [Number(v[0]) || 0, Number(v[1]) || 0] : [0, 0];
}

// 把任一形態的 box（corners／舊 inset／無形變）正規化為四角 px 偏移 { nw,ne,sw,se }。
export function cornerOffsets(box = {}) {
  if (box.corners) {
    const c = box.corners;
    return { nw: pair(c.nw), ne: pair(c.ne), sw: pair(c.sw), se: pair(c.se) };
  }
  const t = Number(box.topInset) || 0;
  const b = Number(box.bottomInset) || 0;
  if (t || b) return { nw: [t, 0], ne: [-t, 0], sw: [b, 0], se: [-b, 0] };
  return { nw: [0, 0], ne: [0, 0], sw: [0, 0], se: [0, 0] };
}

export function hasWarp(box = {}) {
  const o = cornerOffsets(box);
  return CORNER_KEYS.some((k) => o[k][0] !== 0 || o[k][1] !== 0);
}

// 四角目標位置，表示為相對渲染元素的比例（矩形角 0/1 + 偏移÷邊長）。
// 回傳 [nwX,nwY, neX,neY, swX,swY, seX,seY]；無形變回傳 null。
export function warpFractions(box = {}) {
  if (!hasWarp(box)) return null;
  const w = (box.right - box.left) || 1;
  const h = (box.bottom - box.top) || 1;
  const o = cornerOffsets(box);
  return [
    o.nw[0] / w, o.nw[1] / h,
    1 + o.ne[0] / w, o.ne[1] / h,
    o.sw[0] / w, 1 + o.sw[1] / h,
    1 + o.se[0] / w, 1 + o.se[1] / h
  ];
}
