import { create } from 'zustand'

// Synchronous direct load from localStorage
const loadAuth = () => {
  try {
    const raw = localStorage.getItem('deas-auth')
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed.state || parsed // support both legacy and persist wrappers
    }
  } catch (e) {
    console.error('Failed to parse deas-auth', e)
  }
  return { user: null, accessToken: null, sessionId: null, permissions: [], isAuth: false }
}

const saveAuth = (state) => {
  try {
    localStorage.setItem('deas-auth', JSON.stringify({
      state: {
        user: state.user,
        accessToken: state.accessToken,
        sessionId: state.sessionId,
        permissions: state.permissions,
        isAuth: state.isAuth,
      }
    }))
  } catch (e) {}
}

const initialState = loadAuth()

export const useAuthStore = create((set, get) => ({
  ...initialState,

  // ── Computed helpers ──────────────────────────────────
  get role()       { return get().user?.role || null },
  get badgeNumber(){ return get().user?.badge_number || null },
  isRole: (r)      => get().user?.role === r,
  get isOfficer()  { return get().user?.role === 'OFFICER' },
  get isSergeant() { return get().user?.role === 'SERGEANT' },
  get isSoldier()  { return get().user?.role === 'SOLDIER' },
  hasPermission: (p) => get().permissions?.includes(p),

  setAuth: ({ personnel, accessToken, sessionId, permissions }) => {
    const nextState = { user: personnel, accessToken, sessionId, permissions, isAuth: true }
    set(nextState)
    saveAuth(nextState)
  },

  logout: () => {
    const { accessToken, sessionId } = get()
    if (accessToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {})
    }
    const emptyState = { user: null, accessToken: null, sessionId: null, permissions: [], isAuth: false }
    set(emptyState)
    localStorage.removeItem('deas-auth')
    window.location.href = '/login'
  },

  updateToken: (accessToken) => {
    set({ accessToken })
    saveAuth(get())
  },
}))

export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar:    () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  activeModal: null,
  openModal:   (name, data = null) => set({ activeModal: { name, data } }),
  closeModal:  () => set({ activeModal: null }),
}))

export const useAlertStore = create((set) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: n }),
  incrementUnread: () => set(s => ({ unreadCount: s.unreadCount + 1 })),
}))
