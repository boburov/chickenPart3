// Turns bhp.json into slide-ready figures. Every figure keeps the cells it
// came from (`src`), which the S key shows on the slides.
import raw from './bhp.json'
import { formatNumber } from '../lib/format'
import { splitRound } from '../lib/round'
import type { BhpData, Cell, CostKey, Money, MoneyKey, ProcessingGroup, Summed } from './types'

export const data = raw as unknown as BhpData

const districts = [...new Set([...data.broiler.facilities, ...data.eggs.facilities].map((f) => f.district?.replace(' тумани', '')).filter(Boolean))]

export const DECK = {
  brand: 'Shuxrat ōgli',
  byline: 'By «Baraka hamkor parranda» XK',
  company: data.meta.company,
  plan: 'Кредитга бўлган талаб режаси',
  year: data.meta.year,
  region: 'Андижон вилояти',
  districts: `${districts.slice(0, -1).join(', ')} ва ${districts.at(-1)} туманлари`,
  director: 'Алиев Шуҳратбек Эркинович',
  source: 'Смета БХП.xlsx',
}

/** A number ready to show, with the spreadsheet cells it came from. */
export interface Fig {
  value: number
  decimals: number
  /** Drop trailing zeros: 21,00 → 21, 21,50 → 21,5. */
  trim?: boolean
  src: string[]
}

type Source = Cell | Summed
const val = (c?: Source | null) => c?.value ?? 0
const refsOf = (c: Source) => (c.sumOf?.length ? c.sumOf : 'ref' in c ? [c.ref] : [])

// The sheets keep money in thousand $. Slides show million $ with two decimals,
// so one rounding step is 10 thousand $.
const MLN_STEP = 10
const mln = (steps: number, src: string[], trim = false): Fig => ({ value: steps / 100, decimals: 2, trim, src })
const exact = (value: number, src: string[], decimals = 0): Fig => ({ value, decimals, src })
const kusdToMln = (thousands: number, src: string[]) => mln(Math.round(thousands / MLN_STEP), src, true)

/** A count in millions: 417 990 000 → 418, 17 520 000 → 17,5, 1 880 000 → 1,88. */
function millions(count: number, src: string[]): Fig {
  const m = count / 1_000_000
  const decimals = m >= 100 ? 0 : m >= 10 ? 1 : 2
  return { value: Number(m.toFixed(decimals)), decimals, trim: true, src }
}

export interface Financing {
  total: Fig
  bank: Fig
  own: Fig
  bankPct: Fig
  ownPct: Fig
  exact: { total: number; bank: number; own: number }
}

function financing(total: Source, bank: Source, own: Source): Financing {
  const [b, o] = splitRound([val(bank), val(own)], MLN_STEP)
  const [bp, op] = splitRound([val(bank), val(own)], val(total) / 100)
  return {
    total: mln(b + o, refsOf(total), true),
    bank: mln(b, refsOf(bank)),
    own: mln(o, refsOf(own)),
    bankPct: exact(bp, [...refsOf(bank), ...refsOf(total)]),
    ownPct: exact(op, [...refsOf(own), ...refsOf(total)]),
    exact: { total: val(total), bank: val(bank), own: val(own) },
  }
}

/** One bar of a bank | own stacked bar chart. */
export interface BarRow {
  key: string
  label: string
  total: Fig
  share: Fig
  exact: { total: number; bank: number; own: number }
}

/** Rounds rows so their million-$ labels add up to the rounded total, and shares to 100%. */
function barRows(rows: { key: string; label: string; total: number; bank: number; own: number; src: { total: string[]; bank: string[]; own: string[] } }[]): BarRow[] {
  const totals = splitRound(rows.map((r) => r.total), MLN_STEP)
  const sum = rows.reduce((a, r) => a + r.total, 0)
  const shares = splitRound(rows.map((r) => r.total), sum / 100)
  return rows.map((r, i) => ({
    key: r.key,
    label: r.label,
    total: mln(totals[i], r.src.total),
    share: exact(shares[i], r.src.total),
    exact: { total: r.total, bank: r.bank, own: r.own },
  }))
}

export const COST_KEYS: CostKey[] = ['construction', 'equipment', 'chickens', 'feed']
const COST_LABEL: Record<CostKey, string> = { construction: 'Қурилиш', equipment: 'Дастгоҳ', chickens: 'Жўжа', feed: 'Озуқа' }

