import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, Compass } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { getOSRMRoute } from '../utils/mapServices';

interface CustomerOrderMapProps {
  orderCoords: [number, number];
  orderAddress?: string;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const laundryCoords: [number, number] = [-7.5785444, 112.7257545];

export default function CustomerOrderMap({ orderCoords, orderAddress }: CustomerOrderMapProps) {
  if (!hasValidKey) {
    return (
      <div className="w-full h-44 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center p-4 text-center text-xs text-slate-500 font-sans">
        Google Maps API Key belum dikonfigurasi.
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <CustomerOrderMapInner orderCoords={orderCoords} orderAddress={orderAddress} />
    </APIProvider>
  );
}

function CustomerOrderMapInner({ orderCoords, orderAddress }: CustomerOrderMapProps) {
  const map = useMap();

  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Setup DirectionsRenderer
  useEffect(() => {
    if (!map) return;

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#8B5CF6', // Purple line for order view
          strokeWeight: 5,
          strokeOpacity: 0.85,
        }
      });
    } else {
      directionsRendererRef.current.setMap(map);
    }

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (!map || !orderCoords) return;

    // Reset previous lines
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    setLoading(true);
    setErrorText('');

    const calculateRoute = async () => {
      try {
        const routeData = await getOSRMRoute(
          orderCoords[0],
          orderCoords[1],
          laundryCoords[0],
          laundryCoords[1],
          'driving'
        );

        const polyline = new google.maps.Polyline({
          path: routeData.coordinates.map(coord => ({ lat: coord[0], lng: coord[1] })),
          strokeColor: '#8B5CF6', // Purple line for order view
          strokeWeight: 5,
          strokeOpacity: 0.85,
        });

        polyline.setMap(map);
        polylinesRef.current.push(polyline);

        setDistance(routeData.distance);
        setDuration(routeData.duration);

        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: laundryCoords[0], lng: laundryCoords[1] });
        bounds.extend({ lat: orderCoords[0], lng: orderCoords[1] });
        map.fitBounds(bounds);
      } catch (err) {
        console.warn('OSRM path computing failed:', err);
        setErrorText('Gagal membuat rute jalan raya. Menampilkan rute garis lurus.');

        // Straight line fallback
        const polyline = new google.maps.Polyline({
          path: [
            { lat: laundryCoords[0], lng: laundryCoords[1] },
            { lat: orderCoords[0], lng: orderCoords[1] },
          ],
          strokeColor: '#B78A62',
          strokeWeight: 4,
          strokeOpacity: 0.7,
          icons: [
            {
              icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 },
              offset: '0',
              repeat: '10px',
            },
          ],
        });
        polyline.setMap(map);
        polylinesRef.current = [polyline];

        // Haversine formula fallback
        const R = 6371;
        const dLat = ((laundryCoords[0] - orderCoords[0]) * Math.PI) / 180;
        const dLon = ((laundryCoords[1] - orderCoords[1]) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((orderCoords[0] * Math.PI) / 180) *
            Math.cos((laundryCoords[0] * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const straightDist = R * c;

        setDistance(parseFloat(straightDist.toFixed(2)));
        setDuration(Math.max(1, Math.ceil(straightDist * 3))); // rough estimate

        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: laundryCoords[0], lng: laundryCoords[1] });
        bounds.extend({ lat: orderCoords[0], lng: orderCoords[1] });
        map.fitBounds(bounds);
      } finally {
        setLoading(false);
      }
    };

    calculateRoute();

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [map, orderCoords]);

  return (
    <div className="space-y-2 font-sans">
      <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-sm z-0">
        <Map
          defaultCenter={{
            lat: (laundryCoords[0] + orderCoords[0]) / 2,
            lng: (laundryCoords[1] + orderCoords[1]) / 2,
          }}
          defaultZoom={14}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="cooperative"
        >
          {/* Laundry Outlet */}
          <AdvancedMarker position={{ lat: laundryCoords[0], lng: laundryCoords[1] }}>
            <div style={{ width: '32px', height: '32px' }} className="relative flex items-center justify-center -translate-y-4 select-none">
              <div className="absolute w-8 h-8 rounded-full bg-purple-500/20 animate-ping"></div>
              <div className="relative w-8 h-8 bg-purple-600 border border-[#D4AF37] rounded-full flex items-center justify-center shadow-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <div className="absolute -bottom-1.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[#D4AF37]"></div>
            </div>
          </AdvancedMarker>

          {/* Customer Location */}
          <AdvancedMarker position={{ lat: orderCoords[0], lng: orderCoords[1] }}>
            <div style={{ width: '28px', height: '28px' }} className="relative flex items-center justify-center -translate-y-3 select-none">
              <div className="relative w-6 h-6 bg-[#B78A62] border border-white rounded-full flex items-center justify-center shadow-lg">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="absolute -bottom-1.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#B78A62]"></div>
            </div>
          </AdvancedMarker>
        </Map>

        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <div className="bg-white px-3 py-1.5 rounded-full shadow-md border border-slate-150 flex items-center gap-1.5 text-xs text-purple-700 font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Menghitung Rute Pengantaran...
            </div>
          </div>
        )}
      </div>

      {errorText && (
        <p className="text-[9px] text-amber-600 font-semibold flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errorText}
        </p>
      )}

      {distance !== null && (
        <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/50 flex items-center justify-between text-[11px] font-sans">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-purple-600 animate-spin" style={{ animationDuration: '6s' }} />
            Rute Kurir Susyi Laundry:
          </span>
          <span className="font-bold text-purple-950">
            {distance} km <span className="text-slate-400 font-normal">|</span> {duration || 5} menit perjalanan
          </span>
        </div>
      )}
    </div>
  );
}
