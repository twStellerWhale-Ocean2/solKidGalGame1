# 設計note — issue #150 對話場景角落標示重整（公主名左上、地點＋場景角色名右上、移除 NPC 心情徽章）

> 本檔為 2plan 設計note。**初判 Option A（純呈現／版型）**：對話場景角落標示之確切版型於 `docs/design.md` ＜I／II／III／IV＞無對應落點（design.md 之 case 描述行為／能力承接，非 UI 角落標示之靜態置放），不增刪修改 spec#／case；版型決策由本 note 承載，確切角落座標／字級／兩行排版／寬窄版值留 3code 以實機 visual-qa（寬＋窄、行動直向為主）定案。相關意旨對應既有 **spec#2**（角色陪伴與場景探索之辨識／臨場沉浸）為主、旁及 **spec#6**（公主命名顯示）。⚠️ 審查點見 §4①：USR 可選擇是否比照 #125 對 spec#2 作 USR-gated 輕修以記錄「場景須標示身分／地點以強化辨識」之 design 級意旨；預設維持 Option A。

## 1. 現況量測（以產物為準）

* 對話場景＝`<section class="adv-scene" id="advScene">`（[index.html] L270）。角落相關元素由產物盤點：
  * **地名**：`.adv-location`／`#advTitle`，內容＝`hotspot.label`，現置**左上角**（[styles/adv.css] L41–55，`top:14px; left:14px`；[styles/mobile.css] 多段 media query 覆寫 `.adv-location`，散見 L2412／L3092／L3448…），由 [game-engine/main.js] L1908 `elements.advTitle.textContent = hotspot.label` 設定。
  * **「人物心情」（右上角）**：NPC 立繪右上之**表情徽章** `.adv-npc::after`，依 `data-expression`（`npcExpression`）顯示 🙂／😄／😮（[styles/adv.css] L100–127；[game-engine/main.js] L1912 `elements.advNpcPortrait.dataset.expression = npcExpression`），答對變 😄、驚訝變 😮——純視覺表情回饋、無互動意義。
  * **場景角色名**：`scene.npc`，現僅塞入 visually-hidden 之 `#advSpeaker`（[index.html] L280；[game-engine/main.js] L1913），畫面**不可見**。
  * **公主名**：玩家所選公主名（spec#6 命名），對話場景現**未顯示**。
* **表情狀態來源**：`setExpressions("normal","normal")`（[game-engine/main.js] L1898）＋答題回饋切換；`npcExpression` 餵入 `.adv-npc` 之 `data-expression`；公主立繪另以 `princessExpression` 經 `doll.dataset.expression` 切換**紙娃娃畫上的臉**（[game-engine/main.js] L572／L970），屬立繪本體、**非**角落徽章。
* **關鍵界定**：本案移除之「心情」＝上述 NPC 角落**表情徽章**（裝飾），**並非** `state.mood` 之「心情→可玩時間」機制（資訊欄 `15 +3😄 min`，spec#11／#9，刻意設計、不動）。兩者同名「心情」但分屬不同物件。
* 連線檢查：目標 repo [solKidGalGame] Issue 讀寫正常、repo 為 public 可存取。

## 2. 設計命題（USR 目標）

* 初稿（Issue #150）：「地名現於左上、右上為人物心情；改為右上先顯地名、次行顯人名、取消人物心情（無功能）。」
* USR 對話追加釐清（2026-06-18）：**左上＝公主（玩家角色）名稱；右上＝地點及場景角色（NPC）名稱。**
* 收斂為「左右對位」：左上標**公主**（立繪在左）、右上兩行＝行 1 地點／行 2 場景角色名（立繪在右），移除 NPC 表情徽章——使「我是誰、對象是誰、在哪裡」一眼可辨，且標示與各自立繪同側。

## 3. 設計決策（確切版型留 3code visual-qa）

### D1：左上＝公主名

* 左上角標示玩家所選公主名（資料源 spec#6 帳號狀態之公主命名；須相容改名／識別色情境）。取代原置此處之地名（地名移右上，見 D2）。

### D2：右上＝地點＋場景角色名（兩行）

