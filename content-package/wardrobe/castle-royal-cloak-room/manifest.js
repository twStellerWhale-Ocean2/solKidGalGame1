import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("castle-royal-cloak-room");

//#region Castle Royal Cloak Room 商品
// Royal Cloak Room 維護城堡外套與頭飾。
export const castleRoyalCloakRoomItems = [
  wearable({ id: "yellowCardigan", storeId: "royalCloakRoom", type: "outer", name: "Little yellow cardigan", cost: 150, icon: "Outer", asset: "outer-yellow-cardigan" }),
  wearable({ id: "starCape", storeId: "royalCloakRoom", type: "outer", name: "Starry helper cape", cost: 240, icon: "Outer", asset: "outer-starry-cape" }),
  wearable({ id: "mintCardigan", storeId: "royalCloakRoom", type: "outer", name: "Mint royal cardigan", cost: 80, icon: "Outer", asset: "outer-mint-cardigan" }),
  wearable({ id: "moonCape", storeId: "royalCloakRoom", type: "outer", name: "Moon royal cape", cost: 120, icon: "Outer", asset: "outer-moon-cape" }),
  wearable({ id: "auroraCape", storeId: "royalCloakRoom", type: "outer", name: "Aurora royal cape", cost: 140, icon: "Outer", asset: "outer-aurora-cape" }),
  wearable({ id: "pearlTiara", storeId: "royalCloakRoom", type: "headTop", name: "Pearl royal tiara", cost: 80, icon: "Hat", asset: "headtop-pearl-tiara" }),
  wearable({ id: "starryTiara", storeId: "royalCloakRoom", type: "headTop", name: "Starry royal tiara", cost: 100, icon: "Hat", asset: "headtop-starry-tiara" }),
  wearable({ id: "rubyTiara", storeId: "royalCloakRoom", type: "headTop", name: "Ruby royal tiara", cost: 120, icon: "Hat", asset: "headtop-ruby-tiara" })
];
//#endregion Castle Royal Cloak Room 商品
