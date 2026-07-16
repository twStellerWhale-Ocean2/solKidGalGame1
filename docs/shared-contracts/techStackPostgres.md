---
name: techStackPostgres
date: 2026-07-10
description: 技術選型·構件層(techStack)·現成服務型 —— PostgreSQL 資料庫構件。定義標準產品與版本策略、部署拓撲（單機/主從/雙活備援）、備份還原、資源基線、健康檢查與連線介面；modDb 於 design.md ＜III＞ 以文字標記 `techStack: Postgres` 綁定。（原 techItem資料庫 移列升格）
---

# I. 主旨目的

定義「持久化資料庫構件（modDb）」之統一選型：PostgreSQL。**現成服務型** techStack——
無本組織 code，以官方 image＋組態交付；本契約承載的不是建置管線，而是**維運 profile**。
換產品只改本契約一處（型態即契約身份、標準產品寫於內容），引用之 design 不動。

# II. 參考準備

* **統一標準產品**：PostgreSQL（關聯式；JSONB、遞迴 CTE、交易與約束）。官方 image（`postgres:<major>-alpine`）。
* **版本策略**：綁定 major（如 16）；minor 隨基底 image 更新；major 升版屬增量（附遷移驗證）。
* **替代界線**：除非 design 有強需求且經 USR 核准，一律 PostgreSQL；嵌入式/單機離線場景 SQLite（ADR）。
  記憶體假庫僅限單元測試（integration 一律對真 Postgres）。

# III. 內容程序

## A. 所有權與隔離（與 GLOSSARY「資料所有權／實體寄宿」互指）

* modDb 屬其 sys：per-sys database（或 schema）＋專屬帳號；**跨 sys 禁直接查表**，只走該 sys API/事件。
* **實體寄宿**：多 sys 之 modDb 得共用平台級叢集（部署期 etyCfg 決定）；寄宿不改變所有權邊界。
* **測試隔離**：整合/e2e 一律使用專用測試 database（如 `<db>_test`），不得寫營運庫。

## B. 部署拓撲（design ＜C.(D)＞ 依規模擇一並宣告）

* **單機**（預設，家庭/小型自架）：單容器＋named volume；重啟不失。
* **主從**：streaming replication＋自動 failover（工具選型於採用時定案入本契約）。
* **雙活備援**：跨節點雙寫屬高階拓撲——採用前須 ADR（衝突解決策略、腦裂防護），不預設。

## C. 維運基線

* **備份還原**：例行 `pg_dump`（指令與排程記入該 repo 產品手冊）＋**還原演練**為驗收項；
  升版/遷移前強制快照。
* **健康檢查**：容器 healthcheck `pg_isready`；服務端 readiness 以實連驗證（如 SELECT 1）。
* **資源基線**：依規模宣告 memory/connections 上限；連線一律經 pool。
* **組態**：連線字串/密碼走 env 或 secret（K8s Secret／compose env），不硬編、不入版控。

## D. 介面綁定

* 連線協定：[apiIntf標準Postgres連線]。
* schema 遷移：由擁有它的 sys（modApi）以冪等 migration 落地（ADD COLUMN IF NOT EXISTS 類零停機優先）。

# IV. 備註紀錄

* 2026-07-10：建立（草稿）。stackVersion 3.0 改制：自 `techItem資料庫`（2026-06-30）移列升格為
  現成服務型 techStack——DB 是一顆獨立部署構件（image、拓撲、備援、備份），非 mod 內函式庫；
  原契約之資料模型慣例（JSONB/遞迴 CTE/稽核鏈）併入本契約 ＜III＞ 精神不變。
