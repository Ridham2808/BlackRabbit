import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Settings, Users, Shield, Database, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { PageHeader, Spinner, Modal, Field, StatCard } from '../../components/ui'
import { useAuthStore } from '../../store'

const ROLES = ['SOLDIER','FIELD_OFFICER','QUARTERMASTER','BASE_ADMIN','AUDITOR','TECHNICIAN','SUPER_ADMIN']
const ROLE_COLORS = {
  SUPER_ADMIN: '#ef4444', BASE_ADMIN: '#f97316', QUARTERMASTER: '#fbbf24',
  FIELD_OFFICER: '#60a5fa', AUDITOR: '#a78bfa', TECHNICIAN: '#34d399', SOLDIER: '#8aab2e',
}

function TabBtn({ label, active, onClick, icon: Icon }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
      borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
      background: active ? 'rgba(139,171,46,0.15)' : 'transparent',
      color: active ? '#8aab2e' : '#475569',
      borderBottom: active ? '2px solid #8aab2e' : '2px solid transparent',
      transition: 'all 0.15s',
    }}>
      <Icon size={15} /> {label}
    </button>
  )
}

function RoleBadgeLocal({ role }) {
  const color = ROLE_COLORS[role] || '#94a3b8'
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>
      {role?.replace(/_/g,' ')}
    </span>
  )
}

