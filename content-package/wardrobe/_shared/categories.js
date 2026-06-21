//#region 衣櫃分類
// category 決定 UI 顯示分類；types 決定哪些 item.type 會落入該分類。
// 顯示順序（issue：髮型 → hats → tops → bottoms → dresses → outerwear → shoes → accessories）。
// 此順序同時驅動衣櫥分頁與商店欄位（商店另可由 hotspot.shopCategories 覆寫子集與順序）。
export const categories = [
  { id: "hair", label: "Hair", types: ["hairstyle"] },
  { id: "hats", label: "Hats", types: ["headTop"] },
  { id: "tops", label: "Tops", types: ["top"] },
  { id: "bottoms", label: "Bottoms", types: ["bottom"] },
  { id: "dresses", label: "Dresses", types: ["dress"] },
  { id: "outerwear", label: "Outerwear", types: ["outer"] },
  { id: "shoes", label: "Shoes", types: ["shoes"] },
  { id: "accessories", label: "Accessories", types: ["headSide", "faceEyes", "faceMask", "neck", "hand"] }
];
//#endregion 衣櫃分類
