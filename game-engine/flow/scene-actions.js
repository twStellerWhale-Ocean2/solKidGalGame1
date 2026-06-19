export const SCENE_ACTION_TYPES = Object.freeze({
  PRACTICE: "practice",
  CHAT: "chat",
  NAVIGATION: "navigation",
  REFUND: "refund",
  SHOP: "shop",
  WARDROBE: "wardrobe"
});

const ROOM_ACTIONS = Object.freeze([
  wardrobeAction("Hair", "hair", "💇"),
  wardrobeAction("Tops", "tops", "👚"),
  wardrobeAction("Bottoms", "bottoms", "🩳"),
  wardrobeAction("Dresses", "dresses", "👗"),
  wardrobeAction("Outerwear", "outerwear", "🧥"),
  wardrobeAction("Shoes", "shoes", "👞"),
  wardrobeAction("Hats", "hats", "👑"),
  wardrobeAction("Accessories", "accessories", "🎀"),
  wardrobeAction("Outfit Sets", "outfitSets", "✨"),
  leaveAction()
]);

const SHOP_ACTIONS = Object.freeze([
  practiceAction(),
  { type: SCENE_ACTION_TYPES.SHOP, label: "Shop", icon: "🎁", handlerKey: "shop" },
  { type: SCENE_ACTION_TYPES.REFUND, label: "Refund", icon: "💱", handlerKey: "refund" },
  leaveAction()
]);

const NPC_ACTIONS = Object.freeze([
  practiceAction(),
  leaveAction()
]);

// issue #135：場景動作改為模組驅動且加法相容——生活聊天(chat) 於有 chatLesson 時加在最前；
// 打工任務沿用既有 practice（有 lesson 時）。
// issue #138：逛店改由 shopCategories 旗標承接（isShopHotspot），不再以 kind:"shop" 特例判斷。未開啟之模組不出現。
export function isShopHotspot(hotspot) {
  return Array.isArray(hotspot?.shopCategories) && hotspot.shopCategories.length > 0;
}

export function firstLayerActionsFor(hotspot, options = {}) {
  if (hotspot?.kind === "room") return ROOM_ACTIONS;
  const chat = options.hasChat ? [chatAction()] : [];
  // issue #177：打工於本遊玩週期已答對者下架（jobDoneThisCycle），該場景本週期不再提供 Work；下一週期重置。
  const practice = options.hasLessons && !options.jobDoneThisCycle ? [practiceAction()] : [];
  if (isShopHotspot(hotspot)) {
    return Object.freeze([
      ...chat,
      ...practice,
      { type: SCENE_ACTION_TYPES.SHOP, label: "Shop", icon: "🎁", handlerKey: "shop" },
      { type: SCENE_ACTION_TYPES.REFUND, label: "Refund", icon: "💱", handlerKey: "refund" },
      leaveAction()
    ]);
  }
  return Object.freeze([...chat, ...practice, leaveAction()]);
}

export function sceneActionLabel(action) {
  return [action.icon, action.label].filter(Boolean).join(" ");
}

function wardrobeAction(label, category, icon) {
  return {
    category,
    handlerKey: "wardrobe",
    icon,
    label,
    type: SCENE_ACTION_TYPES.WARDROBE
  };
}

function practiceAction() {
  return { type: SCENE_ACTION_TYPES.PRACTICE, label: "Work", icon: "💼", handlerKey: "practice" };
}

function chatAction() {
  return { type: SCENE_ACTION_TYPES.CHAT, label: "Chat", icon: "💬", handlerKey: "chat" };
}

function leaveAction() {
  return { type: SCENE_ACTION_TYPES.NAVIGATION, label: "Leave", icon: "↩", handlerKey: "leave", navigation: true };
}
