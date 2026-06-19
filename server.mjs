import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

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
      const updated = replaceExportBlock(await readFile(filePath, "utf8"), target.name, block);
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

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "POST" && url.pathname === "/tool/apply-wardrobe") {
    await handleApplyWardrobe(request, response);
    return;
  }
  await serveStatic(request, response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Luminara local server running at http://127.0.0.1:${port}/`);
});
