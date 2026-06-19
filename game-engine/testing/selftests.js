export function installTestingHooks(api) {
  window.LuminaraTest = {
    exportMarkdown: api.buildSaveMarkdown,
    importMarkdown: api.loadMarkdownText,
    getState: () => JSON.parse(JSON.stringify(api.state)),
    accounts: api.accounts,
    playClock: api.playClock,
    setDifficulty: () => {
      api.persist();
      api.render();
    },
    moveToNode: (nodeId) => {
      const area = Object.values(api.areaRegistry).find((candidate) => candidate.nodes?.[nodeId]);
      if (!area) throw new Error("Unknown node");
      const node = area.nodes[nodeId];
      api.state.area = area.id;
      api.state.playerNode = nodeId;
      api.state.player = { x: node.x, y: node.y };
      api.persist();
      api.changeView(area.view || "map");
    },
    openArea: api.openArea,
    openRoomScene: () => api.openRoomScene(api.hotspotById("princessRoom")),
    openShopScene: (place = "boutique") => api.openSceneAdv(api.hotspotById(place)),
    openShopDetail: (place = "boutique") => api.openShopDetail(api.hotspotById(place)),
    openRefundDetail: (place = "boutique") => api.openRefundDetail(api.hotspotById(place)),
    openWardrobeDetail: api.openWardrobeDetail,
    interact: api.interactNearby,
    answerCurrent: (choice) => {
      const button = [...api.elements.choiceList.querySelectorAll("button")].find((item) => item.dataset.choice === choice);
      if (!button) throw new Error("Choice not found");
      api.answerLesson(button, choice);
    },
    closeAdv: api.closeAdv,
    openQuest: (place = "kingHall") => api.openQuestAdv(api.hotspotById(place)),
    openChat: (place = "kingHall") => api.openQuestAdv(api.hotspotById(place), { bankKey: "chatLesson", mode: "chat" }),
    buy: (itemId) => api.buyItemInAdv(api.itemById(itemId)),
    refund: (itemId) => api.refundItemInAdv(api.itemById(itemId)),
    focusCastle: api.focusCastle,
    focusUrban: api.focusUrban,
    focusRural: api.focusRural,
    focusWild: api.focusWild,
    focusWorld: api.focusWorld,
    openWorldMap: api.openWorldMap
  };

  runSaveLoadSelfTest(api);
  runDataAudit(api);
  runVisualQa(api);
  runMonkeyTest(api);
  runAccountSelfTest(api);
  runPlayTimerSelfTest(api);
  runMoodExtendSelfTest(api);
  runChatSelfTest(api);
  runJobCycleSelfTest(api);
  runSceneNavSelfTest(api);
  runProfileColorSelfTest(api);
  runChineseRewardSelfTest(api);
  runCharacterVoiceSelfTest(api);
  runMapAvatarSelfTest(api);
  runAboutSelfTest(api);
}

// issue #99：跨地圖公主頭像一致顯示（intTest#26）＋世界地圖走到再進入與途中略過（intTest#27）。
function runMapAvatarSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "map-avatar") return;
  const errors = [];
  const positioned = (el, label) => {
    if (!el) { errors.push(`${label} token 不存在`); return; }
    const left = parseFloat(el.style.left);
    const top = parseFloat(el.style.top);
    if (!Number.isFinite(left) || !Number.isFinite(top)) errors.push(`${label} token 未定位（left/top 未設）`);
  };

  // issue #166：可逛店（有 shopCategories）地點之地圖 marker 須帶 shop class（呈方形）；
  // 守住 renderHotspots（區域）／renderCastleMap（城堡）兩 renderer 對商店 marker 的一致性。
  const isShopLoc = (hotspot) => Array.isArray(hotspot?.shopCategories) && hotspot.shopCategories.length > 0;
  const checkShopMarkers = (areaId, layerId) => {
    const layer = document.getElementById(layerId);
    if (!layer) { errors.push(`${areaId} marker layer (#${layerId}) 不存在`); return; }
    (api.areaRegistry[areaId]?.locations || []).filter(isShopLoc).forEach((hotspot) => {
      const marker = layer.querySelector(`.map-marker.hotspot[data-hotspot-id="${hotspot.id}"]`);
      if (!marker) { errors.push(`${areaId}/${hotspot.id} 商店 marker 未渲染`); return; }
      if (!marker.classList.contains("shop")) errors.push(`${areaId}/${hotspot.id} 商店 marker 缺 shop class`);
    });
  };

  // intTest#26：跨地圖公主頭像一致顯示（world / castle / urban / rural / wild）
  api.openWorldMap();
  api.renderWorldMap();
  positioned(api.elements.worldPlayerToken, "world");

  api.openArea("castle");
  api.renderCastleMap();
  positioned(api.elements.castlePlayerToken, "castle");
  checkShopMarkers("castle", "castleMarkerLayer");

  for (const areaId of ["urban", "rural", "wild"]) {
    api.openArea(areaId);
    api.renderMap();
    positioned(api.elements.playerToken, areaId);
    checkShopMarkers(areaId, "hotspotLayer");
  }

  // intTest#26（issue #161）：地圖公主 token 放大（≈108×140，較原 54×70 加倍）且已移除識別色背板（.map-doll::before）。
  api.openWorldMap();
  api.renderWorldMap();
  const worldDoll = api.elements.worldPlayerToken?.querySelector(".map-doll");
  if (!worldDoll) {
    errors.push("world token 缺少 .map-doll");
  } else {
    const dollWidth = parseFloat(getComputedStyle(worldDoll).width);
    if (!(dollWidth >= 100)) errors.push(`map-doll 寬度 ${dollWidth}px，預期放大後 ≈108px（較原 54px 加倍）`);
    const beforeContent = getComputedStyle(worldDoll, "::before").content;
    if (beforeContent && beforeContent !== "none") errors.push(`map-doll::before 仍渲染（content=${beforeContent}）；#161 應移除識別色背板`);
  }

  // intTest#27（自由走動）：世界地圖鍵盤走動改變 world 座標
  api.openWorldMap();
  api.renderWorldMap();
  const before = { ...api.currentPlayerPoint("world") };
  api.moveOnWorldMap(1, 0);
  const after = api.currentPlayerPoint("world");
  if (!(Math.abs(after.x - before.x) > 0.001)) errors.push("鍵盤走動未改變 world 座標");

  // intTest#27（走到再進入）：點選目的地後不立即進入，到達（finishWorldTravel）後才進入
  api.openWorldMap();
  api.renderWorldMap();
  api.requestWorldTravel("urban");
  if (api.state.area === "urban") errors.push("走到再進入：點選後未走動即進入");
  api.finishWorldTravel();
  if (api.state.area !== "urban") errors.push("走到再進入：到達後未進入 urban");

  // intTest#27（途中略過）：移動途中再次點選即立即進入
  api.openWorldMap();
  api.renderWorldMap();
  api.requestWorldTravel("rural");
  api.requestWorldTravel("rural");
  if (api.state.area !== "rural") errors.push("途中略過：再次點選未立即進入 rural");

  const passed = errors.length === 0;
  const result = document.createElement("pre");
  result.id = "mapAvatarResult";
  result.textContent = JSON.stringify({ test: "map-avatar", passed, errors });
  document.body.prepend(result);
}

// issue #110：About 頁籤呈現版權宣告與版本沿革，版本卡併入 About（intTest#28）。
function runAboutSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "about") return;
  const errors = [];
  api.render();
  api.openSystemMenu("about");

  const aboutView = document.getElementById("aboutView");
  if (!aboutView || !aboutView.classList.contains("active")) errors.push("About 頁籤未啟用");

  const copyright = (api.elements.aboutCopyright?.textContent || "").trim();
  if (!copyright.includes("copyright reserved")) errors.push(`版權宣告缺漏或不符：「${copyright}」`);

  const items = api.elements.aboutVersionList?.querySelectorAll(".about-version-item") || [];
  if (items.length < 10) errors.push(`版本沿革少於 10 筆（實得 ${items.length}）`);

  // 首筆版本須與當前版本顯示一致（單一資料源、避免雙軌）
  const currentVersion = (api.elements.versionValue?.textContent || "").trim();
  const firstVersion = (items[0]?.querySelector("strong")?.textContent || "").trim();
  if (!currentVersion) errors.push("當前版本顯示為空");
  if (firstVersion !== currentVersion) errors.push(`首筆版本（${firstVersion}）與當前版本（${currentVersion}）不一致`);

  // 版本卡已併入 About：Settings 不得殘留、About 須具備
  const settingsView = document.getElementById("settingsView");
  if (settingsView?.querySelector(".version-card")) errors.push("Settings 仍殘留版本卡（應併入 About）");
  if (!aboutView?.querySelector(".version-card")) errors.push("About 缺少版本卡");

  // issue #134 後續：Settings 不得殘留「Switch player」按鈕；按「Change princess」須先關閉系統選單再開選角。
  if (settingsView?.querySelector("#switchAccountButton")) errors.push("Settings 仍殘留 Switch player 按鈕（應移除）");
  if (!api.accounts?.activeId?.()) api.accounts?.create?.();
  api.openSystemMenu("settings");
  api.openCharacterSelect({ forced: false });
  if (document.getElementById("systemMenu")?.classList.contains("show")) errors.push("開啟選角後系統選單未關閉（殘留於背景）");
  if (!api.elements.characterSelect?.classList.contains("show")) errors.push("Change princess 未開啟選角畫面");

  const passed = errors.length === 0;
  const result = document.createElement("pre");
  result.id = "aboutResult";
  result.textContent = JSON.stringify({ test: "about", passed, errors });
  document.body.prepend(result);
}

// 遊玩時間限制與護眼休息（issue #6 / spec#9）：以注入時鐘驗證計時遞減、時間到結算、休息鎖定與屆滿續玩。
function runPlayTimerSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "playtimer") return;
  const errors = [];
  const clock = api.playClock;
  const accounts = api.accounts;
  let createdId = null;
  try {
    if (!clock) throw new Error("playClock testing hook missing");
    const baseline = accounts.list().length;
    createdId = accounts.create().id;
    if (clock.limit.playMinutes !== 15 || clock.limit.restMinutes !== 15) {
      errors.push(`default play/rest = ${clock.limit.playMinutes}/${clock.limit.restMinutes}, expected 15/15`);
    }
    clock.setOffset(0);
    clock.setDurations(2, 1); // 2 分鐘遊玩、1 分鐘休息（以注入時鐘加速，不需真實等待）
    api.state.coins = 100;

    // 1) 從 idle 起拍：開始遊玩回合，energy ~100%。
    let ev = clock.tick();
    if (ev.phase !== "play" || !ev.justStarted) errors.push(`first tick phase=${ev.phase} justStarted=${ev.justStarted}, expected play/started`);
    if (ev.energyPercent < 99) errors.push(`energy at start = ${ev.energyPercent}, expected ~100`);

    // 2) 遊玩中模擬答題（4 題 3 對）與獲得金錢（+40）。
    clock.recordAnswer(true);
    clock.recordAnswer(true);
    clock.recordAnswer(true);
    clock.recordAnswer(false);
    api.state.coins = 140;

    // 3) 過一半遊玩時間：energy 應約 50%。
    clock.advance(60000);
    let status = clock.status();
    if (status.phase !== "play") errors.push(`mid phase=${status.phase}, expected play`);
    if (Math.abs(status.energyPercent - 50) > 5) errors.push(`mid energy = ${status.energyPercent}, expected ~50`);

    // 4) 時間到：結算本回合成果並進入休息（遊玩入口鎖定）。
    clock.advance(61000);
    ev = clock.tick();
    if (ev.phase !== "rest" || !ev.justExpired) errors.push(`expiry phase=${ev.phase} justExpired=${ev.justExpired}, expected rest/expired`);
    const s = ev.settlement || {};
    if (s.coinsGained !== 40) errors.push(`settlement coinsGained=${s.coinsGained}, expected 40`);
    if (s.answered !== 4) errors.push(`settlement answered=${s.answered}, expected 4`);
    if (s.correct !== 3) errors.push(`settlement correct=${s.correct}, expected 3`);
    if (s.accuracy !== 75) errors.push(`settlement accuracy=${s.accuracy}, expected 75`);
    if (ev.energyPercent !== 0) errors.push(`energy during rest = ${ev.energyPercent}, expected 0`);

    // 5) 休息未滿不可續玩（護眼不可繞過）。
    if (clock.resume() !== false) errors.push("resume succeeded before rest finished (eye-rest bypassed)");

    // 6) 休息屆滿可續玩，且開始全新回合（cycle 歸零）。
    clock.advance(61000);
    status = clock.status();
    if (!status.restDone) errors.push("rest not marked done after rest duration elapsed");
    if (clock.resume() !== true) errors.push("resume failed after rest finished");
    status = clock.status();
    if (status.phase !== "play") errors.push(`after resume phase=${status.phase}, expected play`);
    if (clock.limit.cycle.answered !== 0) errors.push(`new cycle answered=${clock.limit.cycle.answered}, expected 0`);

    // 7) issue #169：遊玩時間用完但尚未進入休息（restEndsAt 仍 0，如於帳號選單離開、ticker 未跑）時，
    //    帳號卡（playStatus）須與點擊選取（tick）一致、不再誤顯示「Play 0:00」；休息自遊玩結束起算、離開時間計入。
    clock.setDurations(15, 15);
    const t0 = clock.now();
    // (A) 離開未達休息時長（1 分鐘前用完，restMinutes=15）→ 卡片顯示休息、選取結算並進入休息。
    clock.limit.sessionEndsAt = t0 - 60000;
    clock.limit.sessionMaxEndsAt = t0 - 60000;
    clock.limit.restEndsAt = 0;
    let card = clock.status();
    if (card.phase !== "rest") errors.push(`#169(A) expired-within-window card phase=${card.phase}, expected rest (not "Play 0:00")`);
    let pick = clock.tick();
    if (pick.phase !== "rest" || !pick.justExpired) errors.push(`#169(A) select-within-window phase=${pick.phase} justExpired=${pick.justExpired}, expected rest/justExpired`);
    // (B) 離開已達休息時長（16 分鐘前用完 > 15 分鐘休息）→ 卡片顯示可玩(idle)、選取直接續玩、不強制再等。
    clock.limit.sessionEndsAt = t0 - 16 * 60000;
    clock.limit.sessionMaxEndsAt = t0 - 16 * 60000;
    clock.limit.restEndsAt = 0;
    card = clock.status();
    if (card.phase !== "idle") errors.push(`#169(B) rested-away card phase=${card.phase}, expected idle (Ready)`);
    pick = clock.tick();
    if (pick.phase !== "play" || !pick.justStarted) errors.push(`#169(B) select-after-rested phase=${pick.phase} justStarted=${pick.justStarted}, expected play/justStarted (no forced wait)`);

    // 清理：移除測試帳號，回到 baseline。
    accounts.remove(createdId);
    createdId = null;
    if (accounts.list().length !== baseline) errors.push(`account count after cleanup = ${accounts.list().length}, expected ${baseline}`);
  } catch (error) {
    errors.push(error.message);
  } finally {
    if (createdId) accounts.remove(createdId);
    clock?.setOffset(0);
  }
  const result = document.createElement("pre");
  result.id = "playTimerTestResult";
  result.textContent = JSON.stringify({
    test: "playtimer",
    passed: errors.length === 0,
    errors: errors.slice(0, 10)
  });
  document.body.prepend(result);
}

