/**
 * Map Services Utility using Open Source alternatives:
 * - Nominatim (OpenStreetMap) for Forward & Reverse Geocoding
 * - OSRM (Open Source Routing Machine) for Routing, Distance, and Duration
 * Includes caching, timeouts, and fallbacks.
 */

// Simple in-memory cache
const cache = {
  reverse: new Map<string, string>(),
  forward: new Map<string, [number, number]>(),
  routing: new Map<string, {
    distance: number;
    duration: number;
    coordinates: [number, number][]; // [lat, lng][] for Google Maps Polyline
  }>(),
};

const TIMEOUT_MS = 6000;

/**
 * Helper to fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      }
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout (koneksi lambat)');
    }
    throw error;
  }
}

/**
 * Haversine formula to compute straight-line distance
 */
export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Format Nominatim address object to pretty Indonesia layout
 */
export function formatOSMAddress(addressObj: any): string {
  if (!addressObj) return 'Alamat tidak dikenal';
  
  // Specific properties from Nominatim
  const route = addressObj.road || addressObj.street || '';
  const desaKelurahan = addressObj.village || addressObj.suburb || addressObj.neighbourhood || addressObj.hamlet || addressObj.island || '';
  const kecamatan = addressObj.city_district || addressObj.subdistrict || addressObj.municipality || '';
  const kabupatenKota = addressObj.city || addressObj.county || addressObj.regency || '';
  const provinsi = addressObj.state || '';
  const postalCode = addressObj.postcode || '';
  const country = addressObj.country || '';

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
  return customAddress || 'Alamat tidak dikenal';
}

/**
 * Reverse Geocoding (lat, lng -> address text)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  if (cache.reverse.has(cacheKey)) {
    return cache.reverse.get(cacheKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id,en`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      throw new Error(`Nominatim HTTP error: ${res.status}`);
    }
    const data = await res.json();
    if (data && data.address) {
      const formatted = formatOSMAddress(data.address);
      cache.reverse.set(cacheKey, formatted);
      return formatted;
    }
    if (data && data.display_name) {
      cache.reverse.set(cacheKey, data.display_name);
      return data.display_name;
    }
    throw new Error('Alamat tidak ditemukan');
  } catch (err) {
    console.warn('Reverse geocode error, using fallback:', err);
    return `Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

/**
 * Forward Geocoding (address text -> lat, lng)
 */
export async function forwardGeocode(address: string): Promise<[number, number]> {
  const trimmed = address.trim();
  if (cache.forward.has(trimmed)) {
    return cache.forward.get(trimmed)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(trimmed)}&limit=1&countrycodes=id`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      throw new Error(`Nominatim HTTP error: ${res.status}`);
    }
    const data = await res.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      const coords: [number, number] = [lat, lng];
      cache.forward.set(trimmed, coords);
      return coords;
    }
    throw new Error('Lokasi tidak ditemukan');
  } catch (err) {
    console.error('Forward geocode error:', err);
    throw err;
  }
}

/**
 * Search autocomplete / suggestions via Nominatim
 */
export interface SearchSuggestion {
  display_name: string;
  lat: number;
  lon: number;
}

export async function searchAddress(query: string): Promise<SearchSuggestion[]> {
  if (!query || query.trim().length < 3) return [];
  
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=8&countrycodes=id&accept-language=id`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      throw new Error(`Nominatim Search error: ${res.status}`);
    }
    const data = await res.json();
    return (data || []).map((item: any) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));
  } catch (err) {
    console.error('Search address error:', err);
    return [];
  }
}

/**
 * OSRM Route interface
 */
export interface OSRMRouteResult {
  id: string;
  distance: number; // in km
  duration: number; // in minutes
  coordinates: [number, number][]; // [lat, lng][] array for drawing polyline
  summary: string; // street summary, e.g. "Jl. Margonda Raya"
  isPrimary: boolean;
}

/**
 * Routing via OSRM with Alternatives Support (Google Maps style)
 */
