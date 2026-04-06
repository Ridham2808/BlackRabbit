import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { ShieldCheck, Signature, CheckCircle, RotateCcw } from 'lucide-react';

/**
 * CO Acknowledgment Banner Component.
 * High-priority signature block for Commanding Officers 
 * to authorize STOLEN incident investigations.
 */
const CoAcknowledgmentBanner = ({ incidentNumber, onSubmit, isLoading }) => {
  const sigRef = useRef();
  const [notes, setNotes] = useState('');
  const [signed, setSigned] = useState(false);

  const clearSignature = () => sigRef.current.clear();
  
  const handleAcknowledge = () => {
    if (sigRef.current.isEmpty()) return;
    const signatureData = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    
    onSubmit({
      signatureData,
      acknowledgmentNotes: notes
    });
  };

  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-sm border-l-8 border-l-red-600">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-8 h-8 text-red-600 shrink-0" />
        <div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Commanding Officer Acknowledgment</h3>
          <p className="text-xs text-slate-600 italic">Mandatory CO signature required for theft incident: <span className="font-bold text-red-700">{incidentNumber}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Acknowledgment Notes (Optional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter special instructions for technical investigation team..."
              rows={4}
              className="w-full bg-white border-slate-200 rounded-xl text-sm focus:ring-red-600 focus:border-red-600 p-4"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1 flex justify-between">
            <span>Digital CO Signature</span>
            <button onClick={clearSignature} className="text-red-400 hover:text-red-600 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </label>
          <div className="bg-white border border-slate-200 rounded-xl h-40 relative group overflow-hidden">
            <SignatureCanvas 
              ref={sigRef}
              penColor="#111827"
              canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
              onEnd={() => setSigned(true)}
            />
            {!signed && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-10 transition-opacity">
                <Signature className="w-12 h-12" />
              </div>
            )}
          </div>
          <button
            onClick={handleAcknowledge}
            disabled={!signed || isLoading}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-700 disabled:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? 'Acknowledge Stolen Report...' : 'Certify & Authorize Investigation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoAcknowledgmentBanner;
