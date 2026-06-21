// issue #245：場景題庫 IO 純函式的可重跑測試（node tool/scene-bank-io.test.mjs）。
// 對四地區真實 manifest 做 reconstruct → serialize → 重新 import 的 round-trip 等價比對，
// 固化「GUI 寫回不破壞題庫結構」之不變式；另測 validateBank 守門與 parseDialogJson／buildScenePrompt。
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SCENE_AREA_KEYS, bankConstName, rewardVarFor, cleanBankEntry,
  serializeBank, validateBank, parseDialogJson, buildScenePrompt
} from "./scene-bank-io.mjs";
import { castleSceneConfigs } from "../content-package/areas/castle/manifest.js";
import { urbanSceneConfigs } from "../content-package/areas/urban/manifest.js";
import { ruralSceneConfigs } from "../content-package/areas/rural/manifest.js";
import { wildSceneConfigs } from "../content-package/areas/wild/manifest.js";

const configsByArea = { castle: castleSceneConfigs, urban: urbanSceneConfigs, rural: ruralSceneConfigs, wild: wildSceneConfigs };
const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };

// 由 sceneConfigs 還原某類型整區題庫（與 scene-tuner 工作副本同法）。
function reconstructBank(configs, key) {
  const bank = {};
  for (const [place, cfg] of Object.entries(configs)) {
    if (cfg && cfg[key]) bank[place] = cleanBankEntry(cfg[key]);
  }
  return bank;
}

async function roundTrip(area, kind) {
  const key = kind === "job" ? "lesson" : "chatLesson";
  const bank = reconstructBank(configsByArea[area], key);
  check(Object.keys(bank).length > 0, `${area}/${kind}: 還原題庫為空`);
  try { validateBank(kind, bank); } catch (e) { check(false, `${area}/${kind}: validateBank 應通過但丟錯：${e.message}`); }
  const constName = bankConstName(area, kind);
  const block = serializeBank(constName, bank, rewardVarFor(kind));
  const tmp = join(tmpdir(), `scene-bank-rt-${area}-${kind}-${Date.now()}.mjs`);
  const module = `const jobReward = { coins: 0 };\nconst chatReward = { coins: 0 };\n${block}\nexport { ${constName} };\n`;
  await writeFile(tmp, module);
  try {
    const imported = (await import(pathToFileURL(tmp).href))[constName];
    const a = JSON.stringify(bank);
    const b = JSON.stringify(Object.fromEntries(Object.keys(imported).map((p) => [p, cleanBankEntry(imported[p])])));
    check(a === b, `${area}/${kind}: round-trip 不等價`);
  } catch (e) {
    check(false, `${area}/${kind}: 重新 import 失敗（序列化非合法 JS）：${e.message}`);
  } finally {
    await unlink(tmp).catch(() => {});
  }
}

function testValidation() {
  // answer 不在 choices → 應丟錯。
  const bad = { kingHall: { title: "x", questions: [{ questionType: "sentence-choice", prompt: "p", promptZh: "p", answer: "z", choices: ["a", "b", "c"], choicesZh: ["甲", "乙", "丙"] }] } };
  let threw = false; try { validateBank("job", bad); } catch { threw = true; }
  check(threw, "validateBank 未擋下 answer∉choices");
  // 打工題庫給 2 選項 → 應丟錯（job 需 3）。
  const wrongCount = { kingHall: { title: "x", questions: [{ questionType: "sentence-choice", prompt: "p", promptZh: "p", answer: "a", choices: ["a", "b"], choicesZh: ["甲", "乙"] }] } };
  let threw2 = false; try { validateBank("job", wrongCount); } catch { threw2 = true; }
  check(threw2, "validateBank 未擋下 job 選項數錯誤");
}

function testParse() {
  const fenced = "```json\n{ \"kingHall\": { \"title\": \"T\", \"questions\": [ { \"questionType\": \"sentence-choice\", \"prompt\": \"Hi\", \"promptZh\": \"嗨\", \"answer\": \"OK\", \"choices\": [\"OK\",\"No\",\"Maybe\"], \"choicesZh\": [\"好\",\"不\",\"也許\"] } ] } }\n```";
  const parsed = parseDialogJson(fenced, "kingHall");
  check(parsed.kingHall && parsed.kingHall.questions.length === 1, "parseDialogJson 未正確解析含 fence 的 JSON");
  try { validateBank("job", parsed); } catch (e) { check(false, `parseDialogJson 產物未過 validateBank：${e.message}`); }
  let threw = false; try { parseDialogJson("not json", "kingHall"); } catch { threw = true; }
  check(threw, "parseDialogJson 未擋下非 JSON 文字");
}

function testPrompt() {
  const p = buildScenePrompt({ area: "castle", place: "kingHall", kind: "job", npc: "King Rowan", sceneLabel: "King's Hall", vocabLabel: "Dolch", hint: "crown task" });
  check(/ONLY valid JSON/i.test(p), "buildScenePrompt 未要求純 JSON");
  check(/first-person/i.test(p) && /3 choices/.test(p), "buildScenePrompt 未含關鍵約束（第一人稱／選項數）");
  check(p.includes("kingHall"), "buildScenePrompt 未含 place 鍵");
}

for (const area of SCENE_AREA_KEYS) { await roundTrip(area, "job"); await roundTrip(area, "chat"); }
testValidation();
testParse();
testPrompt();

if (errors.length) {
  console.error(`FAIL scene-bank-io: ${errors.length} 項`);
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}
console.log("PASS scene-bank-io: round-trip x8 (4 area × job/chat) + validation + parse + prompt 全通過");
