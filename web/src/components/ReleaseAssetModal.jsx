
import React, { useState, useEffect } from 'react';
import { Modal, Field, Spinner } from './ui';
import HandoverQR from './HandoverQR';
import api from '../services/api';
import { QrCode, CheckCircle, Package, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReleaseAssetModal({ open, onClose, request, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Select Asset, 2: Show QR
  const [equipment, setEquipment] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && request) {
      setStep(1);
      setSelectedItem(null);
      fetchAvailableItems();
    }
  }, [open, request]);

  const fetchAvailableItems = async () => {
    setLoading(true);
    try {
      // Fetch operational equipment for this category
      const res = await api.get(`/equipment?status=OPERATIONAL&category_id=${request.equipment_category_id}`);
      setEquipment(res.data.data?.items || res.data.data || []);
    } catch (err) {
      toast.error('Failed to load available equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    setSelectedItem(item);
    setStep(2);
  };

  return (
    <Modal open={open} onClose={onClose} title="Handover Asset" width={480}>
      <div style={{ padding: '8px 4px' }}>
        
        {step === 1 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Releasing For</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{request?.requester_name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Request: {request?.category_name}</div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Select Specific Asset to Release:</div>
            
            {loading ? <Spinner /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {equipment.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 32, background: '#f8fafc', borderRadius: 16 }}>
                    <Package size={24} color="#cbd5e1" style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13, color: '#64748b' }}>No operational {request?.category_name} available in inventory.</div>
                  </div>
                ) : equipment.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => handleSelect(item)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '14px 18px', background: '#fff', border: '1px solid #e2e8f0', 
                      borderRadius: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#111827'}
                    onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>S/N: {item.serial_number}</div>
                    </div>
                    <ArrowRight size={16} color="#cbd5e1" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center' }}>
            <HandoverQR 
              title="Identity Checkout"
              subtitle="The soldier scanning this code represents their intent to take custody of this asset"
              asset={selectedItem}
              payload={{
                type: 'EQUIPMENT_HANDOVER',
                action: 'CHECKOUT',
                requestId: request?.id,
                equipmentId: selectedItem?.id,
                serialNumber: selectedItem?.serial_number,
                timestamp: new Date().toISOString()
              }}
            />


            <button 
              onClick={onClose}
              style={{ width: '100%', marginTop: 24, padding: '14px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Done / Handover Complete
            </button>
          </div>
        )}

      </div>
    </Modal>
  );
}
