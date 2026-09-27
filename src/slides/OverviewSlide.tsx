import { Cog, MapPin } from 'lucide-react'
import { DECK, type SectionView, type Stat } from '../data/deck'
import { Breakdown, Card, IconTile } from '../components/Blocks'
import { Donut, FundsLegend, StackedBars } from '../components/Charts'
import { barIcon, FUNDS, SECTION_ICON } from '../components/icons'
import { Num, Src } from '../components/Num'

function StatCard({ st }: { st: Stat }) {
  return (
    <div data-anim="rise" className="glass flex min-h-0 flex-col justify-center rounded-[22px] px-7">
      <div className="label-caps">{st.label}</div>
      <div className="mt-2 flex items-baseline gap-2 whitespace-nowrap">
        {st.fig ? (
          <Num fig={st.fig} className="text-[46px] font-[800] leading-none tracking-[-0.02em] text-navy-deep" />
        ) : (
          <span className="text-[46px] font-[800] leading-none text-ink-3">{st.text}</span>
        )}
        <span className="text-[18px] font-semibold text-ink-2">
          {st.prefix ? `${st.prefix} ` : ''}
          {st.unit}
        </span>
      </div>
      {st.hint && <div className="mt-2 text-[15px] font-medium text-ink-2">{st.hint}</div>}
    </div>
  )
}

/** A direction at a glance: output, financing, where the money goes and the facility mix. */
export function OverviewSlide({ s }: { s: SectionView }) {
  const f = s.financing
  return (
    <div className="absolute inset-x-[72px] top-[128px] bottom-[76px] grid grid-cols-12 grid-rows-[132px_300px_minmax(0,1fr)] gap-7">
      <div className="col-span-8 flex flex-col justify-end">
        <div data-anim="rise" className="eyebrow">
          {String(s.slide).padStart(2, '0')} · {s.subtitle}
        </div>
        <h1 data-anim="rise" className="mt-2 text-[78px] font-[800] leading-[0.95] tracking-[-0.03em] text-brand-deep">
          {s.title}
        </h1>
        <div data-anim="rise" className="mt-3 flex items-center gap-6 text-[17px] font-medium text-ink-2">
          <span className="flex items-center gap-2">
            <MapPin size={18} className="text-brand-blue" /> {s.meta.place ?? DECK.region}
          </span>
          <span className="flex items-center gap-2">
            <Cog size={18} className="text-brand-blue" /> Дастгоҳлар: {s.meta.equipment}
            <Src refs={s.meta.equipmentSrc} />
          </span>
        </div>
      </div>

      <div className="col-span-4 row-span-2 grid min-h-0 grid-rows-3 gap-5">
        {s.stats.map((st) => (
          <StatCard key={st.label} st={st} />
        ))}
      </div>

      <Card className="col-span-4 flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <IconTile icon={SECTION_ICON[s.id]} size={44} />
          <span className="label-caps">{s.hero.label}</span>
        </div>
        <div>
          <div className="flex items-baseline gap-3">
            <Num fig={s.hero.fig} className="text-[92px] font-[800] leading-none tracking-[-0.035em] text-navy-deep" />
            {s.hero.prefix && <span className="text-[40px] font-[750] tracking-[-0.02em] text-navy-deep">{s.hero.prefix}</span>}
          </div>
          <div className="mt-2 text-[18px] font-medium text-ink-2">{s.hero.unit}</div>
        </div>
        {s.hero.chip && (
          <div className="self-start rounded-full bg-mist px-4 py-1.5 text-[15px] font-[650] text-brand-deep">
            {s.hero.chip}
            {s.hero.chipSrc && <Src refs={s.hero.chipSrc} />}
          </div>
        )}
      </Card>

      <Card className="col-span-4 flex items-center gap-8">
        <Donut
          size={206}
          thickness={26}
          parts={[
            { fund: 'bank', exact: f.exact.bank, pct: f.bankPct.value },
            { fund: 'own', exact: f.exact.own, pct: f.ownPct.value },
          ]}
        >
          <div>
            <div className="text-[38px] font-[800] leading-none tracking-[-0.02em] text-navy-deep">
              <Num fig={f.bankPct} animate={false} />%
            </div>
            <div className="mt-1 text-[14px] font-semibold text-ink-2">банк кредити</div>
          </div>
        </Donut>
        <div className="min-w-0 flex-1">
          <div className="label-caps">Лойиҳа қиймати</div>
          <div className="mt-1.5 flex items-baseline gap-2 whitespace-nowrap">
            <Num fig={f.total} className="text-[54px] font-[800] leading-none tracking-[-0.03em] text-navy-deep" />
            <span className="text-[20px] font-semibold text-ink-2">млн $</span>
          </div>
          <div className="mt-6 grid gap-3">
            {(['bank', 'own'] as const).map((k) => (
              <div key={k} className="flex items-center gap-2.5 text-[16px]">
                <i className="size-3 shrink-0 rounded-[3px]" style={{ background: FUNDS[k].color }} />
                <span className="flex-1 font-medium text-ink-2">{FUNDS[k].label}</span>
                <span className="whitespace-nowrap font-[750] text-ink">
                  <Num fig={f[k]} /> <span className="text-[14px] font-semibold text-ink-2">млн $</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="col-span-7" label={s.bars.title} aside={<FundsLegend />}>
        <StackedBars
          labelWidth={s.id === 'processing' ? 270 : 200}
          valueWidth={180}
          rowGap={s.bars.rows.length > 3 ? 22 : 34}
          rows={s.bars.rows.map((row) => ({ ...row, icon: barIcon(row.key) }))}
        />
      </Card>

      <Card
        className="col-span-5"
        label={s.breakdown.title}
        aside={<span className="text-[14px] font-medium text-ink-3">{s.breakdown.caption}</span>}
      >
        <Breakdown view={s.breakdown} />
      </Card>
    </div>
  )
}
