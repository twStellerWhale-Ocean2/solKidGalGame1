#!/usr/bin/env node
// scripts/genVersion.mjs — 版號 SSOT 投影器。
// 唯一 SSOT＝repo 根目錄 VERSION（JSON：semver＋date＋copyright＋history）；本工具自 VERSION 投影產生
//   game-engine/build/version.js（遊戲 runtime：copyright／versionHistory／buildInfo）
//   CHANGELOG.md（修訂紀錄，全量）
// 版號釘選於 PR merge（依變更型別 bump VERSION），release 與版號解耦——見 docs/design.md＜IV.A＞。
// 用法：
//   node scripts/genVersion.mjs          重新生成上述兩檔
//   node scripts/genVersion.mjs --check  防漂移：斷言兩檔與 VERSION 投影一致（不一致 exit 1）
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const versionPath = join(root, "VERSION");
const versionJsPath = join(root, "game-engine", "build", "version.js");
const changelogPath = join(root, "CHANGELOG.md");
const chartYamlPath = join(root, "deploy", "helm", "Chart.yaml");

function fail(msg) {
  console.error(`genVersion: ${msg}`);
  process.exit(1);
}

function loadVersion() {
  let data;
  try {
    data = JSON.parse(readFileSync(versionPath, "utf8"));
  } catch (e) {
    fail(`無法解析 VERSION（須為 JSON）：${e.message}`);
  }
  const errs = [];
  const semver = /^\d+\.\d+\.\d+$/;
  const ymd = /^\d{4}-\d{2}-\d{2}$/;
  if (typeof data.version !== "string" || !semver.test(data.version)) errs.push("version 須為 SemVer 字串 x.y.z");
  if (typeof data.date !== "string" || !ymd.test(data.date)) errs.push("date 須為 YYYY-MM-DD");
  if (typeof data.copyright !== "string" || !data.copyright) errs.push("copyright 須為非空字串");
  if (!Array.isArray(data.history) || data.history.length === 0) {
    errs.push("history 須為非空陣列");
  } else {
    const h0 = data.history[0];
    if (h0.version !== data.version) errs.push(`history[0].version（${h0.version}）須等於 version（${data.version}）`);
    if (h0.date !== data.date) errs.push(`history[0].date（${h0.date}）須等於 date（${data.date}）`);
    data.history.forEach((h, i) => {
      if (typeof h.version !== "string" || !h.version) errs.push(`history[${i}].version 缺漏`);
      if (typeof h.date !== "string" || !ymd.test(h.date || "")) errs.push(`history[${i}].date 須為 YYYY-MM-DD`);
      if (typeof h.summaryZh !== "string" || !h.summaryZh) errs.push(`history[${i}].summaryZh 缺漏`);
      if (typeof h.playerVisible !== "boolean") errs.push(`history[${i}].playerVisible 須為 boolean`);
    });
  }
  if (errs.length) fail("VERSION 格式違規：\n  - " + errs.join("\n  - "));
  return data;
}

// 投影一：遊戲 runtime 模組（玩家可見沿革＋當前 buildInfo）。
function genVersionJs(data) {
  const player = data.history.filter((h) => h.playerVisible);
  const histLines = player
    .map(
      (h) =>
        `  { version: ${JSON.stringify(h.version)}, buildDateTime: ${JSON.stringify(h.date)}, summaryZh: ${JSON.stringify(h.summaryZh)} },`,
    )
    .join("\n");
  const h0 = data.history[0];
  const issues = h0.issue ? [h0.issue] : [];
  const issuesLiteral = `[${issues.map((s) => JSON.stringify(s)).join(", ")}]`;
  return `// AUTO-GENERATED FROM /VERSION — DO NOT EDIT BY HAND.
// 版號／版本沿革唯一 SSOT＝repo 根目錄 VERSION（semver＋date＋copyright＋history）；本檔為其投影。
// 改沿革：編輯 VERSION → \`node scripts/genVersion.mjs\`（重生本檔與 CHANGELOG.md）。
// 防漂移：\`node scripts/genVersion.mjs --check\`（docs/design.md＜IV.A＞測試指令）。
// 玩家可見沿革＝VERSION.history 中 playerVisible 之投影；buildInfo 之 commit SHA 於 build 當下由 git 取、不入 VERSION。
export const copyright = ${JSON.stringify(data.copyright)};

export const versionHistory = [
${histLines}
];

export const buildInfo = {
  version: ${JSON.stringify(data.version)},
  buildDate: ${JSON.stringify(data.date)},
  buildDateTime: ${JSON.stringify(data.date)},
  issues: ${issuesLiteral}
};
`;
}

// 投影二：修訂紀錄（全量，含 internal；遊戲 About 只投影 playerVisible 筆）。
function genChangelog(data) {
  const head = `# Changelog

本檔自 repo 根目錄 \`VERSION\` 投影產生（\`node scripts/genVersion.mjs\`）；請勿手改，改沿革請編輯 \`VERSION\`。
版號釘選於 PR merge（依變更型別 bump VERSION），release 與版號解耦；本檔收全部變更，遊戲 About 只投影 playerVisible 筆。
`;
  const sections = data.history
    .map((h) => {
      const type = h.type ? h.type : "change";
      const issue = h.issue ? ` (${h.issue})` : "";
      const vis = h.playerVisible ? "" : " _(internal)_";
      return `## ${h.version} — ${h.date}${vis}\n- ${type}${issue}: ${h.summaryZh}\n`;
    })
    .join("\n");
  return `${head}\n${sections}`;
}

// 投影三：helm chart 版本鏈（issue #311，cfgTest#12）——chart version／appVersion 與 VERSION 同源。
function genChartYaml(data) {
  return [
    "# 由 scripts/genVersion.mjs 自根目錄 VERSION 投影生成——禁止手改（防漂移：genVersion --check）。",
    "apiVersion: v2",
    "name: sollingoworld-chart",
    "description: solLingoWorld 整包自架部署（遊戲殼＋帳號存檔 API＋/admin/ 線上管理＋PostgreSQL；spec#27）",
    "type: application",
    `version: ${data.version}`,
    `appVersion: "${data.version}"`,
    "",
  ].join("\n");
}

const norm = (s) => s.replace(/\r\n/g, "\n");

function main() {
  const check = process.argv.includes("--check");
  const data = loadVersion();
  const targets = [
    { path: versionJsPath, label: "game-engine/build/version.js", content: genVersionJs(data) },
    { path: changelogPath, label: "CHANGELOG.md", content: genChangelog(data) },
    { path: chartYamlPath, label: "deploy/helm/Chart.yaml", content: genChartYaml(data) },
  ];
  if (check) {
    const drift = [];
    for (const t of targets) {
      let actual = null;
      try {
        actual = readFileSync(t.path, "utf8");
      } catch {
        drift.push(`${t.label}：檔案不存在`);
        continue;
      }
      if (norm(actual) !== norm(t.content)) drift.push(`${t.label}：與 VERSION 投影不一致`);
    }
    if (drift.length) {
      console.error("genVersion --check 失敗（版號投影漂移）：\n  - " + drift.join("\n  - ") + "\n  修復：node scripts/genVersion.mjs");
      process.exit(1);
    }
    console.log("genVersion --check：PASS（version.js／CHANGELOG.md／deploy/helm/Chart.yaml 與 VERSION 一致）");
    return;
  }
  for (const t of targets) {
    writeFileSync(t.path, t.content);
    console.log(`生成 ${t.label}`);
  }
}

main();
