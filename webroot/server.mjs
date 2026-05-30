import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const rootPrefix = root.endsWith(sep) ? root : `${root}${sep}`;
const port = Number(process.env.PORT || 4174);
const apiKey = process.env.OPENAI_API_KEY || "";
const orgId = process.env.OPENAI_ORG_ID || "";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8"
};

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") parts.push(content.text);
      if (typeof content.output_text === "string") parts.push(content.output_text);
    }
  }
  return parts.join(" ").trim();
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function handleHelp(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }
  if (!apiKey) {
    sendJson(response, 503, { error: "OPENAI_API_KEY is not set in the local server environment." });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readRequestBody(request));
  } catch {
    sendJson(response, 400, { error: "Invalid JSON body." });
    return;
  }

  const prompt = [
    `NPC line: ${payload.line || ""}`,
    `Task: ${payload.prompt || ""}`,
    `Choices: ${(payload.choices || []).join(" | ")}`
  ].join("\n");

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(orgId ? { "OpenAI-Organization": orgId } : {})
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content: "You are a kind English helper for a young child. Give one short hint in simple English. Do not directly reveal the final answer."
          },
          { role: "user", content: prompt }
        ],
        max_output_tokens: 90
      })
    });
    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      sendJson(response, apiResponse.status, { error: data.error?.message || "OpenAI request failed." });
      return;
    }
    sendJson(response, 200, { text: extractOutputText(data) });
  } catch (error) {
    sendJson(response, 502, { error: error.message });
  }
}

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

createServer(async (request, response) => {
  if (request.url?.startsWith("/api/help")) {
    await handleHelp(request, response);
    return;
  }
  await serveStatic(request, response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Luminara local server running at http://127.0.0.1:${port}/`);
});
