import { useEffect, useRef } from 'react'
import { gsap } from '@/animations/gsap'

/**
 * Hook for staggering children or revealing a section on scroll
 */
export function useScrollReveal(options = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.from(options.selector ? el.querySelectorAll(options.selector) : el, {
        opacity: 0,
        y: options.y || 30,
        duration: options.duration || 0.8,
        stagger: options.stagger || 0.12,
        ease: options.ease || 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: options.start || 'top 82%',
          once: true,
        },
      })
    }, el)

    return () => ctx.revert()
  }, [options])

  return ref
}
