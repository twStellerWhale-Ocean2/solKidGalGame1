// issue #311 端對端驗證（intTest#80／e2eTest#27 之機器面）＋ README 證據截圖（GATE ＜2.5節＞）。
// 前置：本機 Kubernetes 叢集（kubectl 當前 context，如 rancher-desktop k3s）＋ helm ＋ docker（與叢集共用 dockerd）。
// 流程：build image（雙 tag 模擬升版）→ helm install（secrets 以 values 檔供給）→ 遊玩/管理 smoke＋截圖
//       → helm upgrade（不重供秘密）驗資料保全 → pg_dump 備份→刪帳號→DROP/CREATE＋psql 還原驗回復
//       → helm uninstall（PVC/Secret keep）→ 同名重裝驗續用 → 全數清理。
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
const pkg = await import("file:///C:/Users/User/Documents/Github/solLingoWorld/.codex/tools/pw/node_modules/playwright-core/index.js");
const { chromium } = pkg.default || pkg;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = path.join(repoRoot, "docs", "manual-assets");
fs.mkdirSync(SHOTS, { recursive: true });
const suffix = Date.now().toString(36);
const NS = "luminara-e2e";
const RELEASE = "lume2e";
const NODE_PORT = 30419; // 避開正式預設 30418，e2e 專用
// BASE 用 127.0.0.2（非 dev-host 白名單）：證據截圖不混入 dev-only 管理工具鈕（#309 審查 B2 慣例）。
const BASE = `http://127.0.0.2:${NODE_PORT}`;
const IMAGE = "solkidgal-e2e";
const TAG_A = `${suffix}a`;
const TAG_B = `${suffix}b`;
const adminUser = `adm${suffix}`.slice(0, 16);
const adminPassword = "helmadminpw1";
const kidUser = `hk${suffix}`.slice(0, 16);
const kidPassword = "kidpw6";

let failures = 0;
function check(name, condition, detail = "") {
  console.log(`  ${condition ? "PASS" : "FAIL"} ${name}${condition || !detail ? "" : ` — ${detail}`}`);
  if (!condition) failures += 1;
}
function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"], ...opts });
}
function kubectl(args, opts = {}) { return run("kubectl", ["-n", NS, ...args], opts); }

async function api(pathname, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch { /* 204 */ }
  return { status: res.status, body: json };
}

async function waitReady(label, probe, tries = 80, delayMs = 1500) {
  for (let i = 0; i < tries; i += 1) {
    try { if (await probe()) return true; } catch { /* retry */ }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  console.error(`waitReady 逾時：${label}`);
  return false;
}
const httpReady = () => fetch(`${BASE}/readyz`).then((r) => r.ok);

async function loginWithRetry(username, password, tries = 10) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await api("/api/auth/login", { method: "POST", body: { username, password } });
      if (res.status === 200) return res;
    } catch { /* 連線層錯誤（服務恢復中）：續retry */ }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return { status: 0, body: null };
}

