export function renderBuildInfo(elements, buildInfo) {
  if (elements.versionValue) elements.versionValue.textContent = buildInfo.version;
  if (elements.buildDateValue) elements.buildDateValue.textContent = buildInfo.buildDateTime || buildInfo.buildDate;
}

// issue #110：About 頁籤——渲染版權宣告與歷次版本中文短主旨（資料源 datIntf自訂版本沿革目錄）。
export function renderAbout(elements, { copyright, versionHistory } = {}) {
  if (elements.aboutCopyright && copyright) elements.aboutCopyright.textContent = copyright;
  const list = elements.aboutVersionList;
  if (!list) return;
  list.textContent = "";
  for (const entry of versionHistory || []) {
    const li = document.createElement("li");
    li.className = "about-version-item";
    const ver = document.createElement("strong");
    ver.textContent = entry.version;
    const date = document.createElement("small");
    date.textContent = entry.buildDateTime;
    const summary = document.createElement("span");
    summary.textContent = entry.summaryZh;
    li.append(ver, date, summary);
    list.appendChild(li);
  }
}