function costBars(cost: Money, bank: Money, own: Money, labels: Partial<Record<CostKey, string>> = {}): BarRow[] {
  return barRows(
    COST_KEYS.map((k) => ({
      key: k,
      label: labels[k] ?? COST_LABEL[k],
      total: val(cost[k]),
      bank: val(bank[k]),
      own: val(own[k]),
      src: { total: cost[k] ? [cost[k].ref] : [], bank: bank[k] ? [bank[k].ref] : [], own: own[k] ? [own[k].ref] : [] },
    })),
  )
}

export type Badge = 'new' | 'reequip' | 'existing' | 'layer' | 'pullets' | 'parent' | ProcessingGroup

export interface TCell {
  fig?: Fig
  text?: string
  src?: string[]
}

export interface TRow {
  key: string
  name: string
  nameSrc: string[]
  note?: string
  badge?: Badge
  cells: TCell[]
}

export interface TableView {
  title: string
  caption: string
  columns: string[]
  rows: TRow[]
  total: TCell[]
}

export interface Stat {
  label: string
  fig?: Fig
  text?: string
  prefix?: string
  unit: string
  hint?: string
}

export type SectionId = 'broiler' | 'eggs' | 'processing'

export interface SectionView {
  id: SectionId
  slide: number
  title: string
  subtitle: string
  meta: { place?: string; equipment: string; equipmentSrc: string[] }
  hero: { label: string; fig: Fig; prefix: string; unit: string; chip?: string; chipSrc?: string[] }
  stats: Stat[]
  financing: Financing
  bars: { title: string; rows: BarRow[] }
  table: TableView
}

const moneyCell = (m?: Money, key: MoneyKey = 'total'): TCell => (m?.[key] ? { fig: exact(val(m[key]), [m[key]!.ref]) } : { text: '—' })
const short = (district?: string) => district?.replace(' тумани', '') ?? ''

// ---------- Бройлер ----------

function broilerView(slide: number): SectionView {
  const b = data.broiler
  const t = b.totals
  const ratio = val(t.meat) / b.existing.meat
  const existingBuildings = b.existing.buildings
  return {
    id: 'broiler',
    slide,
    title: 'Бройлер',
    subtitle: 'Бройлер йўналиши',
    meta: {
      place: `${[...new Set(b.facilities.map((f) => short(f.district)))].join(' ва ')} туманлари`,
      equipment: t.country.value ?? '',
      equipmentSrc: [t.country.ref],
    },
    hero: {
      label: 'Йиллик гўшт ишлаб чиқариш',
      fig: exact(val(t.meat), [t.meat.ref]),
      prefix: 'т',
      unit: 'тирик вазнда / йил',
      chip: `ҳозир ${formatNumber(b.existing.meat)} т · ${formatNumber(ratio, 1)} баробар ўсиш`,
      chipSrc: b.existing.refs,
    },
    stats: [
      { label: 'Йиллик тушум', fig: kusdToMln(val(t.revenue), [t.revenue.ref]), prefix: 'млн', unit: '$' },
      { label: 'Йилига парранда', fig: millions(val(t.birdsPerYear) * 1000, [t.birdsPerYear.ref]), prefix: 'млн', unit: 'бош', hint: '6 марта боқилади' },
      {
        label: 'Бинолар',
        fig: exact(val(t.buildings), refsOf(t.buildings)),
        unit: 'та',
        hint: existingBuildings ? `${existingBuildings} таси мавжуд` : undefined,
      },
    ],
    financing: financing(t.cost.total!, t.bank.total!, t.own.total!),
    bars: { title: 'Харажатлар таркиби', rows: costBars(t.cost, t.bank, t.own) },
    table: {
      title: 'Фабрикалар',
      caption: 'парранда — минг бош/йил · гўшт — т/йил · пул — минг $',
      columns: ['Бино', 'Парранда', 'Гўшт', 'Қиймати', 'шундан банк'],
      rows: b.facilities.map((f) => ({
        key: String(f.row),
        name: `${short(f.district)} · ${f.name}`,
        nameSrc: [f.nameRef.ref],
        note: f.size ?? undefined,
        badge: f.status,
        cells: [
          { fig: exact(val(f.buildings), [f.buildings.ref]) },
          { fig: exact(val(f.birdsPerYear), [f.birdsPerYear.ref]) },
          { fig: exact(val(f.meat), [f.meat.ref]) },
          moneyCell(f.cost),
          moneyCell(f.bank),
        ],
      })),
      total: [
        { fig: exact(val(t.buildings), refsOf(t.buildings)) },
        { fig: exact(val(t.birdsPerYear), [t.birdsPerYear.ref]) },
        { fig: exact(val(t.meat), [t.meat.ref]) },
        moneyCell(t.cost),
        moneyCell(t.bank),
      ],
    },
  }
}

