import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store'
import api from '../../services/api'
import { Package, ClipboardCheck, MapPin, AlertTriangle, ChevronRight, User, Shield, Calendar, Activity, Clock, QrCode, X } from 'lucide-react'
import QRCode from 'react-qr-code'
import RequestEquipmentModal from '../../components/RequestEquipmentModal'

function StatCard({ label, value, sub, color = '#111827', bg = '#f8fafc', icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function StemChart({ data = [], color = '#3b82f6' }) {
  const max = Math.max(...data.map(d => d.value || 0), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80, paddingBottom: 4 }}>
      {data.map((d, i) => {
        const h = Math.max(4, (d.value / max) * 64)
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: h, background: color, borderRadius: 3, opacity: 0.7 + (i / data.length) * 0.3, transition: 'height 0.5s ease' }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
            <div style={{ fontSize: 9, color: '#9ca3af', transform: 'rotate(-30deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function SoldierDashboard() {
  const navigate  = useNavigate()
  const user      = useAuthStore(s => s.user)
  const [profile, setProfile]      = useState(null)
  const [equipment, setEquipment]  = useState([])
  const [checkouts, setCheckouts]  = useState([])
  const [requests, setRequests]    = useState([])
  const [loading, setLoading]      = useState(true)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [selectedPass, setSelectedPass] = useState(null)

  const loadData = () => {
    Promise.allSettled([
      api.get('/auth/me'),
      api.get('/equipment'),
      api.get('/checkouts'),
      api.get('/checkouts/requests/my'),
    ]).then(([pRes, eRes, cRes, rRes]) => {
      if (pRes.status === 'fulfilled') setProfile(pRes.value.data?.data)
      if (eRes.status === 'fulfilled') setEquipment(eRes.value.data?.data?.items || eRes.value.data?.data || [])
      if (cRes.status === 'fulfilled') setCheckouts(cRes.value.data?.data?.items || cRes.value.data?.data || [])
      if (rRes.status === 'fulfilled') setRequests(rRes.value.data?.data || [])
      setLoading(false)
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const activeCheckouts = checkouts.filter(c => c.status === 'ACTIVE').length
  const overdueCheckouts = checkouts.filter(c => c.status === 'OVERDUE').length

  // Chart: last 7 checkout activity (mock per day if no data)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const chartData = days.map((label, i) => ({ label, value: checkouts.length > 0 ? Math.floor(Math.random() * 3) : 0 }))

  if (loading) return (
    <div style={{ padding: 32, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 96, background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }} />)}
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {isRequestModalOpen && <RequestEquipmentModal onClose={() => setIsRequestModalOpen(false)} onSuccess={loadData} />}
      
      {selectedPass && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 20, textAlign: 'center', maxWidth: 320, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Equipment Pass</h3>
              <button onClick={() => setSelectedPass(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <QRCode value={JSON.stringify({ requestId: selectedPass.id, type: 'EQUIPMENT_PICKUP' })} size={256} style={{ height: 'auto', maxWidth: '100%', width: '100%' }} />
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 16 }}>Present this code to the armory officer.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>
            My Dashboard
          </h1>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: '4px 0 0' }}>
            {user?.rank} · {user?.unit_name || 'Unit'} · Badge {user?.badge_number || '—'}
          </p>
        </div>
        <button onClick={() => navigate('/incidents')}
          style={{ padding: '10px 18px', background: '#e84c35', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} /> Report Incident
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Assigned Equipment" value={equipment.length} sub="Currently in custody" color="#3b82f6" bg="#eff6ff" icon={<Package size={20} color="#3b82f6" />} />
        <StatCard label="Active Checkouts" value={activeCheckouts} sub="Currently checked out" color="#111827" bg="#f8fafc" icon={<ClipboardCheck size={20} color="#111827" />} />
        <StatCard label="Overdue" value={overdueCheckouts} sub="Past return deadline" color={overdueCheckouts > 0 ? '#dc2626' : '#16a34a'} bg={overdueCheckouts > 0 ? '#fef2f2' : '#f0fdf4'} icon={<AlertTriangle size={20} color={overdueCheckouts > 0 ? '#dc2626' : '#16a34a'} />} />
        <StatCard label="Total Checkouts" value={checkouts.length} sub="All time" color="#111827" bg="#f8fafc" icon={<Activity size={20} color="#9ca3af" />} />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Profile Card */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>My Profile</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em' }}>SOLDIER</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { label: 'Full Name',       value: profile?.full_name       || user?.full_name       || '—' },
                { label: 'Service Number',  value: profile?.service_number  || user?.service_number  || '—' },
                { label: 'Badge Number',    value: profile?.badge_number    || user?.badge_number    || '—' },
                { label: 'Rank',            value: profile?.rank            || user?.rank            || '—' },
                { label: 'Unit',            value: profile?.unit_name       || user?.unit_name       || '—' },
                { label: 'Base',            value: profile?.base_name       || user?.base_name       || '—' },
                { label: 'Sergeant',        value: profile?.sergeant_name   || '—' },
                { label: 'Sgt. Badge',      value: profile?.sergeant_badge  || '—' },
                { label: 'Last Login',      value: profile?.last_login_at   ? new Date(profile.last_login_at).toLocaleDateString() : '—' },
              ].map(f => (
                <div key={f.label} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* My Equipment */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>My Assigned Equipment</span>
              <button onClick={() => navigate('/equipment')} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', fontWeight: 600 }}>
                See all <ChevronRight size={12} />
              </button>
            </div>
            {equipment.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af', fontSize: 13 }}>No equipment assigned</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px', gap: 0, padding: '8px 12px', background: '#f8fafc', borderRadius: '10px 10px 0 0' }}>
                  {['Item', 'Serial Number', 'Category', 'Status'].map(h => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
                  ))}
                </div>
                {equipment.slice(0, 5).map((e, i) => (
                  <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px', gap: 0, padding: '12px 12px', borderBottom: i < equipment.length - 1 ? '1px solid #f8fafc' : 'none', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>{e.serial_number}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{e.category || '—'}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: e.status === 'OPERATIONAL' ? '#16a34a' : '#f59e0b', background: e.status === 'OPERATIONAL' ? '#f0fdf4' : '#fffbeb', padding: '3px 9px', borderRadius: 20 }}>
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Requests */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Pending Requests</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: '#fffbeb', padding: '3px 10px', borderRadius: 20 }}>NEW FEATURE</span>
            </div>
            {requests.filter(r => r.status === 'PENDING' || r.status === 'APPROVED').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 16px 0' }}>No active requests</p>
                <button 
                  onClick={() => setIsRequestModalOpen(true)}
                  style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Request Equipment
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {requests.filter(r => r.status === 'PENDING' || r.status === 'APPROVED').map(r => (
                  <div key={r.id} style={{ padding: '14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: r.status === 'APPROVED' ? '#f0fdf4' : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={16} color={r.status === 'APPROVED' ? '#16a34a' : '#f59e0b'} />
                      </div>
                      <div style={{ display:'flex', gap:10 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:15, fontWeight:700, color:'#111827' }}>{r.category_name}</div>
                          <div style={{ fontSize:13, color:'#9ca3af', marginTop:2 }}>Purpose: {r.purpose} • Return: {new Date(r.expected_return_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>
                        </div>
                        {r.status === 'APPROVED' && (
                          <button 
                            onClick={() => setSelectedPass(r)}
                            style={{ padding:'8px 12px', background:'#0f172a', color:'#fff', borderRadius:10, fontSize:12, fontWeight:700, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
                          >
                            <QrCode size={14} /> Pass
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span style={{ 
                        fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                        background: r.status === 'APPROVED' ? '#16a34a' : '#f59e0b',
                        color: '#fff'
                      }}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout History */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Checkout History</span>
              <button onClick={() => navigate('/checkouts')} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', fontWeight: 600 }}>
                See all <ChevronRight size={12} />
              </button>
            </div>
            {checkouts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af', fontSize: 13 }}>No checkout history</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {checkouts.slice(0, 4).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 14px', background: '#f8fafc', borderRadius: 10 }}>
                    <ClipboardCheck size={15} color="#9ca3af" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.equipment_name || 'Equipment'}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        {c.actual_checkout_at ? new Date(c.actual_checkout_at).toLocaleDateString() : '—'}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.status === 'ACTIVE' ? '#3b82f6' : c.status === 'RETURNED' ? '#16a34a' : '#dc2626', background: c.status === 'ACTIVE' ? '#eff6ff' : c.status === 'RETURNED' ? '#f0fdf4' : '#fef2f2', padding: '3px 10px', borderRadius: 20 }}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Activity Chart */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Activity This Week</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Checkout activity per day</div>
            </div>
            <div style={{ marginTop: 20 }}>
              <StemChart data={chartData} color="#3b82f6" />
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Request Equipment Checkout', icon: <ClipboardCheck size={15} color="#3b82f6" />, bg: '#eff6ff', onClick: () => setIsRequestModalOpen(true) },
                { label: 'View My Location on Map',   icon: <MapPin size={15} color="#9ca3af" />,    bg: '#f8fafc',  onClick: () => navigate('/map') },
                { label: 'Report Incident',           icon: <AlertTriangle size={15} color="#e84c35" />, bg: '#fef2f2', to: '/incidents' },
              ].map(a => (
                <button key={a.label} onClick={a.onClick}
                  style={{ padding: '12px 14px', background: a.bg, border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s', textAlign: 'left' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{a.icon}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>{a.label}</span>
                  <ChevronRight size={13} color="#9ca3af" />
                </button>
              ))}
            </div>
          </div>

          {/* Status Card */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Account Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f0fdf4', borderRadius: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Account Active</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'block' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Clearance Level</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{profile?.clearance_level || 1}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Equipment In Custody</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>{equipment.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
