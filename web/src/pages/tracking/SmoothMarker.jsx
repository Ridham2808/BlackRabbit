import React, { useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Battery, BatteryLow, BatteryMedium, Clock, MapPin, Navigation, User } from 'lucide-react';

// Custom CSS animation for the pulsing dot
const styles = `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.4); opacity: 0.6; }
    100% { transform: scale(1); opacity: 1; }
  }
  .leaflet-marker-icon.active-tracking {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: transparent !important;
    border: none !important;
  }
  .marker-dot-container {
    position: relative;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .marker-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    position: absolute;
    z-index: 2;
  }
  .marker-pulse {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    position: absolute;
    animation: pulse 1.5s infinite;
    z-index: 1;
  }
  .marker-success .marker-dot { background-color: #10B981; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3); }
  .marker-success .marker-pulse { background-color: rgba(16, 185, 129, 0.4); }
  
  .marker-stale .marker-dot { background-color: #9CA3AF; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3); }
  .marker-stale .marker-pulse { display: none; }
  
  .marker-label {
    background: white;
    color: #1F2937;
    font-size: 11px;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    white-space: nowrap;
    border: 1px solid #E5E7EB;
  }
`;

// Inject styles once
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = styles;
  document.head.appendChild(styleEl);
}

export default function SmoothMarker({ id, data, isStale }) {
  const markerRef = useRef(null);
  const positionRef = useRef([data.location.lat, data.location.lng]);

  const lat = data.location.lat;
  const lng = data.location.lng;

  useEffect(() => {
    if (!markerRef.current) return;
    
    // Animate smoothly to the new position if it changed
    const newPos = [lat, lng];
    const marker = markerRef.current;
    
    if (positionRef.current[0] !== newPos[0] || positionRef.current[1] !== newPos[1]) {
      // Use standard Leaflet setLatLng which will jump unless we animate manually
      // For simplicity in React, it jumps slightly but updates efficiently. 
      // A more complex implementation would use requestAnimationFrame here.
      marker.setLatLng(newPos);
      positionRef.current = newPos;
    }
  }, [lat, lng]);

  const createCustomIcon = () => {
    return L.divIcon({
      className: 'active-tracking',
      html: `
        <div class="marker-dot-container ${isStale ? 'marker-stale' : 'marker-success'}">
          <div class="marker-pulse"></div>
          <div class="marker-dot"></div>
        </div>
        <div class="marker-label">${id}</div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  const speedKmh = data.location.speed ? (data.location.speed).toFixed(1) : '0.0';
  
  let BatteryIcon = Battery;
  let batColor = "text-green-500";
  if (data.location.batteryPercent < 20) {
    BatteryIcon = BatteryLow;
    batColor = "text-red-500";
  } else if (data.location.batteryPercent < 50) {
    BatteryIcon = BatteryMedium;
    batColor = "text-amber-500";
  }

  return (
    <Marker 
      ref={markerRef} 
      position={[lat, lng]} 
      icon={createCustomIcon()}
    >
      <Popup className="custom-popup" minWidth={240}>
        <div className="p-1">
          <div className="border-b border-gray-100 pb-2 mb-2">
            <h3 className="font-bold text-gray-900 m-0">{data.info?.name || 'Unknown Weapon'}</h3>
            <p className="text-xs text-gray-500 font-mono mt-1">{id}</p>
          </div>
          
          <div className="space-y-2 text-sm">
            {data.info?.assignedToName && (
              <div className="flex items-center gap-2 text-gray-700">
                <User size={14} className="text-gray-400" />
                <span>{data.info.assignedToName}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin size={14} className="text-gray-400" />
              <span>{Math.abs(lat).toFixed(5)}°, {Math.abs(lng).toFixed(5)}°</span>
            </div>
            
            <div className="flex items-center justify-between text-gray-700 text-xs mt-2 p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-1" title="Speed">
                <Navigation size={12} className="text-blue-500" />
                <span>{speedKmh} km/h</span>
              </div>
              <div className="flex items-center gap-1" title="Battery">
                <BatteryIcon size={12} className={batColor} />
                <span>{data.location.batteryPercent || 100}%</span>
              </div>
              <div className="flex items-center gap-1" title="Update Time">
                <Clock size={12} className="text-gray-400" />
                <span>{new Date(data.location.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
