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
  runHelpRewardSelfTest(api);
  runCharacterVoiceSelfTest(api);
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
    // 7) 帳號數回到 baseline（測試自我清理）。
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
function runHelpRewardSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "help-reward") return;
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

    // E) 跨地區中文覆蓋：每區一處應渲染題目中文鈕與 4 個選項中文鈕
    for (const [area, p] of [["castle", "kingHall"], ["urban", "garden"], ["rural", "mine"], ["wild", "elfGlade"]]) {
      openOne(p);
      const zhCount = api.elements.choiceList.querySelectorAll(".choice-audio-button.zh").length;
      const promptZhHidden = document.getElementById("speakPromptButtonZh").hidden;
      if (zhCount !== 4) errors.push(`${area}/${p}: zh choice buttons ${zhCount}, expected 4`);
      if (promptZhHidden) errors.push(`${area}/${p}: prompt zh button hidden (missing openingZh)`);
    }

    api.closeAdv();
  } catch (error) {
    errors.push(error.message);
  }
  const result = document.createElement("pre");
  result.id = "helpRewardTestResult";
  result.textContent = JSON.stringify({
    test: "help-reward",
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
  const shopLocations = Object.values(api.areaRegistry)
    .flatMap((area) => area.locations || [])
    .filter((hotspot) => hotspot.kind === "shop");
  const shopIds = new Set(shopLocations.map((hotspot) => hotspot.id));
  const categoryCounts = Object.fromEntries(api.categories.map((category) => [
    category.id,
    api.shopItems.filter((item) => item.cost > 0 && api.itemMatchesCategory(item, category.id)).length
  ]));
  const errors = [];
  const warnings = [];
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
  if (market?.kind === "shop") errors.push("market is still a shop");
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
  const characterScale = await collectCharacterScaleAudit(api, errors);

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
  if (!Object.keys(registry).length) {
    errors.push("characterRegistry is empty");
  }
  const defaultCharacter = api.playableCharacterById(api.defaultActiveCharacterId);
  if (!defaultCharacter?.id) {
    errors.push("default active character is missing");
  }
  if (api.normalizeState) {
    const missing = api.normalizeState({});
    const invalid = api.normalizeState({ activeCharacterId: "__missing_character__" });
    if (missing.activeCharacterId !== defaultCharacter?.id) {
      errors.push(`missing activeCharacterId normalizes to ${missing.activeCharacterId}, expected ${defaultCharacter?.id}`);
    }
    if (invalid.activeCharacterId !== defaultCharacter?.id) {
      errors.push(`invalid activeCharacterId normalizes to ${invalid.activeCharacterId}, expected ${defaultCharacter?.id}`);
    }
  }
  for (const character of Object.values(registry)) {
    if (!character.id) errors.push("character without id");
    if (!character.baseLayer) errors.push(`${character.id || "character"} has no baseLayer`);
    if (!character.thumbImage) errors.push(`${character.id || "character"} has no thumbImage`);
    if (!character.rig?.compatibleWardrobeRig) errors.push(`${character.id || "character"} is not marked wardrobe-compatible`);
    const assets = {};
    for (const [assetName, src] of Object.entries({ baseLayer: character.baseLayer, thumbImage: character.thumbImage })) {
      if (!src) continue;
      try {
        const metrics = await imageMetrics(src);
        if (assetName === "baseLayer" && (metrics.width !== 512 || metrics.height !== 768)) {
          errors.push(`${character.id}/${assetName} is ${metrics.width}x${metrics.height}, expected 512x768`);
        }
        if (assetName === "baseLayer" && !metrics.alphaBBox) {
          errors.push(`${character.id}/baseLayer has no alpha content`);
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

async function collectCharacterScaleAudit(api, errors) {
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

  const layerRefs = uniqueBy(api.shopItems.flatMap((item) => item.layers || []), (layer) => layer.src);
  const wardrobeLayers = [];
  for (const layer of layerRefs) {
    try {
      const metrics = await imageMetrics(layer.src);
      if (metrics.width !== contract.canvasWidth || metrics.height !== contract.canvasHeight) {
        errors.push(`${layer.slot || "wardrobe"} layer ${layer.src} is ${metrics.width}x${metrics.height}, expected ${contract.canvasWidth}x${contract.canvasHeight}`);
      }
      wardrobeLayers.push({ slot: layer.slot, ...metrics });
    } catch (error) {
      errors.push(error.message);
    }
  }

  return {
    contract,
    npcAssetCount: npcAssets.length,
    paperDollAssetCount: paperDoll.length,
    wardrobeLayerCount: wardrobeLayers.length,
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
    !markdown.includes("OPENAI_API_KEY") &&
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

  if (surface === "world-map") {
    api.render();
    api.openWorldMap();
    if (params.get("destination")) api.focusWorld(params.get("destination"));
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

  if (["diary", "settings", "english", "save"].includes(surface)) {
    api.render();
    api.openSystemMenu(surface);
    return;
  }

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
    () => api.showHelp(),
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
