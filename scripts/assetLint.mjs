#!/usr/bin/env node
// scripts/assetLint.mjs — issue #197：圖像資產標準尺寸與檔重預算之「檔案系統」gate（intTest#49）。
// 掃描 content-base/ 與 content-package/ 下「全部」圖像檔（不只 registry/CSS 引用者），
// 依 classifyAssetPath 歸類，比對 assetStandards（exact 等於／bound 容於 ＋ maxKB 檔重預算）；
// 未分類即報為漏網（orphan／CSS-only／裝飾資產也須登記類別），杜絕過大圖檔以未引用檔形式 ship。
// 與瀏覽器 data-audit 共用同一 SSOT（content-package/_shared/asset-standards.js）。
//
// 像素尺寸以「純 Node」直接解析檔頭（WebP／PNG／JPEG），不依賴 ImageMagick 等外部二進位，
// 使 `node scripts/assetLint.mjs` 可在僅有 Node 之 CI／維護環境執行（無 magick 也能驗）。
// 用法：node scripts/assetLint.mjs ；0 違規 → exit 0，否則列出並 exit 違規數。
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { assetStandards, classifyAssetPath, assetSizeExemptions } from "../content-package/_shared/asset-standards.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const IMG = /\.(webp|png|jpe?g)$/i;
const ROOTS = ["content-base", "content-package"];

function walk(dir, acc) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (IMG.test(e.name)) acc.push(p);
  }
  return acc;
}

// 純 Node 檔頭解析像素尺寸；回傳 {w,h} 或 null（無法解析）。
function imageDimsFromBuffer(buf) {
  // WebP：RIFF....WEBP，再依 VP8 / VP8L / VP8X 分支。
  if (buf.length >= 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const fmt = buf.toString("ascii", 12, 16);
    if (fmt === "VP8 ") { // 有損：起始碼後 width/height 各 14-bit（offset 26/28）
      return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    }
    if (fmt === "VP8L") { // 無損：offset 21 起 14-bit-1
      const bits = buf.readUInt32LE(21);
      return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (fmt === "VP8X") { // 延伸：offset 24 起 24-bit-1
      return {
        w: ((buf[24] | (buf[25] << 8) | (buf[26] << 16)) & 0xffffff) + 1,
        h: ((buf[27] | (buf[28] << 8) | (buf[29] << 16)) & 0xffffff) + 1
      };
    }
    return null;
  }
  // PNG：簽章後 IHDR 之 width/height（big-endian，offset 16/20）
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  // JPEG：FFD8 後掃描 SOF marker 取 height/width
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off + 9 < buf.length) {
      if (buf[off] !== 0xff) { off += 1; continue; }
      const marker = buf[off + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { w: buf.readUInt16BE(off + 7), h: buf.readUInt16BE(off + 5) };
      }
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) { off += 2; continue; }
      off += 2 + buf.readUInt16BE(off + 2);
    }
  }
  return null;
}

const files = [];
for (const r of ROOTS) walk(join(root, r), files);

const violations = [];
let checked = 0;
for (const abs of files) {
  const rel = abs.slice(root.length + 1).split(/[\\/]/).join("/");
  const cls = classifyAssetPath(rel);
  if (!cls) { violations.push(`未涵蓋漏網類別：${rel}（請於 asset-standards.js 登記其類別）`); continue; }
  const std = assetStandards[cls];
  const exempt = Object.entries(assetSizeExemptions).find(([sfx]) => rel.endsWith(sfx))?.[1];
  const buf = readFileSync(abs);
  const bytes = buf.length;
  const dims = imageDimsFromBuffer(buf);
  if (!dims) { violations.push(`${rel} 無法解析像素尺寸（非 WebP/PNG/JPEG 或檔頭損壞）`); continue; }
  checked += 1;
  if (exempt) continue;
  const sizeOk = std.mode === "bound" ? (dims.w <= std.width && dims.h <= std.height) : (dims.w === std.width && dims.h === std.height);
  const weightOk = bytes <= std.maxKB * 1024;
  if (!sizeOk) {
    violations.push(`${cls} ${rel} 為 ${dims.w}x${dims.h}，${std.mode === "bound" ? `超出畫布 ${std.width}x${std.height}` : `應為 ${std.width}x${std.height}`}`);
  }
  if (!weightOk) {
    violations.push(`${cls} ${rel} 為 ${(bytes / 1024).toFixed(1)}KB，超出 ${std.maxKB}KB 預算`);
  }
}

console.log(`assetLint（issue #197）── 掃描 ${files.length} 圖像檔、檢查 ${checked}、登記類別 ${Object.keys(assetStandards).length}`);
if (violations.length === 0) {
  console.log("結果：PASS（0 違規）");
  process.exit(0);
}
console.log(`結果：FAIL（${violations.length} 違規）`);
violations.forEach((v) => console.log("  ✗ " + v));
process.exit(violations.length);
