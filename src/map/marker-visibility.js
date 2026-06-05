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
  const visible =
    markerRect.left >= bounds.left &&
    markerRect.top >= bounds.top &&
    markerRect.right <= bounds.right &&
    markerRect.bottom <= bounds.bottom;
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
