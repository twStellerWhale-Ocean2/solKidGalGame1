export const SCENE_ACTION_TYPES = Object.freeze({
  PRACTICE: "practice",
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

export function firstLayerActionsFor(hotspot, options = {}) {
  if (hotspot?.kind === "room") return ROOM_ACTIONS;
  const practice = options.hasLessons ? [practiceAction()] : [];
  if (hotspot?.kind === "shop") {
    return Object.freeze([
      ...practice,
      { type: SCENE_ACTION_TYPES.SHOP, label: "Shop", icon: "🎁", handlerKey: "shop" },
      { type: SCENE_ACTION_TYPES.REFUND, label: "Refund", icon: "💱", handlerKey: "refund" },
      leaveAction()
    ]);
  }
  return Object.freeze([...practice, leaveAction()]);
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
  return { type: SCENE_ACTION_TYPES.PRACTICE, label: "Practice", icon: "📘", handlerKey: "practice" };
}

function leaveAction() {
  return { type: SCENE_ACTION_TYPES.NAVIGATION, label: "Leave", icon: "↩", handlerKey: "leave", navigation: true };
}
