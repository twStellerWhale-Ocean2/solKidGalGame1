export const characterScaleContract = Object.freeze({
  canvasWidth: 512,
  canvasHeight: 768,
  groundBaselineY: 768,
  fullCanvasHeightCm: 200,
  pixelsPerCm: 768 / 200,
  npcStageScale: 1,
  lumiNaturalHeightCm: 125,
  lumiStageScale: 1.2,
  assetHeightTolerancePx: 18,
  baselineTolerancePx: 6
});

export function bodyHeightPxForCm(heightCm) {
  return Math.round((heightCm / characterScaleContract.fullCanvasHeightCm) * characterScaleContract.canvasHeight);
}
