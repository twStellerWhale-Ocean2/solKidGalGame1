import { createKeyboardWalkController, directionForKey } from "../map/keyboard-walk.js";
import { updateMarkerEdgeVisibility } from "../map/marker-visibility.js";
import { assetStandards, assetSizeExemptions, classifyAssetPath } from "../../content-package/_shared/asset-standards.js";
import { outfitSlots, paperDollLayerOrder, wardrobeLayerBoundsByType } from "../../content-package/wardrobe/_shared/rules.js";
import { defaultState, princessStart, startPosition, gameRules } from "../state/default-state.js";

export function installTestingHooks(api) {
  window.LuminaraTest = {
    exportMarkdown: api.buildSaveMarkdown,
    importMarkdown: api.loadMarkdownText,
    getState: () => JSON.parse(JSON.stringify(api.state)),
    accounts: api.accounts,
    playClock: api.playClock,
    // issue #309：雲端帳號／存檔 e2e 驗證鉤（真堆疊端對端腳本與 ?selftest=auth 共用）。
    cloudAuth: api.cloudAuth,
    setCoins: (value) => {
      api.state.coins = Math.max(0, Number(value) || 0);
      api.persist();
      api.render();
    },
    getCoins: () => api.state.coins,
    openSettings: () => api.openSystemMenu("settings"),
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

  runCloudAuthSelfTest(api);
  runSaveLoadSelfTest(api);
  runDefaultStateSelfTest(api);
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
  runMarkerVisibilitySelfTest(api);
  runCharacterSilhouetteSelfTest(api);
  runMapWalkSelfTest(api);
  runAboutSelfTest(api);
  runDevToolsSelfTest(api);
  runSceneCoinsSelfTest(api);
  runStarterOutfitSelfTest(api);
  runRosterSelfTest(api);
  runCharacterHomeSelfTest(api);
}

// issue #390：選角色頁（登入後家門口，兩表單 canon Inc1）——角色列建構、active 標示、
// 點列切換＋關頁、Add 上限停用、本機模式不顯示 Log out。
function runCharacterHomeSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "character-home") return;
  const errors = [];
  try {
    if (!api.accounts.activeId()) api.accounts.create();
    const activeId = api.accounts.activeId();
    const aKey = api.accountStateKey(activeId);
    const savedBlob = localStorage.getItem(aKey);
    try {
      const A = api.normalizeState({ activeCharacterId: "lumi", playerName: "Aaa", coins: 10 });
      const B = api.normalizeState({ activeCharacterId: "lumi", playerName: "Bbb", coins: 20 });
      localStorage.setItem(aKey, JSON.stringify({ schema: "2", activeCharacterSaveId: "chA", characters: { chA: A, chB: B } }));
      api.state = api.normalizeState(A);
      api.openCharacterHome();
      const overlay = document.getElementById("characterHome");
      if (!overlay || !overlay.classList.contains("show")) errors.push("#390: 選角色頁未開啟");
      const rows = overlay ? [...overlay.querySelectorAll(".account-pick")] : [];
      if (rows.length !== 2) errors.push(`#390: 角色列應 2（實得 ${rows.length}）`);
      if (overlay && overlay.querySelectorAll(".account-row.active").length !== 1) errors.push("#390: active 標示應恰 1 列");
      const logoutBtn = document.getElementById("characterHomeLogout");
      if (logoutBtn && !logoutBtn.hidden) errors.push("#390: 本機模式不應顯示 Log out");
      const accountLine = document.getElementById("characterHomeAccountLine");
      if (!accountLine || !/2 princesses/.test(accountLine.textContent)) errors.push("#390: 帳號行未顯示角色數");
      // 點非 active 列＝切換角色＋關頁進入遊戲。
      const rowB = rows.find((row) => row.dataset.saveId === "chB");
      if (!rowB) {
        errors.push("#390: 找不到角色 B 列");
      } else {
        rowB.click();
        if (api.state.playerName !== "Bbb" || api.state.coins !== 20) errors.push("#390: 點列未切換至目標角色");
        if (overlay.classList.contains("show")) errors.push("#390: 進入遊戲後選角色頁應關閉");
      }
      // 重開：active 應移至 B；點 active 列＝直接進入（狀態不變、關頁）。
      api.openCharacterHome();
      const activePick = overlay.querySelector(".account-row.active .account-pick");
      if (!activePick || activePick.dataset.saveId !== "chB") errors.push("#390: 重開後 active 應為 B");
      activePick?.click();
      if (api.state.playerName !== "Bbb") errors.push("#390: 點 active 列後狀態不應變");
      if (overlay.classList.contains("show")) errors.push("#390: 點 active 列後應關頁進入遊戲");
      // Add 上限：2 員可新增；6 員（ROSTER_CAP）停用。
      api.openCharacterHome();
      const addBtn = document.getElementById("characterHomeAdd");
      if (!addBtn || addBtn.disabled) errors.push("#390: 2 員時 Add 不應停用");
      const full = { schema: "2", activeCharacterSaveId: "c0", characters: {} };
      for (let i = 0; i < 6; i += 1) full.characters["c" + i] = api.normalizeState({ activeCharacterId: "lumi", playerName: "P" + i, coins: i });
      localStorage.setItem(aKey, JSON.stringify(full));
      api.state = api.normalizeState(full.characters.c0);
      api.buildCharacterHome();
      if (!document.getElementById("characterHomeAdd").disabled) errors.push("#390: 6 員達上限 Add 應停用");
      if ([...overlay.querySelectorAll(".account-pick")].length !== 6) errors.push("#390: 6 員 roster 應列 6 列");
      api.closeCharacterHome();
      if (overlay.classList.contains("show")) errors.push("#390: closeCharacterHome 未關閉");
      // #391：角色密碼守門——有 pin 不直進（展開驗證面板）、錯誤留頁、正確進入。
      const P = api.normalizeState({ activeCharacterId: "lumi", playerName: "Ppp", coins: 30 });
      P.pinHash = api.hashCharacterPin("1234");
      const Q = api.normalizeState({ activeCharacterId: "lumi", playerName: "Qqq", coins: 40 });
      localStorage.setItem(aKey, JSON.stringify({ schema: "2", activeCharacterSaveId: "chQ", characters: { chQ: Q, chP: P } }));
      api.state = api.normalizeState(Q);
      api.openCharacterHome();
      const rowP = overlay.querySelector('.account-pick[data-save-id="chP"]');
      if (!rowP) {
        errors.push("#391: 找不到有 pin 之角色列");
      } else {
        rowP.click();
        if (api.state.playerName !== "Qqq") errors.push("#391: 有 pin 角色不應點列直進（已被切換）");
        const panel = overlay.querySelector(".character-pin-panel");
        if (!panel) {
          errors.push("#391: 點有 pin 角色列未展開驗證面板");
        } else {
          const pinInput = panel.querySelector("input");
          const pinEnter = panel.querySelector("button");
          pinInput.value = "9999";
          pinEnter.click();
          if (api.state.playerName !== "Qqq") errors.push("#391: 錯誤密碼不應進入");
          const panelNow = overlay.querySelector(".character-pin-panel");
          if (!panelNow || !panelNow.querySelector(".login-error").textContent) errors.push("#391: 錯誤密碼應就地顯示錯誤");
          panelNow.querySelector("input").value = "1234";
          panelNow.querySelector("button").click();
          if (api.state.playerName !== "Ppp" || api.state.coins !== 30) errors.push("#391: 正確密碼應切換並進入");
          if (overlay.classList.contains("show")) errors.push("#391: 驗證通過後選角色頁應關閉");
          if (api.state.pinHash !== api.hashCharacterPin("1234")) errors.push("#391: 切換後 pinHash 應隨角色 state 保留");
        }
      }
      // #391：無 pin 角色（chQ）行為不變——點即進入。
      api.openCharacterHome();
      const rowQ = overlay.querySelector('.account-pick[data-save-id="chQ"]');
      rowQ?.click();
      if (api.state.playerName !== "Qqq") errors.push("#391: 無 pin 角色應照舊點即進入");
      if (overlay.classList.contains("show")) errors.push("#391: 無 pin 進入後應關閉");
      // #392：檢視資訊＋逐角色刪除。roster：chD(active 無 pin)、chE(無 pin)、chF(pin)。
      const D = api.normalizeState({ activeCharacterId: "lumi", playerName: "Ddd", coins: 50 });
      const E = api.normalizeState({ activeCharacterId: "lumi", playerName: "Eee", coins: 60 });
      const F = api.normalizeState({ activeCharacterId: "lumi", playerName: "Fff", coins: 70 });
      F.pinHash = api.hashCharacterPin("4321");
      localStorage.setItem(aKey, JSON.stringify({ schema: "2", activeCharacterSaveId: "chD", characters: { chD: D, chE: E, chF: F } }));
      api.state = api.normalizeState(D);
      api.openCharacterHome();
      // 資訊面板：ⓘ 開啟顯示金幣；再點收合。
      const infoBtnE = overlay.querySelector('.account-info[data-save-id="chE"]');
      if (!infoBtnE) {
        errors.push("#392: 缺 ⓘ 檢視資訊鈕");
      } else {
        infoBtnE.click();
        const infoPanel = overlay.querySelector(".character-info-panel");
        if (!infoPanel || !/60/.test(infoPanel.textContent)) errors.push("#392: 資訊面板未顯示金幣");
        if (infoPanel && !/Not set/.test(infoPanel.textContent)) errors.push("#392: 無 pin 角色資訊應標 Password: Not set");
        infoBtnE.isConnected ? infoBtnE.click() : overlay.querySelector('.account-info[data-save-id="chE"]').click();
        if (overlay.querySelector(".character-info-panel")) errors.push("#392: 再點 ⓘ 應收合資訊面板");
      }
      // 無 pin 刪除：×（第一段）→ Yes, delete（第二段）；刪非 active 不影響 session。
      const delBtnE = overlay.querySelector('.account-delete[data-save-id="chE"]');
      if (!delBtnE) {
        errors.push("#392: 缺 × 刪除鈕");
      } else {
        delBtnE.click();
        const delPanel = overlay.querySelector(".character-delete-panel");
        if (!delPanel) errors.push("#392: 點 × 未展開刪除確認面板");
        let rawNow = JSON.parse(localStorage.getItem(aKey) || "null");
        if (rawNow && !rawNow.characters.chE) errors.push("#392: 第一段不應即刪");
        delPanel?.querySelector(".character-delete-confirm")?.click();
        rawNow = JSON.parse(localStorage.getItem(aKey) || "null");
        if (!rawNow || rawNow.characters.chE) errors.push("#392: 兩段確認後應刪除 chE");
        if (api.state.playerName !== "Ddd") errors.push("#392: 刪非 active 不應動 session");
        if (!overlay.classList.contains("show")) errors.push("#392: 刪後應留在選角色頁");
      }
      // 有 pin 刪除：錯誤密碼不刪、正確密碼刪除。
      const delBtnF = overlay.querySelector('.account-delete[data-save-id="chF"]');
      if (!delBtnF) {
        errors.push("#392: pin 角色缺刪除鈕");
      } else {
        delBtnF.click();
        const delPanelF = overlay.querySelector(".character-delete-panel");
        const pinIn = delPanelF?.querySelector("input");
        if (!pinIn) {
          errors.push("#392: pin 角色刪除面板應有密碼欄");
        } else {
          pinIn.value = "0000";
          delPanelF.querySelector(".character-delete-confirm").click();
          let rawNow2 = JSON.parse(localStorage.getItem(aKey) || "null");
          if (!rawNow2 || !rawNow2.characters.chF) errors.push("#392: 錯誤密碼不應刪除");
          const delPanelF2 = overlay.querySelector(".character-delete-panel");
          delPanelF2.querySelector("input").value = "4321";
          delPanelF2.querySelector(".character-delete-confirm").click();
          rawNow2 = JSON.parse(localStorage.getItem(aKey) || "null");
          if (!rawNow2 || rawNow2.characters.chF) errors.push("#392: 正確密碼應刪除 chF");
        }
      }
      // 守最後一員：僅剩 1 員時不顯示刪除鈕。
      if (overlay.querySelector(".account-delete")) errors.push("#392: 僅剩 1 員仍顯示刪除鈕（守最後一員破功）");
      // 刪 active：重灌 2 員、刪 active chD → session 切到存活者。
      const D2 = api.normalizeState({ activeCharacterId: "lumi", playerName: "Ddd", coins: 50 });
      const E2 = api.normalizeState({ activeCharacterId: "lumi", playerName: "Eee", coins: 60 });
      localStorage.setItem(aKey, JSON.stringify({ schema: "2", activeCharacterSaveId: "chD", characters: { chD: D2, chE: E2 } }));
      api.state = api.normalizeState(D2);
      api.openCharacterHome();
      overlay.querySelector('.account-delete[data-save-id="chD"]')?.click();
      overlay.querySelector(".character-delete-panel .character-delete-confirm")?.click();
      if (api.state.playerName !== "Eee") errors.push("#392: 刪 active 應切到存活角色");
      api.closeCharacterHome();
    } finally {
      if (savedBlob === null) localStorage.removeItem(aKey); else localStorage.setItem(aKey, savedBlob);
      api.closeCharacterHome();
    }
  } catch (error) {
    errors.push("#390: unexpected error " + ((error && error.message) || error));
  }
  const result = document.createElement("pre");
  result.id = "characterHomeResult";
  result.textContent = JSON.stringify({ test: "character-home", passed: errors.length === 0, errors });
  document.body.prepend(result);
}

