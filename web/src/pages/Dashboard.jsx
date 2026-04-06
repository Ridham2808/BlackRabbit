import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import api from '../services/api';
import { database } from '../config/firebase';
import { ref, onValue, off } from 'firebase/database';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import SmoothMarker from './tracking/SmoothMarker';
import 'leaflet/dist/leaflet.css';
import { 
  Search, ShieldAlert, Package, Navigation, MapPin, 
  Clock, AlertTriangle, ArrowRight, ShieldCheck,
  Eye, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';

// Custom Map Controller
function MapController({ centerPos }) {
  const map = useMap();
  useEffect(() => {
    if (centerPos) {
      map.flyTo(centerPos, map.getZoom(), { animate: true, duration: 1.5 });
    }
  }, [centerPos, map]);
  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Data
  const [dbAssets, setDbAssets] = useState([]);
  const [firebaseData, setFirebaseData] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('All Units');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [missionFilter, setMissionFilter] = useState('All Missions');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Selected for map
  const [selectedAssetId, setSelectedAssetId] = useState(null);

  // Timer for staleness
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Static PostgreSQL Roster + Live Firebase Engine
  useEffect(() => {
    let unsubs = [];
    
    // Attach to Firebase Realtime Link
    const weaponsRef = ref(database, 'weapons');
    const u1 = onValue(weaponsRef, (snapshot) => {
      const data = snapshot.val() || {};
      console.log(`[Web Dashboard] Firebase weapons sync received:`, Object.keys(data).length, `items`);
      setFirebaseData(data);
    });
    unsubs.push(u1);

    const checkoutsRef = ref(database, 'activeSessions');
    const u2 = onValue(checkoutsRef, (snapshot) => {
      // Just an example if they actually have activeSessions node, not strict required
    });
    unsubs.push(u2);

    return () => {
      console.log('[Web Dashboard] Cleaning up Firebase listeners');
      unsubs.forEach(u => u());
    }
  }, [user]);

  // Sync PostgreSQL baseline data
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        console.log('[Web Dashboard] Requesting PostgreSQL Base Equipment (/equipment?limit=1000)');
        const res = await api.get('/equipment?limit=1000');
        let assets = res.data.data.results || [];
        console.log(`[Web Dashboard] DB Returned ${assets.length} items`);
        
        // Scope restrictions based on Role
        if (user.role === 'SOLDIER') {
          assets = assets.filter(a => a.current_custodian_id === user.id);
        } else if (user.role === 'SERGEANT') {
          assets = assets.filter(a => a.home_unit_id === user.unitId || a.home_unit_id === user.unit_id);
        }
        setDbAssets(assets);
      } catch (err) {
        console.error("[Web Dashboard] Failed to load DB roster", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBaseData();
  }, [user]);

  // Merge SQL & Firebase Data for real-time overview
  const liveAssets = useMemo(() => {
    console.log('[Web Dashboard] Merging PostgreSQL baseline with Firebase Realtime States...');
    return dbAssets.map(asset => {
      const fbMeta = firebaseData[asset.id] || {};
      const session = activeSessions[asset.id] || null;

      let rtStatus = asset.status;
      let isTracking = false;
      let lastLoc = null;
      
      if (fbMeta.location) {
        lastLoc = fbMeta.location;
        isTracking = fbMeta.location.isTracking;
        // Evaluate if missing/stale if checked out
        const isStale = (Date.now() - fbMeta.location.timestamp) > 40000;
        if (isTracking && isStale) {
          rtStatus = 'LOST';
        }
      }
      if (fbMeta.info?.status) {
         rtStatus = fbMeta.info.status; // Override if actively hooked
      }

      // Overdue check
      let isOverdue = false;
      if (rtStatus === 'CHECKED_OUT' && asset.expected_return_at) {
        if (new Date(asset.expected_return_at) < new Date(currentTime)) {
          isOverdue = true;
        }
      }

      return {
        ...asset,
        rtStatus,
        isTracking,
        isOverdue,
        lastLoc,
        fbMeta
      };
    });
  }, [dbAssets, firebaseData, currentTime]);

  // Apply User UI Filters
  const filteredAssets = useMemo(() => {
    return liveAssets.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) || 
                            item.serial_number?.toLowerCase().includes(search.toLowerCase());
      const matchesUnit = unitFilter === 'All Units' || item.home_unit_name === unitFilter;
      const matchesStatus = statusFilter === 'All Statuses' || item.rtStatus === statusFilter;
      const matchesType = typeFilter === 'All Types' || item.category_name?.includes(typeFilter) || item.category_display?.includes(typeFilter);
      return matchesSearch && matchesUnit && matchesStatus && matchesType;
    });
  }, [liveAssets, search, unitFilter, statusFilter, typeFilter]);

  // Generate Summary Stats
  const stats = useMemo(() => {
    return {
      total: liveAssets.length,
      checkedOut: liveAssets.filter(a => a.rtStatus === 'CHECKED_OUT').length,
      maintenance: liveAssets.filter(a => a.rtStatus === 'UNDER_MAINTENANCE').length,
      missing: liveAssets.filter(a => a.rtStatus === 'LOST' || a.rtStatus === 'MISSING').length,
      decommissioned: liveAssets.filter(a => a.rtStatus === 'DECOMMISSIONED').length,
    }
  }, [liveAssets]);

  // Extract unique filters
  const uniqueUnits = ['All Units', ...new Set(liveAssets.map(a => a.home_unit_name).filter(Boolean))];
  const uniqueTypes = ['All Types', ...new Set(liveAssets.map(a => a.category_name).filter(Boolean))];

  // Helper for Status UI
  const getStatusUI = (item) => {
    if (item.rtStatus === 'LOST' || item.rtStatus === 'MISSING') {
      return { label: 'MISSING 🚨', color: 'bg-red-50 text-red-700 animate-pulse ring-1 ring-red-500', rowColor: 'bg-red-50' };
    }
    if (item.isOverdue) {
      return { label: 'OVERDUE 🔴', color: 'bg-rose-100 text-rose-800 font-bold ring-1 ring-rose-500', rowColor: 'bg-rose-50' };
    }
    if (item.rtStatus === 'CHECKED_OUT') {
      return { label: 'CHECKED OUT 🔵', color: 'bg-sky-100 text-sky-800 font-bold ring-1 ring-sky-300', rowColor: 'bg-sky-50/40' };
    }
    if (item.rtStatus === 'UNDER_MAINTENANCE') {
      return { label: 'MAINTENANCE 🟡', color: 'bg-amber-100 text-amber-800 font-bold ring-1 ring-amber-300', rowColor: 'bg-amber-50/50' };
    }
    if (item.rtStatus === 'DECOMMISSIONED') {
      return { label: 'RETIRED ⬛', color: 'bg-gray-100 text-gray-500 font-bold ring-1 ring-gray-300', rowColor: 'bg-gray-100/50' };
    }
    return { label: 'AVAILABLE ⬜', color: 'bg-white text-gray-700 border border-gray-200', rowColor: 'bg-white' };
  };

  const getAlerts = () => {
    const alerts = [];
    liveAssets.forEach(item => {
      if (item.rtStatus === 'LOST' || item.rtStatus === 'MISSING') {
        alerts.push({ type: 'CRITICAL', title: `${item.serial_number} MISSING`, desc: `Last seen: ${item.lastLoc?.timestamp ? new Date(item.lastLoc.timestamp).toLocaleTimeString() : 'Unknown'}`, action: 'Investigate' });
      } else if (item.isOverdue) {
        alerts.push({ type: 'WARNING', title: `${item.serial_number} OVERDUE`, desc: `${item.current_custodian_name || 'Assigned Agent'} is late for return`, action: 'Escalate' });
      } else if (item.rtStatus === 'UNDER_MAINTENANCE') {
        alerts.push({ type: 'INFO', title: `${item.serial_number} Maintenance`, desc: `Service ongoing for ${item.name}`, action: 'View Details' });
      }
    });
    return alerts;
  };

  const renderSelectedMapCenter = () => {
    if (selectedAssetId && firebaseData[selectedAssetId]?.location) {
      return [firebaseData[selectedAssetId].location.lat, firebaseData[selectedAssetId].location.lng];
    }
    return [23.0225, 72.5714]; // Default Center (Ahmedabad config default)
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-gray-50">Loading Secure Portal...</div>;
  }

  return (
    <div className="h-screen w-full bg-gray-100/50 flex flex-col font-sans overflow-hidden py-4 px-6 gap-5">
      
      {/* SECTION 1 — Top Summary Cards */}
      <div className="flex gap-4 min-h-[100px]">
        {[
          { label: 'TOTAL ASSETS', val: stats.total, color: 'border-b-4 border-slate-400' },
          { label: 'CHECKED OUT', val: stats.checkedOut, color: 'border-b-4 border-sky-500', bg: 'bg-sky-50/30' },
          { label: 'UNDER MAINTENANCE', val: stats.maintenance, color: 'border-b-4 border-amber-500', bg: 'bg-amber-50/30' },
          { label: 'LOST / MISSING', val: stats.missing, color: 'border-b-4 border-red-500 bg-red-50', bg: 'bg-red-50/50' },
          { label: 'DECOMMISSIONED', val: stats.decommissioned, color: 'border-b-4 border-gray-600', bg: 'bg-gray-100/50' },
        ].map(card => (
          <div key={card.label} className={`flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col items-center justify-center p-4 transition-all hover:-translate-y-1 ${card.bg || ''} ${card.color}`}>
             <div className="text-xs font-bold tracking-wider text-gray-500 mb-2">{card.label}</div>
             <div className="text-4xl font-extrabold text-slate-800">{card.val}</div>
          </div>
        ))}
      </div>

      {/* SECTION 2 — Filter Bar */}
      <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search serial, name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        
        {user.role !== 'SOLDIER' && (
          <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none">
            {uniqueUnits.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        )}
        
        {user.role !== 'SOLDIER' && (
          <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none">
            <option>All Locations</option>
            <option>Field Area</option>
            <option>Storage</option>
          </select>
        )}

        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none">
          {uniqueTypes.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none">
          <option>All Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="CHECKED_OUT">CHECKED OUT</option>
          <option value="LOST">MISSING</option>
        </select>
      </div>

      <div className="flex-1 min-h-0 flex gap-5">
        
        <div className="flex-[3] flex flex-col gap-5 min-w-0">
          {/* SECTION 3 — Main Asset Table */}
          <div className="flex-[4] bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="px-5 py-3 bg-gray-800 text-white flex justify-between items-center">
              <h2 className="font-bold tracking-wide flex items-center gap-2"><Activity size={18}/> LIVE ASSET ROSTER</h2>
            </div>
            <div className="overflow-auto flex-1 p-2">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="p-3 font-semibold w-24">Asset ID</th>
                    <th className="p-3 font-semibold w-28">Type</th>
                    <th className="p-3 font-semibold">Assigned To</th>
                    <th className="p-3 font-semibold">Unit</th>
                    <th className="p-3 font-semibold text-center w-40">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map(item => {
                    const ui = getStatusUI(item);
                    return (
                      <tr 
                        key={item.id} 
                        onClick={() => setSelectedAssetId(item.id)}
                        className={`border-b border-gray-50 cursor-pointer transition-colors ${ui.rowColor} hover:brightness-95`}
                      >
                        <td className="p-3 font-mono font-medium text-slate-700">{item.serial_number}</td>
                        <td className="p-3 font-medium text-slate-600">{item.category_display || item.category_name}</td>
                        <td className="p-3 font-medium text-slate-800">{item.current_custodian_name || '—'}</td>
                        <td className="p-3 text-slate-600">{item.home_unit_name || '—'}</td>
                        <td className="p-3 text-center">
                          <span className={`px-3 py-1 rounded inline-block text-[10px] w-full ${ui.color}`}>
                            {ui.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4 — Live Map View */}
          <div className="flex-[3] bg-white rounded-xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-gray-900/60 to-transparent z-[500] px-4 flex items-center">
               <span className="text-white font-bold text-xs flex items-center gap-2"><MapPin size={14}/> BASE TACTICAL MAP</span>
            </div>
            <MapContainer center={[23.0225, 72.5714]} zoom={15} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <MapController centerPos={renderSelectedMapCenter()} />
              {liveAssets.map(item => {
                if (!item.lastLoc || !item.lastLoc.lat) return null;
                const isStaleItem = (Date.now() - item.lastLoc.timestamp) > 40000;
                return (
                  <SmoothMarker key={item.id} id={item.serial_number} data={item.fbMeta} isStale={isStaleItem} />
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* SECTION 5 — Alert Panel */}
        <div className="flex-1 min-w-[300px] bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="bg-red-50/50 border-b border-red-100 px-5 py-3 flex items-center gap-2">
            <ShieldAlert className="text-red-600" size={18} />
            <h3 className="font-bold text-red-900">ACTIVE ALERTS</h3>
          </div>
          <div className="flex-1 overflow-auto p-4 flex flex-col gap-3 bg-gray-50/30">
            {getAlerts().length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-400 gap-3">
                <ShieldCheck size={40} className="text-emerald-400/50" />
                <span className="text-sm font-medium">All clear on the tactical front</span>
              </div>
            ) : (
              getAlerts().map((alert, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex gap-3">
                  <div className="pt-1">
                    {alert.type === 'CRITICAL' ? <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> : 
                     alert.type === 'WARNING' ? <div className="w-3 h-3 rounded-full bg-rose-500" /> :
                     <div className="w-3 h-3 rounded-full bg-amber-400" /> }
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-extrabold pb-1 flex justify-between">
                      <span className={alert.type === 'CRITICAL' ? 'text-red-700' : alert.type === 'WARNING' ? 'text-rose-700' : 'text-amber-700'}>
                         {alert.type}
                      </span>
                    </div>
                    <div className="font-bold text-gray-900 text-sm">{alert.title}</div>
                    <div className="text-xs text-gray-500 mt-1 mb-2">{alert.desc}</div>
                    <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:text-blue-800">
                      [{alert.action} <ArrowRight size={10}/>]
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}