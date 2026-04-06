import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store'
import api from '../../services/api'
import { Users, Package, ClipboardCheck, CheckCircle, XCircle, AlertTriangle, ChevronRight, Map, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

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

function StemChart({ data = [], color = '#f59e0b' }) {
  const max = Math.max(...data.map(d => d.value || 0), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80, paddingBottom: 4 }}>
      {data.map((d, i) => {
        const h = Math.max(4, (d.value / max) * 64)
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
            <div style={{ width: '55%', minWidth: 4, height: h, background: color, borderRadius: 3, transition: 'height 0.5s', opacity: 0.6 + (i / data.length) * 0.4 }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
            <div style={{ fontSize: 9, color: '#9ca3af' }}>{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function SergeantDashboard() {
  const navigate = useNavigate()
  const user     = useAuthStore(s => s.user)
  const [soldiers,  setSoldiers]  = useState([])
  const [requests,  setRequests]  = useState([])
  const [inventory, setInventory] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [approvingId, setApprovingId] = useState(null)

  useEffect(() => {
    Promise.allSettled([
      api.get('/sergeant/my-soldiers'),
      api.get('/sergeant/checkout-requests'),
      api.get('/sergeant/unit-inventory'),
    ]).then(([sRes, rRes, iRes]) => {
      if (sRes.status === 'fulfilled') setSoldiers(sRes.value.data?.data || [])
      if (rRes.status === 'fulfilled') setRequests(rRes.value.data?.data || [])
      if (iRes.status === 'fulfilled') setInventory(iRes.value.data?.data || [])
      setLoading(false)
    })
  }, [])

  const handleApprove = async (id) => {
    setApprovingId(id + '_a')
    try {
      await api.put(`/sergeant/checkout-requests/${id}/approve`)
      setRequests(p => p.filter(r => r.id !== id))
      toast.success('Checkout approved')
    } catch { toast.error('Failed to approve') } finally { setApprovingId(null) }
  }

  const handleReject = async (id) => {
    setApprovingId(id + '_r')
    try {
      await api.put(`/sergeant/checkout-requests/${id}/reject`, { reason: 'Rejected by Sergeant' })
      setRequests(p => p.filter(r => r.id !== id))
      toast.success('Checkout rejected')
    } catch { toast.error('Failed to reject') } finally { setApprovingId(null) }
  }

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const chartData = days.map(label => ({ label, value: Math.floor(Math.random() * 5) }))

  if (loading) return (
    <div style={{ padding: 32, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
      {[1,2,3,4].map(i => <div key={i} style={{ height: 96, background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }} />)}
    </div>
  )

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>Unit Command</h1>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: '4px 0 0' }}>
            {user?.rank} {user?.full_name} · {user?.unit_name || 'Unit'} · Badge {user?.badge_number || '—'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/map')} style={{ padding: '10px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Map size={14} /> Unit Map
          </button>
          <button onClick={() => navigate('/maintenance')} style={{ padding: '10px 16px', background: '#f59e0b', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} /> Flag Maintenance
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="My Soldiers" value={soldiers.length} sub="Under my command" color="#f59e0b" bg="#fffbeb" icon={<Users size={20} color="#f59e0b" />} />
        <StatCard label="Pending Requests" value={requests.length} sub="Awaiting approval" color={requests.length > 0 ? '#dc2626' : '#111827'} bg={requests.length > 0 ? '#fef2f2' : '#f8fafc'} icon={<ClipboardCheck size={20} color={requests.length > 0 ? '#dc2626' : '#9ca3af'} />} />
        <StatCard label="Unit Inventory" value={inventory.length} sub="Equipment items" color="#111827" bg="#f8fafc" icon={<Package size={20} color="#9ca3af" />} />
        <StatCard label="Operational" value={inventory.filter(e => e.status === 'OPERATIONAL').length} sub="Ready for duty" color="#16a34a" bg="#f0fdf4" icon={<CheckCircle size={20} color="#16a34a" />} />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Soldiers Table */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>My Soldiers</span>
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{soldiers.length} assigned</span>
            </div>
            {soldiers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af', fontSize: 13 }}>No soldiers assigned yet</div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px 70px', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px 10px 0 0', gap: 8 }}>
                  {['Soldier','Badge','Rank','Equipment','Status'].map(h => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                  ))}
                </div>
                {soldiers.map((s, i) => (
                  <div key={s.id}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px 70px', padding: '12px', borderBottom: i < soldiers.length - 1 ? '1px solid #f8fafc' : 'none', gap: 8, alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.full_name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.unit_name}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{s.badge_number || '—'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{s.rank}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{Array.isArray(s.assigned_equipment) ? s.assigned_equipment.length : 0} items</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: s.is_active ? '#16a34a' : '#dc2626', background: s.is_active ? '#f0fdf4' : '#fef2f2', padding: '3px 8px', borderRadius: 20, display: 'inline-block' }}>
                      {s.is_active ? 'Active' : 'Off'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approval Queue */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Checkout Approval Queue</span>
              {requests.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '3px 10px', borderRadius: 20 }}>{requests.length} pending</span>}
            </div>
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af', fontSize: 13 }}>✓ No pending requests</div>
            ) : requests.map(r => (
              <div key={r.id} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                <ClipboardCheck size={18} color="#9ca3af" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{r.equipment_name || 'Equipment'}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.checked_out_by_name} · {r.actual_checkout_at ? new Date(r.actual_checkout_at).toLocaleDateString() : '—'}</div>
                </div>
                <button onClick={() => handleReject(r.id)} disabled={!!approvingId} style={{ padding: '7px 14px', background: '#fef2f2', border: 'none', borderRadius: 8, color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {approvingId === r.id + '_r' ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={12} />} Reject
                </button>
                <button onClick={() => handleApprove(r.id)} disabled={!!approvingId} style={{ padding: '7px 14px', background: '#f0fdf4', border: 'none', borderRadius: 8, color: '#16a34a', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {approvingId === r.id + '_a' ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={12} />} Approve
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Activity Chart */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Unit Activity</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 16 }}>Movements this week</div>
            <StemChart data={chartData} color="#f59e0b" />
          </div>

          {/* Handover Station (Digital Tag Flow) */}
          <div style={{ 
            background: '#fff', borderRadius: 16, padding: '24px', 
            boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 20
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.03 }}>
              <Package size={120} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={18} color="#fff" />
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

          {/* Inventory */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Unit Inventory</span>
              <button onClick={() => navigate('/equipment')} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', fontWeight: 600 }}>See all <ChevronRight size={12} /></button>
            </div>
            {inventory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 13 }}>No inventory data</div>
            ) : inventory.slice(0, 5).map((e, i) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.status === 'OPERATIONAL' ? '#16a34a' : '#f59e0b', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{e.custodian_name || 'Available'}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: e.status === 'OPERATIONAL' ? '#16a34a' : '#f59e0b', background: e.status === 'OPERATIONAL' ? '#f0fdf4' : '#fffbeb', padding: '2px 8px', borderRadius: 12 }}>
                  {e.status}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Quick Actions</div>
            {[
              { label: 'View Unit on Map',  to: '/map',        icon: <Map size={14} color="#9ca3af" /> },
              { label: 'Unit Audit Log',    to: '/audit',      icon: <ClipboardCheck size={14} color="#f59e0b" /> },
              { label: 'Maintenance Flags', to: '/maintenance', icon: <AlertTriangle size={14} color="#e84c35" /> },
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.to)}
                style={{ width: '100%', padding: '11px 13px', marginBottom: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s', textAlign: 'left' }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                {a.icon}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>{a.label}</span>
                <ChevronRight size={12} color="#9ca3af" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
