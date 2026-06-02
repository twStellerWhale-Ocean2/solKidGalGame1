export function installTestingHooks(api) {
  window.LuminaraTest = {
    exportMarkdown: api.buildSaveMarkdown,
    importMarkdown: api.loadMarkdownText,
    getState: () => JSON.parse(JSON.stringify(api.state)),
    setDifficulty: (difficulty) => {
      if (!api.difficultyConfig[difficulty]) throw new Error("Unsupported difficulty");
      api.state.difficulty = Number(difficulty);
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
    buy: (itemId) => api.buyItemInAdv(api.itemById(itemId))
  };

  runSaveLoadSelfTest(api);
  runVisualQa(api);
  runMonkeyTest(api);
}

function runSaveLoadSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "save-load") return;
  const before = JSON.parse(JSON.stringify(api.state));
  const markdown = api.buildSaveMarkdown();
  const changedDifficulty = before.difficulty === 1000 ? 100 : 1000;
  api.state.difficulty = changedDifficulty;
  api.state.coins = 0;
  api.loadMarkdownText(markdown);
  const after = JSON.parse(JSON.stringify(api.state));
  const passed =
    markdown.includes("## Diary") &&
    markdown.includes("LUMINARA_SAVE_JSON") &&
    !markdown.includes("OPENAI_API_KEY") &&
    after.difficulty === before.difficulty &&
    after.coins === before.coins &&
    after.activeQuest.place === before.activeQuest.place &&
    Math.abs(after.player.x - before.player.x) < 0.01 &&
    Math.abs(after.player.y - before.player.y) < 0.01;
  const result = document.createElement("pre");
  result.id = "selfTestResult";
  result.textContent = JSON.stringify({
    test: "save-load",
    passed,
    markdownLength: markdown.length,
    beforeDifficulty: before.difficulty,
    afterDifficulty: after.difficulty,
    beforeCoins: before.coins,
    afterCoins: after.coins
  });
  document.body.prepend(result);
}

function runVisualQa(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "visual-qa") return;
  const surface = params.get("surface") || "map";
  const place = params.get("place") || api.state.activeQuest?.place || "garden";
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
        api.state.outfit[item.type] = item.id;
      }
    });
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
    api.render();
    api.openRoomScene(api.hotspotById("princessRoom"));
    api.openWardrobeDetail(params.get("category") || "outfit");
    return;
  }

  if (surface === "kingdom-map") {
    api.render();
    api.openArea("kingdom");
    return;
  }

  if (surface === "forest-map") {
    api.render();
    api.openArea("forest");
    return;
  }

  if (surface === "map-near") {
    api.state.activeQuest = api.createQuestForPlace(hotspot.id);
    api.state.playerNode = hotspot.node;
    api.state.player = { x: node.x, y: node.y };
    api.state.area = areaId;
    api.render();
    api.changeView(areaId === "castle" ? "home" : "map");
    return;
  }

  if (surface === "quest") {
    api.state.activeQuest = api.createQuestForPlace(hotspot.id);
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
    api.render();
    api.openShopDetail(hotspot);
    const item = api.itemById(params.get("item"));
    if (item && api.allowedShopCategories(hotspot).includes(item.type) && !api.state.owned.includes(item.id)) {
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
      .filter((item) => api.allowedShopCategories(hotspot).includes(item.type))
      .forEach((item) => {
        if (!api.state.owned.includes(item.id)) api.state.owned.push(item.id);
      });
    api.render();
    api.openShopDetail(hotspot);
    return;
  }

  if (surface === "shop-not-enough") {
    api.state.coins = 0;
    api.render();
    api.openShopDetail(hotspot);
    const item = api.itemById(params.get("item")) || api.shopItems.find((candidate) => api.allowedShopCategories(hotspot).includes(candidate.type) && !api.state.owned.includes(candidate.id));
    if (item) {
      api.shopPreviewItemId = item.id;
      api.renderAdvShop(true);
      api.buyItemInAdv(item);
    }
    return;
  }

  if (surface === "hint") {
    api.state.activeQuest = api.createRandomQuest(hotspot.id);
    api.render();
    api.openHintAdv(hotspot);
    return;
  }

  if (surface === "shop-feedback") {
    api.render();
    api.openShopDetail(hotspot);
    const item = api.itemById(params.get("item")) || api.shopItems.find((candidate) => api.allowedShopCategories(hotspot).includes(candidate.type) && !api.state.owned.includes(candidate.id));
    if (item) {
      api.state.coins = Math.max(api.state.coins, item.cost);
      api.shopPreviewItemId = item.id;
      api.renderAdvShop(true);
      api.buyItemInAdv(item);
    }
    return;
  }

  if (["diary", "settings", "save"].includes(surface)) {
    api.render();
    api.openSystemMenu(surface);
    return;
  }

  api.render();
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
      title: document.querySelector("#advTitle")?.textContent || "",
      speaker: document.querySelector("#advSpeaker")?.textContent || "",
      scene: rectFor("#advScene"),
      portraits,
      box,
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
    () => api.openSystemMenu(["diary", "settings", "save"][Math.floor(Math.random() * 3)]),
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
      if (!api.state.activeQuest || !api.hotspotById(api.state.activeQuest.place)) errors.push("invalid active quest");
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
    activeQuest: api.state.activeQuest?.place,
    activeViews: api.$$(".view.active").length
  });
  document.body.prepend(result);
}
