import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { api } from '@/services/api'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import OverviewView from '@/components/dashboard/OverviewView'
import RepositoriesView from '@/components/dashboard/RepositoriesView'
import ReviewsView from '@/components/dashboard/ReviewsView'
import HistoryView from '@/components/dashboard/HistoryView'
import SettingsView from '@/components/dashboard/SettingsView'
import ConnectRepoModal from '@/components/ConnectRepoModal'
import ReviewProgressModal from '@/components/common/ReviewProgressModal'
import StartReviewModal from '@/components/dashboard/StartReviewModal'
import { gsap, prefersReducedMotion } from '@/animations/gsap'
import './Dashboard.css'

export default function Dashboard() {
  const { user, signOut, githubToken, saveGithubToken, session } = useAuth()
  const navigate = useNavigate()

  // Navigation State
  const [activeTab, setActiveTab] = useState('overview')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [selectedReviewId, setSelectedReviewId] = useState(null)
  const [signingOut, setSigningOut] = useState(false)

  // GitHub Auto-Sync State
  const [isSyncingGithub, setIsSyncingGithub] = useState(false)
  const [githubSyncBanner, setGithubSyncBanner] = useState(null)
  const hasAutoSyncedRef = useRef(false)

  // Real Database Entities State
  const [profile, setProfile] = useState(null)
  const [repositories, setRepositories] = useState([])
  const [recentJobs, setRecentJobs] = useState([])
  const [metrics, setMetrics] = useState({
    totalRepos: 0,
    completedReviews: 0,
    openFindings: 0,
    criticalFindings: 0,
  })
  const [loadingData, setLoadingData] = useState(true)
  const [dataError, setDataError] = useState(null)
  const [triggeringReviewId, setTriggeringReviewId] = useState(null)

  const contentAreaRef = useRef(null)


  // Fetch real data from Supabase PostgreSQL
  const loadDashboardData = useCallback(async () => {
    if (!user) return
    try {
      setLoadingData(true)
      setDataError(null)

      // 1. Fetch user profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      // 2. Fetch connected repositories
      const { data: repos, error: reposErr } = await supabase
        .from('repositories')
        .select('id, name, full_name, provider, html_url, language, default_branch, is_private, last_reviewed_at, created_at, stars_count, forks_count')
        .order('created_at', { ascending: false })

      if (reposErr) throw reposErr

      // 3. Fetch recent review jobs
      const { data: jobs, error: jobsErr } = await supabase
        .from('review_jobs')
        .select(`
          id,
          repository_id,
          branch,
          commit_sha,
          commit_message,
          commit_author,
          status,
          quality_score,
          critical_count,
          high_count,
          medium_count,
          low_count,
          info_count,
          created_at,
          repositories (id, name, full_name, language)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (jobsErr) throw jobsErr

      // 4. Exact Real Metrics Counting from Supabase
      const [
        { count: completedJobsCount },
        { count: openFindingsCount },
        { count: criticalFindingsCount },
      ] = await Promise.all([
        supabase.from('review_jobs').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('review_findings').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('review_findings').select('*', { count: 'exact', head: true }).eq('severity', 'critical').eq('status', 'open'),
      ])

      setProfile(prof || null)
      setRepositories(repos || [])
      setRecentJobs(jobs || [])
      setMetrics({
        totalRepos: repos?.length || 0,
        completedReviews: completedJobsCount || 0,
        openFindings: openFindingsCount || 0,
        criticalFindings: criticalFindingsCount || 0,
      })
    } catch (err) {
      console.error('[Dashboard] Error fetching live metrics:', err)
      setDataError(err.message)
    } finally {
      setLoadingData(false)
    }
  }, [user])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Synchronize repositories directly from GitHub
  const handleSyncGithub = useCallback(async (token = null) => {
    let effectiveToken = token || githubToken || session?.provider_token
    if (!effectiveToken) {
      try {
        effectiveToken = localStorage.getItem('cra_github_token')
      } catch {}
    }

    if (!effectiveToken) {
      return { success: false, reason: 'NO_TOKEN' }
    }

    try {
      setIsSyncingGithub(true)
      setGithubSyncBanner({
        status: 'syncing',
        message: 'Synchronizing repositories from your GitHub account...',
      })

      const res = await api.syncGitHubRepositories(effectiveToken)
      const count = res?.data?.syncedCount || 0

      setGithubSyncBanner({
        status: 'success',
        message: `Successfully synchronized ${count} repositories from GitHub.`,
      })

      if (token && saveGithubToken) {
        saveGithubToken(token)
      }

      await loadDashboardData()

      setTimeout(() => {
        setGithubSyncBanner((prev) => (prev?.status === 'success' ? null : prev))
      }, 5000)

      return { success: true, count }
    } catch (err) {
      console.error('[Dashboard] Error syncing GitHub repositories:', err)
      setGithubSyncBanner({
        status: 'error',
        message: err.message || 'Failed to synchronize repositories from GitHub.',
      })
      setTimeout(() => {
        setGithubSyncBanner((prev) => (prev?.status === 'error' ? null : prev))
      }, 8000)
      return { success: false, error: err.message }
    } finally {
      setIsSyncingGithub(false)
    }
  }, [githubToken, session, saveGithubToken, loadDashboardData])

  // Auto-sync repositories once on initial sign-in if GitHub token is present
  useEffect(() => {
    const token = session?.provider_token || githubToken
    if (token && !hasAutoSyncedRef.current && user) {
      hasAutoSyncedRef.current = true
      handleSyncGithub(token)
    }
  }, [session, githubToken, user, handleSyncGithub])


  // GSAP View Transition Animation on activeTab change with subtle stagger
  useEffect(() => {
    if (prefersReducedMotion() || !contentAreaRef.current) return

    const el = contentAreaRef.current
    const children = el.querySelectorAll('.view-header-row, .overview-metrics-grid, .overview-section-card, .repos-filter-bar, .repositories-list, .history-filter-toolbar, .reviews-two-column-layout, .settings-view')

    if (children.length > 0) {
      gsap.fromTo(
        children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' }
      )
    } else {
      gsap.fromTo(
        el,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.26, ease: 'power2.out' }
      )
    }
  }, [activeTab])

  // Sign out handler
  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    navigate('/login')
  }

  // Repository connection callback
  const handleRepositoryConnected = (newRepo) => {
    setRepositories((prev) => {
      const exists = prev.some((r) => r.id === newRepo.id || r.full_name === newRepo.full_name)
      if (exists) {
        return prev.map((r) => (r.id === newRepo.id || r.full_name === newRepo.full_name ? newRepo : r))
      }
      return [newRepo, ...prev]
    })
    loadDashboardData()
  }

  // Target Repository for Branch Selection & Launch
  const [selectedRepoForReview, setSelectedRepoForReview] = useState(null)

  const [reviewProgressState, setReviewProgressState] = useState({
    isOpen: false,
    job: null,
    repo: null,
    progress: 0,
    error: null,
  })

  // Open modal to configure target branch and launch review
  const handleOpenReviewModal = (repo) => {
    if (!repo) return
    setSelectedRepoForReview(repo)
  }

  // Trigger autonomous AST review pipeline on a repository & branch
  const handleExecuteReview = async (repo, branch) => {
    if (!repo) return
    const targetBranch = branch || repo.default_branch || 'main'
    setTriggeringReviewId(repo.id)
    setReviewProgressState({
      isOpen: true,
      job: null,
      repo: { ...repo, default_branch: targetBranch },
      progress: 15,
      error: null,
    })

    // Advance smoothly through the real pipeline stages while server analyzes
    const timer = setInterval(() => {
      setReviewProgressState((prev) => {
        if (!prev.isOpen || prev.progress >= 92 || prev.error) return prev
        const next = prev.progress + 11
        return { ...prev, progress: Math.min(92, next) }
      })
    }, 250)

    try {
      const res = await api.createReview({
        repositoryId: repo.id,
        branch: targetBranch,
        triggerType: 'manual',
      })
      clearInterval(timer)
      setReviewProgressState((prev) => ({
        ...prev,
        job: res?.data?.job || res?.data || null,
        progress: 100,
        error: null,
      }))
      await loadDashboardData()
    } catch (err) {
      clearInterval(timer)
      console.error('[Dashboard] Review trigger failed:', err)
      setReviewProgressState((prev) => ({
        ...prev,
        progress: 100,
        error: err.message || 'Review pipeline encountered an error. Check repository permissions and branch.',
      }))
    } finally {
      setTriggeringReviewId(null)
    }
  }

  return (
    <div className="dashboard-app-layout">
      {/* Compact Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        repoCount={repositories.length}
        openFindingsCount={metrics.openFindings}
        user={user}
        profile={profile}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />

      {/* Main Workspace Column */}
      <div className="dashboard-workspace">
        {/* Top Utility Area */}
        <TopBar
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenConnectModal={() => setIsConnectModalOpen(true)}
          onRefresh={loadDashboardData}
          loadingData={loadingData}
          profile={profile}
          user={user}
        />

        {/* Live GitHub Synchronization Banner */}
        {githubSyncBanner && (
          <div className={`dashboard-sync-banner dev-card ${githubSyncBanner.status}`}>
            <div className="banner-left">
              {githubSyncBanner.status === 'syncing' ? (
                <span className="btn-spinner" style={{ width: 16, height: 16, display: 'inline-block' }} />
              ) : githubSyncBanner.status === 'success' ? (
                <span className="banner-alert-icon">✓</span>
              ) : (
                <span className="banner-alert-icon">⚠️</span>
              )}
              <span className="banner-message">{githubSyncBanner.message}</span>
            </div>
            {githubSyncBanner.status !== 'syncing' && (
              <button
                type="button"
                className="banner-dismiss-btn"
                onClick={() => setGithubSyncBanner(null)}
                aria-label="Dismiss banner"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Global Error & Recovery Banner */}
        {dataError && (
          <div className="dashboard-error-banner dev-card">
            <div className="banner-left">
              <span className="banner-alert-icon">⚠️</span>
              <div className="banner-text-wrap">
                <span className="banner-title">Supabase Data Synchronization Notice</span>
                <span className="banner-message">{dataError}</span>
              </div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadDashboardData}>
              Retry Sync ↻
            </button>
          </div>
        )}

        {/* Main Content Workspace View */}
        <main className="dashboard-content-area" ref={contentAreaRef}>
          {activeTab === 'overview' && (
            <OverviewView
              metrics={metrics}
              recentJobs={recentJobs}
              repositories={repositories}
              loadingData={loadingData}
              dataError={dataError}
              onRetrySync={loadDashboardData}
              onOpenConnectModal={() => setIsConnectModalOpen(true)}
              onTriggerReview={handleOpenReviewModal}
              triggeringReviewId={triggeringReviewId}
              onSelectReview={(id) => setSelectedReviewId(id)}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'repositories' && (
            <RepositoriesView
              repositories={repositories}
              loadingData={loadingData}
              dataError={dataError}
              onRetrySync={loadDashboardData}
              onOpenConnectModal={() => setIsConnectModalOpen(true)}
              onTriggerReview={handleOpenReviewModal}
              triggeringReviewId={triggeringReviewId}
              onSyncGithub={handleSyncGithub}
              isSyncingGithub={isSyncingGithub}
              hasGithubToken={!!(githubToken || session?.provider_token)}
            />
          )}


          {activeTab === 'reviews' && (
            <ReviewsView
              reviewJobs={recentJobs}
              repositories={repositories}
              selectedReviewId={selectedReviewId}
              onSelectReviewId={setSelectedReviewId}
              onOpenConnectModal={() => setIsConnectModalOpen(true)}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              repositories={repositories}
              onSelectReview={(id) => setSelectedReviewId(id)}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              user={user}
              profile={profile}
              onSignOut={handleSignOut}
              signingOut={signingOut}
            />
          )}
        </main>
      </div>

      {/* Connect Repository Flow Modal */}
      {isConnectModalOpen && (
        <ConnectRepoModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          onRepositoryConnected={handleRepositoryConnected}
        />
      )}

      {/* Branch Selection & Review Trigger Modal */}
      {selectedRepoForReview && (
        <StartReviewModal
          isOpen={Boolean(selectedRepoForReview)}
          onClose={() => setSelectedRepoForReview(null)}
          repo={selectedRepoForReview}
          onStartReview={handleExecuteReview}
        />
      )}

      {/* Intelligent Review Processing Progress Experience */}
      {reviewProgressState.isOpen && (
        <ReviewProgressModal
          isOpen={reviewProgressState.isOpen}
          onClose={() => setReviewProgressState((prev) => ({ ...prev, isOpen: false }))}
          job={reviewProgressState.job}
          repo={reviewProgressState.repo}
          progress={reviewProgressState.progress}
          error={reviewProgressState.error}
          onRetry={() => handleExecuteReview(reviewProgressState.repo, reviewProgressState.repo?.default_branch)}
        />
      )}
    </div>
  )
}
