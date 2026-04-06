import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, Search, CheckCircle2, XCircle, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { PageHeader, StatusBadge, SeverityDot, Spinner, EmptyState, StatCard } from '../../components/ui'

const STATUSES = ['PENDING','APPROVED_SENDER','APPROVED_RECEIVER','FULLY_APPROVED','DISPATCHED','IN_TRANSIT','RECEIVED','REJECTED','CANCELLED']
const PRIORITIES = ['LOW','NORMAL','HIGH','URGENT']

const PRIORITY_COLOR = { URGENT: '#ef4444', HIGH: '#f97316', NORMAL: '#60a5fa', LOW: '#94a3b8' }

export default function TransferList() {
  const qc = useQueryClient()
  const [status, setStatus]   = useState('')
  const [priority, setPriority] = useState('')
  const [search, setSearch]   = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const { register: regWf, handleSubmit: handWf, reset: resWf } = useForm()
  const [workflowModal, setWorkflowModal] = useState(null) // { id, action }

  const { data, isLoading } = useQuery({
    queryKey: ['transfers', status, priority, search],
    queryFn: () => api.get('/transfers', {
      params: { status: status || undefined, priority: priority || undefined, search: search || undefined }
    }).then(r => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (body) => api.post('/transfers', body),
    onSuccess: () => {
      toast.success('Transfer request created')
      qc.invalidateQueries(['transfers'])
      setShowAdd(false)
      reset()
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to create transfer'),
  })

  const workflowMutation = useMutation({
    mutationFn: ({ id, action, data }) => api.patch(`/transfers/${id}/${action}`, data),
    onSuccess: (_, { action }) => { 
      toast.success(`Transfer ${action} successful`)
      qc.invalidateQueries(['transfers'])
      setWorkflowModal(null)
      resWf()
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Action failed'),
  })

  // Simple approve/reject for officers
  const approveMutation = useMutation({
    mutationFn: ({ id, action }) => api.patch(`/transfers/${id}/${action}`),
    onSuccess: (_, { action }) => { toast.success(`Transfer ${action}d`); qc.invalidateQueries(['transfers']) },
    onError: () => toast.error('Action failed'),
  })

  const transfers = data?.data || []
  const stats = data?.stats || {}

  return (
    <div>
      <PageHeader
        title="Transfer Requests"
        sub="Inter-unit and inter-base equipment transfers with dual-approval workflow"
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={ArrowLeftRight} label="Pending"    value={stats.pending}   color="#fbbf24" />
        <StatCard icon={Truck}          label="In Transit" value={stats.in_transit} color="#60a5fa" />
        <StatCard icon={CheckCircle2}   label="Received"   value={stats.received}  color="#34d399" />
        <StatCard icon={XCircle}        label="Rejected"   value={stats.rejected}  color="#ef4444" />
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input className="input-field" placeholder="Search equipment, unit…" style={{ paddingLeft: 34 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field" style={{ flex: '0 0 160px' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <select className="input-field" style={{ flex: '0 0 140px' }} value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Cards list */}
      {isLoading ? <Spinner /> : transfers.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No transfers found" sub="No transfer requests match the current filters" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {transfers.map(tr => (
            <div key={tr.id} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                {/* Left: Equipment + route */}
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700,
                      background: `${PRIORITY_COLOR[tr.priority] || '#475569'}18`,
                      color: PRIORITY_COLOR[tr.priority] || '#475569',
                    }}>{tr.priority}</span>
                    <StatusBadge status={tr.status} />
                    <span style={{ fontSize: 11, color: '#475569' }}>{tr.type?.replace(/_/g,' ')}</span>
                  </div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: '#111827' }}>{tr.equipment_name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#3b82f6', fontFamily: 'monospace' }}>{tr.equipment_serial}</p>

                  {/* Route arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 6, padding: '6px 12px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: 0, fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>FROM</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#111827', fontWeight: 600 }}>{tr.from_unit_name || tr.from_base_name || '—'}</p>
                    </div>
                    <ArrowLeftRight size={14} color="#9ca3af" />
                    <div style={{ background: '#f8fafc', borderRadius: 6, padding: '6px 12px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: 0, fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>TO</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#111827', fontWeight: 600 }}>{tr.to_unit_name || tr.to_base_name || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Right: approvals + actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200, alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 11, color: '#475569' }}>
                    Requested: <span style={{ color: '#94a3b8' }}>{new Date(tr.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {/* Approval badges */}
                    <span style={{ fontSize: 11, color: tr.sender_approved_at ? '#34d399' : '#475569' }}>
                      {tr.sender_approved_at ? '✓' : '○'} Sender
                    </span>
                    <span style={{ fontSize: 11, color: tr.receiver_approved_at ? '#34d399' : '#475569' }}>
                      {tr.receiver_approved_at ? '✓' : '○'} Receiver
                    </span>
                  </div>

                  {/* Action buttons for pending approvals */}
                  {(tr.status === 'PENDING' || tr.status === 'APPROVED_SENDER') && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-primary"
                        style={{ padding: '5px 14px', fontSize: 12, background: 'rgba(34,197,94,0.2)', color: '#34d399', border: '1px solid rgba(34,197,94,0.3)' }}
                        onClick={() => approveMutation.mutate({ id: tr.id, action: 'approve' })}
                        disabled={approveMutation.isPending}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '5px 14px', fontSize: 12, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                        onClick={() => approveMutation.mutate({ id: tr.id, action: 'reject' })}
                        disabled={approveMutation.isPending}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {tr.status === 'FULLY_APPROVED' && (
                    <button
                      className="btn-primary"
                      style={{ padding: '5px 14px', fontSize: 12 }}
                      onClick={() => setWorkflowModal({ id: tr.id, action: 'dispatch' })}
                    >
                      Dispatch 🚛
                    </button>
                  )}
                  {tr.status === 'IN_TRANSIT' && (
                    <button
                      className="btn-primary"
                      style={{ padding: '5px 14px', fontSize: 12, background: '#10b981' }}
                      onClick={() => setWorkflowModal({ id: tr.id, action: 'receive' })}
                    >
                      Confirm Receipt ✅
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* New Transfer Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title="Request Inter-Unit Transfer" width={600}>
        <form onSubmit={handleSubmit(d => addMutation.mutate(d))}>
          <Field label="Equipment Serial Number" error={errors.equipment_serial?.message}>
            <input className="input-field" placeholder="RFL-XXXX" {...register('equipment_serial', { required: true })} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Transfer Type">
              <select className="input-field" {...register('type', { required: true })}>
                <option value="INTER_UNIT">INTER_UNIT</option>
                <option value="INTER_BASE">INTER_BASE</option>
                <option value="TEMPORARY_LOAN">TEMPORARY LOAN</option>
                <option value="PERMANENT_TRANSFER">PERMANENT</option>
              </select>
            </Field>
            <Field label="Priority">
              <select className="input-field" {...register('priority', { required: true })}>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="To Base ID (UUID)">
              <input className="input-field" placeholder="Base UUID" {...register('to_base_id', { required: true })} />
            </Field>
            <Field label="To Unit ID (UUID)">
              <input className="input-field" placeholder="Unit UUID" {...register('to_unit_id')} />
            </Field>
          </div>
          <Field label="Receiving Officer ID (UUID)">
            <input className="input-field" placeholder="Officer UUID" {...register('receiving_officer_id', { required: true })} />
          </Field>
          <Field label="Reason for Transfer" error={errors.reason?.message}>
            <textarea className="input-field" rows={3} placeholder="Deployment, Repair, etc." {...register('reason', { required: true })} />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => { setShowAdd(false); reset() }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={addMutation.isPending}>Request Transfer</button>
          </div>
        </form>
      </Modal>

      {/* Workflow Modal (Dispatch/Receive) */}
      <Modal 
        open={!!workflowModal} 
        onClose={() => setWorkflowModal(null)} 
        title={workflowModal?.action === 'dispatch' ? 'Dispatch Equipment' : 'Confirm Receipt'} 
        width={500}
      >
        <form onSubmit={handWf(d => workflowMutation.mutate({ id: workflowModal.id, action: workflowModal.action, data: d }))}>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            {workflowModal?.action === 'dispatch' 
              ? 'Marking items as dispatched to the carrier. Equipment status will change to IN TRANSIT.'
              : 'Verifying receipt of physical equipment. Unit assignment will be updated upon confirmation.'}
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Latitude">
              <input className="input-field" type="number" step="any" {...regWf(`${workflowModal?.action}_latitude`, { required: true })} />
            </Field>
            <Field label="Longitude">
              <input className="input-field" type="number" step="any" {...regWf(`${workflowModal?.action}_longitude`, { required: true })} />
            </Field>
          </div>

          {workflowModal?.action === 'receive' && (
            <Field label="Condition Received">
              <select className="input-field" {...regWf('condition', { required: true })}>
                <option value="GOOD">GOOD</option>
                <option value="FAIR">FAIR</option>
                <option value="DAMAGED">DAMAGED</option>
              </select>
            </Field>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setWorkflowModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={workflowMutation.isPending}>
              {workflowModal?.action === 'dispatch' ? 'Confirm Dispatch 🚛' : 'Confirm Receipt ✅'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
