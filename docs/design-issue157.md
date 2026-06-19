# design-issue157 — 各地區打工報酬與商店定價再平衡設計note

> 本檔為 issue #157 的 plan 設計note（非 design.md 正本、不受 docLint），是「打工報酬與商店定價再平衡」的**單一落地依據**。
> design.md 對應精修：spec#11（打工報酬採平緩等差地區級距、商店定價與之相稱）；連動 sysCase#11.2、＜IV＞成效#11。
> 目的：把新的報酬與定價「鎖死」，使日後新增地區／商店／商品時皆回到本檔對齊，不再漂移回陡峭階梯或失真高價。

---

## 1. 修訂定位與緣起

現行四地區打工報酬呈陡峭階梯 `城堡 20 / 市區 100 / 鄉村 500 / 森林 2000`（森林為城堡 100 倍），商店定價亦各自鏡像「該地區舊報酬」而呈 `城堡 80–240 / 市區 90–280 / 鄉村 520–560 / 森林 2050–2400` 之懸殊價差。落差過大導致兒童玩家可直衝高報酬地區洗 coins、前期地區失去意義（緣起見 Issue #157＜I＞）。

本次將**報酬壓平為平緩等差**、並把**商店定價同步壓平為相稱的平緩地區級距**，使各地區皆能於數題勞動內負擔該地區商品、最大價差由約 25× 收斂至約 2×。

**保留（不動）：**

1. 四大地區與英文分級（Castle Dolch、Urban Starters、Rural Movers、Wild Flyers）。
2. 場景、角色、互動模式與資料結構欄位（`reward`、`cost` 等鍵名與型別不變）。
3. 助攻獎勵階梯（中文協助 → 全額／半額／無，issue #73，`paramRewardSecondTryRatio=0.5`）——與地區報酬基數正交，不動。
4. 生活聊天 `chatReward = { coins: 0 }`（聊天不發 coins、改加心情）——不動。
5. 城堡、市區商店現有定價（已落在合理帶，維持）。

## 2. 打工報酬（每題答對 coins）

> ⚠️ **已被 issue #181 取代**：本節報酬表（城堡 50／市區 60／鄉村 70／森林 80）為 #157 當時依據，現行報酬已由 [docs/design-issue181.md] §2 再收斂為 `城堡 100／市區 105／鄉村 110／森林 115`（基數 100、公差 5、最大 1.15×）。本節僅留作沿革；新增地區報酬請對齊 design-issue181.md。本檔 §3 商店定價仍為現行、未被 #181 變更。

地區報酬改為**公差 10 之平緩等差**（最大 1.6×，反映各地區英文難度微幅遞增）：

| 地區 | id | 舊報酬 | **新報酬** |
|---|---|---|---|
| 城堡 | castle | 20 | **50** |
| 市區 | urban | 100 | **60** |
| 鄉村 | rural | 500 | **70** |
| 森林 | wild | 2000 | **80** |

**落地欄位**（每地區兩處，須同步）：各 area manifest 之
`{area}VocabularyProfile.rewardCoins` 與 `const jobReward = { coins: N }`。
（`rewardCoins` 目前未被引擎結算直接讀取，仍維持與 `jobReward` 同值以免漂移；單一來源整併屬技術債、不在本案範圍，列待辦。）

## 3. 商店定價（與報酬相稱之平緩地區級距）

**原則**：地區係數對齊報酬比例 `城堡 1.0 / 市區 1.2 / 鄉村 1.4 / 森林 1.6`。城堡、市區現價已落在對應帶、維持不動；僅將鄉村、森林「對齊舊報酬」的高價，重訂為對齊新報酬的帶，並修正市區精品店一件異常套裝。各商品維持店內由低到高之相對順序。

**結果帶**：單品約 80–290、套裝約 260–680，全部 1–9 題勞動可負擔。

### 3.1 鄉村（舊 520–560 → 新 150–170）