// issue #135 / spec#11：驗證「生活聊天答對 → 在護眼上限內延長當次可玩時間」(extendSession)。
// 以注入時鐘驗證：基礎護眼上限預設、延長累加、達上限後夾住、休息中不可延長。
function runMoodExtendSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "mood-extend") return;
  const errors = [];
  const clock = api.playClock;
  const accounts = api.accounts;
  let createdId = null;
  const MIN = 60000;
  try {
    if (!clock) throw new Error("playClock testing hook missing");
    if (typeof clock.extend !== "function") throw new Error("playClock.extend hook missing");
    const baseline = accounts.list().length;
    createdId = accounts.create().id;

    // 1) 護眼上限預設為 20 分鐘（spec#11 paramPlayMaxMinutes）。
    if (clock.limit.playMaxMinutes !== 20) errors.push(`default playMaxMinutes=${clock.limit.playMaxMinutes}, expected 20`);

    // 設定：基礎遊玩 2 分鐘、休息 1 分鐘、護眼上限 4 分鐘（可延長 2 分鐘）。
    clock.setOffset(0);
    clock.setDurations(2, 1);
    clock.limit.playMaxMinutes = 4;

    // 2) 起拍開始回合：sessionEndsAt=+2min、sessionMaxEndsAt=+4min。
    let ev = clock.tick();
    if (ev.phase !== "play" || !ev.justStarted) errors.push(`first tick phase=${ev.phase} justStarted=${ev.justStarted}, expected play/started`);
    const baseEnd = clock.limit.sessionEndsAt;
    const capEnd = clock.limit.sessionMaxEndsAt;
    if (Math.abs((capEnd - baseEnd) - 2 * MIN) > 5) errors.push(`cap-base gap = ${capEnd - baseEnd}ms, expected ${2 * MIN}`);

    // 3) 聊天答對延長 1 分鐘：實際延長 1 分鐘。
    const a1 = clock.extend(1);
    if (Math.abs(a1 - MIN) > 5) errors.push(`extend(1) added=${a1}ms, expected ${MIN}`);

    // 4) 再延長 5 分鐘：夾在護眼上限，只加到 cap（再 +1 分鐘），且 sessionEndsAt==sessionMaxEndsAt。
    const a2 = clock.extend(5);
    if (Math.abs(a2 - MIN) > 5) errors.push(`extend(5) added=${a2}ms, expected clamp to ${MIN}`);
    if (clock.limit.sessionEndsAt !== clock.limit.sessionMaxEndsAt) errors.push("sessionEndsAt not clamped to sessionMaxEndsAt at cap");

    // 5) 已達上限：再延長為 0（護眼不可被突破）。
    const a3 = clock.extend(5);
    if (a3 !== 0) errors.push(`extend at cap added=${a3}, expected 0 (eye-rest cap not bypassed)`);

    // 6) 進入休息後不可延長（phase!=play）。休息自遊玩結束（cap=+4min）起算、窗寬=restMinutes(1min)，
    //    故快轉至休息窗內（+4.5min）而非剛好邊界（+5min＝休息已足，issue #169）。
    clock.advance(4 * MIN + 30 * 1000);
    ev = clock.tick();
    if (ev.phase !== "rest") errors.push(`after advance phase=${ev.phase}, expected rest`);
    const a4 = clock.extend(1);
    if (a4 !== 0) errors.push(`extend during rest added=${a4}, expected 0`);

    accounts.remove(createdId);
    createdId = null;
    if (accounts.list().length !== baseline) errors.push(`account count after cleanup = ${accounts.list().length}, expected ${baseline}`);
  } catch (error) {
    errors.push(error.message);
  } finally {
    if (createdId) accounts.remove(createdId);
    clock?.setOffset(0);
  }
  const result = document.createElement("pre");
  result.id = "moodExtendTestResult";
  result.textContent = JSON.stringify({
    test: "mood-extend",
    passed: errors.length === 0,
    errors: errors.slice(0, 10)
  });
  document.body.prepend(result);
}

// issue #135 / spec#11：端對端驗證場景互動分流——生活聊天答對 → +心情、護眼上限內延長時間、不發 coins；
// 打工答對 → 發 coins、不加心情。使用 castle kingHall（已備 chatLesson 與 lesson）。
function runChatSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "chat") return;
  const errors = [];
  const clock = api.playClock;
  const accounts = api.accounts;
  let createdId = null;
  const answerActive = () => {
    const lesson = api.getActiveLesson();
    if (!lesson) throw new Error("no active lesson after open");
    const btn = [...api.elements.choiceList.querySelectorAll("button")].find((b) => b.dataset.choice === lesson.answer);
    if (!btn) throw new Error("correct choice button not found");
    api.answerLesson(btn, lesson.answer);
  };
  try {
    if (!clock || typeof api.openQuestAdv !== "function") throw new Error("test hooks (playClock/openQuestAdv) missing");
    const openChat = (place) => api.openQuestAdv(api.hotspotById(place), { bankKey: "chatLesson", mode: "chat" });
    const openJob = (place) => api.openQuestAdv(api.hotspotById(place));
    const baseline = accounts.list().length;
    createdId = accounts.create().id;
    clock.setOffset(0);
    clock.setDurations(2, 1);
    clock.tick(); // 由 idle 起拍開始遊玩回合（之後 extendSession 才有作用）
    api.state.coins = 100;
    api.state.mood = 0;

    // 1) 生活聊天答對：+1 心情、延長約 1 分鐘、coins 不變。
    const coins0 = api.state.coins;
    const end0 = api.state.playLimit.sessionEndsAt;
    openChat("kingHall");
    if (!api.getActiveLesson()) errors.push("chat did not open at kingHall (chatLesson missing?)");
    answerActive();
    if (api.state.mood !== 1) errors.push(`mood after chat = ${api.state.mood}, expected 1`);
    if (api.state.coins !== coins0) errors.push(`coins after chat = ${api.state.coins}, expected unchanged ${coins0}`);
    const added = api.state.playLimit.sessionEndsAt - end0;
    if (Math.abs(added - 60000) > 1500) errors.push(`session extended by ${added}ms, expected ~60000`);

    // 2) 打工答對：發 coins（>原值）、心情不變。
    const coinsBeforeJob = api.state.coins;
    const moodBeforeJob = api.state.mood;
    openJob("kingHall");
    answerActive();
    if (api.state.coins <= coinsBeforeJob) errors.push(`coins after job = ${api.state.coins}, expected > ${coinsBeforeJob}`);
    if (api.state.mood !== moodBeforeJob) errors.push(`mood after job = ${api.state.mood}, expected unchanged ${moodBeforeJob}`);

    api.closeAdv();
    accounts.remove(createdId);
    createdId = null;
    if (accounts.list().length !== baseline) errors.push(`account count after cleanup = ${accounts.list().length}, expected ${baseline}`);
  } catch (error) {
    errors.push(error.message);
  } finally {
    if (createdId) accounts.remove(createdId);
    clock?.setOffset(0);
  }
  const result = document.createElement("pre");
  result.id = "chatTestResult";
  result.textContent = JSON.stringify({
    test: "chat",
    passed: errors.length === 0,
    errors: errors.slice(0, 10)
  });
  document.body.prepend(result);
}

// issue #177（spec#11 反洗 coins）：驗證「每場景打工每遊玩週期限答對一次」——打工答對後該場景打工於本週期
// 下架（firstLayerActionKeys 不再含 "practice"、isJobDone 真）；聊天答對不計入、不下架打工（D6）；跨週期
// （休息後續玩）重置可再作答（D4）；舊存檔（無 jobsDone／雜質）正規化為安全字串陣列（D5）。以 castle kingHall 跑。
function runJobCycleSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "job-cycle") return;
  const errors = [];
  const clock = api.playClock;
  const accounts = api.accounts;
  let createdId = null;
  const MIN = 60000;
  const keys = (place) => api.firstLayerActionKeys(place);
  const jobsDone = () => api.state.playLimit.cycle.jobsDone;
  const answerActive = () => {
    const lesson = api.getActiveLesson();
    if (!lesson) throw new Error("no active lesson after open");
    const btn = [...api.elements.choiceList.querySelectorAll("button")].find((b) => b.dataset.choice === lesson.answer);
    if (!btn) throw new Error("correct choice button not found");
    api.answerLesson(btn, lesson.answer);
  };
  const openChat = (place) => api.openQuestAdv(api.hotspotById(place), { bankKey: "chatLesson", mode: "chat" });
  const openJob = (place) => api.openQuestAdv(api.hotspotById(place));
  try {
    if (!clock || typeof api.firstLayerActionKeys !== "function") throw new Error("test hooks (playClock/firstLayerActionKeys) missing");
    const baseline = accounts.list().length;
    createdId = accounts.create().id;
    clock.setOffset(0);
    clock.setDurations(2, 1);
    clock.tick(); // idle → play：開新遊玩週期（cycle.jobsDone 空）
    api.state.coins = 100;
    api.state.mood = 0;

    // 0) 起始：jobsDone 空、kingHall 提供 practice 與 chat、isJobDone 假。
    if (jobsDone().length !== 0) errors.push(`start jobsDone=${JSON.stringify(jobsDone())}, expected []`);
    if (!keys("kingHall").includes("practice")) errors.push("start: practice action missing at kingHall");
    if (clock.isJobDone("kingHall")) errors.push("start: isJobDone(kingHall) true, expected false");

    // 1) 聊天答對：不計入 jobsDone、不下架打工（D6）。
    openChat("kingHall");
    answerActive();
    if (clock.isJobDone("kingHall")) errors.push("after chat: isJobDone(kingHall) true (chat must not mark job done)");
    if (jobsDone().includes("kingHall")) errors.push("after chat: kingHall in jobsDone (chat must not count)");
    if (!keys("kingHall").includes("practice")) errors.push("after chat: practice missing (chat must not 下架 job)");

    // 2) 打工答對：發 coins、jobsDone 含 kingHall、isJobDone 真、practice 下架、chat 仍在。
    const coinsBefore = api.state.coins;
    openJob("kingHall");
    answerActive();
    if (api.state.coins <= coinsBefore) errors.push(`after job: coins=${api.state.coins}, expected > ${coinsBefore}`);
    if (!clock.isJobDone("kingHall")) errors.push("after job: isJobDone(kingHall) false, expected true");
    if (!jobsDone().includes("kingHall")) errors.push("after job: kingHall not in jobsDone");
    if (keys("kingHall").includes("practice")) errors.push("after job: practice still offered (job not 下架 within cycle)");
    if (!keys("kingHall").includes("chat")) errors.push("after job: chat action missing (chat must remain)");

    // 3) 跨週期（休息後續玩）重置：jobsDone 空、isJobDone 假、practice 復原（D4）。
    // 快轉到「剛過本回合 sessionEndsAt」（聊天已延長過 session，故依實際 sessionEndsAt 推進、不用固定值），
    // 落在休息窗內 → tick 結算並進入休息。
    clock.advance(Math.max(0, clock.limit.sessionEndsAt - clock.now() + 1000));
    let ev = clock.tick();           // → 結算並進入休息
    if (ev.phase !== "rest") errors.push(`expiry phase=${ev.phase}, expected rest`);
    clock.advance(1 * MIN + 1000);   // 休息（1 分鐘）屆滿
    if (clock.resume() !== true) errors.push("resume failed after rest finished");
    if (jobsDone().length !== 0) errors.push(`new cycle jobsDone=${JSON.stringify(jobsDone())}, expected []`);
    if (clock.isJobDone("kingHall")) errors.push("new cycle: isJobDone(kingHall) true, expected reset");
    if (!keys("kingHall").includes("practice")) errors.push("new cycle: practice not restored after reset");

    // 4) 正規化舊存檔（無 jobsDone／雜質）→ 安全空陣列、僅留字串 id（D5）。
    const n1 = clock.normalizeLimit({ cycle: { answered: 2, correct: 1 } });
    if (!Array.isArray(n1.cycle.jobsDone) || n1.cycle.jobsDone.length !== 0) errors.push(`normalize missing jobsDone → ${JSON.stringify(n1.cycle.jobsDone)}, expected []`);
    const n2 = clock.normalizeLimit({ cycle: { jobsDone: ["boutique", 3, null, "kingHall"] } });
    if (JSON.stringify(n2.cycle.jobsDone) !== JSON.stringify(["boutique", "kingHall"])) errors.push(`normalize jobsDone filter → ${JSON.stringify(n2.cycle.jobsDone)}, expected ["boutique","kingHall"]`);

    api.closeAdv();
    accounts.remove(createdId);
    createdId = null;
    if (accounts.list().length !== baseline) errors.push(`account count after cleanup = ${accounts.list().length}, expected ${baseline}`);
  } catch (error) {
    errors.push(error.message);
  } finally {
    if (createdId) accounts.remove(createdId);
    clock?.setOffset(0);
  }
  const result = document.createElement("pre");
  result.id = "jobCycleTestResult";
  result.textContent = JSON.stringify({
    test: "job-cycle",
    passed: errors.length === 0,
    errors: errors.slice(0, 10)
  });
  document.body.prepend(result);
}

