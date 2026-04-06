import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShieldCheck, Loader2, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

export default function LoginScreen({ navigation }) {
  const [serviceNum, setServiceNum] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (customCreds = null) => {
    const sNum = customCreds ? customCreds.sn : serviceNum;
    const sPin = customCreds ? customCreds.pin : pin;

    if (!sNum || !sPin) {
      Alert.alert("Authentication Error", "Valid Service Number and PIN are required for network access.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { 
        serviceNumber: sNum, 
        password: sPin 
      });
      
      const { accessToken, refreshToken, sessionId, personnel } = res.data.data;
      
      if (!accessToken) throw new Error("Synchronization failure");

      await AsyncStorage.setItem('auth_token', accessToken);
      if (refreshToken) await AsyncStorage.setItem('refresh_token', refreshToken);
      if (sessionId) await AsyncStorage.setItem('session_id', sessionId);
      await AsyncStorage.setItem('soldier_profile', JSON.stringify({
        id: personnel.id,
        name: personnel.full_name,
        rank: personnel.rank,
        unit: personnel.unit_name,
        role: personnel.role
      }));

      // --- Security Update: Store PIN hash for offline use ---
      const { SecurityService } = require('../services/SecurityService');
      await SecurityService.recordPinForOffline(sPin);
      
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert("Access Denied", error.response?.data?.message || "Secure link failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <LinearGradient
        colors={['#1e293b', '#0f172a', '#020617']}
        style={StyleSheet.absoluteFill}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View style={styles.logoContainer}>
              <ShieldCheck color="#10b981" size={48} />
            </View>
            <Text style={styles.brandTitle}>DEAS NETWORK</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SECURE TERMINAL ALPHA-1</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={{ gap: 20 }}>
              <View>
                <Text style={styles.inputLabel}>SERVICE IDENTIFIER</Text>
                <TextInput
                  value={serviceNum}
                  onChangeText={setServiceNum}
                  placeholder="e.g. OFFICER-77"
                  placeholderTextColor="#475569"
                  autoCapitalize="characters"
                  style={styles.input}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>SECURITY PASS-PIN</Text>
                <TextInput
                  value={pin}
                  onChangeText={setPin}
                  secureTextEntry
                  placeholder="••••"
                  placeholderTextColor="#475569"
                  style={styles.input}
                />
              </View>

              <TouchableOpacity 
                onPress={() => handleLogin()}
                disabled={loading}
                style={[styles.loginBtn, loading && { opacity: 0.8 }]}
              >
                {loading ? <ActivityIndicator color="#0f172a" /> : (
                  <Text style={styles.loginBtnText}>ESTABLISH LINK</Text>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                <Text style={{ color: '#475569', fontSize: 10, marginHorizontal: 12, fontWeight: '800' }}>OR</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' }} />
              </View>

              <TouchableOpacity 
                onPress={() => handleLogin({ sn: 'OFFICER-77', pin: 'Pin@1234' })}
                style={styles.demoBtn}
              >
                <Zap size={16} color="#38bdf8" />
                <Text style={styles.demoBtnText}>DIRECT DEMO OVERRIDE</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <Text style={{ color: '#475569', fontSize: 10, letterSpacing: 2 }}>ENCRYPTED END-TO-END VIA DEAS-PROTOCOL</Text>
          </View>

        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    padding: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 4,
    textAlign: 'center'
  },
  badge: {
    marginTop: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)'
  },
  badgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 10
  },
  input: {
    backgroundColor: '#0f172a',
    color: 'white',
    padding: 18,
    borderRadius: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  loginBtn: {
    backgroundColor: '#10b981',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8
  },
  loginBtnText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 2
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  demoBtnText: {
    color: '#38bdf8',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1
  }
});
