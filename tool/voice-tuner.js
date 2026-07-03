// issue #246：管理設定工具「聲音管理」頁籤——角色語音指定由玩家 Settings 移入維護者工具。
// 重用遊戲端同一套來源（單一事實來源、不另寫第二套）：
//   - renderVoiceSettings：與遊戲 Settings 曾用之同一渲染器（render/settings.js）。
//   - usedVoiceBuckets／recommendedVoiceNamesForGender：角色實際採用之語音桶與同性別推薦清單（data/game-data.js）。
//   - createVoiceAssignmentStore／VOICE_ASSIGNMENT_KEY：與遊戲 speechManager 共用之 device-wide 指定儲存（state/voice-assignments.js）。
import { renderVoiceSettings } from "../game-engine/render/settings.js";
import { usedVoiceBuckets, recommendedVoiceNamesForGender } from "../game-engine/data/game-data.js";
import { createVoiceAssignmentStore } from "../game-engine/state/voice-assignments.js";
// issue #297：「清除所有指定」屬危險整批操作，改 MD3 error 色確認對話框（B8）；回饋加 snackbar；
// 欄寬拖曳與其他分頁一致（B11）。
import { uiConfirm, snack } from "./ui-helpers.js";
import { setupColumnResize } from "./wardrobe-gestures.js";

const list = document.getElementById("voiceAssignList");
const summary = document.getElementById("voiceSummary");
const status = document.getElementById("voiceStatus");
const previewInput = document.getElementById("voicePreviewText");
const reloadBtn = document.getElementById("voiceReloadBtn");
const clearBtn = document.getElementById("voiceClearBtn");

// 聲音頁籤不存在（理論上不會）就不啟用。
if (list) {
  const store = createVoiceAssignmentStore();
  store.load();

  const hasSynth = typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

  const listVoices = () => {
    if (!hasSynth || typeof window.speechSynthesis.getVoices !== "function") return [];
    try {
      return (window.speechSynthesis.getVoices() || []).map((v) => ({ name: v.name || "", lang: v.lang || "", default: Boolean(v.default) }));
    } catch {
      return [];
    }
  };

  const setStatus = (msg) => { if (status) status.textContent = msg || ""; };

  // 以該桶當前選定（或繼承解析）之 voice 唸範例句；無指定時用瀏覽器預設語音試聽。
  const previewBucket = (bucket, selectedValue) => {
    if (!hasSynth) { setStatus("此瀏覽器不支援語音播放（Web Speech API）。"); return; }
    const text = (previewInput?.value || "").trim() || "Hello!";
    const voiceName = selectedValue || store.resolve(bucket.gender, bucket.personality);
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices() || [];
      const match = voiceName ? voices.find((v) => v.name === voiceName) : null;
      if (match) { utter.voice = match; utter.lang = match.lang || "en-US"; }
      else utter.lang = "en-US";
      utter.rate = 0.85;
      window.speechSynthesis.speak(utter);
      setStatus(`試聽：${match ? match.name : "（瀏覽器自動選用）"}`);
    } catch {
      setStatus("試聽失敗（瀏覽器語音限制）。");
    }
  };

  const render = () => {
    const voices = listVoices();
    const buckets = usedVoiceBuckets().map((bucket) => ({
      ...bucket,
      recommended: recommendedVoiceNamesForGender(bucket.gender, voices)
    }));
    renderVoiceSettings({ voiceAssignList: list }, {
      buckets,
      voices,
      assignments: store.getAll(),
      onAssign: (gender, personality, voiceName) => {
        store.set(gender, personality, voiceName);
        setStatus(`已${voiceName ? "指定" : "清除"} ${gender}${personality ? "·" + personality : "（預設）"} → ${voiceName || "Auto"}`);
      },
      onPreview: previewBucket
    });
    if (summary) {
      summary.textContent = voices.length
        ? `裝置可用語音 ${voices.length} 個・桶 ${buckets.length} 列`
        : "尚未載入裝置語音（瀏覽器仍在載入或不支援），請稍候或按「重新載入裝置語音」。";
    }
  };

  // getVoices() 初次常回空，待 voiceschanged 載入後重渲染；頁籤切到聲音管理時也重渲染（hidden→顯示）。
  if (hasSynth) window.speechSynthesis?.addEventListener?.("voiceschanged", render);
  window.addEventListener("editor-tab-change", (event) => {
    if (event.detail?.tab === "voice") render();
  });

  reloadBtn?.addEventListener("click", () => { render(); setStatus("已重新載入裝置語音清單。"); });
  clearBtn?.addEventListener("click", async () => {
    const ok = await uiConfirm({
      title: "清除所有語音指定？",
      bodyHtml: "<p>整台裝置（device-wide）所有角色類型的語音指定將全部回到 Auto，<strong>無法復原</strong>。</p>",
      confirmText: "全部清除",
      danger: true
    });
    if (!ok) return;
    store.clear();
    render();
    setStatus("已清除所有指定，全部回到 Auto。");
    snack("已清除所有語音指定（回到 Auto）。", "ok");
  });

  // 欄寬拖曳（#297 B11：與其他分頁一致；本頁僅左欄分隔條）
  setupColumnResize(
    document.querySelector("#panel-voice .map-shell"),
    document.querySelector("#panel-voice .col-resizer"),
    null
  );

  // 初次渲染（即使尚在其他頁籤，先把清單建好；voiceschanged／切頁會再刷新）。
  render();
}