export async function getOSRMAlternativeRoutes(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  profile: 'driving' | 'foot' = 'driving'
): Promise<OSRMRouteResult[]> {
  const osrmProfile = profile === 'foot' ? 'foot' : 'driving';
  
  try {
    const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&alternatives=true`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      throw new Error(`OSRM HTTP error: ${res.status}`);
    }
    const data = await res.json();
    
    if (data && data.routes && data.routes.length > 0) {
      return data.routes.map((route: any, index: number) => {
        const distance = parseFloat((route.distance / 1000).toFixed(2)); // meter to km
        const duration = Math.ceil(route.duration / 60); // seconds to minutes
        
        // Extract street summary
        let summary = '';
        if (route.legs && route.legs[0] && route.legs[0].summary) {
          summary = route.legs[0].summary;
        } else if (route.name) {
          summary = route.name;
        }
        
        if (!summary) {
          summary = index === 0 ? 'Rute Tercepat' : `Rute Alternatif ${index}`;
        } else {
          summary = `via ${summary}`;
        }

        // Extract coordinates from GeoJSON Geometry [lon, lat] and map to [lat, lon]
        let coordinates: [number, number][] = [];
        if (route.geometry && route.geometry.coordinates) {
          coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        } else {
          coordinates = [
            [startLat, startLng],
            [endLat, endLng]
          ];
        }

        return {
          id: `route-${index}-${distance}-${duration}`,
          distance,
          duration,
          coordinates,
          summary,
          isPrimary: index === 0,
        };
      });
    }
    
    throw new Error('No routes found from OSRM');
  } catch (err) {
    console.warn('OSRM routing alternatives error, using straight-line fallback:', err);
    // Straight line fallback values
    const distance = getHaversineDistance(startLat, startLng, endLat, endLng);
    
    const duration = profile === 'foot'
      ? Math.max(1, Math.ceil(distance * 12))
      : Math.max(1, Math.ceil(distance * 3));

    const coordinates: [number, number][] = [
      [startLat, startLng],
      [endLat, endLng]
    ];

    return [{
      id: 'route-fallback',
      distance,
      duration,
      coordinates,
      summary: 'Garis Lurus',
      isPrimary: true,
    }];
  }
}

/**
 * Routing via OSRM
 */
export async function getOSRMRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  profile: 'driving' | 'foot' = 'driving'
): Promise<{
  distance: number; // in km
  duration: number; // in minutes
  coordinates: [number, number][]; // [lat, lng][] array for drawing polyline
}> {
  const cacheKey = `${startLat.toFixed(6)},${startLng.toFixed(6)},${endLat.toFixed(6)},${endLng.toFixed(6)},${profile}`;
  if (cache.routing.has(cacheKey)) {
    return cache.routing.get(cacheKey)!;
  }

  const osrmProfile = profile === 'foot' ? 'foot' : 'driving';
  
  try {
    const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      throw new Error(`OSRM HTTP error: ${res.status}`);
    }
    const data = await res.json();
    
    if (data && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distance = parseFloat((route.distance / 1000).toFixed(2)); // meter to km
      const duration = Math.ceil(route.duration / 60); // seconds to minutes
      
      // Extract coordinates from GeoJSON Geometry [lon, lat] and map to [lat, lon]
      let coordinates: [number, number][] = [];
      if (route.geometry && route.geometry.coordinates) {
        coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
      } else {
        // Fallback if geometry missing
        coordinates = [
          [startLat, startLng],
          [endLat, endLng]
        ];
      }

      const result = { distance, duration, coordinates };
      cache.routing.set(cacheKey, result);
      return result;
    }
    
    throw new Error('No route found from OSRM');
  } catch (err) {
    console.warn('OSRM routing error, using straight-line fallback:', err);
    // Straight line fallback values
    const distance = getHaversineDistance(startLat, startLng, endLat, endLng);
    
    // Estimate durations based on simple speed models
    // Motor/car: average 30 km/h -> 2 min per km, min 1 min
    // Foot: average 5 km/h -> 12 min per km, min 1 min
    const duration = profile === 'foot'
      ? Math.max(1, Math.ceil(distance * 12))
      : Math.max(1, Math.ceil(distance * 3));

    const coordinates: [number, number][] = [
      [startLat, startLng],
      [endLat, endLng]
    ];

    return { distance, duration, coordinates };
  }
}
