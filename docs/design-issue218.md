# design-issue218 — 將現有 TOOL 編輯頁面改成「專業編輯頁面」

> 對應 issue #218。延續既有 Wardrobe Tuner（`tool/wardrobe-tuner.html`）與其 dev-only
> `server.mjs` 端點；本次把單一用途的衣物調整工具，重構為比照專業遊戲編輯軟體介面的
> **多頁籤編輯器**：上方功能頁籤、左下選項、右側設定／儲存按鈕。

## 需求拆解（來自 issue 內文）

1. 上方加功能頁籤，區分**衣物設定**與**地圖設定**（沿用專業編輯軟體的常見排版：上＝功能頁籤、
   左下＝選項、右＝設定儲存等按鈕）。
2. **衣物設定**（沿用現有功能）：
   - 中間人物預覽除了可縮放（滾輪），再加上**拖拉平移**。
   - 右側「編輯對象」除了①類型框、②單品框外，增加**無選擇**；選無選擇時兩框都消失，方便觀看
     衣物本身。選①或②時，另一個框也消失（只顯示當前編輯的框）。
   - 原本的描述詞按鈕（📝）點選常讀取失敗；改成可設定 **METADATA** 的編輯器，含名稱、價錢、
     描述詞等，讀取失敗時以空值起始而非報錯中止。
3. **地圖設定**（新功能）：
   - 檢視各地圖（World 與 castle／urban／rural／wild），在大地圖上拖拉調整各場景節點位置。
   - 可上傳更換地圖，工具自動把圖調整到該地圖的正確尺寸／解析度（cover-fit 後輸出 webp）。

## 介面結構（professional editor 慣例）

```
┌───────────────────────────────────────────────┐
│  功能頁籤：[衣物設定] [地圖設定]                  │ ← app-tabs（最上）
├───────────────────────────────────────────────┤
│  左：選項清單   │  中：預覽／編輯舞台 │ 右：設定＋儲存 │
└───────────────────────────────────────────────┘
```

- **衣物設定** panel：沿用既有三欄（左 catalog／中 preview／右 control）。
- **地圖設定** panel：頂部 map 子頁籤（World／各區）＝選擇要編輯哪張地圖；左欄＝該地圖的場景
  節點清單（選項）；中欄＝地圖與可拖拉標記；右欄＝座標數值、上傳換圖、儲存按鈕。

檔名維持 `tool/wardrobe-tuner.html`（`server.mjs` 轉址、遊戲內 dev 入口 #212、README 皆指向它），
僅在頁內重構為頁籤式編輯器，避免破壞既有連結。

## 衣物頁籤的三項調整

- **拖拉平移**：`previewStage` 既有 `transform: scale()`；改存 `state.pan{x,y}` 與 `state.zoom`，
  套 `translate(pan) scale(zoom)`。在預覽舞台空白處（非框控制點 handle）按住拖曳即平移；框的拖拉
  仍由 overlay 的 pointer 事件處理（在 handle 上 `pointerdown` 不觸發平移）。
- **編輯對象三態**：`state.editMode` 增加 `"none"`。`renderPreview` 只顯示與目前 mode 對應的框
  （type→只顯示藍框、item→只顯示綠框、none→兩框皆 `display:none`），不再把另一框當參考顯示。
- **METADATA 編輯器**：把單列 `📝` 從「prompt 描述詞」改為開啟一個 metadata 對話面板，欄位含
  名稱、價錢、描述詞。讀取走新端點 `/tool/get-item-meta`（manifest 的 name／cost＋style.json 的
  desc；任一缺值以空字串起始、不報錯）；儲存走 `/tool/save-item-meta`（就地改 manifest 該單品
  行的 `name:`／`cost:`，並寫回 style.json 的 `desc`）。

## 地圖頁籤資料來源與儲存

- 來源：`content-package/areas/world.js`（`worldMap.destinations[].x/y`）與各區 manifest
  （`<area>Area.nodes.<id>.x/y`）。標記 icon／label 取自 destinations 或 area.locations。
- 拖拉：標記以地圖寬高百分比定位；拖曳即時更新 x/y（百分比、四捨五入到小數一位）。
- 儲存座標：新端點 `/tool/save-map-positions`，就地針對每個 `id: "<id>"` 後的第一個
  `x:`／`y:` 數值做替換（world destinations 與 area nodes 皆 id 在前、x/y 在後，故可唯一定位），
  保留原檔 EOL。白名單僅限 `content-package/areas/**` 與 `content-base/world/areas|assets`。
- 上傳換圖：新端點 `/tool/upload-map`，base64 圖檔 → ImageMagick `-resize WxH^ -gravity center
  -extent WxH` cover-fit 到該地圖的 `imageSize`，輸出 webp 覆蓋既有 map 檔（world-map.webp／
  各區 map-1536.webp）。

## 安全與相容

- 全部端點維持 dev-only、僅綁 `127.0.0.1`；pack／area／id 以 `safeName` 嚴格驗證，不收任意路徑。
- 地圖座標／換圖只動白名單檔；座標寫回為最小行內替換，不重排整塊（避免動到題庫文字）。
- 公開 GitHub Pages 不含 server，地圖／衣物的「儲存／上傳」需 `node server.mjs`；純檢視與拖拉
  在靜態網頁也可用（只是無法寫回）。
</content>
</invoke>
