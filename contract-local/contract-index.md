---
name: contract-index-local
date: 2026/6/19
description: 本 repo 自訂（自訂／專用）契約索引與待補清單；通用／標準／常例契約另見 contract-common/。
---

# contract-local 索引

本 repo 專屬契約。design.md 已依名稱引用；下列標 `待補` 者尚未建檔，留待 sub-write-contract / 3dev 補齊，不影響 docLint（格式）通過。

## 已建立

| 契約 | 用途 |
|---|---|
| [hmiIntf自訂角色尺度與美術規範](hmiIntf自訂角色尺度與美術規範.md) | 紙娃娃 rig、角色自然尺度、可玩角色 base 分層、ADV 場景背景完整繪製、透明輪廓描邊與 GPT 童話手繪 raster 素材規範（issue #123 補入 base 分層，issue #163 補入 Yumi/Mary 髮色與素材限制，issue #179 補入場景背景不得模糊補版，issue #199 補入角色輪廓描邊與自然陰影） |

## 待補（design.md 已引用，尚未建檔）

* **comIntf**
  * `comIntf自訂瀏覽器內模組呼叫`：瀏覽器內 ES module 之間以函式／事件互動的承載。
  * `comIntf自訂服務內模組呼叫`、`comIntf自訂資料庫連線`（issue #309 sysApi 內部承載）。
* **apiIntf**
  * `apiIntf自訂帳號存檔服務`：sysGame↔sysApi 之 `/api/*` HTTP JSON 介面（issue #309；端點高階表見 design.md ＜II.D＞，機器可驗 openapi.yaml 由 code 段交付）。
  * `apiIntf自訂線上管理服務`：維護者管理頁↔sysApi 之 `/api/admin/*` HTTP JSON 介面（issue #310；端點高階表見 design.md ＜II.D＞）。
* **etyCfg**
  * `etyCfg通用兒童玩家`、`etyCfg通用家長維護者`、`etyCfg通用自架主機平台`（原 `etyCfg通用靜態主機平台`，issue #309 改自架形態）
  * `etyCfg自訂sysGame組態`、`etyCfg自訂sysApi組態`（issue #309）、`etyCfg自訂modContent組態`、`etyCfg自訂modState組態`、`etyCfg自訂modScene組態`
* **hmiIntf**
  * `hmiIntf自訂登入註冊頁`：遊戲入口登入／註冊畫面（issue #309；規格見 design.md ＜II.D＞，參考稿 docs/design-visual/page-login.svg）。
  * `hmiIntf自訂線上管理頁`：`/admin/` 維護者線上管理介面（issue #310；規格見 design.md ＜II.D＞，參考稿 docs/design-visual/page-admin-*.svg，MD3 基座依 hmiIntf通用視覺規範）。
* **runAct**
  * `runAct自訂玩家答英文題`、`runAct自訂玩家地圖導航`、`runAct自訂玩家購買衣物`、`runAct自訂玩家換裝`、`runAct自訂玩家退款`、`runAct自訂玩家選角命名`
  * `runAct自訂系統渲染場景背景`（issue #179 ADV 場景背景完整繪製）
  * `runAct自訂系統保存進度`、`runAct自訂系統還原進度`（issue #309 改雲端存檔語意）
  * `runAct自訂玩家登入帳號`、`runAct自訂玩家註冊帳號`、`runAct自訂玩家登出帳號`（issue #309 伺服器帳號，取代原 issue #63 之選擇／新增／刪除本機帳號）
  * `runAct自訂系統驗證帳號存取`、`runAct自訂系統同步雲端存檔`（issue #309）
  * `runAct自訂系統驗證管理存取`、`runAct自訂系統套用執行期設定`（issue #310；前者為 sysApi 管理權限邊界、後者為執行期設定生效鏈）
  * `runAct自訂系統遊玩計時消耗`、`runAct自訂系統時間到結算`、`runAct自訂系統休息鎖定`、`runAct自訂玩家調整遊玩限制`（issue #6 遊玩時間限制與護眼休息）
  * `runAct自訂玩家取用中文協助`、`runAct自訂系統結算協助獎勵`（issue #73 中文協助）
  * `runAct自訂系統角色配音`、`runAct自訂系統公主朗讀作答`（issue #93 角色差異化配音）
  * `runAct自訂系統穩定語音播放`、`runAct自訂系統記錄語音診斷`（issue #109 Web Speech API 語音品質、首字清楚度與診斷）
  * `runAct自訂玩家設定角色語音`（issue #134 使用者依角色類型（性別×性格）指定平台語音、繼承與首字前置留白）
  * `runAct自訂玩家檢視關於資訊`（issue #110 About 頁籤：檢視版權宣告與版本沿革）
* **setAct**
  * `setAct自訂維護者部署網站`、`setAct自訂維護者移除部署`、`setAct自訂維護者擴充內容`、`setAct自訂玩家匯入存檔`
  * `setAct自訂維護者線上管理帳號`、`setAct自訂維護者線上調整執行期設定`（issue #310 線上管理）
* **datIntf（建議補建）**
  * `datIntf自訂Markdown存檔格式`：Markdown save 的欄位、`LUMINARA_SAVE_JSON` 標記與正規化規則。
  * `datIntf自訂多帳號存檔格式`：帳號索引（`luminara-princess-english-accounts`）、每帳號進度鍵與 active 指向之結構與正規化規則（issue #63；issue #309 後退為本機舊帳號一鍵遷移之唯讀來源）。
  * `datIntf自訂玩家帳號紀錄`：sysApi 之 ACCOUNT／SESSION／SAVE／SETTINGS 持久化模型（issue #309；issue #310 增 role、時長政策欄位與單列執行期設定；er 圖見 design.md ＜II.D＞，欄位型別與約束由 code 段 migration 落地）。
  * `datIntf自訂角色音色目錄`：角色特性維度（性別／年齡／性格…）相互組合之音色項與各項音頻參數（pitch／rate／lang／偏好 voice hint／fallback policy）對照，併同使用者依（性別×性格）類型指定之語音（含同性別繼承與指定 voice 缺失降級）之單一資料來源，含 `default` 降級項；角色（NPC 與可玩公主）以特性宣告對應一個音色項，實際 voice 解析優先採使用者指定、再退語言優先 fallback（issue #93、issue #109、issue #134）。
  * `datIntf自訂語音診斷紀錄`：每次 Web Speech API 發聲之來源、文字摘要、requested lang、voice hint、actual voice name/lang、pitch、rate、queue action、cancelCalled、utterance events、error code 與 fallback reason，用於揭露瀏覽器限制、首字截斷風險與語音品質工程狀態（issue #109）。
  * `datIntf自訂版本沿革目錄`：作品版權宣告字串與版本沿革清單（版本標識／建置時間／中文短主旨）之單一資料來源，依時間新到舊排列，當前版本為首筆並由此導出（避免與既有版本顯示雙軌）；供 modShell 渲染 About 頁籤（issue #110）。

## 待轉 SOP（自 README ch3 拆出）

* 六類 QA 方法論（功能／系統／介面／猴子／美術／好玩性測試）與截圖 manifest、修訂循環，建議以 9general SOP 形式建立 `docs/sop-*`；原文現存於 README 變更前版本（git 歷史）與本 issue。
