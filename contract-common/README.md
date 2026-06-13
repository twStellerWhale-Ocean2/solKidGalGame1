# contract-common

本資料夾為 2tech 契約庫（通用／標準／常例）正本的 **唯讀同步副本**，由 2plan 依 design.md 實際引用挑選後同步進來，dev 階段唯讀消費。

- 正本位置：2tech-devSet-shared/契約庫（跨 repo 傳承的單一事實來源）。
- 規則：請勿在此手改；需修訂請回正本庫，再由 sub-sync-contracts 重新同步。
- 本 repo 自訂（自訂／專用）契約另置於 `contract-local/`。

目前同步（被 docs/design.md 引用）：

| 契約 | 用途 |
|---|---|
| [comIntf通用HTTPS連線](comIntf通用HTTPS連線.md) | 玩家、瀏覽器與外部服務之 TLS 連線承載 |
| [apiIntf標準HTTP網站服務](apiIntf標準HTTP網站服務.md) | 靜態主機平台以 HTTP 交付網站包 |
| [apiIntf標準OPENAI的API協定](apiIntf標準OPENAI的API協定.md) | Help 提示呼叫 OpenAI 的介面協定 |
| [techStackStaticWeb](techStackStaticWeb.md) | 靜態類技術選型 Profile（無框架 HTML+JS+CSS） |
