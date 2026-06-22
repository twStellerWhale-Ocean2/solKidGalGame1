// issue #134／#246：角色語音指定（gender×personality → voice name）之全機（device-wide）儲存。
// 單一事實來源——遊戲 speechManager 與管理設定工具「聲音管理」頁籤共用同一鍵與同一套讀寫／解析邏輯，
// 不另寫第二套（design.md sysCase#9.5、paramVoiceAssignmentKey）。
export const VOICE_ASSIGNMENT_KEY = "luminara-princess-english-voice"; // design paramVoiceAssignmentKey

// 桶鍵：性別預設桶為 `${gender}:`，性格桶為 `${gender}:${personality}`。
export const assignmentBucketKey = (gender, personality) => `${gender || ""}:${personality || ""}`;

// 建立指定儲存：load／getAll／resolve（含性別預設繼承）／set／clear，全部讀寫同一 localStorage 鍵。
export function createVoiceAssignmentStore() {
  let assignments = {};
  const load = () => {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(VOICE_ASSIGNMENT_KEY) : null;
      const parsed = raw ? JSON.parse(raw) : null;
      assignments = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      assignments = {};
    }
    return assignments;
  };
  const save = () => {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(VOICE_ASSIGNMENT_KEY, JSON.stringify(assignments));
    } catch {}
  };
  return {
    load,
    getAll: () => ({ ...assignments }),
    // 解析某 (gender×personality) 桶指定的 voice name：先取該桶，缺則繼承性別預設桶。
    resolve: (gender, personality) => {
      if (!gender) return "";
      return assignments[assignmentBucketKey(gender, personality)]
        || assignments[assignmentBucketKey(gender, "")]
        || "";
    },
    set: (gender, personality, voiceName) => {
      if (!gender) return;
      const key = assignmentBucketKey(gender, personality);
      if (voiceName) assignments[key] = String(voiceName);
      else delete assignments[key];
      save();
    },
    clear: () => {
      assignments = {};
      save();
    }
  };
}