// issue #143（intTest#43）：場景互動兩層導覽一致性——第二層各互動（聊天/打工答題、答題完成、逛店）之返回都回到第一層
// 場景選單且冒險視窗維持開啟，僅第一層場景選單之離開關閉冒險視窗回地圖。以 castleSeamstress（shop+chat）跑全動線。
function runSceneNavSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "scene-nav") return;
  const errors = [];
  const clock = api.playClock;
  const accounts = api.accounts;
  const place = "castleSeamstress";
  let createdId = null;
  const footerBtn = (text) => [...api.elements.advActionFooter.querySelectorAll("button")]
    .find((b) => b.textContent.includes(text));
  const choiceBtn = (text) => [...api.elements.choiceList.querySelectorAll("button")]
    .find((b) => b.textContent.includes(text));
  const answerActive = () => {
    const lesson = api.getActiveLesson();
    if (!lesson) throw new Error("no active lesson to answer");
    const btn = [...api.elements.choiceList.querySelectorAll("button")].find((b) => b.dataset.choice === lesson.answer);
    if (!btn) throw new Error("correct choice button not found");
    api.answerLesson(btn, lesson.answer);
  };
  const click = (btn, label) => {
    if (!btn) throw new Error(`button not found: ${label}`);
    btn.click();
  };
  try {
    if (!clock || typeof api.getAdvMode !== "function") throw new Error("test hooks (playClock/getAdvMode) missing");
    createdId = accounts.create().id;
    clock.setOffset(0);
    clock.setDurations(2, 1);
    clock.tick();

    // 進入第一層場景選單。
    api.openSceneAdv(api.hotspotById(place));
    if (api.getAdvMode() !== "scene") errors.push(`first layer mode = ${api.getAdvMode()}, expected scene`);
    if (!choiceBtn("Chat")) errors.push("first layer missing Chat button");
    if (!choiceBtn("Shop")) errors.push("first layer missing Shop button");

    // 聊天答題 → 完成 → Back 應回第一層（不關閉冒險視窗）。
    click(choiceBtn("Chat"), "Chat");
    if (api.getAdvMode() !== "quest") errors.push(`after Chat mode = ${api.getAdvMode()}, expected quest`);
    answerActive();
    if (api.getAdvMode() !== "complete") errors.push(`after answer mode = ${api.getAdvMode()}, expected complete`);
    click(footerBtn("Back"), "Back(complete)");
    if (api.getAdvMode() !== "scene") errors.push(`Back from complete mode = ${api.getAdvMode()}, expected scene (not closed)`);

    // 聊天後接著逛店（同次造訪不被迫離場）→ 逛店 Back 應回第一層。
    click(choiceBtn("Shop"), "Shop");
    if (api.getAdvMode() !== "shop") errors.push(`after Shop mode = ${api.getAdvMode()}, expected shop`);
    click(footerBtn("Back"), "Back(shop)");
    if (api.getAdvMode() !== "scene") errors.push(`Back from shop mode = ${api.getAdvMode()}, expected scene`);

    // 進入聊天但不作答即 Back（答題畫面 Back）→ 應回第一層。
    click(choiceBtn("Chat"), "Chat#2");
    if (api.getAdvMode() !== "quest") errors.push(`after Chat#2 mode = ${api.getAdvMode()}, expected quest`);
    click(footerBtn("Back"), "Back(quest)");
    if (api.getAdvMode() !== "scene") errors.push(`Back from quest mode = ${api.getAdvMode()}, expected scene`);
    if (api.state.activeQuest) errors.push("activeQuest not cleared after backing out of unanswered quest (issue #143 regression)");

    // 僅第一層場景選單之 Leave 才關閉冒險視窗回地圖。
    click(footerBtn("Leave"), "Leave");
    if (api.getAdvMode() !== "closed") errors.push(`Leave from first layer mode = ${api.getAdvMode()}, expected closed`);
  } catch (error) {
    errors.push(error.message);
  } finally {
    api.closeAdv();
    if (createdId) accounts.remove(createdId);
    clock?.setOffset(0);
  }
  const result = document.createElement("pre");
  result.id = "sceneNavTestResult";
  result.textContent = JSON.stringify({ test: "scene-nav", passed: errors.length === 0, errors: errors.slice(0, 10) });
  document.body.prepend(result);
}

// issue #126/#131/#163：驗證 profileColor、粉彩色盤、調色器自訂色、舊存檔相容、一次性隨機初始主題、
// 背景花紋、共用頭胸大頭照、帳號摘要與返回初始選單；#161 後地圖 token 不再承載識別色（改由 map-avatar 驗證放大且無背板）。
function runProfileColorSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "profile-color") return;
  const errors = [];
  let account = null;
  try {
    // issue #131：色盤改為 8 種粉彩色（spec#6）。
    if (!api.profileColorPalette || api.profileColorPalette.length !== 8) {
      errors.push(`profile color palette size ${api.profileColorPalette?.length || 0}, expected 8`);
    }
    const characters = Object.values(api.characterRegistry || {});
    const defaults = characters.map((character) => character.defaultProfileColor);
    if (new Set(defaults).size !== characters.length) errors.push("playable princess default profile colors are not distinct");

    // issue #131 (intTest#31/#40)：normalizeProfileColor 放寬為格式驗證——調色器自訂色與舊存檔色值（不在新色盤內）皆原值保留，僅非法/缺漏才回退預設。
    const customHex = "#123abc";
    if (api.normalizeProfileColor(customHex, "lumi") !== customHex) errors.push("custom hex color was not preserved by normalizeProfileColor");
    const legacyHex = "#ef4444"; // 舊 16 色盤的紅，已不在新粉彩色盤內
    if (api.normalizeProfileColor(legacyHex, "lumi") !== legacyHex) errors.push("legacy save profile color was reset (expected preserved)");
    if (api.normalizeProfileColor("not-a-color", "lumi") !== api.defaultProfileColorFor("lumi")) errors.push("invalid profile color did not fall back to character default");

    // issue #131 (intTest#40)：背景花紋集（none + 8）與 normalize。
    if (!Array.isArray(api.backgroundPatternIds) || api.backgroundPatternIds.length < 9) errors.push(`background pattern set size ${api.backgroundPatternIds?.length || 0}, expected >= 9 (none + 8)`);
    if (api.normalizeBackgroundPattern("bubble") !== "bubble") errors.push("valid background pattern was not preserved");
    if (api.normalizeBackgroundPattern("bogus-pattern") !== "none") errors.push("unknown background pattern did not fall back to none");
    const randomColor = api.randomProfileColor?.();
    const randomPattern = api.randomBackgroundPattern?.();
    if (!api.profileColorPalette.includes(randomColor)) errors.push("randomProfileColor did not return a palette value");
    if (!api.backgroundPatternIds.includes(randomPattern) || randomPattern === "none") {
      errors.push("randomBackgroundPattern did not return a visible legal pattern");
    }

    // issue #163：新帳號與缺漏舊存檔須取得合法初始主題，且選定後持久化不重抽。
    const missingTheme = api.normalizeState({ activeCharacterId: "sol", playerName: "Legacy Mary" });
    if (!api.profileColorPalette.includes(missingTheme.profileColor)) errors.push(`missing profileColor normalized to non-palette value ${missingTheme.profileColor}`);
    if (!api.backgroundPatternIds.includes(missingTheme.backgroundPattern) || missingTheme.backgroundPattern === "none") {
      errors.push(`missing backgroundPattern normalized to ${missingTheme.backgroundPattern}, expected visible legal pattern`);
    }

    account = api.accounts.create();
    const createdInitial = api.accounts.loadState(account.id);
    if (!api.profileColorPalette.includes(createdInitial.profileColor)) errors.push(`fresh account profileColor ${createdInitial.profileColor} not from palette`);
    if (!api.backgroundPatternIds.includes(createdInitial.backgroundPattern) || createdInitial.backgroundPattern === "none") {
      errors.push(`fresh account backgroundPattern ${createdInitial.backgroundPattern}, expected visible legal pattern`);
    }
    api.state.activeCharacterId = "yumi";
    api.state.playerName = "Blue Kid";
    api.state.profileColor = customHex; // 自訂色（不在色盤內）：驗證可流經 render 不被重置
    api.state.backgroundPattern = "bubble";
    api.state.coins = 321;
    api.persist();
    api.syncActiveAccountMeta({ touched: true });
    api.render();

    const sideAvatar = api.elements.sideProfileAvatar;
    if (!sideAvatar || sideAvatar.querySelectorAll(".paper-doll-layer").length === 0) errors.push("side profile avatar did not render outfit layers");
    if (sideAvatar?.style.getPropertyValue("--profile-color") !== api.state.profileColor) errors.push("side avatar profile color does not match state (custom color reset?)");
    // issue #131：背景花紋以 data-pattern 套用於資訊欄識別卡背版。
    if (api.elements.sideProfileFrame?.dataset.pattern !== "bubble") errors.push(`info-bar card pattern ${api.elements.sideProfileFrame?.dataset.pattern || "(none)"}, expected bubble`);

    api.openAccountSelect({ mustChoose: false });
    const accountPick = api.elements.accountList.querySelector(`[data-account-id="${account.id}"]`);
    if (!accountPick) errors.push("account card missing created account");
    if (!accountPick?.querySelector(".account-avatar")) errors.push("account card missing avatar");
    const listText = api.elements.accountList.textContent || "";
    if (!listText.includes("321 coins")) errors.push("account card missing coins summary");
    if (!listText.includes("Last played")) errors.push("account card missing last played summary");

    api.closeAccountSelect();
    api.openWorldMap();
    api.renderWorldMap();
    // issue #161：地圖公主 token 已移除識別色背板，不再注入 profileColor（識別色僅用於資訊欄與帳號卡）。
    const mapTokenColor = api.elements.worldPlayerToken?.style.getPropertyValue("--profile-color") || "";
    if (mapTokenColor) errors.push(`world token still carries --profile-color (${mapTokenColor}); expected none after #161`);

    api.returnToInitialSelect();
    if (!api.elements.accountSelect?.classList.contains("show")) errors.push("return to initial select did not open account select");
    if (api.state.coins !== 321) errors.push("return to initial select changed current progress");
    const afterReturn = api.accounts.loadState(account.id);
    if (afterReturn.profileColor !== customHex || afterReturn.backgroundPattern !== "bubble") {
      errors.push("saved profile theme was re-randomized after reload");
    }
  } catch (error) {
    errors.push(error.message);
  } finally {
    if (account?.id) api.accounts.remove(account.id);
  }
  const result = document.createElement("pre");
  result.id = "profileColorTestResult";
  result.textContent = JSON.stringify({
    test: "profile-color",
    passed: errors.length === 0,
    errors: errors.slice(0, 10)
  });
  document.body.prepend(result);
}

// 本機多帳號（issue #63）：驗證新增、隔離、切換與刪除（含刪除使用中帳號回到帳號選擇）。
function runAccountSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "accounts") return;
  const errors = [];
  const accounts = api.accounts;
  try {
    const baseline = accounts.list().length;
    // 1) 建立帳號 A，寫入可辨識進度。
    const accA = accounts.create();
    api.state.coins = 111;
    api.state.playerName = "TestA";
    api.persist();
    // 2) 建立帳號 B：應為乾淨初始（隔離），寫入不同進度。
    const accB = accounts.create();
    if (api.state.coins === 111) errors.push("new account B inherited account A coins (no isolation)");
    api.state.coins = 222;
    api.state.playerName = "TestB";
    api.persist();
    // 3) 切回 A：應還原 111。
    accounts.select(accA.id);
    if (api.state.coins !== 111) errors.push(`account A coins after switch = ${api.state.coins}, expected 111`);
    // 4) 切到 B：應還原 222。
    accounts.select(accB.id);
    if (api.state.coins !== 222) errors.push(`account B coins after switch = ${api.state.coins}, expected 222`);
    // 5) 刪除非使用中帳號 A（目前使用中為 B）。
    const remainingAfterDeleteA = accounts.remove(accA.id);
    if (accounts.list().some((account) => account.id === accA.id)) errors.push("deleted account A still listed");
    if (accounts.activeId() !== accB.id) errors.push("deleting non-active account changed the active account");
    if (remainingAfterDeleteA !== baseline + 1) errors.push(`account count after deleting A = ${remainingAfterDeleteA}, expected ${baseline + 1}`);
    // 6) 刪除使用中帳號 B：activeId 應清空（交回帳號選擇）。
    accounts.remove(accB.id);
    if (accounts.activeId()) errors.push("deleting active account left an active id (should return to account select)");
    // 7) issue #153：既有帳號下「新增公主」可取消返回、且不殘留空帳號。
    //    先建立基準帳號 C 作為「既有帳號」，再走 createNewAccount → cancelCharacterSelect。
    const accC = accounts.create();
    api.state.playerName = "KeepC";
    api.persist();
    const countBeforeAdd = accounts.list().length;
    api.createNewAccount(); // 既有帳號下新增 → 進入可取消創角，先落地待定空帳號
    if (accounts.list().length !== countBeforeAdd + 1) errors.push(`createNewAccount did not add a pending account (count=${accounts.list().length}, expected ${countBeforeAdd + 1})`);
    api.cancelCharacterSelect(); // 取消 → 丟棄待定空帳號、返回帳號選擇
    if (accounts.list().length !== countBeforeAdd) errors.push(`cancel left an orphan account (count=${accounts.list().length}, expected ${countBeforeAdd})`);
    if (accounts.activeId() !== accC.id) errors.push(`cancel did not restore previous active account (active=${accounts.activeId()}, expected ${accC.id})`);
    if (api.state.playerName !== "KeepC") errors.push(`cancel did not restore previous account state (playerName=${api.state.playerName}, expected KeepC)`);
    accounts.remove(accC.id); // 清理基準帳號 C
    // 9) issue #169：帳號選單之休息倒數須隨時鐘遞減（非開啟當下的凍結快照）——
    //    refreshAccountStatuses 依現在時鐘重算卡片狀態文字。
    if (api.playClock && typeof api.buildAccountList === "function" && typeof api.refreshAccountStatuses === "function") {
      const accR = accounts.create();
      api.playClock.setOffset(0);
      api.state.playLimit.sessionEndsAt = 0;
      api.state.playLimit.restEndsAt = api.playClock.now() + 5 * 60000; // 休息中（5 分鐘）
      api.persist();
      api.buildAccountList();
      const cardStatus = () => document.querySelector(`.account-pick[data-account-id="${accR.id}"]`)
        ?.closest(".account-row")?.querySelector(".account-status")?.textContent;
      const before = cardStatus();
      if (!before || !before.startsWith("Rest")) errors.push(`#169 ticker: card before=${before}, expected "Rest …"`);
      api.playClock.advance(60000); // 過 1 分鐘
      api.refreshAccountStatuses();
      const after = cardStatus();
      if (!after || !after.startsWith("Rest")) errors.push(`#169 ticker: card after=${after}, expected "Rest …"`);
      if (before === after) errors.push(`#169 ticker: rest countdown frozen (before=after=${before}), expected to decrement`);
      api.playClock.setOffset(0);
      accounts.remove(accR.id);
    }
    // 8) 帳號數回到 baseline（測試自我清理）。
    if (accounts.list().length !== baseline) errors.push(`account count after cleanup = ${accounts.list().length}, expected ${baseline}`);
  } catch (error) {
    errors.push(error.message);
  }
  const result = document.createElement("pre");
  result.id = "accountTestResult";
  result.textContent = JSON.stringify({
    test: "accounts",
    passed: errors.length === 0,
    errors: errors.slice(0, 10)
  });
  document.body.prepend(result);
}

