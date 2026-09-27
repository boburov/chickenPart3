import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { useGSAP } from '@gsap/react'
import { formatNumber } from './format'

gsap.registerPlugin(useGSAP, CustomEase)
// The two curves from chicken-ochre.vercel.app (--ease-out, --ease-spring).
CustomEase.create('brand', '0.22, 1, 0.36, 1')
CustomEase.create('spring', '0.34, 1.36, 0.64, 1')

export { gsap }

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Puts every counter on a slide back to its final text. */
export function settleCounters(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    if (el.dataset.final) el.textContent = el.dataset.final
  })
}

/**
 * Entrance for one slide. Elements opt in with data-anim and play in reading order:
 * rise (cards, text), photo, pop (pills), bar, line-x / line-y (connectors), arc (donut),
 * and data-count (numbers count up to their final text).
 */
export function playEntrance(slide: HTMLElement): gsap.core.Timeline {
  const q = gsap.utils.selector(slide)
  const tl = gsap.timeline({ defaults: { ease: 'brand' } })

  tl.from(q('[data-anim="rise"]'), { y: 28, autoAlpha: 0, duration: 0.85, stagger: 0.06 }, 0.05)
  tl.from(q('[data-anim="photo"]'), { scale: 1.08, autoAlpha: 0, duration: 1.4 }, 0.1)
  tl.from(q('[data-anim="line-y"]'), { scaleY: 0, transformOrigin: '50% 0%', duration: 0.45 }, 0.55)
  tl.from(q('[data-anim="line-x"]'), { scaleX: 0, transformOrigin: '50% 50%', duration: 0.55 }, 0.7)
  tl.from(q('[data-anim="pop"]'), { scale: 0.5, autoAlpha: 0, duration: 0.7, ease: 'spring', stagger: 0.08 }, 0.85)
  tl.from(q('[data-anim="bar"]'), { scaleX: 0, transformOrigin: '0% 50%', duration: 1, stagger: 0.05 }, 0.5)

  q('[data-anim="arc"]').forEach((arc, i) => {
    const full = arc.getAttribute('data-circumference')
    tl.from(arc, { attr: { 'stroke-dasharray': `0 ${full}` }, duration: 1.1, ease: 'power3.inOut' }, 0.5 + i * 0.35)
  })

  q<HTMLElement>('[data-count]').forEach((el, i) => {
    const final = el.dataset.final ?? ''
    const decimals = (final.split(',')[1] ?? '').length
    const target = Number(el.dataset.count)
    const counter = { v: 0 }
    const show = (v: number) => void (el.textContent = formatNumber(v, decimals))
    show(0)
    tl.to(
      counter,
      { v: target, duration: 1.5, ease: 'power3.out', onUpdate: () => show(counter.v), onComplete: () => void (el.textContent = final) },
      0.35 + Math.min(i, 10) * 0.04,
    )
  })

  return tl
}
