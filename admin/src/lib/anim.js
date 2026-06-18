// admin/src/lib/anim.js
// Shared anime.js (v4) helpers for consistent motion across the admin.
// Animations from https://animejs.com/ — applied uniformly to similar elements.
import { useEffect, useRef, useState } from 'react'
import { animate, stagger } from 'animejs'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Staggered fade + rise entrance for a group of elements inside a container.
 * Returns a ref to attach to the wrapper. Direct children animate in by default.
 *
 * @param {Array} deps   re-run the entrance when these change (e.g. [loading])
 * @param {Object} opts  { selector, y, delay, duration }
 */
export function useEntrance(deps = [], opts = {}) {
  const {
    selector = ':scope > *',
    y        = 18,
    delay    = 55,
    duration = 600,
  } = opts
  const ref = useRef(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const els = Array.from(root.querySelectorAll(selector))
    if (!els.length) return
    if (prefersReducedMotion()) return

    animate(els, {
      opacity:    [0, 1],
      translateY: [y, 0],
      duration,
      delay:      stagger(delay),
      ease:       'out(3)',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}

/**
 * Animate a number from 0 → value. Returns the live display value.
 * Use with Number formatting at the call site.
 */
export function useCountUp(value, opts = {}) {
  const { duration = 1000 } = opts
  const [display, setDisplay] = useState(0)
  const objRef = useRef({ n: 0 })

  useEffect(() => {
    const target = Number(value) || 0
    if (prefersReducedMotion()) { setDisplay(target); return }

    const obj = objRef.current
    const anim = animate(obj, {
      n:        target,
      duration,
      ease:     'out(4)',
      onUpdate: () => setDisplay(obj.n),
      onComplete: () => setDisplay(target),
    })
    return () => { if (anim && anim.pause) anim.pause() }
  }, [value, duration])

  return display
}

/**
 * One-shot entrance for a single element (e.g. a modal, a hero card).
 * Pass a ref; animates on mount.
 */
export function usePop(opts = {}) {
  const { scaleFrom = 0.96, y = 10, duration = 480 } = opts
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    animate(el, {
      opacity:    [0, 1],
      translateY: [y, 0],
      scale:      [scaleFrom, 1],
      duration,
      ease:       'out(4)',
    })
  }, [])
  return ref
}
