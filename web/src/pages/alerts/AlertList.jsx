import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, CheckCircle2, AlertTriangle, ShieldAlert, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { getSocket } from '../../services/socket'
import { useAlertStore } from '../../store'
import { PageHeader, SeverityDot, StatusBadge, Spinner, EmptyState, StatCard } from '../../components/ui'

const SEVERITIES = ['LOW','MEDIUM','HIGH','CRITICAL']
const TYPES = [
  'OVERDUE_RETURN','MAINTENANCE_DUE','LOW_STOCK','UNAUTHORIZED_ACCESS','FAILED_LOGIN',
  'EQUIPMENT_LOST','EQUIPMENT_MISSING','ANOMALY_DETECTED','GEOFENCE_BREACH',
  'TRANSFER_PENDING_APPROVAL','ESCALATION_REQUIRED','EQUIPMENT_DAMAGED','BATTERY_LOW_TRACKER',
]

const TYPE_ICON = {
  ANOMALY_DETECTED:          Zap,
  UNAUTHORIZED_ACCESS:       ShieldAlert,
  GEOFENCE_BREACH:           ShieldAlert,
  ESCALATION_REQUIRED:       AlertTriangle,
  EQUIPMENT_LOST:            AlertTriangle,
  EQUIPMENT_MISSING:         AlertTriangle,
  OVERDUE_RETURN:            Bell,
  MAINTENANCE_DUE:           Bell,
}

const SEV_GLOW = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#fbbf24', LOW: '#60a5fa' }

function AlertCard({ alert, onAck, onResolve }) {
  const Icon = TYPE_ICON[alert.type] || Bell
  const glow = SEV_GLOW[alert.severity] || '#94a3b8'
  const isOpen = alert.status === 'OPEN'
  const isAck  = alert.status === 'ACKNOWLEDGED'

  return (
    <div style={{
      background: '#fff',
      border: `1px solid #e8edf3`,
      borderLeft: `3px solid ${glow}`,
      borderRadius: 12,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      transition: 'all 0.2s',
      opacity: alert.status === 'RESOLVED' || alert.status === 'DISMISSED' ? 0.6 : 1,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 9, flexShrink: 0,
        background: `${glow}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={17} color={glow} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <SeverityDot severity={alert.severity} />
          <span style={{ fontSize: 11, color: '#9ca3af', background: '#f8fafc', padding: '1px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
            {alert.type?.replace(/_/g,' ')}
          </span>
          <StatusBadge status={alert.status} />
        </div>
        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: '#111827' }}>{alert.title}</p>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{alert.message}</p>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#9ca3af' }}>
          {alert.equipment_name && <span>⚙ {alert.equipment_name}</span>}
          {alert.assigned_to_name && <span>👤 {alert.assigned_to_name}</span>}
          <span>🕐 {new Date(alert.created_at).toLocaleString()}</span>
          {alert.escalation_level > 0 && (
            <span style={{ color: '#f97316' }}>⬆ Escalation L{alert.escalation_level}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        {isOpen && (
          <button
            style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#b45309', fontSize: 12, whiteSpace: 'nowrap', fontFamily: 'inherit', fontWeight: 600 }}
            onClick={() => onAck(alert.id)}
          >
            Acknowledge
          </button>
        )}
        {(isOpen || isAck) && (
          <button
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#15803d', fontSize: 12, whiteSpace: 'nowrap', fontFamily: 'inherit', fontWeight: 600 }}
            onClick={() => onResolve(alert.id)}
          >
            Resolve
          </button>
        )}
      </div>
    </div>
  )
}

export default function AlertList() {
  const qc = useQueryClient()
  const { setUnreadCount } = useAlertStore()
  const [severity, setSeverity] = useState('')
  const [type, setType]         = useState('')
  const [status, setStatus]     = useState('OPEN')
  const [page, setPage]         = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', severity, type, status, page],
    queryFn: () => api.get('/alerts', {
      params: { severity: severity || undefined, type: type || undefined, status: status || undefined, page, limit: 20 }
    }).then(r => r.data),
    refetchInterval: 15_000,
  })

  // Live incoming alert via WebSocket
  useEffect(() => {
    const handler = (alert) => {
      toast.custom(() => (
        <div style={{
          background: '#0f1b2d', border: `1px solid ${SEV_GLOW[alert.severity] || '#475569'}50`,
          borderRadius: 10, padding: '12px 16px', maxWidth: 340,
        }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#111827', fontSize: 13 }}>{alert.title}</p>
          <p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>{alert.message}</p>
        </div>
      ), { duration: 5000 })
      qc.invalidateQueries(['alerts'])
      qc.invalidateQueries(['dashboard'])
    }
    const s = getSocket()
    s?.on('alert:new', handler)
    return () => s?.off('alert:new', handler)
  }, [qc])

  const ackMutation = useMutation({
    mutationFn: (id) => api.patch(`/alerts/${id}/acknowledge`),
    onSuccess: () => { qc.invalidateQueries(['alerts']); qc.invalidateQueries(['dashboard']) },
    onError: () => toast.error('Failed to acknowledge'),
  })

  const resolveMutation = useMutation({
    mutationFn: (id) => api.patch(`/alerts/${id}/resolve`),
    onSuccess: () => { qc.invalidateQueries(['alerts']); qc.invalidateQueries(['dashboard']); toast.success('Alert resolved') },
    onError: () => toast.error('Failed to resolve'),
  })

  const alerts = data?.data?.data || data?.data || []
  const stats  = data?.data?.stats || data?.stats || {}
  const total  = data?.data?.total || data?.total || 0

  // Sync unread count
  useEffect(() => { setUnreadCount(stats.open || 0) }, [stats.open, setUnreadCount])

  return (
    <div>
      <PageHeader
        title="Alerts & Escalations"
        sub="System-generated alerts, anomaly flags, and escalation tree"
        actions={
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            onClick={() => api.post('/alerts/acknowledge-all').then(() => qc.invalidateQueries(['alerts']))}>
            <BellOff size={14} /> Acknowledge All
          </button>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Bell}         label="Open"     value={stats.open}     color="#ef4444" />
        <StatCard icon={Bell}         label="Acknowledged" value={stats.acknowledged} color="#fbbf24" />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} color="#34d399" />
        <StatCard icon={Zap}          label="Anomalies" value={stats.anomalies} color="#a78bfa" />
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#f8fafc', borderRadius: 8, padding: 4 }}>
          {['OPEN','ACKNOWLEDGED','RESOLVED','DISMISSED'].map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1) }}
              style={{
                background: status === s ? '#111827' : 'transparent',
                border: '1px solid transparent',
                borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
                color: status === s ? '#fff' : '#9ca3af', fontSize: 12, fontWeight: 600,
                fontFamily: 'inherit',
              }}>
              {s}
            </button>
          ))}
        </div>
        <select className="input-field" style={{ flex: '0 0 140px' }} value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="">All Severities</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input-field" style={{ flex: '0 0 220px' }} value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      {/* Alert cards */}
      {isLoading ? <Spinner /> : alerts.length === 0 ? (
        <EmptyState icon={Bell} title="No alerts" sub={`No ${status.toLowerCase()} alerts at this time`} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAck={(id) => ackMutation.mutate(id)}
              onResolve={(id) => resolveMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ color: '#475569', fontSize: 13, padding: '8px 16px' }}>Page {page}</span>
          <button className="btn-secondary" disabled={alerts.length < 20} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}
