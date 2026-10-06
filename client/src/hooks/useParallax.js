import { useEffect, useRef } from 'react'
import { gsap } from '@/animations/gsap'

/**
 * Hook to apply subtle mouse-driven tilt and parallax to a container
 */
export function useMouseParallax(intensity = 15) {
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect()
      const xPos = (e.clientX - rect.left) / rect.width - 0.5
      const yPos = (e.clientY - rect.top) / rect.height - 0.5

      gsap.to(el, {
        rotationY: xPos * intensity,
        rotationX: -yPos * intensity,
        ease: 'power1.out',
        duration: 0.5,
        transformPerspective: 1000,
        transformOrigin: 'center center',
      })
    }

    const handleMouseLeave = () => {
      gsap.to(el, {
        rotationY: 0,
        rotationX: 0,
        ease: 'power2.out',
        duration: 0.7,
      })
    }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [intensity])

  return containerRef
}
