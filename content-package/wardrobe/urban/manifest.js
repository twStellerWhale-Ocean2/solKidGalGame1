import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("urban");

//#region Urban 衣物資源包（issue #210：一區一店一包）
// 都會區單一服飾店 storeId="boutique"（Dress Boutique）之資源包，含多類別衣物：
// 上衣／下身／洋裝／鞋／帽飾／配件（由原 tailor-studio／dress-boutique／
// shoe-shop／accessory-atelier 合併，itemId 全數保留以相容既有存檔）。
// 髮型（原 hair-salon）已於本次調整搬至 castle 包（storeId="castleSeamstress"）。
export const urbanItems = [
  // 上衣／下身（原 urban-tailor-studio）
  wearable({ id: "skyBlouse", storeId: "boutique", type: "top", name: "Sky blue puff blouse", cost: 100, icon: "Top", asset: "top-sky-blouse" }),
  wearable({ id: "peachSailorTop", storeId: "boutique", type: "top", name: "Peach sailor top", cost: 120, icon: "Top", asset: "top-peach-sailor" }),
  wearable({ id: "mintBlouse", storeId: "boutique", type: "top", name: "Mint puff blouse", cost: 130, icon: "Top", asset: "top-mint-blouse" }),
  wearable({ id: "lilacBlouse", storeId: "boutique", type: "top", name: "Lilac puff blouse", cost: 140, icon: "Top", asset: "top-lilac-blouse" }),
  wearable({ id: "creamBlouse", storeId: "boutique", type: "top", name: "Cream puff blouse", cost: 150, icon: "Top", asset: "top-cream-blouse" }),
  wearable({ id: "navyShorts", storeId: "boutique", type: "bottom", name: "Navy story shorts", cost: 90, icon: "Bottom", asset: "bottom-navy-shorts" }),
  wearable({ id: "roseSkirt", storeId: "boutique", type: "bottom", name: "Rose ribbon skirt", cost: 110, icon: "Bottom", asset: "bottom-rose-skirt" }),
  wearable({ id: "wildShorts", storeId: "boutique", type: "bottom", name: "Wild story shorts", cost: 130, icon: "Bottom", asset: "bottom-wild-shorts" }),
  wearable({ id: "plumShorts", storeId: "boutique", type: "bottom", name: "Plum story shorts", cost: 150, icon: "Bottom", asset: "bottom-plum-shorts" }),
  wearable({ id: "cocoaShorts", storeId: "boutique", type: "bottom", name: "Cocoa story shorts", cost: 170, icon: "Bottom", asset: "bottom-cocoa-shorts" }),
  // 洋裝（原 urban-dress-boutique）
  wearable({ id: "blueDress", storeId: "boutique", type: "dress", name: "Blue harbor dress", cost: 100, icon: "Dress", asset: "dress-blue-harbor" }),
  wearable({ id: "roseDress", storeId: "boutique", type: "dress", name: "Rose festival dress", cost: 200, icon: "Dress", asset: "dress-rose-festival" }),
  wearable({ id: "snowDress", storeId: "boutique", type: "dress", name: "Snowflake gown", cost: 260, icon: "Dress", asset: "dress-snowflake-gown" }),
  wearable({ id: "mintHarborDress", storeId: "boutique", type: "dress", name: "Mint harbor dress", cost: 220, icon: "Dress", asset: "dress-mint-harbor" }),
  wearable({ id: "lilacHarborDress", storeId: "boutique", type: "dress", name: "Lilac harbor dress", cost: 240, icon: "Dress", asset: "dress-lilac-harbor" }),
  wearable({ id: "pearlHarborDress", storeId: "boutique", type: "dress", name: "Pearl harbor dress", cost: 260, icon: "Dress", asset: "dress-pearl-harbor" }),
  wearable({ id: "lavenderFestivalDress", storeId: "boutique", type: "dress", name: "Lavender festival dress", cost: 280, icon: "Dress", asset: "dress-lavender-festival" }),
  // 鞋（原 urban-shoe-shop）
  wearable({ id: "pinkSlippers", storeId: "boutique", type: "shoes", name: "Ribbon walking shoes", cost: 90, icon: "Shoes", asset: "shoes-pink-ribbon" }),
  wearable({ id: "blueBoots", storeId: "boutique", type: "shoes", name: "Blue seaside boots", cost: 150, icon: "Shoes", asset: "shoes-blue-boots" }),
  wearable({ id: "mintRibbonShoes", storeId: "boutique", type: "shoes", name: "Mint ribbon shoes", cost: 130, icon: "Shoes", asset: "shoes-mint-ribbon" }),
  wearable({ id: "lilacRibbonShoes", storeId: "boutique", type: "shoes", name: "Lilac ribbon shoes", cost: 150, icon: "Shoes", asset: "shoes-lilac-ribbon" }),
  wearable({ id: "sunRibbonShoes", storeId: "boutique", type: "shoes", name: "Sun ribbon shoes", cost: 170, icon: "Shoes", asset: "shoes-sun-ribbon" }),
  wearable({ id: "coralRibbonShoes", storeId: "boutique", type: "shoes", name: "Coral ribbon shoes", cost: 190, icon: "Shoes", asset: "shoes-coral-ribbon" }),
  // 帽飾／配件（原 urban-accessory-atelier）
  wearable({ id: "goldCrown", storeId: "boutique", type: "headTop", name: "Tiny gold crown", cost: 140, icon: "Hat", asset: "headtop-gold-crown" }),
  wearable({ id: "roseCrown", storeId: "boutique", type: "headTop", name: "Tiny rose crown", cost: 160, icon: "Hat", asset: "headtop-rose-crown" }),
  wearable({ id: "silverCrown", storeId: "boutique", type: "headTop", name: "Tiny silver crown", cost: 180, icon: "Hat", asset: "headtop-silver-crown" }),
  wearable({ id: "lilacCrown", storeId: "boutique", type: "headTop", name: "Tiny lilac crown", cost: 200, icon: "Hat", asset: "headtop-lilac-crown" }),
  wearable({ id: "mintCrown", storeId: "boutique", type: "headTop", name: "Tiny mint crown", cost: 220, icon: "Hat", asset: "headtop-mint-crown" }),
  wearable({ id: "silkRibbon", storeId: "boutique", type: "headSide", name: "Silk party ribbon", cost: 120, icon: "Acc", asset: "headside-silk-ribbon" }),
  wearable({ id: "roundGlasses", storeId: "boutique", type: "faceEyes", name: "Round storybook glasses", cost: 120, icon: "Acc", asset: "faceeyes-round-glasses" }),
  wearable({ id: "starMask", storeId: "boutique", type: "faceMask", name: "Lavender star mask", cost: 160, icon: "Acc", asset: "facemask-star-mask" }),
  wearable({ id: "pearlNecklace", storeId: "boutique", type: "neck", name: "Pearl heart necklace", cost: 150, icon: "Acc", asset: "neck-pearl-necklace" }),
  wearable({ id: "pearlBag", storeId: "boutique", type: "hand", name: "Pearl shell bag", cost: 170, icon: "Acc", asset: "hand-pearl-bag" }),
  wearable({ id: "mintRibbon", storeId: "boutique", type: "headSide", name: "Mint party ribbon", cost: 140, icon: "Acc", asset: "headside-mint-ribbon" })
];
//#endregion Urban 衣物資源包
