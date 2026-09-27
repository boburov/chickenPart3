import { Fragment, type ReactNode } from 'react'
import { Handshake, Info, type LucideIcon } from 'lucide-react'
import cnFlag from 'flag-icons/flags/4x3/cn.svg'
import plFlag from 'flag-icons/flags/4x3/pl.svg'
import uzFlag from 'flag-icons/flags/4x3/uz.svg'
import { JOINT_VENTURE, type Badge, type BreakdownView, type Flag, type TableView, type TCell } from '../data/deck'
import { splitRound } from '../lib/round'
import { GROUP_ICON } from './icons'
import { Num, Src } from './Num'

const FLAGS: Record<Flag, string> = { uz: uzFlag, cn: cnFlag, pl: plFlag }

export function FlagIcon({ code, size = 'md' }: { code: Flag; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-5 w-[27px] rounded-[4px]' : 'h-8 w-[42px] rounded-[6px]'
  return <img src={FLAGS[code]} alt="" className={`${cls} shrink-0 object-cover shadow-sm ring-1 ring-brand-deep/10`} />
}

export function IconTile({ icon: Icon, size = 48, tone = 'grad' }: { icon: LucideIcon; size?: number; tone?: 'grad' | 'deep' | 'soft' }) {
  const tones = {
    grad: 'bg-grad text-white shadow-glow',
    deep: 'bg-brand-deep text-white shadow-[0_8px_18px_-8px_#123b8fb0]',
    soft: 'bg-white/85 text-brand-deep shadow-[0_2px_8px_-3px_#123b8f40]',
  }
  return (
    <span className={`grid shrink-0 place-items-center rounded-[14px] ${tones[tone]}`} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.46)} strokeWidth={2} />
    </span>
  )
}

/** Glass card with an uppercase navy label, as on chicken-ov1. */
export function Card({ label, icon, aside, className = '', children }: { label?: ReactNode; icon?: LucideIcon; aside?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section data-anim="rise" className={`glass rounded-[24px] p-8 ${className}`}>
      {(label || aside) && (
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon && <IconTile icon={icon} size={40} />}
            <h3 className="label-caps">{label}</h3>
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  )
}

/** "— ЭРИШИЛАДИГАН НАТИЖАЛАР" style heading between blocks. */
export function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div data-anim="rise" className={`flex items-center gap-3 ${className}`}>
      <span className="h-[3px] w-9 rounded-full bg-brand-blue" />
      <span className="label-caps text-[14px]">{children}</span>
    </div>
  )
}

