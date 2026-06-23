# hmiIntf通用視覺規範 — 通用 hmiIntf 契約（視覺設計）

中央契約庫之**通用 hmiIntf 正本**，承載跨 repo 共用的視覺設計與元件 UX 通則（以 Material Design 3 為基座）。
各 repo 由 [sub-sync-contracts] 同步進 `contract-common/`；實作與驗收依 GATE.md §5 業界水準審查（鏡頭 A「管理網站/HMI/WUI」＋鏡頭 C 逐頁 UI/UX）對照本規範執行。
repo 專屬的主題差異（品牌色/字體 token）置於 `docs/design-visual/` 與 token 定本，不改本通用正本。

| 檔案 | 適用對象 |
|---|---|
| 通用性規範.md | 所有可視化介面（含元件 UX 通則，如 CRUD 表格按鈕擺位） |
| 專用性規範-管理網站.md | 管理網站、Dashboard、MIS、CRUD 介面 |
| 專用性規範-說明網站.md | 產品說明、展示網站 |
| 專用性規範-命令列程式.md | CLI、stage script |

本契約為多檔組合，folder 即一份契約；於 contract-index 以 `[hmiIntf通用視覺規範]` 單列索引。
