import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { getOSRMRoute, reverseGeocode } from '../utils/mapServices';

interface AdminOrderMapProps {
  initialCoords?: [number, number];
  onChange?: (coords: [number, number], address: string, distanceKm: number) => void;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const laundryCoords: [number, number] = [-7.5785444, 112.7257545];

function getCustomFormattedAddress(components: google.maps.GeocoderAddressComponent[], defaultFormatted?: string): string {
  let route = '';
  let desaKelurahan = '';
  let kecamatan = '';
  let kabupatenKota = '';
  let provinsi = '';
  let postalCode = '';
  let country = '';

  for (const component of components) {
    const types = component.types;
    if (types.includes('route')) {
      route = component.long_name;
    } else if (
      types.includes('administrative_area_level_4') ||
      types.includes('sublocality_level_1') ||
      types.includes('sublocality') ||
      types.includes('neighborhood')
    ) {
      if (!desaKelurahan) {
        desaKelurahan = component.long_name;
      }
    } else if (types.includes('administrative_area_level_3')) {
      kecamatan = component.long_name;
    } else if (types.includes('administrative_area_level_2')) {
      kabupatenKota = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      provinsi = component.long_name;
    } else if (types.includes('postal_code')) {
      postalCode = component.long_name;
    } else if (types.includes('country')) {
      country = component.long_name;
    }
  }

  // Fallback if desaKelurahan is empty, check locality
  if (!desaKelurahan) {
    for (const component of components) {
      if (component.types.includes('locality')) {
        desaKelurahan = component.long_name;
        break;
      }
    }
  }

  const parts: string[] = [];
  if (route) {
    parts.push(route);
  }
  if (desaKelurahan && desaKelurahan !== route) {
    parts.push(desaKelurahan);
  }
  if (kecamatan) {
    const cleanKec = kecamatan.toLowerCase().startsWith('kec') ? kecamatan : `Kecamatan ${kecamatan}`;
    parts.push(cleanKec);
  }
  if (kabupatenKota) {
    const cleanKab = (kabupatenKota.toLowerCase().startsWith('kab') || kabupatenKota.toLowerCase().startsWith('kota'))
      ? kabupatenKota
      : `Kabupaten/Kota ${kabupatenKota}`;
    parts.push(cleanKab);
  }
  if (provinsi) {
    const cleanProv = provinsi.toLowerCase().startsWith('prov') ? provinsi : `Provinsi ${provinsi}`;
    parts.push(cleanProv);
  }
  if (postalCode) {
    parts.push(postalCode);
  }
  if (country && !['indonesia', 'id'].includes(country.toLowerCase())) {
    parts.push(country);
  }

  const customAddress = parts.filter(Boolean).join(', ');
  if (customAddress.trim().length > 10) {
    return customAddress;
  }
  return defaultFormatted || customAddress || 'Alamat tidak dikenal';
}

export default function AdminOrderMap({ initialCoords, onChange }: AdminOrderMapProps) {
  if (!hasValidKey) {
    return (
      <div className="w-full h-56 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center p-4 text-center text-xs text-slate-500 font-sans">
        Google Maps API Key belum dikonfigurasi.
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <AdminOrderMapInner initialCoords={initialCoords} onChange={onChange} />
    </APIProvider>
  );
}

function AdminOrderMapInner({ initialCoords, onChange }: AdminOrderMapProps) {
  const map = useMap();

  const [currentCoords, setCurrentCoords] = useState<[number, number]>(initialCoords || laundryCoords);
  const [addressText, setAddressText] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
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
          strokeColor: '#8B5CF6', // Purple stroke for admin view
          strokeWeight: 5,
          strokeOpacity: 0.8,
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

  // Fine tune position
  const updateLocationPin = async (coords: [number, number], emitChange: boolean = true) => {
    if (!map) return;
    setCurrentCoords(coords);
    setErrorText('');
    setLoading(true);

    try {
      // 1. Geocode via OSM Nominatim
      const geocodeResult = await reverseGeocode(coords[0], coords[1]);
      setAddressText(geocodeResult);

      // Reset previous lines
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] });
      }
      polylinesRef.current.forEach(p => p.setMap(null));
      polylinesRef.current = [];

