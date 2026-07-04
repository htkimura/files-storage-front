export function getStorageUsagePercent(
  usedBytes: number,
  maxBytes: number,
): number {
  if (maxBytes <= 0) return 0
  return Math.min(100, Math.round((usedBytes / maxBytes) * 100))
}
