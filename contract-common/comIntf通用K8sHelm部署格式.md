---
name: comIntf通用K8sHelm部署格式
date: 2026-04-11
description: 對外交付 sysAmanda 系統部署至 K8S/Helm 平台所需之標準部署格式與安裝契約。
---

# I. 主旨目的

定義以 Helm Chart 將應用部署至 Kubernetes 平台時的標準部署格式與使用邊界。

# II. 參考準備

* **標準來源**：
  * Helm Chart 定義 Kubernetes 應用部署包結構、模板、`values` 與 release 管理方式。
  * Kubernetes Manifest 定義 Deployment、Service、Ingress、PVC、ConfigMap、Secret 等資源格式。
* **社群慣例**：
  * 本地系統以 Helm Chart、預設 `values`、安裝腳本、升級腳本與移除腳本形成部署包。
  * 部署包應保留版本資訊、必要組態鍵與可驗測的部署檢查項目。

# III. 內容程序

* 直接參考 Helm Chart、Helm Values 與 Kubernetes Resource 的官方文件。
* 標準協定，由社群軟體及 AI 直接編寫。設計師不須參與細部內容。

# IV. 備註紀錄

* 2026-04-28：依 comIntf 標準協定文件格式收斂內容。
