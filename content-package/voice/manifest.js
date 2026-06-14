//#region 角色音色目錄（issue #93 / datIntf自訂角色音色目錄）
// 維度合成式音色：pitch／rate 由「性別 × 年齡 × 性格」各維度的增量貢獻疊加運算，
// 而非枚舉笛卡兒積大表——新增一個維度值只需加一筆貢獻，避免「目錄爆炸」。
// 角色（NPC 與可玩公主）以 voice:{gender,age,personality} 宣告其特性；
// 任一維度缺漏或不在枚舉時，該維度貢獻 0，整體降級回 DEFAULT_VOICE_PROFILE（不丟錯）。
//
// 設計取捨（design.md ＜II＞ 已記）：瀏覽器 Web Speech API 實際只能可靠調 pitch／rate，
// 故「性別／年齡」承擔主要辨識度、「性格」僅作小幅修飾；具名 voice 屬平台相依，不在此硬選。

export const voiceCatalogVersion = "issue93-character-voice-r1";

// Web Speech API 安全範圍：pitch 0–2、rate 0.1–10；實務取較窄區間維持可聽。
const PITCH_RANGE = Object.freeze({ min: 0.1, max: 2 });
const RATE_RANGE = Object.freeze({ min: 0.6, max: 1.4 });

// 基準（即 `default` 降級項，rate 沿用 issue #73 既有單一嗓音 0.86）。
export const DEFAULT_VOICE_PROFILE = Object.freeze({ profileId: "default", lang: "en-US", pitch: 1, rate: 0.86 });

// 各維度對 pitch／rate 的增量貢獻；未列之值貢獻 0（降級包容）。
const GENDER_DELTA = Object.freeze({
  female: { pitch: 0.18, rate: 0 },
  male: { pitch: -0.22, rate: -0.02 }
});
const AGE_DELTA = Object.freeze({
  child: { pitch: 0.35, rate: 0.06 },
  youth: { pitch: 0.15, rate: 0.03 },
  middle: { pitch: 0, rate: 0 },
  elderly: { pitch: -0.12, rate: -0.12 }
});
// 性格僅作小幅修飾（引擎限制，design.md 警告已記）。
const PERSONALITY_DELTA = Object.freeze({
  bold: { pitch: -0.06, rate: 0.06 },        // 豪邁
  cheerful: { pitch: 0.06, rate: 0.08 },     // 開朗
  graceful: { pitch: 0.02, rate: -0.06 },    // 氣質
  melancholy: { pitch: -0.04, rate: -0.10 }  // 憂鬱
});

export const VOICE_DIMENSIONS = Object.freeze({
  gender: Object.freeze(Object.keys(GENDER_DELTA)),
  age: Object.freeze(Object.keys(AGE_DELTA)),
  personality: Object.freeze(Object.keys(PERSONALITY_DELTA))
});

function clampTo(value, range) {
  return Math.min(range.max, Math.max(range.min, value));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

// 維度組合 → 音頻參數；任一維度缺漏或不在枚舉即貢獻 0，不丟錯。
export function composeVoiceProfile(dims) {
  if (!dims || typeof dims !== "object") return DEFAULT_VOICE_PROFILE;
  const g = GENDER_DELTA[dims.gender] || { pitch: 0, rate: 0 };
  const a = AGE_DELTA[dims.age] || { pitch: 0, rate: 0 };
  const p = PERSONALITY_DELTA[dims.personality] || { pitch: 0, rate: 0 };
  const pitch = clampTo(DEFAULT_VOICE_PROFILE.pitch + g.pitch + a.pitch + p.pitch, PITCH_RANGE);
  const rate = clampTo(DEFAULT_VOICE_PROFILE.rate + g.rate + a.rate + p.rate, RATE_RANGE);
  const profileId = [dims.gender, dims.age, dims.personality].filter(Boolean).join("-") || "default";
  return Object.freeze({ profileId, lang: dims.lang || DEFAULT_VOICE_PROFILE.lang, pitch: round2(pitch), rate: round2(rate) });
}

// 由角色宣告（voice 欄位）解析音色；無宣告即降級為 default。
export function resolveVoiceProfile(voiceDecl) {
  if (!voiceDecl) return DEFAULT_VOICE_PROFILE;
  return composeVoiceProfile(voiceDecl);
}
//#endregion 角色音色目錄

//#region 角色音色宣告（CHARACTER：以特性宣告，解析時對應音色項）
// 可玩公主：皆 child × female，性格略異以增辨識度（公主回答問題時以此音色朗讀作答）。
export const playableVoiceById = Object.freeze({
  lumi: Object.freeze({ gender: "female", age: "child", personality: "cheerful" }),
  yumi: Object.freeze({ gender: "female", age: "child", personality: "graceful" }),
  sol: Object.freeze({ gender: "female", age: "child", personality: "bold" })
});

// 場景人物（NPC）以顯示名為鍵；未列名者解析時自動降級 default。
// slice 1：castle 全員；urban／rural／wild 於 slice 2 於本表續補。
export const npcVoiceByName = Object.freeze({
  "King Rowan": Object.freeze({ gender: "male", age: "middle", personality: "bold" }),
  "Queen Mira": Object.freeze({ gender: "female", age: "middle", personality: "graceful" }),
  "Cook Panna": Object.freeze({ gender: "female", age: "middle", personality: "cheerful" }),
  "Knight Theo": Object.freeze({ gender: "male", age: "youth", personality: "bold" }),
  "Maid Lala": Object.freeze({ gender: "female", age: "youth", personality: "cheerful" }),
  "Cloak Keeper": Object.freeze({ gender: "male", age: "elderly", personality: "graceful" }),
  "Seamstress Bea": Object.freeze({ gender: "female", age: "middle", personality: "graceful" }),
  "Gate Guard": Object.freeze({ gender: "male", age: "middle", personality: "bold" })
});

export function voiceProfileForNpcName(name) {
  return resolveVoiceProfile(npcVoiceByName[name]);
}

export function voiceProfileForCharacterId(characterId) {
  return resolveVoiceProfile(playableVoiceById[characterId]);
}
//#endregion 角色音色宣告
