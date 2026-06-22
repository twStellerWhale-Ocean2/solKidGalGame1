export function updateMarkerEdgeVisibility(marker, stage, options = {}) {
  if (!marker || !stage || !marker.isConnected) return false;
  const padding = Number.isFinite(options.padding) ? options.padding : 2;
  const stageRect = stage.getBoundingClientRect();
  const visualViewport = window.visualViewport;
  const viewportLeft = visualViewport?.offsetLeft || 0;
  const viewportTop = visualViewport?.offsetTop || 0;
  const viewportRight = viewportLeft + (visualViewport?.width || window.innerWidth);
  const viewportBottom = viewportTop + (visualViewport?.height || window.innerHeight);
  const bounds = {
    left: Math.max(stageRect.left, viewportLeft) + padding,
    top: Math.max(stageRect.top, viewportTop) + padding,
    right: Math.min(stageRect.right, viewportRight) - padding,
    bottom: Math.min(stageRect.bottom, viewportBottom) - padding
  };
  const markerRect = marker.getBoundingClientRect();
  // issue #252：以 marker 錨點（中心）是否落在可視範圍內判定，而非要求整個圖示外框都在界內。
  // marker 一律以 transform: translate(-50%,-50%) 將圖示中心對位到地圖座標點；中心在視口內即代表
  // 該地點可達、應顯示，只有中心被平移／縮放移出可視範圍才隱藏（panned-away 仍正確隱藏）。
  // 修正貼邊節點（如城堡入口 castleGate y≈95.3）在 .nearby 放大後外框下緣戳出 stage 邊界數 px
  // 即被整顆裁掉而「靠近時消失」之統一機制副作用。此判據只放寬、不新增任何隱藏，故不退化既有可見性。
  const markerCenterX = (markerRect.left + markerRect.right) / 2;
  const markerCenterY = (markerRect.top + markerRect.bottom) / 2;
  const visible =
    markerCenterX >= bounds.left &&
    markerCenterY >= bounds.top &&
    markerCenterX <= bounds.right &&
    markerCenterY <= bounds.bottom;
  marker.classList.toggle("map-marker-offscreen", !visible);
  if (visible) {
    marker.removeAttribute("aria-hidden");
    marker.removeAttribute("tabindex");
  } else {
    marker.setAttribute("aria-hidden", "true");
    marker.tabIndex = -1;
  }
  return visible;
}
