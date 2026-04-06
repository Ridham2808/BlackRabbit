import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Navigation, Radio, AlertTriangle, WifiOff } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, Spinner } from '../../components/ui'
import { getSocket } from '../../services/socket'

// Lazy-load Leaflet only when this page mounts (avoids SSR issues)
let mapInstance = null

const STATUS_COLORS = {
  OPERATIONAL:       '#8aab2e',
  CHECKED_OUT:       '#60a5fa',
  IN_TRANSIT:        '#34d399',
  FLAGGED:           '#a78bfa',
  MISSING:           '#f97316',
  LOST:              '#ef4444',
  UNDER_MAINTENANCE: '#fbbf24',
}

export default function LiveMap() {
  const mapRef = useRef(null)
  const mapInitRef = useRef(false)
  const markersRef = useRef({})
  const [liveCount, setLiveCount] = useState(0)
  const [filter, setFilter] = useState('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['map-pings'],
    queryFn: () => api.get('/location/latest').then(r => r.data),
    refetchInterval: 30_000,
  })

  const pings = data?.data || []

  // Initialise Leaflet map
  useEffect(() => {
    if (mapInitRef.current || !mapRef.current) return
    mapInitRef.current = true

    import('leaflet').then(L => {
      import('leaflet/dist/leaflet.css').catch(() => {})

      // Fix default marker icons for bundlers
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      mapInstance = L.map(mapRef.current, {
        center: [20.5937, 78.9629], // India center
        zoom: 5,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance)
    })

    return () => {
      if (mapInstance) { mapInstance.remove(); mapInstance = null }
      mapInitRef.current = false
    }
  }, [])

  // Plot markers when pings load
  useEffect(() => {
    if (!mapInstance || !pings.length) return

    import('leaflet').then(L => {
      // Clear old markers
      Object.values(markersRef.current).forEach(m => m.remove())
      markersRef.current = {}

      const filtered = filter === 'ALL' ? pings : pings.filter(p => p.status === filter)
      setLiveCount(filtered.length)

      filtered.forEach(ping => {
        if (!ping.latitude || !ping.longitude) return
        const color = STATUS_COLORS[ping.status] || '#94a3b8'

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              width:10px;height:10px;border-radius:50%;
              background:${color};border:2px solid rgba(255,255,255,0.8);
              box-shadow:0 0 8px ${color};
              ${ping.status === 'MISSING' || ping.status === 'LOST' ? 'animation:pulse 1.2s infinite;' : ''}
            "></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        })

        const marker = L.marker([ping.latitude, ping.longitude], { icon })
          .addTo(mapInstance)
          .bindPopup(`
            <div style="font-family:monospace;font-size:12px;min-width:180px">
              <strong style="color:#0f1b2d">${ping.equipment_name || 'Unknown'}</strong><br/>
              <span style="color:#475569">${ping.serial_number || ''}</span><br/>
              <span style="
                display:inline-block;margin-top:4px;padding:1px 6px;border-radius:4px;
                background:${color}20;color:${color};font-weight:700;font-size:11px;
              ">${ping.status}</span><br/>
              ${ping.custodian_name ? `<span style="color:#475569">👤 ${ping.custodian_name}</span><br/>` : ''}
              <span style="color:#94a3b8;font-size:10px">${new Date(ping.recorded_at).toLocaleString()}</span>
            </div>
          `)

        markersRef.current[ping.equipment_id] = marker
      })
    })
  }, [pings, filter])

  // Live GPS update via WebSocket
  useEffect(() => {
    const handler = (ping) => {
      import('leaflet').then(L => {
        if (!mapInstance) return
        const color = STATUS_COLORS[ping.status] || '#94a3b8'
        const existing = markersRef.current[ping.equipment_id]
        if (existing) {
          existing.setLatLng([ping.latitude, ping.longitude])
        } else {
          const icon = L.divIcon({
            className: '',
            html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 8px ${color};"></div>`,
            iconSize: [10, 10], iconAnchor: [5, 5],
          })
          markersRef.current[ping.equipment_id] = L.marker([ping.latitude, ping.longitude], { icon }).addTo(mapInstance)
        }
      })
    }
    const s = getSocket()
    s?.on('location:update', handler)
    return () => s?.off('location:update', handler)
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Live GPS Map"
        sub={data?._isCached ? "⚠️ OFFLINE: Viewing cached positions" : "Real-time equipment and personnel location tracking"}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {data?._isCached ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fffbeb', padding: '4px 12px', borderRadius: 20, border: '1px solid #f59e0b' }}>
                <WifiOff size={14} color="#f59e0b" />
                <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>CACHED DATA</span>
              </div>
            ) : (
              <>
                <Radio size={14} color="#34d399" />
                <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>{liveCount} tracked</span>
              </>
            )}
          </div>
        }
      />

      {data?._isCached && (
        <div style={{ 
          background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 12, 
          padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 
        }}>
          <AlertTriangle size={20} color="#ef4444" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>Network Link Severed</div>
            <div style={{ fontSize: 12, color: '#b91c1c' }}>The map is showing last known positions from the local cache. Real-time updates are paused.</div>
          </div>
        </div>
      )}

      {/* Legend + Filter */}
      <div className="glass-card" style={{ padding: '10px 18px', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>FILTER:</span>
        {['ALL', ...Object.keys(STATUS_COLORS)].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              background: filter === s ? `${STATUS_COLORS[s] || '#8aab2e'}20` : 'transparent',
              border: `1px solid ${filter === s ? (STATUS_COLORS[s] || '#8aab2e') : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
              color: filter === s ? (STATUS_COLORS[s] || '#8aab2e') : '#475569',
              fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            {s !== 'ALL' && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[s], flexShrink: 0 }} />
            )}
            {s.replace(/_/g,' ')}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
        <style>{`
          @keyframes pulse {
            0%,100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.6); opacity: 0.5; }
          }
          .leaflet-popup-content-wrapper {
            background: #f8fafc !important; border-radius: 8px !important; box-shadow: 0 4px 24px rgba(0,0,0,0.3) !important;
          }
          .leaflet-popup-tip { background: #f8fafc !important; }
        `}</style>
        {isLoading && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
            <Spinner />
          </div>
        )}
        <div
          ref={mapRef}
          style={{ height: 'calc(100vh - 280px)', minHeight: 500, width: '100%', background: '#0a1628' }}
        />
      </div>

      {/* No GPS data notification */}
      {!isLoading && pings.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569', fontSize: 13 }}>
          <MapPin size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p style={{ margin: 0 }}>No GPS pings available. Mobile devices must have location enabled.</p>
        </div>
      )}
    </div>
  )
}
