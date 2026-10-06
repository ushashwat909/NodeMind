import { useRef } from 'react'

export default function FindingsToolbar({
  searchQuery = '',
  onSearchChange,
  severityFilter = 'all',
  onSeverityChange,
  categoryFilter = 'all',
  onCategoryChange,
  fileFilter = 'all',
  onFileChange,
  sortBy = 'severity',
  onSortChange,
  availableFiles = [],
  availableCategories = [],
  severityCounts = {},
  totalCount = 0,
  filteredCount = 0,
  onResetFilters,
}) {
  const searchInputRef = useRef(null)

  const severities = [
    { id: 'all', label: 'All', count: totalCount },
    { id: 'critical', label: 'Critical', count: severityCounts.critical || 0 },
    { id: 'high', label: 'High', count: severityCounts.high || 0 },
    { id: 'medium', label: 'Medium', count: severityCounts.medium || 0 },
    { id: 'low', label: 'Low', count: severityCounts.low || 0 },
  ]

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    severityFilter !== 'all' ||
    categoryFilter !== 'all' ||
    fileFilter !== 'all'

  return (
    <div className="findings-toolbar">
      {/* Search Input Bar */}
      <div className="toolbar-search-row">
        <div className="search-input-box">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            className="search-field"
            placeholder="Search findings, rules, CWE, or code... (/ to focus)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              ×
            </button>
          )}
          <span className="search-shortcut-hint">/</span>
        </div>

        {/* Sort Dropdown */}
        <div className="toolbar-select-group">
          <label className="select-label" htmlFor="sort-select">Sort:</label>
          <select
            id="sort-select"
            className="dev-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="severity">Severity (High → Low)</option>
            <option value="line">Line Number (Ascending)</option>
            <option value="file">File Path (A → Z)</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>

      {/* Filter Row: Severity Chips */}
      <div className="toolbar-filter-row">
        <div className="severity-chips-group">
          {severities.map((sev) => {
            const isActive = severityFilter === sev.id
            return (
              <button
                key={sev.id}
                type="button"
                className={`severity-chip ${sev.id} ${isActive ? 'active' : ''}`}
                onClick={() => onSeverityChange(sev.id)}
              >
                <span className="chip-label">{sev.label}</span>
                <span className="chip-count">{sev.count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Secondary Dropdown Filters: Category & File */}
      <div className="toolbar-secondary-row">
        {/* Category Filter */}
        <div className="filter-select-wrap">
          <span className="filter-prefix">Category:</span>
          <select
            className="dev-select compact"
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="all">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* File Filter */}
        <div className="filter-select-wrap">
          <span className="filter-prefix">File:</span>
          <select
            className="dev-select compact"
            value={fileFilter}
            onChange={(e) => onFileChange(e.target.value)}
          >
            <option value="all">All Files ({availableFiles.length})</option>
            {availableFiles.map((f) => (
              <option key={f} value={f}>
                {f.split('/').pop()} ({f})
              </option>
            ))}
          </select>
        </div>

        {/* Matches Indicator & Reset */}
        <div className="filter-status-info">
          <span className="match-counter">
            Showing <strong>{filteredCount}</strong> of {totalCount}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn-reset-filters"
              onClick={onResetFilters}
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
