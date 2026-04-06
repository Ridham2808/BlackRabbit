import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Wrench, Plus, Search, Calendar, CheckCircle2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { PageHeader, StatusBadge, SeverityDot, Spinner, EmptyState, Modal, Field, StatCard } from '../../components/ui'

const TYPES   = ['ROUTINE','EMERGENCY','CALIBRATION','INSPECTION','OVERHAUL','REPAIR']
const STATUSES = ['SCHEDULED','IN_PROGRESS','COMPLETED','OVERDUE','CANCELLED']

export default function MaintenanceList() {
  const qc = useQueryClient()
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [type, setType]         = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [selected, setSelected] = useState(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', search, status, type],
    queryFn: () => api.get('/maintenance', {
      params: { search: search || undefined, status: status || undefined, type: type || undefined }
    }).then(r => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (body) => api.post('/maintenance', body),
    onSuccess: () => { toast.success('Maintenance scheduled'); qc.invalidateQueries(['maintenance']); setShowAdd(false); reset() },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to schedule'),
  })

  const completeMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/maintenance/${id}/complete`, data),
    onSuccess: () => { toast.success('Maintenance completed'); qc.invalidateQueries(['maintenance']); setSelected(null) },
    onError: () => toast.error('Failed to complete'),
  })

  const records = data?.data || []
  const stats   = data?.stats || {}

  const overdueBg = (rec) => rec.status === 'OVERDUE' ? 'rgba(239,68,68,0.04)' : 'transparent'

  return (
    <div>
      <PageHeader
        title="Maintenance Scheduler"
        sub="Service history, AI-suggested schedules & upcoming maintenance"
        actions={
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Schedule Maintenance
          </button>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Calendar}     label="Scheduled"   value={stats.scheduled}   color="#60a5fa" />
        <StatCard icon={Wrench}       label="In Progress"  value={stats.in_progress}  color="#fbbf24" />
        <StatCard icon={CheckCircle2} label="Completed"   value={stats.completed}   color="#34d399" />
        <StatCard icon={Clock}        label="Overdue"     value={stats.overdue}     color="#ef4444" />
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input className="input-field" placeholder="Search equipment serial, name…" style={{ paddingLeft: 34 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field" style={{ flex: '0 0 160px' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input-field" style={{ flex: '0 0 160px' }} value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'auto' }}>
        {isLoading ? <Spinner /> : records.length === 0 ? (
          <EmptyState icon={Wrench} title="No maintenance records" sub="Schedule maintenance to keep equipment operational" />
        ) : (
          <table className="deas-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Type</th>
                <th>Status</th>
                <th>Scheduled</th>
                <th>Technician</th>
                <th>Condition Before</th>
                <th>Due / Completed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map(rec => (
                <tr key={rec.id} style={{ background: overdueBg(rec) }}>
                  <td>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#111827' }}>{rec.equipment_name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#3b82f6', fontFamily: 'monospace' }}>{rec.equipment_serial}</p>
                    </div>
                  </td>
                  <td><span style={{ fontSize: 12, color: '#6b7280' }}>{rec.type}</span></td>
                  <td><StatusBadge status={rec.status} /></td>
                  <td><span style={{ fontSize: 12, color: '#6b7280' }}>
                    {rec.scheduled_date ? new Date(rec.scheduled_date).toLocaleDateString() : '—'}
                  </span></td>
                  <td><span style={{ fontSize: 12, color: '#6b7280' }}>{rec.technician_name || '—'}</span></td>
                  <td><span style={{ fontSize: 12, color: '#6b7280' }}>{rec.condition_before || '—'}</span></td>
                  <td>
                    <span style={{ fontSize: 12, color: rec.status === 'OVERDUE' ? '#ef4444' : '#94a3b8' }}>
                      {rec.actual_completion_date
                        ? new Date(rec.actual_completion_date).toLocaleDateString()
                        : rec.next_maintenance_recommended
                          ? new Date(rec.next_maintenance_recommended).toLocaleDateString()
                          : '—'}
                    </span>
                  </td>
                  <td>
                    {rec.status === 'IN_PROGRESS' && (
                      <button className="btn-primary" style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => setSelected(rec)}>
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Schedule Maintenance Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title="Schedule Maintenance" width={560}>
        <form onSubmit={handleSubmit(d => addMutation.mutate(d))}>
          <Field label="Equipment Serial Number" error={errors.equipment_serial?.message}>
            <input className="input-field" placeholder="RFL-2024-00142" {...register('equipment_serial', { required: 'Required' })} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Type" error={errors.type?.message}>
              <select className="input-field" {...register('type', { required: 'Required' })}>
                <option value="">Select type…</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Scheduled Date" error={errors.scheduled_date?.message}>
              <input className="input-field" type="date" {...register('scheduled_date', { required: 'Required' })} />
            </Field>
          </div>
          <Field label="Assigned Technician (Service No.)">
            <input className="input-field" placeholder="IND-2024-XXXX" {...register('technician_service_number')} />
          </Field>
          <Field label="Work to be Performed">
            <textarea className="input-field" rows={3} placeholder="Describe the maintenance work…" {...register('work_performed')} />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => { setShowAdd(false); reset() }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Scheduling…' : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Maintenance Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Complete: ${selected?.equipment_name}`} width={500}>
        <form onSubmit={handleSubmit(d => completeMutation.mutate({ id: selected?.id, data: d }))}>
          <Field label="Work Performed" error={errors.work_performed?.message}>
            <textarea className="input-field" rows={3} {...register('work_performed', { required: 'Required' })} />
          </Field>
          <Field label="Condition After" error={errors.condition_after?.message}>
            <select className="input-field" {...register('condition_after', { required: 'Required' })}>
              <option value="">Select…</option>
              {['EXCELLENT','GOOD','FAIR','POOR','DAMAGED'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Is Fit for Duty?">
            <select className="input-field" {...register('is_fit_for_duty')}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </Field>
          <Field label="Next Maintenance Recommended">
            <input className="input-field" type="date" {...register('next_maintenance_recommended')} />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={completeMutation.isPending}>
              {completeMutation.isPending ? 'Saving…' : 'Mark Complete'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
