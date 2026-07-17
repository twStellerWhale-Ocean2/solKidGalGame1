// @ts-check

/** @typedef {import("../types.js").AreaMapMetrics} AreaMapMetrics */
/** @typedef {import("../types.js").AreaMapViewport} AreaMapViewport */

const DEFAULT_VIEWPORT = Object.freeze({ pan: Object.freeze({ x: 0, y: 0 }), zoom: 1 });
const DEFAULT_ZOOM_LIMITS = Object.freeze({ min: 1, max: 2.2, mobileBaseScale: 1.06 });

/**
 * @param {object} options
 * @param {string[]=} options.areaIds
 * @param {(value: number, min: number, max: number) => number} options.clamp
 * @param {(areaId: string) => { width: number, height: number }} options.getImageSize
 * @param {(areaId: string) => HTMLElement} options.getStage
 * @param {() => boolean} options.isMobile
 * @param {{ min: number, max: number, mobileBaseScale: number }=} options.zoomLimits
 */
export function createAreaMapViewportController({
  areaIds = [],
  clamp,
  getImageSize,
  getStage,
  isMobile,
  zoomLimits = DEFAULT_ZOOM_LIMITS
}) {
  const viewports = Object.fromEntries(areaIds.map((areaId) => [areaId, cloneViewport(DEFAULT_VIEWPORT)]));
  const centerOnNextRender = Object.fromEntries(areaIds.map((areaId) => [areaId, true]));

  /** @param {string} areaId */
  function viewport(areaId) {
    if (!viewports[areaId]) viewports[areaId] = cloneViewport(DEFAULT_VIEWPORT);
    return viewports[areaId];
  }

  /** @param {string} areaId */
  function requestCenter(areaId) {
    centerOnNextRender[areaId] = true;
  }

  /**
   * @param {string} areaId
   * @param {DOMRect} rect
   */
  function baseDisplay(areaId, rect) {
    const imageSize = getImageSize(areaId);
    const imageRatio = imageSize.width / imageSize.height;
    const stageRatio = rect.width / rect.height;
    const useCover = isMobile();
    const width = useCover
      ? stageRatio > imageRatio ? rect.width : rect.height * imageRatio
      : stageRatio > imageRatio ? rect.height * imageRatio : rect.width;
    const height = useCover
      ? stageRatio > imageRatio ? rect.width / imageRatio : rect.height
      : stageRatio > imageRatio ? rect.height : rect.width / imageRatio;
    const scale = useCover ? zoomLimits.mobileBaseScale : 1;
    return { width: width * scale, height: height * scale };
  }

  /**
   * @param {string} areaId
   * @param {AreaMapViewport} nextViewport
   * @param {DOMRect | null} rect
   */
  function clampViewport(areaId, nextViewport, rect = null) {
    const stage = getStage(areaId);
    const stageRect = rect || stage.getBoundingClientRect();
    if (!isMobile()) return cloneViewport(DEFAULT_VIEWPORT);
    const zoom = clamp(nextViewport.zoom || 1, zoomLimits.min, zoomLimits.max);
    const display = baseDisplay(areaId, stageRect);
    const displayWidth = display.width * zoom;
    const displayHeight = display.height * zoom;
    const maxX = Math.max(0, (displayWidth - stageRect.width) / 2);
    const maxY = Math.max(0, (displayHeight - stageRect.height) / 2);
    return {
      pan: {
        x: clamp(nextViewport.pan?.x || 0, -maxX, maxX),
        y: clamp(nextViewport.pan?.y || 0, -maxY, maxY)
      },
      zoom
    };
  }

  /**
   * @param {string} areaId
   * @param {AreaMapViewport | null=} viewportOverride
   * @returns {AreaMapMetrics}
   */
  function metrics(areaId, viewportOverride = null) {
    const stage = getStage(areaId);
    const rect = stage.getBoundingClientRect();
    const currentViewport = viewportOverride || viewport(areaId);
    const constrained = clampViewport(areaId, currentViewport, rect);
    if (!viewportOverride) viewports[areaId] = constrained;
    const display = baseDisplay(areaId, rect);
    const displayWidth = display.width * constrained.zoom;
    const displayHeight = display.height * constrained.zoom;
    return {
      width: rect.width,
      height: rect.height,
      displayWidth,
      displayHeight,
      panX: constrained.pan.x,
      panY: constrained.pan.y,
      zoom: constrained.zoom,
      offsetX: (rect.width - displayWidth) / 2 + constrained.pan.x,
      offsetY: (rect.height - displayHeight) / 2 + constrained.pan.y
    };
  }

  /**
   * @param {string} areaId
   * @param {AreaMapMetrics=} nextMetrics
   */
  function syncStyles(areaId, nextMetrics = metrics(areaId)) {
    const stage = getStage(areaId);
    if (!stage) return;
    stage.style.setProperty("--map-display-width", `${nextMetrics.displayWidth}px`);
    stage.style.setProperty("--map-display-height", `${nextMetrics.displayHeight}px`);
    stage.style.setProperty("--map-offset-x", `${nextMetrics.offsetX}px`);
    stage.style.setProperty("--map-offset-y", `${nextMetrics.offsetY}px`);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {AreaMapMetrics | null=} nextMetrics
   */
  function pointToStage(x, y, nextMetrics = null) {
    const activeMetrics = nextMetrics || metrics("urban");
    return {
      x: activeMetrics.offsetX + (x / 100) * activeMetrics.displayWidth,
      y: activeMetrics.offsetY + (y / 100) * activeMetrics.displayHeight
    };
  }

  /**
   * @param {HTMLElement} element
   * @param {number} x
   * @param {number} y
   * @param {AreaMapMetrics | null=} nextMetrics
   */
  function positionElement(element, x, y, nextMetrics = null) {
    const point = pointToStage(x, y, nextMetrics);
    element.style.left = `${point.x}px`;
    element.style.top = `${point.y}px`;
  }

  /**
   * @param {string} areaId
   * @param {AreaMapViewport} nextViewport
   */
  function applyViewport(areaId, nextViewport) {
    viewports[areaId] = clampViewport(areaId, nextViewport);
    return viewports[areaId];
  }

  /**
   * @param {string} areaId
   * @param {number} x
   * @param {number} y
   */
  function centerOnPoint(areaId, x, y) {
    const stage = getStage(areaId);
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const currentViewport = viewport(areaId);
    const display = baseDisplay(areaId, rect);
    const zoom = clamp(currentViewport.zoom || 1, zoomLimits.min, zoomLimits.max);
    const displayWidth = display.width * zoom;
    const displayHeight = display.height * zoom;
    applyViewport(areaId, {
      zoom,
      pan: {
        x: rect.width / 2 - (x / 100) * displayWidth - (rect.width - displayWidth) / 2,
        y: rect.height / 2 - (y / 100) * displayHeight - (rect.height - displayHeight) / 2
      }
    });
  }

  /**
   * @param {string} areaId
   * @param {number} stageX
   * @param {number} stageY
   * @param {number} zoomFactor
   */
  function zoomAtStagePoint(areaId, stageX, stageY, zoomFactor) {
    const stage = getStage(areaId);
    if (!stage) return;
    const currentMetrics = metrics(areaId);
    const zoom = clamp(currentMetrics.zoom * zoomFactor, zoomLimits.min, zoomLimits.max);
    const focus = {
      x: clamp((stageX - currentMetrics.offsetX) / currentMetrics.displayWidth, 0, 1),
      y: clamp((stageY - currentMetrics.offsetY) / currentMetrics.displayHeight, 0, 1)
    };
    const rect = stage.getBoundingClientRect();
    const display = baseDisplay(areaId, rect);
    const displayWidth = display.width * zoom;
    const displayHeight = display.height * zoom;
    applyViewport(areaId, {
      zoom,
      pan: {
        x: stageX - focus.x * displayWidth - (rect.width - displayWidth) / 2,
        y: stageY - focus.y * displayHeight - (rect.height - displayHeight) / 2
      }
    });
  }

  /**
   * @param {string} areaId
   * @param {number} direction
   */
  function zoomFromKeyboard(areaId, direction) {
    const stage = getStage(areaId);
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    zoomAtStagePoint(areaId, rect.width / 2, rect.height / 2, direction > 0 ? 1.18 : 1 / 1.18);
  }

  /**
   * @param {string} areaId
   * @param {{ x: number, y: number } | null} point
   */
  function centerIfRequested(areaId, point) {
    if (!centerOnNextRender[areaId] || !point) return;
    centerOnNextRender[areaId] = false;
    centerOnPoint(areaId, point.x, point.y);
  }

  return {
    applyViewport,
    baseDisplay,
    centerIfRequested,
    centerOnPoint,
    clampViewport,
    metrics,
    pointToStage,
    positionElement,
    requestCenter,
    syncStyles,
    viewport,
    zoomAtStagePoint,
    zoomFromKeyboard,
    zoomLimits
  };
}

/** @param {AreaMapViewport} viewport */
function cloneViewport(viewport) {
  return { pan: { x: viewport.pan.x, y: viewport.pan.y }, zoom: viewport.zoom };
}
