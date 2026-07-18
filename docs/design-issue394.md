# 設計note — issue #394 spec 追平兩表單模式＋契約副本 techApp 同步（兩表單 Inc5）

> 承 epic #389 Increment 5——docs/spec/e2e 追平收尾（比照 #381：推翻既定 spec 需產品 sign-off，USR 2026-07-18 裁定兩表單模式）。

## 1. 修訂
- **spec#8**：改「未登入時先登入（登入後保持登入）」；成效拿掉帳號卡項。
- **新增 spec#29**（登入恆兩表單）：帳號登入一次保持登入＋每次上線經選角色頁＋角色密碼選配＋單一切換路徑＋無多帳號卡/裝置卡管理；成效指標對應。
- **HMI 頁表**：[通用登入頁] 改兩表單 canon 描述（預填帳號、僅未登入出現、無卡無回程）；新增「選角色頁」列；選角命名頁補角色密碼欄。
- **測試指令節**：e2e-register-topology 描述改「靜默續玩保持登入＋選角色頁登出（含帳號預填）」。

## 2. 方案層 e2e 追平（隨 spec 同批，train 會跑）
- `tests/e2e-account-cloud.mjs`：登入成功斷言改落選角色頁；重整＝靜默續玩直落選角色頁（保持登入）；⟳＝Switch princess 回選角色頁；Log out → 登入表單預填帳號。截圖改產 `issue390-06/07-character-home*.png`。
- `tests/e2e-register-topology.mjs`：註冊後補創角命名；C-B1 改「重整靜默續玩」；C-offline/C-位置/C-429 改走登入表單路徑（原帳號卡展開面板已拆）。

## 3. 契約副本同步
- `docs/shared-contracts/techApp遊戲webApp.md` ← canon 2026-07-18 版（含 ＜III.B 帳號/角色動線 canon＞），補平 07-10 舊版漂移。
- **命名對照註記**：canon 端已於 2026-07-18 更名 `sysTechType遊戲webApp`（四層改名 solTechStyle/sysTechType/modTechStack/cmpTechItem）；本 repo design.md 仍為 formatVersion 3.3（techStyle/techApp 詞彙），副本以機械對照（sysTechType→techApp 等）維持 repo 內一致，**整體改名隨未來 format 升版增量處理**、不入本批。

## 4. README（產品手冊）
- (B) 遊玩：改兩表單動線（保持登入、選角色頁、角色小密碼、逐角色 ⓘ/×、登出位置）；新增「舊多帳號家庭合併為一帳號多公主」步驟（MD 匯出→匯入 add）；移除帳號卡/Remove card 段與圖。
- III.A：流程圖與「登入帳號與選公主（兩張表單）」「切換公主與登出」改寫；成功判定同步。

## 5. 驗收
- docLint/repoLint 綠；spec 編號連續、與 canon ＜III.B＞ 逐條對應；兩支 e2e 本機實跑 PASS。版號 0.78.1（docs+test，patch）。
