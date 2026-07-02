// scene/adv-flow.js — ADV 場景流程與答題：兩層動線、題目呈現、獎勵階梯、收尾（issue #298 自 main.js 拆出，行為零變更）。
import {
  CHINESE_AUDIO_LANG,
  cutSceneVoiceOnSwitch,
  npcVoiceFor,
  playLessonAudio,
  playTone,
  playerVoiceProfile,
  speak,
  speechManager
} from "./speech.js";
import { applyAdvSceneArt } from "./scene-art.js";
import { activePaperDollCharacter, clearTryOnPreview, renderPaperDolls } from "../wardrobe/doll.js";
import { openRefundDetail, openShopDetail, openWardrobeDetail } from "../wardrobe/shop-panel.js";
import { openArea } from "../map/map-runtime.js";
import { areaForHotspot, hotspotById, sceneConfigFor } from "../core/lookups.js";
import { areaRegistry, characterScaleContract, sceneConfigs } from "../data/game-data.js";
import { createAdvControls } from "../flow/adv-controls.js";
import { firstLayerActionsFor, sceneActionLabel } from "../flow/scene-actions.js";
import { createQuestForPlace, effectText } from "../state/game-state.js";
import {
  extendSession,
  isJobDone,
  markJobDone,
  recordAnswer as recordCycleAnswer
} from "../system/play-clock.js";
import { cssAssetUrl, domAssetUrl } from "../core/asset-url.js";
import { elements, session } from "../core/session.js";
import { hub } from "../core/hub.js";

