import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { User, Shield, Briefcase, Award, MapPin, ChevronRight, LogOut, ShieldCheck, Mail, Phone, ExternalLink } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const data = await AsyncStorage.getItem('soldier_profile');
    if (data) setProfile(JSON.parse(data));
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('soldier_profile');
    await AsyncStorage.removeItem('auth_token');
    navigation.replace('Login');
  };

  if (!profile) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SECURE PROFILE</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24 }}>
          
          <View style={styles.profileHero}>
            <View style={styles.avatarContainer}>
              <User color="#10b981" size={48} />
              <View style={styles.verifiedBadge}>
                <ShieldCheck color="#0f172a" size={12} />
              </View>
            </View>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.rank}>{profile.rank} — {profile.role}</Text>
            <View style={styles.unitBadge}>
              <Text style={styles.unitText}>{profile.unit}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>COMMAND DETAILS</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Briefcase color="#38bdf8" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>SERVICE NUMBER</Text>
                <Text style={styles.infoValue}>SN-047-DELTA-9</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <MapPin color="#f59e0b" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>CURRENT DEPLOYMENT</Text>
                <Text style={styles.infoValue}>Alpha Base — Sector 7</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Award color="#a78bfa" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>SECURITY CLEARANCE</Text>
                <Text style={[styles.infoValue, { color: '#a78bfa' }]}>LEVEL 4 (ALPHA)</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionCard}>
            <TouchableOpacity style={styles.actionRow}>
              <Shield color="#94a3b8" size={20} />
              <Text style={styles.actionText}>Security Settings</Text>
              <ChevronRight color="#475569" size={16} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionRow}>
              <ShieldCheck color="#94a3b8" size={20} />
              <Text style={styles.actionText}>Biometric Enrollment</Text>
              <ChevronRight color="#475569" size={16} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={handleLogout}
            style={styles.logoutBtn}
          >
            <LogOut color="#ef4444" size={20} />
            <Text style={styles.logoutText}>TERMINATE SESSION</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>DEAS MOBILE v2.4.0 — SECURE TERMINAL</Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center'
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3
  },
  profileHero: {
    alignItems: 'center',
    marginVertical: 32
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 20
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10b981',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0f172a'
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4
  },
  rank: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16
  },
  unitBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)'
  },
  unitText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  infoCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24
  },
  sectionTitle: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 24
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2
  },
  actionCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.2)',
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16
  },
  actionText: {
    color: '#cbd5e1',
    flex: 1,
    fontSize: 14,
    fontWeight: '700'
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
    marginBottom: 32
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 2
  },
  versionText: {
    textAlign: 'center',
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 40
  }
});
