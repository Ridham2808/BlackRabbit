import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Modal, ScrollView, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QrCode, LogOut, Crosshair, Clipboard, ShieldCheck, ChevronRight, Map, Bell, Activity, User, WifiOff, RefreshCw } from 'lucide-react-native';
import { OfflineQueueContext } from '../context/OfflineQueueContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [approvedRequest, setApprovedRequest] = useState(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const { isOffline, queueCount, isSyncing } = useContext(OfflineQueueContext);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    const checkActive = async () => {
      const stored = await AsyncStorage.getItem('activeTracking');
      if (stored) {
        setActiveSession(JSON.parse(stored));
      } else {
        setActiveSession(null);
      }
      if (profile) fetchRequests();
    };
    const unsubscribe = navigation.addListener('focus', checkActive);
    return unsubscribe;
  }, [navigation, profile]);

  const loadProfile = async () => {
    const data = await AsyncStorage.getItem('soldier_profile');
    if (data) {
      const p = JSON.parse(data);
      setProfile(p);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/checkouts/requests/my');
      const approved = res.data.data?.find(r => r.status === 'APPROVED');
      setApprovedRequest(approved);
    } catch (err) {
      console.log('Sync Error:', err);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('soldier_profile');
    await AsyncStorage.removeItem('auth_token');
    navigation.replace('Login');
  };

  if (!profile) return (
    <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#0f172a'}}>
      <ActivityIndicator color="#10b981" size="large" />
      <Text style={{ color: '#94a3b8', marginTop: 20, letterSpacing: 2, fontSize: 10 }}>SYNCING WITH COMMAND...</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <LinearGradient
        colors={['#1e293b', '#0f172a', '#020617']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          
          {/* Tactical Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                {isSyncing ? (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }]}>
                    <RefreshCw color="#38bdf8" size={12} />
                    <Text style={[styles.statusText, { color: '#38bdf8' }]}>MODE 3 — SYNCING 🔄</Text>
                  </View>
                ) : isOffline ? (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }]}>
                    <WifiOff color="#ef4444" size={12} />
                    <Text style={[styles.statusText, { color: '#ef4444' }]}>MODE 2 — OFFLINE 📵</Text>
                  </View>
                ) : queueCount > 0 ? (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }]}>
                    <Activity color="#f59e0b" size={12} />
                    <Text style={[styles.statusText, { color: '#f59e0b' }]}>MODE 4 — CONFLICT CHECK ⚠️</Text>
                  </View>
                ) : (
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>MODE 1 — ONLINE ✅</Text>
                  </View>
                )}
                <Text style={styles.greeting}>Welcome, {profile.rank}</Text>
                <Text style={styles.userName}>{profile.name.toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <LogOut color="#f87171" size={20} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>MY ASSETS</Text>
                <Text style={styles.statValue}>{activeSession ? (Array.isArray(activeSession) ? activeSession.length : 1) : 0}</Text>
              </View>
              <View style={[styles.statItem, { borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={styles.statLabel}>PENDING SYNC</Text>
                <Text style={[styles.statValue, { color: queueCount > 0 ? '#ef4444' : '#cbd5e1' }]}>{queueCount}</Text>
              </View>
            </View>
          </View>

          <View style={{ padding: 20 }}>
            
            {/* Offline Sync Alert */}
            {queueCount > 0 && (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Sync')}
                style={[styles.activeCard, { marginBottom: 20, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', borderWidth: 1 }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <WifiOff color="#ef4444" size={24} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activeLabel, { color: '#ef4444' }]}>UNSYNCED TRANSACTIONS</Text>
                    <Text style={[styles.activeTitle, { fontSize: 16 }]}>{queueCount} Actions Saved Offline</Text>
                  </View>
                  <ChevronRight color="#ef4444" size={20} />
                </View>
              </TouchableOpacity>
            )}

            {/* Active Operations Section */}
            {activeSession ? (
              <TouchableOpacity 
                onPress={() => navigation.navigate('ActiveTracking', { weapons: Array.isArray(activeSession) ? activeSession : [activeSession] })}
                style={styles.activeCard}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{x:0, y:0}} end={{x:1, y:0}}
                  style={styles.activeGradient}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Activity color="white" size={24} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeLabel}>LIVE TELEMETRY ACTIVE</Text>
                    <Text style={styles.activeTitle}>
                      {activeSession.name || (Array.isArray(activeSession) ? activeSession[0].name : 'Unknown')}
                      {Array.isArray(activeSession) && activeSession.length > 1 ? ` + ${activeSession.length - 1} more` : ''}
                    </Text>
                    {activeSession.id === 'OFFLINE_PENDING' && (
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold' }}>⚠️ STORED LOCALLY</Text>
                    )}
                  </View>
                  <ChevronRight color="white" size={20} />
                </View>
              </TouchableOpacity>
            ) : approvedRequest ? (
              <TouchableOpacity 
                onPress={() => setShowPassModal(true)}
                style={styles.passCard}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Bell color="#38bdf8" size={16} />
                    <Text style={styles.passLabel}>DIGITAL PASS READY</Text>
                  </View>
                  <Text style={styles.passTitle}>{approvedRequest.category_name}</Text>
                </View>
                <QrCode color="white" size={32} />
              </TouchableOpacity>
            ) : (
              <View style={styles.idleCard}>
                <View style={styles.idleIcon}>
                  <Crosshair color="#475569" size={32} />
                </View>
                <Text style={styles.idleTitle}>STANDBY STATUS</Text>
                <Text style={styles.idleDesc}>Scan equipment QR to begin secure handover protocol</Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Scanner')}
                  style={styles.scanBtn}
                >
                  <QrCode color="#0f172a" size={18} />
                  <Text style={styles.scanBtnText}>SELF-SCAN HANDOVER</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Grid Actions */}
            <Text style={styles.sectionHeader}>COMMAND ACTIONS</Text>
            <View style={styles.grid}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Request')}
                style={styles.gridItem}
              >
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                  <Clipboard color="#38bdf8" size={24} />
                </View>
                <Text style={styles.gridTitle}>Request Asset</Text>
                <Text style={styles.gridDesc}>Submit requisition</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => navigation.navigate('ActiveTracking')}
                style={styles.gridItem}
              >
                <View style={[styles.gridIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <Map color="#f59e0b" size={24} />
                </View>
                <Text style={styles.gridTitle}>Live Map</Text>
                <Text style={styles.gridDesc}>Tracking status</Text>
              </TouchableOpacity>

              {(profile.role === 'SERGEANT' || profile.role === 'OFFICER') && (
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Approval')}
                  style={[styles.gridItem, { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 20 }]}
                >
                  <View style={[styles.gridIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <ShieldCheck color="#10b981" size={24} />
                  </View>
                  <View>
                    <Text style={styles.gridTitle}>Authorize Handover</Text>
                    <Text style={styles.gridDesc}>Manage unit equipment requests</Text>
                  </View>
                  <ChevronRight color="#475569" size={20} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              )}
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showPassModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1e293b', '#0f172a']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.modalHeader}>EQUIPMENT RELEASE PASS</Text>
            <Text style={styles.modalSub}>Present this code to the Arsenal Sergeant</Text>
            
            <View style={styles.qrContainer}>
              <QRCode 
                value={JSON.stringify({ requestId: approvedRequest?.id, type: 'EQUIPMENT_PICKUP' })} 
                size={220}
                backgroundColor="transparent"
                color="white"
              />
            </View>

            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoLabel}>IDENTIFIER</Text>
              <Text style={styles.modalInfoValue}>{approvedRequest?.category_name}</Text>
            </View>

            <TouchableOpacity 
              onPress={() => setShowPassModal(false)}
              style={styles.modalClose}
            >
              <Text style={styles.modalCloseText}>CLOSE SECURE PASS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 24,
    paddingTop: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5
  },
  greeting: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600'
  },
  userName: {
    color: 'white',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  logoutBtn: {
    padding: 12,
    backgroundColor: 'rgba(248, 113, 113, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.1)'
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  statItem: {
    flex: 1,
    paddingHorizontal: 12
  },
  statLabel: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4
  },
  statValue: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '800'
  },
  activeCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#10b981',
    shadowOpacity: 0.2,
    shadowRadius: 20
  },
  activeGradient: {
    position: 'absolute',
    inset: 0
  },
  activeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 2
  },
  activeTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900'
  },
  passCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38bdf8',
    elevation: 4
  },
  passLabel: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  passTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900'
  },
  idleCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed'
  },
  idleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(71, 85, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  idleTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2
  },
  idleDesc: {
    color: '#475569',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20
  },
  scanBtn: {
    marginTop: 24,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    gap: 10
  },
  scanBtnText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1
  },
  sectionHeader: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  gridItem: {
    width: '48%',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  gridIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  gridTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800'
  },
  gridDesc: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 40,
    padding: 40,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)'
  },
  modalHeader: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8
  },
  modalSub: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 40
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 40
  },
  modalInfo: {
    alignItems: 'center',
    marginBottom: 40
  },
  modalInfoLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4
  },
  modalInfoValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900'
  },
  modalClose: {
    padding: 20,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.1)'
  },
  modalCloseText: {
    color: '#f87171',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1
  }
});
