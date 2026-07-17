import { createServer } from "node:http";
import { readFile, writeFile, stat, unlink } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execFile } from "node:child_process";
import { networkInterfaces } from "node:os";
import { outfitSlots } from "./sysLingoWorld/modShell/content-package/wardrobe/_shared/rules.js";
import { SCENE_AREA_KEYS, SCENE_DIALOG_KINDS, bankConstName, rewardVarFor, serializeBank, validateBank } from "./devtool/scene-bank-io.mjs";

const root = dirname(fileURLToPath(import.meta.url)); // repo 根：devtool/、docs/、scripts/
// issue #342：遊戲殼移住 sysLingoWorld/modShell/——URL 空間不變（/game-engine/*、/content-package/* 照舊），
// 靜態服務先查 repo 根（devtool 等）、後查 shellRoot；內容寫回一律以 shellRoot 為基準。
const shellRoot = join(root, "sysLingoWorld", "modShell");
const rootPrefix = root.endsWith(sep) ? root : `${root}${sep}`;
const shellPrefix = shellRoot.endsWith(sep) ? shellRoot : `${shellRoot}${sep}`;
const port = Number(process.env.PORT || 4174);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8"
};

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const normalized = normalize(pathname).replace(/^[/\\]+/, "").replace(/^(\.\.[/\\])+/, "");
  // 兩段式解析：repo 根（devtool/、docs/…）優先，未命中回退 shellRoot（index.html、game-engine/、content-*、styles/）。
  const rootCandidate = join(root, normalized);
  const shellCandidate = join(shellRoot, normalized);
  if ((rootCandidate !== root && !rootCandidate.startsWith(rootPrefix)) || (shellCandidate !== shellRoot && !shellCandidate.startsWith(shellPrefix))) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  let filePath = rootCandidate;
  try {
    await stat(rootCandidate);
  } catch {
    filePath = shellCandidate;
  }
  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store" // dev 本機預覽：永不快取，使改檔即時生效（非 GitHub Pages 行為）
    });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

// Wardrobe Tuner「套用」端點（dev only，僅綁 127.0.0.1）：類別級 bounds 仍以白名單區塊替換寫回 rules.js；
// issue #267：per-asset targetBox 改寫回各素材旁 sidecar（取代 asset-target-overrides.js），寫後重生衍生 index。
const APPLY_TARGETS = {
  rules: { file: "content-package/wardrobe/_shared/rules.js", name: "wardrobeLayerBoundsByType" }
};

function validatedBlock(name, block) {
  const trimmed = String(block || "").trim();
  if (!trimmed.startsWith(`export const ${name} = Object.freeze({`) || !trimmed.endsWith("});")) {
    throw new Error(`bad ${name} block`);
  }
  return trimmed;
}

function replaceExportBlock(source, name, block) {
  const re = new RegExp(`export const ${name} = Object\\.freeze\\(\\{[\\s\\S]*?\\n\\}\\);`);
  if (!re.test(source)) throw new Error(`block ${name} not found in target file`);
  return source.replace(re, block);
}

async function handleApplyWardrobe(request, response) {
  try {
    const payload = JSON.parse(await readBody(request) || "{}");
    const written = [];
    // 類別級 bounds 仍寫回 rules.js（白名單區塊替換、保留原 EOL）。
    if (typeof payload.rules === "string") {
      const target = APPLY_TARGETS.rules;
      const block = validatedBlock(target.name, payload.rules);
      const filePath = join(shellRoot, target.file);
      const original = await readFile(filePath, "utf8");
      const eol = original.includes("\r\n") ? "\r\n" : "\n";
      const updated = replaceExportBlock(original, target.name, block).replace(/\r\n/g, "\n").replace(/\n/g, eol);
      await writeFile(filePath, updated);
      written.push(target.file);
    }
    // issue #267：per-asset targetBox 寫回各 sidecar（box=null＝清除該件 targetBox、退回類別 safeBox）；寫後重生 index。
    const boxes = payload.boxes && typeof payload.boxes === "object" ? payload.boxes : null;
    if (boxes) {
      let n = 0;
      for (const [key, box] of Object.entries(boxes)) {
        const slash = key.indexOf("/");
        if (slash < 1) throw new Error(`bad box key ${key}`);
        const pack = safeName(key.slice(0, slash), "pack");
        const asset = safeName(key.slice(slash + 1), "asset");
        const meta = await readSidecar(pack, asset);
        if (box === null) {
          delete meta.targetBox;
          delete meta.rotation;
        } else {
          meta.targetBox = { left: box.left, top: box.top, right: box.right, bottom: box.bottom, ...(box.corners ? { corners: box.corners } : {}) };
          if (Number.isFinite(box.rotation) && box.rotation !== 0) meta.rotation = box.rotation;
          else delete meta.rotation;
        }
        await writeSidecar(pack, asset, meta);
        n += 1;
      }
      if (n) { await regenWardrobeIndex(); written.push(`${n} sidecar`); }
    }
    if (!written.length) throw new Error("no valid blocks supplied");
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, written }));
  } catch (error) {
    response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: false, error: String(error?.message || error) }));
  }
}

