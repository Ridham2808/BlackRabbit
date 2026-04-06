import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store'
import { WebSyncService } from '../services/WebSyncService'
import api from '../services/api'
import { Shield, Eye, EyeOff, Lock, User, AlertCircle, Loader2, ChevronRight, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const DEMO_ROLES = [
  { role: 'OFFICER',  label: 'Officer',  tag: 'Full Command Access', color: '#e84c35', serviceNumber: 'IND-2024-0004', pass: 'Deas@2024!' },
  { role: 'SERGEANT', label: 'Sergeant', tag: 'Unit Management',      color: '#f59e0b', serviceNumber: 'IND-2024-SGT1', pass: 'Deas@2024!' },
  { role: 'SOLDIER',  label: 'Soldier',  tag: 'Personal Access',      color: '#3b82f6', serviceNumber: 'IND-2024-0011', pass: 'Deas@2024!' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, isAuth } = useAuthStore()
  const [serviceNumber, setServiceNumber] = useState('')
  const [password, setPassword]           = useState('')
  const [showPw, setShowPw]               = useState(false)
  const [loading, setLoading]             = useState(false)
  const [demoLoading, setDemoLoading]     = useState(null)
  const [error, setError]                 = useState('')

  useEffect(() => { if (isAuth) navigate('/dashboard') }, [isAuth, navigate])

  const doLogin = async (sn, pw) => {
    const { data } = await api.post('/auth/login', { serviceNumber: sn, password: pw })
    const d = data.data
    
    // Cache for offline verification
    WebSyncService.cacheCredentials(sn, pw, data);

    setAuth({ personnel: d.personnel, accessToken: d.accessToken, sessionId: d.sessionId, permissions: d.permissions })
    toast.success(`Welcome, ${d.personnel.rank} ${d.personnel.full_name}`)
    navigate('/dashboard')
  }

  const onSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await doLogin(serviceNumber, password) }
    catch (err) { const m = err.response?.data?.message || 'Authentication failed'; setError(m); toast.error(m) }
    finally { setLoading(false) }
  }

  const handleDemo = async (item) => {
    setError(''); setDemoLoading(item.role)
    try { await doLogin(item.serviceNumber, item.pass) }
    catch (err) { const m = err.response?.data?.message || 'Demo login failed'; setError(m); toast.error(m) }
    finally { setDemoLoading(null) }
  }

  if (isAuth) return null

  return (
    <div style={{ minHeight: '100vh', background: '#dce3ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>

        {/* LEFT — Branding Panel */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e84c35', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#111827', letterSpacing: '-0.3px' }}>DEAS</div>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Defence System</div>
            </div>
          </div>

          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111827', margin: '0 0 10px', letterSpacing: '-1px', lineHeight: 1.15 }}>
              Equipment<br />Accountability<br />System
            </h1>
            <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, margin: 0 }}>
              Secure role-based access for Officers, Sergeants, and Soldiers. Track equipment across all units in real-time.
            </p>
          </div>

          {/* Role cards preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DEMO_ROLES.map(r => (
              <div key={r.role} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.tag}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: r.color, background: r.color + '15', padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {r.role}
                </span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: '#d1d5db', fontWeight: 600, letterSpacing: '0.1em' }}>
            SYSTEM V1.5 // DEAS-NET // [SECURED]
          </div>
        </div>

        {/* RIGHT — Login Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Login Card */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.5px' }}>Authenticate Access</h2>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 24px' }}>Enter your service credentials to continue</p>

            {error && (
              <div style={{ padding: '11px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Service Number</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="#9ca3af" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="text" value={serviceNumber} onChange={e => setServiceNumber(e.target.value)}
                    placeholder="IND-2024-XXXX" required
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '11px 14px 11px 38px', fontSize: 14, color: '#111827', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = '#e84c35'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#9ca3af" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••" required
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '11px 40px 11px 38px', fontSize: 14, color: '#111827', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = '#e84c35'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{ padding: '12px', background: '#111827', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1, transition: 'all 0.2s', marginTop: 4 }}
                onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#1f2937' }}
                onMouseOut={e => e.currentTarget.style.background = '#111827'}
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Verifying...</> : <>Authenticate <ChevronRight size={14} /></>}
              </button>
            </form>
          </div>

          {/* Demo Access Card */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Quick Demo Access</span>
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, background: '#f1f5f9', padding: '3px 8px', borderRadius: 20 }}>DEMO</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_ROLES.map(item => {
                const isLoading = demoLoading === item.role
                return (
                  <button key={item.role} onClick={() => handleDemo(item)} disabled={demoLoading !== null}
                    style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, cursor: demoLoading !== null ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, opacity: demoLoading !== null && !isLoading ? 0.5 : 1, transition: 'all 0.15s' }}
                    onMouseOver={e => { if (!demoLoading) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = item.color + '60' }}}
                    onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Demo {item.label}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{item.serviceNumber}</div>
                    </div>
                    {isLoading ? <Loader2 size={13} color={item.color} className="animate-spin" /> : <ChevronRight size={13} color="#9ca3af" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Officer Register */}
          <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
            New Officer?{' '}
            <Link to="/officer-signup" style={{ color: '#e84c35', fontWeight: 700, textDecoration: 'none' }}>
              Register with secret code →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
