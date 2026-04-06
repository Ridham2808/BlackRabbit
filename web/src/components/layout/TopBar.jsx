import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Search, Bell, Settings, Shield, LogOut, ChevronDown, WifiOff, RefreshCw, ShieldCheck } from 'lucide-react'
import { useAuthStore, useAlertStore } from '../../store'
import { useState, useRef, useEffect } from 'react'
import { WebSyncService } from '../../services/WebSyncService'

// Role-specific nav links
const NAV_BY_ROLE = {
  OFFICER: [
    { to: '/dashboard',   label: 'Dashboard'   },
    { to: '/personnel',   label: 'Personnel'   },
    { to: '/equipment',   label: 'Equipment'   },
    { to: '/checkouts',   label: 'Checkouts'   },
    { to: '/map',         label: 'Live Map'    },
    { to: '/incidents',   label: 'Incidents'   },
    { to: '/audit',       label: 'Audit'       },
    { to: '/reports',     label: 'Reports'     },
    { to: '/admin',       label: 'Admin Panel' },
  ],
  SERGEANT: [
    { to: '/dashboard',   label: 'Dashboard'   },
    { to: '/equipment',   label: 'Inventory'   },
    { to: '/checkouts',   label: 'Requests'    },
    { to: '/map',         label: 'Unit Map'    },
    { to: '/maintenance', label: 'Maintenance' },
    { to: '/reports',     label: 'Reports'     },
  ],
  SOLDIER: [
    { to: '/dashboard',   label: 'My Profile'  },
    { to: '/equipment',   label: 'My Gear'     },
    { to: '/checkouts',   label: 'Checkouts'   },
    { to: '/map',         label: 'My Location' },
    { to: '/incidents',   label: 'Report'      },
  ],
  BASE_ADMIN:    [{ to: '/dashboard', label: 'Dashboard' }, { to: '/equipment', label: 'Equipment' }, { to: '/personnel', label: 'Personnel' }, { to: '/admin', label: 'Admin' }],
  SUPER_ADMIN:   [{ to: '/dashboard', label: 'Dashboard' }, { to: '/equipment', label: 'Equipment' }, { to: '/personnel', label: 'Personnel' }, { to: '/admin', label: 'Admin' }, { to: '/audit', label: 'Audit' }],
  QUARTERMASTER: [{ to: '/dashboard', label: 'Dashboard' }, { to: '/equipment', label: 'Equipment' }, { to: '/checkouts', label: 'Checkouts' }, { to: '/maintenance', label: 'Maintenance' }],
}

const ROLE_BADGE = {
  OFFICER:  { label: 'Officer',  color: '#e84c35', bg: '#fef2f2' },
  SERGEANT: { label: 'Sergeant', color: '#f59e0b', bg: '#fffbeb' },
  SOLDIER:  { label: 'Soldier',  color: '#3b82f6', bg: '#eff6ff' },
}

