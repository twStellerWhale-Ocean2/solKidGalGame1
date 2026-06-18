# design-issue155 — 對話自然口語化＋打工固定應允語句 設計note

> 本檔為 issue #155 的 plan 設計note（非 design.md 正本、不受 docLint），是「對話自然口語精修」的**單一改寫依據**。
> design.md 對應精修：spec#1（公主回應須自然口語、打工正解須以固定應允語句開頭）；連動 sysCase#1.1／#11.1／#11.2、intTest#38、＜IV＞spec#1 成效。
> 直接承接 [docs/design-issue149.md]（第一人稱發話、Chat 2題×2選項／Work 3題×3選項、無 opening、四區分級硬限制）；本案只動**公主回應（`answer`／`choices`）之語感**，不動 #149 既定之發話觀點、題數、選項數、獎勵與分級。

---

## 1. 修訂定位

#149 已把對話改為角色第一人稱發話、`prompt` 為角色台詞、選項為公主回應。但公主回應（`answer`／`choices`）仍多為孤立直述句（如 `I see the crown.`／`There are eight roses.`／`Good morning, Father.`），讀來像教科書例句、缺真實聊天語氣。本案在 #149 基礎上，逐場景**精修公主回應之語感**：

1. **Chat 回應自然口語**：貼近真實聊天語氣，可適度（非強制）加語氣詞／生活用語。
2. **Work 正解固定應允開頭**：角色請公主幫忙時，公主正解須以**自然應允語句開頭**（如 `Sure thing`／`OK, I can …`／`Well, I think I can help …`）再接實質回答／回報，形成一致親切的「請求→應允」對話樣式（USR 指定為「固定回答內容」）。

**保留（不動）：** #149 全部既定規則（第一人稱、四區分級硬限制、Chat 2×2／Work 3×3、無 opening、獎勵階梯、資料結構欄位）；題幹 `prompt` 與干擾項之場景貼合與去 meta。

## 2. 語感原則（共用）

* 自然不做作為準：語氣詞「可加可不加」，避免為加而加、避免兒童難解的俚語。
* **分級為硬限制**：加語氣詞／應允開頭後仍須落在該地區英文分級（Dolch→Starters→Movers→Flyers）內，不得超綱。
* **中文鏡像（`*Zh`）同步自然口語**、非逐字硬翻（如 `Sure thing` → 「沒問題」、`OK, I can …` → 「好啊，我可以…」）。
* **選項長度勿暗示答案**：正解加上應允開頭後通常較長，干擾項（`choices`）須一併調整語感／長度，避免「最長即正解」之作答捷徑（必要時干擾項亦帶相稱的口語開頭）。
* 維持既有資料結構：`questionType`／`answer`／`choices`／`words`／`reward`／題數／選項數不變；正解仍須能由 `answer` 正確導出 `words`。

## 3. Chat 回應自然化（無固定開頭）

Chat 不設固定開頭，只要求口語自然。撰寫方向：問候帶招呼語、喜好帶情緒、答謝帶稱呼。

| 地區（分級） | 口語化方向（可用語氣詞／生活用語，分級內） | 範例（前：教科書 → 後：自然） |
|---|---|---|
| Castle（Dolch） | `Yes!`／`Oh,`／`Hi,`／`Me too.`／`Thank you,` ＋稱呼（Father／Mother／my dear） | `I am very well.` → `Oh, I am very well, Father!` |
| Urban（Starters） | `Oh,`／`Yes,`／`Wow,`／`I think …`／`Me too!` | `The room looks nice.` → `Oh yes, the room looks really nice today!` |
| Rural（Movers） | `Well,`／`Wow,`／`I think …`／`That sounds …` | `I like this warm cloak.` → `Oh, I really like this warm cloak. Thank you!` |
| Wild（Flyers） | `Well,`／`Actually,`／`That sounds …`／`I'd love to …` | （依場景，保留奇幻角色語氣） |

## 4. Work 正解固定應允開頭（本案核心）

Work＝角色請公主幫忙；公主正解一律「**應允開頭 ＋ 實質回答／回報**」兩段式。應允開頭採**分級相稱**之語句，從下列允收清單（palette）擇一，code 可擴充但須維持分級：

| 地區（分級） | 應允開頭 palette（分級內、可擴充） | 範例（前 → 後） |
|---|---|---|
| Castle（Dolch） | `Yes,`／`OK,`／`Sure,` | `I see the crown.` → `Yes, I can see the crown.`；`We can go now.` → `Sure, we can go now.` |
| Urban（Starters） | `Sure thing!`／`OK, I can …`／`Yes, I can …`／`Of course,` | `There are eight roses.` → `Sure thing! There are eight roses.` |
| Rural（Movers） | `Sure thing!`／`Of course, I will …`／`No problem,`／`Well, I can …` | `Six stones are left.` → `Of course! Six stones are left.` |
| Wild（Flyers） | `Of course, I'll …`／`Well, I think I can help.`／`Certainly,`／`Sure, I'll …` | `I will look for the bell.` → `Of course, I'll look for the bell that calls the elves.` |

* **適用範圍**：四地區所有 `{area}LessonBank`（Work）之每題 `answer`。
* **干擾項**：可帶相稱的口語開頭以平衡語感／長度，但語意／數量／時態仍須為錯（維持 #149 §14 干擾規則）。
* **中文**：應允開頭翻出對應口吻（沒問題／好啊／當然／我來幫你），再接實質回答。

## 5. selftest data-audit 落地（給 code）

於既有 `runDataAudit`（[game-engine/testing/selftests.js]）新增一條 Work 題庫稽核：

* **規則**：四地區每個 `{area}LessonBank` 之每題 `answer`，去除前置留白後須以「允收應允開頭清單」其一開頭（不分大小寫）。
* **允收清單**：集中為一份可擴充常數（如 `ACK_OPENERS`），涵蓋 §4 各區 palette；新增開頭詞須回到本 note／清單登記，避免漂移。
* Chat 自然口語感屬主觀，**不**設自動門檻；以 design.md＜IV＞spec#1 成效之人工抽查＋ CHECKLIST 把關。
* 其餘既有稽核（`answer` ∈ `choices`、題數、選項數、`*Zh` 完整、`words` 導出、chatLesson 全場景化）維持綠燈。

## 6. 逐區執行順序（建議）

1. **Castle**（Dolch 短句，先立最簡 `Yes,`／`OK,`／`Sure,` 範式與 audit）→ 2. **Urban** → 3. **Rural** → 4. **Wild**；每區改完即跑 `selftest=data-audit`／`chat`，確保結構與導出單字不破、開頭 audit 綠燈。

## 7. 最終判準

玩家公主的話讀起來像真的在聊天、在爽快答應幫忙，而不是在背例句；每個幫忙請求都得到一句自然的「好啊／沒問題／我來幫你」再接實質回應；語氣自然但不超出該地區英文分級；中英文一致且口語。