// issue #73 中文協助：驗證獎勵階梯（按送出次數計）與中文撥放、缺中文降級。
function runChineseRewardSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "chinese-reward") return;
  const errors = [];
  try {
    if (!api.accounts.activeId()) api.accounts.create();
    const place = "kingHall";
    const answer = (choice) => {
      const button = [...api.elements.choiceList.querySelectorAll("button")].find((b) => b.dataset.choice === choice);
      if (!button) throw new Error(`choice button not found: ${choice}`);
      api.answerLesson(button, choice);
    };
    const openOne = (p = place) => {
      api.openQuestAdv(api.hotspotById(p));
      const lesson = api.getActiveLesson();
      if (!lesson) throw new Error("no active lesson after openQuestAdv");
      return lesson;
    };
    const wrongsFor = (lesson) => lesson.choices.filter((c) => c !== lesson.answer);

    // A) 未用中文、第一次答對 → 全額
    let lesson = openOne();
    let base = lesson.reward.coins || 0;
    let before = api.state.coins;
    answer(lesson.answer);
    const gainedFull = api.state.coins - before;
    if (gainedFull !== base) errors.push(`first-try(no zh) gained ${gainedFull}, expected full ${base}`);

    // B) 未用中文、第二次才答對 → 半額
    lesson = openOne();
    base = lesson.reward.coins || 0;
    before = api.state.coins;
    answer(wrongsFor(lesson)[0]);
    answer(lesson.answer);
    const gainedHalf = api.state.coins - before;
    const expectHalf = Math.round(base * 0.5);
    if (gainedHalf !== expectHalf) errors.push(`second-try(no zh) gained ${gainedHalf}, expected half ${expectHalf}`);

    // C) 按過中文 → 無（同時驗證 kingHall 有渲染中文撥放鈕）
    lesson = openOne();
    before = api.state.coins;
    const zhBtn = api.elements.choiceList.querySelector(".choice-audio-button.zh");
    if (!zhBtn) errors.push("no Chinese audio button rendered for kingHall (expected zh content)");
    else zhBtn.click();
    answer(lesson.answer);
    const gainedZh = api.state.coins - before;
    if (gainedZh !== 0) errors.push(`chinese-used gained ${gainedZh}, expected 0`);

    // D) 第三次才答對 → 無
    lesson = openOne();
    before = api.state.coins;
    const wrongs = wrongsFor(lesson);
    answer(wrongs[0]);
    answer(wrongs[1]);
    answer(lesson.answer);
    const gainedThird = api.state.coins - before;
    if (gainedThird !== 0) errors.push(`third-try gained ${gainedThird}, expected 0`);

    // E) 跨地區中文覆蓋：每區一處（打工題）應渲染題目中文鈕與 3 個選項中文鈕（issue #149：打工選項 4→3）
    for (const [area, p] of [["castle", "kingHall"], ["urban", "garden"], ["rural", "mine"], ["wild", "elfGlade"]]) {
      openOne(p);
      const zhCount = api.elements.choiceList.querySelectorAll(".choice-audio-button.zh").length;
      const promptZhHidden = document.getElementById("speakPromptButtonZh").hidden;
      if (zhCount !== 3) errors.push(`${area}/${p}: zh choice buttons ${zhCount}, expected 3`);
      if (promptZhHidden) errors.push(`${area}/${p}: prompt zh button hidden (missing promptZh)`);
    }

    api.closeAdv();
  } catch (error) {
    errors.push(error.message);
  }
  const result = document.createElement("pre");
  result.id = "chineseRewardTestResult";
  result.textContent = JSON.stringify({
    test: "chinese-reward",
    passed: errors.length === 0,
    errors: errors.slice(0, 10)
  });
  document.body.prepend(result);
}

// issue #93 角色差異化配音（spec#2 / solStory#13 / sysStory#9）：
// 以純函式驗證維度→音色合成（intTest#24）、公主音色（intTest#25）、缺維度降級（intTest#26）。
function runCharacterVoiceSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "voice") return;
  const errors = [];
  let coverage = null;
  try {
    const compose = api.composeVoiceProfile;
    const resolve = api.resolveVoiceProfile;
    if (!compose || !resolve || !api.npcVoiceFor || !api.playerVoiceProfile) throw new Error("voice testing hooks missing");
    if (!api.accounts.activeId()) api.accounts.create();

    // intTest#24：不同維度 → 不同音頻參數（女性年輕 vs 成年男性 應明顯有別）
    const maid = compose({ gender: "female", age: "youth", personality: "cheerful" });
    const king = compose({ gender: "male", age: "middle", personality: "bold" });
    if (maid.pitch === king.pitch && maid.rate === king.rate) errors.push("不同維度音色未區分");
    if (!(maid.pitch > king.pitch)) errors.push(`女性年輕音高(${maid.pitch})未高於成年男性(${king.pitch})`);

    // intTest#24（NPC 落地）：castle King 與 Queen 經宣告音色應有別、且非降級 default
    const kingHall = api.npcVoiceFor(api.hotspotById("kingHall"));
    const queenStudy = api.npcVoiceFor(api.hotspotById("queenStudy"));
    if (kingHall.pitch === queenStudy.pitch && kingHall.rate === queenStudy.rate) errors.push("King/Queen NPC 音色未區分");
    if (kingHall.profileId === "default") errors.push("King Rowan 未宣告音色（落回 default）");

    // intTest#25：玩家公主音色可解析且為高於基準的童聲（child female）
    const princess = api.playerVoiceProfile();
    if (!princess || typeof princess.pitch !== "number") errors.push("公主音色解析失敗");
    else if (!(princess.pitch > 1)) errors.push(`公主音高(${princess.pitch})未高於基準 1`);

    // intTest#26：缺宣告／未知值降級為 default，且不丟錯
    if (resolve(null).profileId !== "default") errors.push("無宣告未降級為 default");
    if (resolve(undefined).profileId !== "default") errors.push("undefined 未降級為 default");
    const unknown = compose({ gender: "alien", age: "ancient", personality: "spicy" });
    if (typeof unknown.pitch !== "number" || typeof unknown.rate !== "number") errors.push("未知維度未安全合成");
    if (unknown.pitch !== 1 || unknown.rate !== 0.86) errors.push("未知維度未落回基準參數");
    const partial = compose({ gender: "female" });
    if (typeof partial.pitch !== "number") errors.push("部分維度未安全合成");

    // intTest#27：全域朗讀語速倍率——最終發聲語速＝profile.rate × paramSpeechRateScale，且相對快慢順序不變
    if (typeof api.speechRateScale !== "number" || typeof api.effectiveSpeechRate !== "function") {
      errors.push("speechRateScale／effectiveSpeechRate hook 缺失");
    } else {
      if (Math.abs(api.speechRateScale - 0.9) > 0.001) errors.push(`語速倍率應為 0.9，實際 ${api.speechRateScale}`);
      const fast = compose({ gender: "female", age: "child", personality: "cheerful" });   // 較快童聲
      const slow = compose({ gender: "male", age: "elderly", personality: "melancholy" });  // 較慢長者
      const fastEff = api.effectiveSpeechRate(fast.rate);
      const slowEff = api.effectiveSpeechRate(slow.rate);
      const expectFast = Math.round(fast.rate * api.speechRateScale * 100) / 100;
      if (Math.abs(fastEff - expectFast) > 0.001) errors.push(`全域語速倍率未套用(${fastEff}≠${fast.rate}×${api.speechRateScale})`);
      if (!(fastEff < fast.rate)) errors.push("套用倍率後語速未變慢");
      if ((fast.rate > slow.rate) !== (fastEff > slowEff)) errors.push("套用倍率後相對快慢順序改變");
    }
    if (api.speechQueueMode !== "replace-last") errors.push(`語音佇列策略應為 replace-last，實際 ${api.speechQueueMode}`);
    if (typeof api.speechDebounceMs !== "number" || api.speechDebounceMs < 80) errors.push("語音 debounce 設定缺失或過低");

    // 跨地區覆蓋（castle/urban/rural/wild）：所有 area NPC 應解析音色；
    // 僅刻意未宣告者（如告示牌 *Sign）可降級 default。
    const npcHotspots = Object.values(api.areaRegistry)
      .flatMap((area) => area.locations || [])
      .filter((h) => h.npc && h.npc !== "Lumi");
    const declared = npcHotspots.filter((h) => api.npcVoiceFor(h).profileId !== "default");
    const fellBack = npcHotspots.filter((h) => api.npcVoiceFor(h).profileId === "default").map((h) => h.npc);
    coverage = { total: npcHotspots.length, declared: declared.length, fellBack: [...new Set(fellBack)] };
    if (declared.length < npcHotspots.length - 2) {
      errors.push(`NPC 音色覆蓋不足：${declared.length}/${npcHotspots.length} 已宣告，降級者 ${coverage.fellBack.join("／")}`);
    }

    // 整合（intTest#24/#25）：實開題→答對，spy speechSynthesis 驗 NPC 開場低音與公主朗讀正解高音。
    if ("speechSynthesis" in window) {
      const spoken = [];
      const synth = window.speechSynthesis;
      const origSpeak = synth.speak.bind(synth);
      const origCancel = synth.cancel.bind(synth);
      synth.cancel = () => {};
      synth.speak = (u) => spoken.push({ text: u.text, pitch: u.pitch, rate: u.rate });
      try {
        api.state.speechEnabled = true;
        api.openQuestAdv(api.hotspotById("kingHall"));
        const lesson = api.getActiveLesson();
        if (!lesson) {
          errors.push("integration: 無 active lesson");
        } else {
          if (!spoken.some((s) => typeof s.pitch === "number" && s.pitch < 1)) errors.push("NPC 開場未以角色低音發聲");
          const before = spoken.length;
          const btn = [...api.elements.choiceList.querySelectorAll("button")].find((b) => b.dataset.choice === lesson.answer);
          if (!btn) errors.push("integration: 找不到正解按鈕");
          else api.answerLesson(btn, lesson.answer);
          const princessSpoke = spoken.slice(before).find((s) => s.text.trimStart() === lesson.answer);
          if (!princessSpoke) errors.push("公主未朗讀所選正解");
          else if (!(princessSpoke.pitch > 1)) errors.push(`公主朗讀音高(${princessSpoke.pitch})未高於基準`);
          // intTest#42：送入 utterance 的文字開頭含前置留白（畫面顯示原文不受影響）。
          if (typeof api.speechLeadingPad === "string" && api.speechLeadingPad.length) {
            if (princessSpoke && !princessSpoke.text.startsWith(api.speechLeadingPad)) errors.push("送入 utterance 文字未加首字前置留白");
            const npcOpening = spoken.slice(0, before).find((s) => typeof s.pitch === "number" && s.pitch < 1);
            if (npcOpening && !npcOpening.text.startsWith(api.speechLeadingPad)) errors.push("NPC 開場語音未加首字前置留白");
          }
          // intTest#27（端對端）：實際 utterance.rate 已套用全域朗讀語速倍率
          if (princessSpoke && typeof api.effectiveSpeechRate === "function") {
            const expectedRate = api.effectiveSpeechRate(api.playerVoiceProfile().rate);
            if (typeof princessSpoke.rate !== "number" || Math.abs(princessSpoke.rate - expectedRate) > 0.011) {
              errors.push(`公主朗讀實際語速(${princessSpoke.rate})未套用全域倍率(期望 ${expectedRate})`);
            }
          }
        }
        api.closeAdv();
      } finally {
        synth.speak = origSpeak;
        synth.cancel = origCancel;
      }
    }

    // intTest#44：離開場景時收束正在播放之語音、不殘留跨場景（issue #156）。
    if ("speechSynthesis" in window && api.getSpeechDiagnostics && api.isSpeaking && api.openQuestAdv) {
      const synth = window.speechSynthesis;
      const origSpeak = synth.speak.bind(synth);
      const origCancel = synth.cancel.bind(synth);
      let cancelCount = 0;
      synth.speak = () => {};
      synth.cancel = () => { cancelCount += 1; };
      try {
        api.state.speechEnabled = true;
        api.openQuestAdv(api.hotspotById("kingHall"));
        if (!api.isSpeaking()) errors.push("intTest#44：場景觸發語音後 isSpeaking 應為 true");
        const before = api.getSpeechDiagnostics().length;
        const cancelBefore = cancelCount;
        api.closeAdv(); // 離開場景 → 應即時收束語音
        if (cancelCount <= cancelBefore) errors.push("intTest#44：離開場景未呼叫 speechSynthesis.cancel 收束語音");
        const leaveStop = api.getSpeechDiagnostics().slice(before).find((d) => d.source === "scene-leave");
        if (!leaveStop) errors.push("intTest#44：離開場景未記錄 scene-leave 收束診斷");
        else if (!leaveStop.cancelCalled) errors.push("intTest#44：scene-leave 診斷 cancelCalled 應為 true");
        if (api.isSpeaking()) errors.push("intTest#44：離開場景後 isSpeaking 仍為 true（語音殘留跨場景）");
        // 不殘留：無語音時再次 closeAdv 不應新增 scene-leave 收束診斷。
        const afterLeave = api.getSpeechDiagnostics().length;
        api.closeAdv();
        const spurious = api.getSpeechDiagnostics().slice(afterLeave).some((d) => d.source === "scene-leave");
        if (spurious) errors.push("intTest#44：無語音時 closeAdv 不應新增 scene-leave 收束診斷");
      } catch (error) {
        errors.push(`intTest#44：${error.message}`);
      } finally {
        synth.speak = origSpeak;
        synth.cancel = origCancel;
      }
    }

    // intTest#45：場景內第一↔二層切換即時收束前段語音、改接當下話題（issue #164 Facet A）。
    if ("speechSynthesis" in window && api.getSpeechDiagnostics && api.isSpeaking && api.openSceneAdv && api.handleFirstLayerSceneAction && api.backToSceneMenu) {
      const synth = window.speechSynthesis;
      const origSpeak = synth.speak.bind(synth);
      const origCancel = synth.cancel.bind(synth);
      synth.speak = () => {};
      synth.cancel = () => {};
      try {
        api.state.speechEnabled = true;
        const hotspot = api.hotspotById("kingHall");
        api.closeAdv(); // 自乾淨狀態起，確保進入＝新造訪
        // 進入場景第一層 → 觸發歡迎詞語音。
        api.openSceneAdv(hotspot);
        if (!api.isSpeaking()) errors.push("intTest#45：進入場景第一層後 isSpeaking 應為 true（歡迎詞播放中）");
        // 進入第二層子互動（打工）→ 應即時收束第一層前段語音（scene-switch）。
        let before = api.getSpeechDiagnostics().length;
        api.handleFirstLayerSceneAction({ handlerKey: "practice" }, hotspot);
        const enterStop = api.getSpeechDiagnostics().slice(before).find((d) => d.source === "scene-switch");
        if (!enterStop) errors.push("intTest#45：進入第二層子互動未記錄 scene-switch 收束診斷");
        else if (!enterStop.cancelCalled) errors.push("intTest#45：進入第二層 scene-switch 診斷 cancelCalled 應為 true");
        // 第二層觸發語音後返回第一層場景選單 → 應即時收束第二層前段語音（scene-switch），無跨層級殘留。
        if (!api.isSpeaking()) errors.push("intTest#45：進入第二層子互動後應有語音播放中");
        before = api.getSpeechDiagnostics().length;
        api.backToSceneMenu(hotspot);
        const backStop = api.getSpeechDiagnostics().slice(before).find((d) => d.source === "scene-switch");
        if (!backStop) errors.push("intTest#45：返回第一層場景選單未記錄 scene-switch 收束診斷");
        if (api.isSpeaking()) errors.push("intTest#45：返回第一層後 isSpeaking 仍為 true（前段語音殘留跨層級）");
        api.closeAdv();
      } catch (error) {
        errors.push(`intTest#45：${error.message}`);
      } finally {
        synth.speak = origSpeak;
        synth.cancel = origCancel;
      }
    }

    // intTest#46：同一場景歡迎詞每次造訪只播一次（issue #164 Facet B）。
    if ("speechSynthesis" in window && api.getSpeechDiagnostics && api.openSceneAdv && api.backToSceneMenu && api.handleFirstLayerSceneAction) {
      const synth = window.speechSynthesis;
      const origSpeak = synth.speak.bind(synth);
      const origCancel = synth.cancel.bind(synth);
      synth.speak = () => {};
      synth.cancel = () => {};
      const welcomeCountSince = (sinceIndex) => api.getSpeechDiagnostics().slice(sinceIndex).filter((d) => d.source === "npc-scene").length;
      try {
        api.state.speechEnabled = true;
        const hotspot = api.hotspotById("kingHall");
        api.closeAdv(); // 重置造訪態旗標，確保自地圖進入＝新造訪
        let start = api.getSpeechDiagnostics().length;
        api.openSceneAdv(hotspot); // 首次進入場景第一層
        if (welcomeCountSince(start) !== 1) errors.push(`intTest#46：首次進入場景歡迎詞應播放一次，實際 ${welcomeCountSince(start)}`);
        // 造訪內進入第二層再返回第一層 → 歡迎詞不重播。
        api.handleFirstLayerSceneAction({ handlerKey: "practice" }, hotspot);
        api.backToSceneMenu(hotspot);
        if (welcomeCountSince(start) !== 1) errors.push(`intTest#46：造訪內返回第一層不應重播歡迎詞，累計實際 ${welcomeCountSince(start)}`);
        // 離場後再次進入同一場景 → 新造訪、歡迎詞重新播放一次。
        api.closeAdv();
        start = api.getSpeechDiagnostics().length;
        api.openSceneAdv(hotspot);
        if (welcomeCountSince(start) !== 1) errors.push(`intTest#46：離場後再次造訪應重新播放一次歡迎詞，實際 ${welcomeCountSince(start)}`);
        api.closeAdv();
      } catch (error) {
        errors.push(`intTest#46：${error.message}`);
      } finally {
        synth.speak = origSpeak;
        synth.cancel = origCancel;
      }
    }

    // intTest#33-35：Web Speech API voice 載入／fallback、cancel 策略與診斷錯誤紀錄。
    if ("speechSynthesis" in window && api.speakForTest && api.selectSpeechVoice && api.getSpeechDiagnostics) {
      const synth = window.speechSynthesis;
      const origSpeak = synth.speak.bind(synth);
      const origCancel = synth.cancel.bind(synth);
      const origGetVoices = typeof synth.getVoices === "function" ? synth.getVoices.bind(synth) : null;
      const spoken = [];
      let cancelCount = 0;
      const makeVoice = (name, lang, isDefault = false) => ({ name, lang, default: isDefault, voiceURI: `${name}-${lang}` });
      try {
        synth.getVoices = () => [
          makeVoice("Taiwan Female", "zh-TW"),
          makeVoice("Mandarin Generic", "zh-CN"),
          makeVoice("US Female", "en-US"),
          makeVoice("English Generic", "en-GB"),
          makeVoice("Default English", "en-US", true)
        ];
        api.refreshSpeechVoices?.();
        const zhExact = api.selectSpeechVoice({ lang: "zh-TW", voiceHint: "female" });
        if (zhExact.voice?.lang !== "zh-TW") errors.push(`zh-TW voice 未優先選取，實際 ${zhExact.voice?.lang || "none"}`);
        const enExact = api.selectSpeechVoice({ lang: "en-US" });
        if (enExact.voice?.lang !== "en-US") errors.push(`en-US voice 未優先選取，實際 ${enExact.voice?.lang || "none"}`);

        synth.getVoices = () => [makeVoice("Mandarin Generic", "zh-CN"), makeVoice("Default English", "en-US", true)];
        api.refreshSpeechVoices?.();
        const zhPrimary = api.selectSpeechVoice({ lang: "zh-TW" });
        if (zhPrimary.voice?.lang !== "zh-CN" || zhPrimary.fallbackReason !== "fallback-zh") {
          errors.push(`zh primary fallback 未生效，實際 ${zhPrimary.voice?.lang || "none"}／${zhPrimary.fallbackReason}`);
        }

        synth.getVoices = () => [makeVoice("Default English", "en-US", true)];
        api.refreshSpeechVoices?.();
        const zhDefault = api.selectSpeechVoice({ lang: "zh-TW" });
        if (zhDefault.voice?.lang !== "en-US" || zhDefault.fallbackReason !== "language-unavailable") {
          errors.push(`缺中文 voice 時未記錄 language-unavailable，實際 ${zhDefault.voice?.lang || "none"}／${zhDefault.fallbackReason}`);
        }

        // intTest#41：使用者語音指定（覆蓋層）、性別繼承與缺 voice 降級（issue #134）。
        if (api.setVoiceAssignment && api.clearVoiceAssignments && api.getVoiceAssignments) {
          synth.getVoices = () => [
            makeVoice("Microsoft David", "en-US"),
            makeVoice("Microsoft Zira", "en-US", true),
            makeVoice("Microsoft Mark", "en-US")
          ];
          api.refreshSpeechVoices?.();
          api.clearVoiceAssignments();
          api.setVoiceAssignment("male", "bold", "Microsoft David");
          const maleBold = api.selectSpeechVoice({ lang: "en-US", gender: "male", personality: "bold" });
          if (maleBold.voice?.name !== "Microsoft David") errors.push(`語音指定未生效，實際 ${maleBold.voice?.name || "none"}`);
          if (maleBold.fallbackReason !== "user-assigned") errors.push(`指定語音未標記 user-assigned，實際 ${maleBold.fallbackReason}`);
          if (api.voiceAssignmentKey && typeof localStorage !== "undefined") {
            const stored = localStorage.getItem(api.voiceAssignmentKey);
            if (!stored || !stored.includes("Microsoft David")) errors.push("語音指定未持久化至 voiceAssignmentKey");
          }
          api.setVoiceAssignment("male", "", "Microsoft Mark");
          const maleGrace = api.selectSpeechVoice({ lang: "en-US", gender: "male", personality: "graceful" });
          if (maleGrace.voice?.name !== "Microsoft Mark") errors.push(`未繼承性別預設語音，實際 ${maleGrace.voice?.name || "none"}`);
          api.setVoiceAssignment("female", "cheerful", "NoSuchVoiceXYZ");
          const femMissing = api.selectSpeechVoice({ lang: "en-US", gender: "female", personality: "cheerful" });
          if (!femMissing.voice) errors.push("指定 voice 缺失時未降級發聲");
          if (femMissing.fallbackReason !== "assigned-voice-missing") errors.push(`缺指定 voice 未記 assigned-voice-missing，實際 ${femMissing.fallbackReason}`);
          const noGender = api.selectSpeechVoice({ lang: "en-US" });
          if (noGender.fallbackReason === "user-assigned") errors.push("無性別 profile 不應套用語音指定");

          // sysCase#9.5 設定 UI：設定面板逐桶渲染下拉（含性別預設列、列出可用 voice）。
          if (api.renderSettings && api.usedVoiceBuckets && api.elements?.voiceAssignList) {
            api.setVoiceAssignment("female", "cheerful", "");
            api.renderSettings();
            const rows = api.elements.voiceAssignList.querySelectorAll(".voice-assign-row");
            const expectedBuckets = api.usedVoiceBuckets().length;
            if (rows.length !== expectedBuckets) errors.push(`語音設定列數(${rows.length})與桶數(${expectedBuckets})不符`);
            const firstSelect = api.elements.voiceAssignList.querySelector(".voice-assign-select");
            if (!firstSelect || firstSelect.querySelectorAll("option").length < 4) errors.push("語音設定下拉未列出可用 voice 選項");
            if (!api.elements.voiceAssignList.querySelector(".voice-assign-default")) errors.push("語音設定缺性別預設列");

            // getVoices() 初次回空 → 設定顯示空狀態；voiceschanged 載入後須即時重渲染出選擇器（不必重開）。
            synth.getVoices = () => [];
            api.refreshSpeechVoices?.();
            api.renderSettings();
            const wasEmpty = !!api.elements.voiceAssignList.querySelector(".voice-assign-empty");
            synth.getVoices = () => [makeVoice("Microsoft David", "en-US", true), makeVoice("Microsoft Zira", "en-US")];
            synth.dispatchEvent?.(new Event("voiceschanged"));
            const rowsAfterChange = api.elements.voiceAssignList.querySelectorAll(".voice-assign-row").length;
            if (wasEmpty && rowsAfterChange < 1) errors.push("voiceschanged 後語音設定未即時重渲染（仍卡空狀態）");
          }
          api.clearVoiceAssignments();
        }

        synth.getVoices = () => [makeVoice("US Female", "en-US", true), makeVoice("Taiwan Female", "zh-TW")];
        api.refreshSpeechVoices?.();
        synth.cancel = () => { cancelCount += 1; };
        synth.speak = (utterance) => {
          spoken.push({
            text: utterance.text,
            lang: utterance.lang,
            pitch: utterance.pitch,
            rate: utterance.rate,
            voice: utterance.voice?.name || ""
          });
          utterance.dispatchEvent(new Event("start"));
          utterance.dispatchEvent(new Event("end"));
        };
        api.resetSpeechDiagnostics?.();
        api.speakForTest("Hello", "en-US", { source: "selftest-en", replayKey: "en-hello" });
        api.speakForTest("你好", "zh-TW", { source: "selftest-zh", replayKey: "zh-nihao" });
        if (cancelCount !== 0) errors.push(`不同語音連續播放不應無條件 cancel，實際 ${cancelCount}`);
        const diagnostics = api.getSpeechDiagnostics();
        if (spoken.length < 2 || diagnostics.length < 2) errors.push("語音 speak 或診斷紀錄未產生");
        if (!diagnostics.some((item) => item.source === "selftest-zh" && item.actualVoiceLang === "zh-TW")) errors.push("中文診斷未記錄 actualVoiceLang=zh-TW");
        if (!diagnostics.every((item) => item.queueAction && Array.isArray(item.events))) errors.push("診斷紀錄缺 queueAction 或 events");

        api.speakForTest("Replay", "en-US", { source: "selftest-replay", replayKey: "same-replay" });
        api.speakForTest("Replay", "en-US", { source: "selftest-replay", replayKey: "same-replay" });
        if (cancelCount < 1) errors.push("同一語音重播未使用 replace-last/cancel 邊界策略");

        api.resetSpeechDiagnostics?.();
        synth.speak = (utterance) => {
          const event = new Event("error");
          Object.defineProperty(event, "error", { value: "voice-unavailable" });
          utterance.dispatchEvent(event);
        };
        api.speakForTest("Broken voice", "en-US", { source: "selftest-error", replayKey: "error-case" });
        const errorDiagnostic = api.getSpeechDiagnostics()[0];
        if (errorDiagnostic?.errorCode !== "voice-unavailable") errors.push(`語音錯誤未記錄 voice-unavailable，實際 ${errorDiagnostic?.errorCode || "none"}`);
      } finally {
        synth.speak = origSpeak;
        synth.cancel = origCancel;
        if (origGetVoices) synth.getVoices = origGetVoices;
        api.refreshSpeechVoices?.();
      }
    }
  } catch (error) {
    errors.push(error.message);
  }
  const result = document.createElement("pre");
  result.id = "characterVoiceTestResult";
  result.textContent = JSON.stringify({
    test: "character-voice",
    passed: errors.length === 0,
    coverage,
    errors: errors.slice(0, 10)
  });
  document.body.prepend(result);
}

