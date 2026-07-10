#!/usr/bin/env node
// scripts/chartLint.mjs — helm 整包機判守門（issue #311：cfgTest#12／intTest#79）。
// 檢查：①helm lint 0 錯誤；②helm template 產出合法 manifest 且含契約要求之資源與註記；
//       ③版本鏈防漂移（Chart.yaml version/appVersion＝VERSION.version）；
//       ④未供給必填秘密時 render 失敗並明確報錯；
//       ⑤image 內容邊界：Dockerfile COPY 集合 ＝ sysApi 靜態 allowlist（GAME_SHELL_DIRS＋index.html＋admin-console）＋服務本體。
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const chartDir = join(root, "deploy", "helm");
const errors = [];

function helm(args, opts = {}) {
  return execFileSync("helm", args, { encoding: "utf8", cwd: root, ...opts });
}

// ① helm lint
try {
  helm(["lint", chartDir]);
} catch (e) {
  errors.push(`helm lint 失敗：${e.stdout || e.message}`);
}

// ② helm template（供給必填秘密之測試值）
let manifest = "";
try {
  manifest = helm(["template", "luminara", chartDir, "--set", "secrets.adminUsername=lintadm,secrets.adminPassword=lintpw123"]);
} catch (e) {
  errors.push(`helm template 失敗：${e.stderr || e.message}`);
}
if (manifest) {
  const must = [
    ["kind: Deployment", "app Deployment"],
    ["kind: StatefulSet", "PostgreSQL StatefulSet"],
    ["kind: PersistentVolumeClaim", "資料 PVC"],
    ["kind: Secret", "秘密 Secret"],
    ["nodePort: 30418", "固定 nodePort 配號"],
    ["path: /healthz", "liveness 探針 /healthz"],
    ["path: /readyz", "readiness 探針 /readyz"],
    ["wait-for-db", "initContainer 等待資料庫"],
    ["PGDATA", "PGDATA 子目錄（block 型 StorageClass 之 lost+found 防護）"],
    ["runAsUser: 1000", "app 容器數字 runAsUser（Dockerfile USER 為名字時 kubelet 無法驗 non-root，#317 審查）"],
    ["runAsUser: 65534", "init 容器數字 runAsUser"],
    ["seccompProfile", "seccomp RuntimeDefault"],
    ["cpu: 50m", "app resources 預設（requests）"],
  ];
  for (const [needle, label] of must) {
    if (!manifest.includes(needle)) errors.push(`manifest 缺 ${label}（找不到 "${needle}"）`);
  }
  // keep 註記須 PVC 與 Secret 各自帶；runAsNonRoot 須 app 與 init 各自帶（只驗全文一次會被另一處遮蔽）。
  const keepCount = (manifest.match(/helm\.sh\/resource-policy: keep/g) || []).length;
  if (keepCount < 2) errors.push(`resource-policy: keep 註記數 ${keepCount} < 2（PVC 與 Secret 須各自掛 keep）`);
  const nonRootCount = (manifest.match(/runAsNonRoot: true/g) || []).length;
  if (nonRootCount < 2) errors.push(`runAsNonRoot 註記數 ${nonRootCount} < 2（app 與 init 容器須各自硬化，#317）`);
}

// ③ 版本鏈：Chart.yaml 與 VERSION 同源
const version = JSON.parse(readFileSync(join(root, "VERSION"), "utf8")).version;
const chartYaml = readFileSync(join(chartDir, "Chart.yaml"), "utf8");
if (!chartYaml.includes(`version: ${version}`)) errors.push(`Chart.yaml version 未對齊 VERSION（${version}）`);
if (!chartYaml.includes(`appVersion: "${version}"`)) errors.push(`Chart.yaml appVersion 未對齊 VERSION（${version}）`);

// ④ 必填秘密缺席 → render 必須失敗且訊息明確
try {
  helm(["template", "luminara", chartDir], { stdio: ["ignore", "pipe", "pipe"] });
  errors.push("未供給必填秘密時 helm template 竟然成功（chart 不得設不安全預設值）");
} catch (e) {
  const msg = String(e.stderr || "");
  if (!msg.includes("必填")) errors.push(`必填秘密缺席之報錯訊息不明確：${msg.slice(0, 200)}`);
}

// ⑤ image 內容邊界：Dockerfile COPY 對齊 sysApi 靜態 allowlist（單一事實來源）
const appTs = readFileSync(join(root, "sysApi", "src", "app.ts"), "utf8");
const dirsMatch = appTs.match(/GAME_SHELL_DIRS = \[([^\]]+)\]/);
if (!dirsMatch) {
  errors.push("sysApi/src/app.ts 找不到 GAME_SHELL_DIRS（allowlist SSOT 位置變動，請同步本檢查）");
} else {
  const allow = dirsMatch[1].split(",").map((s) => s.trim().replace(/["']/g, "")).filter(Boolean);
  const dockerfile = readFileSync(join(root, "Dockerfile"), "utf8");
  // COPY 可有多個來源（最後一個 token 是目的地）——逐 token 解析，單看第一來源會漏檢後續來源。
  const copies = [...dockerfile.matchAll(/^COPY (?!--from)(.+)$/gm)]
    .flatMap((m) => m[1].trim().split(/\s+/).slice(0, -1))
    .map((s) => s.replace(/^\.\//, ""));
  const expected = [...allow, "index.html", "admin-console"];
  for (const dir of expected) {
    if (!copies.includes(dir)) errors.push(`Dockerfile 缺 allowlist 項 COPY：${dir}`);
  }
  const service = ["sysApi/package.json", "sysApi/tsconfig.json", "sysApi/src", "sysApi/package-lock.json"];
  for (const c of copies) {
    if (!expected.includes(c) && !service.includes(c)) errors.push(`Dockerfile COPY 超出 allowlist＋服務本體邊界：${c}（dev 工具與內部檔案不入包）`);
  }
}

if (errors.length) {
  console.error("chartLint 失敗：\n  - " + errors.join("\n  - "));
  process.exit(1);
}
console.log("chartLint：PASS（helm lint／template／版本鏈／必填秘密守門／image 邊界一致）");
