import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, CheckCircle, ChevronLeft, Package, ArrowRight, Search, Info, ShieldAlert } from 'lucide-react';
import HandoverQR from '../components/HandoverQR';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CheckoutProcess() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Select Asset, 2: Show QR, 3: Success
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    fetchOperationalAssets();
  }, []);

  const fetchOperationalAssets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/equipment?status=OPERATIONAL');
      // The backend returns { data: rows, pagination: ... }
      const rawData = res.data.data?.data || res.data.data?.items || res.data.data || [];
      setAssets(Array.isArray(rawData) ? rawData : []);
    } catch (err) {
      toast.error("Failed to load operational equipment");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = Array.isArray(assets) ? assets.filter(a => {
    const cleanSearch = searchTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanName = a.name?.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSerial = a.serial_number?.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanName?.includes(cleanSearch) || cleanSerial?.includes(cleanSearch);
  }) : [];

  // Firebase listener for real-time handover sync
  useEffect(() => {
    let unsubscribe = null;
    if (step === 2 && selectedAsset?.id) {
      const weaponRef = ref(database, `weapons/${selectedAsset.id}`);
      unsubscribe = onValue(weaponRef, (snapshot) => {
        const data = snapshot.val();
        // If the mobile app has marked it as CHECKED_OUT, we sync the web UI
        if (data?.info?.status === 'CHECKED_OUT') {
          toast.success(`Handover Complete: ${selectedAsset.name} has been issued.`);
          // Allow a tiny delay then redirect
          setTimeout(() => {
            navigate('/checkouts');
          }, 1500);
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [step, selectedAsset, navigate]);

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    setStep(2);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 8, cursor: 'pointer' }}>
            <ChevronLeft size={20} />
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Self-Service Checkout Station</h1>
        </div>

        <div style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Operational Assets Registry</h2>
                <p style={{ fontSize: 14, color: '#64748b' }}>Select the specific equipment being issued to the soldier</p>
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Search by Name or Serial Number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 14, fontFamily: 'inherit' }}
                />
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ marginLeft: 12, color: '#64748b', fontSize: 14 }}>Loading inventory...</span>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: 24, border: '2px dashed #e2e8f0' }}>
                  <Package size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14, color: '#64748b' }}>No operational equipment found matching "{searchTerm}"</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredAssets.map(asset => (
                    <div 
                      key={asset.id}
                      onClick={() => handleSelectAsset(asset)}
                      style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#111827'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShieldAlert size={20} color="#16a34a" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#111827' }}>{asset.name}</div>
                          <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>S/N: {asset.serial_number}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '4px 10px', borderRadius: 20 }}>OPERATIONAL</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div style={{ textAlign: 'center' }}>
              <HandoverQR 
                title="Scan to Authorize"
                subtitle="Soldier: Scan this QR with your mobile app to initiate the checkout of this specific item."
                asset={selectedAsset}
                payload={{
                  type: 'EQUIPMENT_HANDOVER',
                  action: 'CHECKOUT',
                  equipmentId: selectedAsset?.id,
                  serialNumber: selectedAsset?.serial_number,
                  timestamp: new Date().toISOString()
                }}
              />

              <div style={{ marginTop: 32, padding: 20, background: '#f8fafc', borderRadius: 20, border: '1px solid #edf2f7', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Info size={16} color="#64748b" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Instructions for Soldier</span>
                </div>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  1. Open the DEAS app on your smartphone.<br/>
                  2. Tap "Self-Scan Handover".<br/>
                  3. Verify the weapon details and provide your digital signature.<br/>
                  4. The weapon will be officially registered to your custody.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '16px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Select Different Asset
                </button>
                <button 
                  onClick={() => navigate('/dashboard')}
                  style={{ flex: 2, padding: '16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle size={48} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 12 }}>Handover Authorized</h2>
              <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.6, marginBottom: 32 }}>
                The weapon selection has been sent for checkout.
              </p>
            </div>
          )}

        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
