// Turns bhp.json into slide-ready figures. Every figure keeps the cells it
// came from (`src`), which the S key shows on the slides.
import raw from './bhp.json'
import { formatNumber } from '../lib/format'
import { splitRound } from '../lib/round'
import type { BhpData, Cell, CostKey, Money, MoneyKey, ProcessingGroup, ProcessingItem, Summed } from './types'

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
  districtCount: districts.length,
  director: 'Алиев Шуҳратбек Эркинович',
  source: 'Смета БХП.xlsx',
}

/** The joint-venture banner, exactly as the client's picture has it. */
export const JOINT_VENTURE = {
  label: 'Қўшма корхона',
  partners: [
    { flag: 'uz' as const, name: '“KEGEYLI BARAKA NASLLI PARRANDA” H.K' },
    { flag: 'cn' as const, name: '“BEIJING HUA DU YOUKOU POULTRY CO., LTD”' },
  ],
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
const sumOf = <T,>(items: T[], pick: (t: T) => number) => items.reduce((a, t) => a + pick(t), 0)

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

/** `target`: the total in rounding steps when it is fixed elsewhere (see SECTION_STEPS). */
function financing(total: Source, bank: Source, own: Source, target?: number): Financing {
  const [b, o] = splitRound([val(bank), val(own)], MLN_STEP, target)
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
  /** Missing on «шу жумладан» rows: their share is already in the parent row. */
  share?: Fig
  exact: { total: number; bank: number; own: number }
  /** Set on a «шу жумладан» row: the key of the row that already includes it. */
  partOf?: string
  /** Units behind the bar (22 generators), shown next to its label. */
  count?: { fig: Fig; unit: string }
}

type BarInput = { key: string; label: string; total: number; bank: number; own: number; src: { total: string[]; bank: string[]; own: string[] }; count?: BarRow['count'] }

/** Rounds rows so their million-$ labels add up to the rounded total, and shares to 100%. */
function barRows(rows: BarInput[], target?: number): BarRow[] {
  const totals = splitRound(rows.map((r) => r.total), MLN_STEP, target)
  const shares = splitRound(rows.map((r) => r.total), sumOf(rows, (r) => r.total) / 100)
  return rows.map((r, i) => ({
    key: r.key,
    label: r.label,
    total: mln(totals[i], r.src.total),
    share: exact(shares[i], r.src.total),
    exact: { total: r.total, bank: r.bank, own: r.own },
    count: r.count,
  }))
}

export const COST_KEYS: CostKey[] = ['construction', 'equipment', 'chickens', 'feed']
const COST_LABEL: Record<CostKey, string> = { construction: 'Қурилиш', equipment: 'Дастгоҳ', chickens: 'Жўжа', feed: 'Озуқа' }
const ref = (c?: Cell | null) => (c ? [c.ref] : [])

function costBars(cost: Money, bank: Money, own: Money, labels: Partial<Record<CostKey, string>> = {}, target?: number): BarRow[] {
  return barRows(
    COST_KEYS.map((k) => ({
      key: k,
      label: labels[k] ?? COST_LABEL[k],
      total: val(cost[k]),
      bank: val(bank[k]),
      own: val(own[k]),
      src: { total: ref(cost[k]), bank: ref(bank[k]), own: ref(own[k]) },
    })),
    target,
  )
}

// The Жами slide splits the deck total across the sections, and each section page
// rounds to that same share: 22 455 thousand $ is 22,45 on every slide (not 22,46),
// so the section figures add up to the cover's 47,84 = 32,63 + 15,21.
const SECTION_IDS: SectionId[] = ['broiler', 'eggs', 'processing']
const SECTION_STEPS = Object.fromEntries(
  splitRound(SECTION_IDS.map((id) => val(data.summary.sections[id].cost.total)), MLN_STEP).map((n, i) => [SECTION_IDS[i], n]),
) as Record<SectionId, number>

// ---------- tables (detail slides) ----------

export type Badge = 'new' | 'reequip' | 'existing' | 'layer' | 'pullets' | 'parent'
export type Flag = 'uz' | 'cn' | 'pl'

export interface TCell {
  fig?: Fig
  text?: string
  badge?: Badge
  flag?: Flag
  src?: string[]
}

export interface TRow {
  key: string
  name: string
  nameSrc: string[]
  note?: string
  cells: TCell[]
}

export interface TGroup {
  key: string
  label?: string
  icon?: ProcessingGroup
  subtotal?: TCell[]
  rows: TRow[]
}

export interface TableView {
  title: string
  caption: string
  columns: { label: string; unit?: string }[]
  groups: TGroup[]
  total: TCell[]
  /** Shown under the table. */
  note?: string
}

/** Exact figure; one decimal only when the sheet has one (e.g. 1 777,5 thousand $). */
const precise = (value: number, src: string[]): Fig => ({ value, decimals: Number.isInteger(Math.round(value * 1000) / 1000) ? 0 : 1, trim: true, src })
const num = (c?: Cell | null, scale = 1, decimals?: number): TCell =>
  c?.value ? { fig: decimals === undefined ? precise(val(c) / scale, [c.ref]) : exact(val(c) / scale, [c.ref], decimals) } : { text: '—' }
const money = (m?: Money, key: MoneyKey = 'total'): TCell => (m?.[key] ? { fig: precise(val(m[key]), [m[key]!.ref]) } : { text: '—' })
const moneySum = (ms: Money[], key: MoneyKey): TCell => ({ fig: precise(sumOf(ms, (m) => val(m[key])), ms.flatMap((m) => ref(m[key]))) })
const blank: TCell = { text: '' }
const COUNTRY_FLAG: Record<string, Flag> = { Хитой: 'cn', Польша: 'pl', Ўзбекистон: 'uz' }

// ---------- overview cards ----------

export interface Stat {
  label: string
  fig?: Fig
  text?: string
  prefix?: string
  unit: string
  hint?: string
}

export interface BreakdownRow {
  key: string
  badge?: Badge
  flag?: Flag
  label: string
  detail: string
  fig: Fig
  unit: string
  /** 0–1, drawn as a meter. */
  share: number
}

export interface BreakdownView {
  title: string
  caption: string
  rows: BreakdownRow[]
}

export type SectionId = 'broiler' | 'eggs' | 'processing'

export interface SectionView {
  id: SectionId
  /** Overview slide number (1-based); the table follows on detailsSlide. */
  slide: number
  detailsSlide: number
  title: string
  subtitle: string
  meta: { place?: string; equipment: string; equipmentSrc: string[] }
  hero: { label: string; fig: Fig; prefix: string; unit: string; chip?: string; chipSrc?: string[] }
  stats: Stat[]
  financing: Financing
  bars: { title: string; rows: BarRow[] }
  breakdown: BreakdownView
  table: TableView
}

const short = (district?: string) => district?.replace(' тумани', '') ?? ''
const plural = (n: number, word: string) => `${formatNumber(n)} та ${word}`

// ---------- Бройлер ----------

function broilerView(slide: number): SectionView {
  const b = data.broiler
  const t = b.totals
  const ratio = val(t.meat) / b.existing.meat
  const byStatus = (s: 'new' | 'reequip' | 'existing') => b.facilities.filter((f) => f.status === s)
  const existing = byStatus('existing')
  // Existing factories get no money in the plan: the sheet's cost cell is 0 or blank and they have no own/bank rows.
  const noMoney = (f: (typeof existing)[number]): TCell[] => {
    const src = [f.investment?.ref ?? `броллер!I${f.row}`, f.supplier.ref]
    return [{ fig: exact(0, src) }, { fig: exact(0, src) }, { fig: exact(0, src) }]
  }
  const statusLabel = { new: 'Янги фабрикалар', reequip: 'Қайта жиҳозланадиган', existing: 'Мавжуд фабрикалар' }

  return {
    id: 'broiler',
    slide,
    detailsSlide: slide + 1,
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
      { label: 'Бинолар', fig: exact(val(t.buildings), refsOf(t.buildings)), unit: 'та', hint: `${b.existing.buildings} таси мавжуд` },
    ],
    financing: financing(t.cost.total!, t.bank.total!, t.own.total!, SECTION_STEPS.broiler),
    bars: { title: 'Харажатлар таркиби', rows: costBars(t.cost, t.bank, t.own, {}, SECTION_STEPS.broiler) },
    breakdown: {
      title: 'Фабрикалар ҳолати',
      caption: 'гўшт ишлаб чиқаришдаги улуши',
      rows: (['new', 'reequip', 'existing'] as const).map((s) => {
        const fs = byStatus(s)
        const meat = sumOf(fs, (f) => val(f.meat))
        return {
          key: s,
          badge: s,
          label: statusLabel[s],
          detail: `${plural(fs.length, 'фабрика')} · ${plural(sumOf(fs, (f) => val(f.buildings)), 'бино')}`,
          fig: exact(meat, fs.map((f) => f.meat.ref)),
          unit: 'т / йил',
          share: meat / val(t.meat),
        }
      }),
    },
    table: {
      title: 'Бройлер фабрикалари',
      caption: 'Парранда — минг бош, пул — минг $',
      columns: [
        { label: 'Ҳолати' },
        { label: 'Бино', unit: 'та' },
        { label: 'Бир бинода', unit: 'бош' },
        { label: 'Парранда', unit: 'минг бош/йил' },
        { label: 'Гўшт', unit: 'т/йил' },
        { label: 'Тушум', unit: 'минг $/йил' },
        { label: 'Қиймати', unit: 'минг $' },
        { label: 'Банк', unit: 'минг $' },
        { label: 'Ўз маблағи', unit: 'минг $' },
      ],
      groups: [
        {
          key: 'all',
          rows: b.facilities.map((f) => ({
            key: String(f.row),
            name: `${short(f.district)} · ${f.name}`,
            nameSrc: [f.nameRef.ref],
            note: f.size ?? undefined,
            cells: [
              { badge: f.status },
              num(f.buildings),
              num(f.birdsPerBuilding),
              num(f.birdsPerYear),
              num(f.meat),
              num(f.revenue),
              ...(f.status === 'existing' ? noMoney(f) : [money(f.cost), money(f.bank), money(f.own)]),
            ],
          })),
        },
      ],
      total: [blank, { fig: exact(val(t.buildings), refsOf(t.buildings)) }, blank, num(t.birdsPerYear), num(t.meat), num(t.revenue), money(t.cost), money(t.bank), money(t.own)],
      note: existing.length
        ? `«Мавжуд» фабрикалар аллақачон ишлаб турибди: сметада уларга маблағ ажратилмаган (0). Уларнинг йиллик ${formatNumber(b.existing.meat)} т гўшти умумий ҳажмга қўшилган.`
        : undefined,
    },
  }
}

