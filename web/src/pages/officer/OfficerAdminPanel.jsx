import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store'
import api from '../../services/api'
import { Plus, Users, Shield, Mail, User, Building2, CheckCircle, AlertCircle, Loader2, ChevronRight, X } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Reusable field component ─────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputSt = {
  width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
  padding: '10px 14px', fontSize: 13, color: '#111827', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s',
}

// ── Create Form ────────────────────────────────────────────────
function CreateForm({ role, bases, units, onBaseChange, onSuccess, onCancel }) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', rank: role === 'SERGEANT' ? 'Sergeant' : 'Private', unitId: '', baseId: '', assignedSergeantId: '' })
  const [sergeants, setSergeants] = useState([])
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (role === 'SOLDIER' && form.unitId) {
      api.get('/officer/sergeants').then(r => setSergeants(r.data?.data || [])).catch(() => {})
    }
  }, [role, form.unitId])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const endpoint = role === 'SERGEANT' ? '/officer/create-sergeant' : '/officer/create-soldier'
      await api.post(endpoint, form)
      toast.success(`${role === 'SERGEANT' ? 'Sergeant' : 'Soldier'} account created! Credentials sent to ${form.email}`)
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const accentColor = role === 'SERGEANT' ? '#f59e0b' : '#3b82f6'
  const rankOptions = role === 'SERGEANT'
    ? ['Sergeant', 'Staff Sergeant', 'Master Sergeant']
    : ['Private', 'Private First Class', 'Corporal', 'Specialist']

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${accentColor}30`, padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Create {role === 'SERGEANT' ? 'Sergeant' : 'Soldier'}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Credentials will be emailed automatically</div>
        </div>
        <button onClick={onCancel} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px', cursor: 'pointer', display: 'flex' }}>
          <X size={16} color="#6b7280" />
        </button>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Full Name *">
          <input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Pvt. Arjun Sharma" required style={inputSt}
            onFocus={e => e.target.style.borderColor = accentColor}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
        </Field>

        <Field label="Official Email *">
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="soldier@deas.mil" required style={inputSt}
            onFocus={e => e.target.style.borderColor = accentColor}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
        </Field>

        <Field label="Rank">
          <select value={form.rank} onChange={e => set('rank', e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
            {rankOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>

        <Field label="Phone">
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91-XXXXXXXXXX" style={inputSt} />
        </Field>

        <Field label="Base *">
          <select value={form.baseId} onChange={e => { set('baseId', e.target.value); onBaseChange(e.target.value) }} required style={{ ...inputSt, cursor: 'pointer' }}>
            <option value="">Select Base</option>
            {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>

        <Field label="Unit *">
          <select value={form.unitId} onChange={e => set('unitId', e.target.value)} required disabled={!form.baseId} style={{ ...inputSt, cursor: form.baseId ? 'pointer' : 'not-allowed', opacity: form.baseId ? 1 : 0.5 }}>
            <option value="">Select Unit</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>

        {role === 'SOLDIER' && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Assign to Sergeant (Optional)">
              <select value={form.assignedSergeantId} onChange={e => set('assignedSergeantId', e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                <option value="">No sergeant assigned</option>
                {sergeants.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.badge_number || s.unit_name})</option>)}
              </select>
            </Field>
          </div>
        )}

        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, marginTop: 4 }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: '11px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: accentColor, border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
            {loading ? <><Loader2 size={13} className="animate-spin" /> Creating & Sending Email...</> : <><Mail size={13} /> Create & Send Credentials</>}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Main Admin Panel ────────────────────────────────────────────
export default function OfficerAdminPanel() {
  const user = useAuthStore(s => s.user)
  const [tab, setTab] = useState('overview')   // 'overview' | 'sergeant' | 'soldier'
  const [sergeants, setSergeants] = useState([])
  const [soldiers,  setSoldiers]  = useState([])
  const [bases, setBases] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(null) // 'SERGEANT' | 'SOLDIER'

  const fetchData = () => {
    setLoading(true)
    Promise.allSettled([
      api.get('/officer/sergeants'),
      api.get('/officer/soldiers'),
      api.get('/auth/bases'),
    ]).then(([sgtRes, slRes, basesRes]) => {
      if (sgtRes.status === 'fulfilled') setSergeants(sgtRes.value.data?.data || [])
      if (slRes.status  === 'fulfilled') setSoldiers(slRes.value.data?.data || [])
      if (basesRes.status === 'fulfilled') setBases(basesRes.value.data?.data || [])
      setLoading(false)
    })
  }

  useEffect(() => { fetchData() }, [])

  const handleBaseChange = async (baseId) => {
    if (!baseId) return setUnits([])
    const r = await api.get(`/auth/units?baseId=${baseId}`).catch(() => null)
    setUnits(r?.data?.data || [])
  }

  const onCreateSuccess = () => {
    setShowForm(null)
    fetchData()
  }

  const TAB_STYLE = (active) => ({
    padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
    borderRadius: 8, fontFamily: 'inherit', background: active ? '#111827' : 'transparent',
    color: active ? '#fff' : '#9ca3af', transition: 'all 0.15s',
  })

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>Admin Panel</h1>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: '4px 0 0' }}>
            {user?.rank} {user?.full_name} · Create and manage accounts
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowForm('SERGEANT')} disabled={!!showForm}
            style={{ padding: '10px 16px', background: '#fff', border: '1px solid #f59e0b', borderRadius: 10, color: '#f59e0b', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, opacity: showForm ? 0.5 : 1 }}>
            <Plus size={14} /> New Sergeant
          </button>
          <button onClick={() => setShowForm('SOLDIER')} disabled={!!showForm}
            style={{ padding: '10px 16px', background: '#3b82f6', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, opacity: showForm ? 0.5 : 1 }}>
            <Plus size={14} /> New Soldier
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Sergeants',        value: sergeants.length, color: '#f59e0b', bg: '#fffbeb', icon: <Shield size={20} color="#f59e0b" /> },
          { label: 'Soldiers',         value: soldiers.length,  color: '#3b82f6', bg: '#eff6ff', icon: <Users size={20} color="#3b82f6" /> },
          { label: 'Active Personnel', value: [...sergeants, ...soldiers].filter(p => p.is_active).length, color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle size={20} color="#16a34a" /> },
          { label: 'Pending Email',    value: 0, color: '#9ca3af', bg: '#f8fafc', icon: <Mail size={20} color="#9ca3af" /> },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Form if shown */}
      {showForm && (
        <div style={{ marginBottom: 24 }}>
          <CreateForm
            role={showForm}
            bases={bases}
            units={units}
            onBaseChange={handleBaseChange}
            onSuccess={onCreateSuccess}
            onCancel={() => setShowForm(null)}
          />
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 4, padding: '16px 20px 0', borderBottom: '1px solid #f1f5f9' }}>
          {[['overview','All Personnel'],['sergeant','Sergeants'],['soldier','Soldiers']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={TAB_STYLE(tab === key)}>{label}</button>
          ))}
        </div>

        <div style={{ padding: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: 13 }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block' }} />
              Loading personnel...
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 100px 1fr 90px 70px', padding: '8px 12px', background: '#f8fafc', borderRadius: 10, gap: 8, marginBottom: 4 }}>
                {['Name', 'Badge', 'Role', 'Unit', 'Last Login', 'Status'].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
                ))}
              </div>

              {/* Rows */}
              {(tab === 'overview' ? [...sergeants, ...soldiers] : tab === 'sergeant' ? sergeants : soldiers)
                .map((p, i, arr) => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 100px 1fr 90px 70px', padding: '13px 12px', borderBottom: i < arr.length - 1 ? '1px solid #f8fafc' : 'none', gap: 8, alignItems: 'center', transition: 'background 0.15s', cursor: 'pointer' }}
                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{p.full_name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.email}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{p.badge_number || '—'}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: p.role === 'SERGEANT' ? '#f59e0b' : '#3b82f6', background: p.role === 'SERGEANT' ? '#fffbeb' : '#eff6ff', padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>
                      {p.role}
                    </span>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {p.unit_name || '—'}
                      {p.sergeant_name && <span style={{ color: '#9ca3af' }}> · {p.sergeant_name}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {p.last_login_at ? new Date(p.last_login_at).toLocaleDateString() : 'Never'}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: p.is_active ? '#16a34a' : '#dc2626', background: p.is_active ? '#f0fdf4' : '#fef2f2', padding: '3px 8px', borderRadius: 20, display: 'inline-block' }}>
                      {p.is_active ? 'Active' : 'Off'}
                    </span>
                  </div>
                ))
              }

              {(tab === 'overview' ? [...sergeants, ...soldiers] : tab === 'sergeant' ? sergeants : soldiers).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>
                  No {tab === 'sergeant' ? 'sergeants' : tab === 'soldier' ? 'soldiers' : 'personnel'} yet.
                  Use the buttons above to create accounts.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
