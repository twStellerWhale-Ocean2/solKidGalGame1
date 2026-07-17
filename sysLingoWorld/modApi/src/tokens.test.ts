import { describe, expect, it } from "vitest";
import { generateToken, hashToken } from "./tokens";

describe("tokens", () => {
  it("generates 64-hex opaque tokens, unique per call", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });

  it("hashes deterministically with pepper; different pepper gives different hash", () => {
    const token = generateToken();
    expect(hashToken(token, "pepper")).toBe(hashToken(token, "pepper"));
    expect(hashToken(token, "pepper")).not.toBe(hashToken(token, "other"));
    expect(hashToken(token, "pepper")).not.toContain(token);
  });
});
