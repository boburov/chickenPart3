import { ArrowUpRight, Warehouse } from 'lucide-react'
import { SECTIONS, SUMMARY, type BarRow } from '../data/deck'
import { Card, IconTile } from '../components/Blocks'
import { FundsLegend, StackedBars } from '../components/Charts'
import { barIcon, FUNDS, SECTION_ICON } from '../components/icons'
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
    <div className="absolute inset-x-[72px] top-[128px] bottom-[76px] grid grid-cols-12 grid-rows-[190px_minmax(0,1fr)_170px] gap-7">
      <div className="col-span-4 flex flex-col justify-end">
        <div data-anim="rise" className="eyebrow">
          {String(slide).padStart(2, '0')} · Уч йўналиш бўйича
        </div>
        <h1 data-anim="rise" className="mt-2 text-[80px] font-[800] leading-[0.95] tracking-[-0.03em] text-brand-deep">
          Жами
        </h1>
        <div data-anim="rise" className="mt-3 flex items-center gap-2 text-[17px] font-medium text-ink-2">
          <Warehouse size={18} className="text-brand-blue" />
          <Num fig={SUMMARY.buildings} animate={false} className="font-semibold text-ink" /> та парранда биноси
        </div>
      </div>

      {/* Жами кредит = the projects' bank credit + the feed reserve; the bank share of the project shows in its sub-line. */}
      <div className="col-span-8 grid grid-cols-[1.15fr_1fr_1.2fr] gap-5">
        <div data-anim="rise" className="glass-strong flex flex-col justify-between rounded-[24px] p-6">
          <div className="label-caps">Лойиҳа қиймати</div>
          <div className="flex items-baseline gap-2 whitespace-nowrap">
            <Num fig={f.total} className="text-[62px] font-[800] leading-none tracking-[-0.035em] text-navy-deep" />
            <span className="text-[20px] font-semibold text-ink-2">млн $</span>
          </div>
        </div>
        <div data-anim="rise" className="glass flex flex-col justify-between rounded-[24px] p-6">
          <div className="flex items-center gap-2.5">
            <i className="size-3.5 rounded-[3px]" style={{ background: FUNDS.own.color }} />
            <span className="label-caps">{FUNDS.own.label}</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2 whitespace-nowrap">
              <Num fig={f.own} className="text-[42px] font-[800] leading-none tracking-[-0.03em] text-navy-deep" />
              <span className="text-[17px] font-semibold text-ink-2">млн $</span>
            </div>
            <div className="mt-2 text-[15px] font-semibold text-ink-3">
              <Num fig={f.ownPct} animate={false} />% жамидан
            </div>
          </div>
        </div>
        <div data-anim="rise" className="bg-grad flex flex-col justify-between rounded-[24px] p-6 text-white shadow-glow">
          <div className="text-[13px] font-[800] uppercase tracking-[0.12em] text-white/85">Жами кредит</div>
          <div>
            <div className="flex items-baseline gap-2 whitespace-nowrap">
              <Num fig={SUMMARY.totalCredit} className="text-[50px] font-[800] leading-none tracking-[-0.03em]" />
              <span className="text-[18px] font-semibold text-white/80">млн $</span>
            </div>
            <div className="mt-2 text-[15px] font-medium text-white/85">
              лойиҳалар <Num fig={SUMMARY.projectCredit} animate={false} className="font-semibold text-white" /> + озуқа заҳираси{' '}
              <Num fig={SUMMARY.feedReserve} animate={false} className="font-semibold text-white" />
            </div>
          </div>
        </div>
      </div>

      <Card className="col-span-6 flex flex-col" label="Йўналишлар бўйича" aside={<FundsLegend />}>
        <div className="flex flex-1 flex-col justify-center pb-6">
          <StackedBars
            labelWidth={220}
            valueWidth={190}
            rowGap={48}
            rows={SUMMARY.bySection.map((row) => ({ ...row, icon: SECTION_ICON[row.key as keyof typeof SECTION_ICON] }))}
          />
        </div>
      </Card>

      <Card className="col-span-6 flex flex-col" label="Харажатлар таркиби" aside={<FundsLegend />}>
        <StackedBars
          labelWidth={220}
          valueWidth={190}
          rowGap={24}
          rows={SUMMARY.costs.map((row) => ({ ...row, icon: row.partOf ? undefined : barIcon(row.key) }))}
        />
        {notes.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-x-6 gap-y-1 pt-4 text-[15px] font-medium text-ink-2">
            {notes.map((n) => (
              <span key={n.key} className="flex items-center gap-2">
                <i className="size-2.5 rounded-full" style={{ background: FUNDS[n.fund].color }} />
                {n.text}
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="col-span-12 grid min-h-0 grid-cols-3 gap-7">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            data-anim="rise"
            onClick={() => onJump(s.slide - 1)}
            className="glass group flex items-center gap-5 rounded-[24px] px-7 text-left transition-shadow duration-300 hover:shadow-glow"
          >
            <IconTile icon={SECTION_ICON[s.id]} size={60} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="label-caps">{s.hero.label}</span>
                <ArrowUpRight size={22} className="text-ink-3 transition-colors group-hover:text-brand-blue" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2 whitespace-nowrap">
                <Num fig={s.hero.fig} className="text-[46px] font-[800] leading-none tracking-[-0.02em] text-navy-deep" />
                {s.hero.prefix && <span className="text-[22px] font-[750] text-navy-deep">{s.hero.prefix}</span>}
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
