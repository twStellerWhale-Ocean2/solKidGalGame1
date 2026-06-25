// Wardrobe single-item image generation (dev tool).
//
// Builds prompts from three layers:
//   _shared/art-style.json houseStyle + pack style.json packStyle + itemDesc
// Then creates a temporary chroma-key mannequin guide by item type, asks the image
// model to draw the wearable on that guide, removes the guide key color, and saves
// a single 512x512 transparent WebP that is used for both wardrobe layer and shop
// preview.
//
//   node tool/generate-wardrobe-asset.mjs <packId> [--item <asset>] [--apply] [--quality high|medium|low] [--direct]
//
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const WARDROBE = join(ROOT, "content-package", "wardrobe");
const TMP = join(ROOT, "tool", "_gen-tmp");
const PREVIEW = join(ROOT, "tool", "_gen-preview");
const ART_STYLE = join(WARDROBE, "_shared", "art-style.json");
let activeKeyColor = "#00ff00";
const MAX_KEY_RESIDUAL_PIXELS = 48;
const MAX_GENERATION_MAGENTA_PIXELS = 2000;

function arg(flag, def = null) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? (process.argv[i + 1] ?? true) : def;
}

const packId = process.argv[2];
if (!packId || packId.startsWith("--")) {
  console.error("usage: node tool/generate-wardrobe-asset.mjs <packId> [--item <asset>] [--apply] [--quality high|medium|low] [--direct]");
  process.exit(1);
}
const onlyItem = arg("--item");
const apply = process.argv.includes("--apply");
const quality = arg("--quality", "high");
const useGuide = !process.argv.includes("--direct");

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) {
  console.error("OPENAI_API_KEY not set in env");
  process.exit(1);
}

const art = JSON.parse(readFileSync(ART_STYLE, "utf8"));
const stylePath = join(WARDROBE, packId, "style.json");
const manifestPath = join(WARDROBE, packId, "manifest.js");
if (!existsSync(stylePath)) {
  console.error(`missing ${stylePath}`);
  process.exit(1);
}
if (!existsSync(manifestPath)) {
  console.error(`missing ${manifestPath}`);
  process.exit(1);
}

const style = JSON.parse(readFileSync(stylePath, "utf8"));
const manifest = readFileSync(manifestPath, "utf8");

function magick(args, options = {}) {
  return execFileSync("magick", args, { encoding: options.encoding || "buffer", maxBuffer: 64 * 1024 * 1024 });
}

function manifestMetaByAsset() {
  const map = new Map();
  const re = /wearable\(\{\s*id:\s*"([^"]+)",\s*storeId:\s*"([^"]+)",\s*type:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*cost:\s*([0-9]+),\s*icon:\s*"([^"]+)",\s*asset:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(manifest))) {
    const [, id, storeId, type, name, cost, icon, asset] = m;
    map.set(asset, { id, storeId, type, name, cost: Number(cost), icon });
  }
  return map;
}

const itemMeta = manifestMetaByAsset();

function chooseKeyColor(asset, itemDesc) {
  const text = `${asset} ${itemDesc}`.toLowerCase();
  const hasGreenSubject = /(green|olive|grass|mint|aqua|leaf|leaves|vine|forest|moss|emerald|cyan|teal|綠|藤|葉|草|湖水|薄荷|森林|橄欖|青)/i.test(text);
  return hasGreenSubject ? "#ff00ff" : "#00ff00";
}

