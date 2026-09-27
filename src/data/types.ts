// Shape of src/data/bhp.json, written by scripts/extract.py.

/** One spreadsheet cell: its value and where it came from. */
export interface Cell<T = number> {
  value: T | null
  ref: string
  formula?: string
  /** Set when the sheet's value was replaced (e.g. a total whose formula skips rows). */
  sheetValue?: number
  sumOf?: string[]
  /** Set when the slide text differs from the sheet text. */
  sheetText?: string
  note?: string
  hidden?: boolean
}

export interface Summed {
  value: number
  sumOf: string[]
}

export type MoneyKey = 'total' | 'construction' | 'equipment' | 'chickens' | 'feed'
export type CostKey = Exclude<MoneyKey, 'total'>
/** A money row; columns a sheet doesn't have are null (the processing sheet has no chickens or feed). */
export type Money = Record<MoneyKey, Cell | null>

interface Named {
  row: number
  name: string
  district?: string
  size?: string | null
  nameRef: Cell<string>
}

export interface BroilerFacility extends Named {
  status: 'new' | 'reequip' | 'existing'
  buildings: Cell
  birdsPerBuilding: Cell
  /** Thousand birds a year. */
  birdsPerYear: Cell
  /** Tonnes of live weight a year. */
  meat: Cell
  /** Thousand $ a year. */
  revenue: Cell
  supplier: Cell<string>
  cost?: Money
  own?: Money
  bank?: Money
  /** Existing («мавжуд») factories only: the sheet's cost cell, 0 or blank. */
  investment?: Cell
}

export interface EggFacility extends Named {
  kind: 'layer' | 'pullets' | 'parent'
  buildings: Cell
  hensPerBuilding: Cell
  /** Thousand hens. */
  hens: Cell
  /** Thousand eggs a year. */
  eggs: Cell
  revenue: Cell
  supplier: Cell<string>
  cost: Money
  own: Money
  bank: Money
}

export type ProcessingGroup = 'slaughter' | 'feedmill' | 'transport' | 'cold' | 'power' | 'other'

export interface ProcessingItem {
  row: number
  name: string
  nameRef: Cell<string>
  group: ProcessingGroup
  count: Cell
  perHour: Cell | null
  capacityText: Cell<string> | null
  country: Cell<string>
  cost: Money
  own: Money
  bank: Money
}

interface Funding {
  cost: Money
  own: Money
  bank: Money
}

export interface BhpData {
  meta: { source: string; sha256: string; extractedAt: string; company: string; year: string }
  broiler: {
    totals: Funding & { buildings: Cell; birdsPerYear: Cell; meat: Cell; revenue: Cell; country: Cell<string> }
    existing: { buildings: number; birdsPerYear: number; meat: number; revenue: number; refs: string[] }
    project: { buildings: number; birdsPerYear: number; meat: number; revenue: number; refs: string[] }
    facilities: BroilerFacility[]
  }
  eggs: {
    totals: Funding & { buildings: Cell; hens: Cell; tableEggs: Cell; parentEggs: Summed; revenue: Cell; country: Cell<string> }
    facilities: EggFacility[]
  }
  processing: {
    groups: Record<ProcessingGroup, string>
    lineCapacity: Cell
    totals: Funding & { country: Cell<string> }
    items: ProcessingItem[]
  }
  summary: {
    sections: Record<'broiler' | 'eggs' | 'processing', Funding & { label: Cell<string> }>
    total: Funding & { label: Cell<string> }
    feedReserve: Cell & { label: string; labelRef: string }
    totalCredit: Cell & { label: string }
  }
}
