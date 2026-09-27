/**
 * Rounds `parts` to whole `unit`s so that the rounded parts add up to the rounded
 * total (largest-remainder method; ties go to the bigger part). Returns unit counts.
 *
 * Only exact halves ever go "the other way": 27 215 + 9 225 = 36 440 thousand $
 * becomes 27,22 + 9,22 = 36,44 instead of 27,22 + 9,23 = 36,45.
 */
export function splitRound(parts: number[], unit: number, target?: number): number[] {
  const exact = parts.map((p) => p / unit)
  const counts = exact.map(Math.floor)
  const goal = target ?? Math.round(exact.reduce((a, b) => a + b, 0))
  let left = goal - counts.reduce((a, b) => a + b, 0)
  const order = exact
    .map((e, i) => ({ i, rest: e - Math.floor(e) }))
    .sort((a, b) => b.rest - a.rest || parts[b.i] - parts[a.i])
  for (const { i } of order) {
    if (left <= 0) break
    counts[i] += 1
    left -= 1
  }
  for (const { i } of [...order].reverse()) {
    if (left >= 0) break
    if (counts[i] > 0) {
      counts[i] -= 1
      left += 1
    }
  }
  return counts
}