function guideDrawArgs(type) {
  const fill = activeKeyColor;
  const stroke = activeKeyColor;
  const common = ["-size", "1024x1024", "xc:none", "-fill", fill, "-stroke", stroke, "-strokewidth", "0"];
  if (type === "hairstyle") {
    return [
      ...common,
      "-draw", "ellipse 512,460 165,205 0,360"
    ];
  }
  if (type === "outfit") {
    return [
      ...common,
      "-draw", "ellipse 512,174 84,102 0,360",
      "-draw", "roundrectangle 468,270 556,360 32,32",
      "-draw", "polygon 388,360 636,360 690,610 334,610",
      "-draw", "polygon 334,610 690,610 822,930 202,930",
      "-draw", "roundrectangle 250,405 355,720 44,44",
      "-draw", "roundrectangle 669,405 774,720 44,44",
      "-draw", "roundrectangle 404,735 488,965 36,36",
      "-draw", "roundrectangle 536,735 620,965 36,36"
    ];
  }
  if (type === "shoes") {
    return [
      ...common,
      "-draw", "roundrectangle 400,210 478,700 34,34",
      "-draw", "roundrectangle 546,210 624,700 34,34",
      "-draw", "path 'M 382,690 C 392,610 486,610 498,690 C 512,794 472,870 440,872 C 408,874 368,794 382,690 Z'",
      "-draw", "path 'M 526,690 C 538,610 632,610 642,690 C 656,794 616,874 584,872 C 552,870 512,794 526,690 Z'"
    ];
  }
  if (["headTop", "headSide", "faceEyes", "faceMask"].includes(type)) {
    return [
      ...common,
      "-draw", "ellipse 512,440 165,205 0,360",
      "-draw", "roundrectangle 430,650 594,790 45,45"
    ];
  }
  if (type === "neck") {
    return [
      ...common,
      "-draw", "ellipse 512,310 140,170 0,360",
      "-draw", "roundrectangle 448,475 576,660 40,40",
      "-draw", "polygon 350,660 674,660 735,870 289,870"
    ];
  }
  if (type === "hand") {
    return [
      ...common,
      "-draw", "polygon 395,290 630,290 675,640 350,640",
      "-draw", "roundrectangle 650,390 760,760 48,48",
      "-draw", "ellipse 705,785 58,48 0,360"
    ];
  }
  return [
    ...common,
    "-draw", "polygon 360,290 664,290 730,850 294,850"
  ];
}

function maskDrawArgs(type) {
  const clear = "rgba(0,0,0,0)";
  const common = ["-size", "1024x1024", "xc:white", "-alpha", "set", "-fill", clear, "-stroke", clear];
  if (type === "hairstyle") {
    return [
      ...common,
      "-draw", "ellipse 512,430 310,340 0,360",
      "-draw", "rectangle 210,430 814,930"
    ];
  }
  if (type === "outfit") {
    return [
      ...common,
      "-draw", "roundrectangle 430,275 594,390 45,45",
      "-draw", "polygon 330,330 694,330 760,650 264,650",
      "-draw", "polygon 245,590 779,590 910,990 114,990",
      "-draw", "roundrectangle 190,355 405,760 70,70",
      "-draw", "roundrectangle 619,355 834,760 70,70",
      "-draw", "roundrectangle 362,700 510,990 52,52",
      "-draw", "roundrectangle 514,700 662,990 52,52"
    ];
  }
  if (type === "shoes") {
    return [
      ...common,
      "-draw", "roundrectangle 340,390 510,965 58,58",
      "-draw", "roundrectangle 514,390 684,965 58,58",
      "-draw", "ellipse 425,850 125,100 0,360",
      "-draw", "ellipse 599,850 125,100 0,360"
    ];
  }
  if (type === "headTop") {
    return [
      ...common,
      "-draw", "rectangle 235,95 789,390"
    ];
  }
  if (type === "headSide") {
    return [
      ...common,
      "-draw", "rectangle 185,220 839,620"
    ];
  }
  if (["faceEyes", "faceMask"].includes(type)) {
    return [
      ...common,
      "-draw", "rectangle 245,285 779,590"
    ];
  }
  if (type === "neck") {
    return [
      ...common,
      "-draw", "roundrectangle 350,445 674,700 70,70",
      "-draw", "ellipse 512,705 255,175 0,360"
    ];
  }
  if (type === "hand") {
    return [
      ...common,
      "-draw", "roundrectangle 540,330 870,890 90,90",
      "-draw", "ellipse 705,790 120,100 0,360"
    ];
  }
  return [
    ...common,
    "-draw", "rectangle 160,160 864,900"
  ];
}

function createGuide(asset, type) {
  mkdirSync(TMP, { recursive: true });
  const guide = join(TMP, `${packId}-${asset}.guide.png`);
  const mask = join(TMP, `${packId}-${asset}.mask.png`);
  magick([...guideDrawArgs(type), guide]);
  magick([...maskDrawArgs(type), mask]);
  return { guide, mask };
}

