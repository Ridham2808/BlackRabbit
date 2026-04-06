import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, LogIn } from 'lucide-react'
import api from '../../services/api'
import { StatusBadge, PageHeader, EmptyState, Spinner, Modal, Field } from '../../components/ui'
import toast from 'react-hot-toast'
import { WebSyncService } from '../../services/WebSyncService'

function CheckoutModal({ open, onClose, qc }) {
  const [form, setForm] = useState({ equipment_id:'', purpose:'MISSION', expected_return_at:'', condition_on_checkout:'GOOD', notes:'' })
  const mut = useMutation({
    mutationFn: async (d) => {
      try {
        return await api.post('/checkouts', d)
      } catch (err) {
        if (!window.navigator.onLine || err.message === 'Network Error' || err.code === 'ECONNABORTED') {
          return await WebSyncService.enqueueAction('CHECKOUT', { ...d, offline_timestamp: new Date().toISOString() })
        }
        throw err
      }
    },
    onSuccess: () => { toast.success('Equipment checked out'); qc.invalidateQueries(['checkouts']); onClose() },
    onError:   (e) => toast.error(e.response?.data?.message || 'Checkout failed'),
  })
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  return (
    <Modal open={open} onClose={onClose} title="New Checkout">
      <Field label="Equipment ID"><input className="deas-input" placeholder="UUID of equipment" value={form.equipment_id} onChange={f('equipment_id')} /></Field>
      <Field label="Purpose">
        <select className="deas-select" value={form.purpose} onChange={f('purpose')}>
          {['MISSION','TRAINING','MAINTENANCE','INSPECTION','EXERCISE','EMERGENCY'].map(p => <option key={p}>{p}</option>)}
        </select>
      </Field>
      <Field label="Expected Return">
        <input type="datetime-local" className="deas-input" value={form.expected_return_at} onChange={f('expected_return_at')} />
      </Field>
      <Field label="Condition">
        <select className="deas-select" value={form.condition_on_checkout} onChange={f('condition_on_checkout')}>
          {['EXCELLENT','GOOD','FAIR','POOR','DAMAGED'].map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Notes"><input className="deas-input" placeholder="Optional notes" value={form.notes} onChange={f('notes')} /></Field>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16 }}>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => mut.mutate(form)} disabled={mut.isPending}>
          {mut.isPending ? 'Checking out…' : 'Checkout'}
        </button>
      </div>
    </Modal>
  )
}

export default function CheckoutList() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const status = params.get('status') || ''
  const set = (k, v) => setParams(p => { const n=new URLSearchParams(p); v?n.set(k,v):n.delete(k); return n })

  const { data: rows, isLoading } = useQuery({
    queryKey: ['checkouts', status],
    queryFn:  async () => {
      console.log(`[Web Checkout] Fetching checkouts status=${status || 'ALL'}`);
      const r = await api.get('/checkouts', { params:{ status } });
      console.log(`[Web Checkout] Retrieved ${r.data.data.length} checkouts`);
      return r.data.data;
    },
  })

  const checkIn = useMutation({
    mutationFn: async (id) => {
      try {
        return await api.patch(`/checkouts/${id}/checkin`, { condition_on_return:'GOOD' })
      } catch (err) {
        if (!window.navigator.onLine || err.message === 'Network Error' || err.code === 'ECONNABORTED') {
          return await WebSyncService.enqueueAction('CHECKIN', { checkoutId: id, condition_on_return: 'GOOD', offline_timestamp: new Date().toISOString() })
        }
        throw err
      }
    },
    onSuccess:  ()  => { toast.success('Checked in'); qc.invalidateQueries(['checkouts']) },
    onError:    (e) => toast.error(e.response?.data?.message || 'Check-in failed'),
  })

  return (
    <div>
      <PageHeader title="Checkouts" sub={`${rows?.length ?? 0} records`}
        actions={[
          <button key="c" className="btn-primary btn-sm" onClick={() => navigate('/checkout-process')}><Plus size={14}/> New Secure Checkout</button>,
        ]}
      />
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        {['','ACTIVE','OVERDUE','RETURNED','ESCALATED'].map(s => (
          <button key={s} className={status === s ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} onClick={() => set('status', s)}>
            {s || 'All'}
          </button>
        ))}
      </div>
      {isLoading ? <Spinner /> : (
        <div className="glass-card" style={{ overflow:'hidden' }}>
          {!rows?.length ? <EmptyState icon={Search} title="No checkouts" sub="No records match." /> : (
            <table className="deas-table">
              <thead><tr><th>Equipment</th><th>Serial</th><th>Checked Out By</th><th>Purpose</th><th>Status</th><th>Expected Return</th><th>Actions</th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight:600, color:'#111827' }}>{r.equipment_name}</td>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'#3b82f6' }}>{r.equipment_serial}</span></td>
                    <td style={{ fontSize:12, color:'#374151' }}>{r.checked_out_by_name}</td>
                    <td><span style={{ fontSize:11, color:'#9ca3af' }}>{r.purpose}</span></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td style={{ fontSize:12, color: new Date(r.expected_return_at) < new Date() && r.status === 'ACTIVE' ? '#ef4444' : '#94a3b8' }}>
                      {new Date(r.expected_return_at).toLocaleString('en-IN', { dateStyle:'short', timeStyle:'short' })}
                    </td>
                    <td>
                      {r.status === 'ACTIVE' && (
                        <button className="btn-primary btn-sm" onClick={() => navigate('/checkin-process')}>Check In</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
