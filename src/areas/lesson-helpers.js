export function makeLessons(areaId, vocabularyProfile, placeDefinitions) {
  return Object.freeze(placeDefinitions.flatMap((place) => place.questions.map((question, index) => ({
    id: `${areaId}-${place.id}-${String(index + 1).padStart(2, "0")}`,
    area: areaId,
    place: place.id,
    vocabProfile: vocabularyProfile.id,
    theme: place.theme,
    questionType: question.questionType || "sentence-choice",
    prompt: question.prompt,
    answer: question.answer,
    choices: question.choices,
    words: question.words,
    reward: question.reward || place.reward || { vocab: 1, expression: 1 }
  }))));
}

export function makeQuestTemplates(placeDefinitions) {
  return Object.freeze(placeDefinitions.map((place) => ({
    id: place.questId || `${place.id}Help`,
    place: place.id,
    title: place.title,
    opening: place.opening,
    ending: place.ending
  })));
}
