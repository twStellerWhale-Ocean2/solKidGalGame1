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
