import { useNavigate } from 'react-router-dom'
import { Shield, Home } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#dce3ea',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        textAlign: 'center', maxWidth: 480,
        background: '#fff', borderRadius: 24, padding: '60px 48px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)',
      }}>
        {/* Shield icon */}
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: '#fef2f2', border: '2px solid #fee2e2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px',
          animation: 'pulse404 2s infinite',
        }}>
          <Shield size={40} color="#dc2626" strokeWidth={1.5} />
        </div>

        <p style={{
          margin: '0 0 8px', fontSize: 88, fontWeight: 900, lineHeight: 1,
          color: 'transparent',
          backgroundImage: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-4px',
        }}>404</p>

        <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800, color: '#111827' }}>
          Route Not Found
        </h1>

        <p style={{ margin: '0 0 36px', fontSize: 14, color: '#9ca3af', lineHeight: 1.7 }}>
          The requested resource does not exist or you lack sufficient clearance level to access it.
          All access attempts are logged and monitored.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '11px 24px', cursor: 'pointer',
              color: '#374151', fontSize: 14, fontWeight: 600,
              transition: 'all 0.15s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#111827', border: 'none',
              borderRadius: 10, padding: '11px 24px', cursor: 'pointer',
              color: '#fff', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'opacity 0.15s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.85}
            onMouseLeave={e => e.currentTarget.style.opacity = 1}
          >
            <Home size={16} /> Return to Dashboard
          </button>
        </div>

        <p style={{ marginTop: 40, fontSize: 11, color: '#d1d5db', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
          Defence Equipment Accountability System — Access Log Active
        </p>
      </div>

      <style>{`
        @keyframes pulse404 {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.1); }
          50%       { box-shadow: 0 0 0 10px rgba(220,38,38,0); }
        }
      `}</style>
    </div>
  )
}
