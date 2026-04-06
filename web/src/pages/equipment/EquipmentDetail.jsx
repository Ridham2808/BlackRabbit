import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, QrCode, MapPin, Clock, Package, ShieldCheck, AlertTriangle, User, Calendar, Activity, Info, Tag, Lock, Shield } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import api from '../../services/api'
import { StatusBadge, Spinner, PageHeader } from '../../components/ui'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { database } from '../../config/firebase'
import { ref, onValue } from 'firebase/database'

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function EquipmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [fbMeta, setFbMeta] = useState(null)

  const { data: eq, isLoading } = useQuery({
    queryKey: ['equipment', id],
    queryFn:  () => api.get(`/equipment/${id}`).then(r => r.data.data),
  })

  const { data: custody } = useQuery({
    queryKey: ['custody', id],
    queryFn:  () => api.get(`/equipment/${id}/custody-chain`).then(r => r.data.data),
  })

  useEffect(() => {
    if (!eq?.id) return;
    const weaponsRef = ref(database, `weapons/${eq.id}`);
    const listener = onValue(weaponsRef, (snapshot) => {
      setFbMeta(snapshot.val())
    });
    return () => listener();
  }, [eq?.id])

  if (isLoading) return <Spinner />
  if (!eq) return <div style={{ color:'#ef4444', padding:40, textAlign:'center', fontWeight:'bold' }}>Equipment not found or deleted.</div>

  const realLoc = fbMeta?.location;
  const isTracking = realLoc?.isTracking;
  const rtStatus = fbMeta?.info?.status || eq.status;

  const infoItem = (icon, label, value) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-sm font-semibold text-gray-800">{value || <span className="text-gray-300">Not Specified</span>}</div>
      </div>
    </div>
  )

  const mapCenter = realLoc?.lat ? [realLoc.lat, realLoc.lng] : (eq.last_known_latitude ? [eq.last_known_latitude, eq.last_known_longitude] : null);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <button 
        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 font-semibold text-sm mb-6 transition-all" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Primary Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Package size={150} />
        </div>
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
            <Package size={28} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{eq.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded">
                SN: {eq.serial_number}
              </span>
              <span className="text-sm font-bold text-gray-400 flex items-center gap-1">
                <Tag size={13} /> {eq.category_display || eq.category_name}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <StatusBadge status={rtStatus} />
          {eq.qr_code_url && (
            <a href={eq.qr_code_url} target="_blank" rel="noreferrer" 
               className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">
              <QrCode size={16} /> Print Tag
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Deep Specifications */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-2">
               <Info size={18} className="text-gray-500" />
               <h2 className="font-extrabold text-sm text-gray-800 tracking-wide">TECHNICAL SPECIFICATIONS</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {infoItem(<Package size={16}/>, 'Manufacturer', eq.manufacturer)}
              {infoItem(<Activity size={16}/>, 'Model Number', eq.model_number)}
              {infoItem(<Calendar size={16}/>, 'Purchase Date', eq.purchase_date ? new Date(eq.purchase_date).toLocaleDateString() : null)}
              {infoItem(<ShieldCheck size={16}/>, 'Current Condition', eq.condition)}
              {infoItem(<Clock size={16}/>, 'Total Usages', eq.total_checkout_count + ' operations')}
              {infoItem(<AlertTriangle size={16}/>, 'Maintenance Health', `Last: ${eq.last_maintenance_at ? new Date(eq.last_maintenance_at).toLocaleDateString() : 'Never'}`)}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-2">
               <User size={18} className="text-gray-500" />
               <h2 className="font-extrabold text-sm text-gray-800 tracking-wide">CUSTODY & ORBAT ASSIGNMENT</h2>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm">
                   <User size={20} className="text-slate-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Current Custodian</div>
                  <div className="text-lg font-extrabold text-slate-800">
                    {eq.current_custodian_name ? `${eq.current_custodian_name}` : 'Asset Currently in Armory'}
                  </div>
                  {eq.current_custodian_service_number && (
                    <div className="text-xs font-mono text-slate-400 mt-1">{eq.current_custodian_service_number}</div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {infoItem(<MapPin size={16}/>, 'Home Base', eq.home_base_name)}
                {infoItem(<ShieldCheck size={16}/>, 'Home Unit', eq.home_unit_name)}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Map & Ledger */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-sky-50 border-b border-sky-100 px-5 py-3 flex items-center gap-2">
               <MapPin size={16} className="text-sky-600" />
               <h2 className="font-extrabold text-sm text-sky-900 tracking-wide">TELEMETRY & LOCATION</h2>
            </div>
            <div className="h-64 bg-gray-100 relative">
              {!mapCenter ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <MapPin size={32} className="opacity-20" />
                  <span className="text-xs font-bold uppercase tracking-wider">No GPS Data Available</span>
                </div>
              ) : (
                <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <Marker position={mapCenter} icon={customIcon}>
                    <Popup>
                      <strong className="font-bold">{eq.name}</strong><br/>
                      {rtStatus} {isTracking && ' (Live)'}
                    </Popup>
                  </Marker>
                </MapContainer>
              )}
            </div>
            {isTracking && realLoc && (
              <div className="px-5 py-3 bg-white border-t border-gray-100 flex justify-between items-center text-xs">
                 <div className="font-bold text-emerald-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> LIVE TRACKING ACTIVE</div>
                 <div className="font-mono text-gray-500">{realLoc.speed?.toFixed(1) || 0} km/h • {realLoc.batteryPercent || 100}% BAT</div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-2">
               <Clock size={16} className="text-gray-500" />
               <h2 className="font-extrabold text-sm text-gray-800 tracking-wide">CUSTODY LEDGER</h2>
            </div>
            <div className="p-5 max-h-96 overflow-y-auto">
              {!custody?.length ? (
                <div className="text-center text-sm font-semibold text-gray-400 py-6">No historical custody records found.</div>
              ) : (
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-4 py-2">
                  {custody.map((c, i) => (
                    <div key={c.id} className="relative pl-6">
                      <div className="absolute w-4 h-4 rounded-full bg-white border-2 border-gray-300 -left-[9px] top-1"></div>
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-sm text-gray-900">{c.event_type?.replace(/_/g,' ')}</div>
                        {c.duration_mins && (
                          <div className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {Math.floor(c.duration_mins / 60)}h {c.duration_mins % 60}m
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs font-semibold text-gray-500 mt-0.5">
                        {new Date(c.timestamp || c.created_at).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
                        {c.purpose && <span className="text-gray-400 ml-2 font-normal">— {c.purpose}</span>}
                      </div>
                      
                      <div className="text-[11px] text-gray-600 mt-2 bg-gray-50 border border-gray-100 rounded flex flex-col overflow-hidden">
                        <div className="p-2">
                          <span className="font-bold text-gray-800">{c.performed_by_name}</span> logged this tracking event.
                          {(c.from_custodian_name || c.to_custodian_name) && (
                            <div className="mt-2 flex items-center gap-2 font-mono text-[10px] bg-white p-1 rounded border border-gray-100">
                              {c.from_custodian_name && <span className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded">[-] {c.from_custodian_name}</span>}
                              {c.from_custodian_name && c.to_custodian_name && <span className="text-gray-300">→</span>}
                              {c.to_custodian_name && <span className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">[+] {c.to_custodian_name}</span>}
                            </div>
                          )}
                          {(c.condition_in || c.condition_out) && (
                            <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
                              {c.condition_out && <span className="text-gray-500">OUT: <span className="text-gray-800">{c.condition_out}</span></span>}
                              {c.condition_in && <span className="text-gray-500">IN: <span className="text-gray-800">{c.condition_in}</span></span>}
                            </div>
                          )}
                        </div>
                        {c.tamper_hash && (
                          <div className={`px-2 py-1 text-[9px] font-mono border-t flex items-center gap-1 ${c.tamper_hash.startsWith('ERR') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                            <Lock size={10} /> 
                            {c.tamper_hash}
                            {c.digital_sign && <span className="ml-1 flex items-center gap-0.5 text-emerald-600"><Shield size={9}/> Signed</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
