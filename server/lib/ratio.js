export function safeRatio(numerator, denominator, scale = 1) {
  const n = Number(numerator);
  const d = Number(denominator);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return null;
  return Math.max(0, Math.min(1, (n / d) * scale));
}

export function percent(numerator, denominator) {
  const value = safeRatio(numerator, denominator);
  return value === null ? null : Number((value * 100).toFixed(1));
}

export function countUnique(values) {
  return new Set(values.filter((value) => value !== null && value !== undefined).map(String)).size;
}

export function toCount(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}
