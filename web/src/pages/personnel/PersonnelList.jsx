import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Users, Plus, Search, Shield, UserCheck, UserX } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { PageHeader, StatusBadge, Spinner, EmptyState, Modal, Field, StatCard } from '../../components/ui'

const ROLES = ['SOLDIER','FIELD_OFFICER','QUARTERMASTER','BASE_ADMIN','AUDITOR','TECHNICIAN','SUPER_ADMIN']
const RANKS = ['Private','Corporal','Sergeant','Lieutenant','Captain','Major','Colonel','General']
const ROLE_COLORS = {
  SUPER_ADMIN:    '#ef4444',
  BASE_ADMIN:     '#f97316',
  QUARTERMASTER:  '#fbbf24',
  FIELD_OFFICER:  '#60a5fa',
  AUDITOR:        '#a78bfa',
  TECHNICIAN:     '#34d399',
  SOLDIER:        '#8aab2e',
}

function RoleBadge({ role }) {
  const color = ROLE_COLORS[role] || '#94a3b8'
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>
      {role?.replace(/_/g, ' ')}
    </span>
  )
}

export default function PersonnelList() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['personnel', search, roleFilter],
    queryFn: () => api.get('/personnel', { params: { search, role: roleFilter || undefined } }).then(r => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (body) => api.post('/personnel', body),
    onSuccess: () => { toast.success('Personnel added'); qc.invalidateQueries(['personnel']); setShowAdd(false); reset() },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to add personnel'),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`/personnel/${id}`, { is_active }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['personnel']) },
    onError: () => toast.error('Failed to update'),
  })

  const personnel = data?.data || []
  const stats = data?.stats || {}

  return (
    <div>
      <PageHeader
        title="Personnel Management"
        sub="All registered personnel across bases and units"
        actions={
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add Personnel
          </button>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Users}     label="Total"   value={stats.total}   color="#8aab2e" />
        <StatCard icon={UserCheck} label="Active"  value={stats.active}  color="#34d399" />
        <StatCard icon={UserX}     label="Inactive" value={stats.inactive} color="#ef4444" />
        <StatCard icon={Shield}    label="Officers" value={stats.officers} color="#60a5fa" />
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input className="input-field" placeholder="Search name, service number…" style={{ paddingLeft: 34 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field" style={{ flex: '0 0 180px' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'auto' }}>
        {isLoading ? <Spinner /> : personnel.length === 0 ? (
          <EmptyState icon={Users} title="No personnel found" sub="Adjust your search or add a new member" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Service No.</th>
                <th>Name</th>
                <th>Rank</th>
                <th>Role</th>
                <th>Unit</th>
                <th>Base</th>
                <th>Clearance</th>
                <th>Status</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {personnel.map(p => (
                <tr key={p.id} style={{ cursor: 'default' }}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#8aab2e' }}>{p.service_number}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: `${ROLE_COLORS[p.role] || '#475569'}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: ROLE_COLORS[p.role] || '#475569',
                      }}>
                        {p.full_name?.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{p.full_name}</span>
                    </div>
                  </td>
                  <td><span style={{ fontSize: 12, color: '#6b7280' }}>{p.rank}</span></td>
                  <td><RoleBadge role={p.role} /></td>
                  <td><span style={{ fontSize: 12, color: '#94a3b8' }}>{p.unit_name || '—'}</span></td>
                  <td><span style={{ fontSize: 12, color: '#94a3b8' }}>{p.base_name || '—'}</span></td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>
                      L{p.clearance_level}
                    </span>
                  </td>
                  <td>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => toggleActive.mutate({ id: p.id, is_active: !p.is_active })}
                    >
                      <StatusBadge status={p.is_active ? 'OPERATIONAL' : 'DECOMMISSIONED'} />
                    </button>
                  </td>
                  <td><span style={{ fontSize: 11, color: '#475569' }}>
                    {p.last_login_at ? new Date(p.last_login_at).toLocaleDateString() : 'Never'}
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Personnel Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title="Add New Personnel" width={600}>
        <form onSubmit={handleSubmit(d => addMutation.mutate(d))}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Full Name" error={errors.full_name?.message}>
              <input className="input-field" placeholder="Sgt. John Doe" {...register('full_name', { required: 'Required' })} />
            </Field>
            <Field label="Service Number" error={errors.service_number?.message}>
              <input className="input-field" placeholder="IND-2024-4521" {...register('service_number', { required: 'Required' })} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input className="input-field" type="email" placeholder="john@mil.in" {...register('email', { required: 'Required' })} />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <input className="input-field" type="password" placeholder="Min 8 chars" {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
            </Field>
            <Field label="Role" error={errors.role?.message}>
              <select className="input-field" {...register('role', { required: 'Required' })}>
                <option value="">Select role…</option>
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
              </select>
            </Field>
            <Field label="Rank" error={errors.rank?.message}>
              <select className="input-field" {...register('rank', { required: 'Required' })}>
                <option value="">Select rank…</option>
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Clearance Level (1–5)" error={errors.clearance_level?.message}>
              <input className="input-field" type="number" min={1} max={5} placeholder="1" {...register('clearance_level', { required: 'Required', min: 1, max: 5 })} />
            </Field>
            <Field label="Phone">
              <input className="input-field" placeholder="+91-9876543210" {...register('phone')} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => { setShowAdd(false); reset() }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Adding…' : 'Add Personnel'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
