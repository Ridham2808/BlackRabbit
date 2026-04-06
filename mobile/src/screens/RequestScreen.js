import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, StyleSheet, Platform, Keyboard } from 'react-native';
import { ChevronLeft, Clipboard, Calendar, MapPin, Send, ShieldPlus } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

export default function RequestScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    equipment_category_id: '',
    purpose: 'TRAINING',
    expected_return_at: new Date(Date.now() + 24 * 3600000), // Default 24 hours
    location: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/equipment/categories');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDateChange = (event, date) => {
    // FIX: Common Android issue where setShowDatePicker(false) must happen inside the handler
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setFormData({ ...formData, expected_return_at: date });
    }
    
    // For iOS, the picker is usually inline or a modal that stays open,
    // but we can close it if the user hit 'Set' (event.type === 'set')
    if (Platform.OS === 'ios' && event.type === 'set') {
      setShowDatePicker(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.equipment_category_id) {
      return Alert.alert("Selection Required", "Please select the equipment type needed for this mission.");
    }
    setLoading(true);
    Keyboard.dismiss();
    try {
      await api.post('/checkouts/requests', {
        ...formData,
        expected_return_at: formData.expected_return_at.toISOString(),
      });
      Alert.alert("Request Submitted", "Your digital requisition has been sent to your Commanding Officer for approval.", [
        { text: "Return to Base", onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert("Submission Failed", err.response?.data?.message || "Verify your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={{ position: 'absolute', inset: 0 }}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ChevronLeft color="#fff" size={24} />
            </TouchableOpacity>
            <View>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>Digital Requisition</Text>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>Mission-Critical Asset Deployment</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={{ gap: 24 }}>
              
              {/* Category Select */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <ShieldPlus size={16} color="#10b981" />
                  <Text style={styles.label}>Requested Asset Category</Text>
                </View>
                <View style={styles.pickerContainer}>
                  {categories.length === 0 ? (
                    <Text style={{ color: '#475569', fontStyle: 'italic', fontSize: 12 }}>Loading available categories...</Text>
                  ) : (
                    categories.map(cat => (
                      <TouchableOpacity 
                        key={cat.id} 
                        onPress={() => setFormData({ ...formData, equipment_category_id: cat.id })}
                        style={[styles.chip, formData.equipment_category_id === cat.id && styles.chipSelected]}
                      >
                        <Text style={[styles.chipText, formData.equipment_category_id === cat.id && styles.chipTextSelected]}>
                          {cat.display_name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>

              {/* Purpose */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Clipboard size={16} color="#10b981" />
                  <Text style={styles.label}>Mission Objective</Text>
                </View>
                <View style={styles.pickerContainer}>
                  {['TRAINING', 'MISSION', 'MAINTENANCE', 'EXERCISE'].map(p => (
                    <TouchableOpacity 
                      key={p} 
                      onPress={() => setFormData({ ...formData, purpose: p })}
                      style={[styles.chip, formData.purpose === p && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, formData.purpose === p && styles.chipTextSelected]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Return Date */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Calendar size={16} color="#10b981" />
                  <Text style={styles.label}>Expected Return Manifest</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '500' }}>
                    {formData.expected_return_at.toLocaleDateString()} at {formData.expected_return_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '800', marginLeft: 'auto' }}>CHANGE</Text>
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.expected_return_at}
                    mode="datetime"
                    display="default"
                    textColor="white"
                    onChange={handleDateChange}
                  />
                )}
              </View>

              {/* Location */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <MapPin size={16} color="#10b981" />
                  <Text style={styles.label}>Primary Operating Sector</Text>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    placeholder="e.g. Sector-4 North Perimeter"
                    placeholderTextColor="#475569"
                    value={formData.location}
                    onChangeText={text => setFormData({ ...formData, location: text })}
                    style={styles.textInput}
                  />
                </View>
              </View>

            </View>

            <TouchableOpacity 
              onPress={handleSubmit} 
              disabled={loading}
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            >
              {loading ? <ActivityIndicator color="white" /> : (
                <>
                  <Text style={styles.submitBtnText}>Initialize Secure Request</Text>
                  <Send color="white" size={20} />
                </>
              )}
            </TouchableOpacity>
          </View>
          
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: { 
    width: 44, height: 44, borderRadius: 12, 
    background: 'rgba(255,255,255,0.05)', 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', 
    alignItems: 'center', justifyContent: 'center' 
  },
  formCard: { 
    background: 'rgba(30, 41, 59, 0.5)', 
    borderRadius: 32, padding: 24, 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  label: { 
    fontSize: 11, fontWeight: '800', color: '#94a3b8', 
    textTransform: 'uppercase', letterSpacing: 1 
  },
  input: { 
    background: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 16, 
    padding: 18, flexDirection: 'row', alignItems: 'center'
  },
  textInput: {
    background: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 16, 
    padding: 18, color: '#fff', fontSize: 16
  },
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { 
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, 
    background: '#1e293b', borderWidth: 1, borderColor: '#334155' 
  },
  chipSelected: { background: '#10b981', borderColor: '#10b981' },
  chipText: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
  chipTextSelected: { color: '#0f172a' },
  submitBtn: { 
    background: '#10b981', padding: 22, borderRadius: 20, marginTop: 40,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12,
    shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    elevation: 8
  },
  submitBtnText: { color: '#0f172a', fontWeight: '900', fontSize: 17, textTransform: 'uppercase', letterSpacing: 0.5 }
});
