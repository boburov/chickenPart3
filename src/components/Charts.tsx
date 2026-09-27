import { useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { Fig } from '../data/deck'
import { formatNumber } from '../lib/format'
import { FUNDS } from './icons'
import { Num } from './Num'

type Fund = keyof typeof FUNDS

export function FundsLegend({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-5 text-[15px] font-medium text-ink-2 ${className}`}>
      {(Object.keys(FUNDS) as Fund[]).map((k) => (
        <span key={k} className="flex items-center gap-2">
          <i className="size-3 rounded-[3px]" style={{ background: FUNDS[k].color }} />
          {FUNDS[k].label}
        </span>
      ))}
    </div>
  )
}

function Tip({ title, value, share, style }: { title: string; value: string; share?: string; style: React.CSSProperties }) {
  return (
    <div
      role="tooltip"
      className="glass-strong pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[15px] leading-snug"
      style={style}
    >
      <div className="font-semibold text-ink">{title}</div>
      <div className="text-ink-2">
        {value}
        {share && <span className="ml-2 text-ink-3">{share}</span>}
      </div>
    </div>
  )
}

const kUsd = (thousands: number) => `${formatNumber(thousands)} минг $`

export interface DonutPart {
  fund: Fund
  exact: number
  pct: number
}

/** Bank vs own funds. Exact values show on hover and keyboard focus. */
export function Donut({ parts, size, thickness, children }: { parts: DonutPart[]; size: number; thickness: number; children?: ReactNode }) {
  const [active, setActive] = useState<number | null>(null)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const total = parts.reduce((a, p) => a + p.exact, 0)
  const shown = parts.filter((p) => p.exact > 0)
  const gap = shown.length > 1 ? 5 : 0

  let start = 0
  const arcs = shown.map((p) => {
    const share = p.exact / total
    const arc = { ...p, share, start, length: Math.max(c * share - gap, 0) }
    start += c * share
    return arc
  })

  const label = arcs.map((a) => `${FUNDS[a.fund].label} ${a.pct}%`).join(', ')
  const tip = active === null ? null : arcs[active]
  const tipAngle = tip ? ((tip.start + (c * tip.share) / 2) / c) * 2 * Math.PI - Math.PI / 2 : 0

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8edf8" strokeWidth={thickness} />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {arcs.map((a, i) => (
            <circle
              key={a.fund}
              data-anim="arc"
              data-circumference={c}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={FUNDS[a.fund].color}
              strokeWidth={active === i ? thickness + 6 : thickness}
              strokeDasharray={`${a.length} ${c}`}
              strokeDashoffset={-a.start}
              tabIndex={0}
              aria-label={`${FUNDS[a.fund].label}: ${kUsd(a.exact)}, ${a.pct}%`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              style={{ transition: 'stroke-width 200ms var(--ease-brand)', outline: 'none', cursor: 'default' }}
            />
          ))}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">{children}</div>
      {tip && (
        <Tip
          title={FUNDS[tip.fund].label}
          value={kUsd(tip.exact)}
          share={`${tip.pct}%`}
          style={{ left: size / 2 + Math.cos(tipAngle) * r, top: size / 2 + Math.sin(tipAngle) * r - 14 }}
        />
      )}
    </div>
  )
}

export interface BarRow {
  key: string
  icon?: LucideIcon
  label: ReactNode
  total: Fig
  share?: Fig
  exact: { total: number; bank: number; own: number }
}

/**
 * Horizontal stacked bars (bank | own), one per row, scaled to the largest row.
 * The total sits at the bar's end; the split shows on hover.
 */
export function StackedBars({ rows, labelWidth = 200, valueWidth = 190, rowGap = 22 }: { rows: BarRow[]; labelWidth?: number; valueWidth?: number; rowGap?: number }) {
  const [active, setActive] = useState<{ row: string; fund: Fund } | null>(null)
  const max = Math.max(...rows.map((r) => r.exact.total))

  return (
    <div className="grid" style={{ rowGap }}>
      {rows.map((row) => {
        const segs = (['bank', 'own'] as Fund[]).filter((f) => row.exact[f] > 0)
        const width = (row.exact.total / max) * 100
        return (
          <div key={row.key} className="grid items-center gap-4" style={{ gridTemplateColumns: `${labelWidth}px 1fr ${valueWidth}px` }}>
            <div className="flex items-center gap-3 text-[18px] font-semibold text-ink">
              {row.icon && (
                <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-white/80 text-brand-deep shadow-[0_2px_8px_-3px_#123b8f40]">
                  <row.icon size={20} strokeWidth={2} />
                </span>
              )}
              <span className="leading-tight">{row.label}</span>
            </div>

            <div className="relative h-[22px]">
              {row.exact.total > 0 ? (
                <div data-anim="bar" className="flex h-full gap-[2px]" style={{ width: `${width}%` }}>
                  {segs.map((f, i) => (
                    <div
                      key={f}
                      tabIndex={0}
                      aria-label={`${FUNDS[f].label}: ${kUsd(row.exact[f])}`}
                      className="h-full min-w-[3px] outline-none transition-[filter] duration-200 hover:brightness-110 focus-visible:brightness-110"
                      style={{
                        flex: row.exact[f],
                        background: FUNDS[f].color,
                        borderRadius: i === segs.length - 1 ? '0 4px 4px 0' : 0,
                      }}
                      onMouseEnter={() => setActive({ row: row.key, fund: f })}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive({ row: row.key, fund: f })}
                      onBlur={() => setActive(null)}
                    />
                  ))}
                </div>
              ) : null}
              {active?.row === row.key && (
                <Tip
                  title={FUNDS[active.fund].label}
                  value={kUsd(row.exact[active.fund])}
                  share={`${Math.round((row.exact[active.fund] / row.exact.total) * 100)}%`}
                  style={{
                    left: `${(((active.fund === 'bank' ? 0 : row.exact.bank) + row.exact[active.fund] / 2) / max) * 100}%`,
                    top: -8,
                  }}
                />
              )}
            </div>

            <div className="flex items-baseline justify-end gap-2 whitespace-nowrap">
              {row.exact.total > 0 ? (
                <>
                  <Num fig={row.total} className="text-[24px] font-[720] text-ink" />
                  <span className="text-[16px] font-medium text-ink-2">млн $</span>
                  {row.share && (
                    <span className="ml-1 w-[48px] text-right text-[16px] font-semibold text-ink-3">
                      <Num fig={row.share} animate={false} />%
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[18px] font-medium text-ink-3">режада йўқ</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Thin bank | own split used inside facility cards. */
export function SplitBar({ bank, own, className = '' }: { bank: number; own: number; className?: string }) {
  const segs = (['bank', 'own'] as Fund[]).filter((f) => (f === 'bank' ? bank : own) > 0)
  return (
    <div data-anim="bar" className={`flex h-2 gap-[2px] ${className}`}>
      {segs.map((f, i) => (
        <div
          key={f}
          style={{
            flex: f === 'bank' ? bank : own,
            background: FUNDS[f].color,
            borderRadius: segs.length === 1 ? 4 : i === 0 ? '4px 0 0 4px' : '0 4px 4px 0',
          }}
        />
      ))}
    </div>
  )
}
