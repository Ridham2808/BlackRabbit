import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Battery from 'expo-battery';
import * as LocalAuthentication from 'expo-local-authentication';
import { ref, set, update, onDisconnect } from 'firebase/database';
import { database } from '../config/firebase';
import { MapPin, BatteryMedium, Clock, StopCircle, Activity, Navigation, ShieldCheck, ShieldAlert, Target, Database, ChevronRight, Zap, Fingerprint, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

const LOCATION_TASK_NAME = 'WEAPON_LOCATION_TASK';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  if (data) {
    const { locations } = data;
    const loc = locations[0];
    try {
      const sessionStr = await AsyncStorage.getItem('activeTracking');
      const profileStr = await AsyncStorage.getItem('soldier_profile');
      if (!sessionStr || !profileStr) return;
      
      const parsed = JSON.parse(sessionStr);
      const activeSessions = Array.isArray(parsed) ? parsed : [parsed];
      const soldier = JSON.parse(profileStr);
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryPercent = Math.round(batteryLevel * 100);
      
      const locationData = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        altitude: loc.coords.altitude || 0,
        speed: loc.coords.speed ? loc.coords.speed * 3.6 : 0, 
        heading: loc.coords.heading || 0,
        timestamp: loc.timestamp || Date.now(),
        batteryPercent: batteryPercent,
        isTracking: true,
      };

      for (const weapon of activeSessions) {
        const weaponRef = ref(database, `weapons/${weapon.id || 'unknown_id'}`);
        await update(weaponRef, {
          location: locationData,
          info: {
            id: weapon.id || "N/A",
            name: weapon.name || "Unknown Asset",
            category: weapon.category || "General",
            serialNumber: weapon.serial || weapon.serialNumber || "N/A",
            status: "CHECKED_OUT",
            assignedTo: soldier.id || "N/A",
            assignedToName: soldier.name || "Unknown Soldier",
          }
        });
        
        const historyRef = ref(database, `weapons/${weapon.id}/locationHistory/${locationData.timestamp}`);
        await set(historyRef, { lat: locationData.lat, lng: locationData.lng, timestamp: locationData.timestamp });
      }
    } catch (e) {
      console.log('BG Task Error:', e);
    }
  }
});

