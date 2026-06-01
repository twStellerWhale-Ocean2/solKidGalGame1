export function renderBuildInfo(elements, buildInfo) {
  if (elements.versionValue) elements.versionValue.textContent = buildInfo.version;
  if (elements.buildDateValue) elements.buildDateValue.textContent = buildInfo.buildDate;
}
