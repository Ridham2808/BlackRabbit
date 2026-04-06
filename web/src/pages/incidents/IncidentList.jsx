import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { AlertOctagon, Plus, Search, FileWarning, ShieldAlert, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { PageHeader, StatusBadge, SeverityDot, Spinner, EmptyState, Modal, Field, StatCard } from '../../components/ui'

const TYPES     = ['DAMAGED','LOST','STOLEN','DESTROYED','FOUND','TAMPERED']
const SEVERITIES= ['MINOR','MODERATE','SEVERE','CRITICAL']
const STATUSES  = ['OPEN','UNDER_INVESTIGATION','RESOLVED','CLOSED','ESCALATED']

export default function IncidentList() {
  const qc = useQueryClient()
  const [search, setSearch]     = useState('')
  const [severity, setSeverity] = useState('')
  const [type, setType]         = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [detail, setDetail]     = useState(null)
  const [showResolve, setShowResolve] = useState(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const { register: regRes, handleSubmit: handRes, reset: resRes } = useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', search, severity, type],
    queryFn: () => api.get('/incidents', {
      params: { search: search || undefined, severity: severity || undefined, type: type || undefined }
    }).then(r => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (body) => api.post('/incidents', body),
    onSuccess: () => {
      toast.success('Incident report filed')
      qc.invalidateQueries(['incidents'])
      setShowAdd(false)
      reset()
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to file report'),
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution_notes, outcome }) => api.patch(`/incidents/${id}/close`, { resolution_notes, outcome }),
    onSuccess: () => { 
      toast.success('Incident resolved and closed')
      qc.invalidateQueries(['incidents'])
      setShowResolve(null)
      resRes()
    },
    onError: () => toast.error('Failed to resolve incident'),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/incidents/${id}`, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['incidents']) },
    onError: () => toast.error('Failed to update status'),
  })

  const incidents = data?.data || []
  const stats     = data?.stats || {}

  const SEV_COLOR = { CRITICAL: '#ef4444', SEVERE: '#f97316', MODERATE: '#fbbf24', MINOR: '#60a5fa' }

  return (
    <div>
      <PageHeader
        title="Incident Reports"
        sub="Damage, loss, theft and anomaly reports — auto-numbered INC-YYYY-XXXX"
        actions={
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowAdd(true)}>
            <Plus size={15} /> File Report
          </button>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={AlertOctagon} label="Open"          value={stats.open}          color="#ef4444" />
        <StatCard icon={ShieldAlert}  label="Investigating" value={stats.investigating}  color="#fbbf24" />
        <StatCard icon={FileWarning}  label="Resolved"      value={stats.resolved}       color="#34d399" />
        <StatCard icon={AlertOctagon} label="Critical"      value={stats.critical}       color="#f97316" />
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input className="input-field" placeholder="Search INC number, equipment…" style={{ paddingLeft: 34 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field" style={{ flex: '0 0 150px' }} value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="">All Severities</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input-field" style={{ flex: '0 0 150px' }} value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'auto' }}>
        {isLoading ? <Spinner /> : incidents.length === 0 ? (
          <EmptyState icon={FileWarning} title="No incidents found" sub="All clear — no reported incidents" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>INC Number</th>
                <th>Equipment</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reported By</th>
                <th>Date</th>
                <th>Est. Loss</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map(inc => (
                <tr key={inc.id} style={{ borderLeft: `3px solid ${SEV_COLOR[inc.severity] || 'transparent'}` }}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#3b82f6', fontWeight: 700 }}>
                      {inc.incident_number}
                    </span>
                  </td>
                  <td>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#111827' }}>{inc.equipment_name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{inc.equipment_serial}</p>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, background: '#f8fafc', color: '#6b7280', border: '1px solid #e2e8f0' }}>
                      {inc.type}
                    </span>
                  </td>
                  <td><SeverityDot severity={inc.severity} /></td>
                  <td><StatusBadge status={inc.status} /></td>
                  <td><span style={{ fontSize: 12, color: '#6b7280' }}>{inc.reporter_name || '—'}</span></td>
                  <td><span style={{ fontSize: 12, color: '#6b7280' }}>{inc.created_at ? new Date(inc.created_at).toLocaleDateString() : '—'}</span></td>
                  <td>
                    <span style={{ fontSize: 12, color: inc.estimated_value_loss ? '#fbbf24' : '#475569' }}>
                      {inc.estimated_value_loss ? `₹${Number(inc.estimated_value_loss).toLocaleString()}` : '—'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', color: '#1d4ed8' }}
                        onClick={() => setDetail(inc)}
                      >
                        <Eye size={13} />
                      </button>
                      {inc.status === 'OPEN' && (
                        <button
                          style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', color: '#b45309', fontSize: 11, fontFamily: 'inherit', fontWeight: 600 }}
                          onClick={() => updateStatus.mutate({ id: inc.id, status: 'UNDER_INVESTIGATION' })}
                        >
                          Investigate
                        </button>
                      )}
                      {inc.status === 'UNDER_INVESTIGATION' && (
                        <button
                          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', color: '#15803d', fontSize: 11, fontFamily: 'inherit', fontWeight: 600 }}
                          onClick={() => setShowResolve(inc)}
                        >
                          Resolve & Close
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* File Report Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title="File Incident Report" width={600}>
        <form onSubmit={handleSubmit(d => {
          // Transform form data to match backend Joi schema
          const payload = {
            equipment_serials: [d.equipment_serial.trim()],
            type:              d.type,
            severity:          d.severity,
            description:       d.description,
            last_known_location_description: d.last_known_location_description || undefined,
            estimated_value_loss: d.estimated_value_loss ? Number(d.estimated_value_loss) : undefined,
            police_report_number: d.police_report_number || undefined,
            witness_personnel_serials: d.witnesses
              ? d.witnesses.split(',').map(s => s.trim()).filter(Boolean)
              : undefined,
          }
          addMutation.mutate(payload)
        })}>
          <Field label="Equipment Serial Number" error={errors.equipment_serial?.message}>
            <input className="input-field" placeholder="RFL-2024-00142" {...register('equipment_serial', { required: 'Required' })} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Incident Type" error={errors.type?.message}>
              <select className="input-field" {...register('type', { required: 'Required' })}>
                <option value="">Select type…</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Severity" error={errors.severity?.message}>
              <select className="input-field" {...register('severity', { required: 'Required' })}>
                <option value="">Select severity…</option>
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description" error={errors.description?.message}>
            <textarea className="input-field" rows={3}
              placeholder="Describe the incident in detail (min 10 characters)…"
              style={{ resize: 'vertical' }}
              {...register('description', { required: 'Required', minLength: { value: 10, message: 'Min 10 characters' } })} />
          </Field>
          <Field label="Last Known Location">
            <input className="input-field" placeholder="Grid ref or location description" {...register('last_known_location_description')} />
          </Field>
          <Field label="Estimated Value Loss (₹)">
            <input className="input-field" type="number" min={0} placeholder="0" {...register('estimated_value_loss')} />
          </Field>
          <Field label="Police Report Number">
            <input className="input-field" placeholder="FIR-XXX (if applicable)" {...register('police_report_number')} />
          </Field>
          <Field label="Witnesses (Service Numbers, comma separated)">
            <input className="input-field" placeholder="SLD-051, SLD-063" {...register('witnesses')} />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => { setShowAdd(false); reset() }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Filing…' : 'File Report'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Resolve Incident Modal */}
      <Modal open={!!showResolve} onClose={() => setShowResolve(null)} title="Resolve Incident" width={500}>
        <form onSubmit={handRes(d => resolveMutation.mutate({ id: showResolve.id, ...d }))}>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Select the final outcome for <strong>{showResolve?.incident_number}</strong>. This will automatically update the equipment status.
          </p>
          <Field label="Select Outcome">
            <select className="input-field" {...regRes('outcome', { required: true })}>
              <option value="">Select outcome…</option>
              <option value="FOUND">ASSET FOUND (Restore to Available)</option>
              <option value="PERMANENTLY_LOST">PERMANENTLY LOST (Decommission)</option>
              <option value="DAMAGED">DAMAGED (Send to Maintenance)</option>
              <option value="STOLEN">STOLEN (Flag for HQ Escalation)</option>
            </select>
          </Field>
          <Field label="Resolution Notes">
            <textarea className="input-field" rows={3} placeholder="Final remarks on investigation..." {...regRes('resolution_notes', { required: true })} />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowResolve(null)}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ background: '#10b981' }} disabled={resolveMutation.isPending}>
              {resolveMutation.isPending ? 'Resolving…' : 'Confirm Resolution ✅'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.incident_number || 'Incident Detail'} width={560}>
        {detail && (
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                ['Equipment', detail.equipment_name],
                ['Serial', detail.equipment_serial],
                ['Type', detail.type],
                ['Severity', detail.severity],
                ['Status', detail.status],
                ['Reporter', detail.reporter_name],
                ['Location', detail.last_known_location_description || '—'],
                ['Est. Loss', detail.estimated_value_loss ? `₹${Number(detail.estimated_value_loss).toLocaleString()}` : '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p style={{ margin: 0, fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
                  <p style={{ margin: '2px 0 0', color: '#111827', fontWeight: 600 }}>{val}</p>
                </div>
              ))}
            </div>
            {detail.description && (
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 6px', fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Description</p>
                <p style={{ margin: 0, color: '#374151' }}>{detail.description}</p>
              </div>
            )}
            {detail.investigation_notes && (
              <div style={{ background: '#fffbeb', borderRadius: 8, padding: 14, marginTop: 10, border: '1px solid #fde68a' }}>
                <p style={{ margin: '0 0 6px', fontSize: 10, color: '#b45309', textTransform: 'uppercase', fontWeight: 600 }}>Investigation Notes</p>
                <p style={{ margin: 0, color: '#374151' }}>{detail.investigation_notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
