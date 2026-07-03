// 場景設定分頁（issue #245）：檢視各場景組態（名稱／角色／背景，唯讀）並檢視與手動編修場景對話
// （打工任務 LessonBank、生活聊天 ChatLessonBank），另提供「依提示詞 AI 生成對話」之輔助。
// 來源為各區 manifest 之 SceneConfigs（已併入 lesson／chatLesson）；對話寫回走 server.mjs dev 端點。
// issue #297：AI 生成改「生成→對照→採納」三步（未採納不覆寫題庫）；編修登記 dirty 供離頁防護；
// 深連結 #scene/<area>/<place> 重載後回到原工作點。
import { castleArea, castleSceneConfigs } from "../content-package/areas/castle/manifest.js";
import { urbanArea, urbanSceneConfigs } from "../content-package/areas/urban/manifest.js";
import { ruralArea, ruralSceneConfigs } from "../content-package/areas/rural/manifest.js";
import { wildArea, wildSceneConfigs } from "../content-package/areas/wild/manifest.js";
import { cleanBankEntry, validateBank, buildScenePrompt, parseDialogJson } from "./scene-bank-io.mjs";
import { snack, status, postJson, setDirty, setHashSub, hashParts } from "./ui-helpers.js";
import { setupColumnResize } from "./wardrobe-gestures.js";

// 由 area + sceneConfigs 建立工作模型：完整還原整區 job／chat 題庫（含所有場景，存檔不漏），
// 並列出全部場景供清單呈現（標示哪些有打工／聊天對話）。
function buildArea(area, configs) {
  const locById = new Map((area.locations || []).map((l) => [l.id, l]));
  const jobBank = {}, chatBank = {}, scenes = [];
  for (const [place, cfg] of Object.entries(configs)) {
    const loc = locById.get(place) || {};
    const hasJob = !!cfg.lesson, hasChat = !!cfg.chatLesson;
    if (hasJob) jobBank[place] = cleanBankEntry(cfg.lesson);
    if (hasChat) chatBank[place] = cleanBankEntry(cfg.chatLesson);
    scenes.push({
      place,
      label: loc.label || cfg.npc || place,
      npc: cfg.npc || loc.npc || "—",
      sceneSrc: cfg.sceneArt?.src || "",
      hint: loc.hint || cfg.travelLine || "",
      hasJob, hasChat
    });
  }
  return {
    key: area.id, label: area.label,
    vocabLabel: area.vocabularyProfile?.levelLabel || area.vocabularyProfile?.label || "",
    jobBank, chatBank, scenes
  };
}

const areas = {
  castle: buildArea(castleArea, castleSceneConfigs),
  urban: buildArea(urbanArea, urbanSceneConfigs),
  rural: buildArea(ruralArea, ruralSceneConfigs),
  wild: buildArea(wildArea, wildSceneConfigs)
};
const areaOrder = ["castle", "urban", "rural", "wild"];
const state = { areaKey: "castle", place: "", rendered: false };
// 深連結：#scene/<area>/<place>
{
  const parts = hashParts();
  if (parts[0] === "scene" && areas[parts[1]]) {
    state.areaKey = parts[1];
    if (parts[2] && areas[parts[1]].scenes.some((s) => s.place === parts[2])) state.place = parts[2];
  }
}

let pendingGen = null; // {kind, place, parsed}：已生成、待對照採納的內容（未採納不進題庫）

const dom = {
  subtabs: document.querySelector("#sceneSubtabs"),
  title: document.querySelector("#sceneTitle"),
  summary: document.querySelector("#sceneSummary"),
  list: document.querySelector("#sceneList"),
  metaCard: document.querySelector("#sceneMetaCard"),
  editor: document.querySelector("#sceneDialogEditor"),
  selectedInfo: document.querySelector("#sceneSelectedInfo"),
  genKind: document.querySelector("#sceneGenKind"),
  genHint: document.querySelector("#sceneGenHint"),
  genBtn: document.querySelector("#sceneGenBtn"),
  genStatus: document.querySelector("#sceneGenStatus"),
  genFallback: document.querySelector("#sceneGenFallback"),
  genPrompt: document.querySelector("#sceneGenPrompt"),
  genCopyBtn: document.querySelector("#sceneGenCopyBtn"),
  genPaste: document.querySelector("#sceneGenPaste"),
  genParseBtn: document.querySelector("#sceneGenParseBtn"),
  genPreview: document.querySelector("#sceneGenPreview"),
  save: document.querySelector("#sceneSave"),
  saveStatus: document.querySelector("#sceneSaveStatus")
};

