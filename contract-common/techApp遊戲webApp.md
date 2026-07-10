---
name: techApp遊戲webApp
date: 2026-07-10
description: 技術選型·系統層(techApp) Profile —— 「自架網頁遊戲（含線上管理）」系統類型。綁最低能力清單、雙端介面水準 bar、標準 mod 組成（StaticWeb 遊戲殼＋NodeSvr API＋Postgres＋管理頁）與單一 release 部署組成。於 design.md ＜II＞ 該 sys 宣告 `techApp=遊戲webApp`。
---

# I. 主旨目的

定義「自架網頁遊戲（含線上管理）」這一**系統類型**：家庭/小群體自架伺服器、玩家帳號雲端存檔、
維護者線上管理的網頁遊戲。一經宣告即綁定：(1) 最低能力清單、(2) 雙端介面水準 bar、
(3) **標準 mod 組成**與**單一 release 部署組成**、(4) 點名 techItem。
sys 顆粒判準依 GLOSSARY（≈微服務：本型 sys 擁有玩家資料所有權與 `/api/*` 對外契約、獨立演進）。

# II. 參考準備

* **適用場景**：一家一伺服器的兒童/家庭網頁遊戲；玩家=兒童（家長協助）、維護者=家長。
* **公開參照**：不重造輪子——帳號體系（bcrypt、opaque session）、樂觀併發（updatedAt）、
  護眼/家長管控慣例、MD3 管理網站慣例（管理端）。
* **四層鏈**：sol 之 techStyle 定風格 → 本契約定 sys 組成 → 各 mod 綁 techStack → techItem 進 mod。

# III. 內容程序

## A. 最低能力清單（GATE ＜5節＞ 鏡頭 A 逐項對照）

* **玩家帳號與雲端存檔**：註冊/登入/登出、session 快取續玩、跨裝置還原、樂觀併發不靜默覆蓋、
  離線韌性（伺服器暫不可達可續玩、背景重試、明確同步提示）。
* **兒童端可用性**：手機直向第一視口、觸控 ≥44px、錯誤訊息兒童友善、家長協助輸入動線。
* **護眼/家長管控**：遊玩時長限制與強制休息；維護者可鎖定個別帳號時長（管控屬家長輔助，非防駭防線）。
* **維護者線上管理**（管理網站常規，勿只顧遊戲域功能）：登入/登出、帳號清單、線上重設密碼、
  撤銷登入、刪除帳號（二次確認、防自鎖）、執行期設定（儲存即生效）、關於/版本、使用說明入口。
* **安全基線**：密碼單向雜湊、統一錯誤不洩帳號存在性、速率限制僅計失敗、受保護 API 一律驗 session、
  管理 API 一律驗 admin 身分、靜態服務 allowlist（不外洩原始碼樹）。
* **維運**：健康檢查（/healthz、/readyz）、資料庫備份還原程序記入產品手冊。

## B. 介面水準 bar（GATE ＜5節＞ 鏡頭 C 逐頁判讀；雙端分流）

* **玩家遊戲端**：沿 sol 之 techStyle 全幅藝術視覺（不套管理網站皮）；不得出現任何管理/dev 入口。
* **管理端**：MD3 管理網站基座＋techStyle token；行動視口可用（表格降級卡片列）；
  危險操作 error 色＋二次確認、回饋 snackbar、未儲存變更防護。
* **不合格樣式（出現即回修）**：兒童端曝露管理入口、管理端硬寫色/原生 alert、
  截圖證據混入 dev-only 元素、鎖定/唯讀狀態無視覺標示。

## C. 標準 mod 組成（每 mod 綁一個 techStack，圖以文字標記 `techStack: XXX`）

| mod | techStack | 職責 |
|---|---|---|
| modShell | StaticWeb | 遊戲殼（無框架 ES modules；內容包同屬此構件交付） |
| modAdmin | StaticWeb（複雜化時 ReactWeb，走 ADR） | 線上管理頁（/admin/ 靜態子樹） |
| modApi | NodeSvr | 帳號/存檔/管理 API＋靜態服務 allowlist |
| modDb | Postgres（現成服務型） | 玩家資料與執行期設定；所有權屬本 sys |

* 點名 techItem：無硬性強制（語音類走瀏覽器內建 Web Speech；如引入外部 TTS/評分再點名對應 techItem）。

## D. 部署組成（單一 release）

* 部署選型 `deployHelm`：**一個 sys＝一個 helm chart**——modApi image（烘入 modShell/modAdmin 靜態包，
  同站服務免 CORS）＋ modDb（chart 依賴或實體寄宿平台叢集，寄宿不改所有權）。
* 過渡期（helm 化前）等效形態：compose 資料庫＋node 服務同站，允許為增量中繼態。
* TLS：藏 gateway 後終結；內網 HTTP 過渡須明文風險與「勿轉發公網」警語。

# IV. 備註紀錄

* 2026-07-10：建立（草稿）。第三份 techApp；自 solKidGalGame1 #309/#310 落地經驗沉澱
  （能力清單即該兩增量之 spec#23–#26 收斂）。舊制對照：該 repo 現行 design 將本型 sys 寫成
  sysGame/sysApi 兩系統，屬 stackVersion 2.0 之「techStack 綁 sys」殘留，隨格式升版矯正。