// ---------- Тухум ----------

function eggsView(slide: number): SectionView {
  const e = data.eggs
  const t = e.totals
  const parentEggs = millions(t.parentEggs.value * 1000, t.parentEggs.sumOf)
  const kindLabel = { layer: 'Тухум фабрикалари', pullets: 'Рем молодняк', parent: 'Родитель галаси' }
  const cost = val(t.cost.total)

  return {
    id: 'eggs',
    slide,
    detailsSlide: slide + 1,
    title: 'Тухум',
    subtitle: 'Тухум йўналиши',
    meta: { place: [...new Set(e.facilities.map((f) => f.district))].join(', '), equipment: t.country.value ?? '', equipmentSrc: [t.country.ref] },
    hero: {
      label: 'Йиллик тухум ишлаб чиқариш',
      fig: millions(val(t.tableEggs) * 1000, [t.tableEggs.ref]),
      prefix: 'млн',
      unit: 'дона / йил',
      chip: `+ ${formatNumber(parentEggs.value, parentEggs.decimals, true)} млн родитель галаси тухуми`,
      chipSrc: parentEggs.src,
    },
    stats: [
      { label: 'Йиллик тушум', fig: kusdToMln(val(t.revenue), [t.revenue.ref]), prefix: 'млн', unit: '$', hint: 'родитель галаси билан' },
      { label: 'Товуқлар', fig: millions(val(t.hens) * 1000, [t.hens.ref]), prefix: 'млн', unit: 'бош' },
      { label: 'Бинолар', fig: exact(val(t.buildings), [t.buildings.ref]), unit: 'та' },
    ],
    financing: financing(t.cost.total!, t.bank.total!, t.own.total!, SECTION_STEPS.eggs),
    bars: { title: 'Харажатлар таркиби', rows: costBars(t.cost, t.bank, t.own, { chickens: 'Товуқ' }, SECTION_STEPS.eggs) },
    breakdown: {
      title: 'Фабрикалар тури',
      caption: 'лойиҳа қийматидаги улуши',
      rows: (['layer', 'pullets', 'parent'] as const).map((k) => {
        const fs = e.facilities.filter((f) => f.kind === k)
        const c = sumOf(fs, (f) => val(f.cost.total))
        return {
          key: k,
          badge: k,
          label: kindLabel[k],
          detail: `${plural(fs.length, 'фабрика')} · ${plural(sumOf(fs, (f) => val(f.buildings)), 'бино')}`,
          fig: exact(c, fs.map((f) => f.cost.total!.ref)),
          unit: 'минг $',
          share: c / cost,
        }
      }),
    },
    table: {
      title: 'Тухум фабрикалари',
      caption: 'Товуқ — минг бош, тухум — млн дона, пул — минг $',
      columns: [
        { label: 'Тури' },
        { label: 'Бино', unit: 'та' },
        { label: 'Бир бинода', unit: 'бош' },
        { label: 'Товуқ', unit: 'минг бош' },
        { label: 'Тухум', unit: 'млн дона/йил' },
        { label: 'Тушум', unit: 'минг $/йил' },
        { label: 'Қиймати', unit: 'минг $' },
        { label: 'Банк', unit: 'минг $' },
        { label: 'Ўз маблағи', unit: 'минг $' },
      ],
      groups: [
        {
          key: 'all',
          rows: e.facilities.map((f) => ({
            key: String(f.row),
            name: f.name,
            nameSrc: [f.nameRef.ref],
            note: f.size ?? undefined,
            cells: [{ badge: f.kind }, num(f.buildings), num(f.hensPerBuilding), num(f.hens), num(f.eggs, 1000, 2), num(f.revenue), money(f.cost), money(f.bank), money(f.own)],
          })),
        },
      ],
      total: [
        blank,
        num(t.buildings),
        blank,
        num(t.hens),
        { fig: exact(sumOf(e.facilities, (f) => val(f.eggs)) / 1000, e.facilities.map((f) => f.eggs.ref), 2) },
        num(t.revenue),
        money(t.cost),
        money(t.bank),
        money(t.own),
      ],
    },
  }
}

