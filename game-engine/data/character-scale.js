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
  baselineTolerancePx: 6,
  // issue #295：共用 body 底圖由 USR 親改，腳掌與畫布下緣刻意預留鞋層空間；
  // 可玩公主 base 的腳底 baseline 改以「768 − 此預留量」為準（NPC 立繪不適用、仍貼齊地面）。
  playableFootClearancePx: 14
});

export function bodyHeightPxForCm(heightCm) {
  return Math.round((heightCm / characterScaleContract.fullCanvasHeightCm) * characterScaleContract.canvasHeight);
}
