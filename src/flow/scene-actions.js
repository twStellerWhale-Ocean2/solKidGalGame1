export const SCENE_ACTION_TYPES = Object.freeze({
  HELP: "help",
  NAVIGATION: "navigation",
  REFUND: "refund",
  SHOP: "shop",
  WARDROBE: "wardrobe"
});

const ROOM_ACTIONS = Object.freeze([
  wardrobeAction("Hair", "hairstyle", "💇"),
  wardrobeAction("Tops", "top", "👚"),
  wardrobeAction("Bottoms", "bottom", "🩳"),
  wardrobeAction("Dresses", "dress", "👗"),
  wardrobeAction("Outerwear", "outer", "🧥"),
  wardrobeAction("Shoes", "shoes", "👞"),
  wardrobeAction("Accessories", "accessory", "🎀"),
  leaveAction()
]);

const SHOP_ACTIONS = Object.freeze([
  helpAction(),
  { type: SCENE_ACTION_TYPES.SHOP, label: "Shop", icon: "🎁", handlerKey: "shop" },
  { type: SCENE_ACTION_TYPES.REFUND, label: "Refund", icon: "💱", handlerKey: "refund" },
  leaveAction()
]);

const NPC_ACTIONS = Object.freeze([
  helpAction(),
  leaveAction()
]);

export function firstLayerActionsFor(hotspot) {
  if (hotspot?.kind === "room") return ROOM_ACTIONS;
  if (hotspot?.kind === "shop") return SHOP_ACTIONS;
  return NPC_ACTIONS;
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

function helpAction() {
  return { type: SCENE_ACTION_TYPES.HELP, label: "Help", icon: "🤝", handlerKey: "help" };
}

function leaveAction() {
  return { type: SCENE_ACTION_TYPES.NAVIGATION, label: "Leave", icon: "↩", handlerKey: "leave", navigation: true };
}
