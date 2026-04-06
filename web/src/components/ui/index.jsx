// ── Reusable stat card ───────────────────────────────────────
export function StatCard({ icon: Icon, label, value, sub, color = '#3b82f6', onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid #e8edf3',
        borderRadius: 16,
        padding: '20px 22px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {Icon && <Icon size={20} color={color} />}
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</p>
        <p style={{ margin: '0 0 2px', fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.5px' }}>{value ?? '—'}</p>
        {sub && <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>{sub}</p>}
      </div>
    </div>
  )
}

// ── Status Badge ─────────────────────────────────────────────
export function StatusBadge({ status }) {
  const cls = {
    OPERATIONAL:       'badge-operational',
    CHECKED_OUT:       'badge-checked-out',
    UNDER_MAINTENANCE: 'badge-maintenance',
    LOST:              'badge-lost',
    MISSING:           'badge-missing',
    FLAGGED:           'badge-flagged',
    IN_TRANSIT:        'badge-in-transit',
    DECOMMISSIONED:    'badge-decommissioned',
    ACTIVE:            'badge-checked-out',
    RETURNED:          'badge-operational',
    OVERDUE:           'badge-lost',
    ESCALATED:         'badge-flagged',
    OPEN:              'badge-flagged',
    ACKNOWLEDGED:      'badge-in-transit',
    RESOLVED:          'badge-operational',
    DISMISSED:         'badge-decommissioned',
    COMPLETED:         'badge-operational',
    SCHEDULED:         'badge-checked-out',
    IN_PROGRESS:       'badge-in-transit',
    CANCELLED:         'badge-decommissioned',
  }[status] || 'badge-decommissioned'

  return (
    <span className={cls} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status?.replace(/_/g,' ')}
    </span>
  )
}

// ── Severity Badge ────────────────────────────────────────────
export function SeverityDot({ severity }) {
  const colors = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#fbbf24', LOW: '#60a5fa' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: colors[severity] || '#9ca3af' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[severity] || '#9ca3af', flexShrink: 0 }} />
      {severity}
    </span>
  )
}

// ── Page header ───────────────────────────────────────────────
export function PageHeader({ title, sub, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>{title}</h2>
        {sub && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>{sub}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10 }}>{actions}</div>}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      {Icon && <Icon size={40} style={{ marginBottom: 16, opacity: 0.3, color: '#9ca3af' }} />}
      <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#374151' }}>{title}</p>
      {sub && <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>{sub}</p>}
    </div>
  )
}

// ── Loading spinner ───────────────────────────────────────────
export function Spinner({ size = 24 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: size, height: size,
        border: '2.5px solid #e2e8f0',
        borderTop: '2.5px solid #111827',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Modal wrapper ─────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 540 }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div
        style={{
          width, maxHeight: '90vh', overflow: 'auto', padding: 28,
          background: '#fff', borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
          animation: 'count-up 0.25s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>{title}</h3>
          <button onClick={onClose} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, color: '#9ca3af', cursor: 'pointer', fontSize: 18, lineHeight: 1, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Form field ────────────────────────────────────────────────
export function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      {children}
      {error && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#dc2626' }}>{error}</p>}
    </div>
  )
}
