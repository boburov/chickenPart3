import { createContext, useContext } from 'react'
import type { Fig } from '../data/deck'
import { formatNumber } from '../lib/format'

/** True while the S key's "show sources" mode is on. */
export const SourcesContext = createContext(false)

/** Short label for the cells behind a figure: one cell, one sheet, or a sum across sheets. */
function sourceLabel(refs: string[]) {
  if (refs.length === 1) return refs[0]
  const split = refs.map((r) => r.split('!'))
  const sheets = [...new Set(split.map(([sheet]) => sheet))]
  const cells = [...new Set(split.map(([, cell]) => cell))]
  if (sheets.length === 1) return `${sheets[0]}!${cells.join(', ')}`
  return `Σ ${cells.join(' / ')} · ${sheets.length} варақ`
}

export function Src({ refs }: { refs: string[] }) {
  const on = useContext(SourcesContext)
  if (!on || refs.length === 0) return null
  // A zero-width anchor at the end of the value; the tag floats above it, so nothing reflows.
  return (
    <span className="src-anchor">
      <span className="src-tag" title={refs.join('\n')}>
        {sourceLabel(refs)}
      </span>
    </span>
  )
}

/** A figure that counts up when its slide opens, plus its source tag in S mode. */
export function Num({ fig, className, animate = true }: { fig: Fig; className?: string; animate?: boolean }) {
  const text = formatNumber(fig.value, fig.decimals, fig.trim)
  return (
    <span className={className}>
      <span data-count={animate ? fig.value : undefined} data-final={animate ? text : undefined}>
        {text}
      </span>
      <Src refs={fig.src} />
    </span>
  )
}
