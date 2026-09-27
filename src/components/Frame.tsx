import { useLayoutEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Sigma, type LucideIcon } from 'lucide-react'
import { DECK, SECTIONS, SLIDES } from '../data/deck'
import { SECTION_ICON } from './icons'

export const STAGE_W = 1920
export const STAGE_H = 1080

/** Draws the deck at 1920×1080 and scales it to fit the window. */
export function Stage({ printPreview, children }: { printPreview: boolean; children: ReactNode }) {
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const fit = () =>
      setScale(printPreview ? window.innerWidth / STAGE_W : Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [printPreview])

  return (
    <div className="stage-viewport">
      <div className="stage" style={printPreview ? { zoom: scale } : { transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}

/** Soft brand shapes behind the glass cards (same idea as the reference site). */
export function Backdrop() {
  return (
    <div aria-hidden className="no-print pointer-events-none absolute inset-0 overflow-hidden">
      <div className="blob" style={{ width: 760, height: 760, left: -220, top: -300, background: 'radial-gradient(circle, #176bff66, transparent 66%)' }} />
      <div className="blob" style={{ width: 700, height: 700, right: -200, top: 80, background: 'radial-gradient(circle, #7b3ff24d, transparent 66%)', animationDelay: '-6s' }} />
      <div className="blob" style={{ width: 620, height: 620, left: '36%', bottom: -330, background: 'radial-gradient(circle, #d4a26859, transparent 66%)', animationDelay: '-12s' }} />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{ backgroundImage: 'radial-gradient(#123b8f1f 1px, transparent 1px)', backgroundSize: '28px 28px', maskImage: 'linear-gradient(180deg, #000 0%, transparent 70%)' }}
      />
    </div>
  )
}

function Chip({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex h-11 items-center gap-2 rounded-full px-4 text-[16px] font-semibold transition-colors duration-200 ${
        active ? 'bg-brand-blue text-white shadow-[0_8px_20px_-8px_#176bffcc]' : 'text-ink-2 hover:bg-white/80 hover:text-ink'
      }`}
    >
      <Icon size={18} strokeWidth={2.2} />
      {label}
    </button>
  )
}

/** The three directions, then the total. */
function SectionNav({ current, onJump }: { current: number; onJump: (i: number) => void }) {
  return (
    <nav aria-label="Йўналишлар" className="flex items-center gap-1">
      {SECTIONS.map((s) => (
        <Chip key={s.id} active={current === s.slide - 1} icon={SECTION_ICON[s.id]} label={s.title} onClick={() => onJump(s.slide - 1)} />
      ))}
      <span className="mx-2 h-6 w-px bg-hairline" aria-hidden />
      <Chip active={current === SLIDES.length - 1} icon={Sigma} label="Жами" onClick={() => onJump(SLIDES.length - 1)} />
    </nav>
  )
}

export interface DeckControls {
  index: number
  go: (delta: number) => void
  jump: (i: number) => void
  fullscreen: boolean
  toggleFullscreen: () => void
}

export function Header({ index, controls }: { index: number; controls: DeckControls }) {
  const total = SLIDES.length
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <header className="glass absolute left-12 right-12 top-6 z-10 flex h-[78px] items-center gap-6 rounded-[24px] pl-3 pr-4">
      <div className="flex items-center gap-3.5">
        <div className="grid size-[54px] place-items-center rounded-[16px] bg-brand-deep shadow-[0_8px_18px_-8px_#123b8fb0]">
          <img src="/img/logo-mark.png" alt="" className="h-[34px] w-auto" />
        </div>
        <div className="leading-tight">
          <div className="text-[21px] font-[760] tracking-[-0.01em] text-brand-deep">{DECK.brand}</div>
          <div className="text-[14px] font-medium text-ink-2">{DECK.byline}</div>
        </div>
      </div>

      <div className="flex flex-1 justify-center">
        <SectionNav current={index} onJump={controls.jump} />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end gap-1.5">
          <div className="text-[16px] font-semibold tabular-nums text-ink-3">
            <span className="text-[20px] font-[760] text-ink">{pad(index + 1)}</span> / {pad(total)}
          </div>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-hairline">
            <div className="h-full rounded-full bg-brand-blue transition-[width] duration-500" style={{ width: `${((index + 1) / total) * 100}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={controls.toggleFullscreen}
          aria-label="Тўлиқ экран (F)"
          title="Тўлиқ экран (F)"
          className="no-print grid size-11 place-items-center rounded-full text-ink-2 transition-colors hover:bg-white hover:text-ink"
        >
          {controls.fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>
    </header>
  )
}

export function Footer({ controls }: { controls: DeckControls }) {
  return (
    <footer className="absolute bottom-5 left-16 right-12 z-10 flex h-10 items-center justify-between text-[14px] font-medium text-ink-3">
      <span>
        Манба: {DECK.source} · «{DECK.company}» хусусий корхонаси
      </span>
      <div className="no-print flex items-center gap-2">
        <button
          type="button"
          onClick={() => controls.go(-1)}
          disabled={controls.index === 0}
          aria-label="Олдинги слайд (←)"
          className="glass grid size-10 place-items-center rounded-full text-ink-2 transition hover:text-ink disabled:opacity-40"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => controls.go(1)}
          disabled={controls.index === SLIDES.length - 1}
          aria-label="Кейинги слайд (→)"
          className="glass grid size-10 place-items-center rounded-full text-ink-2 transition hover:text-ink disabled:opacity-40"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </footer>
  )
}