function guideDescription(type) {
  const guide = useGuide ? `${activeKeyColor} chroma-key guide` : "invisible mannequin placement shape";
  if (type === "hairstyle") return `CRITICAL ITEM TYPE: HAIRSTYLE ONLY. The ${guide} is only a temporary blank head shape. Draw ONLY hair around it. The face opening must remain large and clear, with a natural hairline following the invisible head instead of a helmet cap or hard wig frame. Do not draw a dress, clothing, shoulders, neck, necklace, crown, face, skin, or body.`;
  if (type === "outfit") return `CRITICAL ITEM TYPE: OUTFIT ONLY. The ${guide} is only a temporary body shape. Draw ONLY the worn outfit over it. Do not draw a head, hair, face, skin, shoes, bag, or separate accessory.`;
  if (type === "shoes") return `CRITICAL ITEM TYPE: SHOES ONLY. The ${guide} is only temporary lower legs and feet in the paper-doll front view. Draw ONLY the shoes as they look while worn on those two feet: orthographic front elevation, left and right shoe separated, toe boxes at the lower edge, and front uppers facing the viewer. Tall boots may have ankle openings at the top; low shoes and clogs should show closed front uppers instead of looking into the shoe. The viewer is facing the character at eye level, not looking down at shoes on a table. Do not show oval insoles, top-down shoe interiors, side-view shoes, legs, socks, skirt, body, floor, a shoe-box display, or floating shoe icons.`;
  if (type === "headTop") return `CRITICAL ITEM TYPE: HEAD-TOP ACCESSORY ONLY. The ${guide} is only a temporary head shape. Draw ONLY the crown or hat accessory. Do not draw hair, face, skin, neck, or body.`;
  if (type === "headSide") return `CRITICAL ITEM TYPE: SIDE HAIR ACCESSORY ONLY. The ${guide} is only a temporary head shape. Draw ONLY the side accessory. Do not draw hair, face, skin, neck, or body.`;
  if (type === "faceEyes") return `CRITICAL ITEM TYPE: EYEWEAR ONLY. The ${guide} is only a temporary head shape. Draw ONLY the eyewear. Do not draw eyes, face, skin, hair, or body.`;
  if (type === "faceMask") return `CRITICAL ITEM TYPE: DECORATIVE MASK ONLY. The ${guide} is only a temporary head shape. Draw ONLY the mask. Do not draw eyes, face, skin, hair, or body.`;
  if (type === "neck") return `CRITICAL ITEM TYPE: NECK ACCESSORY ONLY. The ${guide} is only temporary neck and upper chest placement. Draw ONLY the necklace or pendant as a curved worn accessory layer. Do not draw skin, bust, shoulders, body, dress, face, hair, horizontal support bars, hanger rods, display strings, or any line that reaches the canvas edge.`;
  if (type === "hand") return `CRITICAL ITEM TYPE: HELD ACCESSORY ONLY. The ${guide} is only temporary body side and hand placement. Draw ONLY the held accessory or bag. Do not draw arm, hand, skin, body, or outfit.`;
  return `The ${guide} is temporary placement only. Draw ONLY the wearable item.`;
}

function composePrompt(asset, itemDesc, meta) {
  const h = art.houseStyle;
  const p = style.packStyle;
  const extractionInstruction = useGuide
    ? `Temporary guide workflow: draw the item on top of the pure flat chroma-key ${activeKeyColor} mannequin guide, but keep the mannequin itself an unshaded ${activeKeyColor} key color so it can be removed after generation.`
    : "Output the already-extracted transparent wardrobe layer, as if it had been drawn on a chroma-key mannequin and then cleanly keyed out. Do not include the mannequin itself, any gray silhouette, any blank oval head shape, any torso/leg/arm frame, or any guide outline.";
  return [
    `${h.look}.`,
    extractionInstruction,
    guideDescription(meta.type),
    h.worn || "",
    `Linework: ${h.linework}. Shading: ${h.shading}.`,
    `Collection style: ${p.reference}; palette ${p.palette.join(", ")}; motifs ${p.motifs.join(", ")}; ${p.linework}; mood ${p.mood}.`,
    `The item to draw: ${itemDesc}.`,
    meta.type === "shoes" ? "Footwear composition: use an orthographic front-worn paper-doll layer composition, not product photography. The pair should read as shoes currently on the doll's feet after the feet are removed by chroma key, with visible front uppers and toe caps at the bottom. Do not show the inside of the shoes from above." : "",
    "Do not draw any face, eyes, mouth, skin, head, hands, legs, body, mannequin details, background, floor, shadow, text, label, watermark, border, display stand, product card, hanger, support rod, horizontal guide bar, straight edge-to-edge line, or frame. Do not add a person-shaped outline or blank body opening except natural transparent openings inside the wearable item. Do not add unrelated garments from the collection style. The final visible object after keying must be only the requested wearable item type.",
    art.exclusions
  ].filter(Boolean).join(" ");
}

