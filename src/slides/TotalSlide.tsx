import { ArrowUpRight, Warehouse, Wheat } from 'lucide-react'
import { SECTIONS, SUMMARY, type BarRow } from '../data/deck'
import type { CostKey } from '../data/types'
import { Card, IconTile } from '../components/Blocks'
import { FundsLegend, StackedBars } from '../components/Charts'
import { COST_ICON, FUNDS, SECTION_ICON } from '../components/icons'
import { Num } from '../components/Num'

type Note = { key: string; text: string; fund: keyof typeof FUNDS }

/** Cost types paid entirely from one source, e.g. feed only from own funds. */
function singleSourceNotes(rows: BarRow[]): Note[] {
  return rows.flatMap<Note>((row) => {
    if (row.exact.total === 0) return []
    if (row.exact.own === 0) return [{ key: row.key, text: `${row.label} — тўлиқ банк кредити ҳисобидан`, fund: 'bank' }]
    if (row.exact.bank === 0) return [{ key: row.key, text: `${row.label} — тўлиқ ўз маблағи ҳисобидан`, fund: 'own' }]
    return []
  })
}

export function TotalSlide({ onJump, slide }: { onJump: (index: number) => void; slide: number }) {
  const f = SUMMARY.financing
  const notes = singleSourceNotes(SUMMARY.costs)
  return (
    <div className="absolute inset-x-16 top-[124px] bottom-[76px] grid grid-cols-12 grid-rows-[188px_minmax(0,1fr)_236px] gap-6">
      <div className="col-span-4 flex flex-col justify-end pb-1">
        <div data-anim="rise" className="eyebrow">
          {String(slide).padStart(2, '0')} · Уч йўналиш бўйича
        </div>
        <h1 data-anim="rise" className="mt-2 text-[88px] font-[780] leading-[0.98] tracking-[-0.035em] text-ink">
          Жами
        </h1>
        <div data-anim="rise" className="mt-3 flex items-center gap-2 text-[18px] font-medium text-ink-2">
          <Warehouse size={19} className="text-brand-blue" />
          <Num fig={SUMMARY.buildings} animate={false} className="font-semibold text-ink" /> та парранда биноси
        </div>
      </div>

      <div className="col-span-8 grid grid-cols-[1.25fr_1fr_1fr_1.25fr] gap-5">
        <div data-anim="rise" className="glass-strong flex flex-col justify-between rounded-[24px] p-6">
          <div className="text-[17px] font-semibold text-ink-2">Лойиҳа қиймати</div>
          <div className="flex items-baseline gap-2 whitespace-nowrap">
            <Num fig={f.total} className="text-[70px] font-[800] leading-none tracking-[-0.035em] text-ink" />
            <span className="text-[22px] font-semibold text-ink-2">млн $</span>
          </div>
        </div>
        {(['bank', 'own'] as const).map((k) => (
          <div key={k} data-anim="rise" className="glass flex flex-col justify-between rounded-[24px] p-6">
            <div className="flex items-center gap-2.5 text-[17px] font-semibold text-ink-2">
              <i className="size-3.5 rounded-[3px]" style={{ background: FUNDS[k].color }} />
              {FUNDS[k].label}
            </div>
            <div>
              <div className="flex items-baseline gap-2 whitespace-nowrap">
                <Num fig={f[k]} className="text-[42px] font-[780] leading-none tracking-[-0.03em] text-ink" />
                <span className="text-[18px] font-semibold text-ink-2">млн $</span>
              </div>
              <div className="mt-2 text-[16px] font-semibold text-ink-3">
                <Num fig={k === 'bank' ? f.bankPct : f.ownPct} animate={false} />% жамидан
              </div>
            </div>
          </div>
        ))}
        <div data-anim="rise" className="flex flex-col justify-between rounded-[24px] bg-brand-deep p-6 text-white shadow-[0_18px_40px_-18px_#123b8fcc]">
          <div className="text-[17px] font-semibold text-white/75">Жами кредит</div>
          <div>
            <div className="flex items-baseline gap-2 whitespace-nowrap">
              <Num fig={SUMMARY.totalCredit} className="text-[46px] font-[800] leading-none tracking-[-0.03em]" />
              <span className="text-[19px] font-semibold text-white/75">млн $</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[15px] font-medium text-white/75">
              <Num fig={SUMMARY.projectCredit} animate={false} className="font-semibold text-white" /> +
              <Wheat size={15} />
              <Num fig={SUMMARY.feedReserve} animate={false} className="font-semibold text-white" /> {SUMMARY.feedReserveLabel.toLowerCase()}
            </div>
          </div>
        </div>
      </div>

      <Card className="col-span-6" title="Йўналишлар бўйича" aside={<FundsLegend />}>
        <StackedBars
          labelWidth={220}
          valueWidth={186}
          rowGap={30}
          rows={SUMMARY.bySection.map((row) => ({ ...row, icon: SECTION_ICON[row.key as keyof typeof SECTION_ICON] }))}
        />
      </Card>

      <Card className="col-span-6 flex flex-col" title="Харажатлар таркиби" aside={<FundsLegend />}>
        <StackedBars
          labelWidth={220}
          valueWidth={186}
          rowGap={18}
          rows={SUMMARY.costs.map((row) => ({ ...row, icon: COST_ICON[row.key as CostKey] }))}
        />
        {notes.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-x-6 gap-y-1 pt-3 text-[15px] font-medium text-ink-2">
            {notes.map((n) => (
              <span key={n.key} className="flex items-center gap-2">
                <i className="size-2.5 rounded-full" style={{ background: FUNDS[n.fund].color }} />
                {n.text}
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="col-span-12 grid min-h-0 grid-cols-3 gap-6">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            data-anim="rise"
            onClick={() => onJump(s.slide - 1)}
            className="glass group flex items-center gap-5 rounded-[24px] px-6 text-left transition-shadow duration-300 hover:shadow-[0_0_0_1px_#176bff2e,0_12px_32px_-10px_#176bff73]"
          >
            <IconTile icon={SECTION_ICON[s.id]} size={60} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[21px] font-[740] text-ink">
                {s.title}
                <ArrowUpRight size={22} className="text-ink-3 transition-colors group-hover:text-brand-blue" />
              </div>
              <div className="mt-1.5 text-[15px] font-medium text-ink-2">{s.hero.label}</div>
              <div className="mt-1 flex items-baseline gap-1.5 whitespace-nowrap">
                <Num fig={s.hero.fig} className="text-[46px] font-[790] leading-none tracking-[-0.02em] text-ink" />
                {s.hero.prefix && <span className="text-[22px] font-[720] text-ink">{s.hero.prefix}</span>}
                <span className="truncate text-[16px] font-medium text-ink-2">{s.hero.unit}</span>
              </div>
              {s.hero.chip && <div className="mt-2 truncate text-[14px] font-semibold text-brand-deep">{s.hero.chip}</div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
