import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, ScrollView, Platform, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Check, X, ShieldAlert, Navigation, PenTool, ClipboardCheck, QrCode, ShieldCheck, Database, Target, WifiOff, Lock } from 'lucide-react-native';
import SignatureScreen from 'react-native-signature-canvas';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { OfflineQueueContext } from '../context/OfflineQueueContext';
import { SyncService } from '../services/SyncService';
import { SecurityService } from '../services/SecurityService';

export default function WeaponConfirmScreen({ route, navigation }) {
  const { equipment: initialEquipment, request: initialRequest, mode } = route.params;
  
  const [equipment, setEquipment] = useState(initialEquipment);
  const [request, setRequest] = useState(initialRequest);
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accuracy, setAccuracy] = useState('SYNCING...');
  const [coords, setCoords] = useState(null);
  const [signature, setSignature] = useState(null);
  const [showSig, setShowSig] = useState(false);
  const { isOffline, loadQueue } = useContext(OfflineQueueContext);
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('soldier_profile').then(data => {
      if (data) setProfile(JSON.parse(data));
    });

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
          setAccuracy(`±${Math.round(location.coords.accuracy)}m`);
        } catch (e) { setAccuracy('UNAVAILABLE'); }
      }
    })();
  }, []);

  const handleConfirm = async () => {
    if (mode === 'CHECKOUT' && !initialEquipment) {
      return Alert.alert("Pairing Required", "Please scan the asset QR on the physical equipment to verify the match.");
    }
    
    if (isOffline) {
      if (!pin || pin.length < 4) {
        setShowPinModal(true);
        return;
      }
      return processOfflineTransaction();
    }

    if (mode === 'CHECKOUT' && !signature) {
      setShowSig(true);
      return;
    }
    
    setLoading(true);
    try {
      if (mode === 'CHECKOUT') {
        const res = await api.post('/checkouts', {
          equipment_id: initialEquipment.id,
          request_id: request?.id || null,
          purpose: request?.purpose || 'MISSION',
          digital_signature_data: signature,
          condition_on_checkout: 'GOOD',
          checkout_latitude: coords?.lat || null,
          checkout_longitude: coords?.lng || null,
          expected_return_at: request?.expected_return_at || new Date(Date.now() + 24 * 3600000).toISOString()
        });

        await proceedToTracking(res.data.data);
      } else {
        await api.put(`/checkouts/${initialEquipment.current_checkout_id}/check-in`, {
          condition_on_return: 'GOOD',
          notes: 'Returned via Secure Terminal'
        });
        
        await stopTrackingSession();
      }
    } catch (err) {
      Alert.alert("Link Failure", err.response?.data?.message || "Protocol error during handover.");
      setLoading(false);
    }
  };

  const processOfflineTransaction = async () => {
    // --- SECURITY: Verify PIN Offline ---
    setLoading(true);
    const { SecurityService } = require('../services/SecurityService');
    const isValid = await SecurityService.verifyPinOffline(pin);
    
    if (!isValid) {
      setLoading(false);
      return Alert.alert("Access Denied", "Invalid Security PIN. Transaction aborted.");
    }
    
    try {
      const offlineTimestamp = new Date().toISOString();
      if (mode === 'CHECKOUT') {
        await SyncService.enqueueAction('CHECKOUT', {
          equipment_id: initialEquipment.id,
          request_id: request?.id || null,
          purpose: request?.purpose || 'MISSION',
          condition_on_checkout: 'GOOD',
          checkout_latitude: coords?.lat || null,
          checkout_longitude: coords?.lng || null,
          expected_return_at: request?.expected_return_at || new Date(Date.now() + 24 * 3600000).toISOString(),
          digital_signature_data: 'OFFLINE_VERIFIED',
          offline_timestamp: offlineTimestamp
        });
        await proceedToTracking({ id: 'OFFLINE_PENDING', ...initialEquipment });
      } else {
        await SyncService.enqueueAction('CHECKIN', {
          checkoutId: initialEquipment.current_checkout_id,
          condition_on_return: 'GOOD',
          notes: 'Returned offline',
          return_latitude: coords?.lat || null,
          return_longitude: coords?.lng || null,
          offline_timestamp: offlineTimestamp
        });
        await stopTrackingSession();
      }
      await loadQueue();
    } catch (e) {
      Alert.alert("Queue Error", "Failed to save offline transaction");
      setLoading(false);
    }
  };

  const proceedToTracking = async (checkoutRecord) => {
    try {
      const sessionData = {
        id: initialEquipment.id,
        current_checkout_id: checkoutRecord.id,
        name: initialEquipment.name,
        serial: initialEquipment.serial_number,
        category: initialEquipment.category,
        startTime: Date.now()
      };
      await AsyncStorage.setItem('activeTracking', JSON.stringify(sessionData));
      navigation.navigate('ActiveTracking', { weapons: [sessionData] });
    } catch (e) {
      Alert.alert('Protocol Error', 'Failed to initialize live tracking telemetry.');
      setLoading(false);
    }
  };

  const stopTrackingSession = async () => {
    await AsyncStorage.removeItem('activeTracking');
    Alert.alert("Handover Complete", "Equipment has been successfully returned to Arsenal inventory.");
    navigation.navigate('Home');
  };

  const onOK = (sig) => {
    setSignature(sig);
    setShowSig(false);
  };

  if (showPinModal) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ padding: 30, paddingBottom: 10 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 1 }}>OFFLINE AUTHENTICATION</Text>
            <Text style={{ color: '#94a3b8', marginTop: 8 }}>Enter your 4-digit PIN to authorize this offline transaction.</Text>
          </View>
          <View style={{ padding: 30, alignItems: 'center' }}>
            <Lock color="#ef4444" size={48} style={{ marginBottom: 40 }} />
            <TextInput
              style={{ width: '80%', backgroundColor: '#1e293b', color: '#fff', fontSize: 40, textAlign: 'center', padding: 20, borderRadius: 16, letterSpacing: 16 }}
              keyboardType="number-pad"
              maxLength={4}
              value={pin}
              secureTextEntry
              autoFocus
              onChangeText={setPin}
            />
            <TouchableOpacity 
              onPress={() => {
                setShowPinModal(false);
                handleConfirm();
              }}
              style={[styles.confirmBtn, { backgroundColor: '#ef4444', marginTop: 40, width: '80%' }]}
            >
              <Text style={styles.confirmBtnText}>VERIFY & QUEUE</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowPinModal(false)}
              style={{ marginTop: 20 }}
            >
              <Text style={{ color: '#94a3b8' }}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (showSig) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ padding: 30, paddingBottom: 10 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 1 }}>DIGITAL SIGNATURE</Text>
            <Text style={{ color: '#94a3b8', marginTop: 8 }}>Establish custodial accountability for {initialEquipment.name}</Text>
          </View>
          
          <View style={styles.sigContainer}>
             <SignatureScreen
                onOK={onOK}
                onEmpty={() => Alert.alert("Required", "Accountability requires a valid digital signature.")}
                descriptionText="AUTHORIZED COMMAND SIGNATURE"
                clearText="CLEAR"
                confirmText="ESTABLISH CUSTODY"
                webStyle={`.m-signature-pad { box-shadow: none; border: none; background-color: #1e293b; } 
                           .m-signature-pad--body { border: none; }
                           .m-signature-pad--footer { background-color: #0f172a; }
                           .button.clear { background-color: #334155; color: #fff; border-radius: 8px; }
                           .button.save { background-color: #10b981; color: #0f172a; border-radius: 8px; font-weight: bold; }`}
                autoClear={true}
              />
          </View>

          <TouchableOpacity 
             onPress={() => setShowSig(false)}
             style={styles.sigClose}
          >
            <Text style={{ color: '#f87171', fontWeight: 'bold' }}>ABORT SIGNATURE</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={styles.badge}>
                <Activity size={10} color="#10b981" />
                <Text style={styles.badgeText}>HANDOVER PROTOCOL v2.4</Text>
              </View>
              {isOffline && (
                <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <WifiOff size={10} color="#ef4444" />
                  <Text style={[styles.badgeText, { color: '#ef4444' }]}>OFFLINE MODE</Text>
                </View>
              )}
            </View>
            <Text style={styles.screenTitle}>
              {mode === 'CHECKOUT' ? 'VERIFICATION' : 'RETURN MANIFEST'}
            </Text>
            <Text style={styles.screenSub}>Review asset specifications and confirm custody</Text>
          </View>

          {/* Authorization Card */}
          <View style={styles.authCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View style={[styles.authIcon, { backgroundColor: request ? 'rgba(56, 189, 248, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
                {request ? <ShieldCheck color="#38bdf8" size={20} /> : <ShieldAlert color="#f59e0b" size={20} />}
              </View>
              <View>
                <Text style={styles.authLabel}>{request ? 'AUTHORIZED MISSION DATA' : 'DIRECT COMMAND ASSIGNMENT'}</Text>
                <Text style={styles.authTitle}>{request ? request.category_name : 'Immediate Handover'}</Text>
              </View>
            </View>
            
            <View style={styles.authDetails}>
               <View style={styles.detailRow}>
                 <Text style={styles.detailLabel}>REQUESTED BY</Text>
                 <Text style={styles.detailValue}>{profile?.name.toUpperCase() || 'SYNCHRONIZING...'}</Text>
               </View>
               <View style={styles.detailRow}>
                 <Text style={styles.detailLabel}>PROTOCOL STATUS</Text>
                 <Text style={[styles.detailValue, { color: '#10b981' }]}>VERIFIED BY COMMAND ✓</Text>
               </View>
            </View>
          </View>

          {/* Asset Info Card */}
          <View style={styles.assetCard}>
            <Text style={styles.sectionTitle}>ASSET SPECIFICATIONS</Text>
            
            {initialEquipment ? (
              <View>
                <View style={styles.specHeader}>
                  <View style={styles.mainIconContainer}>
                    <Database color="#10b981" size={28} />
                  </View>
                  <View>
                    <Text style={styles.specName}>{initialEquipment.name}</Text>
                    <Text style={styles.specSerial}>SN: {initialEquipment.serial_number}</Text>
                  </View>
                </View>
                
                <View style={styles.specGrid}>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>CONDITION</Text>
                    <Text style={styles.specValue}>MISSION READY</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>TELEMETRY</Text>
                    <Text style={[styles.specValue, { color: '#38bdf8' }]}>ENABLED</Text>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Scanner')}
                style={styles.scanPrompt}
              >
                <View style={styles.scanIconContainer}>
                  <QrCode color="#38bdf8" size={32} />
                </View>
                <Text style={styles.scanTitle}>AWAITING ASSET PAIRING</Text>
                <Text style={styles.scanDesc}>Scan physical equipment QR to finalize link</Text>
              </TouchableOpacity>
            )}
          </View>

          {mode === 'CHECKOUT' && initialEquipment && (
            <View style={styles.telemetryCard}>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                 <Navigation color="#38bdf8" size={20} />
                 <View>
                   <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>GPS TELEMETRY PRECISION</Text>
                   <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{accuracy}</Text>
                 </View>
               </View>
            </View>
          )}

          <View style={{ marginTop: 40, gap: 16 }}>
            <TouchableOpacity 
              onPress={handleConfirm}
              disabled={loading}
              style={[styles.confirmBtn, { backgroundColor: mode === 'CHECKOUT' ? '#10b981' : '#38bdf8' }]}
            >
              {loading ? <ActivityIndicator color="#0f172a" /> : (
                <>
                  {mode === 'CHECKOUT' ? (signature ? <Check color="#0f172a" size={20} /> : <PenTool color="#0f172a" size={20} />) : <Check color="#0f172a" size={20} />}
                  <Text style={styles.confirmBtnText}>
                    {mode === 'CHECKOUT' ? (signature ? 'AUTHORIZE HANDOVER' : 'CAPTURE SIGNATURE') : 'CONFIRM RETURN'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              disabled={loading}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>ABORT MISSION LINK</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)'
  },
  badgeText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
  },
  screenTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  screenSub: { color: '#64748b', fontSize: 14, marginTop: 4 },
  authCard: { 
    backgroundColor: 'rgba(30, 41, 59, 0.4)', 
    borderRadius: 24, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20
  },
  authIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  authLabel: { color: '#94a3b8', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  authTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  authDetails: { marginTop: 16, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingTop: 16, gap: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: '#475569', fontSize: 10, fontWeight: '900' },
  detailValue: { color: '#cbd5e1', fontSize: 11, fontWeight: '700' },
  assetCard: { 
    backgroundColor: 'rgba(30, 41, 59, 0.4)', 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)'
  },
  sectionTitle: { color: '#475569', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },
  specHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  mainIconContainer: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center' },
  specName: { color: 'white', fontSize: 22, fontWeight: '900' },
  specSerial: { color: '#64748b', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  specGrid: { flexDirection: 'row', gap: 20 },
  specItem: { flex: 1, backgroundColor: '#0f172a', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  specLabel: { color: '#475569', fontSize: 8, fontWeight: '900', marginBottom: 4 },
  specValue: { color: '#fff', fontSize: 11, fontWeight: '800' },
  scanPrompt: { padding: 10, alignItems: 'center' },
  scanIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(56, 189, 248, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  scanTitle: { color: '#38bdf8', fontSize: 16, fontWeight: '900' },
  scanDesc: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 4 },
  telemetryCard: { marginTop: 24, backgroundColor: 'rgba(56, 189, 248, 0.05)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.1)' },
  confirmBtn: { padding: 22, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  confirmBtnText: { color: '#0f172a', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  cancelBtn: { padding: 18, borderRadius: 20, backgroundColor: 'rgba(248, 113, 113, 0.05)', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.1)', alignItems: 'center' },
  cancelBtnText: { color: '#f87171', fontWeight: '900', fontSize: 12, letterSpacing: 2 },
  sigContainer: { flex: 1, margin: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  sigClose: { padding: 20, alignItems: 'center', marginBottom: 20 }
});