renderSubtabs();
bindEvents();
// 場景分頁初始為 hidden；待切到此分頁再首次 render。
window.addEventListener("editor-tab-change", (e) => {
  if (e.detail?.tab !== "scene") return;
  if (!state.rendered) { state.rendered = true; selectFirstScene(); }
  setHashSub("scene", state.areaKey, state.place);
});

function currentArea() { return areas[state.areaKey]; }
function currentScene() { return currentArea().scenes.find((s) => s.place === state.place) || null; }
function bankFor(kind) { return kind === "job" ? currentArea().jobBank : currentArea().chatBank; }

function renderSubtabs() {
  dom.subtabs.innerHTML = "";
  areaOrder.forEach((key) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `map-subtab${key === state.areaKey ? " active" : ""}`;
    b.textContent = areas[key].label;
    b.addEventListener("click", () => { state.areaKey = key; state.place = ""; resetGenUI(); selectFirstScene(); renderSubtabs(); });
    dom.subtabs.append(b);
  });
}

function bindEvents() {
  dom.save.addEventListener("click", saveDialog);
  dom.genBtn.addEventListener("click", generateDialog);
  dom.genParseBtn.addEventListener("click", parsePasted);
  dom.genCopyBtn.addEventListener("click", () => {
    navigator.clipboard?.writeText(dom.genPrompt.value).then(
      () => status(dom.genStatus, "提示詞已複製。", "ok"),
      () => status(dom.genStatus, "複製失敗，請手動選取複製。", "err")
    );
  });
  // 編修欄位以委派事件綁定（render 後 DOM 重建仍有效，焦點不被整段重繪打斷）。
  dom.editor.addEventListener("input", onEditorInput);
  dom.editor.addEventListener("change", onEditorChange);
  // 欄寬拖曳（#297 B11：與衣物分頁一致）
  setupColumnResize(
    document.querySelector("#panel-scene .map-shell"),
    document.querySelector("#panel-scene .col-resizer:not(.col-resizer-right)"),
    document.querySelector("#panel-scene .col-resizer-right")
  );
}

function selectFirstScene() {
  // 深連結已指定且有效時沿用，否則取第一個含對話場景。
  if (!state.place || !currentArea().scenes.some((s) => s.place === state.place)) {
    const withDialog = currentArea().scenes.find((s) => s.hasJob || s.hasChat);
    state.place = (withDialog || currentArea().scenes[0] || {}).place || "";
  }
  setHashSub("scene", state.areaKey, state.place);
  renderAll();
}

function renderAll() { renderSceneList(); renderMeta(); renderDialogEditor(); renderSelected(); }

function renderSceneList() {
  const a = currentArea();
  dom.title.textContent = `場景設定 · ${a.label}`;
  const editable = a.scenes.filter((s) => s.hasJob || s.hasChat).length;
  dom.summary.textContent = `${a.scenes.length} 個場景 · ${editable} 個含對話 · 英文等級 ${a.vocabLabel || "—"}`;
  dom.list.innerHTML = "";
  a.scenes.forEach((s) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `map-node-row${s.place === state.place ? " active" : ""}`;
    const badges = (s.hasJob ? '<span class="scene-badge job">打工</span>' : "")
      + (s.hasChat ? '<span class="scene-badge chat">聊天</span>' : "")
      || '<span class="scene-badge none">無對話</span>';
    row.innerHTML = `<span class="map-node-name"><strong>${escapeHtml(s.label)}</strong><span>${escapeHtml(s.npc)} ${badges}</span></span>`;
    row.addEventListener("click", () => { state.place = s.place; setHashSub("scene", state.areaKey, s.place); resetGenUI(); renderAll(); });
    dom.list.append(row);
  });
}

