import React, { createContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { SyncService } from '../services/SyncService';

export const OfflineQueueContext = createContext();

export const OfflineQueueProvider = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadQueue = async () => {
    const q = await SyncService.getQueue();
    setQueueCount(q.length);
  };

  useEffect(() => {
    loadQueue();
    
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      
      if (state.isConnected && queueCount > 0 && !isSyncing) {
        handleSync();
      }
    });

    return () => unsubscribe();
  }, [queueCount]);

  const handleSync = async () => {
    if (isOffline) return;
    setIsSyncing(true);
    try {
      await SyncService.processQueue();
      await loadQueue();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineQueueContext.Provider value={{ isOffline, queueCount, isSyncing, loadQueue, handleSync }}>
      {children}
    </OfflineQueueContext.Provider>
  );
};
