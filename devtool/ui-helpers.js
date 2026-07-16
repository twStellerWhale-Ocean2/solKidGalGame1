// 管理設定工具五分頁共用 UI 基礎（issue #297／spec#22／sysCase#15.1–15.3）。
// MD3 風格 dialog／snackbar、dirty-guard（beforeunload）、hash 深連結與共用 postJson；
// 沿 theme-md3 token、不引外部框架、不動 server.mjs 寫回契約。

//#region dirty-guard（sysCase#15.2：任一分頁有未儲存工作即攔截離頁）
const dirtySources = new Map(); // source → 顯示名

export function setDirty(source, isDirty, label = source) {
  if (isDirty) dirtySources.set(source, label);
  else dirtySources.delete(source);
}

export function anyDirty() { return dirtySources.size > 0; }
export function dirtyLabels() { return [...dirtySources.values()]; }

window.addEventListener("beforeunload", (e) => {
  if (!dirtySources.size) return;
  e.preventDefault();
  e.returnValue = ""; // 原生離頁確認（文案由瀏覽器決定）
});
//#endregion dirty-guard

//#region dialog（MD3 風格 <dialog>；取代 window.alert／confirm）
function buildDialog({ title, bodyHtml, actions }) {
  const dlg = document.createElement("dialog");
  dlg.className = "ui-dialog";
  dlg.innerHTML = `
    <h3 class="ui-dialog-title"></h3>
    <div class="ui-dialog-body"></div>
    <div class="ui-dialog-actions"></div>`;
  dlg.querySelector(".ui-dialog-title").textContent = title || "";
  dlg.querySelector(".ui-dialog-body").innerHTML = bodyHtml || "";
  const actionsEl = dlg.querySelector(".ui-dialog-actions");
  for (const a of actions) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = a.text;
    b.className = a.className || "";
    b.addEventListener("click", () => a.onClick(dlg));
    actionsEl.append(b);
  }
  document.body.append(dlg);
  dlg.addEventListener("close", () => dlg.remove());
  return dlg;
}

// 確認對話框；danger=true 時確認鈕採 error 色（危險操作視覺區隔）。回傳 Promise<boolean>。
export function uiConfirm({ title, bodyHtml = "", confirmText = "確定", cancelText = "取消", danger = false }) {
  return new Promise((resolve) => {
    const dlg = buildDialog({
      title, bodyHtml,
      actions: [
        { text: cancelText, onClick: (d) => { d.close(); resolve(false); } },
        { text: confirmText, className: danger ? "ui-btn-danger" : "ui-btn-primary", onClick: (d) => { d.close(); resolve(true); } }
      ]
    });
    dlg.addEventListener("cancel", () => resolve(false)); // ESC＝取消
    dlg.showModal();
  });
}

// 告知對話框（錯誤詳情等，可含重點文字）。回傳 Promise<void>。
export function uiAlert(title, bodyHtml = "") {
  return new Promise((resolve) => {
    const dlg = buildDialog({
      title, bodyHtml,
      actions: [{ text: "知道了", className: "ui-btn-primary", onClick: (d) => { d.close(); resolve(); } }]
    });
    dlg.addEventListener("cancel", () => resolve());
    dlg.showModal();
  });
}

// 表單對話框：fields=[{key,label,type:"text"|"number"|"textarea",value,min,rows}]；
// 回傳輸入物件或 null（取消）。required 欄空值時擋存並標示。
export function uiFormDialog({ title, noteHtml = "", fields, submitText = "儲存" }) {
  return new Promise((resolve) => {
    const rows = fields.map((f) => {
      const input = f.type === "textarea"
        ? `<textarea data-key="${f.key}" rows="${f.rows || 4}"></textarea>`
        : `<input data-key="${f.key}" type="${f.type || "text"}"${f.min != null ? ` min="${f.min}"` : ""}>`;
      return `<label class="ui-form-row"><span>${f.label}</span>${input}</label>`;
    }).join("");
    const dlg = buildDialog({
      title,
      bodyHtml: `${noteHtml}${rows}`,
      actions: [
        { text: "取消", onClick: (d) => { d.close(); resolve(null); } },
        {
          text: submitText, className: "ui-btn-primary",
          onClick: (d) => {
            const out = {};
            for (const f of fields) {
              const el = d.querySelector(`[data-key="${f.key}"]`);
              const v = f.type === "number" ? Number(el.value) || 0 : el.value.trim();
              if (f.required && !v) { el.classList.add("ui-field-invalid"); el.focus(); return; }
              out[f.key] = v;
            }
            d.close(); resolve(out);
          }
        }
      ]
    });
    for (const f of fields) {
      const el = dlg.querySelector(`[data-key="${f.key}"]`);
      el.value = f.value ?? "";
    }
    dlg.addEventListener("cancel", () => resolve(null));
    dlg.showModal();
    dlg.querySelector("input, textarea")?.focus();
  });
}
//#endregion dialog

//#region snackbar（統一回饋出口：成功自動消散、失敗持留可關閉）
let snackHost = null;

function ensureSnackHost() {
  if (!snackHost) {
    snackHost = document.createElement("div");
    snackHost.className = "ui-snack-host";
    document.body.append(snackHost);
  }
  return snackHost;
}

export function snack(text, kind = "info") {
  const host = ensureSnackHost();
  const el = document.createElement("div");
  el.className = `ui-snack ui-snack-${kind}`;
  el.innerHTML = `<span class="ui-snack-text"></span>`;
  el.querySelector(".ui-snack-text").textContent = text;
  if (kind === "err") {
    const close = document.createElement("button");
    close.type = "button";
    close.className = "ui-snack-close";
    close.setAttribute("aria-label", "關閉訊息");
    close.textContent = "✕";
    close.addEventListener("click", () => el.remove());
    el.append(close);
  } else {
    window.setTimeout(() => el.remove(), 4000);
  }
  host.append(el);
  while (host.children.length > 4) host.firstChild.remove();
}

// 行內狀態＋snackbar 的統一出口：ok／err 同步發 snackbar；行內 ok 訊息 4 秒自動清空。
export function status(el, text, kind = "") {
  if (el) {
    el.textContent = text;
    el.className = `apply-status${kind ? ` apply-status-${kind}` : ""}`;
    if (kind === "ok") {
      window.setTimeout(() => {
        if (el.textContent === text) { el.textContent = ""; el.className = "apply-status"; }
      }, 4000);
    }
  }
  if (kind === "ok" || kind === "err") snack(text, kind);
}
//#endregion snackbar

//#region hash 深連結（sysCase#15.3：#panel/子狀態，重載後可回到工作點）
export function hashParts() {
  return location.hash.slice(1).split("/").filter(Boolean).map(decodeURIComponent);
}

// 僅當目前 hash 的 panel 段與 panel 相符時改寫子狀態（避免分頁模組互踩）。
export function setHashSub(panel, ...parts) {
  if (hashParts()[0] !== panel) return;
  const next = "#" + [panel, ...parts.filter((p) => p !== "" && p != null)].map(encodeURIComponent).join("/");
  if (location.hash !== next) history.replaceState(null, "", next);
}
//#endregion hash 深連結

//#region 共用 fetch／檔案
export async function postJson(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("讀取圖檔失敗")));
    reader.readAsDataURL(file);
  });
}
//#endregion 共用 fetch／檔案