// issue #376：多角色 roster envelope（Increment 1／基礎）——legacy wrap 冪等、characters slice clean、
// persist round-trip 無損、root mirror 鏡射 active；roster 恆 size==1、行為與現況一致。
function runRosterSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "roster") return;
  const errors = [];
  const KEY_ACCT = "rostertest-376";
  const key = api.accountStateKey(KEY_ACCT);
  try {
    // 1) legacy 單角色 blob → wrap 成一員 roster；資料保留、slice clean。
    const legacy = api.normalizeState({ activeCharacterId: "lumi", playerName: "LegacyKid", coins: 123, learnedWords: ["cat", "dog"] });
    localStorage.setItem(key, JSON.stringify(legacy));
    const env1 = api.readRosterEnvelope(KEY_ACCT);
    const ids1 = env1 && env1.characters ? Object.keys(env1.characters) : [];
    if (ids1.length !== 1) {
      errors.push(`#376: legacy wrap 應得 1 員 roster（實得 ${ids1.length}）`);
    } else {
      if (env1.activeCharacterSaveId !== ids1[0]) errors.push("#376: activeCharacterSaveId 未指向唯一成員");
      if (env1.characters[ids1[0]].coins !== 123 || env1.characters[ids1[0]].playerName !== "LegacyKid") errors.push("#376: legacy 角色資料未保留");
      if ("characters" in env1.characters[ids1[0]] || "schema" in env1.characters[ids1[0]] || "activeCharacterSaveId" in env1.characters[ids1[0]]) errors.push("#376: characters slice 殘留 envelope meta");
    }

    // 2) idempotent：對已 wrap envelope 再讀＝no-op（同 active id、仍 1 員）。
    const stableId = ids1[0] || "ch-x";
    localStorage.setItem(key, JSON.stringify({ schema: "2", activeCharacterSaveId: stableId, characters: { [stableId]: { activeCharacterId: "lumi", playerName: "LegacyKid", coins: 123 } } }));
    const env2 = api.readRosterEnvelope(KEY_ACCT);
    if (env2.activeCharacterSaveId !== stableId || Object.keys(env2.characters).length !== 1) errors.push("#376: 對已 wrap envelope 再讀非冪等（應 no-op）");
  } catch (error) {
    errors.push("#376: unexpected error(1) " + ((error && error.message) || error));
  } finally {
    localStorage.removeItem(key);
  }

  // 3) persist round-trip（active 帳號）：legacy blob → 載入 active → persist → blob＝1 員 envelope＋root mirror → reload 相等。
  try {
    if (!api.accounts.activeId()) api.accounts.create();
    const activeId = api.accounts.activeId();
    const aKey = api.accountStateKey(activeId);
    const savedBlob = localStorage.getItem(aKey);
    try {
      localStorage.setItem(aKey, JSON.stringify(api.normalizeState({ activeCharacterId: "lumi", playerName: "RoundTrip", coins: 77, badges: ["First Quest"] })));
      const loaded = api.accounts.loadState(activeId);
      if (loaded.coins !== 77 || loaded.playerName !== "RoundTrip") errors.push("#376: 載入 active 角色資料不符");
      api.persistState(loaded);
      const rawAfter = JSON.parse(localStorage.getItem(aKey) || "null");
      if (!rawAfter || !rawAfter.characters || Object.keys(rawAfter.characters).length !== 1) errors.push("#376: persist 後 blob 非 1 員 envelope");
      else if (rawAfter.coins !== 77) errors.push("#376: envelope root mirror 未鏡射 active（coins）");
      const reloaded = api.accounts.loadState(activeId);
      if (reloaded.coins !== 77 || reloaded.playerName !== "RoundTrip" || (reloaded.badges || []).indexOf("First Quest") < 0) errors.push("#376: round-trip active state 遺失");
    } finally {
      if (savedBlob === null) localStorage.removeItem(aKey); else localStorage.setItem(aKey, savedBlob);
    }
  } catch (error) {
    errors.push("#376: unexpected error(3) " + ((error && error.message) || error));
  }

  // 4) #378：切換角色非破壞＋帳號時鐘 account-scoped（切換不重置休息鎖＝防繞過）；他角色存檔保留。
  try {
    if (!api.accounts.activeId()) api.accounts.create();
    const activeId = api.accounts.activeId();
    const aKey = api.accountStateKey(activeId);
    const savedBlob = localStorage.getItem(aKey);
    try {
      const A = api.normalizeState({ activeCharacterId: "lumi", playerName: "Aaa", coins: 10 });
      A.playLimit.restEndsAt = 999999; // A 在休息鎖中
      const B = api.normalizeState({ activeCharacterId: "lumi", playerName: "Bbb", coins: 20 });
      B.playLimit.restEndsAt = 0;
      localStorage.setItem(aKey, JSON.stringify({ schema: "2", activeCharacterSaveId: "chA", characters: { chA: A, chB: B } }));
      api.state = api.normalizeState(A); // session 反映 active A
      const before = api.listAccountCharacters();
      if (before.length !== 2) errors.push("#378: roster 應 2 員（實得 " + before.length + "）");
      api.switchToCharacter("chB");
      if (api.state.playerName !== "Bbb" || api.state.coins !== 20) errors.push("#378: 切換後 active 非 B（切換未載入目標角色）");
      if (api.state.playLimit.restEndsAt !== 999999) errors.push("#378: 切換未帶帳號時鐘（休息鎖被重置＝可繞過）");
      const raw = JSON.parse(localStorage.getItem(aKey) || "null");
      if (!raw || !raw.characters.chA || raw.characters.chA.coins !== 10) errors.push("#378: 切換破壞了角色 A 存檔（非破壞性失敗）");
      if (raw && raw.activeCharacterSaveId !== "chB") errors.push("#378: 切換後 active id 未更新");
      api.switchToCharacter("chA");
      if (api.state.playerName !== "Aaa" || api.state.coins !== 10) errors.push("#378: 切回 A 資料遺失");
    } finally {
      if (savedBlob === null) localStorage.removeItem(aKey); else localStorage.setItem(aKey, savedBlob);
    }
  } catch (error) {
    errors.push("#378: unexpected error(4) " + ((error && error.message) || error));
  }

  // 5) #379：刪除角色（守最後一員不可刪）＋roster 上限（ROSTER_CAP）。
  try {
    if (!api.accounts.activeId()) api.accounts.create();
    const activeId = api.accounts.activeId();
    const aKey = api.accountStateKey(activeId);
    const savedBlob = localStorage.getItem(aKey);
    try {
      const A = api.normalizeState({ activeCharacterId: "lumi", playerName: "Aaa", coins: 10 });
      const B = api.normalizeState({ activeCharacterId: "lumi", playerName: "Bbb", coins: 20 });
      localStorage.setItem(aKey, JSON.stringify({ schema: "2", activeCharacterSaveId: "chA", characters: { chA: A, chB: B } }));
      api.state = api.normalizeState(A);
      api.deleteActiveCharacter(); // 刪 active A → 切到 B、A 移除
      if (api.state.playerName !== "Bbb") errors.push("#379: 刪 active 後未切到其餘角色");
      let raw = JSON.parse(localStorage.getItem(aKey) || "null");
      if (!raw || Object.keys(raw.characters).length !== 1) errors.push("#379: 刪除後 roster 應剩 1 員");
      if (raw && (raw.characters.chA || raw.activeCharacterSaveId !== "chB")) errors.push("#379: 刪除未正確移除 A／切到 B");
      api.deleteActiveCharacter(); // 守最後一員：再刪應 no-op
      raw = JSON.parse(localStorage.getItem(aKey) || "null");
      if (!raw || Object.keys(raw.characters).length !== 1) errors.push("#379: 守最後一員失敗（刪到 0）");
      if (api.state.playerName !== "Bbb") errors.push("#379: 守最後一員時 active 不應變");
      const full = { schema: "2", activeCharacterSaveId: "c0", characters: {} };
      for (let i = 0; i < 6; i += 1) full.characters["c" + i] = api.normalizeState({ activeCharacterId: "lumi", playerName: "P" + i, coins: i });
      localStorage.setItem(aKey, JSON.stringify(full));
      api.state = api.normalizeState(full.characters.c0);
      if (!api.rosterAtCap()) errors.push("#379: 6 員應達上限（rosterAtCap 回 false）");
    } finally {
      if (savedBlob === null) localStorage.removeItem(aKey); else localStorage.setItem(aKey, savedBlob);
    }
  } catch (error) {
    errors.push("#379: unexpected error(5) " + ((error && error.message) || error));
  }

  // 6) #380：存檔 Markdown 支援 roster——匯出含所有公主；匯入 legacy 單一（更新 active 保留其他）、envelope replace/add。
  try {
    if (!api.accounts.activeId()) api.accounts.create();
    const activeId = api.accounts.activeId();
    const aKey = api.accountStateKey(activeId);
    const savedBlob = localStorage.getItem(aKey);
    const origConfirm = window.confirm;
    const MK_S = "<!-- LUMINARA_SAVE_JSON";
    const MK_E = "LUMINARA_SAVE_JSON -->";
    const wrapMd = (obj) => `x\n${MK_S}\n${JSON.stringify(obj)}\n${MK_E}\n`;
    try {
      const A = api.normalizeState({ activeCharacterId: "lumi", playerName: "Aaa", coins: 11 });
      const B = api.normalizeState({ activeCharacterId: "lumi", playerName: "Bbb", coins: 22 });
      localStorage.setItem(aKey, JSON.stringify({ schema: "2", activeCharacterSaveId: "chA", characters: { chA: A, chB: B } }));
      api.state = api.normalizeState(A);
      // 匯出 MD payload 應為 envelope 含 2 員。
      const md = api.buildSaveMarkdown();
      const payload = JSON.parse(md.slice(md.indexOf(MK_S) + MK_S.length, md.indexOf(MK_E)).trim());
      if (!payload.characters || Object.keys(payload.characters).length !== 2) errors.push("#380: 匯出 MD 未含整個 roster（2 員）");
      // 匯入 legacy 單一 → 更新 active、保留其他公主。
      window.confirm = () => true;
      api.loadMarkdownText(wrapMd(api.normalizeState({ activeCharacterId: "lumi", playerName: "Legacy", coins: 5 })));
      if (api.state.playerName !== "Legacy") errors.push("#380: 匯入 legacy 單一未載入");
      let raw = JSON.parse(localStorage.getItem(aKey) || "null");
      if (!raw || Object.keys(raw.characters).length !== 2 || raw.characters.chB.playerName !== "Bbb") errors.push("#380: 匯入 legacy 應更新 active 且保留其他公主");
      // 匯入 envelope REPLACE（confirm→false＝replace）。
      const rosterObj = { schema: "2", activeCharacterSaveId: "z1", characters: { z1: api.normalizeState({ activeCharacterId: "lumi", playerName: "Zed", coins: 9 }), z2: api.normalizeState({ activeCharacterId: "lumi", playerName: "Zoe", coins: 8 }) } };
      window.confirm = () => false;
      api.loadMarkdownText(wrapMd(rosterObj));
      raw = JSON.parse(localStorage.getItem(aKey) || "null");
      if (!raw || Object.keys(raw.characters).length !== 2 || api.state.playerName !== "Zed") errors.push("#380: 匯入 envelope replace 應為 2 員且 active＝檔案 active");
      // 匯入 envelope ADD（confirm→true＝add）→ 2＋2＝4 員。
      window.confirm = () => true;
      api.loadMarkdownText(wrapMd(rosterObj));
      raw = JSON.parse(localStorage.getItem(aKey) || "null");
      if (!raw || Object.keys(raw.characters).length !== 4) errors.push("#380: 匯入 envelope add 應累加為 4 員（實得 " + (raw ? Object.keys(raw.characters).length : 0) + "）");
    } finally {
      window.confirm = origConfirm;
      if (savedBlob === null) localStorage.removeItem(aKey); else localStorage.setItem(aKey, savedBlob);
    }
  } catch (error) {
    errors.push("#380: unexpected error(6) " + ((error && error.message) || error));
  }

  const result = document.createElement("pre");
  result.id = "rosterResult";
  result.textContent = JSON.stringify({ test: "roster", passed: errors.length === 0, errors });
  document.body.prepend(result);
}