async function callImageEdit(guide, mask, prompt) {
  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("image", new Blob([readFileSync(guide)], { type: "image/png" }), "guide.png");
  form.append("mask", new Blob([readFileSync(mask)], { type: "image/png" }), "mask.png");
  form.append("background", "transparent");
  form.append("size", "1024x1024");
  form.append("quality", quality);
  form.append("n", "1");
  form.append("prompt", prompt);

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}` },
    body: form
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error?.message || `OpenAI image API ${res.status}`);
  return Buffer.from(json.data[0].b64_json, "base64");
}

async function callImageGeneration(prompt) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      background: "transparent",
      size: "1024x1024",
      quality,
      n: 1,
      prompt
    })
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error?.message || `OpenAI image API ${res.status}`);
  return Buffer.from(json.data[0].b64_json, "base64");
}

function countKeyResidual(file) {
  const raw = magick([file, "-depth", "8", "rgba:-"]);
  let count = 0;
  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i];
    const g = raw[i + 1];
    const b = raw[i + 2];
    const a = raw[i + 3];
    if (a <= 8) continue;
    const nearKey = activeKeyColor === "#00ff00"
      ? g >= 190 && r <= 145 && b <= 145 && g - r >= 35 && g - b >= 35
      : r >= 210 && b >= 210 && g <= 120 && Math.abs(r - b) <= 48;
    if (nearKey) count += 1;
  }
  return count;
}

function isGuidePixel(r, g, b) {
  const brightPinkGuide = r > 180 && b > 110 && g < 210 && r - g > 10 && b - g > -35;
  const darkMagentaGuide = r > 70 && b > 35 && g < 90 && r - g > 20 && b - g > 8;
  const salmonGuideArtifact = r > 155 && b > 85 && g < 175 && r - g > 32 && b - g > -38;
  const brightGreenGuide = g > 135 && r < 230 && b < 205 && g - r > 4 && g - b > 18;
  const oliveGreenGuide = g > 105 && r < 190 && b < 145 && g - r > 6 && g - b > 32;
  return activeKeyColor === "#00ff00"
    ? brightGreenGuide || oliveGreenGuide
    : brightPinkGuide || darkMagentaGuide || salmonGuideArtifact;
}

function removeSmallAlphaComponents(raw, width, height) {
  const pixelCount = width * height;
  const seen = new Uint8Array(pixelCount);
  const queue = [];
  const component = [];
  const alphaAt = (index) => raw[index * 4 + 3];
  const clearComponent = () => {
    for (const p of component) raw[p * 4 + 3] = 0;
  };

  for (let start = 0; start < pixelCount; start += 1) {
    if (seen[start] || alphaAt(start) <= 20) continue;
    queue.length = 0;
    component.length = 0;
    seen[start] = 1;
    queue.push(start);
    let head = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    while (head < queue.length) {
      const p = queue[head++];
      component.push(p);
      const x = p % width;
      const y = Math.floor(p / width);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      for (let yy = y - 1; yy <= y + 1; yy += 1) {
        if (yy < 0 || yy >= height) continue;
        for (let xx = x - 1; xx <= x + 1; xx += 1) {
          if (xx < 0 || xx >= width) continue;
          const next = yy * width + xx;
          if (seen[next] || alphaAt(next) <= 20) continue;
          seen[next] = 1;
          queue.push(next);
        }
      }
    }

    const boxW = maxX - minX + 1;
    const boxH = maxY - minY + 1;
    const thinGuideStripe = component.length < 900 && (boxW > boxH * 8 || boxH > boxW * 8);
    if (component.length < 24 || thinGuideStripe) clearComponent();
  }
}

function removeLongHorizontalRuns(raw, width, height) {
  const minRun = Math.floor(width * 0.2);
  const minAlpha = 4;
  for (let y = 0; y < height; y += 1) {
    let x = 0;
    while (x < width) {
      while (x < width && raw[(y * width + x) * 4 + 3] <= minAlpha) x += 1;
      const start = x;
      while (x < width && raw[(y * width + x) * 4 + 3] > minAlpha) x += 1;
      if (x - start >= minRun) {
        for (let xx = start; xx < x; xx += 1) raw[(y * width + xx) * 4 + 3] = 0;
      }
    }
  }
}

function cleanAlphaPng(file, itemType) {
  const dim = execFileSync("magick", ["identify", "-format", "%w %h", file], { encoding: "utf8" }).trim();
  const [width, height] = dim.split(/\s+/).map(Number);
  const raw = Buffer.from(magick([file, "-depth", "8", "rgba:-"]));
  if (useGuide) {
    for (let i = 0; i < raw.length; i += 4) {
      const a = raw[i + 3];
      if (a <= 8) continue;
      if (isGuidePixel(raw[i], raw[i + 1], raw[i + 2])) raw[i + 3] = 0;
    }
  }
  if (itemType === "neck") removeLongHorizontalRuns(raw, width, height);
  removeSmallAlphaComponents(raw, width, height);
  execFileSync("magick", ["-size", `${width}x${height}`, "-depth", "8", "rgba:-", file], { input: raw, maxBuffer: 64 * 1024 * 1024 });
}

function fitTransparentWebp(src, out, itemType) {
  const keyed = src.replace(/\.png$/, ".keyed.png");
  if (useGuide) {
    magick([
      src,
      "-alpha", "on",
      "-fuzz", "24%",
      "-transparent", activeKeyColor,
      keyed
    ]);
  } else {
    magick([src, "-alpha", "on", keyed]);
  }
  cleanAlphaPng(keyed, itemType);
  const residual = countKeyResidual(keyed);
  const residualLimit = useGuide ? MAX_KEY_RESIDUAL_PIXELS : MAX_GENERATION_MAGENTA_PIXELS;
  if (residual > residualLimit) {
    throw new Error(`key-color residual ${residual}px remains after chroma key`);
  }

  const geom = execFileSync("magick", [keyed, "-channel", "A", "-separate", "+channel", "-threshold", "20%", "-format", "%@", "info:"], { encoding: "utf8" }).trim();
  const crop = /^\d+x\d+\+\d+\+\d+$/.test(geom) ? ["-crop", geom, "+repage"] : ["-trim", "+repage"];
  for (let q = 84; q >= 48; q -= 8) {
    magick([keyed, ...crop, "-resize", "512x512", "-background", "none", "-gravity", "center", "-extent", "512x512", "-quality", String(q), out]);
    if (statSync(out).size <= art.output.maxKB * 1024 || q === 48) break;
  }
  return { residual, bytes: statSync(out).size };
}

async function genOne(asset, itemDesc) {
  const meta = itemMeta.get(asset);
  if (!meta) {
    console.warn(`  skip ${asset}: no manifest item`);
    return null;
  }
  activeKeyColor = chooseKeyColor(asset, itemDesc);
  const prompt = composePrompt(asset, itemDesc, meta);
  mkdirSync(TMP, { recursive: true });
  const gen1024 = join(TMP, `${packId}-${asset}.1024.png`);
  if (useGuide) {
    const { guide, mask } = createGuide(asset, meta.type);
    writeFileSync(gen1024, await callImageEdit(guide, mask, prompt));
  } else {
    writeFileSync(gen1024, await callImageGeneration(prompt));
  }

  const outDir = apply ? join(WARDROBE, packId, "assets", "layers") : join(PREVIEW, packId);
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, `${asset}.webp`);
  const result = fitTransparentWebp(gen1024, out, meta.type);
  const dim = execFileSync("magick", ["identify", "-format", "%wx%h", out], { encoding: "utf8" }).trim();
  return { asset, out, dim, ...result, prompt };
}

const items = Object.entries(style.items)
  .map(([asset, v]) => [asset, typeof v === "string" ? v : v.desc])
  .filter(([asset]) => !onlyItem || asset === onlyItem);

console.log(`gen ${items.length} item(s) of [${packId}] quality=${quality} mode=${useGuide ? "guide-edit" : "direct-transparent-experiment"} → ${apply ? "APPLY layers/" : "preview tool/_gen-preview/"}`);
const done = [];
for (const [asset, desc] of items) {
  process.stdout.write(`  ${asset} … `);
  try {
    const r = await genOne(asset, desc);
    if (r) {
      console.log(`${r.dim} ${(r.bytes / 1024).toFixed(0)}KB key=${r.residual}px`);
      done.push(r);
    }
  } catch (error) {
    console.log(`ERROR ${String(error?.message || error)}`);
  }
}
console.log(`done ${done.length}/${items.length}`);
if (done.length !== items.length) process.exit(1);
