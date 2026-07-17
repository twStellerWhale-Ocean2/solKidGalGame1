// issue #96：把該地區「場景自帶題庫」（lessonBank，以 place 為鍵）整塊併入對應的 sceneConfigs 條目，
// 使每個練習場景自帶其課程資料（任務外框＋題目＋每題內嵌中文），供進場時就近取用。
// meta（area／vocabProfile）為地區常數，注入 lesson 供取題時導出每題 lessonId 與進度/日誌欄位。
// 無對應題庫之場景（房間／商店／出入口）維持原樣、不帶 lesson。
// issue #135：key 參數讓同一機制併入第二種題庫（生活聊天 chatLesson）；預設 "lesson"（打工任務）維持既有四地區呼叫相容。
// 可鏈式呼叫：mergeLessons(mergeLessons(configs, jobBank, meta), chatBank, meta, "chatLesson")。
export function mergeLessons(sceneConfigs, lessonBank = {}, meta = {}, key = "lesson") {
  return Object.freeze(Object.fromEntries(
    Object.entries(sceneConfigs).map(([place, config]) =>
      lessonBank[place]
        ? [place, { ...config, [key]: { ...lessonBank[place], area: meta.area, vocabProfile: meta.vocabProfile } }]
        : [place, config]
    )
  ));
}