export const REWARD_SECOND_TRY_RATIO = 0.5;    // design paramRewardSecondTryRatio
export const CHAT_MOOD_REWARD = 1;             // issue #135 design paramChatMoodReward：每次生活聊天答對增加的心情值
export const MOOD_MINUTES_PER_POINT = 1;       // issue #135 design paramMoodMinutesPerPoint：每點心情換算延長的遊玩分鐘數
export const CHAT_CHOICE_COUNT = 2;            // issue #138 design paramChatChoiceCount：生活聊天每題呈現選項數（輕鬆寒暄）
export const JOB_CHOICE_COUNT = 3;             // issue #149 design paramJobChoiceCount：打工任務每題呈現選項數（#138 為 4、#149 收斂為 3）
// issue #149：題組不再帶 ending 旁白；完成時由角色說一句自然收尾（聊天＝道別、打工＝稱讚＋道謝），隨機選一句並附中文、由 NPC 音色朗讀，取代固定的 "Nice chat!"／"Great work!"。
export const CHAT_ENDINGS = [
  { en: "See you soon, Princess!", zh: "待會見，公主！" },
  { en: "Take care, Princess!", zh: "公主，保重喔！" },
  { en: "Come and chat again soon!", zh: "要再來聊天喔！" },
  { en: "Bye for now, Princess!", zh: "先這樣囉，公主，再見！" },
  { en: "It was lovely talking with you.", zh: "和你聊天真開心。" },
  { en: "Thanks for stopping by, Princess!", zh: "謝謝你過來，公主！" },
  { en: "Have a wonderful day!", zh: "祝你有美好的一天！" },
  { en: "See you next time!", zh: "下次見！" },
  { en: "I always enjoy our chats.", zh: "我每次都很喜歡和你聊天。" },
  { en: "Take good care, and come back soon!", zh: "好好保重，要再來喔！" }
];
export const WORK_ENDINGS = [
  { en: "Good job! Thank you, Princess.", zh: "做得好！謝謝你，公主。" },
  { en: "Great work! Thank you so much.", zh: "做得很棒！非常謝謝你。" },
  { en: "Well done! Thank you for your help.", zh: "太好了！謝謝你的幫忙。" },
  { en: "Wonderful! You helped me a lot.", zh: "太棒了！你幫了我大忙。" },
  { en: "Perfect! I could not have done it without you.", zh: "完美！沒有你我做不到。" },
  { en: "Amazing work, Princess! Thank you!", zh: "公主，做得太厲害了！謝謝你！" },
  { en: "You did it! Thank you, Princess.", zh: "你做到了！謝謝你，公主。" },
  { en: "Such a big help! Thank you!", zh: "真是幫了大忙！謝謝你！" },
  { en: "Nicely done! I really appreciate it.", zh: "做得真好！我真的很感謝。" },
  { en: "Brilliant! You are a great helper.", zh: "太棒了！你是很棒的小幫手。" }
];
export function pickEnding(isChat) {
  const pool = isChat ? CHAT_ENDINGS : WORK_ENDINGS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const advControls = createAdvControls({
  elements,
  getFocusIndex: () => session.advFocusIndex,
  getMode: () => session.advMode,
  setFocusIndex: (nextIndex) => { session.advFocusIndex = nextIndex; }
});

export function openAdvBase(hotspot, mode) {
  const areaId = areaForHotspot(hotspot);
  session.state.area = areaId;
  hub.changeView(areaRegistry[areaId]?.view || "map");
  clearRewardBursts();
  const scene = sceneConfigFor(hotspot);
  session.advMode = mode;
  session.activeLesson = null;
  session.activeShopHotspot = null;
  clearTryOnPreview({ renderDoll: false });
  session.shopTryOnIds = [];
  session.advFocusIndex = 0;
  hub.setExpressions("normal", "normal");
  elements.advScene.dataset.mode = mode;
  elements.shopArea.before(elements.choiceList);
  elements.choiceList.classList.remove("shop-command-list");
  elements.advActionFooter.innerHTML = "";
  elements.advModal.classList.add("show");
  elements.advModal.setAttribute("aria-hidden", "false");
  elements.advScene.className = `adv-scene ${scene.scene || ""}`;
  elements.advScene.style.setProperty("--lumi-stage-scale", String(activePaperDollCharacter().stageScale || characterScaleContract.lumiStageScale));
  applyAdvSceneArt(elements.advScene, scene.sceneArt, { assetUrl: domAssetUrl });
  // issue #226：ADV 場景面板外之視口留白以該場景背景之模糊放大版鋪底（無 sceneArt 時 fallback 深色 backdrop）。
  elements.advModal.style.setProperty(
    "--adv-backdrop-image",
    scene.sceneArt?.src ? `url("${cssAssetUrl(scene.sceneArt.src)}")` : ""
  );
  // issue#150：場景角落標示——左上公主名、右上地點＋場景角色名。
  // 場景角色即公主本人（如公主房）或無對話對象時，次行留空（CSS :empty 隱藏），避免與左上公主名重複。
  elements.advTitle.textContent = hotspot.label;
  elements.advPlayerName.textContent = hub.princessName();
  elements.advNpcName.textContent = scene.npc && scene.npc !== hub.princessName() ? scene.npc : "";
  const npcClass = scene.npcClass || (scene.npcImage ? "npc-image" : "npc-none");
  elements.advNpcPortrait.className = `portrait-card adv-npc ${npcClass}`;
  elements.advNpcPortrait.style.backgroundImage = scene.npcImage ? `url("${domAssetUrl(scene.npcImage)}")` : "";
  elements.advSpeaker.textContent = scene.npc;
  elements.choiceList.innerHTML = "";
  elements.advShopGrid.innerHTML = "";
  elements.shopArea.classList.remove("show", "wardrobe-detail", "refund-detail");
  elements.advFeedback.textContent = "";
  renderPaperDolls();
  requestAnimationFrame(() => {
    elements.advModal.classList.toggle("show", session.advMode !== "closed");
    elements.advModal.setAttribute("aria-hidden", session.advMode === "closed" ? "true" : "false");
  });
}

export function openSceneAdv(hotspot) {
  if (!hotspot) return;
  // issue #164：回到第一層場景選單（自第二層返回之共同收口）時即時收束前段語音、改接當下話題；
  // 初次進場時無語音播放、為冪等 no-op，不影響隨後之歡迎詞播放。
  cutSceneVoiceOnSwitch();
  if (hotspot.kind === "room") {
    openRoomScene(hotspot);
    return;
  }
  openAdvBase(hotspot, "scene");
  hub.addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  const scene = sceneConfigFor(hotspot);
  // issue #149：歡迎詞由角色第一人稱發話，並支援中文協助（中文鈕播 travelLineZh）。
  setAdvLine(scene.travelLine || hotspot.hint, scene.travelLineZh);
  elements.advPrompt.textContent = "Choose what to do here.";
  renderFirstLayerSceneActions(hotspot);
  scheduleAdvFocus(0);
  // issue #164：同一場景每次造訪只播一次歡迎詞——首次進場播放並記旗標，造訪內返回第一層不重播（旗標於離場清空）。
  if (session.sceneVisitWelcomeId !== hotspot.id) {
    session.sceneVisitWelcomeId = hotspot.id;
    speak(elements.advLine.textContent, npcVoiceFor(hotspot), { source: "npc-scene" });
  }
}

export function openRoomScene(hotspot = hotspotById("princessRoom")) {
  openAdvBase(hotspot, "scene");
  setAdvLine(`${hub.princessName()} is in her room. What should we change today?`);
  elements.advPrompt.textContent = "Choose a room action.";
  renderFirstLayerSceneActions(hotspot);
  scheduleAdvFocus(0);
}

export function renderFirstLayerSceneActions(hotspot) {
  firstLayerActionsFor(hotspot, { hasLessons: hasLessonsForPlace(hotspot?.id), hasChat: hasChatForPlace(hotspot?.id), jobDoneThisCycle: isJobDone(session.state, hotspot?.id) }).forEach((action) => {
    addAdvOption(sceneActionLabel(action), () => handleFirstLayerSceneAction(action, hotspot), {
      leave: action.handlerKey === "leave",
      navigation: action.navigation && action.handlerKey !== "leave"
    });
  });
}

// issue #164：場景內第一↔二層切換之共同收束——進入第二層子互動或返回第一層場景選單時即時停止前段語音、
// 改接當下話題（沿用 #156 之即時 cancel() 降級：Web Speech API 無法對進行中語句音量淡出，僅 cancel() 可停）。
// 冪等：無語音播放時不動作、不記診斷；收束於當下情境 speak() 之前完成，不誤殺當下話題語音。
export function handleFirstLayerSceneAction(action, hotspot) {
  // issue #164：進入第二層子互動前先收束第一層前段語音、改接當下話題；離場（leave）由 closeAdv 以 scene-leave 收束、不在此重複。
  if (action.handlerKey !== "leave") cutSceneVoiceOnSwitch();
  switch (action.handlerKey) {
    case "wardrobe":
      openWardrobeDetail(action.category);
      return;
    case "practice":
      openPracticeAction(hotspot);
      return;
    case "chat":
      openChatAction(hotspot);
      return;
    case "shop":
      openShopDetail(hotspot);
      return;
    case "refund":
      openRefundDetail(hotspot);
      return;
    case "leave":
      leaveScene(hotspot);
      return;
    default:
      openHintAdv(hotspot);
  }
}

export function openPracticeAction(hotspot) {
  if (jobAvailableForPlace(hotspot?.id)) {
    openQuestAdv(hotspot);
    return;
  }
  // issue #177：本週期已答對此場景打工 → 已下架，提示休息後再來；否則沿用「此處無打工」提示。
  const doneThisCycle = hasLessonsForPlace(hotspot?.id) && isJobDone(session.state, hotspot?.id);
  openHintAdv(hotspot, doneThisCycle
    ? "You've already finished this place's work this playtime. Take a rest and come back!"
    : (hotspot?.hint || "There is no English practice ready here."));
}

// issue #135：生活聊天入口——以 chatLesson 開啟對話題，答對加心情並在護眼上限內延長遊玩時間（不發 coins）。
export function openChatAction(hotspot) {
  if (hasChatForPlace(hotspot?.id)) {
    openQuestAdv(hotspot, { bankKey: "chatLesson", mode: "chat" });
    return;
  }
  openHintAdv(hotspot, hotspot?.hint || "There is no chat ready here.");
}

export function leaveScene(hotspot) {
  closeAdv();
  if (hotspot?.kind === "room") openArea("castle");
}

// issue #143：自第二層答題（聊天／打工）或答題完成畫面 Back 回第一層場景選單前，先清除暫態任務狀態
// （沿用舊 closeAdv 清理語意），避免未作答即返回時 session.state.activeQuest／session.activeLesson 殘留被持久化或匯出存檔。
export function backToSceneMenu(hotspot) {
  session.state.activeQuest = null;
  session.activeLesson = null;
  hub.persist();
  openSceneAdv(hotspot);
}

export function addAdvOption(label, onClick, options = {}) {
  return advControls.addOption(label, onClick, options);
}

export function advFocusableButtons() {
  return advControls.focusableButtons();
}

export function setAdvFocus(index = 0) {
  advControls.setFocus(index);
}

export function scheduleAdvFocus(index = 0) {
  if (session.advFocusTimer) window.clearTimeout(session.advFocusTimer);
  session.advFocusTimer = window.setTimeout(() => {
    session.advFocusTimer = 0;
    setAdvFocus(index);
  }, 0);
}

export function moveAdvFocus(delta) {
  advControls.moveFocus(delta);
}

export function confirmAdvFocus() {
  return advControls.confirmFocus();
}

// issue #135：openQuestAdv 服務兩種互動——options.mode="job"（預設，題庫 lesson、答對發 coins）
// 與 mode="chat"（題庫 chatLesson、答對加心情並延長遊玩時間、不發 coins）。無 options 時行為與既往相同。
export function createChatQuest(hotspot) {
  const bank = sceneConfigs[hotspot.id]?.chatLesson || {};
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}-${hotspot.id}Chat`,
    place: hotspot.id,
    title: bank.title || "Chat",
    opening: bank.opening || "",
    openingZh: bank.openingZh || "",
    ending: bank.ending || "",
    npc: sceneConfigFor(hotspot).npc
  };
}

export function openQuestAdv(hotspot, opts = {}) {
  const bankKey = opts.bankKey || "lesson";
  const mode = opts.mode || "job";
  const lesson = pickLesson(hotspot.id, bankKey);
  if (!lesson) {
    openHintAdv(hotspot, "No English task is ready for this place yet.");
    return;
  }
  const quest = mode === "chat" ? createChatQuest(hotspot) : createQuestForPlace(hotspot.id);
  session.state.activeQuest = quest;
  session.activeLessonMode = mode;
  openAdvBase(hotspot, "quest");
  hub.addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  session.activeLesson = hub.localizeLesson(lesson);
  session.advChineseUsed = false;
  session.advWrongAttempts = 0;
  // issue #149：移除題組 opening 旁白；角色第一人稱台詞即 prompt——以 advLine 呈現、由 NPC 音色朗讀，中文鈕播 promptZh。
  setAdvLine(session.activeLesson.prompt, session.activeLesson.promptZh);
  elements.advPrompt.textContent = quest.title;
  const zhByChoice = Array.isArray(session.activeLesson.choicesZh) ? session.activeLesson.choicesZh : [];
  const allOptions = session.activeLesson.choices.map((choice, i) => ({ choice, zh: zhByChoice[i] || "" }));
  // issue #138：依互動模式裁切選項數（生活聊天＝2 輕鬆、打工任務＝4），永遠保留正解。
  const optionCount = session.activeLessonMode === "chat" ? CHAT_CHOICE_COUNT : JOB_CHOICE_COUNT;
  const options = limitChoiceOptions(allOptions, session.activeLesson.answer, optionCount);
  shuffled(options).forEach((option, index) => addChoiceRow(option.choice, option.zh, index + 1));
  // issue #143：第二層答題（聊天／打工）離開統一為 Back 回第一層場景選單，不直接跳出場景。
  addAdvOption("↩ Back", () => backToSceneMenu(hotspot), { navigation: true });
  scheduleAdvFocus(0);
  speak(session.activeLesson.prompt, npcVoiceFor(hotspot), { source: "npc-quest-prompt" });
}

// issue #138：依互動模式裁切選項數，永遠保留正解；選項數不足時原樣返回。
export function limitChoiceOptions(options, answer, count) {
  if (!Number.isInteger(count) || count <= 0 || options.length <= count) return options;
  const answerOption = options.find((option) => option.choice === answer);
  const distractors = options.filter((option) => option.choice !== answer);
  const kept = answerOption ? [answerOption, ...distractors] : distractors;
  return kept.slice(0, count);
}

// issue #73：題目（advLine）的中文撥放鈕僅在有中文時顯示。
export function updatePromptAudioButtons() {
  if (elements.speakPromptButtonZh) elements.speakPromptButtonZh.hidden = !session.activeOpeningZh;
}

// issue #149：集中設定 advLine 文字與其對應中文（中文協助鈕播此中文）；無中文者一律清空，
// 避免切換 ADV 模式（場景／商店／退款／衣櫥／提示／完成）時殘留前一畫面的中文（Codex P2）。
export function setAdvLine(text, zh = "") {
  elements.advLine.textContent = text;
  session.activeOpeningZh = zh ? (hub.withPlayerName(zh) || "") : "";
  updatePromptAudioButtons();
}

// issue #73：一列選項＝可作答的選項鈕＋英文撥放鈕＋（有中文時）中文撥放鈕。
export function addChoiceRow(choice, zh, number) {
  const row = document.createElement("div");
  row.className = "choice-row";
  const answer = document.createElement("button");
  answer.className = "choice-button";
  answer.type = "button";
  answer.textContent = number ? `${number}. ${choice}` : choice;
  answer.setAttribute("aria-label", choice);
  answer.dataset.choice = choice;
  answer.addEventListener("click", () => answerLesson(answer, choice));
  row.appendChild(answer);
  const audio = document.createElement("div");
  audio.className = "choice-audio";
  audio.appendChild(makeAudioButton("En", `Read "${choice}" in English`, () => playLessonAudio(choice, "en-US")));
  if (zh) {
    const zhBtn = makeAudioButton("中", `用中文唸「${choice}」`, () => playLessonAudio(zh, CHINESE_AUDIO_LANG));
    zhBtn.classList.add("zh");
    audio.appendChild(zhBtn);
  }
  row.appendChild(audio);
  elements.choiceList.appendChild(row);
  return answer;
}

export function makeAudioButton(label, ariaLabel, onClick) {
  const button = document.createElement("button");
  button.className = "choice-audio-button";
  button.type = "button";
  button.textContent = label;
  button.setAttribute("aria-label", ariaLabel);
  button.addEventListener("click", onClick);
  return button;
}

// issue #73 獎勵階梯（按送出次數計）：未用中文且第一次答對＝full、第二次＝half、第三次起或用過中文＝none。
export function helpRewardTier() {
  if (session.advChineseUsed) return "none";
  if (session.advWrongAttempts === 0) return "full";
  if (session.advWrongAttempts === 1) return "half";
  return "none";
}

export function openHintAdv(hotspot, line = hotspot.hint) {
  openAdvBase(hotspot, "hint");
  hub.setExpressions("thinking", "normal");
  setAdvLine(line);
  elements.advPrompt.textContent = jobAvailableForPlace(hotspot?.id)
    ? "Choose Practice to start this place's English."
    : "This place is for travel or story only.";
  elements.advFeedback.textContent = "";
  addAdvOption("↩ Back", () => openSceneAdv(hotspot), { navigation: true });
  scheduleAdvFocus(0);
}

export function showRewardBurst(text) {
  clearRewardBursts();
  const burst = document.createElement("div");
  burst.className = "reward-burst";
  burst.textContent = text;
  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 1400);
}

export function clearRewardBursts() {
  document.querySelectorAll(".reward-burst").forEach((item) => item.remove());
}

// issue #96：題庫改為「場景自帶、進場才取」——直接讀該場景物件的 lesson.questions，
// 不再過濾全域 lessons 註冊表。回傳帶 place，並由地區常數導出 lessonId 與 vocabProfile，
// 供 completedLessons 進度、徽章與日誌沿用（id 格式同重構前 `${area}-${place}-NN`）。
// issue #135：bankKey 讓同一取題機制服務「打工(lesson)」與「生活聊天(chatLesson)」兩種題庫；預設 "lesson" 維持相容。
export function pickLesson(place, bankKey = "lesson") {
  const lesson = sceneConfigs[place]?.[bankKey];
  const questions = lesson?.questions;
  if (!Array.isArray(questions) || !questions.length) return null;
  const index = Math.floor(Math.random() * questions.length);
  const idPrefix = bankKey === "chatLesson" ? `${lesson.area}-${place}-chat` : `${lesson.area}-${place}`;
  return {
    ...questions[index],
    place,
    id: `${idPrefix}-${String(index + 1).padStart(2, "0")}`,
    vocabProfile: lesson.vocabProfile
  };
}

export function hasLessonsForPlace(place) {
  return Boolean(place && sceneConfigs[place]?.lesson?.questions?.length);
}

// issue #177：場景打工於「本遊玩週期尚未答對」時才視為可作答（答對後下架、下一週期重置）；
// 供場景選單、地圖目的地卡與提示文案一致判斷「是否仍提供此打工」。
export function jobAvailableForPlace(place) {
  return hasLessonsForPlace(place) && !isJobDone(session.state, place);
}

export function hasChatForPlace(place) {
  return Boolean(place && sceneConfigs[place]?.chatLesson?.questions?.length);
}

export function answerLesson(button, choice) {
  if (!session.activeLesson || session.advMode !== "quest") return;
  const correct = choice === session.activeLesson.answer;
  recordCycleAnswer(session.state, correct); // 本回合答題統計（spec#9 結算用）：每次嘗試計入，答對另計。
  if (!correct) {
    session.advWrongAttempts += 1;
    button.classList.add("wrong");
    button.disabled = true;
    hub.setExpressions("thinking", "surprised");
    elements.advFeedback.textContent = "Try again.";
    playTone("wrong");
    speak(choice, playerVoiceProfile(), { source: "princess-answer-wrong" }); // issue #93：公主以其音色朗讀玩家所選選項
    return;
  }

  const quest = session.state.activeQuest || createQuestForPlace(session.activeLesson.place);
  const completedHotspot = hotspotById(session.activeLesson.place);
  // issue #135：獎勵分流——生活聊天(chat) 加心情並在護眼上限內延長遊玩時間、不發 coins；打工(job) 沿用既有 coins 獎勵階梯。
  const isChat = session.activeLessonMode === "chat";
  let coins = 0;
  let burstText;
  let feedbackText;
  let diaryType = "quest";
  if (isChat) {
    session.state.mood = (Number(session.state.mood) || 0) + CHAT_MOOD_REWARD;
    // issue #165：聊天延長遊玩時間仍生效（其延長量改由 HUD Play time 欄位呈現，sysCase#7.5），
    // 完成回饋僅顯示心情加值、不再帶 "Nice chat!" 招呼語與遊玩時間提示。
    extendSession(session.state, hub.clockNow(), CHAT_MOOD_REWARD * MOOD_MINUTES_PER_POINT);
    burstText = `+${CHAT_MOOD_REWARD} mood`;
    feedbackText = `+${CHAT_MOOD_REWARD} mood`;
    diaryType = "chat";
    playTone("correct");
  } else {
    const baseCoins = session.activeLesson.reward.coins || 0;
    const rewardTier = helpRewardTier();   // issue #73 獎勵階梯：full／half／none
    coins = rewardTier === "full"
      ? baseCoins
      : rewardTier === "half"
        ? Math.round(baseCoins * REWARD_SECOND_TRY_RATIO)
        : 0;
    hub.applyEffects({ coins });
    playTone("correct");
    burstText = coins > 0 ? `+${coins} coins` : "No coins this time";
    feedbackText = coins > 0
      ? (rewardTier === "half" ? `${effectText({ coins })}. Half coins for the second try.` : `${effectText({ coins })}.`)
      : session.advChineseUsed
        ? "Nice learning with Chinese help! No coins this time."
        : "No coins this time — try to answer sooner next time.";
    // issue #177：打工答對 → 標記本場景打工於本遊玩週期已完成（下架，不可再作答），下一週期重置；
    // 僅打工計入（在此 job 分支內），聊天不計（spec#11 反洗 coins）。
    // issue #205：改以「本次實得 coins（>0）」為下架條件——答對但 0 coins（中文協助／第三次以上 none 階）
    // 不下架、本週期仍可在該場景再作答賺取 coins；full／half（coins>0）一如既往下架。
    if (coins > 0) markJobDone(session.state, session.activeLesson.place);
  }
  hub.addUnique("completedLessons", [session.activeLesson.id]);
  hub.addUnique("learnedWords", session.activeLesson.words);
  hub.addUnique("metNpcs", [sceneConfigFor(completedHotspot).npc]);
  hub.updateProgressBadges();
  hub.setExpressions("happy", "happy");
  button.classList.add("correct");
  showRewardBurst(burstText);
  elements.choiceList.querySelectorAll("button").forEach((item) => {
    item.disabled = true;
    if (item.dataset.choice === session.activeLesson.answer) item.classList.add("correct");
  });
  hub.addDiary({
    type: diaryType,
    title: `${quest.title} at ${completedHotspot.label}`,
    body: `Sentence: "${session.activeLesson.answer}"`,
    result: feedbackText,
    lessonId: session.activeLesson.id,
    words: session.activeLesson.words,
    vocabProfile: session.activeLesson.vocabProfile
  });
  // issue #149：完成時由角色說一句自然收尾（聊天=道別、打工=稱讚＋道謝），隨機選一句並附中文（NPC 音色朗讀）。
  const closing = pickEnding(isChat);
  setAdvLine(quest.ending || closing.en, quest.ending ? "" : closing.zh);
  // issue #143：完成後一律 Back 回第一層場景選單，提示文案對齊（不再分商店／非商店或提示 room／leave）。
  elements.advPrompt.textContent = "Go back to choose what to do next here.";
  elements.advFeedback.textContent = feedbackText;
  session.state.activeQuest = null;
  session.activeLesson = null;
  session.activeLessonMode = "job";
  session.advMode = "complete";
  elements.advScene.dataset.mode = "complete";
  elements.choiceList.innerHTML = "";
  elements.advActionFooter.innerHTML = "";
  // issue #143：答題完成統一 Back 回第一層場景選單；自第一層可續選 Shop／再聊／Work，於第一層 Leave 才退出場景。
  // 移除 #100/#138 完成畫面條件式「🎁 Shop」與「🏰 Back to Room」捷徑——兩層導覽一致後不再需要。
  addAdvOption("↩ Back", () => backToSceneMenu(completedHotspot), { navigation: true });
  elements.statusMessage.textContent = `Practice complete at ${completedHotspot.label}.`;
  hub.persist();
  hub.render();
  scheduleAdvFocus(0);
  // issue #93：公主以其音色朗讀所選正解，結束後再由 NPC 以其音色說結語。
  const endingLine = elements.advLine.textContent;
  speak(choice, playerVoiceProfile(), { source: "princess-answer-correct", then: () => speak(endingLine, npcVoiceFor(completedHotspot), { source: "npc-quest-ending" }) });
}

export function closeAdv() {
  // issue #156：離開場景（關閉場景對話、切換場景或返回地圖之共同收口）即時收束正在播放之語音，
  // 避免語音殘留跨場景。Web Speech API 無法對進行中語句音量淡出（utterance.volume 於 speak() 固定、
  // 僅 cancel() 可停），故以即時 stop() 作為「約 1 秒淡出」目標聽感之明確降級。
  if (speechManager.isSpeaking()) speechManager.stop("scene-leave");
  // issue #164：離場結束本次造訪——清空歡迎詞旗標，使下次進入該場景重新播放一次歡迎詞。
  session.sceneVisitWelcomeId = "";
  elements.advModal.classList.remove("show");
  elements.advModal.setAttribute("aria-hidden", "true");
  session.advMode = "closed";
  elements.advScene.dataset.mode = "closed";
  elements.advScene.classList.remove("adv-closet"); // issue #244：清除衣櫃 closet 標記
  session.state.activeQuest = null;
  session.activeLesson = null;
  session.activeShopHotspot = null;
  clearTryOnPreview({ renderDoll: false });
  hub.setExpressions("normal", "normal");
  renderPaperDolls();
  hub.persist();
  const focusTarget = hub.activeViewName() === "home" ? elements.castleStage : hub.activeViewName() === "world" ? elements.worldStage : elements.mapStage;
  focusTarget?.focus({ preventScroll: true });
}

export function shuffled(items) {
  return [...items].sort(() => Math.random() - 0.5);
}
