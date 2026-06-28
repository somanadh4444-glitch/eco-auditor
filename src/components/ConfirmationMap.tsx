import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix the default marker icon broken image issue in Leaflet
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Create custom glowing green icon with leaf inside + pulse ring
const customGreenIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div class="relative flex items-center justify-center w-[44px] h-[44px]">
      <div class="pulse-ring"></div>
      <div class="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white border-2 border-slate-900 shadow-md relative z-10 transition-transform duration-350 hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-13.1 3.7"/>
          <path d="M9 10a5 5 0 0 1 6-1"/>
          <path d="m12 10 3 3"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -18],
});

interface ConfirmationMapProps {
  latitude: number;
  longitude: number;
  category: string;
  weight: number;
  unit?: string;
  imageUrl?: string;
}

// Inner helper component to handle map viewport updating
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
    // Open any popup on load
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        layer.openPopup();
      }
    });
  }, [lat, lng, map]);
  return null;
}

export default function ConfirmationMap({ latitude, longitude, category, weight, unit = 'kg', imageUrl }: ConfirmationMapProps) {
  const position: [number, number] = [latitude, longitude];
  const formattedTime = new Date().toLocaleString();

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.15)] border border-slate-200/80 animate-fade-in" id="confirmation-map-container">
      {/* Visual overlay indicator */}
      <div className="absolute top-4 right-4 z-[400] bg-white/95 border border-emerald-500/30 backdrop-blur-md text-emerald-600 font-mono text-[10px] font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        GPS CORRESPONDENCE RECORDED
      </div>

      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false}
        className="w-full h-[60vh] min-h-[450px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={customGreenIcon}>
          <Popup>
            <div className="p-2 space-y-2 font-sans min-w-[200px]" id="confirmation-popup">
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                <span className="text-sm">🗑️</span>
                <span className="font-bold text-emerald-400 text-xs uppercase tracking-wide">Waste Logged Here</span>
              </div>
              <div className="text-[11px] space-y-1 text-slate-300">
                <p><strong>Category:</strong> <span className="text-white font-semibold">{category}</span></p>
                <p><strong>Weight:</strong> <span className="text-emerald-400 font-mono font-bold">{weight.toFixed(2)} {unit}</span></p>
                
                {imageUrl && (
                  <div className="mt-2 pt-2 border-t border-slate-800/60">
                    <p className="text-[9px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Proof of Disposal:</p>
                    <img 
                      src={imageUrl} 
                      alt="Proof of Disposal" 
                      className="w-full h-24 object-cover rounded-md border border-slate-700/50"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                
                <p className="text-[9px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">{formattedTime}</p>
              </div>
            </div>
          </Popup>
        </Marker>
        <RecenterMap lat={latitude} lng={longitude} />
      </MapContainer>
    </div>
  );
}
