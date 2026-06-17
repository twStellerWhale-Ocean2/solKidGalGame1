export function renderBuildInfo(elements, buildInfo) {
  if (elements.versionValue) elements.versionValue.textContent = buildInfo.version;
  if (elements.buildDateValue) elements.buildDateValue.textContent = buildInfo.buildDateTime || buildInfo.buildDate;
}

// issue #134：角色語音設定——每個 (gender×personality) 桶一列下拉，讓使用者指定瀏覽器 voice。
const VOICE_GENDER_LABEL = { male: "Male", female: "Female" };
const VOICE_PERSONALITY_LABEL = { bold: "Bold", cheerful: "Cheerful", graceful: "Graceful", melancholy: "Melancholy" };
const titleCaseWord = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);
function voiceBucketLabel(bucket) {
  const gender = VOICE_GENDER_LABEL[bucket.gender] || titleCaseWord(bucket.gender);
  if (bucket.isGenderDefault) return `${gender} (default)`;
  const personality = VOICE_PERSONALITY_LABEL[bucket.personality] || titleCaseWord(bucket.personality);
  return `${gender} · ${personality}`;
}

export function renderVoiceSettings(elements, { buckets = [], voices = [], assignments = {}, onAssign } = {}) {
  const list = elements.voiceAssignList;
  if (!list) return;
  list.textContent = "";
  if (!voices.length) {
    const empty = document.createElement("p");
    empty.className = "voice-assign-empty";
    empty.textContent = "No browser voices are available yet. Reopen this page after the browser finishes loading its voices.";
    list.appendChild(empty);
    return;
  }
  for (const bucket of buckets) {
    const key = `${bucket.gender || ""}:${bucket.personality || ""}`;
    const row = document.createElement("label");
    row.className = "voice-assign-row" + (bucket.isGenderDefault ? " voice-assign-default" : "");
    const name = document.createElement("span");
    name.className = "voice-assign-name";
    name.textContent = voiceBucketLabel(bucket);
    const select = document.createElement("select");
    select.className = "voice-assign-select";
    const auto = document.createElement("option");
    auto.value = "";
    auto.textContent = bucket.isGenderDefault ? "Auto (by language)" : "Inherit gender";
    select.appendChild(auto);
    for (const voice of voices) {
      const option = document.createElement("option");
      option.value = voice.name;
      option.textContent = voice.lang ? `${voice.name} (${voice.lang})` : voice.name;
      select.appendChild(option);
    }
    select.value = assignments[key] || "";
    select.addEventListener("change", () => {
      if (typeof onAssign === "function") onAssign(bucket.gender, bucket.personality, select.value);
    });
    row.append(name, select);
    list.appendChild(row);
  }
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
