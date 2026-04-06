import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const QUEUE_KEY = '@offline_sync_queue';

export const SyncService = {
  async enqueueAction(type, payload) {
    try {
      const currentQueue = await this.getQueue();
      const action = {
        id: Date.now().toString(),
        type,
        payload: { 
          offline_timestamp: new Date().toISOString(),
          ...payload 
        },
        createdAt: new Date().toISOString()
      };
      currentQueue.push(action);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(currentQueue));
      return action;
    } catch (e) {
      console.error("Failed to enqueue action", e);
    }
  },

  async getQueue() {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async clearQueue() {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },

  async removeAction(id) {
    const queue = await this.getQueue();
    const updated = queue.filter(a => a.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  },

  async processQueue() {
    const queue = await this.getQueue();
    if (queue.length === 0) return { success: true, processed: 0 };

    try {
      const actions = queue.map(q => ({
        type: q.type,
        payload: q.payload
      }));

      const res = await api.post('/sync/process', { actions });
      if (res.data.success) {
        await this.clearQueue();
        return res.data;
      }
    } catch (e) {
      console.error("Sync process failed", e);
      throw e;
    }
  }
};