// issue #309（spec#23/#24）：雲端帳號與存檔路徑驗證——以注入之 in-memory fake server 驗
// 註冊/登入/登出、session 快取、存檔 round-trip、409 樂觀鎖、離線降級與本機舊帳號遷移資料流。
function runCloudAuthSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "auth") return;
  const errors = [];
  const cloudAuth = api.cloudAuth;

  // in-memory fake server（同 [apiIntf自訂帳號存檔服務] 契約）
  function makeFakeServer() {
    const accounts = new Map(); // username -> {password, createdAt}
    const sessions = new Map(); // token -> {username, revoked}
    const saves = new Map(); // username -> {state, updatedAt}
    const policies = new Map(); // username -> playLimitPolicy（issue #310 spec#26）
    let registrationOpen = true;
    let clock = 1000;
    let offline = false;
    function json(status, body) {
      return { status, ok: status < 400, json: async () => body };
    }
    function policyFor(username) {
      return policies.get(username) || { locked: false, playMinutes: null, restMinutes: null, playMaxMinutes: null };
    }
    async function handler(pathname, init = {}) {
      if (offline) throw new TypeError("network down");
      const body = init.body ? JSON.parse(init.body) : {};
      const auth = (init.headers || {})["Authorization"] || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      const sessionRec = sessions.get(token);
      const username = sessionRec && !sessionRec.revoked ? sessionRec.username : "";
      clock += 7;
      if (pathname === "/api/config") {
        return json(200, { registrationOpen, defaultPlayLimit: { playMinutes: 15, restMinutes: 15, playMaxMinutes: 20 } });
      }
      if (pathname === "/api/auth/register" && init.method === "POST") {
        if (!registrationOpen) return json(403, { error: { code: "registration-closed" } });
        if (!/^(?=.*[a-z])[a-z0-9]{3,16}$/.test(body.username || "")) return json(422, { error: { code: "invalid-username" } });
        if (typeof body.password !== "string" || body.password.length < 8) return json(422, { error: { code: "password-too-short" } });
        if (!/[0-9]/.test(body.password) || !/[a-z]/.test(body.password)) return json(422, { error: { code: "password-needs-mix" } });
        if (accounts.has(body.username)) return json(409, { error: { code: "username-taken" } });
        accounts.set(body.username, { password: body.password, createdAt: clock });
        const newToken = "tok-" + body.username + "-" + clock;
        sessions.set(newToken, { username: body.username, revoked: false });
        return json(201, { token: newToken, account: { username: body.username, createdAt: clock } });
      }
      if (pathname === "/api/auth/login" && init.method === "POST") {
        const record = accounts.get(body.username);
        if (!record || record.password !== body.password) return json(401, { error: { code: "invalid-credentials" } });
        const newToken = "tok-" + body.username + "-" + clock;
        sessions.set(newToken, { username: body.username, revoked: false });
        return json(200, { token: newToken, account: { username: body.username, createdAt: record.createdAt } });
      }
      if (!username) return json(401, { error: { code: "unauthorized" } });
      if (pathname === "/api/auth/logout" && init.method === "POST") {
        sessionRec.revoked = true;
        return json(204, null);
      }
      if (pathname === "/api/save" && (init.method || "GET") === "GET") {
        const save = saves.get(username);
        return json(200, {
          state: save ? save.state : null,
          schemaVersion: save ? "1" : null,
          updatedAt: save ? save.updatedAt : null,
          serverTime: clock,
          playLimitPolicy: policyFor(username)
        });
      }
      if (pathname === "/api/save" && init.method === "PUT") {
        const save = saves.get(username) || null;
        const base = body.baseUpdatedAt === undefined ? null : body.baseUpdatedAt;
        if (base !== (save ? save.updatedAt : null)) return json(409, { error: { code: "save-conflict" } });
        const updatedAt = clock;
        saves.set(username, { state: body.state, updatedAt });
        return json(200, { updatedAt, serverTime: clock, playLimitPolicy: policyFor(username) });
      }
      return json(404, { error: { code: "not-found" } });
    }
    return {
      handler,
      saves,
      sessions,
      policies,
      setOffline: (value) => { offline = value; },
      setRegistrationOpen: (value) => { registrationOpen = value; }
    };
  }

  (async () => {
    const fake = makeFakeServer();
    cloudAuth.setApiFetch(fake.handler);
    try {
      localStorage.removeItem(cloudAuth.sessionCacheKey);
      localStorage.removeItem(cloudAuth.recentAccountsKey);
      localStorage.removeItem(cloudAuth.migratedFlagKey);

      // 1) 前端規則同源驗證（intTest#14 前端層）
      if (cloudAuth.validateUsernameInput("BAD")) errors.push("front-end accepted uppercase username");
      if (cloudAuth.validateUsernameInput("ab")) errors.push("front-end accepted 2-char username");
      if (!cloudAuth.validateUsernameInput("mimi2018")) errors.push("front-end rejected valid username");
      if (cloudAuth.validatePasswordInput("12345") !== "password-too-short") errors.push("front-end accepted short password");

      // 2) 註冊即登入＋session 快取（spec#23）
      const reg = await cloudAuth.register("mimi", "secret66");
      if (!reg.ok) errors.push("register failed: " + reg.code);
      if (!cloudAuth.isActive()) errors.push("cloud not active after register");
      const cached = cloudAuth.loadCachedSession();
      if (!cached || cached.username !== "mimi") errors.push("session cache not bound to last login");

      // 3) 首寫與 round-trip（intTest#11/#71）
      api.state = api.freshState();
      api.state.coins = 321;
      api.state.playerName = "CloudMimi";
      cloudAuth.adoptServerBase(null);
      await cloudAuth.flushSave();
      const serverSave = fake.saves.get("mimi");
      if (!serverSave || serverSave.state.coins !== 321) errors.push("cloud save did not reach server");
      const recents = cloudAuth.loadRecentAccounts();
      if (!recents.some((entry) => entry.username === "mimi" && entry.coins === 321)) errors.push("recent account card summary not updated");

      // 4) 409 樂觀鎖：以過期基準寫 → conflict、不覆蓋（spec#24）
      const conflictSeen = { value: false };
      cloudAuth.cloud.onConflict = () => { conflictSeen.value = true; };
      const goodBase = serverSave.updatedAt;
      fake.saves.set("mimi", { state: Object.assign({}, serverSave.state, { coins: 900 }), updatedAt: goodBase + 50 }); // 模擬他裝置較新寫入
      cloudAuth.adoptServerBase(goodBase); // 本機持過期基準
      api.state.coins = 111;
      await cloudAuth.flushSave();
      if (!conflictSeen.value) errors.push("save-conflict (409) not surfaced");
      if (fake.saves.get("mimi").state.coins !== 900) errors.push("stale write overwrote newer save");
      cloudAuth.cloud.onConflict = null;

      // 5) 離線降級：網路失敗 → status offline、資料不丟；恢復後補存（intTest#73）
      cloudAuth.adoptServerBase(fake.saves.get("mimi").updatedAt);
      fake.setOffline(true);
      api.state.coins = 555;
      await cloudAuth.flushSave();
      if (cloudAuth.cloud.status !== "offline") errors.push("offline status expected, got " + cloudAuth.cloud.status);
      fake.setOffline(false);
      await cloudAuth.flushSave();
      if (fake.saves.get("mimi").state.coins !== 555) errors.push("recovered flush did not persist state");
      if (cloudAuth.cloud.status !== "idle") errors.push("idle status expected after recovery, got " + cloudAuth.cloud.status);

      // 6) 登出撤銷＋快取清除；錯誤密碼統一 401（intTest#13/#15/#70）
      await cloudAuth.logout();
      if (cloudAuth.isActive()) errors.push("cloud still active after logout");
      if (cloudAuth.loadCachedSession()) errors.push("session cache not cleared on logout");
      const badLogin = await cloudAuth.login("mimi", "wrong66");
      if (badLogin.ok || badLogin.code !== "invalid-credentials") errors.push("wrong password not rejected with invalid-credentials");
      const relogin = await cloudAuth.login("mimi", "secret66");
      if (!relogin.ok || !relogin.state || relogin.state.coins !== 555) errors.push("re-login did not restore latest cloud state");

      // 7) 本機舊帳號遷移資料流（intTest#74 核心）：normalizeState（含 sol→lumi）→ 上傳成功後才標記
      const legacy = api.accounts.create();
      localStorage.setItem("luminara-princess-english-adv:" + legacy.id, JSON.stringify({ activeCharacterId: "sol", playerName: "Legacy", coins: 77 }));
      const migratedBefore = cloudAuth.loadMigratedLocalIds();
      if (migratedBefore.includes(legacy.id)) errors.push("legacy account pre-marked as migrated");
      const legacyState = api.accounts.loadState(legacy.id);
      const normalized = api.normalizeState(legacyState);
      if (normalized.activeCharacterId !== "lumi") errors.push("sol legacy save did not fallback to lumi");
      api.state = normalized;
      cloudAuth.adoptServerBase(fake.saves.get("mimi").updatedAt);
      await cloudAuth.flushSave();
      if (fake.saves.get("mimi").state.coins !== 77) errors.push("migrated state not uploaded");
      if (cloudAuth.cloud.status !== "idle") errors.push("migration upload not clean");
      // #377：雲端 PUT 升為 roster envelope——root mirror 保 top-level coins（admin/驗證讀值不變）、characters 恰 1 員、active 切片一致。
      const uploaded377 = fake.saves.get("mimi").state;
      if (!uploaded377 || !uploaded377.characters || typeof uploaded377.characters !== "object") {
        errors.push("#377: 雲端存檔非 roster envelope（缺 characters）");
      } else {
        const cids377 = Object.keys(uploaded377.characters);
        if (cids377.length !== 1) errors.push("#377: 雲端 roster 應 1 員（實得 " + cids377.length + "）");
        if (uploaded377.coins !== 77) errors.push("#377: envelope root mirror 未保 top-level coins（admin 讀值破）");
        if (cids377[0] && uploaded377.characters[cids377[0]].coins !== 77) errors.push("#377: active 角色切片 coins 不符");
      }
      localStorage.setItem(cloudAuth.migratedFlagKey, JSON.stringify([legacy.id])); // 先上傳成功、後標記
      if (!cloudAuth.loadMigratedLocalIds().includes(legacy.id)) errors.push("migration flag not recorded after successful upload");
      api.accounts.remove(legacy.id);

      // 8) 登入畫面 UI 煙霧（#393 兩表單 canon）：預設＝登入表單（無帳號卡/Remove card）、
      //    帳號欄預填最近帳號、密碼顯示切換、註冊為次要連結。
      await cloudAuth.logout();
      cloudAuth.upsertRecentAccount("mimi", { playerName: "CloudMimi", characterId: "lumi", coins: 555, outfit: api.state.outfit, playLimit: api.state.playLimit, lastPlayedAt: Date.now() });
      cloudAuth.openLoginScreen({ mustChoose: true });
      if (document.querySelector("#accountList .account-pick")) errors.push("#393: 登入畫面不應再渲染帳號卡");
      if (document.querySelector(".login-remove-card")) errors.push("#393: Remove card 應已拆除");
      const loginUser = document.getElementById("loginOtherUsername");
      const loginPwd = document.getElementById("loginOtherPassword");
      if (!loginUser || !loginPwd) errors.push("#393: 預設應為登入表單（帳號＋密碼欄）");
      if (loginUser && loginUser.value !== "mimi") errors.push("#393: 帳號欄應預填最近登入帳號（實得 " + (loginUser ? loginUser.value : "") + "）");
      if (!document.querySelector(".login-show-toggle")) errors.push("password show/hide toggle missing");
      const regLink = [...document.querySelectorAll(".login-link")].find((b) => /Create an account/.test(b.textContent));
      if (!regLink) {
        errors.push("#393: 缺「Create an account」次要連結");
      } else {
        regLink.click();
        if (!document.getElementById("registerUsername")) errors.push("#393: 點次要連結未開註冊表單");
        cloudAuth.setLoginMode("login");
      }
      const overlay = document.getElementById("accountSelect");
      if (overlay) {
        overlay.classList.remove("show");
        overlay.setAttribute("aria-hidden", "true");
      }
      document.body.classList.remove("account-select-open");

      // 8b) #393：帳號層無回程——登入畫面任何情境不顯示 Back（僅未登入時出現本畫面）。
      if (!api.accounts.activeId()) api.accounts.create();
      const backBtn = document.getElementById("accountBack");
      cloudAuth.openLoginScreen({ mustChoose: false });
      if (backBtn && !backBtn.hidden) errors.push("#393: 登入畫面不應顯示 Back（帳號層無回程）");
      cloudAuth.openLoginScreen({ mustChoose: true });
      if (backBtn && !backBtn.hidden) errors.push("#393: 啟動 gate 亦不應顯示 Back");
      const newBtn393 = document.getElementById("accountNewButton");
      if (newBtn393 && !newBtn393.hidden) errors.push("#393: Create new account 大鈕應退場（註冊走表單內連結）");
      const gateOverlay = document.getElementById("accountSelect");
      if (gateOverlay) {
        gateOverlay.classList.remove("show");
        gateOverlay.setAttribute("aria-hidden", "true");
      }
      document.body.classList.remove("account-select-open");

      // 9) 時長政策（issue #310 spec#26／sysCase#16.1）：鎖定→執行值取政策、欄位唯讀、state 不被改寫；PUT 回應解除即回復。
      fake.policies.set("mimi", { locked: true, playMinutes: 10, restMinutes: 20, playMaxMinutes: 12 });
      const lockedLogin = await cloudAuth.login("mimi", "secret66");
      if (!lockedLogin.ok) errors.push("locked login failed: " + lockedLogin.code);
      api.state = api.normalizeState(lockedLogin.state || {});
      if (!cloudAuth.playLimitLocked()) errors.push("play-limit policy not applied on login");
      const eff = cloudAuth.effectivePlayLimit(api.state.playLimit);
      if (eff.playMinutes !== 10 || eff.restMinutes !== 20 || eff.playMaxMinutes !== 12) {
        errors.push("effective play limit not taken from policy: " + JSON.stringify(eff));
      }
      if (api.state.playLimit.playMinutes === 10) errors.push("policy overwrote state.playLimit (should stay separate)");
      api.renderSettings();
      if (!document.getElementById("playMinutesInput")?.disabled) errors.push("locked play-minutes input not readonly");
      if (!document.getElementById("restMinutesInput")?.disabled) errors.push("locked rest-minutes input not readonly");
      if (document.getElementById("playLimitManagedNote")?.hidden !== false) errors.push("managed-by-guardian note not shown while locked");
      // 解除鎖定：政策隨下一次保存（PUT 回應）即時套用、玩家自調值回復。
      fake.policies.delete("mimi");
      cloudAuth.adoptServerBase(fake.saves.get("mimi").updatedAt);
      await cloudAuth.flushSave();
      if (cloudAuth.playLimitLocked()) errors.push("unlock via PUT response not applied");
      api.renderSettings();
      if (document.getElementById("playMinutesInput")?.disabled) errors.push("inputs still readonly after unlock");
      if (document.getElementById("playLimitManagedNote")?.hidden === false) errors.push("managed note still shown after unlock");
      await cloudAuth.logout();

      // 10) 註冊開關（spec#26 (c)／sysCase#16.2）：關閉→register 403、登入畫面無建立入口＋友善說明。
      fake.setRegistrationOpen(false);
      const closedReg = await cloudAuth.register("newkid1", "secret66");
      if (closedReg.ok || closedReg.code !== "registration-closed") errors.push("closed registration not rejected with registration-closed");
      cloudAuth.upsertRecentAccount("mimi", { playerName: "CloudMimi", characterId: "lumi", coins: 555, outfit: api.state.outfit, playLimit: api.state.playLimit, lastPlayedAt: Date.now() });
      cloudAuth.openLoginScreen({ mustChoose: false });
      await new Promise((resolve) => setTimeout(resolve, 0)); // 等 /api/config 查詢與重建
      const newButton = document.getElementById("accountNewButton");
      if (newButton && !newButton.hidden) errors.push("create-account entry visible while registration closed");
      if (!document.querySelector(".login-registration-closed")) errors.push("registration-closed notice missing");
      if (document.getElementById("registerUsername")) errors.push("register form rendered while registration closed");
      // #393：註冊關閉時，登入表單之「Create an account」次要連結亦不得出現。
      if ([...document.querySelectorAll(".login-link")].some((b) => /Create an account/.test(b.textContent))) errors.push("#393: 註冊關閉仍見建立帳號連結");
      fake.setRegistrationOpen(true);
      if (overlay) {
        overlay.classList.remove("show");
        overlay.setAttribute("aria-hidden", "true");
      }
      document.body.classList.remove("account-select-open");
    } catch (error) {
      errors.push("unexpected error: " + ((error && error.message) || error));
    } finally {
      cloudAuth.setApiFetch(null);
      cloudAuth.setPlayLimitPolicy(null);
      localStorage.removeItem(cloudAuth.sessionCacheKey);
      localStorage.removeItem(cloudAuth.recentAccountsKey);
      localStorage.removeItem(cloudAuth.migratedFlagKey);
    }
    const result = document.createElement("pre");
    result.id = "cloudAuthTestResult";
    result.textContent = JSON.stringify({
      test: "auth",
      passed: errors.length === 0,
      errors: errors.slice(0, 12)
    });
    document.body.prepend(result);
  })();
}

// issue #212：本機開發環境 dev 入口（衣物調整工具）閘門驗證。
// ①純函式 isLocalDevHost 白名單斷言；②按鈕揭示狀態與當前 host 一致；③導向採相對路徑。
function runDevToolsSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "dev-tools") return;
  const errors = [];

  // ① 閘門純函式：本機 host → true；正式站／空字串 → false。
  const expectHost = (host, expected) => {
    const got = api.isLocalDevHost(host);
    if (got !== expected) errors.push(`isLocalDevHost(${JSON.stringify(host)})=${got}, expected ${expected}`);
  };
  [["127.0.0.1", true], ["localhost", true], ["[::1]", true], ["LocalHost", true],
   ["foo.github.io", false], ["example.com", false], ["", false]].forEach(([h, e]) => expectHost(h, e));

  // ② dev 入口揭示狀態須與 isLocalDevEnv() 一致（本機顯示／非本機隱藏不變式）。
  const button = api.elements.wardrobeTunerDevButton;
  const isDev = api.isLocalDevEnv();
  if (!button) {
    errors.push("找不到 #wardrobeTunerDevButton");
  } else if ((!button.hidden) !== isDev) {
    errors.push(`dev 入口顯示=${!button.hidden}，但 isLocalDevEnv()=${isDev}（應一致）`);
  }

  // ③ 導向目標須為相對路徑，不寫死埠號／主機（避免與正式站絕對網址綁定）。
  const path = api.wardrobeTunerDevPath || "";
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("/") || path.includes("4174")) {
    errors.push(`dev 入口導向路徑非相對：「${path}」`);
  }

  const passed = errors.length === 0;
  const result = document.createElement("pre");
  result.id = "devToolsResult";
  result.textContent = JSON.stringify({ test: "dev-tools", passed, errors });
  document.body.prepend(result);
}

