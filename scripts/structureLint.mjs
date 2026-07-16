// structureLint.mjs — 結構守門（issue #298，對照 design.md paramStructureQualityBar）
// (a) 單檔行數上限：JS/CSS 單檔 ≤ 800 行；game-engine/main.js（組裝與調度）≤ 500 行。
// (b) 樣式疊層歸零：同一 CSS 檔內、同一 media 範圍之同一選擇器不得出現多個規則塊。
// (c) 超標須具名豁免（登記於下方 EXEMPT，附理由）。
// 用法：node scripts/structureLint.mjs；0 違規 exit 0，否則列出違規並 exit 1。
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const JS_LINE_BUDGET = 800;
const CSS_LINE_BUDGET = 800;
const MAIN_JS_BUDGET = 500; // main.js 收斂為組裝與調度

// 具名豁免（路徑 → 理由）；豁免僅涵蓋行數上限，不豁免 CSS 重複規則塊。
const EXEMPT = new Map([
  ["game-engine/testing/selftests.js", "行為層守門檔（22 個 selftest 套件單檔集中）；拆分另案處理"]
  // devtool/wardrobe-tuner.css 豁免已由 issue #297 收斂移除：工具樣式依分頁解體為
  // tool-shell／tool-wardrobe／tool-stage／tool-map-scene／tool-voice-defaults 五個 ≤800 行分層檔。
]);

// 掃描範圍：引擎、樣式、腳本、伺服器與維護工具；排除生成檔（*.generated.js）與第三方。
const SCAN_DIRS = ["game-engine", "styles", "scripts", "devtool", "content-package", "content-base"];
const SCAN_FILES = ["server.mjs"];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (["node_modules", "_gen-tmp", "_gen-preview"].includes(name)) continue;
      walk(full, out);
    } else if (/\.(js|mjs|css)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const files = [];
for (const dir of SCAN_DIRS) {
  try { walk(join(ROOT, dir), files); } catch { /* 目錄不存在即略過 */ }
}
for (const f of SCAN_FILES) files.push(join(ROOT, f));

const violations = [];

// ── (a) 單檔行數上限 ──────────────────────────────
for (const full of files) {
  const rel = relative(ROOT, full).replaceAll("\\", "/");
  if (/\.generated\.(js|mjs)$/.test(rel)) continue; // 生成投影檔不計（防漂移由 genWardrobeIndex/genVersion gate 把關）
  const lines = readFileSync(full, "utf8").split("\n").length;
  const budget = rel === "game-engine/main.js" ? MAIN_JS_BUDGET : (rel.endsWith(".css") ? CSS_LINE_BUDGET : JS_LINE_BUDGET);
  if (lines > budget) {
    if (EXEMPT.has(rel)) continue;
    violations.push(`[L01] ${rel}：${lines} 行 > 上限 ${budget}（單檔行數上限；豁免須具名登記）`);
  }
}

// ── (b) CSS 同檔同 media 重複選擇器規則塊 ─────────────
function auditCss(rel, text) {
  // 去註解
  const css = text.replace(/\/\*[\s\S]*?\*\//g, "");
  const seen = new Map(); // key = media||selector → [lineNumbers]
  let i = 0, line = 1, mediaStack = [];
  const n = css.length;
  let buf = "";
  let bufLine = 1;
  const contexts = []; // 追蹤目前巢狀（media 或 selector 塊）
  while (i < n) {
    const ch = css[i];
    if (ch === "\n") line += 1;
    if (ch === "{") {
      const head = buf.trim();
      buf = "";
      if (head.startsWith("@")) {
        contexts.push({ type: "at", head });
        if (/^@media/.test(head)) mediaStack.push(head.replace(/\s+/g, " "));
        else mediaStack.push(null); // 其他 at-rule（supports/keyframes…）不參與 media key，但保持深度
      } else {
        contexts.push({ type: "rule", head });
        // 只稽核頂層與 media 內第一層規則塊；@keyframes 等非 media at-rule 內部（from/to/%）不屬選擇器、跳過。
        const inNonMediaAt = contexts.some((c) => c.type === "at" && !/^@media/.test(c.head));
        if (!inNonMediaAt && contexts.filter((c) => c.type === "rule").length === 1) {
          const media = mediaStack.filter(Boolean).join(" && ") || "(root)";
          // 選擇器正規化：壓空白、逗號清單排序（a,b 與 b,a 視為同塊）
          const sel = head.replace(/\s+/g, " ").split(",").map((s) => s.trim()).sort().join(", ");
          const key = `${media} ⟶ ${sel}`;
          if (!seen.has(key)) seen.set(key, []);
          seen.get(key).push(bufLine);
        }
      }
      bufLine = line;
    } else if (ch === "}") {
      const popped = contexts.pop();
      if (popped?.type === "at") mediaStack.pop();
      buf = "";
      bufLine = line;
    } else {
      if (buf === "" && ch.trim()) bufLine = line;
      buf += ch;
      if (ch === ";") { buf = ""; bufLine = line; }
    }
    i += 1;
  }
  for (const [key, lines2] of seen) {
    if (lines2.length > 1) {
      violations.push(`[C01] ${rel}：同 media 同選擇器重複規則塊 ×${lines2.length}（行 ${lines2.join("、")}）「${key.slice(0, 120)}」`);
    }
  }
}

for (const full of files) {
  const rel = relative(ROOT, full).replaceAll("\\", "/");
  if (!rel.endsWith(".css")) continue;
  auditCss(rel, readFileSync(full, "utf8"));
}

const header = `structureLint（issue #298）── 掃描 ${files.length} 檔（JS/CSS），豁免 ${EXEMPT.size} 檔`;
if (violations.length) {
  console.log(header);
  for (const v of violations) console.log(v);
  console.log(`結果：FAIL（${violations.length} 項違規）`);
  process.exit(1);
}
console.log(header);
console.log("結果：PASS（0 違規）");
process.exit(0);
