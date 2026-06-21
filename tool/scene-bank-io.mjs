// issue #245：場景對話題庫（lessonBank／chatLessonBank）之純函式 IO——序列化、結構驗證、
// AI 提示詞組裝、外部模型 JSON 解析。純字串／物件邏輯、不依賴 Node 或 DOM，故可同時供
// 瀏覽器端 scene-tuner.js、dev server server.mjs 與 node 測試腳本共用（單一事實來源）。

export const SCENE_AREA_KEYS = ["castle", "urban", "rural", "wild"];
export const SCENE_DIALOG_KINDS = ["job", "chat"];

// 各對話類型於 manifest 內的常數名稱與 reward 變數參照、預設選項數（spec#11：打工 3、聊天 2）。
export function bankConstName(area, kind) {
  if (!SCENE_AREA_KEYS.includes(area)) throw new Error(`unknown area ${area}`);
  if (kind === "job") return `${area}LessonBank`;
  if (kind === "chat") return `${area}ChatLessonBank`;
  throw new Error(`unknown kind ${kind}`);
}
export function rewardVarFor(kind) {
  if (kind === "job") return "jobReward";
  if (kind === "chat") return "chatReward";
  throw new Error(`unknown kind ${kind}`);
}
export function choiceCountFor(kind) { return kind === "chat" ? 2 : 3; }

const IDENT = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
const isStr = (v) => typeof v === "string";
const js = (v) => JSON.stringify(v); // 保留中文字面、處理跳脫；非 ASCII 不轉 \u

// 取一題的乾淨欄位（丟棄 reward 物件與 mergeLessons 注入的 area／vocabProfile 等雜訊）。
function cleanQuestion(q) {
  return {
    questionType: q.questionType || "sentence-choice",
    prompt: q.prompt, promptZh: q.promptZh, answer: q.answer,
    choices: Array.isArray(q.choices) ? q.choices.slice() : [],
    choicesZh: Array.isArray(q.choicesZh) ? q.choicesZh.slice() : []
  };
}
// 取一個 place 的乾淨題庫條目（只留 title／questions）。
export function cleanBankEntry(entry) {
  return { title: entry?.title ?? "", questions: (entry?.questions || []).map(cleanQuestion) };
}

// ===== 結構驗證（寫回前守門；違規即丟錯，附 place／題序定位） =====
export function validateBank(kind, bank) {
  const wantChoices = choiceCountFor(kind);
  if (!bank || typeof bank !== "object") throw new Error("bank 非物件");
  const places = Object.keys(bank);
  if (!places.length) throw new Error("bank 無任何場景");
  for (const place of places) {
    if (!IDENT.test(place)) throw new Error(`場景鍵非法：${place}`);
    const entry = bank[place];
    if (!entry || typeof entry !== "object") throw new Error(`${place}：條目非物件`);
    if (!isStr(entry.title) || !entry.title.trim()) throw new Error(`${place}：缺 title`);
    if (!Array.isArray(entry.questions) || !entry.questions.length) throw new Error(`${place}：缺 questions`);
    entry.questions.forEach((q, i) => {
      const at = `${place} 第 ${i + 1} 題`;
      for (const f of ["prompt", "promptZh", "answer"]) {
        if (!isStr(q[f]) || !q[f].trim()) throw new Error(`${at}：缺 ${f}`);
      }
      if (!Array.isArray(q.choices) || !Array.isArray(q.choicesZh)) throw new Error(`${at}：choices 須為陣列`);
      if (q.choices.length !== wantChoices) throw new Error(`${at}：應有 ${wantChoices} 個選項，實得 ${q.choices.length}`);
      if (q.choices.length !== q.choicesZh.length) throw new Error(`${at}：中英選項數不一致`);
      if (q.choices.some((c) => !isStr(c) || !c.trim())) throw new Error(`${at}：含空白英文選項`);
      if (q.choicesZh.some((c) => !isStr(c) || !c.trim())) throw new Error(`${at}：含空白中文選項`);
      if (!q.choices.includes(q.answer)) throw new Error(`${at}：answer 不在 choices 內`);
    });
  }
  return true;
}

