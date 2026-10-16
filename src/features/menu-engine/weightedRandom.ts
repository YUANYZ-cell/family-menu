export function weightedPick<T>(items: T[], weight: (item: T) => number, rng: () => number): T | undefined {
  const weighted = items.map((item) => ({ item, value: Math.max(0, weight(item)) }))
  const total = weighted.reduce((sum, item) => sum + item.value, 0)
  if (!total) return undefined
  let cursor = Math.max(0, Math.min(0.999999, rng())) * total
  for (const entry of weighted) {
    cursor -= entry.value
    if (cursor <= 0) return entry.item
  }
  return weighted.at(-1)?.item
}
