import React from 'react';
import { ShieldCheck, FileText, Lock, ShieldAlert, Download, MoreVertical } from 'lucide-react';
import dayjs from 'dayjs';

/**
 * Evidence Gallery with SHA-256 Integrity Verification.
 * Displays locked evidence files, their hashes, and 
 * original GPS metadata from the EXIF processing.
 */
const EvidenceGallery = ({ evidence = [] }) => {
  if (evidence.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400">
        <Lock className="w-10 h-10 opacity-20 mb-4" />
        <p className="text-sm font-medium">No verified evidence uploaded yet</p>
        <p className="text-[10px] uppercase tracking-widest mt-2 font-bold">Immutability Protocol Active</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {evidence.map((item, idx) => (
        <div key={item.fileId || idx} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-slate-300">
          <div className="aspect-video bg-slate-100 relative overflow-hidden">
            {item.mimeType?.startsWith('image/') ? (
              <img 
                src={`/uploads/evidence/${item.storedFilename}`} 
                alt={item.originalFilename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileText className="w-12 h-12 text-slate-300" />
              </div>
            )}
            
            {/* Integrity Badge */}
            <div className="absolute top-2 left-2 z-10">
              <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg border border-white/50 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-green-600" />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">Verified HASH</span>
              </div>
            </div>

            <div className="absolute top-2 right-2 flex gap-1 transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
              <button className="p-2 bg-white/90 hover:bg-white rounded-lg border border-slate-200 shadow-sm transition-colors">
                <Download className="w-3.5 h-3.5 text-slate-700" />
              </button>
              <button className="p-2 bg-white/90 hover:bg-white rounded-lg border border-slate-200 shadow-sm transition-colors">
                <MoreVertical className="w-3.5 h-3.5 text-slate-700" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-black text-slate-900 truncate max-w-[200px]">{item.originalFilename}</h4>
                <p className="text-[10px] text-slate-400 font-medium">Uploaded {dayjs(item.uploadedAt).format('MMM DD, YYYY HH:mm')}</p>
              </div>
              <span className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md font-bold text-slate-600 uppercase tracking-widest leading-none">
                {item.mimeType?.split('/')[1] || 'FILE'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-slate-400" />
                <p className="text-[9px] font-mono text-slate-500 break-all leading-tight">
                  <span className="font-bold text-slate-600">SHA-256:</span> {item.sha256Hash}
                </p>
              </div>
              {item.exifGpsLat && (
                <div className="flex items-center gap-2 border-t border-slate-100 pt-1.5">
                  <ShieldAlert className="w-3 h-3 text-amber-500" />
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-tight">
                    EXIF GPS: {item.exifGpsLat.toFixed(5)}, {item.exifGpsLng.toFixed(5)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EvidenceGallery;
