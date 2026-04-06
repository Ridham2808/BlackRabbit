import api from './api';
import toast from 'react-hot-toast';

const QUEUE_KEY = 'deas_web_offline_queue';

export class WebSyncService {
  static async getQueue() {
    try {
      const q = localStorage.getItem(QUEUE_KEY);
      return q ? JSON.parse(q) : [];
    } catch {
      return [];
    }
  }

  static async enqueueAction(type, payload) {
    try {
      const queue = await this.getQueue();
      const newAction = {
        id: Date.now().toString(),
        type,
        payload: { ...payload, offline_timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString()
      };
      
      queue.push(newAction);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      window.dispatchEvent(new Event('offline-queue-updated'));
      toast('Action saved offline. Will sync when connected.', { icon: '📵' });
      return newAction;
    } catch (e) {
      console.error('Failed to enqueue action', e);
    }
  }

  static async prefetchData() {
    if (!navigator.onLine) return;
    try {
      const endpoints = [
        '/personnel',
        '/equipment',
        '/equipment?limit=1000',
        '/checkouts',
        '/checkouts/mine',
        '/incidents',
        '/location/latest'
      ];
      
      console.log('[OFFLINE] Starting mission data pre-fetch...');
      for (const url of endpoints) {
        try {
          const res = await api.get(url);
          localStorage.setItem(`cache:${url}`, JSON.stringify(res.data));
          
          // Also cache the base URL if it's a query param variant
          if (url.includes('?')) {
            const baseUrl = url.split('?')[0];
            localStorage.setItem(`cache:${baseUrl}`, JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn(`[OFFLINE] Specific pre-fetch failed for ${url}`, err.message);
        }
      }
      
      localStorage.setItem('last_cache_sync', new Date().toISOString());
      console.log('[OFFLINE] Mission data cached successfully.');
      window.dispatchEvent(new Event('offline-cache-ready'));
    } catch (e) {
      console.warn('[OFFLINE] Pre-fetch critical failure', e);
    }
  }

  static cacheCredentials(sn, password, loginResponse) {
    localStorage.setItem('deas_offline_creds', JSON.stringify({
      sn,
      p: password,
      response: loginResponse,
      timestamp: new Date().toISOString()
    }));
  }

  static async processQueue() {
    const queue = await this.getQueue();
    if (!queue.length) return;

    let successCount = 0;
    const failedQueue = [];

    const tid = toast.loading(`Syncing ${queue.length} offline actions...`);

    for (const action of queue) {
      try {
        if (action.type === 'CHECKOUT') {
           await api.post('/checkouts', action.payload);
        } else if (action.type === 'CHECKIN') {
           const id = action.payload.checkoutId;
           await api.put(`/checkouts/${id}/check-in`, action.payload);
        } else if (action.type === 'INCIDENT') {
           await api.post('/incidents', action.payload);
        } else {
           // Generic fallback for SYNC_POST, etc.
           const method = action.type.split('_')[1]?.toLowerCase() || 'post';
           const url = action.type.split('_').slice(2).join('/') || '/sync';
           await api[method](url, action.payload);
        }
        successCount++;
      } catch (err) {
        if (err.response?.status === 409 || err.response?.status === 400) {
           console.warn('Sync conflict/error:', err.response.data.message);
           // Discard on conflict to prevent loop? Or keep for manual fix?
           // For now, we'll discard user-errors after alerting
           toast.error(`Sync Conflict: ${err.response.data.message}`);
        } else {
           failedQueue.push(action);
        }
      }
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(failedQueue));
    window.dispatchEvent(new Event('offline-queue-updated'));

    toast.dismiss(tid);
    if (successCount > 0) toast.success(`Synced ${successCount} items to server!`);
    if (failedQueue.length > 0) toast.error(`Failed to sync ${failedQueue.length} items.`);
  }
}
