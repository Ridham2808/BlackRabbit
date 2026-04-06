
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, FlatList, Alert, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { ChevronLeft, Clock, User, ShieldCheck, Check, X } from 'lucide-react-native';
import api from '../services/api';

export default function ApprovalScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await api.get('/checkouts/requests/pending');
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const endpoint = action === 'approve' ? `/checkouts/requests/${id}/approve` : `/checkouts/requests/${id}/reject`;
      await api.put(endpoint);
      Alert.alert("Success", `Request ${action}d successfully.`);
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Action failed");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.headerRow}>
        <View style={styles.userIcon}>
          <User color="#64748b" size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.requesterName}>{item.requester_name}</Text>
          <Text style={styles.requesterRank}>{item.requester_rank} • {item.requester_service_number}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.category_name}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Clock color="#94a3b8" size={14} />
        <Text style={styles.infoText}>Purpose: {item.purpose}</Text>
      </View>
      <View style={styles.infoRow}>
        <Clock color="#94a3b8" size={14} />
        <Text style={styles.infoText}>Return: {new Date(item.expected_return_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} today</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.rejectBtn]} 
          onPress={() => handleAction(item.id, 'reject')}
        >
          <X color="#ef4444" size={18} />
          <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.approveBtn]} 
          onPress={() => handleAction(item.id, 'approve')}
        >
          <Check color="white" size={18} />
          <Text style={[styles.actionBtnText, { color: 'white' }]}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color="#1e293b" size={20} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Pending Approvals</Text>
            <Text style={styles.subtitle}>{requests.length} requests awaiting authorization</Text>
          </View>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator color="#0f172a" />
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{ padding: 24 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPending(); }} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ShieldCheck color="#cbd5e1" size={64} />
                <Text style={styles.emptyText}>All clear. No pending requests.</Text>
              </View>
            }
          />
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 24, paddingBottom: 12 },
  backBtn: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  requestCard: { 
    background: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, 
    border: '1px solid #e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  userIcon: { width: 40, height: 40, borderRadius: 12, background: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  requesterName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  requesterRank: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  statusBadge: { background: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoText: { fontSize: 13, color: '#64748b' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  actionBtn: { flex: 1, height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  rejectBtn: { background: '#fff', border: '1.5px solid #ef4444' },
  approveBtn: { background: '#0f172a' },
  actionBtnText: { fontWeight: '700', fontSize: 14 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', fontSize: 15, marginTop: 16, fontWeight: '500' }
});
