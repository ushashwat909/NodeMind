import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/animations/motion'
import './PhotoWallSection.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const COLLAGE_PHOTOS = [
  {
    id: 'photo-1',
    src: '/images/engineering/engineering-03.jpg',
    alt: 'Pair programming and debugging session in tech studio',
    caption: 'PAIR PROGRAMMING · AUTH KERNEL REFACTOR',
    time: '11:42 AM',
    spanClass: 'span-large',
  },
  {
    id: 'photo-2',
    src: '/images/engineering/engineering-01.jpg',
    alt: 'Close-up of syntax-highlighted code on retina display',
    caption: 'TERMINAL VIEW · AST TRAVERSAL',
    time: '03:15 PM',
    spanClass: 'span-vertical',
  },
  {
    id: 'photo-3',
    src: '/images/engineering/engineering-04.jpg',
    alt: 'Software engineer working deeply at night',
    caption: 'DEEP WORK · LATE SPRINT DEFECT AUDIT',
    time: '01:28 AM',
    spanClass: 'span-medium',
  },
  {
    id: 'photo-4',
    src: '/images/engineering/engineering-05.jpg',
    alt: 'Engineers discussing architecture around conference desk',
    caption: 'ARCHITECTURE SYNC · CROSS-SERVICE CONTRACT',
    time: '04:50 PM',
    spanClass: 'span-wide',
  },
  {
    id: 'photo-5',
    src: '/images/engineering/engineering-06.jpg',
    alt: 'Developer workstation with multi-monitor dev environment',
    caption: 'WORKSTATION SETUP · DEV ENVIRONMENT',
    time: '10:05 AM',
    spanClass: 'span-small',
  },
  {
    id: 'photo-6',
    src: '/images/engineering/engineering-07.jpg',
    alt: 'Software engineer inspecting unified pull request diffs',
    caption: 'PR AUDIT · ZERO-PERSISTENCE VALIDATION',
    time: '02:14 PM',
    spanClass: 'span-medium-tall',
  },
]

export default function PhotoWallSection() {
  const sectionRef = useRef(null)
  const collageRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current || !collageRef.current) return

    const section = sectionRef.current
    const collage = collageRef.current
    const items = collage.querySelectorAll('.collage-item')

    const ctx = gsap.context(() => {
      // Subtle staggered scroll entrance for collage items
      gsap.fromTo(
        items,
        { opacity: 0, y: 40, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: collage,
            start: 'top 80%',
            once: true,
          },
        }
      )

      // Gentle interactive mouse parallax on desktop
      const isDesktop = window.innerWidth > 1024
      if (isDesktop) {
        const handleMouseMove = (e) => {
          const { clientX, clientY } = e
          const xPercent = (clientX / window.innerWidth - 0.5) * 12
          const yPercent = (clientY / window.innerHeight - 0.5) * 12

          items.forEach((item, idx) => {
            const factor = (idx % 3 + 1) * 0.4
            gsap.to(item, {
              x: xPercent * factor,
              y: yPercent * factor,
              duration: 1,
              ease: 'power1.out',
            })
          })
        }

        section.addEventListener('mousemove', handleMouseMove, { passive: true })
        return () => section.removeEventListener('mousemove', handleMouseMove)
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="photo-wall-section" aria-label="Engineering Culture Showcase">
      <div className="photo-wall-container">
        {/* Top Header */}
        <div className="photo-wall-header">
          <div className="header-meta-row">
            <span className="meta-index-tag">05 / ENGINEERING DISCIPLINE</span>
            <span className="meta-sep">/</span>
            <span className="meta-label">PEER REVIEW IN PRACTICE</span>
          </div>
          <h2 className="photo-wall-title">
            BUILT FOR BUILDERS
            <br />
            WHO CARE.
          </h2>
          <p className="photo-wall-sub">
            The craft of software development lives in the details. We build tools that honor
            thoughtful engineering culture and amplify human judgment.
          </p>
        </div>

        {/* Dynamic Editorial Collage (Non-uniform asymmetrical grid) */}
        <div ref={collageRef} className="editorial-collage-grid">
          {COLLAGE_PHOTOS.map((photo) => (
            <div key={photo.id} className={`collage-item ${photo.spanClass}`}>
              <div className="collage-image-wrap">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="collage-img"
                  loading="lazy"
                  decoding="async"
                />
                <div className="collage-overlay" />
                <div className="collage-caption-bar">
                  <span className="caption-text">{photo.caption}</span>
                  <span className="caption-time">{photo.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
