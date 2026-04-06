import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RefreshCw, Wifi, WifiOff, Clock, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OfflineQueueContext } from '../context/OfflineQueueContext';
import { SyncService } from '../services/SyncService';

export default function SyncStatusScreen() {
  const { isOffline, queueCount, isSyncing, handleSync, loadQueue } = useContext(OfflineQueueContext);
  const [queue, setQueue] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, [queueCount]);

  const fetchQueue = async () => {
    const q = await SyncService.getQueue();
    setQueue(q || []);
  };

  const onForceSync = async () => {
    if (isOffline) {
      alert("Wait for internet connection to sync.");
      return;
    }
    setLocalLoading(true);
    await handleSync();
    setLocalLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SYNC CONTROL</Text>
          <View style={[styles.statusBox, { backgroundColor: isOffline ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
            {isOffline ? <WifiOff size={16} color="#ef4444" /> : <Wifi size={16} color="#10b981" />}
            <Text style={[styles.statusText, { color: isOffline ? '#ef4444' : '#10b981' }]}>
              {isOffline ? 'OFFLINE 📵' : 'ONLINE ✅'}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24 }}>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>PENDING</Text>
              <Text style={[styles.statValue, { color: queueCount > 0 ? '#f59e0b' : '#94a3b8' }]}>{queueCount}</Text>
            </View>
            <View style={[styles.statItem, { borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={styles.statLabel}>COMPLETED</Text>
              <Text style={styles.statValue}>---</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>PENDING TRANSACTIONS</Text>
          
          {queue.length === 0 ? (
            <View style={styles.emptyBox}>
              <CheckCircle2 color="#10b981" size={40} style={{ opacity: 0.5, marginBottom: 16 }} />
              <Text style={styles.emptyText}>All transactions are synchronized.</Text>
            </View>
          ) : (
            queue.map(item => (
              <View key={item.id} style={styles.queueItem}>
                <View style={styles.itemIcon}>
                  <Clock color="#f59e0b" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.type} — {item.payload.equipment_name || 'Asset ID: ' + item.payload.equipment_id.slice(0,8)}</Text>
                  <Text style={styles.itemSub}>{new Date(item.createdAt).toLocaleTimeString()} — Waiting for network</Text>
                </View>
                <AlertTriangle color="#f59e0b" size={16} />
              </View>
            ))
          )}

          <TouchableOpacity 
            onPress={onForceSync}
            disabled={isSyncing || localLoading}
            style={[styles.syncBtn, (isSyncing || localLoading) && { opacity: 0.7 }]}
          >
            {(isSyncing || localLoading) ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <>
                <RefreshCw size={18} color="#0f172a" />
                <Text style={styles.syncBtnText}>RESTORE COMMAND LINK</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.securityNotice}>
             <Text style={styles.noticeText}>
               Transactions are locally encrypted and will be verified by the command server upon reconnection.
             </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900'
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900'
  },
  sectionTitle: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.2)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    gap: 16
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800'
  },
  itemSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.1)',
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    borderStyle: 'dashed'
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center'
  },
  syncBtn: {
    backgroundColor: '#38bdf8',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    gap: 12,
    marginTop: 20,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4
  },
  syncBtnText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1
  },
  securityNotice: {
    marginTop: 32,
    padding: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  noticeText: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18
  }
});