async function runDataAudit(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "data-audit") return;
  // issue #138：商店改以 shopCategories 旗標辨識，不再依賴 kind:"shop"。
  const isShopLocation = (hotspot) => Array.isArray(hotspot?.shopCategories) && hotspot.shopCategories.length > 0;
  const shopLocations = Object.values(api.areaRegistry)
    .flatMap((area) => area.locations || [])
    .filter(isShopLocation);
  const shopIds = new Set(shopLocations.map((hotspot) => hotspot.id));
  const categoryCounts = Object.fromEntries(api.categories.map((category) => [
    category.id,
    api.shopItems.filter((item) => item.cost > 0 && api.itemMatchesCategory(item, category.id)).length
  ]));
  const errors = [];
  const warnings = [];
  // issue #155：打工正解須以自然應允語句開頭（分級相稱、可擴充），使幫忙回應親切一致；含禮貌回應供收尾型題目。
  const JOB_ANSWER_OPENERS = ["yes", "yeah", "ok", "okay", "sure", "of course", "no problem", "well", "certainly", "alright", "all right", "right away", "happy to", "you are welcome", "you're welcome", "my pleasure", "thank you", "thanks"];
  const startsWithAckOpener = (text) => {
    const t = String(text).trimStart().toLowerCase();
    return JOB_ANSWER_OPENERS.some((opener) => t.startsWith(opener));
  };
  const mapContracts = await collectMapContractAudit(api, errors);

  Object.entries(categoryCounts).forEach(([category, count]) => {
    if (count < 10) errors.push(`${category} has ${count} paid items`);
  });
  shopLocations.forEach((hotspot) => {
    if ((hotspot.shopCategories || []).length > 2) errors.push(`${hotspot.id} has more than two shop categories`);
  });
  api.shopItems.forEach((item) => {
    if (item.storeId === "starter") return;
    if (!shopIds.has(item.storeId)) errors.push(`${item.id} points to missing store ${item.storeId}`);
    if (item.type === "room") errors.push(`${item.id} is a removed room/furniture item`);
  });
  const market = api.hotspotById("market");
  if (isShopLocation(market)) errors.push("market is still a shop");
  // issue #138：消除 kind:"shop" 特例——確認 manifests 無殘留的 kind:"shop"。
  Object.values(api.areaRegistry).forEach((area) => {
    (area.locations || []).forEach((hotspot) => {
      if (hotspot.kind === "shop") errors.push(`${area.id}/${hotspot.id} still uses kind:"shop"`);
    });
  });
  // issue #138：生活聊天全場景化——每個可互動場景（非 room／gate）皆須具備 chatLesson 題組（含商店）。
  Object.values(api.areaRegistry).forEach((area) => {
    (area.locations || []).forEach((hotspot) => {
      if (hotspot.kind === "gate" || hotspot.kind === "room") return;
      const config = api.sceneConfigFor(hotspot);
      if (!config.chatLesson?.questions?.length) {
        errors.push(`${area.id}/${hotspot.id} has no chatLesson (chat should be available in every interactive scene)`);
      }
    });
  });
  Object.values(api.areaRegistry).forEach((area) => {
    (area.locations || []).forEach((hotspot) => {
      if (hotspot.kind === "gate" || hotspot.kind === "room") return;
      const config = api.sceneConfigFor(hotspot);
      if (config.npcClass === "npc-none" && !config.npcImage) {
        errors.push(`${area.id}/${hotspot.id} has no NPC portrait`);
      }
      if (config.npcImage && !Number.isFinite(config.npcNaturalHeightCm)) {
        errors.push(`${area.id}/${hotspot.id} has npcImage but no npcNaturalHeightCm`);
      }
    });
  });
  const sceneArtSurfaces = [];
  Object.values(api.areaRegistry).forEach((area) => {
    (area.locations || []).forEach((hotspot) => {
      const config = api.sceneConfigFor(hotspot);
      if (!config.sceneArt?.src) {
        errors.push(`${area.id}/${hotspot.id} has no sceneArt.src`);
        return;
      }
      sceneArtSurfaces.push({
        area: area.id,
        id: hotspot.id,
        src: config.sceneArt.src,
        atlas: config.sceneArt.atlas || ""
      });
    });
  });
  const sceneBackgroundContract = await collectSceneBackgroundContractAudit(api, errors);
  warnings.push(...sceneBackgroundContract.warnings);
  const supportedActorMotions = new Set(api.mapActorMotionTypes || []);
  const mapActorSurfaces = [];
  Object.values(api.areaRegistry).forEach((area) => {
    (area.actors || []).forEach((actor) => {
      const requiredNumbers = ["x", "y", "w", "h"];
      requiredNumbers.forEach((field) => {
        if (!Number.isFinite(actor[field])) errors.push(`${area.id}/${actor.id || "actor"} has invalid ${field}`);
      });
      if (!actor.id) errors.push(`${area.id} has actor without id`);
      if (!actor.type) errors.push(`${area.id}/${actor.id || "actor"} has no type`);
      const motion = actor.motion || actor.type;
      if (!supportedActorMotions.has(motion)) errors.push(`${area.id}/${actor.id || "actor"} has unsupported motion ${motion}`);
      mapActorSurfaces.push({
        area: area.id,
        id: actor.id,
        type: actor.type,
        motion
      });
    });
  });
  const characterRegistry = await collectPaperDollCharacterAudit(api, errors);
  const characterScale = await collectCharacterScaleAudit(api, errors, warnings);

  // issue #96 設計契約 §3：場景自帶題庫之結構與中文覆蓋一致性（手寫固定、每題自帶中文、進場取題）。
  const lessonAudit = { places: 0, questions: 0, byArea: {} };
  Object.values(api.areaRegistry).forEach((area) => {
    (area.locations || []).forEach((hotspot) => {
      const lesson = api.sceneConfigFor(hotspot).lesson;
      if (!lesson) return; // 無題庫之場景（房間／商店／出入口）不帶 lesson
      lessonAudit.places += 1;
      lessonAudit.byArea[area.id] = (lessonAudit.byArea[area.id] || 0) + 1;
      const at = `${area.id}/${hotspot.id}`;
      if (!lesson.title) errors.push(`${at} lesson missing title`);
      // issue #149：移除題組 opening/ending 旁白（角色第一人稱台詞即 prompt），故不再檢查 opening/ending/openingZh。
      if (!lesson.area || !lesson.vocabProfile) errors.push(`${at} lesson missing area/vocabProfile (completedLessons/徽章/日誌所需)`);
      if (!Array.isArray(lesson.questions) || !lesson.questions.length) { errors.push(`${at} lesson has no questions`); return; }
      lesson.questions.forEach((q, i) => {
        lessonAudit.questions += 1;
        const where = `${at}#${i + 1}`;
        if (!q.prompt || !q.answer || !Array.isArray(q.choices) || q.choices.length < 2) errors.push(`${where} missing prompt/answer/choices`);
        else if (!q.choices.includes(q.answer)) errors.push(`${where} answer not in choices`);
        // issue #149：words 改由引擎自正解英文導出（不再逐題手寫），故不檢查 words。
        // issue #155：打工正解須以自然應允語句開頭（幫忙請求→公主應允的固定樣式）。
        if (q.answer && !startsWithAckOpener(q.answer)) errors.push(`${where} job answer must open with an acknowledgement (${JOB_ANSWER_OPENERS.slice(0, 8).join("/")}…) — got "${q.answer}"`);
        if (!q.reward || !Number.isFinite(q.reward.coins)) errors.push(`${where} missing reward.coins`);
        if (!q.promptZh) errors.push(`${where} missing promptZh (中文協助所需)`);
        if (!Array.isArray(q.choicesZh) || q.choicesZh.length !== q.choices.length || q.choicesZh.some((z) => !z)) errors.push(`${where} choicesZh incomplete (中文協助所需)`);
      });
    });
  });
  ["castle", "urban", "rural", "wild"].forEach((id) => {
    if (!lessonAudit.byArea[id]) errors.push(`area ${id} has no lesson-bearing places`);
  });

  // issue #135：生活聊天題庫（chatLesson）同採場景自帶題庫契約，納入結構與中文覆蓋一致性審查；
  // 聊天為非交易性回饋，reward.coins 必須為 0（心情→延長遊玩、不發 coins）。
  const chatAudit = { places: 0, questions: 0, byArea: {} };
  Object.values(api.areaRegistry).forEach((area) => {
    (area.locations || []).forEach((hotspot) => {
      const chat = api.sceneConfigFor(hotspot).chatLesson;
      if (!chat) return; // 未開啟聊天之場景不帶 chatLesson
      chatAudit.places += 1;
      chatAudit.byArea[area.id] = (chatAudit.byArea[area.id] || 0) + 1;
      const at = `${area.id}/${hotspot.id}`;
      if (!chat.title) errors.push(`${at} chatLesson missing title`);
      // issue #149：聊天題組同移除 opening/ending 旁白，故不再檢查 opening/ending/openingZh。
      if (!chat.area || !chat.vocabProfile) errors.push(`${at} chatLesson missing area/vocabProfile`);
      if (!Array.isArray(chat.questions) || !chat.questions.length) { errors.push(`${at} chatLesson has no questions`); return; }
      chat.questions.forEach((q, i) => {
        chatAudit.questions += 1;
        const where = `${at} chat#${i + 1}`;
        if (!q.prompt || !q.answer || !Array.isArray(q.choices) || q.choices.length < 2) errors.push(`${where} missing prompt/answer/choices`);
        else if (!q.choices.includes(q.answer)) errors.push(`${where} answer not in choices`);
        // issue #149：words 改由引擎自正解英文導出（不再逐題手寫），故不檢查 words。
        if (!q.reward || !Number.isFinite(q.reward.coins)) errors.push(`${where} missing reward.coins`);
        else if (q.reward.coins !== 0) errors.push(`${where} chat reward.coins must be 0`);
        if (!q.promptZh) errors.push(`${where} missing promptZh (中文協助所需)`);
        if (!Array.isArray(q.choicesZh) || q.choicesZh.length !== q.choices.length || q.choicesZh.some((z) => !z)) errors.push(`${where} choicesZh incomplete (中文協助所需)`);
      });
    });
  });

  const result = document.createElement("pre");
  result.id = "dataAuditResult";
  result.textContent = JSON.stringify({
    test: "data-audit",
    passed: errors.length === 0,
    categoryCounts,
    shopCount: shopLocations.length,
    sceneArtCount: sceneArtSurfaces.length,
    mapActorCount: mapActorSurfaces.length,
    mapContracts,
    sceneBackgroundContract,
    characterRegistry,
    characterScale,
    lessonAudit,
    chatAudit,
    supportedActorMotions: [...supportedActorMotions],
    shops: shopLocations.map((hotspot) => ({
      area: api.areaForHotspot(hotspot),
      id: hotspot.id,
      label: hotspot.label,
      categories: hotspot.shopCategories || []
    })),
    sceneArtSurfaces,
    mapActorSurfaces,
    warnings,
    errors
  });
  document.body.prepend(result);
}

