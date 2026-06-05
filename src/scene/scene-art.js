const TONE_OVERLAYS = Object.freeze({
  castle: "linear-gradient(180deg, rgba(255, 245, 251, 0.02), rgba(255, 250, 246, 0.14))",
  forest: "linear-gradient(180deg, rgba(232, 255, 238, 0.04), rgba(255, 250, 246, 0.16))",
  kingdom: "linear-gradient(180deg, rgba(255, 245, 232, 0.02), rgba(255, 250, 246, 0.14))",
  room: "linear-gradient(180deg, rgba(255, 245, 251, 0.04), rgba(255, 250, 246, 0.18))",
  shop: "linear-gradient(180deg, rgba(255, 245, 251, 0.02), rgba(255, 250, 246, 0.14))",
  suburb: "linear-gradient(180deg, rgba(255, 245, 232, 0.02), rgba(255, 250, 246, 0.14))"
});

const DEFAULT_OVERLAY = TONE_OVERLAYS.kingdom;

export function applyAdvSceneArt(element, sceneArt, options = {}) {
  if (!element) return;
  if (!sceneArt?.src) {
    clearAdvSceneArt(element);
    return;
  }
  const assetUrl = options.assetUrl || ((src) => src);
  const overlay = sceneArt.overlay || TONE_OVERLAYS[sceneArt.tone] || DEFAULT_OVERLAY;
  const position = sceneArt.position || "center";
  const size = sceneArt.size || "cover";
  element.style.backgroundImage = `${overlay}, url("${assetUrl(sceneArt.src)}")`;
  element.style.backgroundPosition = `center, ${position}`;
  element.style.backgroundRepeat = "no-repeat";
  element.style.backgroundSize = `auto, ${size}`;
  element.dataset.sceneArtSrc = sceneArt.src;
  if (sceneArt.atlas) element.dataset.sceneArtAtlas = sceneArt.atlas;
  else delete element.dataset.sceneArtAtlas;
}

export function clearAdvSceneArt(element) {
  if (!element) return;
  element.style.backgroundImage = "";
  element.style.backgroundPosition = "";
  element.style.backgroundRepeat = "";
  element.style.backgroundSize = "";
  delete element.dataset.sceneArtSrc;
  delete element.dataset.sceneArtAtlas;
}