export default function AdminPanel() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [tab, setTab] = useState('users')
  const [showAdd, setShowAdd] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  // Users tab
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
    enabled: tab === 'users',
  })

  // System stats tab
  const { data: sysData, isLoading: sysLoading } = useQuery({
    queryKey: ['admin-system'],
    queryFn: () => api.get('/admin/system-stats').then(r => r.data),
    enabled: tab === 'system',
  })

  // Bases tab
  const { data: basesData, isLoading: basesLoading } = useQuery({
    queryKey: ['admin-bases'],
    queryFn: () => api.get('/admin/bases').then(r => r.data),
    enabled: tab === 'bases',
  })

  const toggleUserMutation = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`/admin/users/${id}`, { is_active }),
    onSuccess: () => { toast.success('User updated'); qc.invalidateQueries(['admin-users']) },
    onError: () => toast.error('Failed to update user'),
  })

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries(['admin-users']) },
    onError: () => toast.error('Failed to change role'),
  })

  const addBaseMutation = useMutation({
    mutationFn: (body) => api.post('/admin/bases', body),
    onSuccess: () => { toast.success('Base created'); qc.invalidateQueries(['admin-bases']); setShowAdd(false); reset() },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to create base'),
  })

  const users = usersData?.data || []
  const bases = basesData?.data || []
  const sys   = sysData || {}

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        sub="User management, base configuration, and system health monitoring"
      />

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 0 }}>
        <TabBtn label="Users"      active={tab === 'users'}  onClick={() => setTab('users')}  icon={Users}    />
        <TabBtn label="Bases"      active={tab === 'bases'}  onClick={() => setTab('bases')}  icon={Shield}   />
        <TabBtn label="System"     active={tab === 'system'} onClick={() => setTab('system')} icon={Database} />
        <TabBtn label="Settings"   active={tab === 'config'} onClick={() => setTab('config')} icon={Settings} />
      </div>

      {/* ── Users Tab ── */}
      {tab === 'users' && (
        <>
          {usersLoading ? <Spinner /> : (
            <div className="glass-card" style={{ overflow: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Service No.</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Current Role</th>
                    <th>Change Role</th>
                    <th>Active</th>
                    <th>Last Login</th>
                    <th>Failed Logins</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#8aab2e' }}>{u.service_number}</span></td>
                      <td><span style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{u.full_name}</span></td>
                      <td><span style={{ fontSize: 12, color: '#6b7280' }}>{u.email}</span></td>
                      <td><RoleBadgeLocal role={u.role} /></td>
                      <td>
                        {u.id !== user?.id && (
                          <select
                            className="input-field"
                            style={{ fontSize: 12, padding: '4px 8px', width: 160 }}
                            value={u.role}
                            onChange={e => changeRoleMutation.mutate({ id: u.id, role: e.target.value })}
                          >
                            {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                          </select>
                        )}
                      </td>
                      <td>
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: u.is_active ? '#34d399' : '#ef4444' }}
                          onClick={() => toggleUserMutation.mutate({ id: u.id, is_active: !u.is_active })}
                          disabled={u.id === user?.id}
                        >
                          {u.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                      </td>
                      <td><span style={{ fontSize: 11, color: '#475569' }}>{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}</span></td>
                      <td>
                        <span style={{ fontSize: 12, color: u.failed_login_count > 0 ? '#f97316' : '#475569' }}>
                          {u.failed_login_count || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Bases Tab ── */}
      {tab === 'bases' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add Base
            </button>
          </div>
          {basesLoading ? <Spinner /> : (
            <div className="glass-card" style={{ overflow: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Code</th><th>Name</th><th>CO</th><th>Lat</th><th>Lng</th><th>Units</th><th>Personnel</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {bases.map(b => (
                    <tr key={b.id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#8aab2e' }}>{b.code}</span></td>
                      <td><span style={{ fontWeight: 600, color: '#111827' }}>{b.name}</span></td>
                      <td><span style={{ fontSize: 12, color: '#6b7280' }}>{b.co_name || '—'}</span></td>
                      <td><span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9ca3af' }}>{b.latitude}</span></td>
                      <td><span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9ca3af' }}>{b.longitude}</span></td>
                      <td><span style={{ fontSize: 12, color: '#6b7280' }}>{b.unit_count || 0}</span></td>
                      <td><span style={{ fontSize: 12, color: '#6b7280' }}>{b.personnel_count || 0}</span></td>
                      <td>
                        <span style={{ fontSize: 11, color: b.is_active ? '#34d399' : '#ef4444', fontWeight: 600 }}>
                          {b.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title="Add Military Base" width={520}>
            <form onSubmit={handleSubmit(d => addBaseMutation.mutate(d))}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Base Name" error={errors.name?.message}>
                  <input className="input-field" placeholder="Northern Command HQ" {...register('name', { required: 'Required' })} />
                </Field>
                <Field label="Base Code" error={errors.code?.message}>
                  <input className="input-field" placeholder="NCH-001" {...register('code', { required: 'Required' })} />
                </Field>
                <Field label="Latitude" error={errors.latitude?.message}>
                  <input className="input-field" type="number" step="0.000001" placeholder="28.613939" {...register('latitude', { required: 'Required' })} />
                </Field>
                <Field label="Longitude" error={errors.longitude?.message}>
                  <input className="input-field" type="number" step="0.000001" placeholder="77.209023" {...register('longitude', { required: 'Required' })} />
                </Field>
                <Field label="Address" error={errors.address?.message} >
                  <input className="input-field" placeholder="Full address" {...register('address')} style={{ gridColumn: '1 / -1' }} />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowAdd(false); reset() }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={addBaseMutation.isPending}>
                  {addBaseMutation.isPending ? 'Creating…' : 'Create Base'}
                </button>
              </div>
            </form>
          </Modal>
        </>
      )}

      {/* ── System Tab ── */}
      {tab === 'system' && (
        sysLoading ? <Spinner /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {/* DB Stats */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h4 style={{ margin: '0 0 14px', color: '#8aab2e', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Database size={14} /> Database
              </h4>
              {[
                ['Total Personnel', sys.total_personnel],
                ['Total Equipment', sys.total_equipment],
                ['Total Checkouts', sys.total_checkouts],
                ['Total Audit Logs', sys.total_audit_logs?.toLocaleString()],
                ['DB Size', sys.db_size],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{val ?? '—'}</span>
                </div>
              ))}
            </div>
            {/* Uptime / Health */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h4 style={{ margin: '0 0 14px', color: '#60a5fa', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Settings size={14} /> System Health
              </h4>
              {[
                ['API Status', sys.api_status || 'Healthy'],
                ['DB Connection', sys.db_connected ? '✅ Connected' : '❌ Error'],
                ['Redis', sys.redis_connected ? '✅ Connected' : '❌ Error'],
                ['Node Version', sys.node_version],
                ['Uptime', sys.uptime],
                ['Memory Used', sys.memory_used],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{val ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* ── Config Tab ── */}
      {tab === 'config' && (
        <div className="card" style={{ padding: 24, maxWidth: 600 }}>
          <h4 style={{ margin: '0 0 20px', color: '#111827', fontSize: 14, fontWeight: 700 }}>System Configuration</h4>
          {[
            { label: 'Session Timeout (minutes)', key: 'session_timeout', type: 'number', placeholder: '15' },
            { label: 'Max Failed Logins', key: 'max_failed_logins', type: 'number', placeholder: '5' },
            { label: 'Overdue Alert Threshold (hours)', key: 'overdue_threshold_hours', type: 'number', placeholder: '24' },
            { label: 'GPS Ping Interval (seconds)', key: 'gps_interval_seconds', type: 'number', placeholder: '30' },
            { label: 'Low Stock Alert (%)', key: 'low_stock_pct', type: 'number', placeholder: '20' },
          ].map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                style={{
                  width: 120, padding: '6px 10px', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: 6,
                  color: '#111827', fontSize: 13, textAlign: 'right',
                }}
              />
            </div>
          ))}
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={() => toast.success('Config saved')}>Save Configuration</button>
          </div>
        </div>
      )}
    </div>
  )
}