* 右上角容器兩行：**行 1 地名**＝`hotspot.label`、**行 2 場景角色名**＝`scene.npc`。
* 缺 NPC 名之退化（純場景、無對話對象）：行 2 留空／隱藏、僅顯地名；確切退化呈現留 3code。

### D3：移除 NPC 心情表情徽章

* 移除 `.adv-npc::after` 表情徽章之**呈現**（CSS）。
* 連帶評估 `npcExpression`／NPC `data-expression` 是否尚有其他用途——僅移除**角落徽章呈現**，**不拔除**底層表情狀態（公主立繪 `princessExpression` 與其他可能消費點不動）；同時清除不再需要的 NPC 角落 `data-expression` 設定點，避免「移除呈現但殘留死碼」（3code 落實）。

### D4：寬窄共用、不另立分歧（降版型債）

* `.adv-location` 現況寬窄分歧（[styles/adv.css] 基準 vs [styles/mobile.css] 多段 media query 覆寫，同 #111／#120／#132「同元件、寬窄各自為政」技術債）；本案宜以**寬窄共用之單一標示結構**收口、差異僅止於斷點容性，不另立分歧值。
* 新增公主名／NPC 名標示沿用既有 render 流（[game-engine/main.js] L1908–1913 一帶），不分叉平行渲染。

### D5：範圍與相容

* **範圍**：對話場景 `.adv-scene` 角落標示（公主名、地點、場景角色名、NPC 表情徽章）。
* **相容**：資料源（公主名 spec#6、NPC 名 `scene.npc`、地名 `hotspot.label`）皆已存在，本案重**呈現**、不新增能力，不動答題／生活聊天／打工／逛店／換裝／語音邏輯；名稱過長截斷／換行、缺名退化留 3code。
* **協調**：與 #131 識別色、#132 資訊欄即時穿搭頭像、#111／#120 場景外框／內層高度共存、不互相打架。

## 4. 審查點（⚠️ 待 USR 裁決）

* **① design.md 落點 → 初判 Option A（建議，obj 已預核）**：場景角落標示屬純呈現／版型，design.md 無對應 case 落點、不增刪改 spec#；版型由本 note 承載。
  * **可選輕修（比照 #125）**：若 USR 希望將「對話場景須以角落標示呈現所在地點與在場人物／玩家公主之身分，以強化辨識與臨場沉浸」記為 design 級意旨，可對 **spec#2** 作 USR-gated 條文精修（spec# 編號不增減），README ＜變更紀錄＞同步。預設不做、維持 Option A。
* **② 移除對象確認**：確認移除＝NPC 角落**表情徽章**（裝飾），**非** `state.mood` 心情→可玩時間機制（不動）。
* **③ 「人名」確認**：右上次行＝場景角色（NPC，`scene.npc`）名；左上＝公主名（已於 obj 釐清，2026-06-18）。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物**：本設計note（Option A，`docs/design.md`／`README.md` 未改）。若 §4① USR 改選輕修，再補 `docs/design.md` spec#2（docLint sol 0）與 `README.md` ＜變更紀錄＞同步。
* **3code 程式產物**（依本 note §3）：
  * [index.html]：場景 DOM 調整——左上公主名容器、右上兩行（地名＋場景角色名）容器。
  * [styles/adv.css]＋[styles/mobile.css]：`.adv-location` 重定位／兩行、移除 `.adv-npc::after`，寬窄共用收口。
  * [game-engine/main.js]：填入公主名／NPC 名，移除 NPC 角落 `data-expression` 設定點（保留底層表情狀態）。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`tsc`／`docLint`（sol 0）／`repoLint` 0；`?selftest=save-load`／`monkey`／`chat`／`accounts` passed、console 0。
  * **GATE §5（實機 visual-qa，寬＋窄、行動直向為主）**：對話場景角落——左上公主名、右上行 1 地點／行 2 場景角色名正確、NPC 表情徽章不殘留、名稱過長處理得當、與資訊欄／場景外框／識別色共存；逐頁 ≥10 發現＋截圖＋分級、must-fix 全修。

## 6. 實作與驗證結果（3code，待填）

> 沿 #101／#111／#120／#132：本焦點 UI 修正之 GATE 驗證結果於 code 階段回填本節。