async function collectPaperDollCharacterAudit(api, errors) {
  const registry = api.characterRegistry || {};
  const characters = [];
  const expectedPlayableIds = ["lumi", "yumi", "sol", "rosa"];
  if (!Object.keys(registry).length) {
    errors.push("characterRegistry is empty");
  }
  expectedPlayableIds.forEach((characterId) => {
    if (!registry[characterId]) errors.push(`characterRegistry missing ${characterId}`);
    if (!api.playableVoiceById?.[characterId]) errors.push(`playableVoiceById missing ${characterId}`);
  });
  if (registry.sol?.label !== "Princess Mary" || registry.sol?.defaultName !== "Mary") {
    errors.push("sol stable id is not exposed as Princess Mary");
  }
  const defaultCharacter = api.playableCharacterById(api.defaultActiveCharacterId);
  if (!defaultCharacter?.id) {
    errors.push("default active character is missing");
  }
  const starterItems = (api.shopItems || []).filter((item) => item.storeId === "starter");
  const starterLayerItems = starterItems.filter((item) => item.type === "hairstyle" || item.type === "dress");
  starterLayerItems.forEach((item) => {
    if (!Array.isArray(item.layers)) {
      errors.push(`starter item ${item.id} layers is not an array`);
    }
  });
  const starterIds = new Set(starterItems.map((item) => item.id));
  if (api.normalizeState) {
    const missing = api.normalizeState({});
    const invalid = api.normalizeState({ activeCharacterId: "__missing_character__" });
    if (missing.activeCharacterId !== defaultCharacter?.id) {
      errors.push(`missing activeCharacterId normalizes to ${missing.activeCharacterId}, expected ${defaultCharacter?.id}`);
    }
    if (invalid.activeCharacterId !== defaultCharacter?.id) {
      errors.push(`invalid activeCharacterId normalizes to ${invalid.activeCharacterId}, expected ${defaultCharacter?.id}`);
    }
    const rosa = api.normalizeState({ activeCharacterId: "rosa", playerName: "Rosa" });
    if (rosa.activeCharacterId !== "rosa") {
      errors.push(`rosa activeCharacterId normalizes to ${rosa.activeCharacterId}`);
    }
    const bakedDefault = api.normalizeState({ outfit: { hairstyle: "softBrownHair", dress: "starterPajama" } });
    if (bakedDefault.outfit.hairstyle !== "none" || bakedDefault.outfit.dress !== "none") {
      errors.push("starter baked-base outfit did not normalize to no overlay");
    }
  }
  for (const character of Object.values(registry)) {
    if (!character.id) errors.push("character without id");
    if (!character.baseLayer) errors.push(`${character.id || "character"} has no baseLayer`);
    if (!character.rig?.compatibleWardrobeRig) errors.push(`${character.id || "character"} is not marked wardrobe-compatible`);
    if (character.defaultOutfit?.hairstyle && character.defaultOutfit.hairstyle !== "none" && !starterIds.has(character.defaultOutfit.hairstyle)) {
      errors.push(`${character.id}/defaultOutfit.hairstyle points to non-starter item ${character.defaultOutfit.hairstyle}`);
    }
    if (character.defaultOutfit?.dress && character.defaultOutfit.dress !== "none" && !starterIds.has(character.defaultOutfit.dress)) {
      errors.push(`${character.id}/defaultOutfit.dress points to non-starter item ${character.defaultOutfit.dress}`);
    }
    const assets = {};
    for (const [assetName, src] of Object.entries({ baseLayer: character.baseLayer })) {
      if (!src) continue;
      try {
        const metrics = await imageMetrics(src);
        if (assetName === "baseLayer" && (metrics.width !== 512 || metrics.height !== 768)) {
          errors.push(`${character.id}/${assetName} is ${metrics.width}x${metrics.height}, expected 512x768`);
        }
        if (assetName === "baseLayer" && !metrics.alphaBBox) {
          errors.push(`${character.id}/baseLayer has no alpha content`);
        }
        if (assetName === "baseLayer" && metrics.alphaBBox) {
          const bbox = metrics.alphaBBox;
          const centerX = bbox.left + (bbox.width / 2);
          if (Math.abs(bbox.bottom - 768) > 2) errors.push(`${character.id}/baseLayer foot baseline is ${bbox.bottom}, expected 768`);
          if (Math.abs(bbox.top - 280) > 4) errors.push(`${character.id}/baseLayer top is ${bbox.top}, expected near 280`);
          if (Math.abs(bbox.height - 488) > 4) errors.push(`${character.id}/baseLayer alpha height ${bbox.height}, expected near 488`);
          if (Math.abs(centerX - 256) > 8) errors.push(`${character.id}/baseLayer centerX ${centerX}, expected near 256`);
        }
        assets[assetName] = metrics;
      } catch (error) {
        errors.push(error.message);
      }
    }
    characters.push({
      id: character.id,
      label: character.label,
      naturalHeightCm: character.naturalHeightCm,
      stageScale: character.stageScale,
      rig: character.rig,
      assets
    });
  }
  return {
    defaultActiveCharacterId: api.defaultActiveCharacterId,
    expectedPlayableIds,
    starterLayerItems: starterLayerItems.map((item) => ({
      id: item.id,
      type: item.type,
      layerCount: item.layers?.length || 0,
      layerSlots: (item.layers || []).map((layer) => layer.slot)
    })),
    count: characters.length,
    characters
  };
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function imageMetrics(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let left = canvas.width;
      let top = canvas.height;
      let right = 0;
      let bottom = 0;
      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          const alpha = pixels[((y * canvas.width + x) * 4) + 3];
          if (alpha <= 8) continue;
          if (x < left) left = x;
          if (y < top) top = y;
          if (x + 1 > right) right = x + 1;
          if (y + 1 > bottom) bottom = y + 1;
        }
      }
      resolve({
        src,
        width: image.naturalWidth,
        height: image.naturalHeight,
        alphaBBox: right > left && bottom > top ? { left, top, right, bottom, width: right - left, height: bottom - top } : null
      });
    };
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

function imageNaturalSize(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        src,
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    };
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

async function collectMapContractAudit(api, errors) {
  const contracts = [];
  const mapEntries = [
    {
      scope: "world",
      id: api.worldMap?.id || "world",
      label: api.worldMap?.label || "World Map",
      mapImage: api.worldMap?.mapImage,
      declared: api.worldMap?.imageSize,
      expected: { width: 1024, height: 1536 }
    },
    ...Object.values(api.areaRegistry)
      .filter((area) => area.enabled && area.mapImage)
      .map((area) => ({
        scope: "area",
        id: area.id,
        label: area.label,
        mapImage: area.mapImage,
        declared: area.imageSize,
        expected: { width: 1536, height: 1536 }
      }))
  ];

  for (const entry of mapEntries) {
    let actual = null;
    if (!entry.mapImage) {
      errors.push(`${entry.scope}/${entry.id} has no mapImage`);
    }
    if (entry.declared?.width !== entry.expected.width || entry.declared?.height !== entry.expected.height) {
      errors.push(`${entry.scope}/${entry.id} declares ${entry.declared?.width || 0}x${entry.declared?.height || 0}, expected ${entry.expected.width}x${entry.expected.height}`);
    }
    if (entry.mapImage) {
      try {
        actual = await imageNaturalSize(entry.mapImage);
        if (actual.width !== entry.expected.width || actual.height !== entry.expected.height) {
          errors.push(`${entry.scope}/${entry.id} image is ${actual.width}x${actual.height}, expected ${entry.expected.width}x${entry.expected.height}`);
        }
      } catch (error) {
        errors.push(error.message);
      }
    }
    contracts.push({
      ...entry,
      actual,
      passed: Boolean(actual) &&
        entry.declared?.width === entry.expected.width &&
        entry.declared?.height === entry.expected.height &&
        actual.width === entry.expected.width &&
        actual.height === entry.expected.height
    });
  }
  return contracts;
}