| 商店 | 商品 id | 舊 cost | **新 cost** |
|---|---|---|---|
| rural-workwear-stall | violetSailorTop | 520 | **150** |
| rural-workwear-stall | butterSailorTop | 540 | **160** |
| rural-workwear-stall | mintSkirt | 520 | **150** |
| rural-workwear-stall | sunSkirt | 540 | **160** |
| rural-workwear-stall | coralSkirt | 560 | **170** |
| rural-field-cobbler | wildBoots | 520 | **160** |
| rural-field-cobbler | plumBoots | 540 | **170** |
| rural-field-cobbler | wildTiara | 520 | **150** |
| rural-field-cobbler | auroraTiara | 560 | **160** |

### 3.2 森林（舊 2050–2400 → 新 190–290）

| 商店 | 商品 id | 舊 cost | **新 cost** |
|---|---|---|---|
| wild-fairy-atelier | coralFestivalDress | 2050 | **250** |
| wild-fairy-atelier | starlightGown | 2200 | **270** |
| wild-fairy-atelier | auroraGown | 2400 | **290** |
| wild-fairy-atelier | silverGlasses | 2050 | **190** |
| wild-fairy-atelier | moonMask | 2100 | **200** |
| wild-fairy-atelier | roseNecklace | 2150 | **210** |
| wild-fairy-atelier | lilacBag | 2200 | **220** |
| wild-dwarf-cottage | mossCloak | 2050 | **220** |
| wild-dwarf-cottage | fernCloak | 2100 | **230** |
| wild-dwarf-cottage | violetCloak | 2200 | **240** |
| wild-dwarf-cottage | autumnCloak | 2300 | **250** |
| wild-dwarf-cottage | cocoaBoots | 2050 | **200** |
| wild-dwarf-cottage | silverBoots | 2150 | **210** |

### 3.3 市區精品店異常套裝

| 商店 | 商品 id | 舊 cost | **新 cost** | 說明 |
|---|---|---|---|---|
| urban-dress-boutique | wildTrailSet | 2450 | **500** | 森林主題套裝，原價鏡像舊森林報酬；改回套裝帶（260–680）之上緣 |

其餘市區套裝（roseClassicSet 360、blueHarborSet 380、snowPrincessSet 520、mintGardenSet 440、lilacDreamSet 460、tailorDaySet 420、castleHelperSet 260、starryCapeSet 620、auroraFestivalSet 680）維持不動——已落在 4–11 題勞動可負擔帶。

## 4. 不在本案範圍（連動待辦，列明不做）

1. **shop 商品中文化／其他文案**：不動。
2. **`jobReward`／`rewardCoins` 單一來源整併**：屬既有重複欄位技術債，本案僅兩處同步調值、不重構，另列待辦。
3. **城堡、市區商店定價**：維持現狀，不重算。
4. **助攻獎勵階梯（full／half／none）、聊天回饋、護眼計時**：與報酬基數正交，不動。
5. **既有存檔玩家既有 coins 餘額**：不重置；新報酬／定價自本次起對所有帳號生效。

## 5. QA 清單（code 階段驗收）

1. 四地區 `jobReward.coins` 與 `{area}VocabularyProfile.rewardCoins` 皆為 `50/60/70/80` 且兩處同值。
2. 鄉村 9 件、森林 13 件、wildTrailSet 共 23 筆 `cost` 與 §3 表一致；城堡、市區其餘商品 `cost` 不變。
3. 全店單品 `cost` 落於 80–290、套裝落於 260–680，無 >700 之離群值。
4. 聊天題庫 `reward.coins` 仍為 0（selftest chat／data-audit 不破）。
5. 實機抽查：以新報酬於四地區各答數題，確認典型商品於 1–9 題勞動內可購；地區典型價呈 城堡≦市區≦鄉村≦森林 之平緩遞增、無單一地區畸高。
6. repoLint 0／docLint(sol) 0／manifest `node --check` 通過。