export default function TopBar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const user      = useAuthStore(s => s.user)
  const logout    = useAuthStore(s => s.logout)
  const unread    = useAlertStore(s => s.unreadCount)
  const [q, setQ] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const role  = user?.role || 'SOLDIER'
  const links = NAV_BY_ROLE[role] || NAV_BY_ROLE.OFFICER
  const badge = ROLE_BADGE[role]

  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [offlineCount, setOfflineCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [cacheReady, setCacheReady] = useState(!!localStorage.getItem('last_cache_sync'))

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    const updateOfflineCount = async () => setOfflineCount((await WebSyncService.getQueue()).length)
    const handleOnline = () => { setIsOffline(false); handleForceSync() }
    const handleOffline = () => setIsOffline(true)
    const handleCacheReady = () => setCacheReady(true)
    
    document.addEventListener('mousedown', handler)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('offline-queue-updated', updateOfflineCount)
    window.addEventListener('offline-cache-ready', handleCacheReady)
    
    updateOfflineCount()
    WebSyncService.prefetchData() 

    return () => {
      document.removeEventListener('mousedown', handler)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('offline-queue-updated', updateOfflineCount)
      window.removeEventListener('offline-cache-ready', handleCacheReady)
    }
  }, [])

  const handleForceSync = async () => {
    setIsSyncing(true)
    await WebSyncService.processQueue()
    const finalCount = (await WebSyncService.getQueue()).length
    setOfflineCount(finalCount)
    setIsSyncing(false)
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter' && q.trim()) {
      navigate(`/equipment?search=${encodeURIComponent(q.trim())}`)
      setQ('')
    }
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'US'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        .topbar-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

        .topbar-nav-link {
          font-size: 13.5px;
          font-weight: 400;
          text-decoration: none;
          white-space: nowrap;
          color: #9ca3af;
          padding: 4px 13px;
          border-bottom: 2.5px solid transparent;
          transition: color 0.15s, border-color 0.15s;
          cursor: pointer;
          line-height: 58px;
        }
        .topbar-nav-link.active {
          font-weight: 600;
          color: #111827;
          border-bottom-color: #111827;
        }
        .topbar-nav-link:hover:not(.active) { color: #374151; }

        .topbar-icon-btn {
          padding: 7px; border-radius: 9px;
          display: flex; cursor: pointer;
          transition: background 0.15s;
          background: transparent;
        }
        .topbar-icon-btn:hover { background: #f3f5f9; }

        .topbar-profile-btn {
          display: flex; align-items: center; gap: 9px;
          background: transparent; border: none; cursor: pointer;
          padding: 5px 8px; border-radius: 12px;
          transition: background 0.15s; font-family: 'DM Sans', sans-serif;
        }
        .topbar-profile-btn:hover { background: #f3f5f9; }

        .topbar-dropdown-item {
          width: 100%; padding: 9px 13px; background: none; border: none;
          cursor: pointer; text-align: left; font-size: 13px; color: #374151;
          border-radius: 9px; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; gap: 9px; transition: background 0.15s;
        }
        .topbar-dropdown-item:hover { background: #f3f5f9; }
        .topbar-dropdown-item.danger { color: #dc2626; }
        .topbar-dropdown-item.danger:hover { background: #fef2f2; }
      `}</style>

      <div className="topbar-root">
        <nav style={{
          background: '#ffffff',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          padding: '0 30px',
          borderBottom: '1px solid #edf0f7',
          boxShadow: '0 1px 4px rgba(0,0,0,0.045)',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>

          {/* ── Logo ── */}
          <div
            onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 34, flexShrink: 0, cursor: 'pointer' }}
          >
            <div style={{
              width: 35, height: 35, borderRadius: '50%',
              background: '#e84c35',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#111827', letterSpacing: '-0.5px' }}>
              DEAS
            </span>
          </div>

          {/* ── Nav Links ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            overflow: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none',
          }}>
            {links.map(link => {
              const act = location.pathname === link.to
                || (link.to !== '/dashboard' && location.pathname.startsWith(link.to))
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`topbar-nav-link${act ? ' active' : ''}`}
                >
                  {link.label}
                </NavLink>
              )
            })}
          </div>

          <div style={{ flex: 1 }} />

          {/* ── Search ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#f3f5f9', border: '1px solid #e8ecf3',
            borderRadius: 11, padding: '7px 14px',
            width: 220, marginRight: 14,
            transition: 'border-color .2s',
          }}>
            <Search size={13} color="#b0bac8" style={{ flexShrink: 0 }} />
            <input
              placeholder="Enter your search request..."
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={handleSearch}
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: 12.5, color: '#374151', width: '100%',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
          </div>

          {/* ── Offline Indicators ── */}
          {isOffline && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fef2f2', border: '1px solid #fee2e2',
              borderRadius: 20, padding: '4px 10px',
              marginRight: 14,
            }}>
              <WifiOff size={14} color="#ef4444" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Offline</span>
            </div>
          )}

          {offlineCount > 0 && (
            <button 
              onClick={() => isOffline ? alert('Wait for internet connection to sync.') : handleForceSync()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 20, padding: '4px 10px',
                marginRight: 14, cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} color="#3b82f6" className={isSyncing ? 'animate-spin' : ''} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>{offlineCount} Pending Sync</span>
            </button>
          )}

          {!isOffline && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: cacheReady ? '#f0fdf4' : '#fffbeb', 
              border: `1px solid ${cacheReady ? '#dcfce7' : '#fef3c7'}`,
              borderRadius: 20, padding: '4px 10px',
              marginRight: 14,
            }}>
              {cacheReady ? <ShieldCheck size={14} color="#10b981" /> : <RefreshCw size={14} color="#f59e0b" className="animate-spin" />}
              <span style={{ fontSize: 10, fontWeight: 700, color: cacheReady ? '#10b981' : '#f59e0b', textTransform: 'uppercase' }}>
                {cacheReady ? 'Mission Cache Ready' : 'Caching Mission Data...'}
              </span>
            </div>
          )}

          {/* ── Icon Buttons ── */}
          {/* Clock / Timer */}
          <div className="topbar-icon-btn" style={{ marginRight: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>

          {/* Bell */}
          <div
            className="topbar-icon-btn"
            onClick={() => navigate('/alerts')}
            title="Alerts"
            style={{ position: 'relative', marginRight: 10 }}
          >
            <Bell size={18} color="#9ca3af" />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 3, right: 3,
                background: '#e84c35', color: '#fff',
                borderRadius: '50%', width: 14, height: 14,
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>

          {/* ── Profile Dropdown ── */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              className="topbar-profile-btn"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>
                {initials}
              </div>
              <ChevronDown
                size={13} color="#b0bac8"
                style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </button>

            {profileOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: '#fff', borderRadius: 16,
                border: '1px solid #edf0f7',
                boxShadow: '0 8px 28px rgba(0,0,0,0.09)',
                width: 228, padding: 8, zIndex: 200,
              }}>
                {/* User info header */}
                <div style={{ padding: '10px 13px 13px', borderBottom: '1px solid #f1f5f9', marginBottom: 6 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{user?.full_name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{user?.service_number}</div>
                  {badge && (
                    <span style={{
                      display: 'inline-block', marginTop: 7,
                      fontSize: 10, fontWeight: 700,
                      color: badge.color, background: badge.bg,
                      padding: '3px 9px', borderRadius: 20,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {badge.label} {user?.badge_number ? `· ${user.badge_number}` : ''}
                    </span>
                  )}
                </div>

                {role === 'OFFICER' && (
                  <button
                    className="topbar-dropdown-item"
                    onClick={() => { navigate('/admin'); setProfileOpen(false) }}
                  >
                    <Settings size={14} color="#9ca3af" /> Admin Panel
                  </button>
                )}
                <button
                  className="topbar-dropdown-item danger"
                  onClick={() => { logout(); setProfileOpen(false) }}
                >
                  <LogOut size={14} color="#dc2626" /> Logout
                </button>
              </div>
            )}
          </div>

        </nav>
      </div>
    </>
  )
}