/** A photo with its number and caption, or a branded placeholder until a URL is set in photos.ts. */
export function PhotoSlot({ src, caption, number, icon: Icon, className = '' }: { src: string; caption: string; number?: string; icon: LucideIcon; className?: string }) {
  return (
    <figure data-anim="photo" className={`relative m-0 overflow-hidden rounded-[22px] shadow-[0_20px_50px_-26px_#123b8f80] ${className}`}>
      {src ? (
        <img src={src} alt={caption} className="absolute inset-0 size-full object-cover" />
      ) : (
        <div role="img" aria-label={caption} className="absolute inset-0 bg-[linear-gradient(135deg,#0c2a6b_0%,#176bff_62%,#7b3ff2_100%)]">
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(#ffffff 1.2px, transparent 1.2px)', backgroundSize: '22px 22px' }} />
          <div className="absolute -right-4 -top-4 text-white/15">
            <Icon size={170} strokeWidth={1.1} />
          </div>
        </div>
      )}
      <figcaption className="absolute inset-x-0 bottom-0 flex items-end gap-3 bg-[linear-gradient(0deg,#0c2a6bd9,transparent)] px-5 pt-10 pb-4 text-white">
        {number && <span className="text-[13px] font-[800] tracking-[0.12em] text-white/70">{number}</span>}
        <span className="text-[17px] font-[720] leading-tight">{caption}</span>
      </figcaption>
    </figure>
  )
}

/** The joint-venture banner from the client's picture. */
export function JointVentureBanner() {
  const [left, right] = JOINT_VENTURE.partners
  const partner = (p: typeof left) => (
    <span className="glass flex items-center gap-3 rounded-[18px] py-2 pl-2.5 pr-5">
      <FlagIcon code={p.flag} />
      <span className="whitespace-nowrap text-[18px] font-[800] uppercase tracking-[0.01em] text-brand-deep">{p.name}</span>
    </span>
  )
  return (
    <div data-anim="rise" className="flex flex-col items-center">
      <span className="eyebrow">{JOINT_VENTURE.label}</span>
      <div className="mt-3 flex items-center gap-4">
        {partner(left)}
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-grad text-white shadow-glow">
          <Handshake size={21} />
        </span>
        {partner(right)}
      </div>
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
}

export function BadgeMark({ badge }: { badge: Badge }) {
  const b = BADGES[badge]
  return <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-[700] ${b.className}`}>{b.label}</span>
}

/** Rows of label, value and a one-hue meter for each row's share. */
export function Breakdown({ view }: { view: BreakdownView }) {
  const pct = splitRound(view.rows.map((r) => r.share * 100), 1, 100)
  return (
    <div className="grid gap-5">
      {view.rows.map((r, i) => (
        <div key={r.key}>
          <div className="flex items-center gap-3">
            {r.badge && <BadgeMark badge={r.badge} />}
            {r.flag && <FlagIcon code={r.flag} size="sm" />}
            <span className="text-[18px] font-[720] text-ink">{r.label}</span>
            <span className="ml-auto whitespace-nowrap">
              <Num fig={r.fig} className="text-[24px] font-[800] tracking-[-0.01em] text-navy-deep" />{' '}
              <span className="text-[14px] font-semibold text-ink-2">{r.unit}</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-mist">
              <div data-anim="bar" className="h-full rounded-full bg-brand-deep" style={{ width: `${r.share * 100}%` }} />
            </div>
            <span className="w-10 text-right text-[14px] font-[700] text-ink-3">{pct[i]}%</span>
          </div>
          <div className="mt-1 text-[14px] font-medium text-ink-2">{r.detail}</div>
        </div>
      ))}
    </div>
  )
}

function Value({ cell, strong = false }: { cell: TCell; strong?: boolean }) {
  if (cell.badge) return <BadgeMark badge={cell.badge} />
  if (cell.fig) return <Num fig={cell.fig} animate={false} className={strong ? 'font-[800]' : ''} />
  return (
    <span className={`inline-flex items-center gap-2 ${cell.text && cell.text !== '—' ? 'text-ink' : 'text-ink-3'}`}>
      {cell.flag && <FlagIcon code={cell.flag} size="sm" />}
      {cell.text}
      {cell.src && <Src refs={cell.src} />}
    </span>
  )
}

/** A detail slide's table: exact numbers like the spreadsheet, units under each column name. */
export function DataTable({ table }: { table: TableView }) {
  const lines = table.groups.reduce((a, g) => a + g.rows.length + (g.label ? 1 : 0), 0)
  const pad = lines > 11 ? 'py-[7px]' : lines > 8 ? 'py-[13px]' : lines > 6 ? (table.note ? 'py-[15px]' : 'py-[18px]') : 'py-[24px]'
  const right = (i: number) => Boolean(table.columns[i]?.unit)
  return (
    <div data-anim="rise" className="glass-strong min-h-0 flex-1 self-start rounded-[24px] px-8 pt-5 pb-3">
      <table className="w-full border-collapse text-[17px] tabular-nums">
        <thead>
          <tr className="align-bottom">
            <th className="pb-3 text-left">
              <span className="label-caps">Объект</span>
            </th>
            {table.columns.map((c, i) => (
              <th key={c.label} className={`pb-3 pl-5 whitespace-nowrap ${right(i) ? 'text-right' : 'text-left'}`}>
                <span className="label-caps block">{c.label}</span>
                {c.unit && <span className="block text-[12px] font-medium text-ink-3">{c.unit}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.groups.map((g) => {
            const GroupIcon = g.icon ? GROUP_ICON[g.icon] : null
            return (
              <Fragment key={g.key}>
                {g.label && (
                  <tr className="border-t border-hairline bg-mist/70">
                    <td className={`${pad} pl-3 pr-3 font-[760] text-brand-deep`}>
                      <span className="flex items-center gap-2.5">
                        {GroupIcon && <GroupIcon size={18} className="shrink-0" />}
                        {g.label}
                      </span>
                    </td>
                    {(g.subtotal ?? []).map((c, i) => (
                      <td key={i} className={`${pad} pl-5 whitespace-nowrap font-[740] text-brand-deep ${right(i) ? 'text-right' : 'text-left'}`}>
                        <Value cell={c} />
                      </td>
                    ))}
                  </tr>
                )}
                {g.rows.map((r) => (
                  <tr key={r.key} className="border-t border-hairline">
                    <td className={`${pad} ${g.label ? 'pl-10' : ''} pr-3`}>
                      <span className="flex items-baseline gap-2.5">
                        <span className="font-[650] text-ink">{r.name}</span>
                        {r.note && <span className="whitespace-nowrap text-[13px] font-medium text-ink-3">{r.note}</span>}
                        <Src refs={r.nameSrc} />
                      </span>
                    </td>
                    {r.cells.map((c, i) => (
                      <td key={i} className={`${pad} pl-5 whitespace-nowrap text-ink ${right(i) ? 'text-right' : 'text-left'}`}>
                        <Value cell={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-brand-deep/25">
            <td className={pad}>
              <span className="label-caps">Жами</span>
            </td>
            {table.total.map((c, i) => (
              <td key={i} className={`${pad} pl-5 whitespace-nowrap text-navy-deep ${right(i) ? 'text-right' : 'text-left'}`}>
                <Value cell={c} strong />
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
      {table.note && (
        <p className="mt-3 flex items-start gap-2 border-t border-hairline pt-3 pb-1 text-[15px] font-medium leading-snug text-ink-2">
          <Info size={17} className="mt-0.5 shrink-0 text-brand-blue" />
          {table.note}
        </p>
      )}
    </div>
  )
}