let secretsFile = "";
let browser = null;
try {
  console.log("== 前置：build image（雙 tag 模擬升版）==");
  run("docker", ["build", "-t", `${IMAGE}:${TAG_A}`, "."], { stdio: ["ignore", "inherit", "inherit"] });
  run("docker", ["tag", `${IMAGE}:${TAG_A}`, `${IMAGE}:${TAG_B}`]);

  console.log("== 1. helm install（秘密以 values 檔供給、用後即刪）==");
  secretsFile = path.join(os.tmpdir(), `lume2e-secrets-${suffix}.yaml`);
  fs.writeFileSync(secretsFile, `secrets:\n  adminUsername: "${adminUser}"\n  adminPassword: "${adminPassword}"\n`);
  run("helm", ["install", RELEASE, "deploy/helm", "-n", NS, "--create-namespace", "-f", secretsFile,
    "--set", `image.repository=${IMAGE}`, "--set", `image.tag=${TAG_A}`, "--set", `service.nodePort=${NODE_PORT}`]);
  fs.unlinkSync(secretsFile); secretsFile = "";
  check("install 後就緒（readyz 200，DB 晚就緒由 init/probe 吸收）", await waitReady("install", httpReady));
  const podsOut = kubectl(["get", "pods"]);
  console.log(podsOut);
  check("app 與 db pod 均 Running", /app-.*Running/.test(podsOut) && /db-0.*Running/.test(podsOut));
  const healthz = await fetch(`${BASE}/healthz`);
  check("healthz 200", healthz.ok);

  console.log("== 2. 遊玩＋管理 smoke（經 NodePort 固定配號）==");
  const reg = await api("/api/auth/register", { method: "POST", body: { username: kidUser, password: kidPassword } });
  check("玩家註冊 201", reg.status === 201, `status=${reg.status}`);
  const kidToken = reg.body?.token;
  const put = await api("/api/save", { method: "PUT", token: kidToken, body: { state: { coins: 77, playerName: "HelmKid", playLimit: {}, outfit: {} }, schemaVersion: "v1", baseUpdatedAt: null } });
  check("雲端存檔 PUT 200", put.status === 200, `status=${put.status}`);
  const adminLogin = await loginWithRetry(adminUser, adminPassword, 3);
  check("admin 起始帳號可登入（bootstrap 生效）", adminLogin.status === 200, `status=${adminLogin.status}`);
  const adminToken = adminLogin.body?.token;
  const putSettings = await api("/api/admin/settings", { method: "PUT", token: adminToken, body: { registrationOpen: true, defaultPlayMinutes: 12, defaultRestMinutes: 15, defaultPlayMaxMinutes: 20 } });
  check("執行期設定 PUT 200", putSettings.status === 200, `status=${putSettings.status}`);

  console.log("== 3. README 證據截圖（helm 部署之最終態）==");
  browser = await chromium.launch({ headless: true, channel: "chrome" });
  const game = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await game.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await game.waitForTimeout(1200);
  await game.screenshot({ path: path.join(SHOTS, "issue311-01-helm-game-login.png") });
  const admin = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await admin.goto(`${BASE}/admin/`, { waitUntil: "networkidle" });
  await admin.fill("#loginUsername", adminUser);
  await admin.fill("#loginPassword", adminPassword);
  await admin.click("#loginSubmit");
  await admin.waitForSelector("#accountsList .account-row, #accountsList .account-card", { timeout: 10_000 }).catch(() => {});
  await admin.waitForTimeout(1200);
  await admin.screenshot({ path: path.join(SHOTS, "issue311-02-helm-admin-accounts.png") });
  check("兩張證據截圖已產出", fs.existsSync(path.join(SHOTS, "issue311-01-helm-game-login.png")) && fs.existsSync(path.join(SHOTS, "issue311-02-helm-admin-accounts.png")));

  console.log("== 4. helm upgrade（不重供秘密）→ 資料保全 ==");
  run("helm", ["upgrade", RELEASE, "deploy/helm", "-n", NS,
    "--set", `image.repository=${IMAGE}`, "--set", `image.tag=${TAG_B}`, "--set", `service.nodePort=${NODE_PORT}`]);
  run("kubectl", ["-n", NS, "rollout", "status", `deployment/${RELEASE}-app`, "--timeout=180s"]);
  check("upgrade 後就緒", await waitReady("upgrade", httpReady));
  const deployedImage = kubectl(["get", "deployment", `${RELEASE}-app`, "-o", "jsonpath={.spec.template.spec.containers[0].image}"]);
  check("升級後 image tag 反映新版", deployedImage.trim() === `${IMAGE}:${TAG_B}`, deployedImage);
  const kidAfterUp = await loginWithRetry(kidUser, kidPassword);
  check("升級後玩家可登入（帳號保留）", kidAfterUp.status === 200);
  const saveAfterUp = await api("/api/save", { token: kidAfterUp.body?.token });
  check("升級後存檔保留（coins=77）", saveAfterUp.body?.state?.coins === 77, JSON.stringify(saveAfterUp.body?.state?.coins));
  const adminAfterUp = await loginWithRetry(adminUser, adminPassword, 3);
  const settingsAfterUp = await api("/api/admin/settings", { token: adminAfterUp.body?.token });
  check("升級後執行期設定保留（12 分鐘）", settingsAfterUp.body?.defaultPlayMinutes === 12, JSON.stringify(settingsAfterUp.body));

  console.log("== 5. 備份→毀損→還原（災難復原實走）==");
  const dump = kubectl(["exec", `${RELEASE}-db-0`, "--", "pg_dump", "-U", "luminara", "luminara"]);
  check("pg_dump 產出非空 dump", dump.includes("CREATE TABLE") && dump.length > 1000, `bytes=${dump.length}`);
  const dumpFile = path.join(os.tmpdir(), `lume2e-backup-${suffix}.sql`);
  fs.writeFileSync(dumpFile, dump);
  // 模擬毀損：刪除玩家帳號（連同存檔）
  const kidId = (await api("/api/admin/accounts", { token: adminAfterUp.body?.token })).body?.accounts?.find((a) => a.username === kidUser)?.id;
  await api(`/api/admin/accounts/${kidId}`, { method: "DELETE", token: adminAfterUp.body?.token });
  const kidGone = await api("/api/auth/login", { method: "POST", body: { username: kidUser, password: kidPassword } });
  check("毀損後玩家帳號已不可登入", kidGone.status === 401, `status=${kidGone.status}`);
  // 還原：DROP/CREATE（FORCE 斷開 app 連線）→ psql 倒回 dump
  kubectl(["exec", `${RELEASE}-db-0`, "--", "psql", "-U", "luminara", "-d", "postgres", "-c", "DROP DATABASE luminara WITH (FORCE);", "-c", "CREATE DATABASE luminara OWNER luminara;"]);
  execSync(`kubectl -n ${NS} exec -i ${RELEASE}-db-0 -- psql -U luminara -d luminara -f -`, { input: dump, cwd: repoRoot, stdio: ["pipe", "ignore", "ignore"] });
  const kidRestored = await loginWithRetry(kidUser, kidPassword);
  check("還原後玩家帳號回復可登入", kidRestored.status === 200, `status=${kidRestored.status}`);
  const saveRestored = await api("/api/save", { token: kidRestored.body?.token });
  check("還原後存檔回復（coins=77）", saveRestored.body?.state?.coins === 77);
  fs.unlinkSync(dumpFile);

  console.log("== 6. uninstall（keep 保留）→ 同名重裝續用 ==");
  run("helm", ["uninstall", RELEASE, "-n", NS]);
  const pvcOut = kubectl(["get", "pvc", `${RELEASE}-db-data`, "-o", "name"]);
  check("uninstall 後 PVC 仍在（resource-policy: keep）", pvcOut.includes(`${RELEASE}-db-data`), pvcOut);
  const secretOut = kubectl(["get", "secret", `${RELEASE}-secrets`, "-o", "name"]);
  check("uninstall 後 Secret 仍在（隨資料同留存）", secretOut.includes(`${RELEASE}-secrets`), secretOut);
  run("helm", ["install", RELEASE, "deploy/helm", "-n", NS,
    "--set", `image.repository=${IMAGE}`, "--set", `image.tag=${TAG_B}`, "--set", `service.nodePort=${NODE_PORT}`]);
  check("重裝（不重供秘密，lookup 沿用）後就緒", await waitReady("reinstall", httpReady));
  const kidAfterReinstall = await loginWithRetry(kidUser, kidPassword);
  check("重裝後資料續用（玩家可登入）", kidAfterReinstall.status === 200, `status=${kidAfterReinstall.status}`);
  const saveAfterReinstall = await api("/api/save", { token: kidAfterReinstall.body?.token });
  check("重裝後存檔仍在（coins=77）", saveAfterReinstall.body?.state?.coins === 77);
} finally {
  console.log("== 清理：uninstall＋刪 keep 資源＋刪 namespace＋刪 e2e image ==");
  if (browser) await browser.close().catch(() => {});
  if (secretsFile && fs.existsSync(secretsFile)) fs.unlinkSync(secretsFile);
  try { run("helm", ["uninstall", RELEASE, "-n", NS]); } catch { /* already gone */ }
  try { kubectl(["delete", "pvc", `${RELEASE}-db-data`, "--ignore-not-found"]); } catch { /* ok */ }
  try { kubectl(["delete", "secret", `${RELEASE}-secrets`, "--ignore-not-found"]); } catch { /* ok */ }
  try { run("kubectl", ["delete", "namespace", NS, "--ignore-not-found", "--timeout=120s"]); } catch { /* ok */ }
  try { run("docker", ["rmi", `${IMAGE}:${TAG_A}`, `${IMAGE}:${TAG_B}`]); } catch { /* ok */ }
}

console.log(failures === 0 ? "\ne2e-helm：ALL PASS" : `\ne2e-helm：${failures} 項 FAIL`);
process.exit(failures === 0 ? 0 : 1);
