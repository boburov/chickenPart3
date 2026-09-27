import { DataTable } from '../components/Blocks'
import { Num, Src } from '../components/Num'
import type { SectionView } from '../data/deck'

/** Every facility of a direction, with the exact figures from the sheet. */
export function DetailsSlide({ s }: { s: SectionView }) {
  const f = s.financing
  const chip = 'glass flex items-baseline gap-2 whitespace-nowrap rounded-[18px] px-5 py-3'
  return (
    <div className="absolute inset-x-[72px] top-[128px] bottom-[76px] flex flex-col">
      <div className="flex items-end justify-between gap-8">
        <div className="min-w-0">
          <div data-anim="rise" className="eyebrow">
            {String(s.detailsSlide).padStart(2, '0')} · {s.subtitle}
          </div>
          <h1 data-anim="rise" className="mt-2 text-[64px] font-[800] leading-none tracking-[-0.03em] text-brand-deep">
            {s.table.title}
          </h1>
          <div data-anim="rise" className="mt-3 text-[16px] font-medium text-ink-2">
            {s.table.caption} · Дастгоҳлар: {s.meta.equipment}
            <Src refs={s.meta.equipmentSrc} />
          </div>
        </div>
        <div data-anim="rise" className="flex shrink-0 items-center gap-3">
          <div className={chip}>
            <Num fig={s.hero.fig} animate={false} className="text-[26px] font-[800] text-navy-deep" />
            <span className="text-[15px] font-semibold text-ink-2">
              {s.hero.prefix ? `${s.hero.prefix} ` : ''}
              {s.hero.unit}
            </span>
          </div>
          <div className={chip}>
            <Num fig={f.total} animate={false} className="text-[26px] font-[800] text-navy-deep" />
            <span className="text-[15px] font-semibold text-ink-2">млн $ лойиҳа</span>
          </div>
          <div className={chip}>
            <span className="text-[26px] font-[800] text-navy-deep">
              <Num fig={f.bankPct} animate={false} />%
            </span>
            <span className="text-[15px] font-semibold text-ink-2">банк кредити</span>
          </div>
        </div>
      </div>
      <div className="mt-7 flex min-h-0 flex-1">
        <DataTable table={s.table} />
      </div>
    </div>
  )
}
