import type { ReactNode } from 'react'
import { ArrowUpRight, Banknote, Drumstick, Egg, Factory, Landmark, MapPin, UserRound, Warehouse, Wheat, type LucideIcon } from 'lucide-react'
import { DECK, SECTIONS, SUMMARY, type Fig, type SectionView } from '../data/deck'
import { COVER_PHOTOS } from '../data/photos'
import { Brand, Controls, type DeckControls } from '../components/Frame'
import { Card, IconTile, JointVentureBanner, PhotoSlot, SectionLabel } from '../components/Blocks'
import { Donut } from '../components/Charts'
import { FUNDS, SECTION_ICON } from '../components/icons'
import { Num } from '../components/Num'

const PHOTO_ICONS: LucideIcon[] = [Drumstick, Egg, Factory, Wheat]

function Kpi({ icon, label, fig, unit, sub }: { icon: LucideIcon; label: string; fig: Fig; unit: string; sub?: ReactNode }) {
  return (
    <div data-anim="rise" className="glass flex min-h-0 items-center gap-5 rounded-[22px] px-6">
      <IconTile icon={icon} size={56} />
      <div className="min-w-0">
        <div className="label-caps">{label}</div>
        <div className="mt-1.5 flex items-baseline gap-2 whitespace-nowrap">
          <Num fig={fig} className="text-[44px] font-[800] leading-none tracking-[-0.02em] text-navy-deep" />
          <span className="text-[18px] font-semibold text-ink-2">{unit}</span>
        </div>
        {sub && <div className="mt-1.5 truncate text-[14px] font-medium text-ink-2">{sub}</div>}
      </div>
    </div>
  )
}

/** One direction's headline result; the first card is the highlighted one, as on chicken-ov1. */
function Result({ s, highlight, onOpen }: { s: SectionView; highlight: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      data-anim="rise"
      onClick={onOpen}
      className={`group flex min-h-0 flex-col justify-between rounded-[24px] px-7 py-6 text-left transition-shadow duration-300 ${
        highlight ? 'bg-grad text-white shadow-glow' : 'glass text-ink hover:shadow-glow'
      }`}
    >
      <div className="flex items-center gap-3">
        <IconTile icon={SECTION_ICON[s.id]} size={44} tone={highlight ? 'soft' : 'grad'} />
        <span className={`text-[13px] font-[800] uppercase tracking-[0.12em] ${highlight ? 'text-white/85' : 'text-brand-deep'}`}>{s.hero.label}</span>
        <ArrowUpRight size={22} className={`ml-auto ${highlight ? 'text-white/70' : 'text-ink-3 group-hover:text-brand-blue'}`} />
      </div>
      <div>
        <div className="flex items-baseline gap-2 whitespace-nowrap">
          <Num fig={s.hero.fig} className={`text-[52px] font-[800] leading-none tracking-[-0.02em] ${highlight ? '' : 'text-navy-deep'}`} />
          {s.hero.prefix && <span className="text-[24px] font-[750]">{s.hero.prefix}</span>}
          <span className={`text-[16px] font-medium ${highlight ? 'text-white/80' : 'text-ink-2'}`}>{s.hero.unit}</span>
        </div>
        {s.hero.chip && <div className={`mt-2 truncate text-[15px] font-semibold ${highlight ? 'text-white/85' : 'text-brand-deep'}`}>{s.hero.chip}</div>}
      </div>
    </button>
  )
}

