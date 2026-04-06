import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, GpsFixed, Navigation } from 'lucide-react';

// Marker Icons
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/**
 * GPS Correlation Map Component.
 * Visualizes the discrepancy between reported incident location 
 * and last known GPS ping.
 */
const GpsCorrelationMap = ({ reportedLoc, lastPing, distanceMeters, discrepancy }) => {
  if (!reportedLoc || !lastPing) return (
    <div className="h-64 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
      <GpsFixed className="w-8 h-8 opacity-20" />
      <span className="ml-2">GPS data unavailable for this incident</span>
    </div>
  );

  const center = [
    (reportedLoc.lat + lastPing.lat) / 2,
    (reportedLoc.lng + lastPing.lng) / 2
  ];

  return (
    <div className="space-y-3">
      {discrepancy && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-800">GPS Discrepancy Detected</h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              The reported incident location is {distanceMeters}m away from the last automated GPS ping. 
              This mismatch requires investigative verification.
            </p>
          </div>
        </div>
      )}

      <div className="h-64 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative">
        <MapContainer center={center} zoom={15} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Reported Location */}
          <Marker position={[reportedLoc.lat, reportedLoc.lng]} icon={redIcon}>
            <Popup>
              <div className="font-bold">Reported Incident Site</div>
              <div className="text-xs">{reportedLoc.lat.toFixed(5)}, {reportedLoc.lng.toFixed(5)}</div>
            </Popup>
          </Marker>

          {/* Last GPS Ping */}
          <Marker position={[lastPing.lat, lastPing.lng]} icon={blueIcon}>
            <Popup>
              <div className="font-bold">Last Automated GPS Ping</div>
              <div className="text-xs">{lastPing.lat.toFixed(5)}, {lastPing.lng.toFixed(5)}</div>
            </Popup>
          </Marker>

          {/* Connection Line */}
          <Polyline 
            positions={[[reportedLoc.lat, reportedLoc.lng], [lastPing.lat, lastPing.lng]]} 
            color="#2563eb" 
            dashArray="10, 10" 
            weight={2} 
          />
        </MapContainer>

        {/* Distance Badge Overlay */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
          <Navigation className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-700">{distanceMeters} meters apart</span>
        </div>
      </div>
    </div>
  );
};

export default GpsCorrelationMap;
