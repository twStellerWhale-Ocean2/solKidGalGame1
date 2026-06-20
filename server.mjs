import { createServer } from "node:http";
import { readFile, writeFile, stat, unlink } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execFile } from "node:child_process";

const root = dirname(fileURLToPath(import.meta.url));
const rootPrefix = root.endsWith(sep) ? root : `${root}${sep}`;
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
  const filePath = join(root, normalized);
  if (filePath !== root && !filePath.startsWith(rootPrefix)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
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

// Wardrobe Tuner「套用」端點（dev only，僅綁 127.0.0.1）：把調好的兩個區塊就地寫回固定的兩支檔案。
// 僅允許這兩支白名單檔案、僅替換 `export const NAME = Object.freeze({...});` 區塊，不接受任意路徑。
const APPLY_TARGETS = {
  rules: { file: "content-package/wardrobe/_shared/rules.js", name: "wardrobeLayerBoundsByType" },
  overrides: { file: "content-package/wardrobe/_shared/asset-target-overrides.js", name: "assetTargetOverrides" }
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
    let body = "";
    for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body || "{}");
    const written = [];
    for (const [key, target] of Object.entries(APPLY_TARGETS)) {
      if (typeof payload[key] !== "string") continue;
      const block = validatedBlock(target.name, payload[key]);
      const filePath = join(root, target.file);
      const original = await readFile(filePath, "utf8");
      const eol = original.includes("\r\n") ? "\r\n" : "\n"; // 保留原檔 EOL，避免 autocrlf 將整檔標記為已變更
      const updated = replaceExportBlock(original, target.name, block).replace(/\r\n/g, "\n").replace(/\n/g, eol);
      await writeFile(filePath, updated);
      written.push(target.file);
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
function packDir(pack) { return join(root, "content-package", "wardrobe", safeName(pack, "pack")); }
function magick(args) {
  return new Promise((resolve, reject) => execFile("magick", args, { encoding: "utf8" }, (err, out) => (err ? reject(err) : resolve(out))));
}
async function spliceMapLine(file, key, insertLine) {
  // insertLine 為 null → 刪除該 key 的行；否則插入到 Object.freeze({ 之後。保留原檔 EOL。
  let src;
  try { src = await readFile(file, "utf8"); } catch { return; }
  const eol = src.includes("\r\n") ? "\r\n" : "\n";
  let lines = src.split(/\r?\n/);
  if (insertLine === null) {
    lines = lines.filter((l) => !l.includes(`${JSON.stringify(key)}:`));
  } else {
    const at = lines.findIndex((l) => /Object\.freeze\(\{\s*$/.test(l));
    if (at === -1 || lines.some((l) => l.includes(`${JSON.stringify(key)}:`))) return;
    lines.splice(at + 1, 0, insertLine);
  }
  await writeFile(file, lines.join(eol));
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
    const { pack, asset, itemId } = JSON.parse(await readBody(request) || "{}");
    safeName(pack, "pack"); safeName(asset, "asset"); safeName(itemId, "itemId");
    const manifestPath = join(packDir(pack), "manifest.js");
    const src = await readFile(manifestPath, "utf8");
    const eol = src.includes("\r\n") ? "\r\n" : "\n";
    const lines = src.split(/\r?\n/);
    const matches = lines.filter((l) => l.includes(`id: "${itemId}"`));
    if (!matches.length) throw new Error(`item ${itemId} 不在 manifest`);
    if (matches.length > 1) throw new Error(`item ${itemId} 不唯一`);
    await writeFile(manifestPath, lines.filter((l) => !l.includes(`id: "${itemId}"`)).join(eol));
    try { await unlink(join(packDir(pack), "assets", "layers", `${asset}.webp`)); } catch { /* missing ok */ }
    await spliceMapLine(join(root, "content-package/wardrobe/_shared/asset-target-overrides.js"), `${pack}/${asset}`, null);
    await spliceMapLine(join(root, "content-package/wardrobe/_shared/asset-content-box.generated.js"), `${pack}/${asset}`, null);
    json(response, 200, { ok: true });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

// 共用：把（已存在的）layer 素材登記到 manifest，並緊貼裁切＋記 content-box（canvas 座標）。
async function registerItemManifestAndBox(b) {
  const cost = Number.isFinite(Number(b.cost)) ? Number(b.cost) : 0;
  const icon = /^[a-zA-Z0-9_-]+$/.test(b.icon || "") ? b.icon : "Item";
  const layerFile = join(packDir(b.pack), "assets", "layers", `${b.asset}.webp`);
  await stat(layerFile).catch(() => { throw new Error(`assets/layers/${b.asset}.webp 不存在`); });
  const manifestPath = join(packDir(b.pack), "manifest.js");
  let src = await readFile(manifestPath, "utf8");
  if (src.includes(`id: "${b.id}"`)) throw new Error(`id ${b.id} 已存在`);
  const storeId = /^[a-zA-Z0-9_-]+$/.test(b.storeId || "") ? b.storeId : (src.match(/storeId:\s*"([^"]+)"/)?.[1] || b.pack);
  const eol = src.includes("\r\n") ? "\r\n" : "\n";
  const name = String(b.name).replace(/"/g, '\\"');
  const line = `  wearable({ id: "${b.id}", storeId: "${storeId}", type: "${b.type}", name: "${name}", cost: ${cost}, icon: "${icon}", asset: "${b.asset}" }),`;
  const m = src.match(/export const \w+ = \[\s*?\r?\n/);
  if (!m) throw new Error("找不到 items 陣列");
  await writeFile(manifestPath, src.replace(m[0], m[0] + line + eol));
  // #196 fill 模型：素材為 512×512 長邊貼滿、非裁切；不再 trim 或記 content-box（已廢棄）。
  return null;
}

async function handleAddItem(request, response) {
  try {
    const b = JSON.parse(await readBody(request) || "{}");
    safeName(b.pack, "pack"); safeName(b.type, "type"); safeName(b.asset, "asset"); safeName(b.id, "id");
    if (!b.name || typeof b.name !== "string") throw new Error("name required");
    const box = await registerItemManifestAndBox(b);
    json(response, 200, { ok: true, contentBox: box });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

// 上傳圖檔（#196）：解 base64 → 以 ImageMagick 去白邊→等比縮到 512（長邊貼滿）→置中於 512×512
// 透明畫布作單一素材（兼投影與商店預覽），再走 registerItemManifestAndBox 登記。不再產分離 thumb。
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
    const box = await registerItemManifestAndBox(b);
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
    const style = JSON.parse(await readFile(join(packDir(pack), "style.json"), "utf8"));
    const v = style.items?.[asset];
    json(response, 200, { ok: true, desc: typeof v === "string" ? v : (v?.desc || ""), packStyle: style.packStyle });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

async function handleSaveWardrobeDesc(request, response) {
  try {
    const { pack, asset, desc } = JSON.parse(await readBody(request) || "{}");
    safeName(pack, "pack"); safeName(asset, "asset");
    if (typeof desc !== "string" || !desc.trim()) throw new Error("desc required");
    const file = join(packDir(pack), "style.json");
    const src = await readFile(file, "utf8");
    const eol = src.includes("\r\n") ? "\r\n" : "\n";
    const style = JSON.parse(src);
    if (!style.items) style.items = {};
    const cur = style.items[asset];
    style.items[asset] = (cur && typeof cur === "object") ? { ...cur, desc: desc.trim() } : desc.trim();
    await writeFile(file, (JSON.stringify(style, null, 2) + "\n").replace(/\n/g, eol));
    json(response, 200, { ok: true });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

async function handleRegenerateWardrobe(request, response) {
  try {
    const { pack, asset } = JSON.parse(await readBody(request) || "{}");
    safeName(pack, "pack"); safeName(asset, "asset");
    const out = await runNode(["tool/generate-wardrobe-asset.mjs", pack, "--item", asset, "--apply"]);
    json(response, 200, { ok: true, log: out.trim().split("\n").slice(-2).join(" | ") });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

const WARDROBE_ROUTES = {
  "/tool/open-folder": handleOpenFolder,
  "/tool/delete-item": handleDeleteItem,
  "/tool/add-item": handleAddItem,
  "/tool/upload-item": handleUploadItem,
  "/tool/get-wardrobe-desc": handleGetWardrobeDesc,
  "/tool/save-wardrobe-desc": handleSaveWardrobeDesc,
  "/tool/regenerate-wardrobe": handleRegenerateWardrobe
};

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "POST" && url.pathname === "/tool/apply-wardrobe") {
    await handleApplyWardrobe(request, response);
    return;
  }
  if (request.method === "POST" && WARDROBE_ROUTES[url.pathname]) {
    await WARDROBE_ROUTES[url.pathname](request, response);
    return;
  }
  // 便利轉址：/tool 與 /tool/ → Wardrobe Tuner（避免目錄路徑 404）。
  if (request.method === "GET" && (url.pathname === "/tool" || url.pathname === "/tool/")) {
    response.writeHead(302, { Location: "/tool/wardrobe-tuner.html" });
    response.end();
    return;
  }
  await serveStatic(request, response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Luminara local server running at http://127.0.0.1:${port}/`);
});
