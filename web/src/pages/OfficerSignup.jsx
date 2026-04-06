import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store'
import api from '../services/api'
import { Shield, Eye, EyeOff, Lock, User, Mail, Key, ChevronRight, AlertCircle, Loader2, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OfficerSignup() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    secretCode: '', phone: '', rank: 'Lieutenant', baseId: '', unitId: '',
  })
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [bases, setBases]       = useState([])
  const [units, setUnits]       = useState([])

  useEffect(() => {
    api.get('/auth/bases').then(r => setBases(r.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.baseId) return setUnits([])
    api.get(`/auth/units?baseId=${form.baseId}`).then(r => setUnits(r.data.data || [])).catch(() => {})
  }, [form.baseId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match')
    if (form.password.length < 8) return setError('Password must be at least 8 characters')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/officer-signup', {
        fullName:   form.fullName,
        email:      form.email,
        password:   form.password,
        secretCode: form.secretCode,
        phone:      form.phone,
        rank:       form.rank,
        baseId:     form.baseId,
        unitId:     form.unitId || undefined,
      })
      const d = data.data
      setAuth({ personnel: d.personnel, accessToken: d.accessToken, sessionId: d.sessionId, permissions: d.permissions })
      toast.success(`Officer account created! Welcome, ${d.personnel.rank} ${d.personnel.full_name}`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 10, padding: '11px 14px 11px 40px', color: '#111827', fontSize: 14,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const focusStyle = (e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }
  const blurStyle  = (e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#dce3ea', fontFamily: 'DM Sans, sans-serif', padding: '24px 20px',
    }}>
      <div style={{
        position: 'relative', width: '100%', maxWidth: 520,
        background: '#fff', borderRadius: 24, padding: '40px 36px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#fef2f2', border: '2px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={32} color="#dc2626" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Officer Registration</h1>
          <p style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '6px 0 0', fontWeight: 600 }}>
            Requires Secret Authorization Code
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Full Name *</label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Col. Arjun Sharma" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Email *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="officer@deas.mil" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>

          {/* Rank + Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Rank</label>
              <select value={form.rank} onChange={e => set('rank', e.target.value)}
                style={{ ...inputStyle, paddingLeft: 14, cursor: 'pointer' }}>
                {['Private', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain', 'Major', 'Colonel', 'General'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91-XXXXXXXXXX"
                style={{ ...inputStyle, paddingLeft: 14 }} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>

          {/* Base + Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Base *</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <select value={form.baseId} onChange={e => set('baseId', e.target.value)} required
                  style={{ ...inputStyle, paddingLeft: 36, cursor: 'pointer' }}>
                  <option value="">Select Base</option>
                  {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Unit</label>
              <select value={form.unitId} onChange={e => set('unitId', e.target.value)} disabled={!form.baseId}
                style={{ ...inputStyle, paddingLeft: 14, cursor: form.baseId ? 'pointer' : 'not-allowed', opacity: form.baseId ? 1 : 0.5 }}>
                <option value="">All Units</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 chars" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Confirm *</label>
              <input type={showPw ? 'text' : 'password'} value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Repeat password" required
                style={{ ...inputStyle, paddingLeft: 14 }} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#9ca3af' }}>
            <input type="checkbox" onChange={e => setShowPw(e.target.checked)} style={{ cursor: 'pointer' }} />
            Show passwords
          </label>

          {/* Secret Code */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              🛡 Officer Secret Code *
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={16} color="#dc2626" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="password" value={form.secretCode} onChange={e => set('secretCode', e.target.value)} placeholder="Authorized code only" required
                style={{ ...inputStyle, borderColor: '#fecaca' }}
                onFocus={e => { e.target.style.borderColor = '#dc2626'; e.target.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#fecaca'; e.target.style.boxShadow = 'none' }} />
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>Obtain this code from your commanding officer.</p>
          </div>

          <button type="submit" disabled={loading}
            style={{
              padding: '13px', background: '#111827', border: 'none',
              borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.7 : 1, marginTop: 4,
            }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Creating Account...</> : <>Create Officer Account <ChevronRight size={15} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login" style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none' }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
