---
name: techStackNodeSvr
date: 2026-06-12
description: 技術選型·構件層(techStack)·自建型·伺服器類 —— Node.js + TypeScript；定義資料夾慣例、建置/測試/部署指令、產物型態與部署方法。
---

# I. 主旨目的

定義以 Node.js + TypeScript 實作伺服器類構件（mod＝建置單元）的標準技術選型 Profile。於 design.md ＜III＞ 以文字標記（`techStack: XXX`）標於所屬 mod 方框宣告（formatVersion 3.3；3.1/3.2 legacy 為 ＜II.B.(A)＞ 之 🧱）、＜C 組態設定.(D) 部署做法＞繼承其建置/測試/部署指令。

# II. 參考準備

* **適用場景**：主流輕量服務——Web API、即時推播（socket.io）、BFF、前後端同語言。
* **語言/框架**：Node.js LTS + TypeScript；Express／NestJS。
* **工具鏈**：npm（workspaces）或 pnpm 管依賴；ESLint + Prettier；vitest 測試。
* **產物型態**：Docker image（伺服器類，runtime 必需）。

# III. 內容程序

* **資料夾慣例**（建置單元內，生態系慣例優先）：
  * `package.json` + lockfile、`tsconfig.json`：依賴與編譯組態。
  * `src/`：應用程式碼；`*.test.ts` 或 `tests/`：vitest 測試（單元測試貼著模組）。
  * `Dockerfile`：多階段建置，產出供系統層 Helm chart 整合的 image。
* **指令（供 design.md＜C 組態設定.(D) 部署做法＞繼承；特殊需求於 design.md ＜C.(D) 部署做法＞覆寫）**：
  * 建置：`npm ci && npm run build && docker build -t <image>:<VERSION> .`
  * 測試：`npm test`（vitest，涵蓋度門檻 ≥80% 寫在 vitest 組態）。
  * 部署：見「部署方法」。
* **部署方法**：Docker image → 系統層**單一 Helm chart**（單一 release/sys；mod 只產 image、sys 層寫完整 chart）。沿用 [comIntf通用K8sHelm部署格式]。
* **對外介面綁定（apiIntf，硬性）**：對外 HTTP 介面一律以 [apiIntf] 契約（openapi.yaml 等機器可驗格式）定義並提供，契約與實作一致；design.md＜C.(C) 人機介面＞須附本 sys 的 apiIntf 高階表（uiLint／＜5節＞ 機驗）。
* **健康檢查**：須提供不受保護之 liveness/readiness 路徑（如 `/healthz`、`/readyz`）供 K8s probe；HTTP 服務不得用阻塞式單連線 demo server。
* **依賴安全基線**：上線前 `npm audit` 0 漏洞，或於 docs/adr 列明豁免（GATE.md ＜1節＞）。

# IV. 備註紀錄

* 2026-06-12：建立；techStack 第 8 類契約首批 Profile。
* 2026-06-24：適用場景重定位為「主流輕量服務」；配合家規移除 DotNetSys、收斂為封閉 4 選一（stackVersion 1.3）。
* 2026-07-05：改名 techStackNodeSys → techStackNodeSvr（stackVersion 2.0）——尾碼 Sys 與 GLOSSARY「sys＝建置單元」撞詞，改用運行形態詞 Svr（伺服器），與 Web／App 尾碼同構；內容不變。