// ---------- Қайта ишлаш ----------

const GROUP_ORDER: ProcessingGroup[] = ['slaughter', 'feedmill', 'transport', 'cold', 'power', 'other']

/** How many units a group has (22 generators), for the chip next to its bar. */
const unitCount = (group: ProcessingItem[]) => ({ fig: exact(sumOf(group, (i) => val(i.count)), group.map((i) => i.count.ref)), unit: 'та' })

function processingView(slide: number): SectionView {
  const p = data.processing
  const t = p.totals
  const items = p.items
  const transport = items.filter((i) => i.group === 'transport')
  const feedmill = items.find((i) => i.group === 'feedmill')
  const cold = items.find((i) => i.group === 'cold')
  const feedPerHour = Number(feedmill?.name.match(/соатига (\d+) тн/)?.[1] ?? 0)
  const coldTonnes = Number(cold?.capacityText?.value?.match(/(\d+)/)?.[1] ?? 0)
  const countries = [...new Set(items.map((i) => i.country.value ?? '').filter(Boolean))]
  const groups = GROUP_ORDER.filter((g) => items.some((i) => i.group === g))
  const carries = [['Жўжа', 'жўжа'], ['Озуқа', 'озуқа'], ['гўшт', 'гўшт']].filter(([k]) => transport.some((i) => i.name.includes(k))).map(([, w]) => w)
  const totalCost = val(t.cost.total)

  const capacity = (i: (typeof items)[number]): TCell =>
    i.perHour
      ? { text: `${formatNumber(val(i.perHour))} бош/соат`, src: [i.perHour.ref] }
      : i.capacityText
        ? { text: (i.capacityText.value ?? '').replace(/(\d+)\s*тн/, (_, n) => `${formatNumber(Number(n))} т`), src: [i.capacityText.ref] }
        : { text: '—' }

  return {
    id: 'processing',
    slide,
    detailsSlide: slide + 1,
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
      { label: 'Махсус автомобиллар', fig: exact(sumOf(transport, (i) => val(i.count)), transport.map((i) => i.count.ref)), unit: 'та', hint: carries.length ? `${carries.join(', ')} ташиш` : undefined },
      feedPerHour
        ? { label: 'Ем завод', fig: exact(feedPerHour, feedmill ? [feedmill.nameRef.ref] : []), unit: 'т / соат' }
        : { label: 'Ем завод', text: '—', unit: '' },
      coldTonnes
        ? { label: 'Музлаткич', fig: exact(coldTonnes, cold?.capacityText ? [cold.capacityText.ref] : []), unit: 'т' }
        : { label: 'Музлаткич', text: '—', unit: '' },
    ],
    financing: financing(t.cost.total!, t.bank.total!, t.own.total!, SECTION_STEPS.processing),
    bars: {
      title: 'Маблағ йўналишлари',
      rows: barRows(
        groups.map((g) => {
          const group = items.filter((i) => i.group === g)
          const pick = (key: 'cost' | 'bank' | 'own') => group.map((i) => i[key].total!)
          return {
            key: g,
            label: p.groups[g],
            total: sumOf(pick('cost'), val),
            bank: sumOf(pick('bank'), val),
            own: sumOf(pick('own'), val),
            src: { total: pick('cost').map((c) => c.ref), bank: pick('bank').map((c) => c.ref), own: pick('own').map((c) => c.ref) },
            // The client asked to see the generator count on this slide and on Жами.
            count: g === 'power' ? unitCount(group) : undefined,
          }
        }),
        SECTION_STEPS.processing,
      ),
    },
    breakdown: {
      title: 'Дастгоҳ етказиб берувчилар',
      caption: 'қиймат бўйича улуши',
      rows: countries.map((country) => {
        const group = items.filter((i) => i.country.value === country)
        const c = sumOf(group, (i) => val(i.cost.total))
        return {
          key: country,
          flag: COUNTRY_FLAG[country],
          label: country,
          detail: `${plural(group.length, 'позиция')}`,
          fig: exact(c, group.map((i) => i.cost.total!.ref)),
          unit: 'минг $',
          share: c / totalCost,
        }
      }),
    },
    table: {
      title: 'Дастгоҳ ва транспорт',
      caption: 'Пул — минг $',
      columns: [
        { label: 'Сони', unit: 'та' },
        { label: 'Қуввати' },
        { label: 'Давлат' },
        { label: 'Қурилиш', unit: 'минг $' },
        { label: 'Дастгоҳ', unit: 'минг $' },
        { label: 'Қиймати', unit: 'минг $' },
        { label: 'Банк', unit: 'минг $' },
        { label: 'Ўз маблағи', unit: 'минг $' },
      ],
      groups: groups.map((g) => {
        const group = items.filter((i) => i.group === g)
        return {
          key: g,
          label: p.groups[g],
          icon: g,
          subtotal: [blank, blank, blank, moneySum(group.map((i) => i.cost), 'construction'), moneySum(group.map((i) => i.cost), 'equipment'), moneySum(group.map((i) => i.cost), 'total'), moneySum(group.map((i) => i.bank), 'total'), moneySum(group.map((i) => i.own), 'total')],
          rows: group.map((i) => ({
            key: String(i.row),
            name: i.name,
            nameSrc: [i.nameRef.ref],
            cells: [
              num(i.count),
              capacity(i),
              { text: i.country.value ?? '—', flag: COUNTRY_FLAG[i.country.value ?? ''], src: [i.country.ref] },
              money(i.cost, 'construction'),
              money(i.cost, 'equipment'),
              money(i.cost),
              money(i.bank),
              money(i.own),
            ],
          })),
        }
      }),
      total: [blank, blank, blank, money(t.cost, 'construction'), money(t.cost, 'equipment'), money(t.cost), money(t.bank), money(t.own)],
    },
  }
}

