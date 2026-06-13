---
name: contract-index-local
date: 2026/6/13
description: 本 repo 自訂（自訂／專用）契約索引與待補清單；通用／標準／常例契約另見 contract-common/。
---

# contract-local 索引

本 repo 專屬契約。design.md 已依名稱引用；下列標 `待補` 者尚未建檔，留待 sub-write-contract / 3dev 補齊，不影響 docLint（格式）通過。

## 已建立

| 契約 | 用途 |
|---|---|
| [hmiIntf自訂角色尺度與美術規範](hmiIntf自訂角色尺度與美術規範.md) | 紙娃娃 rig、角色自然尺度與正式美術資產規範（自 README ch2.7 拆出） |

## 待補（design.md 已引用，尚未建檔）

* **comIntf**
  * `comIntf自訂瀏覽器內模組呼叫`：瀏覽器內 ES module 之間以函式／事件互動的承載。
* **etyCfg**
  * `etyCfg通用兒童玩家`、`etyCfg通用家長維護者`、`etyCfg通用靜態主機平台`、`etyCfg標準OpenAI服務`
  * `etyCfg自訂sysGame組態`、`etyCfg自訂modContent組態`、`etyCfg自訂modState組態`、`etyCfg自訂modScene組態`
* **runAct**
  * `runAct自訂玩家答英文題`、`runAct自訂玩家地圖導航`、`runAct自訂玩家購買衣物`、`runAct自訂玩家換裝`、`runAct自訂玩家退款`、`runAct自訂玩家選角命名`、`runAct自訂玩家取得Help提示`
  * `runAct自訂系統保存進度`、`runAct自訂系統還原進度`
  * `runAct自訂玩家選擇帳號`、`runAct自訂玩家新增帳號`、`runAct自訂玩家刪除帳號`（issue #63 多帳號）
  * `runAct自訂系統遊玩計時消耗`、`runAct自訂系統時間到結算`、`runAct自訂系統休息鎖定`、`runAct自訂玩家調整遊玩限制`（issue #6 遊玩時間限制與護眼休息）
* **setAct**
  * `setAct自訂維護者部署網站`、`setAct自訂維護者移除部署`、`setAct自訂維護者擴充內容`、`setAct自訂維護者設定OpenAI輔助`、`setAct自訂玩家匯入存檔`
* **datIntf（建議補建）**
  * `datIntf自訂Markdown存檔格式`：Markdown save 的欄位、`LUMINARA_SAVE_JSON` 標記與正規化規則。
  * `datIntf自訂多帳號存檔格式`：帳號索引（`luminara-princess-english-accounts`）、每帳號進度鍵與 active 指向之結構與正規化規則（issue #63）。

## 待轉 SOP（自 README ch3 拆出）

* 六類 QA 方法論（功能／系統／介面／猴子／美術／好玩性測試）與截圖 manifest、修訂循環，建議以 9general SOP 形式建立 `docs/sop-*`；原文現存於 README 變更前版本（git 歷史）與本 issue。