function renderMeta() {
  const s = currentScene();
  if (!s) { dom.metaCard.innerHTML = "（未選場景）"; return; }
  const img = s.sceneSrc ? `<img class="scene-meta-art" src="${assetUrl(s.sceneSrc)}" alt="" draggable="false">` : "";
  const file = (s.sceneSrc || "").split("/").pop().split("?")[0] || "—";
  dom.metaCard.innerHTML = `${img}
    <div class="scene-meta-fields">
      <div><span class="scene-meta-k">場景名稱</span><span>${escapeHtml(s.label)}</span></div>
      <div><span class="scene-meta-k">場景角色</span><span>${escapeHtml(s.npc)}</span></div>
      <div><span class="scene-meta-k">場景背景</span><code>${escapeHtml(file)}</code></div>
      <div><span class="scene-meta-k">提示</span><span>${escapeHtml(s.hint)}</span></div>
    </div>
    <p class="control-help">名稱／角色／背景於此唯讀檢視（其權責屬地圖／角色／場景美術來源）；本頁編修對象為下方對話。</p>`;
}

function renderDialogEditor() {
  const s = currentScene();
  if (!s) { dom.editor.innerHTML = ""; return; }
  const a = currentArea();
  const parts = [];
  if (s.hasJob) parts.push(renderBankSection("job", a.jobBank[s.place]));
  if (s.hasChat) parts.push(renderBankSection("chat", a.chatBank[s.place]));
  if (!parts.length) parts.push('<p class="control-help">此場景無對話題庫（房間／商店／出入口）。</p>');
  dom.editor.innerHTML = parts.join("");
}

function renderBankSection(kind, entry) {
  const label = kind === "job" ? "打工任務題庫" : "生活聊天題庫";
  const qs = entry.questions.map((q, qi) => renderQuestion(kind, qi, q)).join("");
  return `<section class="scene-bank scene-bank-${kind}">
    <h3>${label} · <span class="scene-bank-title">${escapeHtml(entry.title)}</span></h3>${qs}</section>`;
}

function renderQuestion(kind, qi, q) {
  const rows = q.choices.map((c, ci) => `<div class="scene-choice">
      <label class="scene-ans"><input type="radio" name="ans-${kind}-${qi}" data-kind="${kind}" data-qi="${qi}" data-ci="${ci}" data-f="answer" ${q.answer === c ? "checked" : ""}><span>正解</span></label>
      <input class="scene-in en" data-kind="${kind}" data-qi="${qi}" data-ci="${ci}" data-f="choice" value="${escapeHtml(c)}" placeholder="公主回應（英文）">
      <input class="scene-in zh" data-kind="${kind}" data-qi="${qi}" data-ci="${ci}" data-f="choiceZh" value="${escapeHtml(q.choicesZh[ci] || "")}" placeholder="中文">
    </div>`).join("");
  return `<div class="scene-q">
    <div class="scene-q-head">Q${qi + 1}　角色台詞（題幹）</div>
    <input class="scene-in en wide" data-kind="${kind}" data-qi="${qi}" data-f="prompt" value="${escapeHtml(q.prompt)}" placeholder="角色第一人稱台詞（英文）">
    <input class="scene-in zh wide" data-kind="${kind}" data-qi="${qi}" data-f="promptZh" value="${escapeHtml(q.promptZh)}" placeholder="中文">
    <div class="scene-choices-head">公主回應（點選正解）</div>
    ${rows}</div>`;
}

function renderSelected() {
  const s = currentScene();
  dom.selectedInfo.innerHTML = s
    ? `<strong>${escapeHtml(s.label)}</strong><span>place <code>${escapeHtml(s.place)}</code></span>`
    : "（未選場景）";
  // 生成題型預設為該場景擁有的類型；皆無則停用生成。
  const hasJob = s?.hasJob, hasChat = s?.hasChat;
  dom.genKind.querySelector('option[value="job"]').disabled = !hasJob;
  dom.genKind.querySelector('option[value="chat"]').disabled = !hasChat;
  if (s) dom.genKind.value = hasJob ? "job" : (hasChat ? "chat" : "job");
  dom.genBtn.disabled = !(hasJob || hasChat);
}

