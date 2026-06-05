import { createWardrobePackTools } from "../_shared/item-helpers.js";

const { wearable } = createWardrobePackTools("urban-shoe-shop");

//#region Urban Shoe Shop 商品
// Shoe Shop 維護城市鞋類。
export const urbanShoeShopItems = [
  wearable({ id: "pinkSlippers", storeId: "shoeShop", type: "shoes", name: "Ribbon walking shoes", cost: 90, icon: "Shoes", asset: "shoes-pink-ribbon" }),
  wearable({ id: "blueBoots", storeId: "shoeShop", type: "shoes", name: "Blue seaside boots", cost: 150, icon: "Shoes", asset: "shoes-blue-boots" }),
  wearable({ id: "mintRibbonShoes", storeId: "shoeShop", type: "shoes", name: "Mint ribbon shoes", cost: 130, icon: "Shoes", asset: "shoes-mint-ribbon" }),
  wearable({ id: "lilacRibbonShoes", storeId: "shoeShop", type: "shoes", name: "Lilac ribbon shoes", cost: 150, icon: "Shoes", asset: "shoes-lilac-ribbon" }),
  wearable({ id: "sunRibbonShoes", storeId: "shoeShop", type: "shoes", name: "Sun ribbon shoes", cost: 170, icon: "Shoes", asset: "shoes-sun-ribbon" }),
  wearable({ id: "coralRibbonShoes", storeId: "shoeShop", type: "shoes", name: "Coral ribbon shoes", cost: 190, icon: "Shoes", asset: "shoes-coral-ribbon" })
];
//#endregion Urban Shoe Shop 商品
