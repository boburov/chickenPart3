import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { SLIDES } from './data/deck'
import { Backdrop, Footer, Header, Stage, type DeckControls } from './components/Frame'
import { SourcesContext } from './components/Num'
import { gsap, playEntrance, prefersReducedMotion, settleCounters } from './lib/motion'
import { CoverSlide } from './slides/CoverSlide'
import { DetailsSlide } from './slides/DetailsSlide'
import { OverviewSlide } from './slides/OverviewSlide'
import { TotalSlide } from './slides/TotalSlide'

const LAST = SLIDES.length - 1
const clamp = (i: number) => Math.min(Math.max(i, 0), LAST)
const indexFromHash = () => clamp((Number(window.location.hash.slice(1)) || 1) - 1)

export default function App() {
  const printPreview = useMemo(() => new URLSearchParams(window.location.search).has('print'), [])
  const [index, setIndex] = useState(indexFromHash)
  const [sources, setSources] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<HTMLElement[]>([])
  const entrance = useRef<gsap.core.Timeline | null>(null)
  const transition = useRef<gsap.core.Timeline | null>(null)
  const shown = useRef<number | null>(null)

  const jump = useCallback((i: number) => setIndex(clamp(i)), [])
  const go = useCallback((delta: number) => setIndex((i) => clamp(i + delta)), [])
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.()
  }, [])
  const controls: DeckControls = { index, go, jump, fullscreen, toggleFullscreen }

  useEffect(() => {
    document.documentElement.classList.toggle('print-preview', printPreview)
  }, [printPreview])

  // #3 in the address bar opens slide 3; the hash follows the current slide.
  useEffect(() => {
    if (!printPreview) window.history.replaceState(null, '', `#${index + 1}`)
  }, [index, printPreview])
  useEffect(() => {
    const onHash = () => setIndex(indexFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // Keys use e.code so F and S work on a Cyrillic keyboard layout too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const onButton = e.target instanceof Element && e.target.closest('button')
      switch (e.code) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          go(1)
          break
        case 'Space':
        case 'Enter':
          if (onButton) return
          go(1)
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
        case 'Backspace':
          go(-1)
          break
        case 'Home':
          jump(0)
          break
        case 'End':
          jump(LAST)
          break
        case 'KeyF':
          toggleFullscreen()
          break
        case 'KeyS':
          setSources((on) => !on)
          break
        default:
          if (!/^Digit[1-9]$/.test(e.code)) return
          jump(Number(e.code.slice(5)) - 1)
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, jump, toggleFullscreen])

  // Swipe left / right on touch screens.
  useEffect(() => {
    let start: { x: number; y: number } | null = null
    const down = (e: PointerEvent) => void (start = e.pointerType === 'touch' ? { x: e.clientX, y: e.clientY } : null)
    const up = (e: PointerEvent) => {
      if (!start) return
      const dx = e.clientX - start.x
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - start.y)) go(dx < 0 ? 1 : -1)
      start = null
    }
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [go])

  // A click anywhere on the slide goes to the next one. Buttons, links and chart bars
  // keep their own action, and selecting text doesn't count as a click.
  useEffect(() => {
    if (printPreview) return
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (e.target instanceof Element && e.target.closest('button, a, input, select, textarea, [role="button"], [tabindex]')) return
      if (window.getSelection()?.toString()) return
      go(1)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [go, printPreview])

  // Printing: finish every animation so each page shows final numbers.
  useEffect(() => {
    const finish = () => {
      transition.current?.progress(1)
      entrance.current?.progress(1)
      settleCounters(document)
    }
    window.addEventListener('beforeprint', finish)
    return () => window.removeEventListener('beforeprint', finish)
  }, [])

  // Slide change. Which slide is visible is decided by the .is-active class (CSS);
  // GSAP only animates the hand-over and then clears its inline styles, so a revert
  // (unmount, StrictMode rehearsal, hot reload) always falls back to the right slide.
  useGSAP(
    () => {
      const forget = () => {
        shown.current = null
      }
      if (printPreview) return forget
      const els = slideRefs.current
      const reduced = prefersReducedMotion()
      const prev = shown.current
      shown.current = index
      transition.current?.progress(1)

      if (prev === null || prev === index) {
        if (prev === null && !reduced) entrance.current = playEntrance(els[index])
        return forget
      }

      const from = els[prev]
      const to = els[index]
      const oldEntrance = entrance.current
      entrance.current = null
      const reset = (el: HTMLElement) => gsap.set(el, { clearProps: 'visibility,opacity,transform' })
      if (reduced) {
        oldEntrance?.revert()
        settleCounters(from)
        return forget
      }
      const dir = index > prev ? 1 : -1
      transition.current = gsap
        .timeline()
        .fromTo(from, { autoAlpha: 1, x: 0 }, { autoAlpha: 0, x: -70 * dir, duration: 0.42, ease: 'power2.in' })
        .add(() => {
          oldEntrance?.revert()
          settleCounters(from)
          reset(from)
        })
        .fromTo(to, { autoAlpha: 0, x: 90 * dir }, { autoAlpha: 1, x: 0, duration: 0.75, ease: 'brand', onComplete: () => reset(to) }, 0.28)
        .add(() => void (entrance.current = playEntrance(to)), 0.28)
      return forget
    },
    { dependencies: [index, printPreview], scope: stageRef },
  )

  return (
    <SourcesContext.Provider value={sources}>
      <Stage printPreview={printPreview}>
        <div ref={stageRef} className="deck absolute inset-0">
          <Backdrop />
          {SLIDES.map((slide, i) => {
            return (
              <section
                key={slide.key}
                ref={(el) => {
                  if (el) slideRefs.current[i] = el
                }}
                className={i === index ? 'slide is-active' : 'slide'}
                aria-roledescription="слайд"
                aria-label={`${i + 1} / ${SLIDES.length}: ${slide.title}`}
                aria-hidden={!printPreview && i !== index}
                inert={!printPreview && i !== index}
              >
                {slide.kind !== 'cover' && <Header index={i} controls={controls} />}
                {slide.kind === 'cover' && <CoverSlide index={i} controls={{ ...controls, index: i }} />}
                {slide.kind === 'overview' && slide.section && <OverviewSlide s={slide.section} />}
                {slide.kind === 'details' && slide.section && <DetailsSlide s={slide.section} />}
                {slide.kind === 'total' && <TotalSlide onJump={jump} slide={i + 1} />}
                <Footer controls={{ ...controls, index: i }} />
              </section>
            )
          })}
        </div>
      </Stage>
      {sources && (
        <div className="no-print glass-strong fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-[14px] font-semibold text-ink">
          Манбалар кўрсатилмоқда: варақ ва катак · S — яшириш
        </div>
      )}
    </SourcesContext.Provider>
  )
}