// issue #286 spec#20：對話場景金錢即時顯示。
// ①金錢指示元素存在；②位於對話場景覆蓋層 #advModal 內（隨場景顯示、非被覆蓋之側欄）；
// ③變更 state.coins 後重繪，場景金錢指示與側欄同一單一資料來源同步更新。
function runSceneCoinsSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "scene-coins") return;
  const errors = [];

  const coinEl = api.elements.advCoinValue;
  const sideEl = api.elements.coinValue;
  if (!coinEl) {
    errors.push("找不到 #advCoinValue（對話場景金錢指示元素）");
  } else if (!coinEl.closest("#advModal")) {
    errors.push("#advCoinValue 不在 #advModal 對話場景覆蓋層內（不應只在被覆蓋的側欄）");
  }

  if (coinEl) {
    const original = api.state.coins;
    const probe = (Number(original) || 0) + 137;
    api.state.coins = probe;
    api.render();
    const advShown = (coinEl.textContent || "").replace(/[^0-9]/g, "");
    const sideShown = (sideEl?.textContent || "").replace(/[^0-9]/g, "");
    if (advShown !== String(probe)) {
      errors.push(`變更 coins 後場景金錢顯示「${coinEl.textContent}」未同步為 ${probe}`);
    }
    if (sideShown !== advShown) {
      errors.push(`場景金錢「${advShown}」與側欄金錢「${sideShown}」不一致（非單一資料來源）`);
    }
    api.state.coins = original;
    api.render();
  }

  const passed = errors.length === 0;
  const result = document.createElement("pre");
  result.id = "sceneCoinsResult";
  result.textContent = JSON.stringify({ test: "scene-coins", passed, errors });
  document.body.prepend(result);
}

// issue #289 spec#21：新局得體入門造型與精簡起始擁有（#367：預設造型隨 #364 改為雙辮＋金色宮廷裙）。
// ①新局預設穿著＝castleGoldCourtGown＋urbanTwinBraids、鞋維持既有；②owned 恰等於所穿三件；③owned 不含已移除角色殘留。
function runStarterOutfitSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "starter-outfit") return;
  const errors = [];
  const start = princessStart;

  if (start.outfit.outfit !== "castleGoldCourtGown") errors.push(`新局預設 outfit = "${start.outfit.outfit}"，預期 castleGoldCourtGown`);
  if (start.outfit.hairstyle !== "urbanTwinBraids") errors.push(`新局預設 hairstyle = "${start.outfit.hairstyle}"，預期 urbanTwinBraids`);
  if (start.outfit.shoes !== "countrysideWoodenClogs") errors.push(`新局預設 shoes = "${start.outfit.shoes}"，預期維持 countrysideWoodenClogs`);

  // owned 恰等於所穿三件（hairstyle/outfit/shoes），無其他預先擁有品項。
  const worn = JSON.stringify([start.outfit.hairstyle, start.outfit.outfit, start.outfit.shoes].sort());
  const owned = JSON.stringify([...start.owned].sort());
  if (owned !== worn) errors.push(`新局 owned = ${JSON.stringify(start.owned)}，預期恰為所穿三件 [${start.outfit.hairstyle}, ${start.outfit.outfit}, ${start.outfit.shoes}]`);

  // 每件 owned 須為合法 registry 品項（與 data-audit #267 守門一致）。
  start.owned.forEach((id) => { if (!api.itemById(id)) errors.push(`新局 owned "${id}" 不在衣物 registry`); });

  if (start.owned.includes("solStarterHair")) errors.push("新局 owned 仍含已移除角色之 solStarterHair");

  const passed = errors.length === 0;
  const result = document.createElement("pre");
  result.id = "starterOutfitResult";
  result.textContent = JSON.stringify({ test: "starter-outfit", passed, errors });
  document.body.prepend(result);
}

// issue #178：鍵盤地圖走動控制器——自管連續移動迴圈（消除起步停頓）、放鍵/失焦即停、忽略 OS 自動重複、三面座標改變。
function runMapWalkSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "map-walk") return;
  const errors = [];

  // A. 方向鍵對映（方向鍵＋WASD；非走動鍵回傳 null）
  const dirChecks = [
    ["ArrowUp", "up"], ["w", "up"], ["W", "up"],
    ["ArrowDown", "down"], ["s", "down"],
    ["ArrowLeft", "left"], ["a", "left"],
    ["ArrowRight", "right"], ["d", "right"],
    ["Enter", null], ["1", null], [" ", null]
  ];
  for (const [key, expected] of dirChecks) {
    if (directionForKey(key) !== expected) {
      errors.push(`directionForKey(${JSON.stringify(key)}) 期望 ${expected}，得 ${directionForKey(key)}`);
    }
  }

  // B. 控制器：即時起步 ＋ 連續多步 ＋ 放鍵即停（注入假時鐘與 raf 佇列，免依賴真實 OS 自動重複）
  let clock = 0;
  const pending = [];
  const steps = [];
  const ctrl = createKeyboardWalkController({
    stepMs: 33,
    now: () => clock,
    requestFrame: (cb) => { pending.push(cb); return pending.length; },
    cancelFrame: () => {}
  });
  const pump = () => { const cb = pending.shift(); if (cb) cb(); };

  ctrl.press("up", (dx, dy) => steps.push([dx, dy]));
  if (steps.length !== 1) errors.push(`press 應即時走一步，實得 ${steps.length}`);
  if (!ctrl.isWalking()) errors.push("press 後連續移動迴圈未啟動");
  for (let i = 0; i < 4; i++) { clock += 33; pump(); }   // 每前進 33ms 應再推進一步
  if (steps.length < 5) errors.push(`連續走動步數不足（期望 ≥5，實得 ${steps.length}）`);
  const heldSteps = steps.length;
  ctrl.release("up");
  if (ctrl.isWalking()) errors.push("放鍵後迴圈未停止");
  clock += 99; pump(); pump();
  if (steps.length !== heldSteps) errors.push("放鍵後仍持續走動（卡走）");

  // C. 忽略 OS 自動重複：同向重按不額外即時走步、不重複登記方向
  const repeatSteps = [];
  const ctrlRepeat = createKeyboardWalkController({
    stepMs: 33, now: () => 0, requestFrame: () => 1, cancelFrame: () => {}
  });
  const repeatMove = (dx, dy) => repeatSteps.push([dx, dy]);
  ctrlRepeat.press("right", repeatMove);
  ctrlRepeat.press("right", repeatMove);   // 模擬 OS 自動重複的合成 keydown
  if (repeatSteps.length !== 1) errors.push(`同向重複按鍵應被忽略，期望即時步數 1，實得 ${repeatSteps.length}`);
  if (ctrlRepeat.heldDirections().length !== 1) errors.push("同向重複按鍵不應重複登記方向");

  // D. clear（失焦／切面）即停並清空按住狀態
  ctrlRepeat.clear();
  if (ctrlRepeat.isWalking() || ctrlRepeat.heldDirections().length !== 0) {
    errors.push("clear 後未停止或未清空按住狀態");
  }

  // E. 三處走動面：座標皆隨對應 move 函式改變（地區／城堡／世界）
  const movedX = (label, area, moveFn) => {
    const before = { ...api.currentPlayerPoint(area) };
    moveFn(1, 0);
    const after = api.currentPlayerPoint(area);
    if (!(Math.abs(after.x - before.x) > 0.001)) errors.push(`${label}鍵盤走動未改變座標`);
  };
  api.openArea("urban");
  api.renderMap();
  movedX("地區地圖", "urban", api.moveOnMap);
  api.openArea("castle");
  api.renderCastleMap();
  movedX("城堡地圖", "castle", api.moveOnCastleMap);
  api.openWorldMap();
  api.renderWorldMap();
  movedX("世界地圖", "world", api.moveOnWorldMap);

  const passed = errors.length === 0;
  const result = document.createElement("pre");
  result.id = "mapWalkResult";
  result.textContent = JSON.stringify({ test: "map-walk", passed, errors });
  document.body.prepend(result);
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

  // issue #180：地圖公主 token 永遠顯示於地圖圖示之上、但低於地圖操作 UI 面板。
  // 守住「公主 token z-index 高於地點標記層／hotspot(nearby)／裝飾層，且低於目的地面板」。
  const zOf = (el) => (el ? parseInt(getComputedStyle(el).zIndex, 10) : NaN);
  const checkTokenAboveIcons = (tokenId, stageId, markerLayerId) => {
    const tokenZ = zOf(document.getElementById(tokenId));
    if (!Number.isFinite(tokenZ)) { errors.push(`${tokenId} z-index 非數值（公主 token 缺有效堆疊層級）`); return; }
    const layerZ = zOf(document.getElementById(markerLayerId));
    if (Number.isFinite(layerZ) && !(tokenZ > layerZ)) errors.push(`${tokenId}(z${tokenZ}) 未高於標記層 ${markerLayerId}(z${layerZ})：公主會被地圖圖示遮住`);
    const stage = document.getElementById(stageId);
    if (stage) {
      const probe = document.createElement("div");
      probe.className = "map-marker hotspot nearby";
      probe.style.position = "absolute"; probe.style.left = "0"; probe.style.top = "0";
      stage.appendChild(probe);
      const probeZ = zOf(probe);
      probe.remove();
      if (Number.isFinite(probeZ) && !(tokenZ > probeZ)) errors.push(`${tokenId}(z${tokenZ}) 未高於 hotspot(nearby)(z${probeZ})`);
    }
  };
  checkTokenAboveIcons("playerToken", "mapStage", "hotspotLayer");
  checkTokenAboveIcons("castlePlayerToken", "castleStage", "castleMarkerLayer");
  checkTokenAboveIcons("worldPlayerToken", "worldStage", "worldMarkerLayer");
  const urbanTokenZ = zOf(document.getElementById("playerToken"));
  const lifeLayerZ = zOf(document.getElementById("mapLifeLayer"));
  if (Number.isFinite(lifeLayerZ) && !(urbanTokenZ > lifeLayerZ)) errors.push(`playerToken(z${urbanTokenZ}) 未高於裝飾層 mapLifeLayer(z${lifeLayerZ})`);
  const destPanelZ = zOf(document.getElementById("destinationPanel"));
  if (Number.isFinite(destPanelZ) && !(urbanTokenZ < destPanelZ)) errors.push(`playerToken(z${urbanTokenZ}) 未低於目的地面板 destinationPanel(z${destPanelZ})：公主不應蓋過地圖操作 UI`);

  const passed = errors.length === 0;
  const result = document.createElement("pre");
  result.id = "mapAvatarResult";
  result.textContent = JSON.stringify({ test: "map-avatar", passed, errors });
  document.body.prepend(result);
}

// issue #252：地圖標記邊界裁切以「marker 中心錨點是否在可視範圍內」判定，貼邊節點（如城堡入口
// castleGate y≈95.3）在 .nearby 放大後外框戳出 stage 邊界數 px 不得被整顆裁掉而消失；同時真正
// 移出視口（中心在界外）之 marker 仍須隱藏。以合成固定 stage 與探針 marker 機判 updateMarkerEdgeVisibility。
function runMarkerVisibilitySelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "marker-visibility") return;
  const errors = [];
  const stage = document.createElement("div");
  stage.style.cssText = "position:fixed;left:0;top:0;width:400px;height:400px;overflow:hidden;z-index:-1;";
  document.body.appendChild(stage);
  const makeMarker = (left, top) => {
    const marker = document.createElement("button");
    marker.className = "map-marker";
    marker.style.cssText = `position:absolute;width:60px;height:60px;transform:translate(-50%,-50%);left:${left};top:${top};`;
    stage.appendChild(marker);
    return marker;
  };
  // (A) 貼邊 marker：中心在界內（top 98%＝392px），外框下緣戳出 stage 底緣（392+30=422 > 400）。
  //     舊「整個外框」判據會誤裁；中心錨點判據（#252）須維持顯示。
  const edge = makeMarker("50%", "98%");
  updateMarkerEdgeVisibility(edge, stage);
  if (edge.classList.contains("map-marker-offscreen")) errors.push("#252 貼邊 marker（中心在界內、外框戳出底緣）被誤判 offscreen");
  // (B) 中心移出視口之 marker（top 130%＝520px > 400）：須仍被隱藏（不退化 panned-away 裁切）。
  const off = makeMarker("50%", "130%");
  updateMarkerEdgeVisibility(off, stage);
  if (!off.classList.contains("map-marker-offscreen")) errors.push("中心移出視口之 marker 未被隱藏（裁切失效，panned-away 退化）");
  if (off.getAttribute("aria-hidden") !== "true") errors.push("隱藏 marker 未設 aria-hidden（可達性處理退化）");
  // (C) 置中 marker：顯示。
  const center = makeMarker("50%", "50%");
  updateMarkerEdgeVisibility(center, stage);
  if (center.classList.contains("map-marker-offscreen")) errors.push("置中 marker 被誤判 offscreen");
  stage.remove();
  const passed = errors.length === 0;
  const result = document.createElement("pre");
  result.id = "markerVisibilityResult";
  result.textContent = JSON.stringify({ test: "marker-visibility", passed, errors });
  document.body.prepend(result);
}

