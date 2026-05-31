# Issue #10/#11 targeted surface inventory

## 主循環

本輪只處理地圖 marker 進場前的互動層，不改 ADV、Shop、Wardrobe、Diary、Save/Load 內容。

目標互動：

```text
Area Map -> marker first tap selects/highlights -> same marker second tap enters Scene
```

## 套用 skill

- `skill-9general-pwsh-command-quoting`：所有 PowerShell 指令使用指定 PowerShell 7 完整路徑。
- `skill-9general-repo-dirty-guard`：修改前已確認工作區乾淨，且先建立工作分支。
- `skill-9general-browser-tooling-guard`：瀏覽器 QA 先走 Browser plugin / `browser:browser` / `iab`。
- `build-web-apps:frontend-testing-debugging`：執行 page identity、not blank、console health、screenshot evidence、interaction proof。
- `m-skill-2tech-children-adv-game-dev`：以兒童日式 MAP ADV 的手機直向地圖體驗驗收。

## 操作流程樹

- `castle.initial`：Castle Map 初始狀態，不顯示操作說明卡。
- `castle.marker.selected`：點 Princess Room 一次，只高亮 marker，不進入房間。
- `castle.marker.enter`：再點 Princess Room，進入 Princess Room scene。
- `kingdom.initial`：Kingdom Map 初始狀態，不顯示地圖提示詞或說明卡。
- `kingdom.marker.selected`：點任一地點 marker 一次，只高亮 marker，不進入場景。
- `kingdom.marker.switch`：選取 A 後點 B，切換高亮到 B，不進入。
- `kingdom.marker.enter`：再點同一地點 marker，進入對應 scene/shop/talk。

## screenshot manifest

| flow_node_id | 入口畫面 | 操作步驟 | 預期狀態 | 必要截圖檔名 | 驗收 viewport | 是否已截圖 | 檢查結論 |
|---|---|---|---|---|---|---|---|
| castle.initial | `/#home` | 開啟頁面 | Castle Map 不顯示提示卡；只保留地圖與 marker | `castle-initial.png` | mobile portrait | 已截圖 | 通過 |
| castle.marker.selected | `/#home` | 點 Princess Room marker 一次 | marker 放大高亮；不開 room scene；無說明卡 | `castle-selected.png` | mobile portrait | 已截圖 | 通過 |
| castle.marker.enter | `/#home` | 再點 Princess Room marker | 進入 Princess Room scene | `castle-enter-room.png` | mobile portrait | 已截圖 | 通過 |
| kingdom.initial | `/#map` | 開啟 Kingdom Map | 不顯示地圖提示詞或 nearby card | `kingdom-initial.png` | mobile portrait | 已截圖 | 通過 |
| kingdom.marker.selected | `/#map` | 點 Garden marker 一次 | marker 放大高亮；不開 scene | `kingdom-selected.png` | mobile portrait | 已截圖 | 通過 |
| kingdom.marker.switch | `/#map` | 選 Garden 後點 Market 一次 | 高亮切到 Market；不開 scene | `kingdom-switch.png` | mobile portrait | 已截圖 | 通過 |
| kingdom.marker.enter | `/#map` | 再點 Market marker | 進入 Market scene | `kingdom-enter-scene.png` | mobile portrait | 已截圖 | 通過 |

## 本輪不宣稱

- 不宣稱完成全場景 visual surface sweep。
- 不宣稱 Shop、Wardrobe、Diary、Settings 的全量美術驗收。
