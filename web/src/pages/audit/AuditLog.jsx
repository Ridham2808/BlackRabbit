import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Search, Download, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import api from '../../services/api'
import { PageHeader, SeverityDot, Spinner, EmptyState } from '../../components/ui'

const ACTIONS = [
  'EQUIPMENT_CHECKOUT','EQUIPMENT_CHECKIN','LOGIN_SUCCESS','LOGIN_FAILED',
  'UNAUTHORIZED_ACCESS_ATTEMPT','BIOMETRIC_SUCCESS','BIOMETRIC_FAILED',
  'ANOMALY_DETECTED','OFFLINE_SYNC_COMPLETED','AUDIT_LOG_EXPORTED',
  'EQUIPMENT_CREATED','EQUIPMENT_UPDATED','EQUIPMENT_DELETED',
  'PERSONNEL_CREATED','PERSONNEL_UPDATED','TRANSFER_APPROVED',
]
const SEVERITIES  = ['INFO','WARNING','CRITICAL','EMERGENCY']
const DEVICE_TYPES= ['WEB','MOBILE','SYSTEM']

export default function AuditLog() {
  const [search, setSearch]       = useState('')
  const [action, setAction]       = useState('')
  const [severity, setSeverity]   = useState('')
  const [device, setDevice]       = useState('')
  const [anomalyOnly, setAnomaly] = useState(false)
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')
  const [page, setPage]           = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['audit', search, action, severity, device, anomalyOnly, dateFrom, dateTo, page],
    queryFn: () => api.get('/audit', {
      params: {
        search: search || undefined,
        action: action || undefined,
        severity: severity || undefined,
        device_type: device || undefined,
        is_anomaly: anomalyOnly || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page, limit: 50,
      }
    }).then(r => r.data),
  })
  const logs  = data?.data?.data || data?.data || []
  const total = data?.data?.pagination?.total || data?.data?.total || data?.total || 0

  const SEV_COLOR = { EMERGENCY: '#ef4444', CRITICAL: '#f97316', WARNING: '#fbbf24', INFO: '#94a3b8' }

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('DEFENCE EQUIPMENT ACCOUNTABILITY SYSTEM', 148, 16, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('CONFIDENTIAL — FOR OFFICIAL USE ONLY', 148, 22, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`Audit Log Export — Generated: ${new Date().toLocaleString()}`, 14, 32)

    const rows = logs.map(l => [
      new Date(l.created_at).toLocaleString(),
      l.action,
      l.performed_by_name || '—',
      l.performed_by_role || '—',
      l.target_entity_type || '—',
      l.device_type || '—',
      l.severity,
      l.ip_address || '—',
      l.is_anomaly ? '⚠ YES' : 'No',
    ])

    doc.autoTable({
      startY: 38,
      head: [['Timestamp','Action','Performed By','Role','Target','Device','Severity','IP','Anomaly']],
      body: rows,
      styles: { fontSize: 6.5, cellPadding: 2 },
      headStyles: { fillColor: [15,27,45], textColor: [139,171,46] },
      alternateRowStyles: { fillColor: [15,27,45] },
    })

    doc.save(`DEAS-Audit-${Date.now()}.pdf`)
    toast.success('PDF exported')
    api.post('/audit/export-log').catch(() => {})
  }

  return (
    <div>
      <PageHeader
        title="Audit Log"
        sub="Tamper-evident record of every system event — insert-only, monthly partitioned"
        actions={
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={exportPDF}>
            <Download size={14} /> Export PDF
          </button>
        }
      />

      {/* Filters */}
      <div className="glass-card" style={{ padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input className="input-field" placeholder="Search user, IP, entity…" style={{ paddingLeft: 32, fontSize: 12 }}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field" style={{ flex: '0 0 200px', fontSize: 12 }} value={action} onChange={e => setAction(e.target.value)}>
            <option value="">All Actions</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g,' ')}</option>)}
          </select>
          <select className="input-field" style={{ flex: '0 0 130px', fontSize: 12 }} value={severity} onChange={e => setSeverity(e.target.value)}>
            <option value="">All Severities</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input-field" style={{ flex: '0 0 120px', fontSize: 12 }} value={device} onChange={e => setDevice(e.target.value)}>
            <option value="">All Devices</option>
            {DEVICE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input className="input-field" type="date" style={{ flex: '0 0 140px', fontSize: 12 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" />
          <input className="input-field" type="date" style={{ flex: '0 0 140px', fontSize: 12 }} value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: anomalyOnly ? '#ef4444' : '#475569', userSelect: 'none' }}>
            <input type="checkbox" checked={anomalyOnly} onChange={e => { setAnomaly(e.target.checked); setPage(1) }} />
            <ShieldAlert size={13} /> Anomalies Only
          </label>
        </div>
        {total > 0 && (
          <p style={{ margin: '10px 0 0', fontSize: 11, color: '#475569' }}>
            Showing {logs.length} of {total.toLocaleString()} entries
          </p>
        )}
      </div>

      {/* Log table */}
      <div className="glass-card" style={{ overflow: 'auto' }}>
        {isLoading ? <Spinner /> : logs.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No log entries" sub="Adjust your filters to find audit records" />
        ) : (
          <table className="data-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Performed By</th>
                <th>Role</th>
                <th>Target</th>
                <th>Device</th>
                <th>Severity</th>
                <th>IP Address</th>
                <th>Anomaly</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{
                  background: log.is_anomaly ? 'rgba(239,68,68,0.05)' : 'transparent',
                  borderLeft: log.is_anomaly ? '2px solid #ef444460' : '2px solid transparent',
                }}>
                  <td style={{ whiteSpace: 'nowrap', color: '#475569', fontSize: 11 }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: SEV_COLOR[log.severity] || '#94a3b8' }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: 12 }}>{log.performed_by_name || '—'}</p>
                      <p style={{ margin: 0, fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{log.performed_by_service_number || ''}</p>
                    </div>
                  </td>
                  <td><span style={{ fontSize: 11, color: '#64748b' }}>{log.performed_by_role || '—'}</span></td>
                  <td>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{log.target_entity_type || '—'}</p>
                      <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>{log.target_entity_name || ''}</p>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                      background: log.device_type === 'MOBILE' ? 'rgba(96,165,250,0.1)' : log.device_type === 'SYSTEM' ? 'rgba(167,139,250,0.1)' : 'rgba(139,171,46,0.1)',
                      color: log.device_type === 'MOBILE' ? '#60a5fa' : log.device_type === 'SYSTEM' ? '#a78bfa' : '#8aab2e',
                    }}>
                      {log.device_type || '—'}
                    </span>
                  </td>
                  <td><SeverityDot severity={log.severity} /></td>
                  <td><span style={{ fontSize: 11, fontFamily: 'monospace', color: '#475569' }}>{log.ip_address || '—'}</span></td>
                  <td>
                    {log.is_anomaly && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ef4444' }}>
                        <ShieldAlert size={12} />
                        {log.anomaly_score ? `${(log.anomaly_score * 100).toFixed(0)}%` : 'Yes'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ color: '#475569', fontSize: 13, padding: '8px 16px' }}>Page {page} / {Math.ceil(total / 50)}</span>
          <button className="btn-secondary" disabled={logs.length < 50} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}