async function collectSceneBackgroundContractAudit(api, errors = []) {
  const target = { width: 1024, height: 1024 };
  const warnings = [];
  const refs = [];
  Object.values(api.areaRegistry).forEach((area) => {
    (area.locations || []).forEach((hotspot) => {
      const config = api.sceneConfigFor(hotspot);
      if (!config.sceneArt?.src) return;
      refs.push({
        area: area.id,
        id: hotspot.id,
        label: hotspot.label,
        src: config.sceneArt.src,
        atlas: config.sceneArt.atlas || ""
      });
    });
  });
  const pending = [];
  const checked = [];
  for (const ref of uniqueBy(refs, (item) => item.src)) {
    try {
      const metrics = await imageNaturalSize(ref.src);
      const matchesTarget = metrics.width === target.width && metrics.height === target.height;
      const record = { ...ref, ...metrics, target, status: matchesTarget ? "passed" : "failed" };
      checked.push(record);
      if (!matchesTarget) {
        pending.push(record);
        errors.push(`${ref.area}/${ref.id} scene background is ${metrics.width}x${metrics.height}, expected ${target.width}x${target.height}`);
      }
    } catch (error) {
      const record = { ...ref, target, status: "failed", error: error.message };
      pending.push(record);
      errors.push(`${ref.area}/${ref.id} scene background failed to load: ${error.message}`);
    }
  }
  return {
    target,
    status: pending.length ? "failed" : "passed",
    checkedCount: checked.length,
    pendingCount: pending.length,
    pending,
    warnings
  };
}

function expectedBodyHeightPx(heightCm, contract) {
  return Math.round((heightCm / contract.fullCanvasHeightCm) * contract.canvasHeight);
}

function assetPathWithoutQuery(src = "") {
  return String(src).split(/[?#]/)[0].toLowerCase();
}

function assertWardrobeBitmapAsset(src, where, errors) {
  const path = assetPathWithoutQuery(src);
  if (!path) {
    errors.push(`${where} missing bitmap asset`);
    return;
  }
  if (path.endsWith(".svg")) {
    errors.push(`${where} uses SVG; wardrobe layer/thumb assets must be GPT-generated PNG/WebP bitmap art`);
  }
  if (!path.endsWith(".webp") && !path.endsWith(".png")) {
    errors.push(`${where} must be PNG/WebP bitmap art, got ${src}`);
  }
}

function numericBounds(bounds = {}) {
  return ["left", "top", "right", "bottom"].every((edge) => Number.isFinite(bounds[edge]));
}

function renderBounds(bounds = {}) {
  return {
    left: bounds.left,
    top: bounds.top,
    right: bounds.right,
    bottom: bounds.bottom
  };
}

function sameRenderBounds(a = {}, b = {}) {
  return ["left", "top", "right", "bottom"].every((edge) => a[edge] === b[edge]);
}

function boxContainsAlpha(safeBox, alphaBox, tolerance = 2) {
  if (!safeBox || !alphaBox) return true;
  return alphaBox.left >= safeBox.left - tolerance &&
    alphaBox.top >= safeBox.top - tolerance &&
    alphaBox.right <= safeBox.right + tolerance &&
    alphaBox.bottom <= safeBox.bottom + tolerance;
}

async function collectCharacterScaleAudit(api, errors, warnings = []) {
  const contract = api.characterScaleContract || {
    canvasWidth: 512,
    canvasHeight: 768,
    groundBaselineY: 768,
    fullCanvasHeightCm: 200,
    assetHeightTolerancePx: 18,
    baselineTolerancePx: 6
  };
  const npcRefs = [];
  Object.values(api.areaRegistry).forEach((area) => {
    (area.locations || []).forEach((hotspot) => {
      const config = api.sceneConfigFor(hotspot);
      if (!config.npcImage) return;
      npcRefs.push({
        area: area.id,
        id: hotspot.id,
        npc: config.npc,
        src: config.npcImage,
        naturalHeightCm: config.npcNaturalHeightCm
      });
    });
  });

  const npcAssets = [];
  for (const ref of uniqueBy(npcRefs, (item) => item.src)) {
    try {
      const metrics = await imageMetrics(ref.src);
      const expectedHeight = Number.isFinite(ref.naturalHeightCm)
        ? expectedBodyHeightPx(ref.naturalHeightCm, contract)
        : null;
      if (metrics.width !== contract.canvasWidth || metrics.height !== contract.canvasHeight) {
        errors.push(`${ref.area}/${ref.id} NPC asset is ${metrics.width}x${metrics.height}, expected ${contract.canvasWidth}x${contract.canvasHeight}`);
      }
      if (!metrics.alphaBBox) {
        errors.push(`${ref.area}/${ref.id} NPC asset has no alpha content`);
      } else {
        const baselineGap = contract.groundBaselineY - metrics.alphaBBox.bottom;
        if (Math.abs(baselineGap) > contract.baselineTolerancePx) {
          errors.push(`${ref.area}/${ref.id} NPC baseline gap ${baselineGap}px exceeds ${contract.baselineTolerancePx}px`);
        }
        if (expectedHeight !== null && Math.abs(metrics.alphaBBox.height - expectedHeight) > contract.assetHeightTolerancePx) {
          errors.push(`${ref.area}/${ref.id} NPC alpha height ${metrics.alphaBBox.height}px differs from ${expectedHeight}px for ${ref.naturalHeightCm}cm`);
        }
      }
      npcAssets.push({ ...ref, expectedHeight, ...metrics });
    } catch (error) {
      errors.push(error.message);
    }
  }

  const paperDoll = [];
  const paperDollRefs = Object.values(api.characterRegistry || {}).map((character) => ({
    id: character.id,
    label: character.label,
    src: character.baseLayer,
    naturalHeightCm: character.naturalHeightCm || contract.lumiNaturalHeightCm || 125
  }));
  if (!paperDollRefs.length && api.paperDollBaseLayer) {
    const fallbackCharacter = api.playableCharacterById?.(api.defaultActiveCharacterId);
    paperDollRefs.push({
      id: fallbackCharacter?.id || api.defaultActiveCharacterId || "lumi",
      label: fallbackCharacter?.label || "Princess",
      src: api.paperDollBaseLayer,
      naturalHeightCm: fallbackCharacter?.naturalHeightCm || contract.lumiNaturalHeightCm || 125
    });
  }
  for (const ref of paperDollRefs) {
    try {
      const metrics = await imageMetrics(ref.src);
      const expectedHeight = expectedBodyHeightPx(ref.naturalHeightCm, contract);
      if (metrics.width !== contract.canvasWidth || metrics.height !== contract.canvasHeight) {
        errors.push(`${ref.id} base asset is ${metrics.width}x${metrics.height}, expected ${contract.canvasWidth}x${contract.canvasHeight}`);
      }
      if (!metrics.alphaBBox) {
        errors.push(`${ref.id} base asset has no alpha content`);
      } else {
        const baselineGap = contract.groundBaselineY - metrics.alphaBBox.bottom;
        if (Math.abs(baselineGap) > contract.baselineTolerancePx) {
          errors.push(`${ref.id} base baseline gap ${baselineGap}px exceeds ${contract.baselineTolerancePx}px`);
        }
        if (Math.abs(metrics.alphaBBox.height - expectedHeight) > contract.assetHeightTolerancePx) {
          errors.push(`${ref.id} base alpha height ${metrics.alphaBBox.height}px differs from ${expectedHeight}px`);
        }
      }
      paperDoll.push({ id: `${ref.id}-base`, expectedHeight, ...metrics });
    } catch (error) {
      errors.push(error.message);
    }
  }

  const wardrobeLayerRefs = [];
  (api.shopItems || []).forEach((item) => {
    if (item.storeId !== "starter") {
      assertWardrobeBitmapAsset(item.image, `${item.id}/thumb`, errors);
    }
    (item.layers || []).forEach((layer, index) => {
      const where = `${item.id}/layer#${index + 1}`;
      const expectedBounds = api.wardrobeLayerBoundsForType?.(item.type) || api.wardrobeLayerBoundsByType?.[item.type];
      assertWardrobeBitmapAsset(layer.src, where, errors);
      if (layer.type !== item.type) errors.push(`${where} type ${layer.type || "missing"} does not match item type ${item.type}`);
      if (!expectedBounds) errors.push(`${where} has no class-level bounds for type ${item.type}`);
      if (!numericBounds(layer.bounds)) errors.push(`${where} has invalid render bounds`);
      if (expectedBounds && !sameRenderBounds(renderBounds(layer.bounds), renderBounds(expectedBounds))) {
        errors.push(`${where} render bounds do not match class-level bounds for ${item.type}`);
      }
      wardrobeLayerRefs.push({ item, layer });
    });
  });

  const layerRefs = uniqueBy(wardrobeLayerRefs, ({ layer }) => layer.src);
  const wardrobeLayers = [];
  for (const { item, layer } of layerRefs) {
    try {
      const metrics = await imageMetrics(layer.src);
      if (metrics.width !== contract.canvasWidth || metrics.height !== contract.canvasHeight) {
        errors.push(`${layer.slot || "wardrobe"} layer ${layer.src} is ${metrics.width}x${metrics.height}, expected ${contract.canvasWidth}x${contract.canvasHeight}`);
      }
      const expectedBounds = api.wardrobeLayerBoundsForType?.(layer.type || item.type);
      if (metrics.alphaBBox && expectedBounds?.safeBox && !boxContainsAlpha(expectedBounds.safeBox, metrics.alphaBBox)) {
        errors.push(`${item.id}/${layer.slot} alpha box ${JSON.stringify(metrics.alphaBBox)} is outside ${item.type} safeBox ${JSON.stringify(expectedBounds.safeBox)}`);
      }
      wardrobeLayers.push({
        itemId: item.id,
        itemType: item.type,
        slot: layer.slot,
        type: layer.type,
        bounds: renderBounds(layer.bounds),
        safeBox: expectedBounds?.safeBox || null,
        ...metrics
      });
    } catch (error) {
      errors.push(error.message);
    }
  }

  return {
    contract,
    npcAssetCount: npcAssets.length,
    paperDollAssetCount: paperDoll.length,
    wardrobeLayerCount: wardrobeLayers.length,
    wardrobeLayerBoundsByType: api.wardrobeLayerBoundsByType || {},
    npcAssets,
    paperDoll,
    wardrobeLayers
  };
}

function runSaveLoadSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "save-load") return;
  const before = JSON.parse(JSON.stringify(api.state));
  const markdown = api.buildSaveMarkdown();
  api.state.coins = 0;
  api.loadMarkdownText(markdown);
  const after = JSON.parse(JSON.stringify(api.state));
  const passed =
    markdown.includes("## Diary") &&
    markdown.includes("LUMINARA_SAVE_JSON") &&
    after.activeCharacterId === before.activeCharacterId &&
    after.coins === before.coins &&
    Math.abs(after.player.x - before.player.x) < 0.01 &&
    Math.abs(after.player.y - before.player.y) < 0.01;
  const result = document.createElement("pre");
  result.id = "selfTestResult";
  result.textContent = JSON.stringify({
    test: "save-load",
    passed,
    markdownLength: markdown.length,
    activeCharacterId: after.activeCharacterId,
    beforeCoins: before.coins,
    afterCoins: after.coins
  });
  document.body.prepend(result);
}

