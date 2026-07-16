// 登入／註冊速率限制（spec#23、#331）：固定時間窗、每 key（一律 ip:username——同名重試才累計，
// 代理／NodePort SNAT／家庭 NAT 共用 IP 下鄰居失敗不互鎖）計失敗次數，達上限即 429（附可再試秒數）；
// 成功登入清除該 key。in-memory 即足（單機自架、單一程序）；key 空間含任意帳號名，過期 bucket 須清理防累積。
export interface RateLimiter {
  /** 回傳 true 表示已被限流（呼叫端應回 429）。 */
  isLimited(key: string, now?: number): boolean;
  recordFailure(key: string, now?: number): void;
  reset(key: string): void;
  /** 該 key 距解除限流的剩餘毫秒（未被限流回 0）；供 429 回應附等待秒數（#331）。 */
  retryAfterMs(key: string, now?: number): number;
}

export function createRateLimiter({ max, windowMs }: { max: number; windowMs: number }): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  // 過期 bucket 惰性清理（#331 審查建議）：key 含任意帳號名、空間無上限，超過門檻即整掃過期項。
  const SWEEP_THRESHOLD = 1000;
  function sweepExpired(now: number) {
    if (buckets.size < SWEEP_THRESHOLD) return;
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }
  function bucketFor(key: string, now: number) {
    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      sweepExpired(now);
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
    },
    retryAfterMs(key, now = Date.now()) {
      const bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now || bucket.count < max) return 0;
      return bucket.resetAt - now;
    }
  };
}
