import { Cog, MapPin } from 'lucide-react'
import { DECK, type SectionView } from '../data/deck'
import { PHOTOS } from '../data/photos'
import type { CostKey, ProcessingGroup } from '../data/types'
import { Card, DataTable, IconTile, PhotoSlot } from '../components/Blocks'
import { Donut, FundsLegend, StackedBars } from '../components/Charts'
import { COST_ICON, FUNDS, GROUP_ICON, SECTION_ICON } from '../components/icons'
import { Num, Src } from '../components/Num'

const barIcon = (key: string) => COST_ICON[key as CostKey] ?? GROUP_ICON[key as ProcessingGroup]

export function SectionSlide({ s }: { s: SectionView }) {
  const f = s.financing
  return (
    <div className="absolute inset-x-16 top-[124px] bottom-[76px] grid grid-cols-12 grid-rows-[150px_292px_minmax(0,1fr)] gap-6">
      {/* 1. title */}
      <div className="col-span-8 flex flex-col justify-end pb-1">
        <div data-anim="rise" className="eyebrow">
          {String(s.slide).padStart(2, '0')} · {s.subtitle}
        </div>
        <h1 data-anim="rise" className="mt-2 text-[88px] font-[780] leading-[0.98] tracking-[-0.035em] text-ink">
          {s.title}
        </h1>
        <div data-anim="rise" className="mt-3 flex items-center gap-5 text-[18px] font-medium text-ink-2">
          <span className="flex items-center gap-2">
            <MapPin size={19} className="text-brand-blue" /> {s.meta.place ?? DECK.region}
          </span>
          <span className="flex items-center gap-2">
            <Cog size={19} className="text-brand-blue" /> Дастгоҳлар: {s.meta.equipment}
            <Src refs={s.meta.equipmentSrc} />
          </span>
        </div>
      </div>

      <PhotoSlot className="col-span-4 row-span-2" src={PHOTOS[s.id]} icon={SECTION_ICON[s.id]} alt={`${s.title}: сурат`} />

      {/* 2. what the region gets */}
      <Card className="col-span-4 flex flex-col">
        <div className="flex items-center gap-3 text-[17px] font-semibold text-ink-2">
          <IconTile icon={SECTION_ICON[s.id]} size={40} tone="blue" />
          {s.hero.label}
        </div>
        <div className="mt-3 flex items-baseline gap-3">
          <Num fig={s.hero.fig} className="text-[80px] font-[780] leading-none tracking-[-0.03em] text-ink" />
          {s.hero.prefix && <span className="text-[38px] font-[720] tracking-[-0.02em] text-ink">{s.hero.prefix}</span>}
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-[18px] font-medium text-ink-2">
          {s.hero.unit}
          {s.hero.chip && (
            <span className="rounded-full bg-brand-blue/10 px-3 py-0.5 text-[14px] font-semibold text-brand-deep">
              {s.hero.chip}
              {s.hero.chipSrc && <Src refs={s.hero.chipSrc} />}
            </span>
          )}
        </div>
        <div className="mt-auto grid grid-cols-3 gap-4 border-t border-hairline pt-3.5">
          {s.stats.map((st) => (
            <div key={st.label} className="min-w-0">
              <div className="truncate text-[14px] font-medium text-ink-2">{st.label}</div>
              <div className="mt-0.5 whitespace-nowrap">
                {st.fig ? (
                  <Num fig={st.fig} className="text-[25px] font-[740] tracking-[-0.01em] text-ink" />
                ) : (
                  <span className="text-[25px] font-[740] text-ink-3">{st.text}</span>
                )}{' '}
                <span className="text-[15px] font-semibold text-ink-2">
                  {st.prefix ? `${st.prefix} ` : ''}
                  {st.unit}
                </span>
              </div>
              {st.hint && <div className="truncate text-[13px] text-ink-3">{st.hint}</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* 3. project cost: bank credit vs own funds */}
      <Card className="col-span-4 flex items-center gap-7">
        <Donut
          size={196}
          thickness={24}
          parts={[
            { fund: 'bank', exact: f.exact.bank, pct: f.bankPct.value },
            { fund: 'own', exact: f.exact.own, pct: f.ownPct.value },
          ]}
        >
          <div>
            <div className="text-[36px] font-[780] leading-none tracking-[-0.02em] text-ink">
              <Num fig={f.bankPct} animate={false} />%
            </div>
            <div className="mt-1 text-[14px] font-semibold text-ink-2">банк кредити</div>
          </div>
        </Donut>
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold text-ink-2">Лойиҳа қиймати</div>
          <div className="mt-1 flex items-baseline gap-2 whitespace-nowrap">
            <Num fig={f.total} className="text-[54px] font-[780] leading-none tracking-[-0.03em] text-ink" />
            <span className="text-[20px] font-semibold text-ink-2">млн $</span>
          </div>
          <div className="mt-5 grid gap-2.5">
            {(['bank', 'own'] as const).map((k) => (
              <div key={k} className="flex items-center gap-2.5 text-[16px]">
                <i className="size-3 shrink-0 rounded-[3px]" style={{ background: FUNDS[k].color }} />
                <span className="flex-1 font-medium text-ink-2">{FUNDS[k].label}</span>
                <span className="whitespace-nowrap font-[720] text-ink">
                  <Num fig={f[k]} /> <span className="text-[14px] font-semibold text-ink-2">млн $</span>
                </span>
                <span className="w-11 text-right font-semibold text-ink-3">
                  <Num fig={k === 'bank' ? f.bankPct : f.ownPct} animate={false} />%
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 4. where the money goes */}
      <Card className="col-span-5" title={s.bars.title} aside={<FundsLegend />}>
        <StackedBars
          labelWidth={s.id === 'processing' ? 250 : 190}
          valueWidth={176}
          rowGap={20}
          rows={s.bars.rows.map((row) => ({ ...row, icon: barIcon(row.key) }))}
        />
      </Card>

      {/* 5. facilities, exact like the sheet */}
      <section className="col-span-7 flex min-h-0 flex-col">
        <div data-anim="rise" className="mb-3 flex items-baseline gap-3 px-1">
          <h3 className="text-[21px] font-[720] tracking-[-0.01em] text-ink">{s.table.title}</h3>
          <span className="text-[15px] font-medium text-ink-3">{s.table.caption}</span>
        </div>
        <DataTable table={s.table} />
      </section>
    </div>
  )
}
