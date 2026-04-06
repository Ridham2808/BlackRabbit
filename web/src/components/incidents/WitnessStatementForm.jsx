import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PenTool, Signature, CheckCircle, RotateCcw } from 'lucide-react';

/**
 * Witness Statement Form Component.
 * Captured statement text (min 50 chars), signature canvas, 
 * and automated GPS (latitude/longitude) capture.
 */
const WitnessStatementForm = ({ onSubmit, isLoading }) => {
  const sigRef = useRef();
  const [statement, setStatement] = useState('');
  const [gps, setGps] = useState(null);
  const [charLimitReached, setCharLimitReached] = useState(false);

  // Capture GPS on mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const clearSignature = () => sigRef.current.clear();

  const handleTextChange = (e) => {
    setStatement(e.target.value);
    setCharLimitReached(e.target.value.length >= 50);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!charLimitReached || sigRef.current.isEmpty()) return;

    const signatureData = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    
    onSubmit({
      statementText: statement,
      signatureData,
      latitude: gps?.lat,
      longitude: gps?.lng
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 italic">
            <PenTool className="w-4 h-4" /> Official Witness Statement
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${charLimitReached ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            {statement.length} / 50 characters min
          </span>
        </label>
        <textarea
          value={statement}
          onChange={handleTextChange}
          placeholder="Detailed account of observation. Please include specific time, sequence of events, and identified personnel..."
          rows={5}
          className="w-full bg-slate-50 border-slate-200 rounded-xl text-sm focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400 placeholder:italic p-4"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 italic">
            <Signature className="w-4 h-4" /> Digital Signature
          </span>
          <button 
            type="button" 
            onClick={clearSignature}
            className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 uppercase tracking-wider font-bold"
          >
            <RotateCcw className="w-3 h-3" /> Clear Signature
          </button>
        </label>
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden h-48">
          <SignatureCanvas 
            ref={sigRef}
            penColor="#1e293b"
            canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1.5 italic">
          <CheckCircle className="w-3 h-3 text-slate-300" />
          By signing, you attest that this statement is an accurate and truthful account of the incident. GPS location captured at: {gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'Detecting...'}
        </p>
      </div>

      <button
        type="submit"
        disabled={!charLimitReached || sigRef.current?.isEmpty() || isLoading}
        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 disabled:bg-slate-200 transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? 'Submitting Witness Statement...' : 'Submit Certified Statement'}
      </button>
    </form>
  );
};

export default WitnessStatementForm;
