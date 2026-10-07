import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register plugins centrally
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Checks if the user prefers reduced motion
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * React-safe GSAP context runner with automatic cleanup
 */
export function useGsapContext(callback, deps = [], scopeRef = null) {
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion()) return

    const scope = scopeRef ? scopeRef.current : undefined
    const ctx = gsap.context(() => {
      callback()
    }, scope)

    return () => ctx.revert()
  }, deps)
}

/* ==========================================================================
   1. fadeUp
   Reveals an element moving upward with opacity
   ========================================================================== */
export function fadeUp(target, options = {}) {
  if (!target) return null
  if (prefersReducedMotion()) {
    gsap.set(target, { opacity: 1, y: 0 })
    return null
  }

  const {
    y = 16,
    duration = 0.38,
    delay = 0,
    ease = 'power2.out',
    blur = false,
    scrollTrigger = null,
    onComplete = null,
    ...rest
  } = options

  const fromVars = {
    opacity: 0,
    y,
    ...(blur ? { filter: 'blur(4px)' } : {}),
  }

  const toVars = {
    opacity: 1,
    y: 0,
    ...(blur ? { filter: 'blur(0px)' } : {}),
    duration,
    delay,
    ease,
    onComplete,
    ...rest,
  }

  if (scrollTrigger) {
    toVars.scrollTrigger = {
      trigger: target,
      start: 'top 85%',
      once: true,
      ...scrollTrigger,
    }
  }

  return gsap.fromTo(target, fromVars, toVars)
}

/* ==========================================================================
   2. staggerReveal
   Reveals multiple child elements with crisp, restrained stagger
   ========================================================================== */
export function staggerReveal(targets, options = {}) {
  if (!targets) return null
  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0 })
    return null
  }

  const {
    y = 14,
    stagger = 0.045,
    duration = 0.35,
    delay = 0,
    ease = 'power2.out',
    scrollTrigger = null,
    onComplete = null,
    ...rest
  } = options

  const toVars = {
    opacity: 1,
    y: 0,
    duration,
    delay,
    stagger,
    ease,
    onComplete,
    ...rest,
  }

  if (scrollTrigger) {
    toVars.scrollTrigger = {
      trigger: typeof targets === 'string' ? targets : targets[0] || targets,
      start: 'top 85%',
      once: true,
      ...scrollTrigger,
    }
  }

  return gsap.fromTo(targets, { opacity: 0, y }, toVars)
}

/* ==========================================================================
   3. pageEnter
   Crisp, fast entrance for view transitions and tab changes
   ========================================================================== */
export function pageEnter(target, options = {}) {
  if (!target) return null
  if (prefersReducedMotion()) {
    gsap.set(target, { opacity: 1, y: 0 })
    return null
  }

  const {
    y = 10,
    duration = 0.28,
    delay = 0,
    ease = 'power2.out',
    onComplete = null,
    ...rest
  } = options

  return gsap.fromTo(
    target,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease,
      clearProps: 'transform',
      onComplete: () => {
        gsap.set(target, { clearProps: 'transform' })
        if (typeof onComplete === 'function') onComplete()
      },
      ...rest,
    }
  )
}

/* ==========================================================================
   4. pageExit
   Fast, subtle exit transition before route or tab unmounts
   ========================================================================== */
export function pageExit(target, options = {}) {
  if (!target) return Promise.resolve()
  if (prefersReducedMotion()) {
    gsap.set(target, { opacity: 0 })
    return Promise.resolve()
  }

  const {
    y = -8,
    duration = 0.18,
    ease = 'power2.in',
    onComplete = null,
    ...rest
  } = options

  return new Promise((resolve) => {
    gsap.to(target, {
      opacity: 0,
      y,
      duration,
      ease,
      onComplete: () => {
        if (onComplete) onComplete()
        resolve()
      },
      ...rest,
    })
  })
}

/* ==========================================================================
   5. scaleIn
   Micro scale and opacity reveal for badges, tags, and status dots
   ========================================================================== */
export function scaleIn(target, options = {}) {
  if (!target) return null
  if (prefersReducedMotion()) {
    gsap.set(target, { opacity: 1, scale: 1 })
    return null
  }

  const {
    scale = 0.94,
    duration = 0.26,
    delay = 0,
    ease = 'power2.out',
    onComplete = null,
    ...rest
  } = options

  return gsap.fromTo(
    target,
    { opacity: 0, scale },
    { opacity: 1, scale: 1, duration, delay, ease, onComplete, ...rest }
  )
}

/* ==========================================================================
   6. slideIn
   Subtle directional slide for sidebars, banners, and tooltips
   ========================================================================== */
export function slideIn(target, direction = 'left', options = {}) {
  if (!target) return null
  if (prefersReducedMotion()) {
    gsap.set(target, { opacity: 1, x: 0, y: 0 })
    return null
  }

  const {
    distance = 24,
    duration = 0.32,
    delay = 0,
    ease = 'power2.out',
    onComplete = null,
    ...rest
  } = options

  let x = 0
  let y = 0
  if (direction === 'left') x = -distance
  else if (direction === 'right') x = distance
  else if (direction === 'top') y = -distance
  else if (direction === 'bottom') y = distance

  return gsap.fromTo(
    target,
    { opacity: 0, x, y },
    { opacity: 1, x: 0, y: 0, duration, delay, ease, onComplete, ...rest }
  )
}

