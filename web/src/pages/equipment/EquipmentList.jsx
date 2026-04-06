import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, Search, QrCode, RefreshCw, ExternalLink, Trash2, Tag } from 'lucide-react'
import api from '../../services/api'
import { StatusBadge, PageHeader, EmptyState, Spinner, Modal, Field } from '../../components/ui'
import HandoverQR from '../../components/HandoverQR'
import toast from 'react-hot-toast'

const STATUSES = ['', 'OPERATIONAL','CHECKED_OUT','UNDER_MAINTENANCE','LOST','MISSING','FLAGGED','IN_TRANSIT','DECOMMISSIONED']
const CONDITIONS = ['EXCELLENT','GOOD','FAIR','POOR','DAMAGED']

function CreateEquipmentModal({ open, onClose, qc }) {
  const [form, setForm] = useState({ serial_number:'', name:'', category_id:'', home_base_id:'', condition:'GOOD', description:'' })
  
  const { data: cats } = useQuery({ queryKey:['equipment_categories'], queryFn: () => api.get('/equipment/categories').then(r => r.data.data || []) })
  const { data: bases } = useQuery({ queryKey:['bases'], queryFn: () => api.get('/auth/bases').then(r => r.data.data || []) })

  const mut = useMutation({
    mutationFn: (d) => {
      // Strip empty strings from payload to pass Joi validation natively
      const payload = { ...d };
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') delete payload[key];
      });
      return api.post('/equipment', payload);
    },
    onSuccess: () => { toast.success('Equipment created'); qc.invalidateQueries(['equipment']); onClose() },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <Modal open={open} onClose={onClose} title="Register New Equipment" width={560}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Field label="Serial Number"><input className="deas-input" placeholder="RFL-2024-00142" value={form.serial_number} onChange={f('serial_number')} /></Field>
        <Field label="Name"><input className="deas-input" placeholder="AK-47 Assault Rifle" value={form.name} onChange={f('name')} /></Field>
        
        <Field label="Base">
          <select className="deas-select" value={form.home_base_id} onChange={f('home_base_id')}>
            <option value="">Select Base...</option>
            {bases?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        
        <Field label="Condition">
          <select className="deas-select" value={form.condition} onChange={f('condition')}>
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        
        <Field label="Category" >
          <select className="deas-select" value={form.category_id} onChange={f('category_id')}>
            <option value="">Select Category...</option>
            {cats?.map(c => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}
          </select>
        </Field>
        
        <Field label="Description">
          <input className="deas-input" placeholder="Optional description" value={form.description} onChange={f('description')} />
        </Field>
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => mut.mutate(form)} disabled={mut.isPending}>
          {mut.isPending ? 'Creating…' : 'Create Equipment'}
        </button>
      </div>
    </Modal>
  )
}

export default function EquipmentList() {
  const [params, setParams] = useSearchParams()
  const navigate   = useNavigate()
  const qc         = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedQR, setSelectedQR] = useState(null)

  const search  = params.get('search')  || ''
  const status  = params.get('status')  || ''
  const page    = parseInt(params.get('page') || '1')

  const set = (k, v) => setParams(p => { const n=new URLSearchParams(p); v?n.set(k,v):n.delete(k); n.set('page','1'); return n })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['equipment', search, status, page],
    queryFn:  () => api.get('/equipment', { params:{ search, status, page, limit:20 } }).then(r => r.data.data),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/equipment/${id}`),
    onSuccess:  ()  => { toast.success('Deleted'); qc.invalidateQueries(['equipment']) },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const genQR = useMutation({
    mutationFn: (id) => api.post(`/equipment/${id}/qr`),
    onSuccess:  ()  => toast.success('QR code generated'),
    onError:    (e) => toast.error('QR generation failed'),
  })

  return (
    <div>
      <PageHeader
        title="Equipment Registry"
        sub={`${data?.pagination?.total ?? 0} items total`}
        actions={[
          <button key="r" className="btn-ghost btn-sm" onClick={() => refetch()}><RefreshCw size={14} /></button>,
          <button key="c" className="btn-primary btn-sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Register</button>,
        ]}
      />

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ position:'relative' }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
          <input className="deas-input" style={{ paddingLeft:30, width:200 }} placeholder="Search name / serial…"
            value={search} onChange={e => set('search', e.target.value)} />
        </div>
        <select className="deas-select" style={{ width:180 }} value={status} onChange={e => set('status', e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? <Spinner /> : (
        <div className="glass-card" style={{ overflow:'hidden' }}>
          {(!data?.data?.length) ? <EmptyState icon={Search} title="No equipment found" sub="Try changing filters" /> : (
            <table className="deas-table">
              <thead>
                <tr>
                  <th>Serial</th><th>Name</th><th>Category</th>
                  <th>Status</th><th>Condition</th><th>Custodian</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map(eq => (
                  <tr key={eq.id}>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'#3b82f6' }}>{eq.serial_number}</span></td>
                    <td style={{ fontWeight:600, color:'#111827' }}>{eq.name}</td>
                    <td style={{ color:'#9ca3af', fontSize:12 }}>{eq.category_display || eq.category_name || '—'}</td>
                    <td>
                      <div style={{ position:'relative' }}>
                        <StatusBadge status={eq.status} />
                        {(eq.status === 'LOST' || eq.status === 'MISSING' || eq.status === 'STOLEN') && (
                          <div style={{
                            position:'absolute', top:0, left:0, width:'100%', height:'100%',
                            borderRadius:20, background:'rgba(239, 68, 68, 0.2)',
                            animation:'pulse-red 1.5s infinite ease-in-out',
                            pointerEvents:'none'
                          }} />
                        )}
                      </div>
                    </td>
                    <td><span style={{ fontSize:12, color:'#6b7280' }}>{eq.condition}</span></td>
                    <td style={{ fontSize:12, color:'#6b7280' }}>{eq.current_custodian_name || '—'}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn-ghost btn-sm" onClick={() => navigate(`/equipment/${eq.id}`)} title="Details"><ExternalLink size={12} /></button>
                        <button className="btn-ghost btn-sm" onClick={() => setSelectedQR(eq)} title="Show QR"><QrCode size={12} /></button>
                        <button className="btn-ghost btn-sm" style={{ color:'#ef4444' }}
                          onClick={() => { if(confirm('Delete?')) deleteMut.mutate(eq.id) }} title="Delete"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* Pagination */}
          {data?.pagination && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.04)', fontSize:13, color:'#475569' }}>
              <span>Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} records)</span>
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn-ghost btn-sm" disabled={page<=1} onClick={() => set('page', page-1)}>← Prev</button>
                <button className="btn-ghost btn-sm" disabled={page>=data.pagination.pages} onClick={() => set('page', page+1)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      <CreateEquipmentModal open={showCreate} onClose={() => setShowCreate(false)} qc={qc} />

      <Modal open={!!selectedQR} onClose={() => setSelectedQR(null)} title="Equipment Digital Tag" width={400}>
        <div style={{ padding: '0 10px 20px' }}>
          <HandoverQR 
            title="Asset Digital Tag"
            subtitle="Scan this unique identifier to manage this asset's custody"
            asset={selectedQR}
            payload={{
              type: 'EQUIPMENT_TAG',
              equipmentId: selectedQR?.id,
              serialNumber: selectedQR?.serial_number,
              timestamp: new Date().toISOString()
            }}
          />
        </div>
      </Modal>
    </div>
  )
}
