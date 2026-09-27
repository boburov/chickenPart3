const NBSP = ' '

/**
 * Uzbek number style: no-break space between thousands, comma for decimals.
 * formatNumber(13730) → "13 730", formatNumber(36.44, 2) → "36,44",
 * formatNumber(21, 2, true) → "21".
 */
export function formatNumber(value: number, decimals = 0, trim = false): string {
  const [int, frac = ''] = Math.abs(value).toFixed(decimals).split('.')
  const shownFrac = trim ? frac.replace(/0+$/, '') : frac
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  return (value < 0 ? '−' : '') + grouped + (shownFrac ? `,${shownFrac}` : '')
}