/* ==========================================================================
   7. numberCount
   Restrained numeric rolling animation for quality scores & metrics
   ========================================================================== */
export function numberCount(target, endValue, options = {}) {
  if (!target) return null
  const numericEnd = typeof endValue === 'number' ? endValue : parseFloat(endValue) || 0

  if (prefersReducedMotion()) {
    if (typeof target === 'function') {
      target(numericEnd)
    } else if (target && 'textContent' in target) {
      target.textContent = Math.round(numericEnd)
    }
    return null
  }

  const {
    startValue = 0,
    duration = 0.65,
    delay = 0,
    ease = 'power2.out',
    decimals = 0,
    prefix = '',
    suffix = '',
    onUpdate = null,
    onComplete = null,
  } = options

  const counterObj = { val: startValue }

  return gsap.to(counterObj, {
    val: numericEnd,
    duration,
    delay,
    ease,
    onUpdate: () => {
      const formatted = decimals > 0
        ? counterObj.val.toFixed(decimals)
        : Math.round(counterObj.val).toString()
      const displayString = `${prefix}${formatted}${suffix}`

      if (typeof target === 'function') {
        target(counterObj.val, displayString)
      } else if (target && 'textContent' in target) {
        target.textContent = displayString
      }
      if (onUpdate) onUpdate(counterObj.val, displayString)
    },
    onComplete,
  })
}

/* ==========================================================================
   8. panelReveal
   Sophisticated expansion via clip-path and subtle translation
   ========================================================================== */
export function panelReveal(target, options = {}) {
  if (!target) return null
  if (prefersReducedMotion()) {
    gsap.set(target, { opacity: 1, clipPath: 'none', y: 0 })
    return null
  }

  const {
    duration = 0.35,
    delay = 0,
    ease = 'power2.out',
    direction = 'vertical', // 'vertical' | 'horizontal'
    onComplete = null,
    ...rest
  } = options

  const initialClip = direction === 'vertical'
    ? 'inset(0% 0% 100% 0%)'
    : 'inset(0% 100% 0% 0%)'

  return gsap.fromTo(
    target,
    { opacity: 0.3, clipPath: initialClip, y: direction === 'vertical' ? 10 : 0 },
    {
      opacity: 1,
      clipPath: 'inset(0% 0% 0% 0%)',
      y: 0,
      duration,
      delay,
      ease,
      onComplete,
      ...rest,
    }
  )
}

/* ==========================================================================
   9. modalReveal
   Sleek modal backdrop fade and card scale/elevation
   ========================================================================== */
export function modalReveal(cardTarget, backdropTarget = null, options = {}) {
  if (!cardTarget) return null

  if (prefersReducedMotion()) {
    if (backdropTarget) gsap.set(backdropTarget, { opacity: 1 })
    gsap.set(cardTarget, { opacity: 1, scale: 1, y: 0 })
    return {
      close: (onDone) => {
        if (backdropTarget) gsap.set(backdropTarget, { opacity: 0 })
        gsap.set(cardTarget, { opacity: 0 })
        if (onDone) onDone()
      },
    }
  }

  const {
    duration = 0.32,
    ease = 'power2.out',
    onComplete = null,
  } = options

  const tl = gsap.timeline({ onComplete })

  if (backdropTarget) {
    tl.fromTo(
      backdropTarget,
      { opacity: 0 },
      { opacity: 1, duration: duration * 0.75, ease: 'power1.out' },
      0
    )
  }

  tl.fromTo(
    cardTarget,
    { opacity: 0, scale: 0.95, y: 16 },
    { opacity: 1, scale: 1, y: 0, duration, ease },
    0.04
  )

  return {
    timeline: tl,
    close: (onDone) => {
      const exitTl = gsap.timeline({
        onComplete: onDone,
      })

      exitTl.to(cardTarget, {
        opacity: 0,
        scale: 0.97,
        y: 8,
        duration: 0.18,
        ease: 'power2.in',
      }, 0)

      if (backdropTarget) {
        exitTl.to(backdropTarget, {
          opacity: 0,
          duration: 0.2,
          ease: 'power1.in',
        }, 0.03)
      }
    },
  }
}

/* ==========================================================================
   React Custom Hooks
   ========================================================================== */

export function useFadeUp(options = {}, deps = []) {
  const ref = useRef(null)
  useGsapContext(() => {
    if (ref.current) fadeUp(ref.current, options)
  }, deps, ref)
  return ref
}

export function useStaggerReveal(selector, options = {}, deps = []) {
  const containerRef = useRef(null)
  useGsapContext(() => {
    if (containerRef.current) {
      const elements = containerRef.current.querySelectorAll(selector)
      if (elements.length > 0) staggerReveal(elements, options)
    }
  }, deps, containerRef)
  return containerRef
}

export function useNumberCount(endValue, options = {}, deps = []) {
  const ref = useRef(null)
  useGsapContext(() => {
    if (ref.current) numberCount(ref.current, endValue, options)
  }, [endValue, ...deps], ref)
  return ref
}

export function usePageEnter(options = {}, deps = []) {
  const ref = useRef(null)
  useGsapContext(() => {
    if (ref.current) pageEnter(ref.current, options)
  }, deps, ref)
  return ref
}

export { gsap, ScrollTrigger }
export default gsap
