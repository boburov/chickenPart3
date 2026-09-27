import { ArrowUpRight, Banknote, Bird, Sigma, UserRound, Wheat } from 'lucide-react'
import { DECK, SECTIONS, SUMMARY, type Financing, type SectionView } from '../data/deck'
import { PHOTOS } from '../data/photos'
import { IconTile, PhotoSlot } from '../components/Blocks'
import { Donut, SplitBar } from '../components/Charts'
import { FUNDS, SECTION_ICON } from '../components/icons'
import { Num } from '../components/Num'

/** Total project cost splitting into bank credit and own funds, plus the feed-reserve credit. */
function KpiTree({ f }: { f: Financing }) {
  const line = 'absolute bg-[#b9c6e4]'
  return (
    <div className="w-[760px]">
      <div data-anim="rise" className="glass-strong mx-auto flex w-[470px] items-center gap-5 rounded-[24px] px-6 py-4">
        <IconTile icon={Banknote} size={54} tone="blue" />
        <div>
          <div className="text-[17px] font-semibold text-ink-2">Лойиҳа қиймати</div>
          <div className="flex items-baseline gap-2 whitespace-nowrap">
            <Num fig={f.total} className="text-[58px] font-[790] leading-none tracking-[-0.03em] text-ink" />
            <span className="text-[22px] font-semibold text-ink-2">млн $</span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto h-[56px] w-[392px]" aria-hidden>
        <div data-anim="line-y" className={`${line} left-1/2 top-0 h-[22px] w-[2px] -translate-x-1/2`} />
        <div data-anim="line-x" className={`${line} left-0 right-0 top-[22px] h-[2px]`} />
        <div data-anim="line-y" className={`${line} left-0 top-[22px] h-[34px] w-[2px]`} />
        <div data-anim="line-y" className={`${line} right-0 top-[22px] h-[34px] w-[2px]`} />
        {(['bank', 'own'] as const).map((k) => (
          <span
            key={k}
            data-anim="pop"
            className={`absolute top-[22px] -translate-y-1/2 rounded-full px-3.5 py-1 text-[18px] font-[760] text-white shadow-[0_6px_14px_-6px_#123b8f99] ${
              k === 'bank' ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'
            }`}
            style={{ background: FUNDS[k].color }}
          >
            <Num fig={k === 'bank' ? f.bankPct : f.ownPct} animate={false} />%
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {(['bank', 'own'] as const).map((k) => {
          const Icon = FUNDS[k].icon
          return (
            <div key={k} data-anim="rise" className="glass flex items-center gap-4 rounded-[22px] px-5 py-3.5">
              <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-white/85 shadow-[0_2px_8px_-3px_#123b8f40]" style={{ color: FUNDS[k].color }}>
                <Icon size={24} />
              </span>
              <div>
                <div className="text-[16px] font-semibold text-ink-2">{FUNDS[k].label}</div>
                <div className="flex items-baseline gap-2 whitespace-nowrap">
                  <Num fig={f[k]} className="text-[38px] font-[780] leading-tight tracking-[-0.02em] text-ink" />
                  <span className="text-[18px] font-semibold text-ink-2">млн $</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div data-anim="rise" className="mt-3 flex items-center gap-2.5 px-1 text-[16px] font-medium text-ink-2">
        <Wheat size={18} className="text-brand-blue" />
        {SUMMARY.feedReserveLabel} яна <Num fig={SUMMARY.feedReserve} className="font-[740] text-ink" /> млн $ кредит · жами кредит{' '}
        <Num fig={SUMMARY.totalCredit} className="font-[740] text-ink" /> млн $
      </div>
    </div>
  )
}

function Teaser({ icon: Icon, title, subtitle, children, onOpen }: { icon: typeof Bird; title: string; subtitle: string; children: React.ReactNode; onOpen: () => void }) {
  return (
    <button
      type="button"
      data-anim="rise"
      onClick={onOpen}
      className="glass group flex flex-col rounded-[24px] p-5 text-left transition-shadow duration-300 hover:shadow-[0_0_0_1px_#176bff2e,0_12px_32px_-10px_#176bff73]"
    >
      <div className="flex items-start gap-3.5">
        <IconTile icon={Icon} size={48} />
        <div className="min-w-0 flex-1">
          <div className="text-[24px] font-[750] leading-tight tracking-[-0.01em] text-ink">{title}</div>
          <div className="line-clamp-2 text-[14px] font-medium leading-snug text-ink-2">{subtitle}</div>
        </div>
        <ArrowUpRight size={22} className="text-ink-3 transition-colors group-hover:text-brand-blue" />
      </div>
      {children}
    </button>
  )
}

function SectionTeaser({ s, onOpen }: { s: SectionView; onOpen: () => void }) {
  return (
    <Teaser icon={SECTION_ICON[s.id]} title={s.title} subtitle={s.subtitle} onOpen={onOpen}>
      <div className="mt-auto flex items-baseline gap-2 whitespace-nowrap pt-3">
        <Num fig={s.hero.fig} className="text-[38px] font-[780] leading-none tracking-[-0.02em] text-ink" />
        <span className="text-[19px] font-[700] text-ink">{s.hero.prefix}</span>
        <span className="truncate text-[15px] font-medium text-ink-2">{s.hero.unit}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <SplitBar bank={s.financing.exact.bank} own={s.financing.exact.own} className="flex-1" />
        <span className="whitespace-nowrap text-[16px] font-[720] text-ink">
          <Num fig={s.financing.total} animate={false} /> <span className="text-[13px] font-semibold text-ink-2">млн $</span>
        </span>
      </div>
    </Teaser>
  )
}

export function CoverSlide({ onJump, totalSlide }: { onJump: (index: number) => void; totalSlide: number }) {
  const f = SUMMARY.financing
  return (
    <div className="absolute inset-x-16 top-[124px] bottom-[76px] grid grid-cols-12 grid-rows-[minmax(0,1fr)_200px] gap-x-6 gap-y-6">
      <div className="col-span-7 flex min-h-0 flex-col">
        <div data-anim="rise" className="eyebrow mt-2">
          {DECK.plan} · {DECK.year}
        </div>
        <h1 data-anim="rise" className="mt-3 text-[100px] font-[800] leading-[1] tracking-[-0.04em]">
          <span className="block text-ink">Барака Ҳамкор</span>
          <span className="text-gradient block pb-2">Парранда</span>
        </h1>
        <div data-anim="rise" className="mt-1 text-[26px] font-medium text-ink-2">
          хусусий корхонаси · {DECK.region}
        </div>
        <div data-anim="rise" className="mt-2 flex items-center gap-2 text-[17px] font-medium text-ink-2">
          <UserRound size={18} className="text-brand-blue" /> Корхона раҳбари: <span className="font-semibold text-ink">{DECK.director}</span>
        </div>
        <div className="mt-auto">
          <KpiTree f={f} />
        </div>
      </div>

      <div className="relative col-span-5">
        <div className="absolute inset-y-0 right-0 left-[96px]">
          <PhotoSlot src={PHOTOS.cover} icon={Bird} alt="Барака Ҳамкор Парранда: сурат" className="size-full" />
        </div>
        <div data-anim="rise" className="glass-strong absolute left-0 top-1/2 grid size-[272px] -translate-y-1/2 place-items-center rounded-full">
          <Donut
            size={236}
            thickness={26}
            parts={[
              { fund: 'bank', exact: f.exact.bank, pct: f.bankPct.value },
              { fund: 'own', exact: f.exact.own, pct: f.ownPct.value },
            ]}
          >
            <div className="grid size-[150px] place-items-center rounded-full bg-brand-deep shadow-[inset_0_0_0_6px_#ffffff26]">
              <img src="/img/logo-mark.png" alt="" className="h-[82px] w-auto" />
            </div>
          </Donut>
        </div>
      </div>

      <div className="col-span-12 grid grid-cols-4 gap-6">
        {SECTIONS.map((s) => (
          <SectionTeaser key={s.id} s={s} onOpen={() => onJump(s.slide - 1)} />
        ))}
        <Teaser icon={Sigma} title="Жами кредит" subtitle={`лойиҳалар ва ${SUMMARY.feedReserveLabel.toLowerCase()}`} onOpen={() => onJump(totalSlide - 1)}>
          <div className="mt-auto flex items-baseline gap-2 whitespace-nowrap pt-3">
            <Num fig={SUMMARY.totalCredit} className="text-[38px] font-[780] leading-none tracking-[-0.02em] text-ink" />
            <span className="text-[19px] font-[700] text-ink">млн $</span>
          </div>
          <div className="mt-3 text-[14px] font-medium text-ink-2">
            <Num fig={SUMMARY.projectCredit} animate={false} className="font-semibold text-ink" /> + <Num fig={SUMMARY.feedReserve} animate={false} className="font-semibold text-ink" /> млн $
          </div>
        </Teaser>
      </div>
    </div>
  )
}
