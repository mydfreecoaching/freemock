/**
 * Tiny per-server-instance cache for data that every visitor reads (exam list, subjects, test list).
 * Saves database round-trips (and Neon compute) on busy pages; values are at most `ms` old.
 */
const g = globalThis;
const M = (g.__memo ||= new Map());
export async function memo(key, ms, fn) {
  const hit = M.get(key);
  if (hit && hit.t > Date.now()) return hit.v;
  const p = fn();
  M.set(key, { t: Date.now() + ms, v: p });
  try { return await p; } catch (e) { M.delete(key); throw e; }
}