// 每個地區各自一個 dirty 來源（工作副本獨立、分開儲存），只存目前這區不得清掉其他區的未存警示。
function markAreaDirty() { setDirty(`scene:${state.areaKey}`, true, `場景對話編修（${currentArea().label}）`); }

// ===== 編修欄位事件（直接寫入工作副本，維持 answer ∈ choices 不變式）=====
function onEditorInput(e) {
  const t = e.target;
  const f = t.dataset?.f;
  if (!f || f === "answer") return;
  const q = bankFor(t.dataset.kind)?.[state.place]?.questions?.[+t.dataset.qi];
  if (!q) return;
  if (f === "prompt") q.prompt = t.value;
  else if (f === "promptZh") q.promptZh = t.value;
  else if (f === "choiceZh") q.choicesZh[+t.dataset.ci] = t.value;
  else if (f === "choice") {
    const ci = +t.dataset.ci;
    const wasAnswer = q.answer === q.choices[ci];
    q.choices[ci] = t.value;
    if (wasAnswer) q.answer = t.value; // 正解選項改文字 → answer 同步，維持 answer∈choices
  }
  markAreaDirty();
}
function onEditorChange(e) {
  const t = e.target;
  if (t.dataset?.f !== "answer") return;
  const q = bankFor(t.dataset.kind)?.[state.place]?.questions?.[+t.dataset.qi];
  if (q) { q.answer = q.choices[+t.dataset.ci]; markAreaDirty(); }
}

// ===== AI 生成（三步：生成 → 對照預覽 → 採納；#297 C17）=====
async function generateDialog() {
  const a = currentArea(); const s = currentScene();
  if (!s) return;
  const kind = dom.genKind.value;
  const has = kind === "job" ? s.hasJob : s.hasChat;
  if (!has) { status(dom.genStatus, "此場景無該類型題庫，無法生成（v1 僅重生既有對話）。", "err"); return; }
  const entry = bankFor(kind)[s.place];
  const prompt = buildScenePrompt({
    area: a.key, place: s.place, kind, npc: s.npc, sceneLabel: s.label,
    vocabLabel: a.vocabLabel, hint: dom.genHint.value, questionCount: entry.questions.length
  });
  dom.genBtn.disabled = true;
  status(dom.genStatus, "生成中…", "");
  try {
    const d = await postJson("/tool/generate-scene-dialog", { prompt });
    if (d.ok) {
      previewGenerated(kind, s.place, d.text);
      status(dom.genStatus, `已用 ${d.model} 生成，請於下方對照後按「採納」。`, "ok");
      dom.genFallback.hidden = true;
    } else if (d.needKey) {
      dom.genPrompt.value = prompt;
      dom.genFallback.hidden = false;
      status(dom.genStatus, "未設定 ANTHROPIC_API_KEY：請複製提示詞到外部 AI，貼回後解析。", "");
    } else {
      throw new Error(d.error || "生成失敗");
    }
  } catch (err) {
    status(dom.genStatus, `生成失敗：${err.message}`, "err");
  } finally {
    dom.genBtn.disabled = false;
  }
}

function parsePasted() {
  const s = currentScene();
  if (!s) return;
  const kind = dom.genKind.value;
  try {
    previewGenerated(kind, s.place, dom.genPaste.value);
    status(dom.genStatus, "已解析貼回，請於下方對照後按「採納」。", "ok");
  } catch (err) {
    status(dom.genStatus, `解析失敗：${err.message}`, "err");
  }
}

// 解析生成/貼回之 JSON → 驗證 → 存為 pending 並渲染新舊對照；「採納」才覆寫工作副本題庫。
function previewGenerated(kind, place, text) {
  const parsed = parseDialogJson(text, place);
  validateBank(kind, parsed); // 守門：題數／選項數／answer∈choices／中英等長
  pendingGen = { kind, place, parsed };
  renderGenPreview();
}

