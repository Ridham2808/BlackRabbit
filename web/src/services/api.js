import axios from 'axios'
import { useAuthStore } from '../store'
import { WebSyncService } from './WebSyncService'

const api = axios.create({
  baseURL:          '/api',
  withCredentials:  true,
  timeout:          15000,
})

// ── Request interceptor — attach bearer token ─────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor — auto-refresh on 401 ───────────
let isRefreshing = false
let pendingQueue = []

const processPending = (err, token = null) => {
  pendingQueue.forEach(p => err ? p.reject(err) : p.resolve(token))
  pendingQueue = []
}

api.interceptors.response.use(
  (res) => {
    // Offline Support: Cache successful GET requests
    if (res.config.method === 'get') {
      try { localStorage.setItem(`cache:${res.config.url}`, JSON.stringify(res.data)) } catch (e) {}
    }
    return res
  },
  async (err) => {
    const original = err.config

    // Offline Support: Serve cached GET responses on Network Error
    const isNetworkError = !err.response && (err.message === 'Network Error' || err.code === 'ECONNABORTED' || !window.navigator.onLine);
    
    if (isNetworkError) {
      // 1. Handle Offline Login Attempt
      if (original.method === 'post' && original.url.includes('/auth/login')) {
        try {
          const body = typeof original.data === 'string' ? JSON.parse(original.data) : original.data;
          const cachedCreds = JSON.parse(localStorage.getItem('deas_offline_creds') || '{}');
          
          if (cachedCreds.sn === body.serviceNumber && cachedCreds.p === body.password) {
            console.warn('[OFFLINE] Simulated Login SUCCESS');
            return Promise.resolve({
              data: cachedCreds.response, // cached in WebSyncService during online login
              status: 200,
              statusText: 'OK (Offline)'
            });
          }
        } catch (e) { console.error('Offline login emulation failed', e); }
      }

      // 2. Handle GET Cache with Fuzzy Matching
      if (original.method === 'get') {
        try {
          let cached = localStorage.getItem(`cache:${original.url}`)
          
          // Fuzzy Fallback: if "/equipment?limit=1000" fails, try "/equipment"
          if (!cached && original.url.includes('?')) {
            const baseUrl = original.url.split('?')[0];
            cached = localStorage.getItem(`cache:${baseUrl}`);
            if (cached) console.warn(`[OFFLINE] Fuzzy match found for ${baseUrl}`);
          }

          if (cached) {
            console.warn(`[OFFLINE] Serving cached data for ${original.url}`);
            return Promise.resolve({
              data: JSON.parse(cached),
              status: 200,
              statusText: 'OK (Cached)',
              headers: {},
              config: original,
              _isCached: true
            })
          }
        } catch (e) {}
      } else if (['post', 'put', 'patch', 'delete'].includes(original.method)) {
        // Enqueue offline action for writes
        let type = 'UNKNOWN'
        if (original.url.includes('/checkouts') && original.method === 'post') type = 'CHECKOUT'
        else if (original.url.includes('/checkin') || original.url.includes('/check-in')) type = 'CHECKIN'
        else if (original.url.includes('/incidents')) type = 'INCIDENT'
        else type = `SYNC_${original.method.toUpperCase()}`
        
        await WebSyncService.enqueueAction(type, original.data ? (typeof original.data === 'string' ? JSON.parse(original.data) : original.data) : {})
        return Promise.resolve({ data: { success: true, _queued: true, message: 'Saved offline' }, status: 202 })
      }
    }
    if (err.response?.status === 401 && !original._retry) {
      if (err.response.data?.code === 'TOKEN_EXPIRED') {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            pendingQueue.push({ resolve, reject })
          }).then(token => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
          })
        }

        original._retry = true
        isRefreshing = true

        try {
          const { sessionId } = useAuthStore.getState()
          const { data } = await axios.post('/api/auth/refresh', { sessionId }, { withCredentials: true })
          const newToken = data.data.accessToken
          useAuthStore.getState().updateToken(newToken)
          processPending(null, newToken)
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        } catch (refreshErr) {
          processPending(refreshErr, null)
          // DO NOT auto-logout. Let the UI handle 401s gracefully, allowing users to manually logout if needed.
          // Or wait for the session to be truly confirmed dead by a manual user action.
          return Promise.reject(refreshErr)
        } finally {
          isRefreshing = false
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
