import {
  Bird,
  Cog,
  Drumstick,
  Egg,
  Factory,
  Hammer,
  Landmark,
  Package,
  Snowflake,
  Truck,
  Wallet,
  Wheat,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { SectionId } from '../data/deck'
import type { CostKey, ProcessingGroup } from '../data/types'

export const SECTION_ICON: Record<SectionId, LucideIcon> = {
  broiler: Drumstick,
  eggs: Egg,
  processing: Factory,
}

export const COST_ICON: Record<CostKey, LucideIcon> = {
  construction: Hammer,
  equipment: Cog,
  chickens: Bird,
  feed: Wheat,
}

export const GROUP_ICON: Record<ProcessingGroup, LucideIcon> = {
  slaughter: Factory,
  feedmill: Wheat,
  transport: Truck,
  cold: Snowflake,
  power: Zap,
  other: Package,
}

/** A bar row's icon: a cost type (Қурилиш…) or a processing group (Генератор…). */
export const barIcon = (key: string): LucideIcon | undefined => COST_ICON[key as CostKey] ?? GROUP_ICON[key as ProcessingGroup]

export const FUNDS = {
  bank: { icon: Landmark, label: 'Банк кредити', color: 'var(--color-bank)' },
  own: { icon: Wallet, label: 'Ўз маблағи', color: 'var(--color-own)' },
} as const
