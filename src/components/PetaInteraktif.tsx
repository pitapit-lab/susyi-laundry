import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Compass, Info, Loader2, Sparkles } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { getOSRMRoute, reverseGeocode, getOSRMAlternativeRoutes, OSRMRouteResult, getHaversineDistance } from '../utils/mapServices';

interface PetaInteraktifProps {
  onRouteCalculated: (data: {
    distance: number; // in km
    address: string;
    routeChecked: boolean;
    durationDriving: number; // in mins
    durationWalking: number; // in mins
    coordinates: [number, number];
    routeType?: string;
    routeDistance?: number;
    routeDuration?: number;
    routeGeometry?: [number, number][];
  } | null) => void;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Pasuruan laundry location
const laundryCoords: [number, number] = [-7.5785444, 112.7257545];
const laundryAddress = 'Turirejo Rt/Rw 03, RT./Rw 03/RW.08, Candi, Cangkringmalang, Kec. Beji, Pasuruan, Jawa Timur 67154';

export default function PetaInteraktif({ onRouteCalculated }: PetaInteraktifProps) {
  if (!hasValidKey) {
    return (
      <section id="cekrute" className="py-20 md:py-28 bg-[#fdfbf7] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center">
          <div className="bg-white p-8 rounded-3xl border border-purple-100 shadow-md max-w-lg mx-auto">
            <h2 className="font-display text-2xl text-purple-900 font-semibold mb-4">Google Maps API Key Required</h2>
            <p className="font-sans text-sm text-slate-600 mb-6 leading-relaxed">
              Silakan hubungi tim Admin untuk mengonfigurasi <strong>GOOGLE_MAPS_PLATFORM_KEY</strong> di Secrets AI Studio atau file .env Anda.
            </p>
            <div className="text-left bg-purple-50 p-4 rounded-xl text-xs space-y-2 border border-purple-100 text-purple-950 font-sans">
              <p><strong>Cara menambahkan API Key:</strong></p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Dapatkan API Key dari Google Cloud Console.</li>
                <li>Buka <strong>Settings</strong> (ikon gerigi di kanan atas) → <strong>Secrets</strong>.</li>
                <li>Tambahkan secret bernama <code>GOOGLE_MAPS_PLATFORM_KEY</code> dengan nilai API Key Anda.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <PetaInteraktifInner onRouteCalculated={onRouteCalculated} />
    </APIProvider>
  );
}

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

function getOSMFormattedAddress(addressObj: any): string {
  if (!addressObj) return '';
  const route = addressObj.road || '';
  const village = addressObj.village || addressObj.suburb || addressObj.neighbourhood || '';
  const kecamatan = addressObj.city_district || addressObj.subdistrict || '';
  const kabupaten = addressObj.city || addressObj.county || addressObj.regency || '';
  const provinsi = addressObj.state || '';
  const postalCode = addressObj.postcode || '';
  const country = addressObj.country || '';

  const parts: string[] = [];
  if (route) parts.push(route);
  if (village) parts.push(village);
  if (kecamatan) {
    const cleanKec = kecamatan.toLowerCase().startsWith('kec') ? kecamatan : `Kecamatan ${kecamatan}`;
    parts.push(cleanKec);
  }
  if (kabupaten) {
    const cleanKab = (kabupaten.toLowerCase().startsWith('kab') || kabupaten.toLowerCase().startsWith('kota')) 
      ? kabupaten 
      : `Kabupaten ${kabupaten}`;
    parts.push(cleanKab);
  }
  if (provinsi) parts.push(provinsi);
  if (postalCode) parts.push(postalCode);
  if (country) parts.push(country);

  return parts.filter(Boolean).join(', ');
}

function PetaInteraktifInner({ onRouteCalculated }: PetaInteraktifProps) {
  const map = useMap();

  const [addressInput, setAddressInput] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Custom states for travel mode and selected destination
  const [selectedCustCoords, setSelectedCustCoords] = useState<[number, number] | null>(null);
  const [travelMode, setTravelMode] = useState<'motor' | 'jalan-kaki'>('motor');

  // Calculations
  const [distance, setDistance] = useState<number | null>(null);
  const [drivingTime, setDrivingTime] = useState<number | null>(null);
  const [walkingTime, setWalkingTime] = useState<number | null>(null);
  const [routeType, setRouteType] = useState<'tercepat' | 'scenic'>('tercepat');

  // Alternative Routes States
  const [routesList, setRoutesList] = useState<OSRMRouteResult[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Detect and select location on map using OSM Nominatim Reverse Geocoding API
  const selectLocationOnMap = async (lat: number, lng: number) => {
    setSelectedCustCoords([lat, lng]);
    setLoading(true);
    setErrorText('');

    try {
      const formattedAddr = await reverseGeocode(lat, lng);
      setAddressInput(formattedAddr);
      setResolvedAddress(formattedAddr);
    } catch (err) {
      console.warn('OSM Nominatim reverse geocoding failed:', err);
      const fallbackStr = `Koordinat terpilih: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddressInput(fallbackStr);
      setResolvedAddress(fallbackStr);
    } finally {
      setLoading(false);
    }
  };

  // Detect current location via browser GPS
  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorText('Browser Anda tidak mendukung deteksi lokasi otomatis.');
      return;
    }

    setLoading(true);
    setErrorText('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (map) {
          map.panTo({ lat: latitude, lng: longitude });
          map.setZoom(15);
        }
        selectLocationOnMap(latitude, longitude);
      },
      (error) => {
        let errMsg = 'Gagal mendeteksi lokasi otomatis. Silakan pilih secara manual pada Peta di samping atau ketik alamat Anda.';
        if (error.code === error.PERMISSION_DENIED) {
          errMsg = 'Akses lokasi ditolak. Silakan klik wilayah peta atau ketik alamat secara manual.';
        }
        setErrorText(errMsg);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  // Trigger GPS detection on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      detectCurrentLocation();
    }, 800);
    return () => clearTimeout(timer);
  }, [map]);

  // Setup DirectionsRenderer
  useEffect(() => {
    if (!map) return;

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#1A73E8', // Nice vibrant Google Maps Blue
          strokeWeight: 6,
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

  // 1. Route computing using OSRM Routing service (Alternatives Support)
  useEffect(() => {
    if (!map || !selectedCustCoords) return;

    setLoading(true);
    setErrorText('');

    const calculateRoute = async () => {
      try {
        const profile = travelMode === 'jalan-kaki' ? 'foot' : 'driving';
        const fetchedRoutes = await getOSRMAlternativeRoutes(
          selectedCustCoords[0],
          selectedCustCoords[1],
          laundryCoords[0],
          laundryCoords[1],
          profile
        );

        setRoutesList(fetchedRoutes);
        // Automatically select the primary route (the first one)
        if (fetchedRoutes.length > 0) {
          setSelectedRouteId(fetchedRoutes[0].id);
        }
      } catch (err) {
        console.warn('OSRM Route computation failed:', err);
        setErrorText('Gagal membuat rute jalan OSRM. Menampilkan rute garis lurus.');

        // Straight line fallback values
        const distance = getHaversineDistance(
          selectedCustCoords[0],
          selectedCustCoords[1],
          laundryCoords[0],
          laundryCoords[1]
        );
        const duration = travelMode === 'jalan-kaki'
          ? Math.max(1, Math.ceil(distance * 12))
          : Math.max(1, Math.ceil(distance * 3));

        const fallbackRoute: OSRMRouteResult = {
          id: 'route-fallback',
          distance,
          duration,
          coordinates: [
            [selectedCustCoords[0], selectedCustCoords[1]],
            [laundryCoords[0], laundryCoords[1]]
          ],
          summary: 'Garis Lurus',
          isPrimary: true,
        };

        setRoutesList([fallbackRoute]);
        setSelectedRouteId('route-fallback');
      } finally {
        setLoading(false);
      }
    };

    calculateRoute();
  }, [map, selectedCustCoords, travelMode]);

  // 2. Draw and update polylines on the map (PolylineRenderer)
  useEffect(() => {
    if (!map) return;

    // Reset previous path lines
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    if (routesList.length === 0) return;

    routesList.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      
      // Styling according to requirements
      // Primary / Selected Route: Google Maps Blue #4285F4, thicker, on top
      // Alternative / Unselected Route: Grey #9E9E9E, slightly thinner, below
      const strokeColor = isSelected ? '#4285F4' : '#9E9E9E';
      const strokeWeight = isSelected ? 6 : 4;
      const strokeOpacity = isSelected ? 0.95 : 0.6;
      const zIndex = isSelected ? 100 : 10;

      const polyline = new google.maps.Polyline({
        path: route.coordinates.map(coord => ({ lat: coord[0], lng: coord[1] })),
        strokeColor,
        strokeWeight,
        strokeOpacity,
        zIndex,
        clickable: true,
      });

      polyline.setMap(map);
      polylinesRef.current.push(polyline);

      // Click interaction to select route
      polyline.addListener('click', () => {
        setSelectedRouteId(route.id);
      });

      // Hover effects
      polyline.addListener('mouseover', () => {
        polyline.setOptions({
          strokeOpacity: isSelected ? 1.0 : 0.85,
          strokeWeight: isSelected ? 7 : 5,
        });
      });

      polyline.addListener('mouseout', () => {
        polyline.setOptions({
          strokeOpacity,
          strokeWeight,
        });
      });
    });

    // Fit bounds to fit laundry & customer coords
    if (selectedCustCoords) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: laundryCoords[0], lng: laundryCoords[1] });
      bounds.extend({ lat: selectedCustCoords[0], lng: selectedCustCoords[1] });
      map.fitBounds(bounds);
    }
  }, [map, routesList, selectedRouteId, selectedCustCoords]);

  // 3. Handle route selection state updates and parent callback triggers
  useEffect(() => {
    if (routesList.length === 0 || !selectedRouteId) return;

    const activeRoute = routesList.find(r => r.id === selectedRouteId) || routesList[0];
    if (activeRoute) {
      const distKm = activeRoute.distance;
      setDistance(parseFloat(distKm.toFixed(2)));

      let durDrivingMins = 0;
      let durWalkingMins = 0;

      if (travelMode === 'jalan-kaki') {
        durWalkingMins = activeRoute.duration;
        durDrivingMins = Math.max(1, Math.ceil((distKm / 35) * 60));
      } else {
        durDrivingMins = activeRoute.duration;
        durWalkingMins = Math.max(1, Math.ceil((distKm / 5) * 60));
      }

      setDrivingTime(durDrivingMins);
      setWalkingTime(durWalkingMins);

      // Callback to parent
      onRouteCalculated({
        distance: parseFloat(distKm.toFixed(2)),
        address: resolvedAddress || addressInput,
        routeChecked: true,
        durationDriving: durDrivingMins,
        durationWalking: durWalkingMins,
        coordinates: selectedCustCoords || [0, 0],
        routeType: activeRoute.isPrimary ? 'Rute Tercepat' : 'Rute Alternatif',
        routeDistance: parseFloat(distKm.toFixed(2)),
        routeDuration: travelMode === 'jalan-kaki' ? durWalkingMins : durDrivingMins,
        routeGeometry: activeRoute.coordinates,
      });
    }
  }, [selectedRouteId, routesList, travelMode, resolvedAddress, addressInput, selectedCustCoords]);

  // Click on map to select coordinates
  const handleMapClick = (e: any) => {
    if (e.detail?.latLng) {
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      selectLocationOnMap(lat, lng);
    }
  };

  return (
    <section id="cekrute" className="py-20 md:py-28 bg-[#fdfbf7] relative overflow-hidden">
      {/* Decorative floral backgrounds */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gold-light/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="font-sans text-xs font-semibold text-purple-700 tracking-widest uppercase bg-purple-100/55 px-3 py-1 rounded-full inline-block">
            Fitur Utama Layanan
          </span>
          <h2 className="font-display text-3xl md:text-4xl text-slate-aesthetic font-semibold mt-3 mb-4 leading-tight">
            Cek Rute &amp; Hitung Jarak Terpadu
          </h2>
          <p className="font-sans text-sm text-slate-500">
            Jangkauan laundry kami tersinkronisasi di Google Maps. Silakan cek rute tercepat dan estimasi waktu penjemputan gratis ke alamat pribadi Anda secara langsung.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Controls & Calculations Sidebar (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            {/* Input card coordinates (Glassmorphism) */}
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-purple-100/50 shadow-sm space-y-5 relative">
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-5 h-5 text-purple-600" />
                <h4 className="font-display text-base font-semibold text-slate-aesthetic">
                  Tentukan Lokasi Jemput
                </h4>
              </div>

              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Silakan klik langsung di wilayah peta mana saja untuk menentukan lokasi penjemputan, atau gunakan tombol GPS di bawah.
              </p>

              <div className="space-y-3.5 relative">
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-300">
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    ) : (
                      <MapPin className="w-4 h-4 text-purple-400" />
                    )}
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={addressInput || 'Belum memilih lokasi. Silakan klik peta...'}
                    placeholder="Silakan tentukan lokasi pada peta..."
                    className="w-full pl-9 pr-4 py-3 text-xs md:text-sm rounded-xl border border-purple-100 bg-slate-50/50 text-slate-700 cursor-default focus:outline-none transition-all placeholder:text-slate-350"
                  />
                </div>
              </div>

              {errorText && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs border border-red-100 flex items-start gap-1.5 leading-normal">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorText}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={detectCurrentLocation}
                  disabled={loading}
                  className="w-full py-2.5 px-3 bg-purple-50 hover:bg-purple-100/60 border border-purple-100 text-purple-700 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5 animate-pulse" />
                  Minta GPS Saya
                </button>
              </div>
            </div>

            {/* Live routing calculations output card */}
            {distance !== null ? (
              <div className="bg-gradient-to-tr from-[#FAF8FC] to-white p-6 rounded-3xl border border-purple-100/80 shadow-[0_4px_15px_rgb(112,72,232,0.01)] space-y-4">
                {/* Visual badges for routes */}
                <div className="border-b border-purple-50 pb-3">
                  <span className="font-display text-sm font-semibold text-slate-aesthetic block">
                    Rute Penjemputan
                  </span>
                </div>

                {/* List of Available Routes (RouteSelector) */}
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {routesList.map((route, idx) => {
                    const isSelected = route.id === selectedRouteId;
                    return (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => setSelectedRouteId(route.id)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-50/70 border-purple-200 shadow-xs'
                            : 'bg-white/60 border-purple-50 hover:bg-slate-50/80 hover:border-purple-100'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#4285F4]' : 'bg-slate-300'}`} />
                            <span className="font-display text-xs font-semibold text-slate-850">
                              {route.isPrimary ? 'Rute Tercepat' : `Rute Alternatif ${idx}`}
                            </span>
                            {route.isPrimary && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Rekomendasi
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-sans pl-3.5 italic">
                            {route.summary || 'via Jalan Sekitar'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-display text-xs font-bold text-slate-800 block">
                            {route.distance} km
                          </span>
                          <span className="text-[9px] text-slate-500 font-sans block">
                            ~ {route.duration} mnt
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Main statistics bento cells */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 bg-white border border-purple-50 rounded-xl text-center">
                    <span className="text-[9px] text-slate-400 font-sans block">Total Jarak</span>
                    <span className="font-display text-sm font-bold text-slate-aesthetic mt-1 block">
                      {distance}{' '}
                      <span className="text-[9px] font-sans font-medium text-purple-600">km</span>
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-purple-50 rounded-xl text-center">
                    <span className="text-[9px] text-slate-400 font-sans block">Mobil/Motor</span>
                    <span className="font-display text-sm font-bold text-slate-aesthetic mt-1 block">
                      {drivingTime}{' '}
                      <span className="text-[9px] font-sans font-medium text-purple-600">menit</span>
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-purple-50 rounded-xl text-center">
                    <span className="text-[9px] text-slate-400 font-sans block">Jalan Kaki</span>
                    <span className="font-display text-sm font-bold text-slate-aesthetic mt-1 block">
                      {walkingTime}{' '}
                      <span className="text-[9px] font-sans font-medium text-purple-600">menit</span>
                    </span>
                  </div>
                </div>

                {/* Subtitle notes */}
                <div className="rounded-xl p-3 bg-purple-50/50 text-[10px] text-purple-700 border border-purple-100 flex items-start gap-1.5 leading-normal">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-600" />
                  <span>
                    💡 Klik rute di daftar rute di atas atau klik langsung garis rutenya di peta untuk beralih rute penjemputan.
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white/50 p-6 rounded-3xl border border-dashed border-purple-100 flex flex-col items-center justify-center text-center py-12">
                <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-700 mb-3.5 animate-pulse">
                  <Compass className="w-5 h-5" />
                </div>
                <h5 className="font-display text-sm font-semibold text-slate-aesthetic mb-1.5">
                  Estimasi Jarak &amp; Waktu Belum Siap
                </h5>
                <p className="font-sans text-xs text-slate-400 max-w-[240px] leading-relaxed">
                  Harap letakkan pin lokasi atau ketikkan alamat terlebih dahulu untuk menghitung estimasi rute kurir.
                </p>
              </div>
            )}
          </div>

          {/* Map canvas (7 Columns) */}
          <div className="lg:col-span-7 h-[360px] lg:h-auto min-h-[400px] bg-white rounded-3xl border border-purple-100/70 shadow-sm relative overflow-hidden flex flex-col">
            <div className="w-full flex-1 h-full z-0 pointer-events-auto">
              <Map
                defaultCenter={{ lat: laundryCoords[0], lng: laundryCoords[1] }}
                defaultZoom={13}
                mapId="DEMO_MAP_ID"
                onClick={handleMapClick}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
                gestureHandling="cooperative"
              >
                {/* Laundry advanced marker */}
                <AdvancedMarker position={{ lat: laundryCoords[0], lng: laundryCoords[1] }}>
                  <div style={{ width: '44px', height: '44px' }} className="relative flex items-center justify-center -translate-y-4 select-none">
                    <div className="absolute w-12 h-12 rounded-full bg-purple-500/25 animate-ping"></div>
                    <div className="relative w-10 h-10 bg-purple-600 border-2 border-[#D4AF37] rounded-full flex items-center justify-center shadow-lg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                      </svg>
                    </div>
                    <div className="absolute -bottom-2.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#D4AF37]"></div>
                  </div>
                </AdvancedMarker>

                {/* Customer advanced marker */}
                {selectedCustCoords && (
                  <AdvancedMarker position={{ lat: selectedCustCoords[0], lng: selectedCustCoords[1] }}>
                    <div style={{ width: '38px', height: '38px' }} className="relative flex items-center justify-center -translate-y-3 select-none">
                      <div className="relative w-8 h-8 bg-[#B78A62] border-2 border-white rounded-full flex items-center justify-center shadow-lg">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <div className="absolute -bottom-1.5 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[#B78A62]"></div>
                    </div>
                  </AdvancedMarker>
                )}
              </Map>
            </div>
            <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-purple-100 text-[10px] font-semibold text-slate-600 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
              Google Maps Live GPS Pasuruan
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