// ---------- Тухум ----------

function eggsView(slide: number): SectionView {
  const e = data.eggs
  const t = e.totals
  const eggRefs = e.facilities.map((f) => f.eggs.ref)
  const parentEggs = millions(t.parentEggs.value * 1000, t.parentEggs.sumOf)
  return {
    id: 'eggs',
    slide,
    title: 'Тухум',
    subtitle: 'Тухум йўналиши',
    meta: {
      place: [...new Set(e.facilities.map((f) => f.district))].join(', '),
      equipment: t.country.value ?? '',
      equipmentSrc: [t.country.ref],
    },
    hero: {
      label: 'Йиллик тухум ишлаб чиқариш',
      fig: millions(val(t.tableEggs) * 1000, [t.tableEggs.ref]),
      prefix: 'млн',
      unit: 'дона / йил',
      chip: `+ ${formatNumber(parentEggs.value, parentEggs.decimals, true)} млн ота-она гала тухуми`,
      chipSrc: parentEggs.src,
    },
    stats: [
      { label: 'Йиллик тушум', fig: kusdToMln(val(t.revenue), [t.revenue.ref]), prefix: 'млн', unit: '$', hint: 'ота-она гала билан' },
      { label: 'Товуқлар', fig: millions(val(t.hens) * 1000, [t.hens.ref]), prefix: 'млн', unit: 'бош' },
      { label: 'Бинолар', fig: exact(val(t.buildings), [t.buildings.ref]), unit: 'та' },
    ],
    financing: financing(t.cost.total!, t.bank.total!, t.own.total!),
    bars: { title: 'Харажатлар таркиби', rows: costBars(t.cost, t.bank, t.own, { chickens: 'Товуқ' }) },
    table: {
      title: 'Фабрикалар',
      caption: 'товуқ — минг бош · тухум — млн дона/йил · пул — минг $',
      columns: ['Бино', 'Товуқ', 'Тухум', 'Қиймати', 'шундан банк'],
      rows: e.facilities.map((f) => ({
        key: String(f.row),
        name: f.name,
        nameSrc: [f.nameRef.ref],
        note: f.size ?? undefined,
        badge: f.kind,
        cells: [
          { fig: exact(val(f.buildings), [f.buildings.ref]) },
          { fig: exact(val(f.hens), [f.hens.ref]) },
          val(f.eggs) ? { fig: exact(val(f.eggs) / 1000, [f.eggs.ref], 2) } : { text: '—' },
          moneyCell(f.cost),
          moneyCell(f.bank),
        ],
      })),
      total: [
        { fig: exact(val(t.buildings), [t.buildings.ref]) },
        { fig: exact(val(t.hens), [t.hens.ref]) },
        { fig: exact(e.facilities.reduce((a, f) => a + val(f.eggs), 0) / 1000, eggRefs, 2) },
        moneyCell(t.cost),
        moneyCell(t.bank),
      ],
    },
  }
}

// ---------- Қайта ишлаш ----------

const GROUP_ORDER: ProcessingGroup[] = ['slaughter', 'feedmill', 'transport', 'cold']

