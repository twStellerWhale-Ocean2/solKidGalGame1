// system/api-client.js — [apiIntf自訂帳號存檔服務] 之瀏覽器端薄客戶端（issue #309 / spec#23、#24）。
// 與 sysApi/src/validation.ts 同源之帳號規則常數（值不得分歧，intTest#14 前後端雙層驗證）。
export const USERNAME_PATTERN = /^[a-z][a-z0-9]{2,15}$/;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 72;

// selftest（?selftest=auth）以 setApiFetch 注入 in-memory fake server；正式一律走同源 fetch。
let fetchImpl = (...args) => fetch(...args);
export function setApiFetch(fn) {
  fetchImpl = fn || ((...args) => fetch(...args));
}

export class ApiNetworkError extends Error {
  constructor(cause) {
    super("network-unreachable");
    this.networkError = true;
    this.cause = cause;
  }
}

async function api(pathname, { method = "GET", token = "", body } = {}) {
  let response;
  try {
    response = await fetchImpl(pathname, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (error) {
    throw new ApiNetworkError(error);
  }
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // 204 等無 body 回應
  }
  return { status: response.status, body: payload };
}

export function validateUsernameInput(username) {
  return typeof username === "string" && USERNAME_PATTERN.test(username);
}

export function validatePasswordInput(password) {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) return "password-too-short";
  if (password.length > PASSWORD_MAX_LENGTH) return "password-too-long";
  return null;
}

export function apiRegister(username, password) {
  return api("/api/auth/register", { method: "POST", body: { username, password } });
}

export function apiLogin(username, password) {
  return api("/api/auth/login", { method: "POST", body: { username, password } });
}

export function apiLogout(token) {
  return api("/api/auth/logout", { method: "POST", token });
}

export function apiGetSave(token) {
  return api("/api/save", { token });
}

export function apiPutSave(token, { state, schemaVersion = "1", baseUpdatedAt = null }) {
  return api("/api/save", { method: "PUT", token, body: { state, schemaVersion, baseUpdatedAt } });
}
