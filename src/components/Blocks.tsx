import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { Badge, TableView, TCell } from '../data/deck'
import { GROUP_ICON } from './icons'
import { Num, Src } from './Num'

export function Card({ title, aside, className = '', children }: { title?: ReactNode; aside?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section data-anim="rise" className={`glass rounded-[26px] p-7 ${className}`}>
      {(title || aside) && (
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-[21px] font-[720] tracking-[-0.01em] text-ink">{title}</h3>
          {aside}
        </div>
      )}
      {children}
    </section>
  )
}

export function IconTile({ icon: Icon, size = 44, tone = 'deep' }: { icon: LucideIcon; size?: number; tone?: 'deep' | 'blue' | 'soft' }) {
  const tones = {
    deep: 'bg-brand-deep text-white shadow-[0_8px_18px_-8px_#123b8fb0]',
    blue: 'bg-brand-blue text-white shadow-[0_8px_18px_-8px_#176bffb0]',
    soft: 'bg-white/85 text-brand-deep shadow-[0_2px_8px_-3px_#123b8f40]',
  }
  return (
    <span className={`grid shrink-0 place-items-center rounded-[14px] ${tones[tone]}`} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.48)} strokeWidth={2} />
    </span>
  )
}

/** A photo, or until a URL is set in src/data/photos.ts, a branded tile in the same spot. */
export function PhotoSlot({ src, icon: Icon, alt, className = '' }: { src: string; icon: LucideIcon; alt: string; className?: string }) {
  return (
    <div data-anim="photo" className={`relative overflow-hidden rounded-[30px] shadow-[0_24px_60px_-28px_#123b8f80] ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="absolute inset-0 size-full object-cover" />
      ) : (
        <div aria-label={alt} role="img" className="absolute inset-0 bg-[linear-gradient(135deg,#123b8f_0%,#176bff_58%,#7b3ff2_100%)]">
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(#ffffff 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }} />
          <div className="absolute -right-10 -bottom-12 text-white/15">
            <Icon size={380} strokeWidth={1.1} />
          </div>
          <img src="/img/logo-mark.png" alt="" className="absolute left-8 top-8 h-14 w-auto opacity-95" />
        </div>
      )}
    </div>
  )
}

const BADGES: Record<Badge, { label: string; className: string }> = {
  new: { label: 'янги', className: 'bg-brand-blue/12 text-brand-deep' },
  reequip: { label: 'қайта жиҳозлаш', className: 'bg-brand-purple/12 text-brand-purple' },
  existing: { label: 'мавжуд', className: 'bg-ink/6 text-ink-2' },
  layer: { label: 'тухум', className: 'bg-brand-blue/12 text-brand-deep' },
  pullets: { label: 'рем молодняк', className: 'bg-ink/6 text-ink-2' },
  parent: { label: 'ота-она гала', className: 'bg-brand-purple/12 text-brand-purple' },
  slaughter: { label: '', className: '' },
  feedmill: { label: '', className: '' },
  transport: { label: '', className: '' },
  cold: { label: '', className: '' },
}

function BadgeMark({ badge, dense }: { badge?: Badge; dense: boolean }) {
  if (!badge) return null
  if (badge in GROUP_ICON) {
    const Icon = GROUP_ICON[badge as keyof typeof GROUP_ICON]
    if (dense) return <Icon size={15} className="shrink-0 text-brand-deep" aria-hidden />
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-white/85 text-brand-deep shadow-[0_2px_6px_-3px_#123b8f40]">
        <Icon size={15} />
      </span>
    )
  }
  const b = BADGES[badge]
  return <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${b.className}`}>{b.label}</span>
}

function Value({ cell, strong = false }: { cell: TCell; strong?: boolean }) {
  if (cell.fig) return <Num fig={cell.fig} animate={false} className={strong ? 'font-[760]' : ''} />
  return (
    <span className={cell.text && cell.text !== '—' ? 'text-ink' : 'text-ink-3'}>
      {cell.text}
      {cell.src && <Src refs={cell.src} />}
    </span>
  )
}

/** The "table" part of a section slide: exact numbers, like the spreadsheet. */
export function DataTable({ table }: { table: TableView }) {
  // Long tables (the 9 processing items) get tighter rows so they fit the card.
  const dense = table.rows.length > 7
  const pad = dense ? 'py-[4px]' : 'py-[6px]'
  return (
    <div data-anim="rise" className="glass-strong flex min-h-0 flex-1 flex-col rounded-[22px] px-5 pt-2 pb-1">
      <table className={`w-full border-collapse tabular-nums ${dense ? 'text-[14px]' : 'text-[15px]'}`}>
        <thead>
          <tr className="text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-3">
            <th className={`${dense ? 'py-1.5' : 'py-2'} text-left font-semibold`}>Объект</th>
            {table.columns.map((c) => (
              <th key={c} className={`${dense ? 'py-1.5' : 'py-2'} pl-3 text-right font-semibold whitespace-nowrap`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r) => (
            <tr key={r.key} className="border-t border-hairline">
              <td className={`${pad} pr-2`}>
                <div className="flex items-center gap-2">
                  <BadgeMark badge={r.badge} dense={dense} />
                  <span className="font-semibold text-ink">{r.name}</span>
                  {r.note && <span className="whitespace-nowrap text-[12px] text-ink-3">{r.note}</span>}
                  <Src refs={r.nameSrc} />
                </div>
              </td>
              {r.cells.map((c, i) => (
                <td key={i} className={`${pad} pl-3 text-right whitespace-nowrap text-ink`}>
                  <Value cell={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink/15 text-ink">
            <td className={`${pad} font-[760]`}>Жами</td>
            {table.total.map((c, i) => (
              <td key={i} className={`${pad} pl-3 text-right whitespace-nowrap`}>
                <Value cell={c} strong />
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
