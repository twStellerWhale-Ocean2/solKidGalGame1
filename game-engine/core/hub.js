// core/hub.js — 過渡期跨模組晚繫結掛點（issue #298 拆解期間暫用）。
// main.js（組裝根）於 bootstrap 前註冊仍居 main 之函式；已拆出模組以 hub.xxx 呼叫，
// 避免模組回頭 import 入口模組（入口帶 ?v= 查詢字串，回 import 會產生第二份實例）。
// 拆解完成後應改為模組間直接 import、逐步清空本掛點。
export const hub = {};
