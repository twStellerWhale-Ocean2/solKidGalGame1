// 登入／註冊速率限制（spec#23）：固定時間窗、每 key（ip 或 ip|username）計失敗次數，
// 達上限即 429；成功登入清除該 key。in-memory 即足（單機自架、單一程序）。
export interface RateLimiter {
  /** 回傳 true 表示已被限流（呼叫端應回 429）。 */
  isLimited(key: string, now?: number): boolean;
  recordFailure(key: string, now?: number): void;
  reset(key: string): void;
}

export function createRateLimiter({ max, windowMs }: { max: number; windowMs: number }): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  function bucketFor(key: string, now: number) {
    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const fresh = { count: 0, resetAt: now + windowMs };
      buckets.set(key, fresh);
      return fresh;
    }
    return existing;
  }
  return {
    isLimited(key, now = Date.now()) {
      return bucketFor(key, now).count >= max;
    },
    recordFailure(key, now = Date.now()) {
      bucketFor(key, now).count += 1;
    },
    reset(key) {
      buckets.delete(key);
    }
  };
}
