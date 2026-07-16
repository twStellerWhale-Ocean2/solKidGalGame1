import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("rate limiter", () => {
  it("limits after max failures within window and recovers after window", () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 1000 });
    const t0 = 1_000_000;
    expect(limiter.isLimited("k", t0)).toBe(false);
    limiter.recordFailure("k", t0);
    limiter.recordFailure("k", t0 + 10);
    expect(limiter.isLimited("k", t0 + 20)).toBe(false);
    limiter.recordFailure("k", t0 + 30);
    expect(limiter.isLimited("k", t0 + 40)).toBe(true);
    // 窗口過後恢復
    expect(limiter.isLimited("k", t0 + 1001)).toBe(false);
  });

  it("reset clears the bucket; keys are independent", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1000 });
    limiter.recordFailure("a", 0);
    expect(limiter.isLimited("a", 1)).toBe(true);
    expect(limiter.isLimited("b", 1)).toBe(false);
    limiter.reset("a");
    expect(limiter.isLimited("a", 2)).toBe(false);
  });

  it("retryAfterMs reports remaining lockout only while limited (#331)", () => {
    const limiter = createRateLimiter({ max: 2, windowMs: 1000 });
    const t0 = 5_000;
    expect(limiter.retryAfterMs("k", t0)).toBe(0); // 未累積
    limiter.recordFailure("k", t0);
    expect(limiter.retryAfterMs("k", t0 + 10)).toBe(0); // 未達上限
    limiter.recordFailure("k", t0 + 20);
    expect(limiter.retryAfterMs("k", t0 + 100)).toBe(900); // 鎖定中：resetAt(t0+1000) − now
    expect(limiter.retryAfterMs("k", t0 + 1001)).toBe(0); // 窗口過後解除
  });
});
