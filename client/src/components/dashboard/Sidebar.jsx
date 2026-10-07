import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap, prefersReducedMotion, slideIn } from '@/animations/gsap'

export default function Sidebar({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  repoCount = 0,
  openFindingsCount = 0,
  user,
  profile,
  onSignOut,
  signingOut,
}) {
  const sidebarRef = useRef(null)

  // Micro-interaction on tab switch
  useEffect(() => {
    if (prefersReducedMotion()) return
    const activeBtn = sidebarRef.current?.querySelector(`.sidebar-nav-btn.active`)
    if (activeBtn) {
      gsap.fromTo(
        activeBtn,
        { scale: 0.98 },
        { scale: 1, duration: 0.22, ease: 'power2.out' }
      )
    }
  }, [activeTab])

  // Mobile sidebar slide in
  useEffect(() => {
    if (prefersReducedMotion()) return
    if (isOpen && sidebarRef.current) {
      slideIn(sidebarRef.current, 'left', { distance: 30, duration: 0.25 })
    }
  }, [isOpen])

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: 'repositories',
      label: 'Repositories',
      badge: repoCount > 0 ? repoCount : null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
        </svg>
      ),
    },
    {
      id: 'reviews',
      label: 'Reviews',
      badge: openFindingsCount > 0 ? `${openFindingsCount} open` : null,
      badgeType: openFindingsCount > 0 ? 'warning' : 'neutral',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'History',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ]

  const userInitial = profile?.display_name
    ? profile.display_name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`} ref={sidebarRef}>
        {/* Brand Area */}
        <div className="sidebar-brand-area">
          <Link to="/" className="sidebar-brand-link" title="NodeMind Home">
            <div className="sidebar-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">NodeMind</span>
              <span className="sidebar-brand-sub">Platform</span>
            </div>
          </Link>
          <span className="sidebar-badge">v1.2</span>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">PLATFORM</div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                data-tab={item.id}
                type="button"
                className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onTabChange(item.id)
                  if (onClose) onClose()
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`nav-badge ${item.badgeType || 'neutral'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom Utility Area */}
        <div className="sidebar-footer">
          <div className="sidebar-status-pill">
            <span className="status-dot online pulse" />
            <span className="status-text">PostgreSQL Active</span>
          </div>

          <div className="sidebar-user-block">
            <div className="sidebar-user-avatar">{userInitial}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">
                {profile?.display_name || user?.email?.split('@')[0]}
              </span>
              <span className="sidebar-user-org">
                {profile?.company || 'Personal Org'}
              </span>
            </div>
            <button
              type="button"
              className="sidebar-signout-btn"
              onClick={onSignOut}
              disabled={signingOut}
              title="Sign Out"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
