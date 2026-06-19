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
    response.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" });
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
    for (const sub of ["layers", "thumbs"]) {
      try { await unlink(join(packDir(pack), "assets", sub, `${asset}.webp`)); } catch { /* missing ok */ }
    }
    await spliceMapLine(join(root, "content-package/wardrobe/_shared/asset-target-overrides.js"), `${pack}/${asset}`, null);
    await spliceMapLine(join(root, "content-package/wardrobe/_shared/asset-content-box.generated.js"), `${pack}/${asset}`, null);
    json(response, 200, { ok: true });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

async function handleAddItem(request, response) {
  try {
    const b = JSON.parse(await readBody(request) || "{}");
    safeName(b.pack, "pack"); safeName(b.type, "type"); safeName(b.asset, "asset"); safeName(b.id, "id");
    if (!b.name || typeof b.name !== "string") throw new Error("name required");
    const cost = Number.isFinite(Number(b.cost)) ? Number(b.cost) : 0;
    const icon = /^[a-zA-Z0-9_-]+$/.test(b.icon || "") ? b.icon : "Item";
    const layerFile = join(packDir(b.pack), "assets", "layers", `${b.asset}.webp`);
    await stat(layerFile).catch(() => { throw new Error(`assets/layers/${b.asset}.webp 不存在（先用「開啟資料夾」放入 layer 與 thumb）`); });
    const manifestPath = join(packDir(b.pack), "manifest.js");
    let src = await readFile(manifestPath, "utf8");
    if (src.includes(`id: "${b.id}"`)) throw new Error(`id ${b.id} 已存在`);
    const storeId = /^[a-zA-Z0-9_-]+$/.test(b.storeId || "") ? b.storeId : (src.match(/storeId:\s*"([^"]+)"/)?.[1] || b.pack);
    const eol = src.includes("\r\n") ? "\r\n" : "\n";
    const name = b.name.replace(/"/g, '\\"');
    const line = `  wearable({ id: "${b.id}", storeId: "${storeId}", type: "${b.type}", name: "${name}", cost: ${cost}, icon: "${icon}", asset: "${b.asset}" }),`;
    const m = src.match(/export const \w+ = \[\s*?\r?\n/);
    if (!m) throw new Error("找不到 items 陣列");
    src = src.replace(m[0], m[0] + line + eol);
    await writeFile(manifestPath, src);
    // 緊貼裁切 + 量測 content-box（與 trim 工具一致），讓新素材直接有合理對位。
    let box = null;
    try {
      const geom = (await magick([layerFile, "-channel", "A", "-separate", "+channel", "-threshold", "6%", "-format", "%@", "info:"])).trim();
      const mm = /^(\d+)x(\d+)\+(\d+)\+(\d+)$/.exec(geom);
      if (mm) {
        const w = +mm[1]; const h = +mm[2]; const x = +mm[3]; const y = +mm[4];
        box = { left: x, top: y, right: x + w, bottom: y + h };
        await magick([layerFile, "-crop", `${w}x${h}+${x}+${y}`, "+repage", layerFile]);
        await spliceMapLine(
          join(root, "content-package/wardrobe/_shared/asset-content-box.generated.js"),
          `${b.pack}/${b.asset}`,
          `  ${JSON.stringify(`${b.pack}/${b.asset}`)}: { left: ${box.left}, top: ${box.top}, right: ${box.right}, bottom: ${box.bottom} },`
        );
      }
    } catch { /* magick optional */ }
    json(response, 200, { ok: true, contentBox: box });
  } catch (e) { json(response, 400, { ok: false, error: String(e?.message || e) }); }
}

const WARDROBE_ROUTES = {
  "/tool/open-folder": handleOpenFolder,
  "/tool/delete-item": handleDeleteItem,
  "/tool/add-item": handleAddItem
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
