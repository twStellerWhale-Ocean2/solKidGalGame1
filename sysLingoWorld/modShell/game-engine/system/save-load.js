import { saveMarkerEnd, saveMarkerStart } from "../state/storage.js";

export function createSaveLoadController({
  buildSaveMarkdown,
  confirmImport = () => true,
  elements,
  normalizeState,
  onStateLoaded,
  importRosterMode = () => "replace", // #380：roster envelope 匯入模式（"add"｜"replace"｜null＝取消）
  onRosterLoaded = () => {}, // #380：套用匯入之 roster envelope
  persist,
  render
}) {
  async function saveMarkdown() {
    const markdown = buildSaveMarkdown();
    const filename = "luminara-adv-dressup-save.md";
    if ("showSaveFilePicker" in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: "Markdown Save", accept: { "text/markdown": [".md"] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(markdown);
        await writable.close();
        elements.statusMessage.textContent = "Save complete.";
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    elements.statusMessage.textContent = "Markdown save downloaded.";
  }

  function loadMarkdownText(text) {
    // issue #309（sysCase#4.2）：匯入屬使用者明示之覆蓋操作；雲端帳號已有進度時先警示覆蓋方向並確認。
    if (!confirmImport()) {
      elements.statusMessage.textContent = "Import cancelled.";
      return;
    }
    const start = text.indexOf(saveMarkerStart);
    const end = text.indexOf(saveMarkerEnd);
    if (start === -1 || end === -1 || end <= start) throw new Error("Luminara save data block was not found.");
    const json = text.slice(start + saveMarkerStart.length, end).trim();
    const parsed = JSON.parse(json);
    // #380：payload 為 roster envelope（有 characters 物件）→ 提示 ADD/REPLACE；否則 legacy 單一 state（wrap 成一員）。
    if (parsed && typeof parsed === "object" && parsed.characters && typeof parsed.characters === "object" && !Array.isArray(parsed.characters)) {
      const mode = importRosterMode(parsed);
      if (!mode) { elements.statusMessage.textContent = "Import cancelled."; return; }
      onRosterLoaded(parsed, mode);
    } else {
      onStateLoaded(normalizeState(parsed));
      persist();
    }
    elements.statusMessage.textContent = "Load complete. Progress restored.";
    render();
  }

  async function loadMarkdown() {
    if ("showOpenFilePicker" in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: "Markdown Save", accept: { "text/markdown": [".md"], "text/plain": [".md", ".txt"] } }]
        });
        const file = await handle.getFile();
        loadMarkdownText(await file.text());
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    elements.loadFileInput.click();
  }

  return { loadMarkdown, loadMarkdownText, saveMarkdown };
}
