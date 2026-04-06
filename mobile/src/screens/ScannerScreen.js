import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X } from 'lucide-react-native';

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItems, setScannedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [assignedPersonnel, setAssignedPersonnel] = useState(null);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (!isScanning || loading) return;
    
    // Simple duplicate check by data
    if (scannedItems.some(i => i.raw === data)) {
      return;
    }

    setLoading(true);
    setIsScanning(false);
    
    try {
      let qrData = data;
      try {
        qrData = JSON.parse(data);
      } catch (e) {
        qrData = { serialNumber: data };
      }

      let newItem = null;

      if (qrData.type === 'EQUIPMENT_PICKUP') {
        const res = await api.get(`/checkouts/requests/${qrData.requestId}`);
        const request = res.data.data;
        newItem = { 
          request: request,
          mode: 'CHECKOUT',
          id: request.equipment_id,
          name: request.category_name,
          serial: 'PENDING',
          raw: data
        };
      } else if (qrData.type === 'PERSONNEL' || qrData.personnel_id) {
        // Scanned a person's digital ID to hand over custody to them.
        const pid = qrData.personnel_id || qrData.id || data;
        const res = await api.get(`/personnel/${pid}`);
        const pData = res.data.data;
        if (pData) {
          setAssignedPersonnel(pData);
          Alert.alert("Target Custodian Selected", `Checkout will be assigned to ${pData.full_name}`);
        } else {
          Alert.alert("Not Found", "Personnel not recognized.");
        }
        setIsScanning(true);
        setLoading(false);
        return;
      } else {
        const serialNumber = qrData.serialNumber || qrData.serial || data;
        const res = await api.get(`/equipment/serial/${serialNumber}`);
        const item = res.data.data;

        if (!item) {
          Alert.alert("Not Found", "Equipment not recognized.");
        } else {
          newItem = {
            id: item.id,
            name: item.name,
            serial: item.serial_number,
            category: item.category,
            current_checkout_id: item.current_checkout_id,
            mode: item.status === 'CHECKED_OUT' ? 'CHECKIN' : 'CHECKOUT',
            raw: data
          };
        }
      }

      if (newItem) {
        setScannedItems(prev => [...prev, newItem]);
        // Re-enable scanning after a short delay
        setTimeout(() => setIsScanning(true), 1500);
      } else {
        setIsScanning(true);
      }
    } catch (e) {
      Alert.alert("Error", "Validation failed.");
      setIsScanning(true);
    } finally {
      setLoading(false);
    }
  };

  const finalizeScanning = () => {
    if (scannedItems.length === 0) {
      Alert.alert("No Assets", "Please scan at least one asset to proceed.");
      return;
    }
    navigation.navigate('ActiveTracking', { 
      weapons: scannedItems,
      assignedPersonnel: assignedPersonnel
    });
  };

  if (!permission) {
    return <View style={styles.container}><Text style={styles.text}>Requesting camera permission...</Text></View>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity onPress={requestPermission} style={{marginTop: 20, padding: 10, backgroundColor: '#10b981', borderRadius: 8}}>
          <Text style={{color: 'white'}}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      
      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer}></View>
        <View style={styles.middleContainer}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.focusedContainer}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>
        <View style={styles.unfocusedContainer}>
          <Text style={styles.instructionText}>
            {loading ? 'Validating Asset...' : `Scanned: ${scannedItems.length} Assets`}
          </Text>
          {scannedItems.length > 0 && (
            <TouchableOpacity 
              style={styles.finishBtn} 
              onPress={finalizeScanning}
              disabled={loading}
            >
              <Text style={styles.finishBtnText}>ESTABLISH MISSION CONNECTION ({scannedItems.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => navigation.goBack()}
      >
        <X color="white" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  text: { color: 'white', fontSize: 16 },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  middleContainer: {
    flexDirection: 'row',
    height: 250,
  },
  focusedContainer: {
    width: 250,
    height: 250,
    backgroundColor: 'transparent',
    position: 'relative'
  },
  cornerTL: { position:'absolute', top:0, left:0, width:40, height:40, borderColor:'#10b981', borderTopWidth:4, borderLeftWidth:4 },
  cornerTR: { position:'absolute', top:0, right:0, width:40, height:40, borderColor:'#10b981', borderTopWidth:4, borderRightWidth:4 },
  cornerBL: { position:'absolute', bottom:0, left:0, width:40, height:40, borderColor:'#10b981', borderBottomWidth:4, borderLeftWidth:4 },
  cornerBR: { position:'absolute', bottom:0, right:0, width:40, height:40, borderColor:'#10b981', borderBottomWidth:4, borderRightWidth:4 },
  instructionText: {
    color: 'white',
    fontSize: 14,
    marginTop: 20,
    fontWeight: '700'
  },
  finishBtn: {
    marginTop: 30,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  finishBtnText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
