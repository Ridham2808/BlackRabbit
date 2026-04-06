
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Clipboard } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store';

export default function RequestEquipmentModal({ isOpen, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    equipment_category_id: '',
    purpose: 'TRAINING',
    expected_return_at: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      api.get('/equipment/categories').then(res => {
        setCategories(res.data.data || []);
      }).catch(err => console.error('Failed to load categories', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/checkouts/requests', formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)',
      padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, width: '100%', maxWidth: 500,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        overflow: 'hidden', animation: 'modalSlideUp 0.3s ease-out'
      }}>
        <div style={{ padding: '24px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Request Equipment</h2>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>Submit a digital request for equipment</p>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 12, padding: 8, cursor: 'pointer', color: '#6b7280' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 12, padding: '12px 16px', color: '#dc2626', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Equipment Category */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Equipment Type</label>
              <div style={{ position: 'relative' }}>
                <select
                  required
                  value={formData.equipment_category_id}
                  onChange={e => setFormData({ ...formData, equipment_category_id: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 500, color: '#111827', appearance: 'none' }}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.display_name}</option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Clipboard size={16} color="#9ca3af" />
                </div>
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Purpose</label>
              <select
                required
                value={formData.purpose}
                onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 500, color: '#111827' }}
              >
                <option value="TRAINING">Training</option>
                <option value="MISSION">Mission</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="EXERCISE">Exercise</option>
                <option value="INSPECTION">Inspection</option>
              </select>
            </div>

            {/* Expected Return */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Return Deadline</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="datetime-local"
                  required
                  value={formData.expected_return_at}
                  onChange={e => setFormData({ ...formData, expected_return_at: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 500, color: '#111827' }}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Location / Range</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g. Zone B Range"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px 12px 42px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 500, color: '#111827' }}
                />
                <MapPin size={18} color="#9ca3af" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', marginTop: 32, padding: '16px',
              background: '#111827', color: '#fff', border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Submitting...' : 'Send Request'}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