// ===== 序列化：把整個 area 題庫工作副本輸出為與 manifest 一致的 const 區塊文字 =====
// reward 一律輸出變數參照（jobReward／chatReward），不展開字面值，維持 manifest 既有結構。
function serializeQuestion(q, rewardVar) {
  const c = cleanQuestion(q);
  return `      { questionType: ${js(c.questionType)}, prompt: ${js(c.prompt)}, promptZh: ${js(c.promptZh)}, `
    + `answer: ${js(c.answer)}, choices: [${c.choices.map(js).join(",")}], `
    + `choicesZh: [${c.choicesZh.map(js).join(",")}], reward: ${rewardVar} }`;
}
export function serializeBank(constName, bank, rewardVar) {
  const places = Object.keys(bank).map((place) => {
    const entry = cleanBankEntry(bank[place]);
    const qLines = entry.questions.map((q) => serializeQuestion(q, rewardVar)).join(",\n");
    return `  ${place}: {\n    title: ${js(entry.title)},\n    questions: [\n${qLines}\n    ]\n  }`;
  }).join(",\n");
  return `const ${constName} = Object.freeze({\n${places}\n});`;
}

// ===== AI 提示詞組裝（把 spec#1／#11 內容約束編碼為生成規則） =====
export function buildScenePrompt(ctx) {
  const kind = ctx.kind === "chat" ? "chat" : "job";
  const n = Number(ctx.questionCount) || (kind === "chat" ? 2 : 3);
  const choices = choiceCountFor(kind);
  const kindZh = kind === "chat"
    ? "生活聊天（輕鬆日常寒暄，答對提升心情、不發 coins）"
    : "打工任務（切合場景主體的任務，答對得 coins；可結合簡單數學或生活常識）";
  const lines = [
    `You are authoring dialogue for a children's English ADV game. Output ONLY valid JSON, no prose, no markdown fence.`,
    `Scene area: ${ctx.area} (English level: ${ctx.vocabLabel || "n/a"}). Scene: "${ctx.sceneLabel || ctx.place}". Scene character (NPC): ${ctx.npc || "the character"}.`,
    `Dialogue type: ${kindZh}. Produce exactly ${n} question(s); each question has exactly ${choices} choices.`,
    `Hard constraints (must all hold):`,
    `- "prompt" is the NPC's first-person spoken line to the princess (this IS the question stem, no separate narrator opening/closing).`,
    `- "choices" are things the PRINCESS can say back (a reply / promise / action confirmation / report), in natural spoken English; the wrong choices are plausible-but-different responses set in THIS same scene (not surreal/absurd).`,
    `- Natural, child-friendly spoken English; avoid textbook isolated declaratives. For job tasks the correct answer starts with a natural agreement opener (e.g. "Sure", "OK, I can ...", "Yes, let's ..."), then the substantive reply.`,
    `- The princess reply must be a real decision/judgement/social response, NOT a restatement of the NPC's instruction.`,
    `- NEVER mention "English word/letter" or any meta exam framing; do not use exam prompts like "Pick/Tell/Choose".`,
    `- Keep everything specific to this scene's subject; do not produce a generic cross-scene template.`,
    `- "answer" must be EXACTLY one of the strings in "choices". Provide "promptZh" and "choicesZh" as natural Traditional Chinese translations (choicesZh same length & order as choices).`,
    ctx.hint ? `Author hint: ${ctx.hint}` : "",
    `JSON shape (do not include any "reward" field):`,
    `{ ${js(ctx.place)}: { "title": "<short scene title>", "questions": [ { "questionType": "sentence-choice", "prompt": "", "promptZh": "", "answer": "", "choices": [${Array(choices).fill('""').join(", ")}], "choicesZh": [${Array(choices).fill('""').join(", ")}] } ] } }`
  ];
  return lines.filter(Boolean).join("\n");
}

// ===== 解析外部模型 / 手動貼回之 JSON 成題庫工作副本 =====
// 容忍 ```json fence、前後雜訊；回傳 { place: {title,questions[]} }（已 clean、未注入 reward）。
export function parseDialogJson(text, expectedPlace) {
  if (!isStr(text) || !text.trim()) throw new Error("無內容可解析");
  let body = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) throw new Error("找不到 JSON 物件");
  let obj;
  try { obj = JSON.parse(body.slice(start, end + 1)); } catch (e) { throw new Error(`JSON 解析失敗：${e.message}`); }
  // 接受 {place:{...}} 或直接 {title,questions} 兩種頂層形狀。
  let entry;
  if (obj && Array.isArray(obj.questions)) entry = obj;
  else if (expectedPlace && obj && obj[expectedPlace]) entry = obj[expectedPlace];
  else { const keys = Object.keys(obj || {}); if (keys.length === 1) entry = obj[keys[0]]; }
  if (!entry || !Array.isArray(entry.questions)) throw new Error("JSON 結構不含 questions");
  const place = expectedPlace || Object.keys(obj)[0];
  return { [place]: cleanBankEntry(entry) };
}
