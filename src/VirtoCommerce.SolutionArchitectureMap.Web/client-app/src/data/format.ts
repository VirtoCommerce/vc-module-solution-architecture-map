/** Value/status formatting helpers ported verbatim from the engine (solutionMap.js). */
export function fmt(n: number): string {
  return n >= 10000 ? (n / 1000).toFixed(1) + "k" : n >= 1000 ? (n / 1000).toFixed(2) + "k" : String(Math.round(n));
}
export function statusColor(s: string): string {
  return s === "down" ? "#EF4444" : s === "degraded" ? "#F5A524" : "#22C55E";
}
/**
 * Marketing-style count for stat tiles — floored so the "+" is always truthful:
 * 65432 → "65K+", 8765 → "8.7K+", 1234567 → "1.2M+", 987 → "987".
 */
export function beautifyCount(n: number): string {
  const fmt = (v: number, suffix: string) => {
    const floored = v >= 10 ? Math.floor(v) : Math.floor(v * 10) / 10;
    return `${floored}${suffix}+`;
  };
  if (n >= 1_000_000_000) return fmt(n / 1_000_000_000, "B");
  if (n >= 1_000_000) return fmt(n / 1_000_000, "M");
  if (n >= 1_000) return fmt(n / 1_000, "K");
  return String(n);
}
