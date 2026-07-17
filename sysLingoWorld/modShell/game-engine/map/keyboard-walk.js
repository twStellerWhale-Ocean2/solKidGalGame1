// issue #178：鍵盤地圖走動控制器。
// 自管「按住方向集合＋連續移動迴圈」取代倚賴 OS 按鍵自動重複——按鍵即時起步並持續走動，
// 消除「按下後要等 OS 自動重複初始延遲才連續走起來」的起步停頓；地區／城堡／世界三處走動面沿用同一控制器。
// 速度由各面注入的 moveFn 自帶（本控制器只負責「何時走、走幾次」），純函式、不碰 DOM 或遊戲狀態，便於 headless 測試。

const WALK_KEY_DIRECTIONS = Object.freeze({
  ArrowUp: "up", w: "up",
  ArrowDown: "down", s: "down",
  ArrowLeft: "left", a: "left",
  ArrowRight: "right", d: "right"
});

const WALK_DIRECTION_VECTORS = Object.freeze({
  up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]
});

// 將鍵盤事件 key 對映到走動方向（含方向鍵與 WASD、大小寫）；非走動鍵回傳 null。
export function directionForKey(key) {
  if (typeof key !== "string") return null;
  return WALK_KEY_DIRECTIONS[key] || WALK_KEY_DIRECTIONS[key.toLowerCase()] || null;
}

// 建立一個鍵盤走動控制器。options 可注入 now/requestFrame/cancelFrame 供測試替身使用。
export function createKeyboardWalkController(options = {}) {
  const stepMs = options.stepMs ?? 33;
  const now = options.now || (() =>
    (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now()));
  const requestFrame = options.requestFrame || ((cb) => requestAnimationFrame(cb));
  const cancelFrame = options.cancelFrame || ((id) => cancelAnimationFrame(id));

  const held = new Set();   // 目前按住中的方向
  let moveFn = null;        // 目前作用中走動面的位移函式 (dx, dy) => void
  let frame = 0;            // 連續移動迴圈的 frame id（0＝未啟動）
  let lastStepAt = 0;       // 上次連續推進的時間戳

  function vector() {
    let dx = 0;
    let dy = 0;
    for (const dir of held) {
      const v = WALK_DIRECTION_VECTORS[dir];
      dx += v[0];
      dy += v[1];
    }
    return [dx, dy];
  }

  function tick() {
    frame = 0;
    if (!held.size || !moveFn) return;
    const current = now();
    if (current - lastStepAt >= stepMs) {
      const [dx, dy] = vector();
      if (dx || dy) moveFn(dx, dy);
      lastStepAt = current;
    }
    frame = requestFrame(tick);
  }

  function ensureRunning() {
    if (!frame) frame = requestFrame(tick);
  }

  function stop() {
    if (frame) {
      cancelFrame(frame);
      frame = 0;
    }
  }

  // 按下某方向：立即起步走一步（保留原即時手感），並啟動連續移動迴圈；同向重按（OS 自動重複）忽略、不疊加。
  function press(direction, fn) {
    if (!WALK_DIRECTION_VECTORS[direction] || typeof fn !== "function") return;
    moveFn = fn;
    if (held.has(direction)) return;   // 忽略 OS 自動重複的合成 keydown，避免雙重驅動
    held.add(direction);
    const [dx, dy] = WALK_DIRECTION_VECTORS[direction];
    moveFn(dx, dy);                    // 第一步即時（與改動前單次 keydown 等價）
    lastStepAt = now();                // 之後每 stepMs 連續推進，免 OS 自動重複初始延遲
    ensureRunning();
  }

  // 放開某方向；集合清空即停迴圈。
  function release(direction) {
    if (!held.delete(direction)) return;
    if (!held.size) stop();
  }

  // 清空所有按住狀態並停止（切換畫面、視窗失焦、分頁隱藏時呼叫，杜絕「鬆鍵仍續走」之卡走）。
  function clear() {
    held.clear();
    moveFn = null;
    stop();
  }

  return {
    press,
    release,
    clear,
    // 測試輔助
    heldDirections: () => [...held],
    isWalking: () => Boolean(frame)
  };
}
