---
name: techStyle童話手繪粉彩
date: 2026-07-10
description: 技術選型·方案層(techStyle) —— 「童話手繪粉彩」設計主軸（自 solKidGalGame 沉澱之首份 techStyle 實例）：低飽和粉彩種子、童話手繪 raster 美術語彙、兒童英語遊玩端／家長中文管理端雙語氣，與遊戲殼/管理端之風格 delta 規則。
---

# I. 主旨目的

定義「童話手繪粉彩」設計主軸，適用兒童向遊戲/學習類方案（首例 [solKidGalGame方案]）。
於 design.md ＜I.C.(C)＞ 宣告後約束方案內全部 sys；元件基座錨 [hmiIntf通用視覺規範]。

# II. 參考準備

* **受眾**：年幼學習者（遊玩端）＋家長維護者（管理端）；手機直向為第一視口。
* **公開參照**：MD3 dynamic color（種子→tonal palette）、WCAG AA 對比、童書手繪插畫風格。

# III. 內容程序

## A. 主題種子

* 品牌色種子：lavender `#6b5fb5`（primary）＋ sky `#4a6098`（secondary）；
  玩家識別色盤＝8 色低飽和粉彩（帳號識別用，允許調色器自訂、格式驗證不設白名單）。
* 字體：Noto Sans TC / Inter / Roboto / Segoe UI / system-ui（sans，禁 serif/藝術字於 UI 文字）。

## B. 主題 token 檔

* 管理面 token 檔＝`theme-md3.css`（#297 定本；light＋dark mode 同種子導出）；唯讀引用、
  複本（如 admin console）須標注「單向複本自正本」並禁各自演化。
* 遊玩端不引 MD3 token，沿 ＜C＞ 藝術語彙之粉彩變數（styles/base.css 單一 :root）。

## C. 美術風格語彙與 tone

* 美術語彙：**童話手繪 raster**——角色/場景/衣物一律手繪風點陣素材（透明 WebP/PNG），
  **禁 SVG、CSS 濾鏡、模糊補版、renderer 特例偽裝素材**；低飽和粉彩色域、柔和描邊＋自然陰影。
* tone of voice：遊玩端＝兒童友善英語（短句、鼓勵語氣、"ask your grown-up" 類指引）；
  管理端＝家長中文（白話、不用工程術語、危險操作明說後果）。

## D. 跨 sys／跨端一致性

* 必須同：品牌色種子、粉彩色域、字體鏈、tone 分工（童→英、親→中）。
* 允許 delta：**玩家遊戲端**＝童話手繪全幅視覺（不套管理網站規範）；
  **管理端**（線上管理頁、dev 管理設定工具）＝[hmiIntf通用視覺規範] MD3 管理網站基座＋本種子 token。

## E. 驗收綁定

* GATE ＜5節＞ 鏡頭 C 以本契約為尺；素材合規另受各 repo 資產標準（尺寸/檔重）與美術契約約束。

# IV. 備註紀錄

* 2026-07-10：建立（草稿）。自 solKidGalGame1 既有實況沉澱：識別色系（#131）、theme-md3 定本（#297）、
  童話手繪 raster 禁令（spec#3/#7）、雙端語氣分工（#309/#310）。
