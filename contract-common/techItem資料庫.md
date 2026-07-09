---
name: techItem資料庫
date: 2026-06-30
description: 技術選型·元件層(techItem) Profile —— 「資料庫」功能型態，統一標準產品 PostgreSQL。於 design.md ＜III.C.(A) 技術選型＞落地版本/用法；與 techStack 多對多。
---

# I. 主旨目的

定義建置單元需要「持久化資料庫」此一功能型態時的統一選型。**型態即契約身份、標準產品寫於內容**；日後換產品只改本契約一處，引用之 design 不動。於 design.md ＜III 系統設計.C.(A) 技術選型＞引用並落地版本/用法。

# II. 參考準備

* **統一標準產品**：PostgreSQL（關聯式，支援 JSONB、遞迴 CTE、交易與約束）。
* **替代界線**：除非 design 有強需求且經 USR 核准，一律 PostgreSQL；不得各專案各選一套（SQLite／MySQL／Mongo…）造成維運分散。記憶體假庫僅限測試。

# III. 內容程序

* **連線**：經 [apiIntf標準Postgres連線]；連線參數走組態／env，不硬編。
* **資料模型慣例**：結構化欄位優先；半結構彈性用 JSONB（metadata）；需隔離／階層用遞迴 CTE。
* **完整性**：交易、外鍵／約束、必要索引；稽核可用 append-only ＋ 雜湊鏈。
* **部署**：依 techStack 家規容器化（伺服器類 sys 之依賴服務）；備援／備份於 design ＜C.(D) 部署做法＞。

# IV. 備註紀錄

* 2026-06-30：建立。techItem「資料庫」型態首份；統一 PostgreSQL。
