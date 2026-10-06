import './Skeletons.css'

/**
 * Universal Shimmer Skeleton Row
 */
export function SkeletonRow({ width = '100%', height = '16px', className = '' }) {
  return (
    <div
      className={`skeleton-shimmer-box ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

/**
 * Skeleton Table for Dev Tables (Overview, History)
 */
export function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="skeleton-table-wrapper" aria-hidden="true">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="skeleton-header-cell"
            style={{ width: i === 0 ? '30%' : i === 1 ? '15%' : '12%' }}
          >
            <div className="skeleton-shimmer-box header" />
          </div>
        ))}
      </div>
      <div className="skeleton-table-body">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="skeleton-table-row">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="skeleton-cell"
                style={{ width: cIdx === 0 ? '30%' : cIdx === 1 ? '15%' : '12%' }}
              >
                <div
                  className="skeleton-shimmer-box"
                  style={{
                    width: cIdx === 0 ? '75%' : cIdx === columns - 1 ? '55px' : '65%',
                    height: cIdx === columns - 1 ? '24px' : '15px',
                    borderRadius: cIdx === columns - 1 ? '4px' : '4px',
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton for Connected Repositories List
 */
export function RepoSkeletonList({ count = 3 }) {
  return (
    <div className="skeleton-repo-list" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-repo-card dev-card">
          <div className="skeleton-repo-top">
            <div className="skeleton-shimmer-box" style={{ width: '220px', height: '20px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '60px', height: '18px', borderRadius: '10px' }} />
          </div>
          <div className="skeleton-repo-meta">
            <div className="skeleton-shimmer-box" style={{ width: '85px', height: '14px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '100px', height: '14px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '70px', height: '14px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '130px', height: '14px' }} />
          </div>
          <div className="skeleton-repo-actions">
            <div className="skeleton-shimmer-box" style={{ width: '75px', height: '28px', borderRadius: '5px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '100px', height: '28px', borderRadius: '5px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for Metric Cards (Overview, Review Results Summary)
 */
export function MetricsSkeleton({ count = 4 }) {
  return (
    <div className="skeleton-metrics-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-metric-card dev-card">
          <div className="skeleton-metric-top">
            <div className="skeleton-shimmer-box" style={{ width: '90px', height: '13px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
          </div>
          <div className="skeleton-shimmer-box" style={{ width: '50px', height: '32px', margin: '0.4rem 0' }} />
          <div className="skeleton-shimmer-box" style={{ width: '120px', height: '12px' }} />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for Findings List Cards
 */
export function FindingSkeletonList({ count = 4 }) {
  return (
    <div className="skeleton-findings-list" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-finding-card dev-card">
          <div className="skeleton-card-tags">
            <div className="skeleton-shimmer-box" style={{ width: '65px', height: '18px', borderRadius: '3px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '55px', height: '18px', borderRadius: '3px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '60px', height: '18px', borderRadius: '3px' }} />
          </div>
          <div className="skeleton-shimmer-box" style={{ width: '85%', height: '18px', marginTop: '0.35rem' }} />
          <div className="skeleton-shimmer-box" style={{ width: '50%', height: '14px', marginTop: '0.2rem' }} />
          <div className="skeleton-shimmer-box" style={{ width: '95%', height: '13px', marginTop: '0.4rem' }} />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for Review Results Page (Header, Metrics, Split Workspace: Findings List + Code Viewer)
 */
export function ReviewResultsSkeleton() {
  return (
    <div className="skeleton-review-results" aria-hidden="true">
      {/* Header Skeleton */}
      <div className="skeleton-results-header dev-card">
        <div className="skeleton-results-header-left">
          <div className="skeleton-shimmer-box" style={{ width: '160px', height: '14px', marginBottom: '8px' }} />
          <div className="skeleton-shimmer-box" style={{ width: '320px', height: '28px', marginBottom: '12px' }} />
          <div className="skeleton-header-badges">
            <div className="skeleton-shimmer-box" style={{ width: '80px', height: '22px', borderRadius: '4px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '95px', height: '22px', borderRadius: '4px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '110px', height: '22px', borderRadius: '4px' }} />
          </div>
        </div>
        <div className="skeleton-results-header-actions">
          <div className="skeleton-shimmer-box" style={{ width: '120px', height: '36px', borderRadius: '6px' }} />
          <div className="skeleton-shimmer-box" style={{ width: '120px', height: '36px', borderRadius: '6px' }} />
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="skeleton-metrics-grid results-metrics-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-metric-card dev-card">
            <div className="skeleton-shimmer-box" style={{ width: '60%', height: '12px', marginBottom: '8px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '45px', height: '28px', marginBottom: '6px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '80%', height: '10px' }} />
          </div>
        ))}
      </div>

      {/* Split Workspace Skeleton */}
      <div className="skeleton-results-workspace">
        {/* Left Column: Findings */}
        <div className="skeleton-workspace-left">
          <div className="skeleton-toolbar dev-card">
            <div className="skeleton-shimmer-box" style={{ width: '100%', height: '34px', marginBottom: '10px' }} />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer-box" style={{ width: '54px', height: '22px', borderRadius: '12px' }} />
              ))}
            </div>
          </div>
          <FindingSkeletonList count={4} />
        </div>

        {/* Right Column: Code Viewer */}
        <div className="skeleton-workspace-right dev-card">
          <div className="skeleton-code-header">
            <div className="skeleton-shimmer-box" style={{ width: '240px', height: '16px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '90px', height: '24px', borderRadius: '4px' }} />
          </div>
          <div className="skeleton-code-body">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="skeleton-code-line">
                <div className="skeleton-shimmer-box line-num" style={{ width: '28px', height: '14px' }} />
                <div
                  className="skeleton-shimmer-box line-code"
                  style={{
                    width: `${25 + ((i * 37) % 65)}%`,
                    height: '14px',
                    marginLeft: `${(i % 3) * 16}px`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
