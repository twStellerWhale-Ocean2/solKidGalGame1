import { describe, expect, it } from "vitest";
import { PASSWORD_MAX_LENGTH, validatePassword, validateRegistration, validateUsername } from "./validation";

describe("validateUsername", () => {
  it("accepts lowercase alphanumeric usernames starting with a letter (3-16 chars)", () => {
    expect(validateUsername("mimi")).toBe(true);
    expect(validateUsername("abc")).toBe(true);
    expect(validateUsername("mimi2018")).toBe(true);
    expect(validateUsername("a234567890123456")).toBe(true); // 16 chars
  });

  it("rejects invalid usernames", () => {
    expect(validateUsername("Mi")).toBe(false); // uppercase
    expect(validateUsername("ab")).toBe(false); // too short
    expect(validateUsername("1abc")).toBe(false); // starts with digit
    expect(validateUsername("a2345678901234567")).toBe(false); // 17 chars
    expect(validateUsername("mi mi")).toBe(false); // whitespace
    expect(validateUsername("mimi!")).toBe(false); // symbol
    expect(validateUsername("' OR 1=1--")).toBe(false); // injection-looking input
    expect(validateUsername(42)).toBe(false);
    expect(validateUsername(undefined)).toBe(false);
  });
});

describe("validatePassword", () => {
  it("enforces minimum length 6", () => {
    expect(validatePassword("12345")).toBe("password-too-short");
    expect(validatePassword("123456")).toBeNull();
    expect(validatePassword(null)).toBe("password-too-short");
  });

  it("enforces maximum length 72 (bcrypt input bound)", () => {
    expect(validatePassword("x".repeat(PASSWORD_MAX_LENGTH))).toBeNull();
    expect(validatePassword("x".repeat(PASSWORD_MAX_LENGTH + 1))).toBe("password-too-long");
  });
});

describe("validateRegistration", () => {
  it("reports username errors before password errors", () => {
    expect(validateRegistration("BAD", "123456")).toBe("invalid-username");
    expect(validateRegistration("good", "123")).toBe("password-too-short");
    expect(validateRegistration("good", "123456")).toBeNull();
  });
});
