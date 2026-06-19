---
name: techStackStaticWeb
date: 2026-06-12
description: 靜態類技術選型 Profile —— HTML + JS + CSS（無框架）；產物為網站包，統一以 static-serve Helm chart 部署，並一律額外輸出裸網站包供第三方平台。
---

# I. 主旨目的

定義以原生 HTML + JS + CSS（無前端框架）實作靜態類建置單元的標準技術選型 Profile。供 design.md＜重點組態＞直接引用、＜IV.A 部署組態＞繼承其建置/測試/部署指令。

# II. 參考準備

* **適用場景**：說明網站、展示頁、靜態文件站、簡單 UI；不需框架反應式狀態之輕量介面。
* **語言/技術**：原生 HTML5 + CSS + 標準 JavaScript（ES modules）；不引入前端框架。
* **工具鏈**：可選用輕量打包（esbuild/vite static）或無打包直出；ESLint（選配）；Playwright（選配 e2e）。
* **產物型態**：**網站包**（靜態檔集合，無 runtime server）。

# III. 內容程序

* **資料夾慣例**（建置單元內）：
  * `index.html` 與資源（`css/`、`js/`、`assets/`）；如有打包則輸出 `dist/`。
  * 保持零或極少建置依賴；可直接由靜態伺服器服務。
* **指令（供 design.md＜IV.A＞繼承；特殊需求於 contract-local 覆寫）**：
  * 建置：無打包則為 no-op（直接收集靜態檔）；有打包則 `npm run build` 產出 `dist/`。
  * 測試：smoke / 連結檢查或 Playwright（選配）。
  * 部署：見「部署方法」。
* **部署方法**：**統一 Helm**——網站包掛入**標準 static-serve Helm chart**（nginx/caddy），藏 K8s gateway 後共用 TLS 終結與鑑權；單一 release/sys。
* **平行靜態資源包（一律附加）**：同一網站包除掛入 static-serve chart 外，**一律額外輸出一份裸靜態檔可攜物**（平行交付物，見 [2tech-devSet-release/RELEASE.md] §3），供 GitHub Pages／CDN 等第三方靜態託管；是否實際推上第三方由 design.md 指定，但輸出該包不以此為條件。
* **主題 tokens（Material Design 3）**：品牌種子色與字體屬設計決策（記於 `docs/design-visual/`，含參考稿），經 Material Theme Builder 由種子生成 token、**生成一次、commit 為定本後唯讀引用、不重生**（避免色彩漂移）。頁面/build 以 CSS 變數（如 `--md-sys-color-primary`）套用；衍生值由工具/AI 產生，不手工逐一刻。token 定本歸 `contract-local` 或前端 `theme/`。
* **元件通則**：引用**通用 hmiIntf 契約**之跨 repo UX 通則，以 MD3 為基座，不自訂重造。
* **視覺規範**：涉及說明網站時依 hmiIntf 視覺規範之說明網站規範實作。

# IV. 備註紀錄

* 2026-06-12：建立；techStack 第 8 類契約首批 Profile。
