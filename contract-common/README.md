# contract-common

本資料夾為 2tech 契約庫（通用／標準／常例）正本的 **唯讀同步副本**，由 2plan 依 design.md 實際引用挑選後同步進來，dev 階段唯讀消費。

- 正本位置：2tech-devSet-shared/契約庫（跨 repo 傳承的單一事實來源）。
- 規則：請勿在此手改；需修訂請回正本庫，再由 sub-sync-contracts 重新同步。
- 本 repo 自訂（自訂／專用）契約另置於 `contract-local/`。

目前同步（被 docs/design.md 引用）：

| 契約 | 用途 |
|---|---|
| [comIntf通用HTTPS連線](comIntf通用HTTPS連線.md) | 玩家、瀏覽器與外部服務之 TLS 連線承載 |
| [apiIntf標準HTTP網站服務](apiIntf標準HTTP網站服務.md) | 自架服務以 HTTP 交付遊戲殼靜態檔 |
| [apiIntf標準Postgres連線](apiIntf標準Postgres連線.md) | [sysApi系統] 至 PostgreSQL 之連線介面（issue #309） |
| [techStyle童話手繪粉彩](techStyle童話手繪粉彩.md) | 技術選型·方案風格層：低飽和粉彩、童話手繪 raster 素材紀律（issue #311 四層宣告矯正補入） |
| [techApp遊戲webApp](techApp遊戲webApp.md) | 技術選型·系統層：遊戲 webApp 系統類型（本方案單一 sys 之宣告依據，issue #311） |
| [techStackStaticWeb](techStackStaticWeb.md) | 技術選型·構件層（自建型）：無框架 HTML+JS+CSS，遊戲殼建置單元 |
| [techStackNodeSvr](techStackNodeSvr.md) | 技術選型·構件層（自建型）：Node.js+TypeScript，API 服務建置單元（issue #309） |
| [techStackPostgres](techStackPostgres.md) | 技術選型·構件層（現成服務型）：PostgreSQL 資料庫構件（原 techItem資料庫 依四層改制升列，issue #311） |
| [comIntf通用K8sHelm部署格式](comIntf通用K8sHelm部署格式.md) | helm chart 整包部署之標準部署格式與安裝契約（issue #311） |
