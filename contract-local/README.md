# contract-local

本案專用契約（`自訂`／`專用`），自由演進；成熟後可升格回 2tech 中央契約庫。通用／標準／常例契約另見 [../contract-common/](../contract-common/)。

索引與待補清單見 [contract-index.md](contract-index.md)。

## 契約分類 → 檔案格式對照

| 分類 | 語意 | 建議格式 |
|---|---|---|
| `apiIntf` | 模組間呼叫介面 | OpenAPI / Markdown |
| `comIntf` | 通訊協定與限制 | Markdown（必要時 AsyncAPI） |
| `datIntf` | 資料欄位／型別／格式 | JSON Schema / Markdown |
| `runAct` | 實體間運作行為 | Markdown |
| `setAct` | 安裝／設定／匯入／啟用等配置作業 | Markdown |
| `etyCfg` | 單一實體之組態項 | Markdown / `.env.example` |
| `hmiIntf` | 網頁式人機介面 | Markdown（含視覺/尺度規範） |

機器可驗格式（OpenAPI／AsyncAPI／JSON Schema／Gherkin／.env.example）優先；無對應時以 Markdown 載明欄位與判定。

## 已建立

| 契約 | 分類 | 用途 |
|---|---|---|
| [hmiIntf自訂角色尺度與美術規範](hmiIntf自訂角色尺度與美術規範.md) | hmiIntf | 紙娃娃 rig、角色自然尺度與正式美術資產規範 |