// ===== Wardrobe content-management 端點（dev only，僅綁 127.0.0.1）=====
// 僅作用於 content-package/wardrobe/<pack>/ 白名單範圍；pack/asset/id 嚴格驗證、不收任意路徑。
async function readBody(request) { let b = ""; for await (const c of request) b += c; return b; }
function json(response, code, obj) {
  response.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(obj));
}
function safeName(value, label) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error(`bad ${label}`);
  return value;
}
function packDir(pack) { return join(shellRoot, "content-package", "wardrobe", safeName(pack, "pack")); }
// issue #267：衣物單品單一事實來源＝素材旁 sidecar；管理工具一律對單一 sidecar 原子操作，寫後重生衍生 index。
function layersDir(pack) { return join(packDir(pack), "assets", "layers"); }
function sidecarFile(pack, asset) { return join(layersDir(pack), `${safeName(asset, "asset")}.metadata.json`); }
async function readSidecar(pack, asset) { return JSON.parse(await readFile(sidecarFile(pack, asset), "utf8")); }
async function writeSidecar(pack, asset, meta) { await writeFile(sidecarFile(pack, asset), JSON.stringify(meta, null, 2) + "\n"); }
async function regenWardrobeIndex() { await runNode(["scripts/genWardrobeIndex.mjs"]); }
function magick(args) {
  return new Promise((resolve, reject) => execFile("magick", args, { encoding: "utf8" }, (err, out) => (err ? reject(err) : resolve(out))));
}

