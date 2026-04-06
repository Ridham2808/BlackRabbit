
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { QrCode, CheckCircle, ChevronLeft, ShieldCheck, AlertCircle, ClipboardList, Info, Package, Search, ArrowRight } from 'lucide-react';
import HandoverQR from '../components/HandoverQR';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CheckInProcess() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Select Active Item, 2: Show QR, 3: Success
  const [activeCheckouts, setActiveCheckouts] = useState([]);
  const [selectedCheckout, setSelectedCheckout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchActiveCheckouts();
  }, []);

  const fetchActiveCheckouts = async () => {
    setLoading(true);
    try {
      // Fetch currently checked out items
      const res = await api.get('/checkouts?status=ACTIVE');
      setActiveCheckouts(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load active checkouts');
    } finally {
      setLoading(false);
    }
  };

  // Firebase listener for real-time return sync
  useEffect(() => {
    let unsubscribe = null;
    if (step === 2 && selectedCheckout?.equipment_id) {
      const weaponRef = ref(database, `weapons/${selectedCheckout.equipment_id}`);
      unsubscribe = onValue(weaponRef, (snapshot) => {
        const data = snapshot.val();
        // If the mobile app has marked it as OPERATIONAL, we sync the web UI
        if (data?.info?.status === 'OPERATIONAL') {
          toast.success(`Check-in Received: ${selectedCheckout.equipment_name} is back.`);
          // Allow a tiny delay then trigger success state or redirect
          setTimeout(() => {
            setStep(3);
          }, 1500);
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [step, selectedCheckout, navigate]);

  const handleSelectItem = (checkout) => {
    setSelectedCheckout(checkout);
    setStep(2);
  };

  const filteredCheckouts = activeCheckouts.filter(c => 
    c.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.personnel_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 8, cursor: 'pointer' }}>
            <ChevronLeft size={20} />
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Equipment Return Station</h1>
        </div>

        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= i ? '#111827' : '#e2e8f0', transition: 'background 0.3s' }} />
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          
          {step === 1 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Package size={32} color="#3b82f6" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Select Item to Return</h2>
                <p style={{ fontSize: 14, color: '#9ca3af' }}>Select the equipment currently out in the field</p>
              </div>

              <div style={{ marginBottom: 20, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input 
                  type="text" 
                  placeholder="Search by name, serial, or personnel..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '14px 14px 14px 44px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, fontSize: 14 }}
                />
              </div>

              {loading ? <div style={{ textAlign: 'center', padding: 40 }}>Loading active sessions...</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredCheckouts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>No matching active checkouts found.</div>
                  ) : filteredCheckouts.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => handleSelectItem(c)}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                        padding: '16px 20px', background: '#fff', border: '1px solid #e2e8f0', 
                        borderRadius: 16, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#111827'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#111827', marginBottom: 2 }}>{c.equipment_name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>S/N: {c.serial_number}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Custodian: <strong>{c.personnel_name}</strong></div>
                      </div>
                      <ArrowRight size={18} color="#cbd5e1" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div style={{ textAlign: 'center' }}>
              <HandoverQR 
                title="Verify Asset Return"
                subtitle="The soldier must scan this code to digitally confirm they represent the return of this specific asset"
                asset={{
                  name: selectedCheckout?.equipment_name,
                  serial_number: selectedCheckout?.serial_number
                }}
                payload={{
                  type: 'EQUIPMENT_HANDOVER',
                  action: 'CHECKIN',
                  checkoutId: selectedCheckout?.id,
                  equipmentId: selectedCheckout?.equipment_id,
                  serialNumber: selectedCheckout?.serial_number,
                  timestamp: new Date().toISOString()
                }}
              />

              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button 
                  onClick={() => setStep(1)} 
                  style={{ flex: 1, padding: '16px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(3)} // In demo we skip mobile scan verification
                  style={{ flex: 2, padding: '16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  Manual Confirm (Admin Override)
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle size={48} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 12 }}>Return Completed</h2>
              <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.6, marginBottom: 32 }}>
                <strong>{selectedCheckout?.equipment_name}</strong> has been successfully returned to the armory and marked as OPERATIONAL.
              </p>
              
              <button 
                onClick={() => navigate('/dashboard')}
                style={{ width: '100%', padding: '16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
              >
                Back to Dashboard
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
