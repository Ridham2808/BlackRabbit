import React from 'react';
import QRCodePackage from 'react-qr-code';
import { QrCode as QrCodeIcon, ShieldCheck, Info } from 'lucide-react';

// Handle potential ESM/CJS interop issues with react-qr-code in Vite
const QRCode = QRCodePackage.default || QRCodePackage;

/**
 * HandoverQR Component
 * Renders a premium QR code display for equipment handover/return.
 */
export default function HandoverQR({ 
  title = "Handover Verification", 
  subtitle = "Scan this code with the mobile app", 
  payload = {}, 
  asset = {},
  loading = false
}) {
  // Ensure we have a valid string for the QR code
  const qrValue = React.useMemo(() => {
    try {
      if (!payload) return "";
      return typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
    } catch (e) {
      console.error("Serialized error:", e);
      return "ERROR_SERIALIZING_PAYLOAD";
    }
  }, [payload]);

  // Defensive check for rendering-causing errors
  if (typeof QRCode !== 'function' && typeof QRCode !== 'object') {
    console.error("QRCode component is not valid:", QRCode);
    return <div style={{ color: 'red' }}>Format Error: Thermal Printer Link Failure</div>;
  }

  return (
    <div style={{ textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          width: 56, height: 56, borderRadius: 16, 
          background: '#f0fdf4', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 16px',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.1)'
        }}>
          {typeof QrCodeIcon === 'function' ? (
            <QrCodeIcon size={28} color="#16a34a" />
          ) : (
            <div style={{ width: 28, height: 28, background: '#16a34a', borderRadius: '50%' }} />
          )}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6, letterSpacing: '-0.5px' }}>
          {title}
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', maxWidth: 280, margin: '0 auto' }}>
          {subtitle}
        </p>
      </div>

      <div style={{ 
        background: '#fff', 
        padding: 24, 
        borderRadius: 28, 
        border: '1px solid #f1f5f9', 
        display: 'inline-block', 
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
        position: 'relative'
      }}>
        {loading && (
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: 'rgba(255,255,255,0.8)', 
            display: 'flex', alignItems: 'center', 
            justifyContent: 'center', borderRadius: 28, 
            zIndex: 10 
          }}>
            <div className="animate-spin-fast" style={{ width: 32, height: 32, border: '3px solid #f3f3f3', borderTop: '3px solid #111827', borderRadius: '50%' }} />
          </div>
        )}
        <div style={{ padding: 12, background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
          {qrValue ? (
            <QRCode 
              value={qrValue} 
              size={240} 
              level="H"
              style={{ height: "auto", maxWidth: "100%", width: "100%" }} 
            />
          ) : (
            <div style={{ width: 240, height: 240, background: '#f8fafc', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>
              Awaiting payload generation...
            </div>
          )}
        </div>
      </div>

      <div style={{ 
        marginTop: 28, 
        padding: '16px 20px', 
        background: '#f8fafc', 
        borderRadius: 20, 
        textAlign: 'left',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {typeof Info === 'function' ? <Info size={14} color="#9ca3af" /> : null}
          <span style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Identity Verified
          </span>
        </div>
        <div style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{asset?.name || 'Unknown Equipment'}</div>
        <div style={{ fontSize: 13, color: '#64748b', fontFamily: 'monospace', marginTop: 4 }}>
          S/N: {asset?.serial_number || 'N/A'}
        </div>
        
        <div style={{ 
          marginTop: 14, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          color: '#16a34a', 
          fontSize: 12, 
          fontWeight: 700 
        }}>
          {typeof ShieldCheck === 'function' ? <ShieldCheck size={14} /> : null} Waiting for secure mobile sync...
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-fast { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}