// Slides: cover, then an overview and a table slide per direction, then the total.
export const SECTIONS: SectionView[] = [broilerView(2), eggsView(4), processingView(6)]

// ---------- Жами ----------

const sum = data.summary
const sectionLabel: Record<SectionId, string> = { broiler: 'Бройлер', eggs: 'Тухум', processing: 'Қайта ишлаш' }

// The client wants the generator on the Жами slide too, with its count. The sheet
// books it as equipment (дастгох!H34), so Дастгоҳ keeps the sheet's own total
// (жами лойиха!E15, generator included) and the generator shows under it as
// «шу жумладан»: it isn't counted twice, and the main rows still add up to the total.
const power = data.processing.items.filter((i) => i.group === 'power')

function summaryCosts(): BarRow[] {
  const rows = costBars(sum.total.cost, sum.total.bank, sum.total.own, { chickens: 'Жўжа / товуқ' })
  if (!power.length) return rows
  const total = (fund: 'cost' | 'bank' | 'own') => sumOf(power, (i) => val(i[fund].total))
  const refs = (fund: 'cost' | 'bank' | 'own') => power.flatMap((i) => ref(i[fund].total))
  const generator: BarRow = {
    key: 'power',
    label: data.processing.groups.power,
    total: kusdToMln(total('cost'), refs('cost')),
    exact: { total: total('cost'), bank: total('bank'), own: total('own') },
    count: unitCount(power),
    partOf: 'equipment',
  }
  const at = rows.findIndex((r) => r.key === 'equipment') + 1
  return [...rows.slice(0, at), generator, ...rows.slice(at)]
}

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
        src: { total: ref(sec.cost.total), bank: ref(sec.bank.total), own: ref(sec.own.total) },
      }
    }),
  ),
  costs: summaryCosts(),
  // Жами кредит is the sheet's C22 = the projects' bank credit (C17) + the 5 000 feed reserve (C18).
  // The client first left the reserve out (27.09.2026), then asked to add it back (28.09.2026).
  totalCredit: kusdToMln(val(sum.totalCredit), [sum.totalCredit.ref]),
  projectCredit: kusdToMln(val(sum.total.bank.total), ref(sum.total.bank.total)),
  feedReserve: kusdToMln(val(sum.feedReserve), [sum.feedReserve.ref]),
  buildings: exact(val(data.broiler.totals.buildings) + val(data.eggs.totals.buildings), [
    ...refsOf(data.broiler.totals.buildings),
    data.eggs.totals.buildings.ref,
  ]),
}

export type SlideKind = 'cover' | 'overview' | 'details' | 'total'
export interface SlideSpec {
  key: string
  kind: SlideKind
  section?: SectionView
  title: string
}

export const SLIDES: SlideSpec[] = [
  { key: 'cover', kind: 'cover', title: 'Муқова' },
  ...SECTIONS.flatMap((s): SlideSpec[] => [
    { key: s.id, kind: 'overview', section: s, title: s.title },
    { key: `${s.id}-table`, kind: 'details', section: s, title: s.table.title },
  ]),
  { key: 'total', kind: 'total', title: 'Жами' },
]