function renderGenPreview() {
  if (!dom.genPreview) return;
  if (!pendingGen) { dom.genPreview.hidden = true; dom.genPreview.innerHTML = ""; return; }
  const { kind, place, parsed } = pendingGen;
  const oldEntry = bankFor(kind)[place];
  const label = kind === "job" ? "打工任務題庫" : "生活聊天題庫";
  const col = (entry) => entry.questions.map((q, i) =>
    `<div class="gen-q"><strong>Q${i + 1}</strong> ${escapeHtml(q.prompt)}<br><span class="gen-zh">${escapeHtml(q.promptZh)}</span>
     ${q.choices.map((c, ci) => `<div class="gen-c${q.answer === c ? " ans" : ""}">${q.answer === c ? "✓" : "·"} ${escapeHtml(c)}<span class="gen-zh">（${escapeHtml(q.choicesZh?.[ci] || "")}）</span></div>`).join("")}</div>`
  ).join("");
  dom.genPreview.hidden = false;
  dom.genPreview.innerHTML = `
    <h3>生成對照 · ${escapeHtml(label)}</h3>
    <div class="gen-cols">
      <div class="gen-col"><h4>現行</h4>${col(oldEntry)}</div>
      <div class="gen-col gen-col-new"><h4>生成結果</h4>${col(parsed[place])}</div>
    </div>
    <div class="gen-actions">
      <button type="button" id="sceneGenDiscard">放棄生成</button>
      <button type="button" id="sceneGenAdopt" class="add-submit">採納生成結果</button>
    </div>
    <p class="control-help">採納只更新編修區工作副本；仍須按「儲存對話到檔案」才寫回。</p>`;
  dom.genPreview.querySelector("#sceneGenAdopt").addEventListener("click", adoptPending);
  dom.genPreview.querySelector("#sceneGenDiscard").addEventListener("click", () => {
    pendingGen = null;
    renderGenPreview();
    status(dom.genStatus, "已放棄生成結果，原題庫未變。", "ok");
  });
}

function adoptPending() {
  if (!pendingGen) return;
  const { kind, place, parsed } = pendingGen;
  bankFor(kind)[place] = parsed[place];
  pendingGen = null;
  renderGenPreview();
  renderDialogEditor();
  markAreaDirty();
  snack("已採納生成內容至編修區；按「儲存對話到檔案」才會寫回。", "ok");
}

// ===== 儲存（送整區題庫，避免遺漏其他場景）=====
async function saveDialog() {
  const a = currentArea();
  const jobs = Object.keys(a.jobBank).length;
  const chats = Object.keys(a.chatBank).length;
  try {
    if (jobs) validateBank("job", a.jobBank);
    if (chats) validateBank("chat", a.chatBank);
  } catch (e) {
    status(dom.saveStatus, `驗證失敗：${e.message}`, "err");
    return;
  }
  dom.save.disabled = true;
  status(dom.saveStatus, "儲存中…", "");
  try {
    const results = [];
    if (jobs) results.push(await postJson("/tool/save-scene-dialog", { area: a.key, kind: "job", bank: a.jobBank }));
    if (chats) results.push(await postJson("/tool/save-scene-dialog", { area: a.key, kind: "chat", bank: a.chatBank }));
    const bad = results.find((r) => !r.ok);
    if (bad) throw new Error(bad.error);
    setDirty(`scene:${a.key}`, false); // 僅清這區的 dirty，其他區未存仍受離頁保護
    status(dom.saveStatus, `已寫回 ${a.label} 對話題庫（${results.length} 個區塊）。重新整理遊戲即可看到。`, "ok");
  } catch (e) {
    status(dom.saveStatus, `儲存失敗：${e.message}（請確認 dev server 為 node server.mjs）`, "err");
  } finally {
    dom.save.disabled = false;
  }
}

function resetGenUI() {
  pendingGen = null;
  renderGenPreview();
  dom.genFallback.hidden = true;
  dom.genPrompt.value = "";
  dom.genPaste.value = "";
  status(dom.genStatus, "", "");
  status(dom.saveStatus, "", "");
}

// ===== helpers（與 map-tuner 一致）=====
function assetUrl(src) { if (!src) return ""; return src.startsWith("content-package/") || src.startsWith("content-base/") ? `../${src}` : src; }
function escapeHtml(value = "") { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