      // 2. Compute Route via OSRM
      try {
        const routeData = await getOSRMRoute(
          coords[0],
          coords[1],
          laundryCoords[0],
          laundryCoords[1],
          'driving'
        );

        const polyline = new google.maps.Polyline({
          path: routeData.coordinates.map(pt => ({ lat: pt[0], lng: pt[1] })),
          strokeColor: '#8B5CF6', // Purple stroke for admin view
          strokeWeight: 5,
          strokeOpacity: 0.8,
        });
        polyline.setMap(map);
        polylinesRef.current.push(polyline);

        setDistance(routeData.distance);

        if (emitChange && onChange) {
          onChange(coords, geocodeResult, routeData.distance);
        }

        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: laundryCoords[0], lng: laundryCoords[1] });
        bounds.extend({ lat: coords[0], lng: coords[1] });
        map.fitBounds(bounds);
      } catch (routingErr) {
        console.warn('OSRM routing failed, using straight-line fallback:', routingErr);
        setErrorText('Server Rute OSRM lambat. Menampilkan jarak garis lurus.');

        // Straight line fallback
        const polyline = new google.maps.Polyline({
          path: [
            { lat: laundryCoords[0], lng: laundryCoords[1] },
            { lat: coords[0], lng: coords[1] },
          ],
          strokeColor: '#B78A62',
          strokeWeight: 4,
          strokeOpacity: 0.7,
        });
        polyline.setMap(map);
        polylinesRef.current = [polyline];

        // Calculate Haversine distance
        const R = 6371;
        const dLat = ((laundryCoords[0] - coords[0]) * Math.PI) / 180;
        const dLon = ((laundryCoords[1] - coords[1]) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((coords[0] * Math.PI) / 180) *
            Math.cos((laundryCoords[0] * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const straightDist = R * c;
        const estDist = parseFloat(straightDist.toFixed(2));

        setDistance(estDist);

        if (emitChange && onChange) {
          onChange(coords, geocodeResult, estDist);
        }

        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: laundryCoords[0], lng: laundryCoords[1] });
        bounds.extend({ lat: coords[0], lng: coords[1] });
        map.fitBounds(bounds);
      }
    } catch (err) {
      console.error('Error computing route / address in admin map:', err);
      setErrorText('Koneksi lambat atau bermasalah dalam memproses detail peta.');
    } finally {
      setLoading(false);
    }
  };

  // Run on initial coords load
  useEffect(() => {
    if (!map) return;
    updateLocationPin(initialCoords || laundryCoords, false);
  }, [map, initialCoords]);

  // Click handler
  const handleMapClick = (e: any) => {
    if (e.detail?.latLng) {
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      updateLocationPin([lat, lng], true);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorText('Browser Anda tidak mendukung GPS lokasi.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (map) {
          map.panTo({ lat: latitude, lng: longitude });
          map.setZoom(15);
        }
        updateLocationPin([latitude, longitude], true);
      },
      (err) => {
        setErrorText('Gagal mendeteksi lokasi GPS Anda. Silakan klik manual di peta.');
        setLoading(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase text-purple-600 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          Penyesuaian Titik Lokasi Peta (Google Maps)
        </span>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-extrabold rounded-lg border border-purple-200 transition-colors cursor-pointer"
        >
          📍 Gunakan GPS Saya
        </button>
      </div>

      <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0">
        <Map
          defaultCenter={{ lat: currentCoords[0], lng: currentCoords[1] }}
          defaultZoom={13}
          mapId="DEMO_MAP_ID"
          onClick={handleMapClick}
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
          <AdvancedMarker position={{ lat: currentCoords[0], lng: currentCoords[1] }}>
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
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
            <div className="bg-white px-3 py-1.5 rounded-full shadow-md border border-slate-100 flex items-center gap-1.5 text-xs text-purple-700 font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Memproses Rute &amp; Alamat...
            </div>
          </div>
        )}
      </div>

      {errorText && (
        <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errorText}
        </p>
      )}

      {distance !== null && (
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-150 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Jarak ke Outlet Susyi Laundry:</span>
          <span className="font-bold text-slate-800 font-mono">
            {distance} km {distance > 2 ? '(Radius Luar)' : '(Dalam Radius)'}
          </span>
        </div>
      )}
    </div>
  );
}