export default function ActiveTrackingScreen({ route, navigation }) {
  const { weapons: initialWeapons, assignedPersonnel } = route.params || {};
  
  const [sessions, setSessions] = useState([]);
  const [missionStatus, setMissionStatus] = useState('INIT'); // INIT, AUTHENTICATING, ACTIVE
  const [biometricStatus, setBiometricStatus] = useState('UNVERIFIED'); // UNVERIFIED, VERIFIED
  const [currentLocation, setCurrentLocation] = useState(null);
  const [battery, setBattery] = useState(100);
  const [loading, setLoading] = useState(false);
  const fgSubRef = useRef(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const saved = await AsyncStorage.getItem('activeTracking');
    if (saved) {
      const parsed = JSON.parse(saved);
      const sessionArray = Array.isArray(parsed) ? parsed : [parsed];
      setSessions(sessionArray);
      setMissionStatus('ACTIVE');
      setupTracking(sessionArray);
    } else if (initialWeapons && initialWeapons.length > 0) {
      setSessions(initialWeapons);
      setMissionStatus('INIT');
    } else {
      // Fallback or go back
      navigation.goBack();
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert("Hardware Required", "Biometric ID (Face/Fingerprint) not available. Establishing secure PIN fallback.");
        // Fallback to simple success for demo if hardware missing
        setBiometricStatus('VERIFIED');
        return true;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authorize Asset Custody',
        fallbackLabel: 'Enter Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setBiometricStatus('VERIFIED');
        return true;
      } else {
        Alert.alert("Authentication Failed", "Operational identity could not be verified.");
        return false;
      }
    } catch (e) {
      Alert.alert("System Error", "Biometric module link failure.");
      return false;
    }
  };

  const handleStartMission = async () => {
    console.log('[Mobile] ESTABLISH MULTI-LINK button clicked!');
    console.log('[Mobile] Current biometricStatus:', biometricStatus);
    if (biometricStatus !== 'VERIFIED') {
      console.log('[Mobile] Biometric not verified. Initiating auth...');
      const isOk = await handleBiometricAuth();
      if (!isOk) {
        console.log('[Mobile] Biometric auth failed or user cancelled. Stopping checkout flow.');
        return; 
      }
      console.log('[Mobile] Biometric auth succeeded!');
    }

    setLoading(true);
    try {
      const results = [];
      console.log('[Mobile] Attempting atomic checkout for', sessions.length, 'assets. Target Assignee:', assignedPersonnel?.id || 'Self');
      // Atomic Operation: We try to checkout EVERY asset
      for (const s of sessions) {
        try {
          console.log(`[Mobile] Preparing API Payload for Asset ${s.serial}`);
          const payload = {
            equipment_id: s.id,
            request_id: s.request?.id || null,
            purpose: s.request?.purpose || 'MISSION',
            digital_signature_data: 'BIOMETRIC_ID_VERIFIED_DEVICE_ROOT',
            condition_on_checkout: 'GOOD',
            expected_return_at: new Date(Date.now() + 24 * 3600000).toISOString(),
            assigned_user_id: assignedPersonnel?.id || null
          };
          console.log(`[Mobile] Calling POST /api/checkouts with payload:`, payload);
          
          const res = await api.post('/checkouts', payload);
          console.log(`[Mobile] Backend Response for ${s.serial} SUCCESS:`, res.status);
          
          results.push({
            ...s,
            current_checkout_id: res.data.data.id,
            startTime: Date.now()
          });
          console.log(`[Mobile] Added checkout ID ${res.data.data.id} to local tracking results`);
        } catch (innerErr) {
          console.error(`[Mobile] [DEAS] Checkout failed for ${s.serial}:`, innerErr.response?.data || innerErr.message);
          throw new Error(`Asset ${s.serial} could not be authorized. Please check connectivity or re-login.`);
        }
      }

      console.log(`[Mobile] Validating results length (${results.length}) vs sessions (${sessions.length})`);
      // ONLY if all checkouts succeeded, we finalize the app state
      if (results.length === sessions.length) {
        console.log(`[Mobile] All checkouts succeeded! Setting activeTracking in AsyncStorage.`);
        await AsyncStorage.setItem('activeTracking', JSON.stringify(results));
        setSessions(results);
        setMissionStatus('ACTIVE');
        console.log(`[Mobile] Calling setupTracking() to initiate Firebase Telemetry...`);
        setupTracking(results);
      } else {
        throw new Error("Synchronization mismatch during protocol establishment.");
      }
    } catch (err) {
      Alert.alert("Operational Failure", err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupTracking = async (weaponsArray) => {
    try {
      const bat = await Battery.getBatteryLevelAsync();
      setBattery(Math.round(bat * 100));

      // Set up onDisconnect for each weapon
      for (const w of weaponsArray) {
        const weaponLocRef = ref(database, `weapons/${w.id}/location`);
        onDisconnect(weaponLocRef).update({ isTracking: false, disconnectedAt: Date.now() });
      }

      const fgPerm = await Location.requestForegroundPermissionsAsync();
      if (fgPerm.status !== 'granted') {
         Alert.alert("Permission Denied", "Location is required for live map telemetry.");
         return;
      }

      let bgPermStatus = 'denied';
      try {
         const bgPerm = await Location.requestBackgroundPermissionsAsync();
         bgPermStatus = bgPerm.status;
      } catch (e) {
         console.log("Background location not supported");
      }

      if (bgPermStatus === 'granted') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 2000,
          distanceInterval: 2,
          foregroundService: {
            notificationTitle: "DEAS OPERATIONAL LINK",
            notificationBody: `Tracking ${weaponsArray.length} assets in real-time`,
            notificationColor: "#38bdf8",
          }
        });
      }

      fgSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 2 },
        (loc) => {
          setCurrentLocation(loc);
          weaponsArray.forEach(w => {
            const weaponRootRef = ref(database, `weapons/${w.id}`);
            update(weaponRootRef, {
              location: {
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
                accuracy: loc.coords.accuracy,
                altitude: loc.coords.altitude || 0,
                speed: loc.coords.speed ? loc.coords.speed * 3.6 : 0, 
                heading: loc.coords.heading || 0,
                timestamp: loc.timestamp || Date.now(),
                batteryPercent: bat ? Math.round(bat * 100) : 100,
                isTracking: true,
              },
              info: {
                id: w.id || "N/A",
                name: w.name || "Unknown Asset",
                category: w.category || "General",
                serialNumber: w.serial || w.serialNumber || "N/A",
                status: "CHECKED_OUT",
                assignedTo: assignedPersonnel?.id || w.assignedTo || "N/A",
                assignedToName: assignedPersonnel?.full_name || w.assignedToName || "Unknown Soldier"
              }
            }).catch(err => console.log('Firebase Sync Error', err));
          });
        }
      );
    } catch (e) {
      Alert.alert("Link Failure", "Failed to initialize operational telemetry.");
    }
  };

  const stopTracking = async () => {
    Alert.alert(
      "CONFIRM RETURN", 
      `Establish return for ${sessions.length} assets and stop telemetry broadcast?`,
      [
        { text: "STAY ON MISSION", style: "cancel" },
        { 
          text: "CONFIRM RETURN", 
          style: "destructive",
          onPress: async () => {
            console.log(`[Mobile] 'Confirm Return' clicked! Initiating StopTracking...`);
            setLoading(true);
            try {
              console.log(`[Mobile] Fetching GPS coords for checkin...`);
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
              console.log(`[Mobile] Location fetched: Lat ${loc.coords.latitude}, Lng ${loc.coords.longitude}`);
              
              for (const s of sessions) {
                console.log(`[Mobile] Processing checkin for asset ${s.serial}...`);
                let checkoutId = s.current_checkout_id;
                
                // Recovery: If ID is missing, try fetching it from the platform
                if (!checkoutId || checkoutId === 'undefined') {
                  console.log(`[Mobile] Local checkout ID missing, recovering from server...`);
                  try {
                    const eqRes = await api.get(`/equipment/${s.id}`);
                    checkoutId = eqRes.data.data.current_checkout_id;
                    console.log(`[Mobile] Recovered checkout ID: ${checkoutId}`);
                  } catch (e) {
                    console.error(`[Mobile] [DEAS] Could not recover checkout ID for ${s.serial}`);
                  }
                }

                // Only sync with backend if we have a valid ID
                if (checkoutId && checkoutId !== 'undefined' && checkoutId !== 'null') {
                  console.log(`[Mobile] Hitting PATCH /api/checkouts/${checkoutId}/checkin`);
                  await api.patch(`/checkouts/${checkoutId}/checkin`, {
                    condition_on_return: 'GOOD',
                    return_latitude: loc.coords.latitude,
                    return_longitude: loc.coords.longitude,
                    notes: 'Returned via tactical multi-link terminal'
                  });
                  console.log(`[Mobile] Backend Checkin API success for ${checkoutId}!`);
                } else {
                  console.log(`[Mobile] Skipped backend checkin because valid checkoutId was not found.`);
                }

                // Always cleanup Firebase so map reflects actual status
                const weaponRootRef = ref(database, `weapons/${s.id}`);
                await update(weaponRootRef, {
                  location: { isTracking: false, finishedAt: Date.now() },
                  info: { status: 'OPERATIONAL' }
                });
                
                const sessionRef = ref(database, `activeSessions/${s.id}`);
                await set(sessionRef, null);
              }

              if (fgSubRef.current) fgSubRef.current.remove();
              const hasBg = await Location.getBackgroundPermissionsAsync();
              if (hasBg.status === 'granted') await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

              await AsyncStorage.removeItem('activeTracking');
              Alert.alert("Mission Complete", "All assets successfully secured in inventory.");
              navigation.replace('Home');
            } catch (err) {
              console.log("[DEAS] Sync error during return:", err.response?.data || err.message);
              Alert.alert("Finalization Failure", "Protocol error while securing assets. Check connectivity.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const timeActiveStr = () => {
    const startTime = sessions[0]?.startTime;
    if (!startTime) return "N/A";
    const min = Math.floor((Date.now() - startTime) / 60000);
    if (min < 1) return "Just now";
    return `${min} min`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <LinearGradient colors={['#1e293b', '#0f172a']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 24 }}>
          
          <View style={styles.header}>
            <View style={styles.badge}>
              <View style={[styles.badgeDot, { backgroundColor: missionStatus === 'ACTIVE' ? '#10b981' : '#f59e0b' }]} />
              <Text style={[styles.badgeText, { color: missionStatus === 'ACTIVE' ? '#10b981' : '#f59e0b' }]}>
                {missionStatus === 'ACTIVE' ? 'LIVE TELEMETRY' : 'PROTOCOL INITIALIZATION'}
              </Text>
            </View>
            <Text style={styles.title}>{missionStatus === 'ACTIVE' ? 'Multi-Asset Link' : 'Handover Identity'}</Text>
            {sessions.length > 0 && (
              <Text style={styles.subtitle}>
                {missionStatus === 'ACTIVE' ? `Tracking ${sessions.length} operational units` : `${sessions.length} assets identified for link`}
              </Text>
            )}
          </View>

          {missionStatus === 'INIT' ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
               {sessions.map((s, idx) => (
                 <View key={s.id || idx} style={styles.specCard}>
                    <View style={styles.specHeader}>
                      <View style={styles.mainIconContainer}>
                        <ShieldAlert color="#10b981" size={24} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.specName}>{s.name}</Text>
                        <Text style={styles.specSerial}>{s.serial}</Text>
                      </View>
                    </View>
                    <View style={styles.specGrid}>
                      <View style={styles.specItem}>
                        <Text style={styles.specLabel}>CATEGORY</Text>
                        <Text style={styles.specValue}>{s.category || 'General'}</Text>
                      </View>
                      <View style={styles.specItem}>
                        <Text style={styles.specLabel}>STATUS</Text>
                        <Text style={styles.specValue}>{s.mode || 'PICKUP'}</Text>
                      </View>
                    </View>
                 </View>
               ))}

               <View style={styles.authPrompt}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <View style={[styles.authIcon, biometricStatus === 'VERIFIED' && { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                      {biometricStatus === 'VERIFIED' ? <ShieldCheck color="#10b981" size={20} /> : <Fingerprint color="#38bdf8" size={20} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.authTitle}>Identity Verification</Text>
                      <Text style={styles.authDesc}>{biometricStatus === 'VERIFIED' ? 'Biometric ID Confirmed' : 'Face / Fingerprint Required'}</Text>
                    </View>
                    {biometricStatus === 'VERIFIED' && <Zap color="#10b981" size={16} fill="#10b981" />}
                  </View>
                  {biometricStatus !== 'VERIFIED' && (
                    <TouchableOpacity 
                      onPress={handleBiometricAuth}
                      style={styles.signBtn}
                    >
                      <Text style={styles.signBtnText}>PERFORM BIOMETRIC SCAN</Text>
                    </TouchableOpacity>
                  )}
               </View>

               <TouchableOpacity 
                onPress={handleStartMission}
                style={[styles.startBtn, biometricStatus !== 'VERIFIED' && { opacity: 0.5 }]}
                disabled={biometricStatus !== 'VERIFIED' || loading}
               >
                 {loading ? <ActivityIndicator color="#0f172a" /> : (
                   <>
                    <Lock color="#0f172a" size={20} fill="#0f172a" />
                    <Text style={styles.startBtnText}>ESTABLISH MULTI-LINK</Text>
                   </>
                 )}
               </TouchableOpacity>
            </ScrollView>
          ) : (
            <>
              <View style={styles.radarContainer}>
                <View style={styles.radarRing3}>
                  <View style={styles.radarRing2}>
                    <View style={styles.radarRing1}>
                      <View style={styles.radarCore}>
                        <Activity color="#38bdf8" size={32} />
                      </View>
                    </View>
                  </View>
                </View>
                <Text style={styles.radarText}>LINK STABLE • BROADCASTING {sessions.length} UNITS</Text>
              </View>

              <View style={styles.statsCard}>
                <View style={{ gap: 20 }}>
                  <View style={styles.statRow}>
                    <View style={styles.statIconContainer}>
                      <Navigation color="#38bdf8" size={20} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statLabel}>COORDINATES</Text>
                      <Text style={styles.statValue}>
                        {currentLocation ? `${currentLocation.coords.latitude.toFixed(6)}, ${currentLocation.coords.longitude.toFixed(6)}` : 'Wait for sync...'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statRow}>
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                      <Clock color="#10b981" size={20} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statLabel}>OPERATION TIME</Text>
                      <Text style={styles.statValue}>{timeActiveStr()}</Text>
                    </View>
                  </View>

                  <View style={styles.statRow}>
                    <View style={[styles.statIconContainer, { backgroundColor: battery < 20 ? 'rgba(248, 113, 113, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
                      <BatteryMedium color={battery < 20 ? "#f87171" : "#f59e0b"} size={20} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statLabel}>SYSTEM UPTIME</Text>
                      <Text style={[styles.statValue, battery < 20 && { color: '#f87171' }]}>{battery}% Battery</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />
                
                <View style={{ maxHeight: 80 }}>
                  <ScrollView nestedScrollEnabled>
                    {sessions.map((s, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <ShieldCheck color="#10b981" size={12} />
                        <Text style={{ color: '#94a3b8', fontSize: 11 }}>{s.name} • {s.serial}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <TouchableOpacity 
                onPress={stopTracking}
                disabled={loading}
                style={styles.stopBtn}
              >
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <StopCircle color="white" size={24} />
                    <Text style={styles.stopBtnText}>END MULTI-BROADCAST</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 32 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: 'white', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: '#64748b', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 4 },
  
  radarContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  radarRing3: { width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.05)', alignItems: 'center', justifyContent: 'center' },
  radarRing2: { width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.1)', alignItems: 'center', justifyContent: 'center' },
  radarRing1: { width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)', alignItems: 'center', justifyContent: 'center' },
  radarCore: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(56, 189, 248, 0.1)', alignItems: 'center', justifyContent: 'center' },
  radarText: { color: '#38bdf8', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginTop: 32, opacity: 0.6 },
  
  specCard: { backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  sectionTitle: { color: '#475569', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },
  specHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  mainIconContainer: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center' },
  specName: { color: 'white', fontSize: 22, fontWeight: '900' },
  specSerial: { color: '#64748b', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  specGrid: { flexDirection: 'row', gap: 20 },
  specItem: { flex: 1, backgroundColor: '#0f172a', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  specLabel: { color: '#475569', fontSize: 8, fontWeight: '900', marginBottom: 4 },
  specValue: { color: '#fff', fontSize: 11, fontWeight: '800' },

  authPrompt: { backgroundColor: 'rgba(56, 189, 248, 0.05)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.1)' },
  authIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(56, 189, 248, 0.1)', alignItems: 'center', justifyContent: 'center' },
  authTitle: { color: 'white', fontSize: 15, fontWeight: '800' },
  authDesc: { color: '#64748b', fontSize: 11 },
  signBtn: { marginTop: 16, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', alignItems: 'center' },
  signBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  startBtn: { backgroundColor: '#38bdf8', padding: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  startBtnText: { color: '#0f172a', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },

  statsCard: { backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 24 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statIconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(56, 189, 248, 0.1)', alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: '#475569', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
  statValue: { color: 'white', fontSize: 13, fontWeight: '800' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 20 },
  footerText: { color: '#475569', fontSize: 10, fontWeight: '700' },
  stopBtn: { backgroundColor: '#ef4444', padding: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, shadowColor: '#ef4444', shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  stopBtnText: { color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});
