// 서버리스 환경 — 인스턴스별 제한, 프로덕션은 Redis 권장
const store = new Map<string, { count: number; resetAt: number }>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function maybeCleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

/**
 * 슬라이딩 윈도우 인메모리 레이트 리미터.
 * @returns true = 허용, false = 초과
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  maybeCleanup(now);

  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
