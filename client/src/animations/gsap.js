import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register plugins once centrally
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Creates subtle scroll parallax on target element (disabled if prefersReducedMotion)
 */
export function createParallax(target, trigger, movement = 35) {
  if (!target || !trigger) return null
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null
  }

  return gsap.to(target, {
    y: movement,
    ease: 'none',
    scrollTrigger: {
      trigger,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.2,
    },
  })
}

/**
 * Creates scroll reveal for section headers or blocks
 */
export function createScrollReveal(target, trigger = target, vars = {}) {
  if (!target) return null
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(target, { opacity: 1, y: 0 })
    return null
  }

  return gsap.from(target, {
    opacity: 0,
    y: 28,
    duration: 0.65,
    ease: 'power2.out',
    scrollTrigger: {
      trigger,
      start: 'top 85%',
      once: true,
      ...vars.scrollTrigger,
    },
    ...vars,
  })
}

// Re-export all motion design utilities and hooks
export * from './motion'
export { gsap, ScrollTrigger }
export default gsap
