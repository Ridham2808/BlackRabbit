import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store'
import api from '../../services/api'
import { Users, Package, Shield, ClipboardCheck, AlertTriangle, ChevronRight, Map, Plus, CheckCircle } from 'lucide-react'

function StatCard({ label, value, sub, color = '#111827', bg = '#f8fafc', icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function StemChart({ data = [], color = '#e84c35' }) {
  const max = Math.max(...data.map(d => d.value || 0), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80, paddingBottom: 4 }}>
      {data.map((d, i) => {
        const h = Math.max(4, (d.value / max) * 64)
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
            <div style={{ width: '60%', minWidth: 4, height: h, background: color, borderRadius: 3, transition: 'height 0.5s', opacity: 0.6 + (i / data.length) * 0.4 }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
            <div style={{ fontSize: 9, color: '#9ca3af' }}>{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function OfficerDashboard() {
  const navigate = useNavigate()
  const user     = useAuthStore(s => s.user)
  const [sergeants, setSergeants] = useState([])
  const [soldiers,  setSoldiers]  = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.get('/officer/sergeants'),
      api.get('/officer/soldiers'),
    ]).then(([sgtRes, slRes]) => {
      if (sgtRes.status === 'fulfilled') setSergeants(sgtRes.value.data?.data || [])
      if (slRes.status === 'fulfilled') setSoldiers(slRes.value.data?.data || [])
      setLoading(false)
    })
  }, [])

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const chartData = days.map(label => ({ label, value: Math.floor(Math.random() * 10) }))

  if (loading) return (
    <div style={{ padding: 32, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
      {[1,2,3,4].map(i => <div key={i} style={{ height: 96, background: '#fff', borderRadius: 16 }} />)}
    </div>
  )

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>Command Center</h1>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: '4px 0 0' }}>
            {user?.rank} {user?.full_name} · {user?.base_name || 'Base'} · Badge {user?.badge_number || '—'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/map')}
            style={{ padding: '10px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Map size={14} /> Live Map
          </button>
          <button onClick={() => navigate('/admin')}
            style={{ padding: '10px 16px', background: '#e84c35', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Admin Panel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Sergeants"   value={sergeants.length} sub="Under your command" color="#e84c35" bg="#fef2f2"   icon={<Shield size={20} color="#e84c35" />} />
        <StatCard label="Total Soldiers"    value={soldiers.length}  sub="Across all units"   color="#111827" bg="#f8fafc"   icon={<Users size={20} color="#9ca3af" />} />
        <StatCard label="Active Personnel"  value={soldiers.filter(s => s.is_active).length} sub="Currently active" color="#16a34a" bg="#f0fdf4" icon={<CheckCircle size={20} color="#16a34a" />} />
        <StatCard label="Units Covered"     value={new Set(sergeants.map(s => s.unit_name)).size} sub="Distinct units" color="#3b82f6" bg="#eff6ff" icon={<Package size={20} color="#3b82f6" />} />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Sergeants Table */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Sergeants Under Command</span>
              <button onClick={() => navigate('/admin')} style={{ fontSize: 12, color: '#e84c35', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', fontWeight: 700 }}>
                + Add Sergeant
              </button>
            </div>
            {sergeants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af', fontSize: 13 }}>No sergeants assigned. Use Admin Panel to create one.</div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 80px 70px', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px 10px 0 0', gap: 8 }}>
                  {['Sergeant','Badge','Unit','Soldiers','Status'].map(h => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                  ))}
                </div>
                {sergeants.map((s, i) => (
                  <div key={s.id}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 80px 70px', padding: '12px', borderBottom: i < sergeants.length - 1 ? '1px solid #f8fafc' : 'none', gap: 8, alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => navigate(`/officer/sergeants/${s.id}`)}
                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.full_name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.rank}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{s.badge_number || '—'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{s.unit_name || '—'}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{s.soldiers_count || 0}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: s.is_active ? '#16a34a' : '#dc2626', background: s.is_active ? '#f0fdf4' : '#fef2f2', padding: '3px 8px', borderRadius: 20, display: 'inline-block' }}>
                      {s.is_active ? 'Active' : 'Off'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Soldiers */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>All Soldiers</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => navigate('/admin')} style={{ fontSize: 12, color: '#e84c35', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>+ Add Soldier</button>
                <button onClick={() => navigate('/personnel')} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', fontWeight: 600 }}>
                  See all <ChevronRight size={12} />
                </button>
              </div>
            </div>
            {soldiers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af', fontSize: 13 }}>No soldiers in base.</div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 1fr 70px', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px 10px 0 0', gap: 8 }}>
                  {['Soldier','Badge','Rank','Sergeant','Status'].map(h => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                  ))}
                </div>
                {soldiers.slice(0, 6).map((s, i) => (
                  <div key={s.id}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 1fr 70px', padding: '12px', borderBottom: i < Math.min(soldiers.length, 6) - 1 ? '1px solid #f8fafc' : 'none', gap: 8, alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => navigate(`/officer/soldiers/${s.id}`)}
                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.full_name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.unit_name}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{s.badge_number || '—'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{s.rank}</div>
                    <div style={{ fontSize: 12, color: '#374151' }}>{s.sergeant_name || '—'}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: s.is_active ? '#16a34a' : '#dc2626', background: s.is_active ? '#f0fdf4' : '#fef2f2', padding: '3px 8px', borderRadius: 20, display: 'inline-block' }}>
                      {s.is_active ? 'Active' : 'Off'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Base Activity */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Base Activity</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Movements this week</div>
            <StemChart data={chartData} color="#e84c35" />
          </div>

          {/* Handover Station (Digital Tag Flow) */}
          <div style={{ 
            background: '#fff', borderRadius: 16, padding: '24px', 
            boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.03 }}>
              <Package size={120} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Digital Tag Station</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>Mobile-First Handover</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, position: 'relative' }}>
              <button 
                onClick={() => navigate('/checkout-process')}
                style={{ 
                  padding: '16px 12px', background: '#fff', border: '1px solid #e2e8f0', 
                  borderRadius: 16, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#111827'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Fast Issue</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>QR Handover</div>
              </button>
              
              <button 
                onClick={() => navigate('/checkin-process')}
                style={{ 
                  padding: '16px 12px', background: '#fff', border: '1px solid #e2e8f0', 
                  borderRadius: 16, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#111827'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Quick Return</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Verify Return</div>
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Command Actions</div>
            {[
              { label: 'Admin Panel — Create Accounts', icon: <Plus size={14} color="#e84c35" />,         bg: '#fef2f2', to: '/admin' },
              { label: 'Full Inventory View',           icon: <Package size={14} color="#3b82f6" />,      bg: '#eff6ff', to: '/equipment' },
              { label: 'Live Tracking Map',             icon: <Map size={14} color="#9ca3af" />,          bg: '#f8fafc', to: '/map' },
              { label: 'Incident Reports',              icon: <AlertTriangle size={14} color="#f59e0b" />, bg: '#fffbeb', to: '/incidents' },
              { label: 'Audit & Compliance Log',        icon: <ClipboardCheck size={14} color="#9ca3af" />, bg: '#f8fafc', to: '/audit' },
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.to)}
                style={{ width: '100%', padding: '11px 13px', marginBottom: 8, background: a.bg, border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s', textAlign: 'left' }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                {a.icon}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>{a.label}</span>
                <ChevronRight size={12} color="#9ca3af" />
              </button>
            ))}
          </div>

          {/* Sergeant Summary */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Unit Summary</div>
            {sergeants.slice(0, 3).map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 2 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {s.full_name?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.full_name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.unit_name} · {s.soldiers_count || 0} soldiers</div>
                </div>
                <ChevronRight size={13} color="#d1d5db" style={{ cursor: 'pointer' }} onClick={() => navigate(`/officer/sergeants/${s.id}`)} />
              </div>
            ))}
            {sergeants.length === 0 && <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>No sergeants yet</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
