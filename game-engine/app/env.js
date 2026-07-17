// issue #212：前端本機開發環境偵測（dev-tooling 閘門）。
// 收斂為單一 helper，供 dev-only UI（如衣物調整工具入口）條件顯示沿用；
// 避免把 location.hostname 判斷散寫各處，並讓閘門可由 selftest 純函式斷言。

// 本機開發環境之合法 host 白名單（封閉集合，大小寫不敏感）。
// 不含區網 IP 或自訂網域：過寬會把 dev 入口洩漏到正式站。
const LOCAL_DEV_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

// dev 入口導向之相對路徑——不寫死埠號／主機，與 devtool/start-devtool.ps1 解耦。
export const WARDROBE_TUNER_DEV_PATH = "devtool/wardrobe-tuner.html";

// issue #309：雲端模式（伺服器帳號＋雲端存檔）為正式遊玩預設；
// selftest 模式沿用本機帳號後端作為測試替身（?selftest=auth 另以注入 fake fetch 驗雲端路徑）。
export const CLOUD_MODE = typeof location !== "undefined"
  ? !new URLSearchParams(location.search).has("selftest")
  : false;

/**
 * 判斷給定 hostname 是否屬本機開發環境（純函式，供 selftest 斷言）。
 * @param {string} hostname
 * @returns {boolean}
 */
export function isLocalDevHost(hostname) {
  if (typeof hostname !== "string" || hostname.trim() === "") return false;
  return LOCAL_DEV_HOSTS.has(hostname.trim().toLowerCase());
}

/**
 * 判斷目前頁面是否運行於本機開發環境。
 * @returns {boolean}
 */
export function isLocalDevEnv() {
  return isLocalDevHost(typeof location !== "undefined" ? location.hostname : "");
}