async function handleOpenFolder(request, response) {
  try {
    const { pack } = JSON.parse(await readBody(request) || "{}");
    const dir = join(packDir(pack), "assets");
    await stat(dir);
    const cmd = process.platform === "win32" ? "explorer.exe" : (process.platform === "darwin" ? "open" : "xdg-open");
    spawn(cmd, [dir], { detached: true, stdio: "ignore" }).unref();
    json(response, 200, { ok: true, dir });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

async function handleDeleteItem(request, response) {
  try {
    const { pack, asset } = JSON.parse(await readBody(request) || "{}");
    safeName(pack, "pack"); safeName(asset, "asset");
    // issue #267：原子刪除——移除素材 webp 與其同名 sidecar（同目錄兩檔），不再跨 manifest/style/overrides 多檔拼接、無孤兒殘留。
    let removed = false;
    for (const f of [join(layersDir(pack), `${asset}.webp`), sidecarFile(pack, asset)]) {
      try { await unlink(f); removed = true; } catch { /* missing ok */ }
    }
    if (!removed) throw new Error(`${pack}/${asset} 無 webp 或 sidecar 可刪`);
    await regenWardrobeIndex();
    json(response, 200, { ok: true });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

// issue #267：把（已存在的）layer 素材登記為素材旁 sidecar（單一事實來源），寫後重生衍生 index。
// storeId 不再 per-item（per-pack 置於 <pack>/style.json）；id 全域唯一性由 genWardrobeIndex 守門（重複即守門失敗、回滾 sidecar）。
async function registerItemSidecar(b) {
  const cost = Number.isFinite(Number(b.cost)) ? Number(b.cost) : 0;
  const icon = /^[a-zA-Z0-9_-]+$/.test(b.icon || "") ? b.icon : "Item";
  await stat(join(layersDir(b.pack), `${b.asset}.webp`)).catch(() => { throw new Error(`assets/layers/${b.asset}.webp 不存在`); });
  const file = sidecarFile(b.pack, b.asset);
  let exists = false;
  try { await stat(file); exists = true; } catch { /* not exists */ }
  if (exists) throw new Error(`${b.asset}.metadata.json 已存在`);
  await writeSidecar(b.pack, b.asset, { id: b.id, type: b.type, name: String(b.name), cost, icon, prompt: typeof b.desc === "string" ? b.desc : "" });
  try { await regenWardrobeIndex(); }
  catch (e) { try { await unlink(file); } catch { /* ignore */ } throw e; }
  return null;
}

async function handleAddItem(request, response) {
  try {
    const b = JSON.parse(await readBody(request) || "{}");
    safeName(b.pack, "pack"); safeName(b.type, "type"); safeName(b.asset, "asset"); safeName(b.id, "id");
    if (!b.name || typeof b.name !== "string") throw new Error("name required");
    const box = await registerItemSidecar(b);
    json(response, 200, { ok: true, contentBox: box });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

// 上傳圖檔（#196）：解 base64 → 以 ImageMagick 去白邊→等比縮到 512（長邊貼滿）→置中於 512×512
// 透明畫布作單一素材（兼投影與商店預覽），再走 registerItemSidecar 登記。不再產分離 thumb。
async function handleUploadItem(request, response) {
  try {
    const b = JSON.parse(await readBody(request) || "{}");
    safeName(b.pack, "pack"); safeName(b.type, "type"); safeName(b.asset, "asset"); safeName(b.id, "id");
    if (!b.name || typeof b.name !== "string") throw new Error("name required");
    const m = /^data:image\/[a-zA-Z.+-]+;base64,(.+)$/.exec(String(b.imageData || ""));
    if (!m) throw new Error("缺少有效圖檔");
    const buf = Buffer.from(m[1], "base64");
    if (buf.length > 12 * 1024 * 1024) throw new Error("圖檔過大（>12MB）");
    const dir = packDir(b.pack);
    const layerFile = join(dir, "assets", "layers", `${b.asset}.webp`);
    let exists = false;
    try { await stat(layerFile); exists = true; } catch { /* not exists */ }
    if (exists && !b.overwrite) throw new Error(`assets/layers/${b.asset}.webp 已存在（勾選覆寫才會取代）`);
    const tmp = join(dir, "assets", "layers", `.upload-${Date.now()}.tmp`);
    await writeFile(tmp, buf);
    try {
      await magick([tmp, "-trim", "+repage", "-resize", "512x512", "-background", "none", "-gravity", "center", "-extent", "512x512", layerFile]);
    } finally {
      try { await unlink(tmp); } catch { /* ignore */ }
    }
    const box = await registerItemSidecar(b);
    json(response, 200, { ok: true, contentBox: box });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

// ===== issue #196：三層描述詞編輯 + 影像模型重生（dev only）=====
function runNode(args) {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, args, { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024, env: process.env },
      (err, out, errout) => (err ? reject(new Error(errout || err.message)) : resolve(out)));
  });
}

async function handleGetWardrobeDesc(request, response) {
  try {
    const { pack, asset } = JSON.parse(await readBody(request) || "{}");
    safeName(pack, "pack"); safeName(asset, "asset");
    const meta = await readSidecar(pack, asset);
    const style = JSON.parse(await readFile(join(packDir(pack), "style.json"), "utf8"));
    json(response, 200, { ok: true, desc: meta.prompt || "", packStyle: style.packStyle });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

async function handleSaveWardrobeDesc(request, response) {
  try {
    const { pack, asset, desc } = JSON.parse(await readBody(request) || "{}");
    safeName(pack, "pack"); safeName(asset, "asset");
    if (typeof desc !== "string" || !desc.trim()) throw new Error("desc required");
    const meta = await readSidecar(pack, asset);
    meta.prompt = desc.trim();
    await writeSidecar(pack, asset, meta);
    json(response, 200, { ok: true });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

async function handleRegenerateWardrobe(request, response) {
  try {
    const { pack, asset } = JSON.parse(await readBody(request) || "{}");
    safeName(pack, "pack"); safeName(asset, "asset");
    const out = await runNode(["devtool/generate-wardrobe-asset.mjs", pack, "--item", asset, "--apply"]);
    json(response, 200, { ok: true, log: out.trim().split("\n").slice(-2).join(" | ") });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

// ===== issue #218：單品 metadata（名稱／價錢／描述詞）讀寫（dev only）=====
// 取該單品 manifest 行的 name/cost，加上 style.json 的描述詞；任一缺值以空值回，不報錯。
async function handleGetItemMeta(request, response) {
  try {
    const { pack, asset } = JSON.parse(await readBody(request) || "{}");
    safeName(pack, "pack"); safeName(asset, "asset");
    const meta = await readSidecar(pack, asset);
    json(response, 200, { ok: true, name: meta.name || "", cost: Number(meta.cost ?? 0), desc: meta.prompt || "" });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

// 就地改 manifest 該單品行的 name/cost，並（若有 style.json）寫回描述詞。
async function handleSaveItemMeta(request, response) {
  try {
    const { pack, asset, name, cost, desc } = JSON.parse(await readBody(request) || "{}");
    safeName(pack, "pack"); safeName(asset, "asset");
    if (typeof name !== "string" || !name.trim()) throw new Error("name required");
    const meta = await readSidecar(pack, asset);
    meta.name = name.trim();
    meta.cost = Number.isFinite(Number(cost)) ? Number(cost) : 0;
    if (typeof desc === "string") meta.prompt = desc;
    await writeSidecar(pack, asset, meta);
    await regenWardrobeIndex(); // name/cost 進入 index
    json(response, 200, { ok: true });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

// ===== issue #218：地圖節點座標儲存＋上傳換圖（dev only）=====
const MAP_POSITION_FILES = new Set([
  "content-package/areas/world.js",
  "content-package/areas/castle/manifest.js",
  "content-package/areas/urban/manifest.js",
  "content-package/areas/rural/manifest.js",
  "content-package/areas/wild/manifest.js"
]);

// 就地把 `id: "<id>"` 之後的第一個 x:／y: 數值換掉（world destinations 與 area nodes 皆 id 在前）。
function setMapXY(src, id, x, y) {
  const idx = src.indexOf(`id: "${id}"`);
  if (idx === -1) return { src, changed: false };
  let changed = false;
  const after = src.slice(idx)
    .replace(/x:\s*-?[\d.]+/, () => { changed = true; return `x: ${x}`; })
    .replace(/y:\s*-?[\d.]+/, () => { changed = true; return `y: ${y}`; });
  return { src: src.slice(0, idx) + after, changed };
}

async function handleSaveMapPositions(request, response) {
  try {
    const { file, positions } = JSON.parse(await readBody(request) || "{}");
    if (!MAP_POSITION_FILES.has(file)) throw new Error("file 不在白名單");
    if (!Array.isArray(positions) || !positions.length) throw new Error("positions required");
    const filePath = join(shellRoot, file);
    const original = await readFile(filePath, "utf8");
    const eol = original.includes("\r\n") ? "\r\n" : "\n";
    let working = original.replace(/\r\n/g, "\n");
    let updated = 0;
    for (const p of positions) {
      safeName(String(p.id), "id");
      const x = Number(p.x); const y = Number(p.y);
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) throw new Error(`bad x/y for ${p.id}`);
      const res = setMapXY(working, p.id, x, y);
      if (res.changed) { working = res.src; updated += 1; }
    }
    if (!updated) throw new Error("no positions matched");
    await writeFile(filePath, working.replace(/\n/g, eol));
    json(response, 200, { ok: true, updated });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

// 各地圖檔路徑與目標尺寸（cover-fit 解析度）。
const MAP_UPLOAD_TARGETS = {
  world: { file: "content-base/world/assets/world-map.webp", w: 1536, h: 1536 },
  castle: { file: "content-package/areas/castle/assets/map-1536.webp", w: 1536, h: 1536 },
  urban: { file: "content-package/areas/urban/assets/map-1536.webp", w: 1536, h: 1536 },
  rural: { file: "content-package/areas/rural/assets/map-1536.webp", w: 1536, h: 1536 },
  wild: { file: "content-package/areas/wild/assets/map-1536.webp", w: 1536, h: 1536 }
};

async function handleUploadMap(request, response) {
  try {
    const { target, imageData } = JSON.parse(await readBody(request) || "{}");
    const t = MAP_UPLOAD_TARGETS[target];
    if (!t) throw new Error("target 不在白名單");
    const m = /^data:image\/[a-zA-Z.+-]+;base64,(.+)$/.exec(String(imageData || ""));
    if (!m) throw new Error("缺少有效圖檔");
    const buf = Buffer.from(m[1], "base64");
    if (buf.length > 16 * 1024 * 1024) throw new Error("圖檔過大（>16MB）");
    const outFile = join(shellRoot, t.file);
    const tmp = join(dirname(outFile), `.upload-map-${Date.now()}.tmp`);
    await writeFile(tmp, buf);
    try {
      const dim = `${t.w}x${t.h}`;
      await magick([tmp, "-resize", `${dim}^`, "-gravity", "center", "-extent", dim, outFile]);
    } finally {
      try { await unlink(tmp); } catch { /* ignore */ }
    }
    json(response, 200, { ok: true, file: t.file, size: { width: t.w, height: t.h } });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

// ===== 公主預設（coins／owned／outfit）寫回（dev only，僅綁 127.0.0.1）=====
// 白名單僅 default-state.js；就地替換 coins 數值、owned 陣列、outfit 區塊，其餘欄位（playLimit…）保持不動。
const DEFAULTS_FILE = "game-engine/state/default-state.js";
const isItemId = (v) => v === "none" || (typeof v === "string" && /^[a-zA-Z0-9_-]+$/.test(v));

async function handleSaveDefaults(request, response) {
  try {
    const body = JSON.parse(await readBody(request) || "{}");
    const coins = Number(body.coins);
    if (!Number.isFinite(coins) || coins < 0) throw new Error("coins 需為非負數");
    const owned = Array.isArray(body.owned) ? body.owned : [];
    if (!owned.every((id) => typeof id === "string" && /^[a-zA-Z0-9_-]+$/.test(id))) throw new Error("owned 含非法 id");
    const outfitIn = (body.outfit && typeof body.outfit === "object") ? body.outfit : {};
    for (const [slot, val] of Object.entries(outfitIn)) {
      if (!outfitSlots.includes(slot)) throw new Error(`未知 slot ${slot}`);
      if (!isItemId(val)) throw new Error(`slot ${slot} 值非法`);
    }
    const filePath = join(shellRoot, DEFAULTS_FILE);
    const original = await readFile(filePath, "utf8");
    const eol = original.includes("\r\n") ? "\r\n" : "\n";
    const ownedLiteral = `owned: [${[...new Set(owned)].map((id) => JSON.stringify(id)).join(", ")}]`;
    const outfitLines = outfitSlots
      .map((slot) => {
        const v = isItemId(outfitIn[slot]) && outfitIn[slot] ? outfitIn[slot] : "none";
        return `    ${slot}: ${JSON.stringify(v)}`;
      })
      .join(`,${eol}`);
    const outfitBlock = `outfit: {${eol}${outfitLines}${eol}  }`;
    let updated = original;
    if (!/\n\s*coins:\s*-?\d+/.test(updated)) throw new Error("找不到 coins");
    updated = updated.replace(/(\n\s*coins:\s*)-?\d+/, `$1${Math.floor(coins)}`);
    if (!/owned:\s*\[[^\]]*\]/.test(updated)) throw new Error("找不到 owned");
    updated = updated.replace(/owned:\s*\[[^\]]*\]/, ownedLiteral);
    if (!/outfit:\s*\{[^}]*\}/.test(updated)) throw new Error("找不到 outfit");
    updated = updated.replace(/outfit:\s*\{[^}]*\}/, outfitBlock);
    await writeFile(filePath, updated);
    json(response, 200, { ok: true, written: DEFAULTS_FILE });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

// ===== issue #245：場景對話題庫編修＋AI 生成（dev only，僅綁 127.0.0.1）=====
// 白名單僅四地區 manifest；就地替換 `const <area>LessonBank/ChatLessonBank = Object.freeze({…});`
// 區塊，reward 維持變數參照、保留原檔 EOL、不動其他欄位。序列化／驗證委派 devtool/scene-bank-io.mjs。
async function handleSaveSceneDialog(request, response) {
  try {
    const { area, kind, bank } = JSON.parse(await readBody(request) || "{}");
    if (!SCENE_AREA_KEYS.includes(area)) throw new Error("area 不在白名單");
    if (!SCENE_DIALOG_KINDS.includes(kind)) throw new Error("kind 非法（job／chat）");
    validateBank(kind, bank); // 結構守門：題數／選項數／answer∈choices／中英等長
    const constName = bankConstName(area, kind);
    const block = serializeBank(constName, bank, rewardVarFor(kind));
    const file = `content-package/areas/${area}/manifest.js`;
    const filePath = join(shellRoot, file);
    const original = await readFile(filePath, "utf8");
    const eol = original.includes("\r\n") ? "\r\n" : "\n"; // 保留原檔 EOL，避免 autocrlf 標記整檔已變更
    const re = new RegExp(`const ${constName} = Object\\.freeze\\(\\{[\\s\\S]*?\\n\\}\\);`);
    if (!re.test(original)) throw new Error(`找不到 ${constName} 區塊`);
    const updated = original.replace(re, () => block).replace(/\r\n/g, "\n").replace(/\n/g, eol);
    await writeFile(filePath, updated);
    json(response, 200, { ok: true, written: file, constName, places: Object.keys(bank).length });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

// 依前端組好的提示詞向 AI 生成對話：金鑰存在則呼叫 Anthropic Messages API 回傳原始文字（前端再解析驗證）；
// 無金鑰則明確降級 needKey:true，前端改顯示提示詞供複製到外部模型、貼回解析（不中斷、不外洩金鑰）。
async function handleGenerateSceneDialog(request, response) {
  try {
    const { prompt } = JSON.parse(await readBody(request) || "{}");
    if (typeof prompt !== "string" || !prompt.trim()) throw new Error("prompt required");
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) { json(response, 200, { ok: false, needKey: true }); return; }
    const model = process.env.SCENE_GEN_MODEL || "claude-haiku-4-5";
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 2000, messages: [{ role: "user", content: prompt }] })
    });
    if (!r.ok) throw new Error(`AI API ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const data = await r.json();
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    if (!text) throw new Error("AI 回應為空");
    json(response, 200, { ok: true, text, model });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

const WARDROBE_ROUTES = {
  "/devtool/save-defaults": handleSaveDefaults,
  "/devtool/save-scene-dialog": handleSaveSceneDialog,
  "/devtool/generate-scene-dialog": handleGenerateSceneDialog,
  "/devtool/open-folder": handleOpenFolder,
  "/devtool/delete-item": handleDeleteItem,
  "/devtool/add-item": handleAddItem,
  "/devtool/upload-item": handleUploadItem,
  "/devtool/get-wardrobe-desc": handleGetWardrobeDesc,
  "/devtool/save-wardrobe-desc": handleSaveWardrobeDesc,
  "/devtool/regenerate-wardrobe": handleRegenerateWardrobe,
  "/devtool/get-item-meta": handleGetItemMeta,
  "/devtool/save-item-meta": handleSaveItemMeta,
  "/devtool/save-map-positions": handleSaveMapPositions,
  "/devtool/upload-map": handleUploadMap
};

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "POST" && url.pathname === "/devtool/apply-wardrobe") {
    await handleApplyWardrobe(request, response);
    return;
  }
  if (request.method === "POST" && WARDROBE_ROUTES[url.pathname]) {
    await WARDROBE_ROUTES[url.pathname](request, response);
    return;
  }
  // 便利轉址：/devtool 與 /devtool/ → Wardrobe Tuner（避免目錄路徑 404）。
  if (request.method === "GET" && (url.pathname === "/devtool" || url.pathname === "/devtool/")) {
    response.writeHead(302, { Location: "/devtool/wardrobe-tuner.html" });
    response.end();
    return;
  }
  // 舊名相容轉址（#341 tool→devtool）：維護者舊書籤 /tool/* 以 301 導新址、不留死路。
  if (request.method === "GET" && (url.pathname === "/tool" || url.pathname.startsWith("/tool/"))) {
    const target = url.pathname === "/tool" || url.pathname === "/tool/" ? "/devtool/wardrobe-tuner.html" : url.pathname.replace(/^\/tool\//, "/devtool/");
    response.writeHead(301, { Location: target });
    response.end();
    return;
  }
  await serveStatic(request, response);
}).listen(port, process.env.HOST || "0.0.0.0", () => {
  const host = process.env.HOST || "0.0.0.0";
  console.log(`Luminara local server running at http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}/`);
  if (host === "0.0.0.0") {
    const lanIp = (() => { for (const ifaces of Object.values(networkInterfaces())) for (const i of ifaces) if (i.family === "IPv4" && !i.internal) return i.address; return null; })();
    if (lanIp) console.log(`  LAN: http://${lanIp}:${port}/`);
  }
});
