//#region 衣櫃分類
// category 決定 UI 顯示分類；types 決定哪些 item.type 會落入該分類。
// 顯示順序（issue #251：髮型 → outfit（整件，原 dress）→ shoes → accessories（含原 hats/headTop））。
// issue #244：移除 outerwear 類型。issue #251：移除分件 tops/bottoms 型別、dress 改名 outfit、hats 併入 accessories。
// 此順序同時驅動衣櫥分頁與商店欄位（商店另可由 hotspot.shopCategories 覆寫子集與順序）。
export const categories = [
  { id: "hair", label: "Hair", types: ["hairstyle"] },
  { id: "outfit", label: "Outfit", types: ["outfit"] },
  { id: "shoes", label: "Shoes", types: ["shoes"] },
  { id: "accessories", label: "Accessories", types: ["headTop", "headSide", "faceEyes", "faceMask", "neck", "hand"] }
];
//#endregion 衣櫃分類