export function CoverSlide({ index, controls }: { index: number; controls: DeckControls }) {
  const f = SUMMARY.financing
  return (
    <>
      <div className="absolute left-[72px] right-[72px] top-7 z-10 flex items-start justify-between">
        <div className="pt-7">
          <Brand />
        </div>
        <JointVentureBanner />
        <div className="pt-7">
          <Controls index={index} controls={controls} />
        </div>
      </div>

      <div aria-hidden className="dots pointer-events-none absolute left-[120px] top-[176px] h-[80px] w-[208px] opacity-60" />
      <div aria-hidden className="dots pointer-events-none absolute right-[120px] top-[176px] h-[80px] w-[208px] opacity-60" />
      <div className="absolute inset-x-[72px] top-[156px] bottom-[76px] flex flex-col">
        <div className="text-center">
          <h1 data-anim="rise" className="text-[76px] font-[800] uppercase leading-none tracking-[-0.02em] text-brand-deep">
            Барака Ҳамкор <span className="text-brand-blue">Парранда</span>
          </h1>
          <div data-anim="rise" className="mt-4 text-[17px] font-[750] uppercase tracking-[0.08em] text-brand-deep/80">
            Хусусий корхонасининг {DECK.plan.toLowerCase()} · {DECK.year}
          </div>
          <div data-anim="rise" className="mt-3 flex items-center justify-center gap-6 text-[16px] font-medium text-ink-2">
            <span className="flex items-center gap-2">
              <MapPin size={17} className="text-brand-blue" /> {DECK.region}: {DECK.districts}
            </span>
            <span className="flex items-center gap-2">
              <UserRound size={17} className="text-brand-blue" /> Корхона раҳбари: <span className="font-semibold text-ink">{DECK.director}</span>
            </span>
          </div>
        </div>

        <div className="mt-8 grid min-h-0 flex-1 grid-cols-[480px_560px_minmax(0,1fr)] gap-7">
          <div className="grid min-h-0 grid-rows-3 gap-5">
            <Kpi icon={Banknote} label="Лойиҳа қиймати" fig={f.total} unit="млн $" />
            <Kpi
              icon={Landmark}
              label="Жами кредит"
              fig={SUMMARY.totalCredit}
              unit="млн $"
              sub={
                <>
                  лойиҳалар <Num fig={SUMMARY.projectCredit} animate={false} className="font-semibold text-ink" /> + озуқа заҳираси{' '}
                  <Num fig={SUMMARY.feedReserve} animate={false} className="font-semibold text-ink" />
                </>
              }
            />
            <Kpi icon={Warehouse} label="Парранда бинолари" fig={SUMMARY.buildings} unit="та" sub={`${DECK.districtCount} та туманда`} />
          </div>

          <Card label="Молиялаштириш манбалари" icon={Landmark} className="flex min-h-0 flex-col">
            <div className="flex flex-1 items-center gap-7">
              <Donut
                size={196}
                thickness={24}
                parts={[
                  { fund: 'bank', exact: f.exact.bank, pct: f.bankPct.value },
                  { fund: 'own', exact: f.exact.own, pct: f.ownPct.value },
                ]}
              >
                <div className="grid size-[124px] place-items-center rounded-full bg-brand-deep shadow-[inset_0_0_0_6px_#ffffff26]">
                  <img src="/img/logo-mark.png" alt="" className="h-[66px] w-auto" />
                </div>
              </Donut>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-[800] uppercase tracking-[0.12em] text-ink-3">Жами</div>
                <div className="flex items-baseline gap-2 whitespace-nowrap">
                  <Num fig={f.total} className="text-[46px] font-[800] leading-none tracking-[-0.02em] text-navy-deep" />
                  <span className="text-[18px] font-semibold text-ink-2">млн $</span>
                </div>
                <div className="mt-5 grid gap-3">
                  {(['bank', 'own'] as const).map((k) => (
                    <div key={k} className="flex items-center gap-2.5 text-[16px]">
                      <i className="size-3 shrink-0 rounded-[3px]" style={{ background: FUNDS[k].color }} />
                      <span className="flex-1 font-medium text-ink-2">{FUNDS[k].label}</span>
                      <span className="whitespace-nowrap font-[750] text-ink">
                        <Num fig={f[k]} animate={false} />
                      </span>
                      <span className="w-10 text-right font-semibold text-ink-3">
                        <Num fig={k === 'bank' ? f.bankPct : f.ownPct} animate={false} />%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2.5 rounded-[14px] bg-mist px-4 py-3 text-[15px] font-medium text-ink-2">
              <Wheat size={17} className="shrink-0 text-brand-blue" />
              {SUMMARY.feedReserveLabel}: <span className="font-[750] text-ink">+<Num fig={SUMMARY.feedReserve} animate={false} /> млн $</span> банк кредити
            </div>
          </Card>

          <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-5">
            {COVER_PHOTOS.map((p, i) => (
              <PhotoSlot key={p.caption} src={p.src} caption={p.caption} number={String(i + 1).padStart(2, '0')} icon={PHOTO_ICONS[i % PHOTO_ICONS.length]} />
            ))}
          </div>
        </div>

        <SectionLabel className="mt-8">Эришиладиган натижалар</SectionLabel>
        <div className="mt-4 grid h-[168px] grid-cols-3 gap-7">
          {SECTIONS.map((s, i) => (
            <Result key={s.id} s={s} highlight={i === 0} onOpen={() => controls.jump(s.slide - 1)} />
          ))}
        </div>
      </div>
    </>
  )
}