function processingView(slide: number): SectionView {
  const p = data.processing
  const t = p.totals
  const items = p.items
  const transport = items.filter((i) => i.group === 'transport')
  const feedmill = items.find((i) => i.group === 'feedmill')
  const cold = items.find((i) => i.group === 'cold')
  const feedPerHour = Number(feedmill?.name.match(/соатига (\d+) тн/)?.[1] ?? 0)
  const coldTonnes = Number(cold?.capacityText?.value?.match(/(\d+)/)?.[1] ?? 0)
  const countries = [...new Set(items.map((i) => i.country.value).filter(Boolean))]

  return {
    id: 'processing',
    slide,
    title: 'Қайта ишлаш',
    subtitle: 'Сўйиш, ем завод, транспорт ва музлаткич',
    meta: { equipment: countries.join(', '), equipmentSrc: items.map((i) => i.country.ref) },
    hero: {
      label: 'Сўйиш линияси қуввати',
      fig: exact(val(p.lineCapacity), [p.lineCapacity.ref]),
      prefix: '',
      unit: 'бош / соат',
      chip: 'сўйиш, ички органларни олиш ва совитиш',
    },
    stats: [
      {
        label: 'Махсус автомобиллар',
        fig: exact(transport.reduce((a, i) => a + val(i.count), 0), transport.map((i) => i.count.ref)),
        unit: 'та',
        hint: 'жўжа, озуқа, гўшт',
      },
      feedPerHour
        ? { label: 'Ем завод', fig: exact(feedPerHour, feedmill ? [feedmill.nameRef.ref] : []), unit: 'т / соат' }
        : { label: 'Ем завод', text: '—', unit: '' },
      coldTonnes
        ? { label: 'Музлаткич', fig: exact(coldTonnes, cold?.capacityText ? [cold.capacityText.ref] : []), unit: 'т' }
        : { label: 'Музлаткич', text: '—', unit: '' },
    ],
    financing: financing(t.cost.total!, t.bank.total!, t.own.total!),
    bars: {
      title: 'Маблағ йўналишлари',
      rows: barRows(
        GROUP_ORDER.map((g) => {
          const group = items.filter((i) => i.group === g)
          const pick = (key: 'cost' | 'bank' | 'own') => group.map((i) => i[key].total!)
          return {
            key: g,
            label: p.groups[g],
            total: pick('cost').reduce((a, c) => a + val(c), 0),
            bank: pick('bank').reduce((a, c) => a + val(c), 0),
            own: pick('own').reduce((a, c) => a + val(c), 0),
            src: { total: pick('cost').map((c) => c.ref), bank: pick('bank').map((c) => c.ref), own: pick('own').map((c) => c.ref) },
          }
        }),
      ),
    },
    table: {
      title: 'Дастгоҳ ва транспорт',
      caption: 'пул — минг $',
      columns: ['Сони', 'Қуввати', 'Давлат', 'Қиймати', 'шундан банк'],
      rows: items.map((i) => ({
        key: String(i.row),
        name: i.name,
        nameSrc: [i.nameRef.ref],
        badge: i.group,
        cells: [
          i.count.value ? { fig: exact(val(i.count), [i.count.ref]) } : { text: '—' },
          i.perHour
            ? { text: `${formatNumber(val(i.perHour))} бош/соат`, src: [i.perHour.ref] }
            : i.capacityText
              ? { text: (i.capacityText.value ?? '').replace(/(\d+)\s*тн/, (_, n) => `${formatNumber(Number(n))} т`), src: [i.capacityText.ref] }
              : { text: '—' },
          { text: i.country.value ?? '—', src: [i.country.ref] },
          moneyCell(i.cost),
          moneyCell(i.bank),
        ],
      })),
      total: [{ text: '' }, { text: '' }, { text: '' }, moneyCell(t.cost), moneyCell(t.bank)],
    },
  }
}

export const SECTIONS: SectionView[] = [broilerView(2), eggsView(3), processingView(4)]
export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s])) as Record<SectionId, SectionView>

// ---------- Жами ----------

const sum = data.summary
const sectionLabel: Record<SectionId, string> = { broiler: 'Бройлер', eggs: 'Тухум', processing: 'Қайта ишлаш' }
const reserve = val(sum.feedReserve)

export const SUMMARY = {
  financing: financing(sum.total.cost.total!, sum.total.bank.total!, sum.total.own.total!),
  bySection: barRows(
    (['broiler', 'eggs', 'processing'] as const).map((id) => {
      const sec = sum.sections[id]
      return {
        key: id,
        label: sectionLabel[id],
        total: val(sec.cost.total),
        bank: val(sec.bank.total),
        own: val(sec.own.total),
        src: { total: [sec.cost.total!.ref], bank: [sec.bank.total!.ref], own: [sec.own.total!.ref] },
      }
    }),
  ),
  costs: costBars(sum.total.cost, sum.total.bank, sum.total.own, { chickens: 'Жўжа / товуқ' }),
  projectCredit: kusdToMln(val(sum.total.bank.total), [sum.total.bank.total!.ref]),
  feedReserve: kusdToMln(reserve, [sum.feedReserve.ref]),
  feedReserveLabel: sum.feedReserve.label,
  totalCredit: kusdToMln(val(sum.total.bank.total) + reserve, [sum.total.bank.total!.ref, sum.feedReserve.ref]),
  totalCreditMatchesSheet: val(sum.total.bank.total) + reserve === val(sum.totalCredit),
  buildings: exact(val(data.broiler.totals.buildings) + val(data.eggs.totals.buildings), [
    ...refsOf(data.broiler.totals.buildings),
    data.eggs.totals.buildings.ref,
  ]),
}

export type SlideId = 'cover' | SectionId | 'total'
export const SLIDES: { id: SlideId; title: string }[] = [
  { id: 'cover', title: 'Муқова' },
  ...SECTIONS.map((sec) => ({ id: sec.id as SlideId, title: sec.title })),
  { id: 'total', title: 'Жами' },
]
