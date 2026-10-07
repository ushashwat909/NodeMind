export default function TopBar({
  activeTab,
  onOpenMobileSidebar,
  onOpenConnectModal,
  onRefresh,
  loadingData,
  profile,
  user,
  onShowIntro,
}) {
  const tabTitles = {
    overview: 'Overview',
    repositories: 'Connected Repositories',
    reviews: 'Code Reviews & Findings',
    history: 'Review Audit History',
    settings: 'Developer Settings',
  }

  return (
    <header className="dashboard-topbar">
      <div className="topbar-left">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="topbar-mobile-toggle"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Breadcrumb Path */}
        <div className="topbar-breadcrumbs">
          <span className="breadcrumb-root">Dashboard</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{tabTitles[activeTab] || 'Overview'}</span>
        </div>

        {/* Live Kernel Telemetry Pill */}
        <div className="topbar-kernel-pill">
          <span className="kernel-dot" />
          <span className="kernel-text">KERNEL V2.4 ONLINE</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Iconic We Are NodeMind 3D Experience Button */}
        {onShowIntro && (
          <button
            type="button"
            className="topbar-intro-trigger-btn"
            onClick={onShowIntro}
            title="Experience the 3D 'WE ARE NODEMIND' cinematic intro"
          >
            <span className="intro-btn-lightning">⚡</span>
            <span className="intro-btn-text">WE ARE NODEMIND</span>
          </button>
        )}

        {/* Live Refresh Trigger */}
        <button
          type="button"
          className={`topbar-refresh-btn ${loadingData ? 'spinning' : ''}`}
          onClick={onRefresh}
          disabled={loadingData}
          title="Refresh live metrics from PostgreSQL"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span className="refresh-label">{loadingData ? 'Syncing...' : 'Sync'}</span>
        </button>

        {/* Primary Action Button */}
        <button
          type="button"
          className="btn btn-primary topbar-connect-btn"
          onClick={onOpenConnectModal}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Connect Repo</span>
        </button>

        {/* Tenant Chip */}
        <div className="topbar-tenant-chip">
          <span className="tenant-dot" />
          <span className="tenant-text">{profile?.display_name || user?.email?.split('@')[0]}</span>
          <span className="tenant-badge">RLS</span>
        </div>
      </div>
    </header>
  )
}