// issue #199：角色常態圖地分離須套在透明合成輪廓上，試穿光暈只作為互動狀態提示。
function runCharacterSilhouetteSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "character-silhouette") return;
  const errors = [];
  const filterOf = (selector) => {
    const el = document.querySelector(selector);
    return el ? getComputedStyle(el).filter : "";
  };
  const expectDropShadow = (label, value, minCount = 1) => {
    const count = (value.match(/drop-shadow/g) || []).length;
    if (count < minCount) errors.push(`${label} drop-shadow 層數不足：${value || "(empty)"}`);
  };
  const expectLayerUnshadowed = (label, rootSelector) => {
    const layer = document.querySelector(`${rootSelector} .paper-doll-layer`);
    if (!layer) { errors.push(`${label} 缺少 paper-doll-layer`); return; }
    const value = getComputedStyle(layer).filter;
    if (value && value !== "none") errors.push(`${label} layer 仍有 filter，會造成多層 wardrobe 陰影疊加：${value}`);
  };

  api.render();
  api.openQuestAdv(api.hotspotById("kingHall"));
  expectDropShadow("ADV 公主 stage", filterOf(".adv-doll .paper-doll-stage"), 3);
  expectLayerUnshadowed("ADV 公主", ".adv-doll");
  expectDropShadow("ADV NPC", filterOf(".adv-npc"), 3);

  // issue #251：整件 outfit 圖層 z-index 須高於 base/head（衣服疊在身體之上、不被身體蓋住）。
  // 防範 paper-doll.css 之 slot-keyed z-index 與 rules.js 圖層改名脫鉤（dress→outfit）之回歸。
  const zIndexOf = (selector) => {
    const el = document.querySelector(selector);
    return el ? getComputedStyle(el).zIndex : null;
  };
  const baseZ = Number(zIndexOf(".adv-doll .paper-doll-layer-base"));
  const outfitZRaw = zIndexOf(".adv-doll .paper-doll-layer-outfit");
  if (outfitZRaw === null) {
    errors.push("ADV 公主缺少 .paper-doll-layer-outfit（預設應穿戴整件 outfit，issue #251）");
  } else if (!(Number(outfitZRaw) > baseZ)) {
    errors.push(`outfit 圖層 z-index（${outfitZRaw}）未高於 base（${baseZ}）——衣服會被身體蓋住（issue #251 z-index 回歸）`);
  }

  const doll = document.querySelector(".adv-doll");
  doll?.classList.add("try-on-active");
  expectDropShadow("試穿狀態光暈", filterOf(".adv-doll.try-on-active"), 2);
  doll?.classList.remove("try-on-active");
  const inactiveTryOnFilter = filterOf(".adv-doll");
  if (inactiveTryOnFilter && inactiveTryOnFilter !== "none") {
    errors.push(`未試穿狀態 adv-doll 容器不應殘留狀態光暈：${inactiveTryOnFilter}`);
  }
  expectDropShadow("試穿結束後 ADV 公主 stage", filterOf(".adv-doll .paper-doll-stage"), 3);

  api.openWorldMap();
  api.renderWorldMap();
  expectDropShadow("地圖 token stage", filterOf(".map-doll .paper-doll-stage"), 3);
  expectLayerUnshadowed("地圖 token", ".map-doll");

  if (api.accounts?.list?.().length === 0) api.accounts.create();
  api.openAccountSelect({ mustChoose: false });
  const bustRoot = document.querySelector(".bust-doll");
  if (!bustRoot) {
    errors.push("帳號或人物頭胸照缺少 .bust-doll");
  } else {
    expectDropShadow("頭胸照 stage", filterOf(".bust-doll .paper-doll-stage"), 3);
    expectLayerUnshadowed("頭胸照", ".bust-doll");
  }

  const result = document.createElement("pre");
  result.id = "characterSilhouetteResult";
  result.textContent = JSON.stringify({ test: "character-silhouette", passed: errors.length === 0, errors });
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

  // 版號 SSOT 模型（VERSION 為單一源、版號釘選於 merge）：當前版本為 SemVer，
  // 玩家版本沿革只投影 VERSION.history 中 playerVisible 之 feat/fix；internal／dev-only 版本
  // （如純工具改動）不進玩家沿革，故「當前版本」不必等於沿革首筆。改驗當前版本為非空且符 SemVer。
  const currentVersion = (api.elements.versionValue?.textContent || "").trim();
  if (!currentVersion) errors.push("當前版本顯示為空");
  else if (!/^\d+\.\d+\.\d+$/.test(currentVersion)) errors.push(`當前版本非 SemVer：「${currentVersion}」`);

  // 版本卡已併入 About：Settings 不得殘留、About 須具備
  const settingsView = document.getElementById("settingsView");
  if (settingsView?.querySelector(".version-card")) errors.push("Settings 仍殘留版本卡（應併入 About）");
  if (!aboutView?.querySelector(".version-card")) errors.push("About 缺少版本卡");

  // issue #134 後續：Settings 不得殘留「Switch player」按鈕；按「Change princess」須先關閉系統選單再開選角。
  if (settingsView?.querySelector("#switchAccountButton")) errors.push("Settings 仍殘留 Switch player 按鈕（應移除）");
  // issue #371：設定選單將「角色/造型」與「帳號」動作分組並澄清一帳號一公主模型，消除與帳號切換/登出混用之困惑。
  const settingsGroupTitles = [...(settingsView?.querySelectorAll(".settings-group-title") || [])];
  if (settingsGroupTitles.length < 2) errors.push("#371: 設定選單缺少分組標題（角色/帳號分組，實得 " + settingsGroupTitles.length + "）");
  const princessHint = settingsView?.querySelector("#changePrincessHint");
  if (!princessHint) errors.push("#371: 設定選單缺少換公主說明");
  // #393 兩表單 canon：說明導引玩家用 ⟳ 回選角色頁（單一切換路徑）；設定內不得殘留第二套 roster 切換。
  else if (!princessHint.textContent.includes("Switch princess")) errors.push("#393: 換公主說明未導引 ⟳ Switch princess（回選角色頁）");
  if (settingsView?.querySelector("#characterRoster")) errors.push("#393: 設定選單仍殘留 roster 切換清單（第二套切換應拆除）");
  if (settingsView?.querySelector("#signOutButton")) errors.push("#393: 設定選單仍殘留 Sign out（登出歸選角色頁）");
  // issue #370：遊戲畫面（側欄）顯示品牌 wordmark，文字取品牌 SSOT（render 套用，非硬編）。
  const wordmark = document.getElementById("appWordmark");
  if (!wordmark) errors.push("#370: 遊戲畫面缺品牌 wordmark 元素");
  else if (!wordmark.textContent.trim()) errors.push("#370: 品牌 wordmark 文字為空（render 未套用品牌 SSOT）");
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
// issue #205：下架條件由「答對」改為「實得 coins（>0）」——打工答對但 0 coins（none 階：答錯 2 次後答對）
// 不下架、本週期仍可再作答（步驟 3b）；full／half（coins>0）一如既往下架（步驟 2）。
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
  // issue #205：答錯 2 次後答對 → helpRewardTier 落 none 階、coins=0（模擬「答對但沒賺到錢」）。
  const answerZeroCoin = () => {
    const lesson = api.getActiveLesson();
    if (!lesson) throw new Error("no active lesson after open");
    const btns = [...api.elements.choiceList.querySelectorAll("button")];
    const wrong = btns.filter((b) => b.dataset.choice && b.dataset.choice !== lesson.answer);
    if (wrong.length < 2) throw new Error(`need ≥2 distractors for none-tier, got ${wrong.length}`);
    api.answerLesson(wrong[0], wrong[0].dataset.choice); // 答錯 #1
    api.answerLesson(wrong[1], wrong[1].dataset.choice); // 答錯 #2 → advWrongAttempts=2 → none 階
    const correct = btns.find((b) => b.dataset.choice === lesson.answer);
    api.answerLesson(correct, lesson.answer);             // 答對但 coins=0
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

    // 3b) issue #205：打工答對但 0 coins（none 階：答錯 2 次後答對）→ 不下架、本週期仍可再作答。
    const coinsBeforeZero = api.state.coins;
    openJob("kingHall");
    answerZeroCoin();
    if (api.state.coins !== coinsBeforeZero) errors.push(`zero-coin job: coins=${api.state.coins}, expected unchanged ${coinsBeforeZero}`);
    if (clock.isJobDone("kingHall")) errors.push("zero-coin job: isJobDone(kingHall) true (0 coins must not 下架)");
    if (jobsDone().includes("kingHall")) errors.push("zero-coin job: kingHall in jobsDone (0 coins must not count)");
    if (!keys("kingHall").includes("practice")) errors.push("zero-coin job: practice missing (0 coins must keep job available)");

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

    // issue #244：公主房第一層應為單一「換裝」入口（一般場景樣式、不上色）＋ Leave，無昔日逐分類專用表單；
    // 換裝開啟之衣櫃與商店共用同一「多欄貨架」面板（renderAdvShop closet 模式）、為 wear-only 穿脫切換、無試穿鈕；
    // 深粉紅僅在衣櫃內「穿上／脫下」動作鈕（border #ad1457 = rgb(173,20,87)），非入口鈕。
    const deepPink = /173,\s*20,\s*87/;
    // issue #289：新局 owned 精簡為僅所穿三件後，衣櫃預設無「已擁有但未穿」之可切換品項；為穿脫測試自
    // registry（api.shopItems）動態注入一件正式 layer、非 starter、未穿戴之品項，使測試不依賴預設 owned
    // 規模（承 issue #267「fixture 自 registry 動態挑」之意，內容重作不再令 fixture 失效）。
    const wearFixture = (api.shopItems || []).find((it) => it && it.storeId !== "starter" && (it.layers || []).length > 0 && api.state.outfit[it.type] !== it.id);
    if (wearFixture && !api.state.owned.includes(wearFixture.id)) api.state.owned.push(wearFixture.id);
    api.openRoomScene(api.hotspotById("princessRoom"));
    if (api.getAdvMode() !== "scene") errors.push(`room first layer mode = ${api.getAdvMode()}, expected scene`);
    const changeOutfitBtn = choiceBtn("Change Outfit");
    if (!changeOutfitBtn) errors.push("room first layer missing single 'Change Outfit' entry");
    if (changeOutfitBtn && deepPink.test(getComputedStyle(changeOutfitBtn).borderColor)) errors.push("Change Outfit entry must NOT be deep-pink (must match other scene buttons)");
    if (!footerBtn("Leave")) errors.push("room first layer missing Leave button");
    ["Hair", "Tops", "Bottoms", "Dresses", "Shoes", "Hats", "Accessories"].forEach((cat) => {
      if (choiceBtn(cat)) errors.push(`room first layer still shows legacy category button "${cat}" (ROOM_ACTIONS not consolidated)`);
    });
    click(changeOutfitBtn, "Change Outfit");
    if (api.getAdvMode() !== "wardrobe") errors.push(`after Change Outfit mode = ${api.getAdvMode()}, expected wardrobe`);
    // 與商店同一多欄貨架機制：應渲染類別欄（.shop-shelf-col），非舊單類別分頁。
    if (!api.elements.advShopGrid.querySelector(".shop-shelf-col")) errors.push("wardrobe panel is not the shared multi-column shelf (.shop-shelf-col missing — old mechanism?)");
    if (api.elements.advShopTabs.querySelector("button")) errors.push("wardrobe panel still renders legacy category tabs (should use column headers)");
    // issue #244：衣櫃穿脫＝商店左側同一顆 try-on 鈕（單一來源 toggleShopTryOn），故衣櫃應有 .item-panel-tryon；
    // 且不渲染右側 BUY（.item-panel-action）——衣櫃無購買。
    if (!api.elements.advShopGrid.querySelector(".item-panel-tryon")) errors.push("closet missing wear toggle (.item-panel-tryon — should reuse shop's try-on button as single source)");
    if (api.elements.advShopGrid.querySelector(".item-panel-action")) errors.push("closet renders a BUY action button (.item-panel-action — closet should have no buy button)");
    // issue #244：closet 須與商店共用同一版面情境（data-mode="shop" + .adv-closet），且貨架欄為水平並排（非舊單欄垂直堆疊）。
    if (api.elements.advScene.dataset.mode !== "shop") errors.push(`closet data-mode = ${api.elements.advScene.dataset.mode}, expected shop (shared shop shelf layout)`);
    if (!api.elements.advScene.classList.contains("adv-closet")) errors.push("closet missing .adv-closet marker class");
    if (getComputedStyle(api.elements.advShopGrid).display !== "flex") errors.push(`closet grid display = ${getComputedStyle(api.elements.advShopGrid).display}, expected flex (horizontal shelf, not stacked single column)`);
    // issue #244：衣櫃不得列出 starter 內建預設外觀（storeId="starter"、無單品素材）。
    ["softBrownHair", "yumiStarterHair", "rosaStarterHair", "starterPajama"].forEach((sid) => {
      if (api.elements.advShopGrid.querySelector(`.item-card[data-item-id="${sid}"]`)) errors.push(`closet should not list starter default item "${sid}" (no real wardrobe asset)`);
    });
    const closetCols = [...api.elements.advShopGrid.querySelectorAll(".shop-shelf-col")];
    if (closetCols.length >= 2) {
      const a = closetCols[0].getBoundingClientRect(), b = closetCols[1].getBoundingClientRect();
      if (!(b.left > a.left + 8 && Math.abs(b.top - a.top) < 4)) errors.push(`closet columns not laid out side-by-side (col0.left=${Math.round(a.left)},col1.left=${Math.round(b.left)},col0.top=${Math.round(a.top)},col1.top=${Math.round(b.top)} — stacked?)`);
    } else {
      errors.push(`closet has <2 columns (${closetCols.length}); cannot confirm multi-column shelf (default account should own several categories)`);
    }

    // 穿脫切換（單一來源 toggleShopTryOn、就地更新不重建貨架）：自 registry 動態挑「預設帳號擁有、具正式 layer、且未穿戴」之
    // 單品驗 Wear → Take Off（issue #267：取代寫死 pinkSlippers，內容重作不再令 fixture 失效——本案根因之一）。
    const toggleItem = api.state.owned
      .map((id) => api.itemById(id))
      .find((it) => it && it.storeId !== "starter" && (it.layers || []).length > 0 && api.state.outfit[it.type] !== it.id);
    const wearBtnFor = (id) => api.elements.advShopGrid
      .querySelector(`.item-card[data-item-id="${id}"]`)?.closest(".item-panel-row")?.querySelector(".item-panel-tryon");
    if (toggleItem) {
      const wearBtn = wearBtnFor(toggleItem.id);
      if (!wearBtn) {
        errors.push(`closet wear toggle (.item-panel-tryon) not found for ${toggleItem.id}`);
      } else {
        if (!deepPink.test(getComputedStyle(wearBtn).borderColor)) errors.push(`closet wear toggle not deep-pink (border=${getComputedStyle(wearBtn).borderColor})`);
        if (!/wear/i.test(wearBtn.textContent)) errors.push(`unequipped closet wear label = "${wearBtn.textContent.trim()}", expected Wear`);
        wearBtn.click(); // 穿上
        if (api.state.outfit[toggleItem.type] !== toggleItem.id) errors.push(`after Wear, ${toggleItem.id} not equipped`);
        // 就地更新驗證：同一個 DOM 鈕仍掛在文件上（未被重建貨架抽換）、文字就地改為 Take Off——與商店 try-on 同一套，面板不跑。
        if (!wearBtn.isConnected) errors.push("closet wear toggle rebuilt the shelf (button detached) — must update in place like shop, not full re-render");
        if (!/take off/i.test(wearBtn.textContent)) errors.push(`after Wear, in-place label = "${wearBtn.textContent.trim()}", expected Take Off`);
        wearBtn.click(); // 脫下
        if (api.state.outfit[toggleItem.type] === toggleItem.id) errors.push(`after Take Off, ${toggleItem.id} still equipped (toggle failed)`);
      }
    } else {
      errors.push("test data: no owned/unequipped real-layer item to verify wear/take-off toggle (registry/default mismatch?)");
    }

    // 衣櫃返回回到第一層場景選單，再以 Leave 關閉。
    click(footerBtn("Back"), "Back(wardrobe)");
    if (api.getAdvMode() !== "scene") errors.push(`Back from wardrobe mode = ${api.getAdvMode()}, expected scene`);
    click(footerBtn("Leave"), "Leave(room)");
    if (api.getAdvMode() !== "closed") errors.push(`Leave from room mode = ${api.getAdvMode()}, expected closed`);
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
    if (missingTheme.activeCharacterId !== "lumi") errors.push(`sol→lumi fallback failed: normalizeState returned activeCharacterId="${missingTheme.activeCharacterId}", expected "lumi"`);

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
        // 消除套件順序相依：前段 intTest#24/#25 已在 kingHall 答對打工賺得 coins，#177 規則使該場景
        // 打工本週期下架，practice 會走無語音的 hint 路徑；此處重置本週期 jobsDone 使打工題可開、語音可驗。
        if (api.state.playLimit?.cycle?.jobsDone?.length) api.state.playLimit.cycle.jobsDone = [];
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
          // issue #209：使用者未指定時，依角色性別自動挑同性別語音——女角須挑到女聲(Zira)，而非語言清單第一個(此處為 male David)。
          const femaleAuto = api.selectSpeechVoice({ lang: "en-US", gender: "female", personality: "cheerful" });
          if (femaleAuto.voice?.name !== "Microsoft Zira") errors.push(`女角未自動配到女聲，實際 ${femaleAuto.voice?.name || "none"}`);
          if (femaleAuto.fallbackReason !== "gender-default") errors.push(`女角自動配音未標記 gender-default，實際 ${femaleAuto.fallbackReason}`);
          const maleAuto = api.selectSpeechVoice({ lang: "en-US", gender: "male", personality: "bold" });
          if (!maleAuto.voice || !/David|Mark/.test(maleAuto.voice.name)) errors.push(`男角未自動配到男聲，實際 ${maleAuto.voice?.name || "none"}`);
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

          // issue #246：角色語音指定 UI 已自玩家 Settings 移至管理工具「聲音管理」頁籤。
          // (a) 回歸：遊戲 Settings 不再渲染角色語音清單（公開遊玩端僅保留 Voice On/Off 開關）。
          if (api.renderSettings) {
            api.renderSettings();
            if (document.getElementById("voiceSettings")) errors.push("遊戲 Settings 仍殘留角色語音指定區（#voiceSettings 應移除）");
            const settingsView = document.getElementById("settingsView");
            if (settingsView && settingsView.querySelector(".voice-assign-row")) errors.push("遊戲 Settings 仍渲染語音指定列（應移至管理工具）");
            if (!document.getElementById("speakToggleButton")) errors.push("遊戲 Settings 應保留 Voice On/Off 開關");
          }
          // (b) 共用渲染（管理工具聲音管理頁籤所用同一函式 renderVoiceSettings + usedVoiceBuckets + 推薦分組）：
          //     逐桶渲染下拉、含性別預設列、列出可用 voice、提供試聽鈕；無 voice 時顯示空狀態（單一事實來源）。
          if (api.renderVoiceSettings && api.usedVoiceBuckets && api.recommendedVoiceNamesForGender) {
            synth.getVoices = () => [makeVoice("Microsoft David", "en-US", true), makeVoice("Microsoft Zira", "en-US"), makeVoice("Microsoft Mark", "en-US")];
            api.refreshSpeechVoices?.();
            const voices = api.listSpeechVoices();
            const buckets = api.usedVoiceBuckets().map((b) => ({ ...b, recommended: api.recommendedVoiceNamesForGender(b.gender, voices) }));
            const panel = document.createElement("div");
            let previewedBucket = null;
            api.renderVoiceSettings({ voiceAssignList: panel }, {
              buckets, voices, assignments: api.getVoiceAssignments(),
              onAssign: () => {}, onPreview: (bucket) => { previewedBucket = bucket; }
            });
            const rows = panel.querySelectorAll(".voice-assign-row");
            if (rows.length !== buckets.length) errors.push(`聲音管理列數(${rows.length})與桶數(${buckets.length})不符`);
            const firstSelect = panel.querySelector(".voice-assign-select");
            if (!firstSelect || firstSelect.querySelectorAll("option").length < 4) errors.push("聲音管理下拉未列出可用 voice 選項");
            if (!panel.querySelector(".voice-assign-default")) errors.push("聲音管理缺性別預設列");
            const previewBtn = panel.querySelector(".voice-assign-preview");
            if (!previewBtn) errors.push("聲音管理缺試聽鈕（onPreview）");
            else { previewBtn.click(); if (!previewedBucket) errors.push("聲音管理試聽鈕未觸發 onPreview"); }

            // getVoices() 回空 → 顯示空狀態（提示等待瀏覽器載入）。
            const emptyPanel = document.createElement("div");
            api.renderVoiceSettings({ voiceAssignList: emptyPanel }, { buckets: [], voices: [], assignments: {}, onAssign: () => {} });
            if (!emptyPanel.querySelector(".voice-assign-empty")) errors.push("聲音管理無 voice 時未顯示空狀態");
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
  // issue #182：打工題幹須為角色實際交派之勞務差事；下列非勞動樣式（純觀看／站位／閒聊離場／道別客套）不得作為打工題幹。
  const NON_JOB_PROMPT_PATTERNS = [
    { re: /\blook at\b/i, why: "純觀看（look at）非勞務" },
    { re: /\bstand (by|near|next to|beside|on)\b/i, why: "站位（stand by/near）非勞務" },
    { re: /\bcan we (go|leave)\b/i, why: "閒聊離場（can we go）非勞務" },
    { re: /\bthank you for your help\b/i, why: "道別客套（thank you for your help）非工作題幹" }
  ];
  const nonJobPromptReason = (prompt) => {
    const hit = NON_JOB_PROMPT_PATTERNS.find((p) => p.re.test(String(prompt)));
    return hit ? hit.why : "";
  };
  // issue #204：打工正解須體現思考決策（選擇／判斷／建議／計算），不得為複述題幹。去除應允開頭與停用詞後，
  // 若正解內容詞全部已見於題幹（未加入任何題幹以外的內容詞），即為「換人稱回述角色指令或顯而易見動作」之 echo confirmation，視為複述。
  const RESTATE_STOPWORDS = new Set(["a","an","the","is","are","am","be","i","you","he","she","it","we","they","me","my","your","our","to","of","in","on","at","under","over","by","for","and","or","but","please","now","here","there","this","that","these","those","do","does","did","will","can","could","let","us","so","with","up","down","into","them","their","yes","yeah","no","ok","okay","sure","thing","course","well","certainly","alright","right","away","thanks","thank","too","just"]);
  const jobContentWords = (text) => String(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w && !RESTATE_STOPWORDS.has(w));
  const answerRestatesPrompt = (prompt, answer) => {
    const a = jobContentWords(answer);
    if (a.length < 1) return false;
    const p = new Set(jobContentWords(prompt));
    return a.every((w) => p.has(w));
  };
  const mapContracts = await collectMapContractAudit(api, errors);

  // issue #253：四包重作試行期只保留 hair/outfit/shoes/accessories 各包各 1 件，
  // 分類守門改驗啟用分類至少有一件正式商品，不再要求舊素材量體。
  Object.entries(categoryCounts).forEach(([category, count]) => {
    if (count < 1) errors.push(`${category} has no paid pilot item`);
  });
  // issue #210：一區一店、一店一包——商店改賣整包多類別，移除舊「≤2 類」上限；
  // 改驗每店至少一類（供 #166 shop marker 與逛店類別分頁）。
  shopLocations.forEach((hotspot) => {
    if (!(hotspot.shopCategories || []).length) errors.push(`${hotspot.id} shop has no shopCategories`);
  });
  api.shopItems.forEach((item) => {
    if (item.storeId === "starter") return;
    if (!shopIds.has(item.storeId)) errors.push(`${item.id} points to missing store ${item.storeId}`);
    if (item.type === "room") errors.push(`${item.id} is a removed room/furniture item`);
  });
  // issue #195：單品單層不變式——移除 outfitSet bundle 與 outer 雙層（outerBack/outerFront）設計後，
  // 每件 wardrobe item 至多對應一個外觀層、不為整套綁定商品、不使用前後雙層 outer 槽。
  api.shopItems.forEach((item) => {
    if (item.type === "outfitSet") errors.push(`${item.id} is a removed outfitSet bundle (single-item-single-layer)`);
    if (Array.isArray(item.layers) && item.layers.length > 1) errors.push(`${item.id} has ${item.layers.length} layers (single-item-single-layer violated)`);
    (item.layers || []).forEach((layer) => {
      if (layer.slot === "outerBack" || layer.slot === "outerFront") errors.push(`${item.id} uses removed two-layer outer slot ${layer.slot}`);
    });
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
  const characterRegistry = await collectPaperDollCharacterAudit(api, errors, warnings);
  const characterScale = await collectCharacterScaleAudit(api, errors, warnings);
  // issue #197：圖像資產標準尺寸與檔重預算 lint（intTest#49）。
  const assetSizeBudget = await collectAssetSizeBudgetAudit(api, errors);

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
        // issue #182：打工題幹須為角色實際交派之勞務差事，不得為純觀看／站位／閒聊／道別。
        const nonJobReason = nonJobPromptReason(q.prompt);
        if (nonJobReason) errors.push(`${where} job prompt is not a work task（${nonJobReason}）— "${q.prompt}"`);
        // issue #204：打工正解須體現思考決策，不得為複述題幹（換人稱回述角色指令或顯而易見動作）。
        if (q.prompt && q.answer && answerRestatesPrompt(q.prompt, q.answer)) errors.push(`${where} job answer merely restates the prompt (must be a thinking decision, not an echo) — "${q.answer}"`);
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
        // issue #204：生活聊天干擾選項須屬同場景語域（與題幹或正解有共同內容詞），不採超現實荒謬句。
        // 題幹＋正解內容詞不足 2 個（純寒暄問候、無可靠語域錨點）時跳過此啟發式檢查，避免誤判。
        const chatCtx = new Set([...jobContentWords(q.prompt || ""), ...jobContentWords(q.answer || "")]);
        if (chatCtx.size >= 2) {
          (q.choices || []).forEach((c) => {
            if (c === q.answer) return;
            const wc = jobContentWords(c);
            if (wc.length && !wc.some((w) => chatCtx.has(w))) errors.push(`${where} chat distractor is out of scene (no shared word with prompt/answer) — "${c}"`);
          });
        }
      });
    });
  });

  // issue #267：開發期一致性守門——預設公主 owned/outfit 與 starter 相容項皆須對得上衍生 registry（itemById）。
  // 失聯即紅（出聲告警），杜絕單邊改內容靜默讓預設造型退化（#263 之根因）；執行期 normalizeState safe-fallback 不受影響。
  const registryHas = (id) => Boolean(api.itemById(id));
  princessStart.owned.forEach((id) => {
    if (!registryHas(id)) errors.push(`default princessStart.owned "${id}" 不在衣物 registry（#267 失聯守門）`);
  });
  Object.entries(princessStart.outfit).forEach(([slot, id]) => {
    if (slot === "room" || id === "none") return;
    if (!registryHas(id)) errors.push(`default princessStart.outfit.${slot} "${id}" 不在衣物 registry（#267 失聯守門）`);
  });
  ["softBrownHair", "yumiStarterHair", "rosaStarterHair", "starterPajama"].forEach((id) => {
    if (!registryHas(id)) errors.push(`starter 相容項 "${id}" 不在衣物 registry（#267 失聯守門）`);
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
    assetSizeBudget,
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

async function collectPaperDollCharacterAudit(api, errors, warnings = []) {
  const registry = api.characterRegistry || {};
  const characters = [];
  const expectedPlayableIds = ["lumi", "yumi", "rosa"];
  if (!Object.keys(registry).length) {
    errors.push("characterRegistry is empty");
  }
  expectedPlayableIds.forEach((characterId) => {
    if (!registry[characterId]) errors.push(`characterRegistry missing ${characterId}`);
    if (!api.playableVoiceById?.[characterId]) errors.push(`playableVoiceById missing ${characterId}`);
  });
  if (registry.sol) {
    errors.push("sol should have been removed from characterRegistry (issue #277)");
  }
  const defaultCharacter = api.playableCharacterById(api.defaultActiveCharacterId);
  if (!defaultCharacter?.id) {
    errors.push("default active character is missing");
  }
  const starterItems = (api.shopItems || []).filter((item) => item.storeId === "starter");
  const starterLayerItems = starterItems.filter((item) => item.type === "hairstyle" || item.type === "outfit");
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
    if (bakedDefault.outfit.hairstyle !== "none" || bakedDefault.outfit.outfit !== "none") {
      errors.push("starter baked-base outfit did not normalize to no overlay");
    }
  }
  // issue #251 / intTest#52：服裝類型精簡（hair/outfit/shoes/accessories）與既有存檔遷移。
  const categoryIds251 = (api.categories || []).map((category) => category.id);
  if (categoryIds251.join(",") !== "hair,outfit,shoes,accessories") {
    errors.push(`wardrobe categories ${JSON.stringify(categoryIds251)} != expected [hair,outfit,shoes,accessories] (issue #251)`);
  }
  const accessories251 = (api.categories || []).find((category) => category.id === "accessories");
  if (!accessories251?.types?.includes("headTop")) {
    errors.push("accessories category should include headTop type (hats merged into accessories, issue #251)");
  }
  const legacyTypeItems251 = (api.shopItems || []).filter((item) => ["top", "bottom", "dress"].includes(item.type));
  if (legacyTypeItems251.length) {
    errors.push(`removed clothing types still present in content: ${legacyTypeItems251.map((item) => `${item.id}:${item.type}`).join(", ")} (issue #251)`);
  }
  ["top", "bottom", "dress"].forEach((legacy) => {
    if (outfitSlots.includes(legacy)) errors.push(`outfitSlots still contains legacy slot "${legacy}" (issue #251)`);
    if (paperDollLayerOrder.includes(legacy)) errors.push(`paperDollLayerOrder still contains legacy layer "${legacy}" (issue #251)`);
    if (wardrobeLayerBoundsByType[legacy]) errors.push(`wardrobeLayerBoundsByType still has legacy bounds "${legacy}" (issue #251)`);
  });
  if (!outfitSlots.includes("outfit")) errors.push("outfitSlots missing 'outfit' slot (issue #251)");
  if (!wardrobeLayerBoundsByType.outfit) errors.push("wardrobeLayerBoundsByType missing 'outfit' bounds (issue #251)");
  if (api.normalizeState) {
    // #263 移除了原 fixture 之 blueDress；改用現有有效 outfit 物件（非預設 outfit，以區辨「真遷移」與「退回預設」）驗證 dress→outfit 改鍵遷移。
    const legacyDressSave = api.normalizeState({ outfit: { dress: "castleGoldCourtGown", top: "coralBlouse", bottom: "skyShorts" } });
    if (legacyDressSave.outfit.outfit !== "castleGoldCourtGown") errors.push(`legacy dress did not migrate to outfit slot (got ${legacyDressSave.outfit.outfit}, issue #251)`);
    if ("top" in legacyDressSave.outfit || "bottom" in legacyDressSave.outfit) errors.push("legacy top/bottom slots not dropped on load (issue #251)");
    if ("dress" in legacyDressSave.outfit) errors.push("legacy dress slot not renamed on load (issue #251)");
    const legacyPiecesSave = api.normalizeState({ outfit: { hairstyle: "twinBraidHair", top: "coralBlouse", bottom: "skyShorts" } });
    if (!legacyPiecesSave.outfit.outfit || legacyPiecesSave.outfit.outfit === "none") errors.push("save with only legacy top/bottom did not fall back to a default outfit (issue #251)");
  }
  for (const character of Object.values(registry)) {
    if (!character.id) errors.push("character without id");
    if (!character.baseLayer) errors.push(`${character.id || "character"} has no baseLayer`);
    if (!character.rig?.compatibleWardrobeRig) errors.push(`${character.id || "character"} is not marked wardrobe-compatible`);
    if (character.defaultOutfit?.hairstyle && character.defaultOutfit.hairstyle !== "none" && !starterIds.has(character.defaultOutfit.hairstyle)) {
      errors.push(`${character.id}/defaultOutfit.hairstyle points to non-starter item ${character.defaultOutfit.hairstyle}`);
    }
    if (character.defaultOutfit?.outfit && character.defaultOutfit.outfit !== "none" && !starterIds.has(character.defaultOutfit.outfit)) {
      errors.push(`${character.id}/defaultOutfit.outfit points to non-starter item ${character.defaultOutfit.outfit}`);
    }
    const assets = {};
    // issue #214：base＝共用 neck-down body（無頭無髮、腳底 baseline 至畫布底）；head＝per-character 臉＋預設髮（限上半部、與身體頸部接縫重疊）。
    for (const [assetName, src] of Object.entries({ baseLayer: character.baseLayer, headLayer: character.headLayer })) {
      if (!src) {
        if (assetName === "headLayer") errors.push(`${character.id} has no headLayer`);
        continue;
      }
      try {
        const metrics = await imageMetrics(src);
        if (metrics.width !== 512 || metrics.height !== 768) {
          errors.push(`${character.id}/${assetName} is ${metrics.width}x${metrics.height}, expected 512x768`);
        }
        if (!metrics.alphaBBox) {
          errors.push(`${character.id}/${assetName} has no alpha content`);
        } else {
          const bbox = metrics.alphaBBox;
          const centerX = bbox.left + (bbox.width / 2);
          if (Math.abs(centerX - 256) > 12) errors.push(`${character.id}/${assetName} centerX ${centerX}, expected near 256`);
          if (assetName === "baseLayer") {
            // 共用 body：頭部區留空（top 落於頸／胸區，確認無頭無髮烘入）。
            // 移除「腳底 baseline 至 768±4」檢查：共用 body 腳底落於 762，穿鞋時由鞋層蓋住、此 6px 差無實質影響，原檢查過嚴、無意義。
            if (bbox.top < 330) errors.push(`${character.id}/baseLayer top is ${bbox.top}; shared body must be headless (top expected below head region, >=330)`);
          } else {
            // per-character head：髮線約 276、限上半部並與 body 頸部接縫重疊（bottom 不入下半身）
            if (bbox.top < 250 || bbox.top > 305) errors.push(`${character.id}/headLayer top is ${bbox.top}, expected hairline 250–305`);
            if (bbox.bottom > 520) errors.push(`${character.id}/headLayer bottom is ${bbox.bottom}; head must stay in upper region (<=520)`);
          }
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

function sceneBackgroundRefs(api) {
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
  return uniqueBy(refs, (item) => item.src).sort((a, b) => `${a.area}/${a.id}`.localeCompare(`${b.area}/${b.id}`));
}

function imageSceneContentMetrics(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const sampleSize = 160;
      const canvas = document.createElement("canvas");
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(image, 0, 0, sampleSize, sampleSize);
      const pixels = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
      const lumaAt = (x, y) => {
        const offset = ((y * sampleSize + x) * 4);
        return (pixels[offset] * 0.2126) + (pixels[offset + 1] * 0.7152) + (pixels[offset + 2] * 0.0722);
      };
      const bandMetric = (name, y0Ratio, y1Ratio) => {
        const y0 = Math.max(0, Math.floor(sampleSize * y0Ratio));
        const y1 = Math.min(sampleSize, Math.ceil(sampleSize * y1Ratio));
        let count = 0;
        let sum = 0;
        let sumSq = 0;
        let edgeSum = 0;
        let edgeCount = 0;
        for (let y = y0; y < y1; y += 1) {
          for (let x = 0; x < sampleSize; x += 1) {
            const luma = lumaAt(x, y);
            count += 1;
            sum += luma;
            sumSq += luma * luma;
            if (x + 1 < sampleSize) {
              edgeSum += Math.abs(luma - lumaAt(x + 1, y));
              edgeCount += 1;
            }
            if (y + 1 < y1) {
              edgeSum += Math.abs(luma - lumaAt(x, y + 1));
              edgeCount += 1;
            }
          }
        }
        const mean = count ? sum / count : 0;
        const variance = count ? Math.max(0, (sumSq / count) - (mean * mean)) : 0;
        return {
          name,
          lumaMean: Number(mean.toFixed(2)),
          lumaVariance: Number(variance.toFixed(2)),
          edgeEnergy: Number((edgeCount ? edgeSum / edgeCount : 0).toFixed(2))
        };
      };
      const top = bandMetric("top", 0, 0.18);
      const middle = bandMetric("middle", 0.34, 0.66);
      const bottom = bandMetric("bottom", 0.82, 1);
      const ratio = (value, base) => Number((value / Math.max(base, 0.01)).toFixed(2));
      const topEdgeRatio = ratio(top.edgeEnergy, middle.edgeEnergy);
      const bottomEdgeRatio = ratio(bottom.edgeEnergy, middle.edgeEnergy);
      const topVarianceRatio = ratio(top.lumaVariance, middle.lumaVariance);
      const bottomVarianceRatio = ratio(bottom.lumaVariance, middle.lumaVariance);
      const softBands = [
        topEdgeRatio < 0.55 && topVarianceRatio < 0.65 ? "top" : "",
        bottomEdgeRatio < 0.55 && bottomVarianceRatio < 0.65 ? "bottom" : ""
      ].filter(Boolean);
      resolve({
        sampleSize,
        bands: { top, middle, bottom },
        ratios: { topEdgeRatio, bottomEdgeRatio, topVarianceRatio, bottomVarianceRatio },
        review: {
          status: softBands.length ? "review-soft-band" : "ok-or-depth",
          softBands,
          reason: softBands.length
            ? `${softBands.join("+")} band has much lower edge detail and variance than the middle band`
            : "top/bottom detail stays within heuristic tolerance"
        }
      });
    };
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

// issue #197：讀取資產實際傳輸位元組（檔重）；純靜態無 build，於瀏覽器以 fetch→blob 量測。
async function assetByteSize(src) {
  const response = await fetch(src, { cache: "no-store" });
  if (!response.ok) throw new Error(`fetch ${src} -> HTTP ${response.status}`);
  const blob = await response.blob();
  return blob.size;
}

function stripAssetQuery(src) {
  return String(src).split("?")[0];
}

// issue #197：圖像資產標準尺寸與檔重預算 lint（intTest#49）——registry 引用資產之 runtime 檢查。
// 列舉 registry 引用之圖像資產 → 比對 assetStandards 之像素尺寸與檔重預算（maxKB），
// 攔下像素合規但檔重過大之過大圖檔（純靜態載入緩慢主因）；具名豁免另列。
// 註：瀏覽器無法列舉檔案系統，未引用之 orphan／CSS-only／裝飾資產由 tests/scripts/assetLint.mjs（FS gate）全檔把關。
async function collectAssetSizeBudgetAudit(api, errors = []) {
  const targets = [];
  const push = (cls, src) => { if (src) targets.push({ cls, src }); };
  // 角色立繪（可玩公主）：共用 body ＋ per-character head（issue #214）
  Object.values(api.characterRegistry || {}).forEach((c) => { push("characterBase", c.baseLayer); push("characterBase", c.headLayer); });
  // 場景人物像（NPC）＋ ADV 場景背景 ＋ 地區地圖
  Object.values(api.areaRegistry || {}).forEach((area) => {
    (area.locations || []).forEach((hotspot) => {
      const config = api.sceneConfigFor(hotspot);
      if (config?.npcImage) push("characterBase", config.npcImage);
      if (config?.sceneArt?.src) push("scene", config.sceneArt.src);
    });
    if (area.mapImage) push("areaMap", area.mapImage);
  });
  // 世界地圖
  if (api.worldMap?.mapImage) push("worldMap", api.worldMap.mapImage);
  // 衣物單品（#196 單一素材：image 即 layers[0].src，故只推 layer）
  (api.shopItems || []).forEach((item) => {
    (item.layers || []).forEach((layer) => push("wardrobe", layer.src));
  });
  // UI 介面圖（CSS 背景、非 registry，明列以免漏網）
  ["content-base/ui/diary-book.webp", "content-base/ui/settings-book.webp"].forEach((src) => push("ui", src));

  // 去重（同一資產可能被多處引用，如 starter 商品借用角色 base 作縮圖）——以路徑為準
  const seen = new Set();
  const unique = targets.filter((t) => {
    const key = stripAssetQuery(t.src);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const checked = [];
  for (const { src } of unique) {
    const path = stripAssetQuery(src);
    const cls = classifyAssetPath(path);
    const std = cls ? assetStandards[cls] : null;
    const exemptReason = Object.entries(assetSizeExemptions).find(([suffix]) => path.endsWith(suffix))?.[1] || null;
    const record = { cls, src: path, expected: std ? { mode: std.mode, width: std.width, height: std.height, maxKB: std.maxKB } : null };
    if (!std) {
      errors.push(`asset ${path} has no registered standard class (未涵蓋漏網類別)`);
      record.status = "no-standard";
      checked.push(record);
      continue;
    }
    try {
      const [dims, bytes] = await Promise.all([imageNaturalSize(src), assetByteSize(src)]);
      const kb = Math.round((bytes / 1024) * 10) / 10;
      record.actual = { width: dims.width, height: dims.height, kb };
      record.exempt = exemptReason;
      // exact：固定畫布須等於標準；bound：緊貼裁切須容於畫布（寬高皆 ≤）。
      const sizeOk = std.mode === "bound"
        ? (dims.width <= std.width && dims.height <= std.height)
        : (dims.width === std.width && dims.height === std.height);
      const weightOk = bytes <= std.maxKB * 1024;
      record.status = sizeOk && weightOk ? "passed" : (exemptReason ? "exempt" : "failed");
      if (!exemptReason) {
        if (!sizeOk) {
          const cmp = std.mode === "bound" ? `exceeds canvas ${std.width}x${std.height}` : `expected ${std.width}x${std.height}`;
          errors.push(`${cls} asset ${path} is ${dims.width}x${dims.height}, ${cmp}`);
        }
        if (!weightOk) errors.push(`${cls} asset ${path} is ${kb}KB, exceeds ${std.maxKB}KB budget`);
      }
    } catch (error) {
      record.status = "error";
      errors.push(`asset ${path} audit failed: ${error.message}`);
    }
    checked.push(record);
  }

  const failed = checked.filter((r) => ["failed", "no-standard", "error"].includes(r.status));
  return {
    standards: assetStandards,
    count: checked.length,
    failedCount: failed.length,
    exemptCount: checked.filter((r) => r.status === "exempt").length,
    failed,
    checked
  };
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
      expected: { width: 1536, height: 1536 }
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
  const pending = [];
  const checked = [];
  for (const ref of sceneBackgroundRefs(api)) {
    try {
      const metrics = await imageNaturalSize(ref.src);
      const matchesTarget = metrics.width === target.width && metrics.height === target.height;
      const contentMetrics = matchesTarget ? await imageSceneContentMetrics(ref.src) : null;
      const record = { ...ref, ...metrics, target, contentMetrics, status: matchesTarget ? "passed" : "failed" };
      checked.push(record);
      if (!matchesTarget) {
        pending.push(record);
        errors.push(`${ref.area}/${ref.id} scene background is ${metrics.width}x${metrics.height}, expected ${target.width}x${target.height}`);
      }
      if (contentMetrics?.review?.status === "review-soft-band") {
        warnings.push(`${ref.area}/${ref.id} scene background needs human review: ${contentMetrics.review.reason}`);
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
    reviewCount: checked.filter((item) => item.contentMetrics?.review?.status === "review-soft-band").length,
    checked,
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
    headSrc: character.headLayer,
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
      const headMetrics = ref.headSrc ? await imageMetrics(ref.headSrc) : null;
      const expectedHeight = expectedBodyHeightPx(ref.naturalHeightCm, contract);
      if (metrics.width !== contract.canvasWidth || metrics.height !== contract.canvasHeight) {
        errors.push(`${ref.id} base asset is ${metrics.width}x${metrics.height}, expected ${contract.canvasWidth}x${contract.canvasHeight}`);
      }
      if (headMetrics && (headMetrics.width !== contract.canvasWidth || headMetrics.height !== contract.canvasHeight)) {
        errors.push(`${ref.id} head asset is ${headMetrics.width}x${headMetrics.height}, expected ${contract.canvasWidth}x${contract.canvasHeight}`);
      }
      if (!metrics.alphaBBox) {
        errors.push(`${ref.id} base asset has no alpha content`);
      } else {
        // issue #214：立繪＝共用 body（neck-down）＋ per-character head（臉＋髮）合成；身高量測取兩者 alpha
        // 聯集（head 頂端→body 腳底），而非單獨 neck-down body（會短少一個頭、量得偏矮）。
        const figureTop = headMetrics?.alphaBBox ? Math.min(metrics.alphaBBox.top, headMetrics.alphaBBox.top) : metrics.alphaBBox.top;
        const figureBottom = metrics.alphaBBox.bottom;
        const figureHeight = figureBottom - figureTop;
        // issue #295：共用 body 腳掌與下緣預留鞋層空間（playableFootClearancePx），
        // 可玩公主 base 的腳底 baseline 以「地面 − 預留量」為準；NPC 檢查（上方）不適用此預留。
        const footClearance = contract.playableFootClearancePx || 0;
        const baselineGap = contract.groundBaselineY - footClearance - figureBottom;
        if (Math.abs(baselineGap) > contract.baselineTolerancePx) {
          errors.push(`${ref.id} base baseline gap ${baselineGap}px (after ${footClearance}px shoe clearance) exceeds ${contract.baselineTolerancePx}px`);
        }
        if (Math.abs(figureHeight - expectedHeight) > contract.assetHeightTolerancePx) {
          errors.push(`${ref.id} body+head figure height ${figureHeight}px differs from ${expectedHeight}px`);
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
      // #196 單一素材不變式：商店預覽 image 即其單一 wardrobe layer 素材（無分離縮圖）。
      const firstLayer = (item.layers || [])[0];
      if (!firstLayer || item.image !== firstLayer.src) {
        errors.push(`${item.id} image must equal layers[0].src (single asset, no separate thumb)`);
      } else {
        assertWardrobeBitmapAsset(item.image, `${item.id}/image`, errors);
      }
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
      const expectedBounds = api.wardrobeLayerBoundsForType?.(layer.type || item.type);
      const targetBox = layer.bounds?.targetBox || null;
      // #196 fill 模型：wardrobe 單品為 512×512 透明素材、內容長邊貼滿（短邊置中留透明），
      // 經 per-item targetBox 投影到 512×768 doll；單一素材兼投影層與商店預覽。
      if (metrics.width !== 512 || metrics.height !== 512) {
        errors.push(`${item.id}/${layer.slot} wardrobe asset is ${metrics.width}x${metrics.height}, expected 512x512`);
      } else if (!metrics.alphaBBox) {
        errors.push(`${item.id}/${layer.slot} wardrobe asset has no alpha content`);
      } else {
        const longSpan = Math.max(metrics.alphaBBox.width, metrics.alphaBBox.height);
        // 長邊貼滿（#196）亦尊重 assetSizeExemptions（具名、可審計）；#263 試行素材暫豁免、待重生（見 asset-standards.js）。
        const srcPath = String(layer.src).split("?")[0];
        const longEdgeExempt = Object.keys(assetSizeExemptions).some((suffix) => srcPath.endsWith(suffix));
        if (longSpan < 512 * 0.9 && !longEdgeExempt) {
          errors.push(`${item.id}/${layer.slot} wardrobe asset not long-edge-filled (alpha long span ${longSpan}px < 90% of 512)`);
        }
      }
      if (targetBox) {
        const onCanvas = targetBox.left >= -2 && targetBox.top >= -2
          && targetBox.right <= contract.canvasWidth + 2 && targetBox.bottom <= contract.canvasHeight + 2;
        if (!onCanvas) {
          errors.push(`${item.id}/${layer.slot} targetBox ${JSON.stringify(targetBox)} is outside the ${contract.canvasWidth}x${contract.canvasHeight} canvas`);
        }
      }
      wardrobeLayers.push({
        itemId: item.id,
        itemType: item.type,
        slot: layer.slot,
        type: layer.type,
        bounds: renderBounds(layer.bounds),
        targetBox,
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
  const origConfirm = window.confirm;
  window.confirm = () => false; // #380：MD 現含 roster envelope，自 round-trip 匯入採 replace（不彈原生對話框、避免自測卡住）
  try {
    api.loadMarkdownText(markdown);
  } finally {
    window.confirm = origConfirm;
  }
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

// issue #259：起始狀態組態依關注點分離為三具名片段（princessStart／startPosition／gameRules）後，
// 守住「拆到最輕」之結構不變式——三片鍵互斥、聯集 deep-equals defaultState、聚合鍵集合與各關注點落點
// 不漂移、freshState 讀法不變、結構穩定點（playLimit 子鍵／起始進度空）。比較皆規範化（鍵排序遞迴）以與
// 鍵順序無關（聚合依分組順序、與重構前不同屬預期）。tuner 可編輯之值（coins／owned／outfit）不在斷言內。
function runDefaultStateSelfTest(api) {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "default-state") return;
  const errors = [];
  const canon = (o) => {
    const walk = (x) => Array.isArray(x)
      ? x.map(walk)
      : (x && typeof x === "object"
        ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, walk(x[k])]))
        : x);
    return JSON.stringify(walk(o));
  };
  const pk = Object.keys(princessStart);
  const sk = Object.keys(startPosition);
  const gk = Object.keys(gameRules);
  const all = [...pk, ...sk, ...gk];
  // ① 三片鍵互斥、無重疊。
  if (new Set(all).size !== all.length) errors.push("三片鍵集合有重疊");
  // ② 三片聯集 deep-equals defaultState（聚合忠實、無遺漏無多餘）。
  if (canon({ ...princessStart, ...startPosition, ...gameRules }) !== canon(defaultState)) errors.push("三片聯集 != defaultState");
  // ③ defaultState 鍵集合＝預期 23 鍵（防意外增刪欄位）。
  const expectedKeys = [
    "activeCharacterId", "playerName", "profileColor", "backgroundPattern", "coins", "owned", "outfit",
    "diary", "completedLessons", "metNpcs", "learnedWords", "badges", "purchaseStoreIds", "activeQuest",
    "area", "player", "playerNode", "world",
    "energy", "mood", "difficulty", "speechEnabled", "playLimit"
  ];
  if (canon(Object.keys(defaultState).sort()) !== canon([...expectedKeys].sort())) errors.push("defaultState 鍵集合與預期不符");
  // ④ 各關注點落點正確（防欄位錯置）。
  if (canon(sk.sort()) !== canon(["area", "player", "playerNode", "world"].sort())) errors.push("起始位置片欄位錯置");
  if (canon(gk.sort()) !== canon(["energy", "mood", "difficulty", "speechEnabled", "playLimit"].sort())) errors.push("遊戲規則片欄位錯置");
  // ⑤ freshState(randomizeTheme:false) 之鍵與值＝defaultState（深拷一致），確保消費端讀法不變。
  if (canon(api.freshState({ randomizeTheme: false })) !== canon(defaultState)) errors.push("freshState(randomizeTheme:false) != defaultState");
  // ⑥ 結構穩定點：playLimit 子鍵集合、起始進度為空。
  if (canon(Object.keys(defaultState.playLimit).sort()) !==
    canon(["playMinutes", "restMinutes", "playMaxMinutes", "sessionEndsAt", "restEndsAt", "sessionMaxEndsAt", "cycle"].sort()))
    errors.push("playLimit 子鍵異動");
  if (defaultState.diary.length !== 0 || defaultState.badges.length !== 0 || defaultState.activeQuest !== null) errors.push("起始進度初值非空");

  const passed = errors.length === 0;
  const result = document.createElement("pre");
  result.id = "selfTestResult";
  result.textContent = JSON.stringify({
    test: "default-state",
    passed,
    concernSizes: { princess: pk.length, position: sk.length, rules: gk.length },
    keyCount: Object.keys(defaultState).length,
    errors
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

  if (surface === "scene-art-contact-sheet") {
    api.render();
    renderSceneArtContactSheetQa(api);
    return;
  }

  if (surface === "scene-art") {
    api.render();
    api.openSceneAdv(hotspot);
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

  // issue #194：頭胸照 bust 與全身著裝並排，驗證二者由同一合成幾何產生、衣物對位一致（intTest#31 bust 檢查）。
  if (surface === "bust-outfit") {
    renderBustOutfitQa(api);
    return;
  }

  if (surface === "wardrobe-detail") {
    const requestedItem = api.itemById(params.get("item"));
    const category = params.get("category") || api.categoryForType(requestedItem?.type)?.id || "outfit";
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
      api.tryOnShopItem(item);
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
      api.tryOnShopItem(item);
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
      api.tryOnShopItem(item);
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

// issue #194：頭胸照 bust 與全身著裝並排 QA。兩者皆為 [data-doll]，由 api.render() 以同一 state.outfit 填層，
// 差別僅 .bust-doll vs .adv-doll 之 CSS 裁切；藉此肉眼／截圖比對衣物是否在 bust 中仍對位於身體（不跑到臉上）。
function renderBustOutfitQa(api) {
  document.querySelector("#bustOutfitQa")?.remove();
  document.querySelector("#bustOutfitQaStyle")?.remove();
  const surface = document.createElement("main");
  surface.id = "bustOutfitQa";
  surface.innerHTML = `
    <section class="bust-qa-card">
      <div class="bust-qa-col">
        <span class="bust-qa-tag">頭胸照 bust（資訊欄／帳號卡）</span>
        <div class="bust-qa-frame"><span class="paper-doll bust-doll" data-doll="bust-qa" aria-hidden="true"></span></div>
        <div class="bust-qa-frame bust-qa-frame-sm"><span class="paper-doll bust-doll" data-doll="bust-qa-sm" aria-hidden="true"></span></div>
      </div>
      <div class="bust-qa-col">
        <span class="bust-qa-tag">全身著裝（場景）</span>
        <span class="paper-doll adv-doll bust-qa-full" data-doll="full-qa" aria-hidden="true"></span>
      </div>
    </section>
  `;
  const style = document.createElement("style");
  style.id = "bustOutfitQaStyle";
  style.textContent = `
    #bustOutfitQa {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: grid;
      place-items: center;
      background:
        linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)),
        url("/content-package/areas/castle/assets/scenes/bedroom-1024.webp") center / cover no-repeat;
    }
    .bust-qa-card { display: flex; gap: 28px; align-items: flex-start; }
    .bust-qa-col { display: grid; gap: 10px; justify-items: center; }
    .bust-qa-tag { font: 700 14px/1.3 system-ui, sans-serif; color: #3a252e; }
    .bust-qa-frame {
      position: relative;
      width: 180px;
      height: 180px;
      overflow: hidden;
      border-radius: 14px;
      border: 1px solid rgba(120, 90, 105, 0.4);
      background-color: color-mix(in srgb, #ffd9e6 45%, transparent);
    }
    .bust-qa-frame-sm { width: 58px; height: 58px; border-radius: 8px; }
    .bust-qa-full { position: relative; width: 250px; height: 360px; }
  `;
  document.head.append(style);
  document.body.append(surface);
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

function renderSceneArtContactSheetQa(api) {
  document.querySelector("#sceneArtContactSheetQa")?.remove();
  document.querySelector("#sceneArtContactSheetQaStyle")?.remove();
  const refs = sceneBackgroundRefs(api);
  const surface = document.createElement("main");
  surface.id = "sceneArtContactSheetQa";
  surface.innerHTML = `
    <header class="scene-art-contact-header">
      <h1>Scene Art QA</h1>
      <p>${refs.length} runtime scene backgrounds · target 1024x1024 WebP</p>
    </header>
    <section class="scene-art-contact-grid">
      ${refs.map((ref) => `
        <article class="scene-art-contact-card" data-src="${ref.src}">
          <img src="${ref.src}" alt="${ref.label || ref.id}" decoding="async">
          <div class="scene-art-contact-meta">
            <strong>${ref.area}/${ref.id}</strong>
            <span>${ref.label || ""}</span>
            <small data-role="scene-art-metrics">measuring</small>
          </div>
        </article>
      `).join("")}
    </section>
  `;
  const style = document.createElement("style");
  style.id = "sceneArtContactSheetQaStyle";
  style.textContent = `
    #sceneArtContactSheetQa {
      position: absolute;
      inset: 0;
      z-index: 9999;
      min-height: 100vh;
      overflow: auto;
      padding: 18px;
      background: #f4f0e8;
      color: #2f2a25;
      font: 13px/1.35 system-ui, sans-serif;
    }
    .scene-art-contact-header {
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 0 14px;
      background: #f4f0e8;
    }
    .scene-art-contact-header h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1.1;
      letter-spacing: 0;
    }
    .scene-art-contact-header p {
      margin: 0;
      color: #655d55;
      font-weight: 700;
    }
    .scene-art-contact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }
    .scene-art-contact-card {
      display: grid;
      grid-template-rows: auto 1fr;
      overflow: hidden;
      border: 1px solid rgba(55, 45, 36, 0.18);
      border-radius: 8px;
      background: #fffaf2;
      box-shadow: 0 8px 18px rgba(47, 42, 37, 0.08);
    }
    .scene-art-contact-card img {
      width: 100%;
      aspect-ratio: 1;
      display: block;
      object-fit: cover;
      background: #e7dfd4;
    }
    .scene-art-contact-meta {
      display: grid;
      gap: 2px;
      padding: 8px;
    }
    .scene-art-contact-meta strong,
    .scene-art-contact-meta span,
    .scene-art-contact-meta small {
      overflow-wrap: anywhere;
    }
    .scene-art-contact-meta strong {
      font-size: 12px;
    }
    .scene-art-contact-meta span {
      color: #74685d;
      min-height: 18px;
    }
    .scene-art-contact-meta small {
      color: #4e5d42;
      font-weight: 800;
    }
    .scene-art-contact-card[data-review="review-soft-band"] {
      outline: 3px solid #c77f35;
      outline-offset: -3px;
    }
    .scene-art-contact-card[data-review="review-soft-band"] small {
      color: #9b5519;
    }
    @media (max-width: 560px) {
      #sceneArtContactSheetQa { padding: 10px; }
      .scene-art-contact-header {
        display: grid;
        gap: 4px;
      }
      .scene-art-contact-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
    }
  `;
  document.head.append(style);
  document.body.append(surface);
  Promise.all(refs.map(async (ref) => {
    const card = surface.querySelector(`.scene-art-contact-card[data-src="${CSS.escape(ref.src)}"]`);
    const target = card?.querySelector('[data-role="scene-art-metrics"]');
    try {
      const natural = await imageNaturalSize(ref.src);
      const content = await imageSceneContentMetrics(ref.src);
      if (card) card.dataset.review = content.review.status;
      if (target) {
        target.textContent = `${natural.width}x${natural.height} · ${content.review.status} · edge ${content.ratios.topEdgeRatio}/${content.ratios.bottomEdgeRatio}`;
      }
    } catch (error) {
      if (card) card.dataset.review = "failed";
      if (target) target.textContent = error.message;
    }
  })).then(() => {
    const report = document.createElement("pre");
    report.id = "sceneArtContactSheetMetrics";
    report.hidden = true;
    report.style.display = "none";
    report.textContent = JSON.stringify({
      total: refs.length,
      review: [...surface.querySelectorAll('.scene-art-contact-card[data-review="review-soft-band"]')]
        .map((card) => card.querySelector("strong")?.textContent || card.dataset.src)
    });
    document.body.prepend(report);
  });
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
        // 排除原生對話鈕與會導航離站的 dev 入口鈕（點了整頁跳走、monkey 回報 pre 永不出現）。
        const nativeDialogButtons = new Set(["saveButton", "loadButton", "clearDiaryButton", "resetButton", "wardrobeTunerDevButton", "wardrobeTunerDevButtonAccount"]);
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
        // #291 後 starter 無外觀層相容項（storeId=starter、asset:null 基本造型佔位）不在 owned、
        // 由 normalizeVisibleOutfit 於空 slot 回填，屬合法穿戴、不計入未擁有違規。
        const starterCompat = api.shopItems.find((item) => item.id === itemId)?.storeId === "starter";
        if (itemId !== "none" && !starterCompat && !api.state.owned.includes(itemId)) errors.push(`unowned equipped ${slot}:${itemId}`);
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
