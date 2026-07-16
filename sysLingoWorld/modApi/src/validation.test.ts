import { describe, expect, it } from "vitest";
import { PASSWORD_MAX_LENGTH, validateLoginPassword, validatePassword, validateRegistration, validateUsername } from "./validation";

describe("validateUsername", () => {
  it("accepts lowercase alphanumeric usernames with at least one letter (3-16 chars, #330)", () => {
    expect(validateUsername("mimi")).toBe(true);
    expect(validateUsername("abc")).toBe(true);
    expect(validateUsername("mimi2018")).toBe(true);
    expect(validateUsername("2018mimi")).toBe(true); // 數字開頭（#330 開放）
    expect(validateUsername("1a2")).toBe(true); // 3 chars、數字開頭
    expect(validateUsername("a234567890123456")).toBe(true); // 16 chars
  });

  it("rejects invalid usernames", () => {
    expect(validateUsername("Mi")).toBe(false); // uppercase
    expect(validateUsername("ab")).toBe(false); // too short
    expect(validateUsername("123456")).toBe(false); // 純數字（至少一字母，#330）
    expect(validateUsername("a2345678901234567")).toBe(false); // 17 chars
    expect(validateUsername("mi mi")).toBe(false); // whitespace
    expect(validateUsername("mimi!")).toBe(false); // symbol
    expect(validateUsername("' OR 1=1--")).toBe(false); // injection-looking input
    expect(validateUsername(42)).toBe(false);
    expect(validateUsername(undefined)).toBe(false);
  });
});

describe("validatePassword (建立密碼時點之新規，#330)", () => {
  it("enforces minimum length 8", () => {
    expect(validatePassword("abc1234")).toBe("password-too-short"); // 7 碼合 mix 仍拒
    expect(validatePassword("abcd1234")).toBeNull();
    expect(validatePassword(null)).toBe("password-too-short");
  });

  it("requires at least one digit and one lowercase letter", () => {
    expect(validatePassword("abcdefgh")).toBe("password-needs-mix"); // 純字母
    expect(validatePassword("12345678")).toBe("password-needs-mix"); // 純數字
    expect(validatePassword("ABCD1234")).toBe("password-needs-mix"); // 無小寫
    expect(validatePassword("1abcdefg")).toBeNull(); // 數字開頭可（#330 不排除）
  });

  it("enforces maximum length 72 (bcrypt input bound)", () => {
    expect(validatePassword(`a1${"x".repeat(PASSWORD_MAX_LENGTH - 2)}`)).toBeNull();
    expect(validatePassword(`a1${"x".repeat(PASSWORD_MAX_LENGTH - 1)}`)).toBe("password-too-long");
  });
});

describe("validateLoginPassword (登入預檢凍結舊制下限，#330 相容鐵則)", () => {
  it("keeps legacy floor 6-72 so existing 6-7 char passwords can still sign in", () => {
    expect(validateLoginPassword("secret")).toBe(true); // 6 碼舊密碼
    expect(validateLoginPassword("secret6")).toBe(true); // 7 碼舊密碼（無 mix 要求）
    expect(validateLoginPassword("12345")).toBe(false); // <6 不存在合法帳號
    expect(validateLoginPassword("x".repeat(PASSWORD_MAX_LENGTH + 1))).toBe(false); // anti-DoS 上限
    expect(validateLoginPassword(null)).toBe(false);
  });
});

describe("validateRegistration", () => {
  it("reports username errors before password errors", () => {
    expect(validateRegistration("BAD", "abcd1234")).toBe("invalid-username");
    expect(validateRegistration("good", "123")).toBe("password-too-short");
    expect(validateRegistration("good", "abcdefgh")).toBe("password-needs-mix");
    expect(validateRegistration("good", "abcd1234")).toBeNull();
    expect(validateRegistration("2018kid", "abcd1234")).toBeNull(); // 數字開頭帳號（#330）
  });
});
