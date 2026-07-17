# design-visual — 品牌視覺參考與主題種子

> 本目錄為設計期視覺參考（非契約）。主題 token 由種子經 Material Theme Builder 生成、commit 為定本後唯讀引用、不重生（避免色彩漂移）；元件與版型通則見 `[hmiIntf通用視覺規範]`（`contract-common/`，MD3 基座）。

## 適用對象

維護者**管理設定工具**（`devtool/wardrobe-tuner.html`，屬「管理網站／CRUD」）採 `[hmiIntf通用視覺規範]` 之 `通用性規範` ＋ `專用性規範-管理網站`；公開遊玩端不在本目錄範圍。

## 品牌種子（seed）

- **定位**：MD3 基座，視覺與遊戲一致、柔和童話調性（非生硬企業 admin）。
- **種子色**：沿用遊戲公主識別色之低飽和粉彩色盤——rose `#fda4af`、peach `#fdba74`、amber `#fcd34d`、mint `#86efac`、teal `#5eead4`、sky `#93c5fd`、lavender `#c4b5fd`、lilac `#f0abfc`；以 lavender／sky 系作為 MD3 primary 種子。
- **字體**：沿用系統 UI sans（與遊戲一致），不另引字型資產。

## 待辦（code 階段）

- 以上述種子於 Material Theme Builder 產生 MD3 token，輸出 `--md-sys-color-*` CSS 變數定本（置 `contract-local` 或前端 `theme/`），供管理工具套用；附防漂移檢查（lint／gate 斷言與種子一致）。
