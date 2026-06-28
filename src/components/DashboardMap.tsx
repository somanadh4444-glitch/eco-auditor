import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WasteLog } from '../types';

// Category color settings
const CATEGORY_COLORS: Record<string, { stroke: string; label: string; ringClass: string }> = {
  'Plastic': { stroke: '#0ea5e9', label: 'Plastic (Blue)', ringClass: 'bg-sky-500/20' },
  'E-Waste': { stroke: '#ef4444', label: 'E-Waste (Red)', ringClass: 'bg-red-500/20' },
  'Organic': { stroke: '#10b981', label: 'Organic (Green)', ringClass: 'bg-emerald-500/20' },
  'Metal': { stroke: '#64748b', label: 'Metal (Gray)', ringClass: 'bg-slate-500/20' },
  'Other': { stroke: '#a855f7', label: 'Other (Purple)', ringClass: 'bg-purple-500/20' }
};

// SVG icons helper for pins
const getCategoryIconSvg = (category: string) => {
  if (category === 'Plastic') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;
  } else if (category === 'E-Waste') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M9 1v3"/><path d="M15 1v3"/></svg>`;
  } else if (category === 'Organic') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-13.1 3.7"/></svg>`;
  } else if (category === 'Metal') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
  } else {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`;
  }
};

// Create custom category Leaflet divIcon
const createCategoryIcon = (category: string) => {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'];
  const svg = getCategoryIconSvg(category);

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center w-[36px] h-[36px]">
        <div class="absolute w-7 h-7 rounded-full bg-slate-950 border-2 flex items-center justify-center text-white shadow-lg transition-transform duration-200 hover:scale-125 hover:z-20" style="border-color: ${color.stroke}">
          <div class="flex items-center justify-center" style="color: ${color.stroke}">
            ${svg}
          </div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -14],
  });
};

interface DashboardMapProps {
  logs: WasteLog[];
}

// Inner component to automatically auto-fit and zoom around the pins
function MapAutoBounds({ logs }: { logs: WasteLog[] }) {
  const map = useMap();
  useEffect(() => {
    if (!logs || logs.length === 0) return;
    
    // Filter out entries with invalid coordinates
    const validPoints = logs
      .filter(l => typeof l.latitude === 'number' && typeof l.longitude === 'number' && !isNaN(l.latitude) && !isNaN(l.longitude))
      .map(l => [l.latitude, l.longitude] as [number, number]);

    if (validPoints.length === 0) return;

    const bounds = L.latLngBounds(validPoints);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [logs, map]);

  return null;
}

export default function DashboardMap({ logs }: DashboardMapProps) {
  // Center initially somewhere, fallback is fine as fitBounds overrides it
  const defaultCenter: [number, number] = [37.7749, -122.4194];

  // Group pins by position to display multiple popups or simple stacks if they exact match
  const filteredLogs = logs.filter(
    l => typeof l.latitude === 'number' && typeof l.longitude === 'number' && !isNaN(l.latitude) && !isNaN(l.longitude)
  );

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-stone-200 mt-10 animate-fade-in" id="dashboard-map-section">
      
      {/* Sleek top map bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pointer-events-none">
        <div className="bg-white/95 border border-stone-200 backdrop-blur-md text-slate-900 px-4 py-2 rounded-xl shadow-lg flex items-center gap-3 pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-emerald-700">Ledger Geospatial Distribution</h4>
            <p className="text-[10px] text-slate-500 font-mono -mt-0.5">{filteredLogs.length} Coordinates Monitored</p>
          </div>
        </div>
      </div>

      {/* Floating map legend overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 border border-stone-200 backdrop-blur-md p-3.5 rounded-xl shadow-lg space-y-2 pointer-events-auto max-w-[190px]">
        <h5 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 border-b border-stone-100 pb-1.5">Category Legend</h5>
        <div className="space-y-1.5 text-[10px]">
          {Object.entries(CATEGORY_COLORS).map(([cat, config]) => (
            <div key={cat} className="flex items-center gap-2 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: config.stroke }} />
              <span>{cat}</span>
            </div>
          ))}
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={3}
        className="w-full h-[50vh] min-h-[400px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
        />
        
        {/* React Leaflet Cluster grouping */}
        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          maxClusterRadius={40}
        >
          {filteredLogs.map((log) => {
            const dateStr = log.timestamp?.seconds 
              ? new Date(log.timestamp.seconds * 1000).toLocaleString() 
              : log.timestamp instanceof Date 
                ? log.timestamp.toLocaleString() 
                : 'Recent';

            return (
              <Marker 
                key={log.id || `${log.latitude}-${log.longitude}-${Math.random()}`}
                position={[log.latitude, log.longitude]}
                icon={createCategoryIcon(log.category)}
              >
                <Popup>
                  <div className="p-2 space-y-1.5 font-sans min-w-[180px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1 mt-0.5">
                      <span className="font-extrabold text-xs uppercase tracking-wide" style={{ color: CATEGORY_COLORS[log.category]?.stroke || '#ffffff' }}>
                        {log.category}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded">
                        {log.weight.toFixed(2)} {log.unit || 'kg'}
                      </span>
                    </div>
                    <div className="text-[10px] space-y-1 text-slate-300">
                      <p><strong>Logger:</strong> <span className="text-white">{log.userEmail || 'Guest'}</span></p>
                      <p><strong>Coordinates:</strong> <span className="text-slate-400 font-mono">{log.latitude.toFixed(5)}, {log.longitude.toFixed(5)}</span></p>
                      
                      {log.imageUrl && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800/60">
                          <img 
                            src={log.imageUrl} 
                            alt="Proof of Disposal" 
                            className="w-full h-16 object-cover rounded border border-slate-700/40"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      
                      <p className="text-[9px] text-slate-500 font-mono border-t border-slate-800/40 pt-1 mt-1">{dateStr}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>

        <MapAutoBounds logs={filteredLogs} />
      </MapContainer>
    </div>
  );
}
