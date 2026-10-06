export default function ToggleSwitch({
  checked = false,
  onChange,
  label,
  description,
  id,
  disabled = false,
}) {
  const switchId = id || `toggle-${label ? label.toLowerCase().replace(/\s+/g, '-') : Math.random().toString(36).slice(2, 7)}`

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked)
    }
  }

  const handleKeyDown = (e) => {
    if (disabled) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <div
      className={`toggle-switch-wrapper ${disabled ? 'disabled' : ''}`}
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={label}
    >
      <div className="toggle-text-block">
        {label && <div className="toggle-switch-label">{label}</div>}
        {description && <div className="toggle-switch-desc">{description}</div>}
      </div>

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`switch-control ${checked ? 'is-checked' : ''}`}
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation()
          handleToggle()
        }}
      >
        <span className="switch-control-thumb" />
      </button>
    </div>
  )
}
