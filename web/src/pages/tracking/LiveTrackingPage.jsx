import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';
import SmoothMarker from './SmoothMarker';
import { Crosshair, AlertTriangle, ShieldCheck, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCodeModal from '../../components/equipment/QRCodeModal';

// Helper component to center map on selection
function MapController({ centerPos }) {
  const map = useMap();
  useEffect(() => {
    if (centerPos) {
      map.flyTo(centerPos, map.getZoom(), { animate: true, duration: 1.5 });
    }
  }, [centerPos, map]);
  return null;
}

export default function LiveTrackingPage() {
  const [weaponsData, setWeaponsData] = useState({});
  const [selectedWeaponId, setSelectedWeaponId] = useState(null);
  const [followSelected, setFollowSelected] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  
  const testWeapon = {
    id: "WP-TEST-001",
    name: "Test Tracker Device",
    serialNumber: "TRK-999-XYZ",
    category: "TRACKER"
  };

  // Demo base coordinates (Ahmedabad for example, since user mentioned it previously)
  const defaultCenter = [23.0225, 72.5714];

  // Set up staleness checker interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
      // In a full implementation, you could also check for geofence breaches here
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Listen to Firebase Realtime Database
  useEffect(() => {
    const weaponsRef = ref(database, 'weapons');
    
    const listener = onValue(weaponsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setWeaponsData(data);
      } else {
        setWeaponsData({});
      }
    }, (error) => {
      console.error("Firebase subscription error:", error);
      toast.error("Failed to connect to tracking server");
    });

    return () => off(weaponsRef, 'value', listener);
  }, []);

  const weaponsList = Object.entries(weaponsData);
  const activeWeaponsCount = weaponsList.filter(([id, w]) => w.location?.isTracking).length;

  const handleWeaponClick = (id) => {
    setSelectedWeaponId(id);
    if (!followSelected) setFollowSelected(true);
  };

  const getSelectedCenter = () => {
    if (followSelected && selectedWeaponId && weaponsData[selectedWeaponId]?.location) {
      return [
        weaponsData[selectedWeaponId].location.lat,
        weaponsData[selectedWeaponId].location.lng
      ];
    }
    return null;
  };

  // Check if a weapon is stale (no update in last 30 seconds)
  const isStale = (timestamp) => {
    return (currentTime - timestamp) > 30000; 
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Map Section (70%) */}
      <div className="flex-[7] relative h-full">
        {typeof window !== 'undefined' && (
          <MapContainer 
            center={defaultCenter} 
            zoom={15} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            <MapController centerPos={getSelectedCenter()} />
            
            {weaponsList.map(([id, data]) => {
              if (!data.location || !data.location.lat || !data.location.lng) return null;
              
              const isWeaponStale = data.location.isTracking === false || isStale(data.location.timestamp);
              
              return (
                <SmoothMarker 
                  key={id} 
                  id={id} 
                  data={data}
                  isStale={isWeaponStale}
                />
              );
            })}
          </MapContainer>
        )}

        <div className="absolute top-4 left-4 z-[400]">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200 flex items-center gap-3">
            <ShieldCheck className="text-emerald-600" size={24} />
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">Live Tracking Server</h1>
              <p className="text-xs text-gray-500 font-medium">{activeWeaponsCount} Active Signals</p>
            </div>
          </div>
        </div>

        {selectedWeaponId && (
          <button 
            onClick={() => setFollowSelected(!followSelected)}
            className={`absolute bottom-6 left-6 z-[400] px-4 py-2 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 transition-all ${
              followSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Crosshair size={18} />
            {followSelected ? 'Following Weapon' : 'Follow Weapon'}
          </button>
        )}
      </div>

      {/* Status Panel (30%) */}
      <div className="flex-[3] bg-white border-l border-gray-200 h-full flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.05)] z-[400]">
        <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Tracking Roster</h2>
            <p className="text-sm text-gray-500">Real-time status of all deployed assets</p>
          </div>
          <button 
            onClick={() => setIsQRModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <QrCode size={18} />
            Connect App
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {weaponsList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
              <AlertTriangle size={48} className="mb-4 text-gray-300" />
              <p>No tracking data available. Weapons will appear here once scanning begins.</p>
            </div>
          ) : (
            weaponsList.map(([id, data]) => {
              if (!data.location) return null;
              
              const isWeaponStale = data.location.isTracking === false || isStale(data.location.timestamp);
              const isSelected = selectedWeaponId === id;
              
              const updateDiff = Math.floor((currentTime - data.location.timestamp) / 1000);
              let updateStr = "Just now";
              if (updateDiff > 5) updateStr = `${updateDiff}s ago`;
              if (updateDiff > 60) updateStr = `${Math.floor(updateDiff/60)}m ago`;

              return (
                <div 
                  key={id}
                  onClick={() => handleWeaponClick(id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50/50 shadow-md ring-1 ring-blue-500' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{data.info?.name || 'Unknown Weapon'}</h3>
                      <p className="text-xs text-gray-500 font-mono">{id}</p>
                    </div>
                    {isWeaponStale ? (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        SIGNAL LOST
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  
                  {data.info?.assignedToName && (
                    <p className="text-sm text-gray-700 mb-3 bg-gray-50 inline-block px-2 py-1 rounded">
                      <span className="font-medium text-gray-500 mr-2">Assigned to:</span>
                      {data.info.assignedToName}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mt-1">
                    <div className="text-gray-500">
                      Last Update: <span className="font-medium text-gray-800 ml-1">{updateStr}</span>
                    </div>
                    <div className="text-gray-500">
                      Battery: 
                      <span className={`font-medium ml-1 ${
                        data.location.batteryPercent < 20 ? 'text-red-600' : 
                        data.location.batteryPercent < 50 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {data.location.batteryPercent || 100}%
                      </span>
                    </div>
                    <div className="text-gray-500">
                      Speed: <span className="font-medium text-gray-800 ml-1">{data.location.speed ? (data.location.speed).toFixed(1) : 0} km/h</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* QR Code Modal for Testing App Connection */}
      <QRCodeModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
        weapon={testWeapon} 
      />
    </div>
  );
}
