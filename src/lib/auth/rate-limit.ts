const hits = new Map<string, number[]>();

export function allowAuthAttempt(key: string, limit = 8, windowMs = 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((hit) => now - hit < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  hits.set(key, recent);
  return true;
}