function runVisualQa(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "visual-qa") return;
  const surface = params.get("surface") || "map";
  const place = params.get("place") || "garden";
  if (params.get("fresh") === "1") api.state = api.freshState();
  if (params.get("report") === "1") scheduleVisualQaMetricsReport();
  const hotspot = api.hotspotById(place) || api.hotspotById("garden");
  const areaId = api.areaForHotspot(hotspot);
  const node = api.nodeMapForArea(areaId)[hotspot.node];
  const coinsParam = params.get("coins");
  if (coinsParam !== null) {
    const coins = Number(coinsParam);
    if (Number.isFinite(coins)) api.state.coins = Math.max(0, coins);
  }
  const ownedParam = params.get("owned");
  if (ownedParam) {
    const ownedIds = ownedParam === "all"
      ? api.shopItems.map((item) => item.id)
      : ownedParam.split(",").map((item) => item.trim()).filter(Boolean);
    ownedIds.forEach((itemId) => {
      if (api.itemById(itemId) && !api.state.owned.includes(itemId)) api.state.owned.push(itemId);
    });
  }
  const equipParam = params.get("equip");
  if (equipParam) {
    equipParam.split(",").map((item) => item.trim()).filter(Boolean).forEach((itemId) => {
      const item = api.itemById(itemId);
      if (!item) return;
      if (!api.state.owned.includes(item.id)) api.state.owned.push(item.id);
      if (item.type === "room") {
        api.state.outfit.room = item.id;
      } else {
        api.equipOutfitItem(item);
      }
    });
  }
  // issue #131：視覺 QA 可指定識別色與背景花紋，使截圖具決定性。
  const patternParam = params.get("pattern");
  if (patternParam) api.state.backgroundPattern = api.normalizeBackgroundPattern(patternParam);
  const colorParam = params.get("color");
  if (colorParam) api.state.profileColor = api.normalizeProfileColor(colorParam, api.state.activeCharacterId);

  if (surface === "world-map") {
    api.render();
    api.openWorldMap();
    if (params.get("destination")) api.focusWorld(params.get("destination"));
    return;
  }

  // issue #131：選角畫面（粉彩色盤＋調色器＋背景花紋選擇器＋選角卡半透明識別底色）視覺 QA surface。
  if (surface === "character-select") {
    api.render();
    api.openCharacterSelect({ forced: false });
    return;
  }

  // issue #131：帳號選擇畫面（帳號卡半透明識別底色＋花紋）視覺 QA surface。
  if (surface === "account-select") {
    api.render();
    api.openAccountSelect({ mustChoose: false });
    return;
  }

  // issue #153：既有帳號下「新增公主」之可取消創角（顯示返回鈕、可取消返回帳號選擇）視覺 QA surface。
  if (surface === "create-cancelable") {
    if (api.accounts.list().length === 0) api.accounts.create(); // 確保已有既有帳號 → 新增進入可取消模式
    api.render();
    api.createNewAccount();
    return;
  }

  // issue #153：真正首啟（零帳號）之創角（first-run 鎖定、無返回鈕）視覺 QA surface。
  if (surface === "create-firstrun") {
    api.accounts.list().slice().forEach((account) => api.accounts.remove(account.id)); // 清空所有帳號 → 真正首啟
    api.render();
    api.createNewAccount();
    return;
  }

  if (surface === "castle-map") {
    api.render();
    api.openArea("castle");
    return;
  }

  if (surface === "princess-room-scene") {
    api.render();
    api.openRoomScene(api.hotspotById("princessRoom"));
    return;
  }

  if (surface === "paper-doll-outfit") {
    api.render();
    renderPaperDollOutfitQa(api, params);
    return;
  }

  if (surface === "wardrobe-detail") {
    const requestedItem = api.itemById(params.get("item"));
    const category = params.get("category") || api.categoryForType(requestedItem?.type)?.id || "dresses";
    api.render();
    api.openRoomScene(api.hotspotById("princessRoom"));
    api.openWardrobeDetail(category);
    if (requestedItem && api.state.owned.includes(requestedItem.id)) {
      api.shopPreviewItemId = requestedItem.id;
      api.renderWardrobeDetail(true);
    }
    return;
  }

  if (surface === "urban-map") {
    api.render();
    api.openArea("urban");
    return;
  }

  if (surface === "wild-map") {
    api.render();
    api.openArea("wild");
    return;
  }

  if (surface === "rural-map") {
    api.render();
    api.openArea("rural");
    return;
  }

  if (surface === "map-near") {
    api.state.playerNode = hotspot.node;
    api.state.player = { x: node.x, y: node.y };
    api.state.area = areaId;
    api.render();
    api.changeView(areaId === "castle" ? "home" : "map");
    return;
  }

  if (surface === "quest") {
    api.render();
    api.openQuestAdv(hotspot);
    return;
  }

  // issue #135：生活聊天題（chatLesson）視覺 QA surface，供逐頁審查截圖。
  if (surface === "chat") {
    api.render();
    api.openQuestAdv(hotspot, { bankKey: "chatLesson", mode: "chat" });
    return;
  }

  if (surface === "shop-scene") {
    api.render();
    api.openSceneAdv(hotspot);
    return;
  }

  if (surface === "shop" || surface === "shop-detail") {
    const item = api.itemById(params.get("item"));
    if (item) selectShopCategoryForItem(api, hotspot, item);
    api.render();
    api.openShopDetail(hotspot);
    if (item && api.allowedShopCategories(hotspot).some((category) => api.itemMatchesCategory(item, category)) && !api.state.owned.includes(item.id)) {
      api.shopPreviewItemId = item.id;
      api.renderAdvShop(true);
    }
    return;
  }

  if (surface === "refund-detail") {
    const item = api.itemById(params.get("item")) || api.shopItems.find((candidate) => candidate.storeId === hotspot.id && candidate.cost > 0);
    if (item && !api.state.owned.includes(item.id)) api.state.owned.push(item.id);
    api.render();
    api.openRefundDetail(hotspot);
    if (item && item.storeId === hotspot.id && api.state.owned.includes(item.id)) {
      api.shopPreviewItemId = item.id;
      api.renderRefundDetail(true);
    }
    return;
  }

  if (surface === "shop-sold-out") {
    api.shopItems
      .filter((item) => api.allowedShopCategories(hotspot).some((category) => api.itemMatchesCategory(item, category)))
      .forEach((item) => {
        if (!api.state.owned.includes(item.id)) api.state.owned.push(item.id);
      });
    api.render();
    api.openShopDetail(hotspot);
    return;
  }

  if (surface === "shop-not-enough") {
    const requestedItem = api.itemById(params.get("item"));
    if (requestedItem) selectShopCategoryForItem(api, hotspot, requestedItem);
    api.state.coins = 0;
    api.render();
    api.openShopDetail(hotspot);
    const item = requestedItem || api.shopItems.find((candidate) => api.allowedShopCategories(hotspot).some((category) => api.itemMatchesCategory(candidate, category)) && !api.state.owned.includes(candidate.id));
    if (item) {
      api.shopPreviewItemId = item.id;
      api.renderAdvShop(true);
      api.buyItemInAdv(item);
    }
    return;
  }

  if (surface === "hint") {
    api.render();
    api.openHintAdv(hotspot);
    return;
  }

  if (surface === "shop-feedback") {
    const requestedItem = api.itemById(params.get("item"));
    if (requestedItem) selectShopCategoryForItem(api, hotspot, requestedItem);
    api.render();
    api.openShopDetail(hotspot);
    const item = requestedItem || api.shopItems.find((candidate) => api.allowedShopCategories(hotspot).some((category) => api.itemMatchesCategory(candidate, category)) && !api.state.owned.includes(candidate.id));
    if (item) {
      api.state.coins = Math.max(api.state.coins, item.cost);
      api.shopPreviewItemId = item.id;
      api.renderAdvShop(true);
      api.buyItemInAdv(item);
    }
    return;
  }

  // issue #134：設定頁角色語音區視覺 QA。headless 無平台 voice，注入代表性 mock voices 與示範指定使截圖具決定性。
  if (surface === "settings") {
    if (params.get("mockvoices") !== "0" && "speechSynthesis" in window) {
      const synth = window.speechSynthesis;
      synth.getVoices = () => [
        { name: "Microsoft Zira - English (United States)", lang: "en-US", default: true, voiceURI: "zira" },
        { name: "Microsoft David - English (United States)", lang: "en-US", default: false, voiceURI: "david" },
        { name: "Microsoft Mark - English (United States)", lang: "en-US", default: false, voiceURI: "mark" },
        { name: "Google US English", lang: "en-US", default: false, voiceURI: "google-us" },
        { name: "Microsoft HanHan - Chinese (Taiwan)", lang: "zh-TW", default: false, voiceURI: "hanhan" }
      ];
      api.refreshSpeechVoices?.();
      api.clearVoiceAssignments?.();
      api.setVoiceAssignment?.("male", "", "Microsoft David - English (United States)");
      api.setVoiceAssignment?.("female", "", "Microsoft Zira - English (United States)");
      api.setVoiceAssignment?.("male", "bold", "Microsoft Mark - English (United States)");
    }
    api.render();
    api.openSystemMenu("settings");
    return;
  }

  if (["diary", "english", "save", "about"].includes(surface)) {
    api.render();
    api.openSystemMenu(surface);
    return;
  }

  api.render();
}

function renderPaperDollOutfitQa(api, params) {
  document.querySelector("#paperDollOutfitQa")?.remove();
  document.querySelector("#paperDollOutfitQaStyle")?.remove();
  const item = api.itemById(params.get("item")) || api.itemById(params.get("equip"));
  const surface = document.createElement("main");
  surface.id = "paperDollOutfitQa";
  surface.innerHTML = `
    <section class="paper-doll-outfit-qa-card">
      <div class="paper-doll-outfit-qa-label">
        <strong>${item?.type || "outfit"}</strong>
        <span>${item?.name || item?.id || "Current outfit"}</span>
      </div>
      <span class="paper-doll adv-doll paper-doll-outfit-qa-doll" data-doll="outfit-qa" aria-hidden="true"></span>
    </section>
  `;
  const style = document.createElement("style");
  style.id = "paperDollOutfitQaStyle";
  style.textContent = `
    #paperDollOutfitQa {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: grid;
      place-items: center;
      background:
        linear-gradient(rgba(255, 255, 255, 0.68), rgba(255, 255, 255, 0.68)),
        url("/content-package/areas/castle/assets/scenes/bedroom-1024.webp") center / cover no-repeat;
    }
    .paper-doll-outfit-qa-card {
      position: relative;
      width: min(62vw, 560px);
      height: min(86vh, 760px);
    }
    .paper-doll-outfit-qa-label {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 20;
      display: grid;
      gap: 4px;
      padding: 10px 14px;
      border-radius: 8px;
      background: rgba(48, 35, 54, 0.82);
      color: white;
      font: 700 15px/1.2 system-ui, sans-serif;
      box-shadow: 0 8px 20px rgba(40, 28, 48, 0.24);
    }
    .paper-doll-outfit-qa-label span {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.84);
    }
    .paper-doll-outfit-qa-doll {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
  `;
  document.head.append(style);
  document.body.append(surface);
  api.render();
}

function selectShopCategoryForItem(api, hotspot, item) {
  const category = api.allowedShopCategories(hotspot).find((candidate) => api.itemMatchesCategory(item, candidate))
    || api.categoryForType(item.type)?.id;
  if (category) api.shopCategory = category;
}

function scheduleVisualQaMetricsReport() {
  window.setTimeout(() => {
    const existing = document.querySelector("#visualQaMetrics");
    existing?.remove();
    const rectFor = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom)
      };
    };
    const buttonInfo = (selector) => [...document.querySelectorAll(selector)].map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        text: element.textContent.trim(),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom)
      };
    });
    const rows = [...document.querySelectorAll("#advShopGrid .item-panel-row")].map((row) => {
      const rowRect = row.getBoundingClientRect();
      const card = row.querySelector(".item-panel-card")?.getBoundingClientRect();
      const preview = row.querySelector(".item-preview")?.getBoundingClientRect();
      const action = row.querySelector(".item-panel-action")?.getBoundingClientRect();
      return {
        text: row.textContent.trim().replace(/\s+/g, " "),
        row: { width: Math.round(rowRect.width), height: Math.round(rowRect.height), bottom: Math.round(rowRect.bottom) },
        card: card ? { width: Math.round(card.width), height: Math.round(card.height) } : null,
        preview: preview ? { width: Math.round(preview.width), height: Math.round(preview.height) } : null,
        action: action ? { width: Math.round(action.width), height: Math.round(action.height) } : null
      };
    });
    const visualHeight = window.visualViewport?.height || window.innerHeight;
    const portraits = rectFor(".adv-portraits");
    const box = rectFor(".adv-box");
    const princess = rectFor(".adv-princess");
    const npc = rectFor(".adv-npc");
    const boxStyle = document.querySelector(".adv-box")
      ? getComputedStyle(document.querySelector(".adv-box"))
      : null;
    const overlapRatio = (target, cover) => {
      if (!target || !cover) return null;
      const overlapWidth = Math.max(0, Math.min(target.x + target.width, cover.x + cover.width) - Math.max(target.x, cover.x));
      const overlapHeight = Math.max(0, Math.min(target.y + target.height, cover.y + cover.height) - Math.max(target.y, cover.y));
      const targetArea = target.width * target.height;
      if (!targetArea) return null;
      return Number(((overlapWidth * overlapHeight) / targetArea).toFixed(3));
    };
    const footerButtons = buttonInfo("#advActionFooter .choice-button");
    const metrics = {
      viewport: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        clientHeight: document.documentElement.clientHeight,
        visualWidth: window.visualViewport?.width,
        visualHeight,
        dpr: window.devicePixelRatio
      },
      mode: document.querySelector("#advScene")?.dataset.mode || "",
      activeView: document.querySelector(".view.active")?.id || "",
      title: document.querySelector("#advTitle")?.textContent || "",
      speaker: document.querySelector("#advSpeaker")?.textContent || "",
      scene: rectFor("#advScene"),
      castleStage: rectFor("#castleStage"),
      worldStage: rectFor("#worldStage"),
      mapStage: rectFor("#mapStage"),
      mapMarkers: buttonInfo("#castleMarkerLayer .hotspot, #worldMarkerLayer .hotspot, #hotspotLayer .hotspot"),
      portraits,
      princess,
      npc,
      box,
      dialogVisual: boxStyle ? {
        background: boxStyle.background,
        backgroundColor: boxStyle.backgroundColor,
        backdropFilter: boxStyle.backdropFilter || boxStyle.webkitBackdropFilter || "",
        boxShadow: boxStyle.boxShadow,
        princessOverlapRatio: overlapRatio(princess, box),
        npcOverlapRatio: overlapRatio(npc, box)
      } : null,
      stagePanelRatio: portraits && box ? Number((portraits.height / box.height).toFixed(2)) : null,
      choices: buttonInfo("#choiceList .choice-button"),
      footerButtons,
      rows,
      footerVisible: footerButtons.every((button) => button.top >= 0 && button.bottom <= visualHeight),
      hasBack: footerButtons.some((button) => /Back/.test(button.text)),
      hasLeave: footerButtons.some((button) => /Leave/.test(button.text)),
      tryOnActive: Boolean(document.querySelector(".adv-doll.try-on-active")),
      version: document.querySelector("#versionValue")?.textContent || "",
      build: document.querySelector("#buildDateValue")?.textContent || ""
    };
    const report = document.createElement("pre");
    report.id = "visualQaMetrics";
    report.hidden = true;
    report.style.display = "none";
    report.textContent = JSON.stringify(metrics);
    document.body.prepend(report);
  }, 120);
}

function runMonkeyTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "monkey") return;
  const errors = [];
  const actions = [
    () => api.changeView(["home", "map"][Math.floor(Math.random() * 2)]),
    () => api.openSystemMenu(["diary", "settings", "english", "save"][Math.floor(Math.random() * 4)]),
    () => api.closeSystemMenu(),
    () => api.moveOnMap(1, 0),
    () => api.moveOnMap(-1, 0),
    () => api.moveOnMap(0, 1),
    () => api.moveOnMap(0, -1),
    () => api.interactNearby(),
    () => api.closeAdv(),
    () => {
      const buttons = [...api.elements.choiceList.querySelectorAll("button")].filter((button) => !button.disabled);
      if (buttons.length) buttons[Math.floor(Math.random() * buttons.length)].click();
    },
    () => {
      const affordable = api.shopItems.filter((item) => !api.state.owned.includes(item.id) && api.state.coins >= item.cost);
      if (affordable.length) api.buyItemInAdv(affordable[Math.floor(Math.random() * affordable.length)]);
    },
    () => {
      const owned = api.shopItems.filter((item) => api.state.owned.includes(item.id));
      if (owned.length) api.toggleEquip(owned[Math.floor(Math.random() * owned.length)]);
    },
    () => {
      const visibleButtons = [...document.querySelectorAll("button")].filter((button) => {
        const rect = button.getBoundingClientRect();
        const style = getComputedStyle(button);
        const nativeDialogButtons = new Set(["saveButton", "loadButton", "clearDiaryButton", "resetButton"]);
        return !nativeDialogButtons.has(button.id) && !button.disabled && rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      });
      if (visibleButtons.length) visibleButtons[Math.floor(Math.random() * visibleButtons.length)].click();
    },
    () => {
      const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", " ", "g", "1", "2", "3", "Escape"];
      document.dispatchEvent(new KeyboardEvent("keydown", {
        key: keys[Math.floor(Math.random() * keys.length)],
        bubbles: true
      }));
    }
  ];

  for (let index = 0; index < 300; index += 1) {
    try {
      actions[Math.floor(Math.random() * actions.length)]();
      if (api.state.coins < 0) errors.push("coins below zero");
      if (!api.state.player || !api.isWalkable(api.state.player.x, api.state.player.y)) errors.push("invalid player position");
      Object.entries(api.state.outfit).forEach(([slot, itemId]) => {
        if (itemId !== "none" && !api.state.owned.includes(itemId)) errors.push(`unowned equipped ${slot}:${itemId}`);
      });
      if (api.$$(".view.active").length !== 1) errors.push("active view count is not one");
    } catch (error) {
      errors.push(error.message);
    }
  }
  api.closeAdv();
  api.changeView("home");
  const result = document.createElement("pre");
  result.id = "monkeyTestResult";
  result.textContent = JSON.stringify({
    test: "monkey",
    passed: errors.length === 0,
    steps: 300,
    errors: [...new Set(errors)].slice(0, 10),
    coins: api.state.coins,
    playerNode: api.state.playerNode,
    activeQuest: api.state.activeQuest?.place || null,
    activeViews: api.$$(".view.active").length
  });
  document.body.prepend(result);
}
