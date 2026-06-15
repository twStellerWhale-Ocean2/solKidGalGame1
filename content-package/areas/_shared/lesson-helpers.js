// zh：英文字串→中文 的對照表（issue #73 中文協助）；查無則回退 null，由前端降級為僅英文撥放。
const zhLookup = (zh) => (text) => (typeof text === "string" && zh[text]) || null;

export function makeLessons(areaId, vocabularyProfile, placeDefinitions, zh = {}) {
  const zhOf = zhLookup(zh);
  return Object.freeze(placeDefinitions.flatMap((place) => place.questions.map((question, index) => ({
    id: `${areaId}-${place.id}-${String(index + 1).padStart(2, "0")}`,
    area: areaId,
    place: place.id,
    vocabProfile: vocabularyProfile.id,
    theme: place.theme,
    questionType: question.questionType || "sentence-choice",
    prompt: question.prompt,
    promptZh: question.promptZh || zhOf(question.prompt),
    answer: question.answer,
    choices: question.choices,
    choicesZh: Array.isArray(question.choicesZh) ? question.choicesZh : question.choices.map(zhOf),
    words: question.words,
    reward: question.reward || place.reward || { coins: 0 }
  }))));
}

export function makeQuestTemplates(placeDefinitions, zh = {}) {
  const zhOf = zhLookup(zh);
  return Object.freeze(placeDefinitions.map((place) => ({
    id: place.questId || `${place.id}Help`,
    place: place.id,
    title: place.title,
    opening: place.opening,
    openingZh: place.openingZh || zhOf(place.opening),
    ending: place.ending
  })));
}

// issue #96：把該地區「場景自帶題庫」（lessonBank，以 place 為鍵）整塊併入對應的 sceneConfigs 條目，
// 使每個練習場景自帶其課程資料（任務外框＋題目＋每題內嵌中文），供進場時就近取用。
// 無對應題庫之場景（房間／商店／出入口）維持原樣、不帶 lesson。
export function mergeLessons(sceneConfigs, lessonBank = {}) {
  return Object.freeze(Object.fromEntries(
    Object.entries(sceneConfigs).map(([place, config]) =>
      lessonBank[place] ? [place, { ...config, lesson: lessonBank[place] }] : [place, config]
    )
  ));
}
