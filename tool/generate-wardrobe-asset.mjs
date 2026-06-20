// issue #196 — wardrobe 單品影像生成（dev 期工具）。
//
// 以三層描述詞（_shared/art-style.json houseStyle ＋ 該包 style.json packStyle ＋ 單品 itemDesc）
// 組 prompt，呼叫 OpenAI gpt-image-1 影像 edits API（金鑰取自 env OPENAI_API_KEY），
// 以該件既有 layer 為內容參考重繪，輸出 1024×1024 透明後降採樣為 512×512「長邊貼滿（fill）」透明 WebP。
//
// 預設輸出到 tool/_gen-preview/<pack>/（不覆蓋真實素材，供人工挑選）；--apply 才覆寫 layers/。
// 留痕（model/prompt/date）暫寫入該包 style.json 之 items[asset]._gen（環境無 cwebp/exiftool、
// IM 之 WebP 不保存 metadata，故 in-file metadata 待工具決策；見 design-issue196 §4 與 README）。
//
//   node tool/generate-wardrobe-asset.mjs <packId> [--item <asset>] [--apply] [--quality high|medium|low]
//
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const WARDROBE = join(ROOT, "content-package", "wardrobe");
const TMP = join(ROOT, "tool", "_gen-tmp");
const PREVIEW = join(ROOT, "tool", "_gen-preview");
const ART_STYLE = join(WARDROBE, "_shared", "art-style.json");
const MAX_W = 1024;

function arg(flag, def = null) { const i = process.argv.indexOf(flag); return i >= 0 ? (process.argv[i + 1] ?? true) : def; }
const packId = process.argv[2];
if (!packId || packId.startsWith("--")) { console.error("usage: node tool/generate-wardrobe-asset.mjs <packId> [--item <asset>] [--apply] [--quality high|medium|low]"); process.exit(1); }
const onlyItem = arg("--item");
const apply = process.argv.includes("--apply");
const quality = arg("--quality", "high");

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error("OPENAI_API_KEY not set in env"); process.exit(1); }

const art = JSON.parse(readFileSync(ART_STYLE, "utf8"));
const stylePath = join(WARDROBE, packId, "style.json");
if (!existsSync(stylePath)) { console.error(`missing ${stylePath} (需先建立 packStyle/itemDesc)`); process.exit(1); }
const style = JSON.parse(readFileSync(stylePath, "utf8"));

function magick(args) { return execFileSync("magick", args, { encoding: "buffer" }); }
function composePrompt(itemDesc) {
  const h = art.houseStyle, p = style.packStyle;
  return [
    `${h.look}.`,
    `Linework: ${h.linework}. Shading: ${h.shading}.`,
    `Collection style: ${p.reference}; palette ${p.palette.join(", ")}; motifs ${p.motifs.join(", ")}; ${p.linework}; mood ${p.mood}.`,
    `The item to draw: ${itemDesc}.`,
    art.exclusions
  ].join(" ");
}

async function genOne(asset, itemDesc) {
  const layerWebp = join(WARDROBE, packId, "assets", "layers", `${asset}.webp`);
  if (!existsSync(layerWebp)) { console.warn(`  skip ${asset}: no existing layer`); return null; }
  mkdirSync(TMP, { recursive: true });
  const refPng = join(TMP, `${asset}.ref.png`);
  magick([layerWebp, refPng]); // webp → png 供 edits API
  const prompt = composePrompt(itemDesc);

  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("image[]", new Blob([readFileSync(refPng)], { type: "image/png" }), "ref.png");
  form.append("background", "transparent");
  form.append("size", "1024x1024");
  form.append("quality", quality);
  form.append("n", "1");
  form.append("prompt", prompt);

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form
  });
  const json = await res.json();
  if (!res.ok || json.error) { console.error(`  ERROR ${asset}:`, json.error?.message || res.status); return null; }
  const b64 = json.data[0].b64_json;
  const gen1024 = join(TMP, `${asset}.1024.png`);
  writeFileSync(gen1024, Buffer.from(b64, "base64"));

  // 512×512 fill：去透明邊→等比縮到 512（長邊貼滿）→置中於 512×512 透明畫布。
  const outDir = apply ? join(WARDROBE, packId, "assets", "layers") : join(PREVIEW, packId);
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, `${asset}.webp`);
  let q = 82;
  do {
    magick([gen1024, "-trim", "+repage", "-resize", "512x512", "-background", "none", "-gravity", "center", "-extent", "512x512", "-quality", String(q), out]);
    var bytes = execFileSync("magick", ["identify", "-format", "%B", out], { encoding: "utf8" }).trim();
    q -= 8;
  } while (Number(bytes) > art.output.maxKB * 1024 && q >= 50);
  const dim = execFileSync("magick", ["identify", "-format", "%wx%h", out], { encoding: "utf8" }).trim();

  // 留痕（暫存 style.json；in-file metadata 待工具決策）
  style.items[asset] = typeof style.items[asset] === "string"
    ? { desc: style.items[asset], _gen: {} } : (style.items[asset] || { desc: itemDesc });
  return { asset, out, dim, bytes: Number(bytes), prompt };
}

const items = Object.entries(style.items)
  .map(([asset, v]) => [asset, typeof v === "string" ? v : v.desc])
  .filter(([asset]) => !onlyItem || asset === onlyItem);

console.log(`gen ${items.length} item(s) of [${packId}] quality=${quality} → ${apply ? "APPLY layers/" : "preview tool/_gen-preview/"}`);
const done = [];
for (const [asset, desc] of items) {
  process.stdout.write(`  ${asset} … `);
  const r = await genOne(asset, desc);
  if (r) { console.log(`${r.dim} ${(r.bytes / 1024).toFixed(0)}KB`); done.push(r); }
}
console.log(`done ${done.length}/${items.length}`);
