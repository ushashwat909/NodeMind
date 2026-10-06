import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { pageEnter } from '../animations/gsap'

/**
 * Root layout — provides the outer shell for all pages with React-safe GSAP route entrance.
 */
export default function RootLayout() {
  const location = useLocation()
  const mainRef = useRef(null)

  useEffect(() => {
    if (mainRef.current) {
      pageEnter(mainRef.current, { y: 8, duration: 0.25 })
    }
  }, [location.pathname])

  return (
    <div className="app-layout">
      <main className="app-main" ref={mainRef}>
        <Outlet />
      </main>
    </div>
  )
}
