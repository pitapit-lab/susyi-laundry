import React, { useState, useEffect } from 'react';
import { Sparkles, LogOut, Package, X, Check, ArrowRight, Edit3, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer } from '../types';
import { getRegisteredUsers } from '../utils/database';
import CustomerOrderMap from './CustomerOrderMap';
import { reverseGeocode } from '../utils/mapServices';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

function getCustomFormattedAddress(components: any[], defaultFormatted?: string): string {
  let route = '';
  let desaKelurahan = '';
  let kecamatan = '';
  let kabupatenKota = '';
  let provinsi = '';
  let postalCode = '';
  let country = '';

  for (const component of components) {
    const types = component.types || [];
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

  if (!desaKelurahan) {
    for (const component of components) {
      if ((component.types || []).includes('locality')) {
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

interface CustomerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onLogout: () => void;
  onUpdateCustomer?: (customer: Customer) => void;
}

// Custom SVG Icons for aesthetic matching
const TruckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const ShirtIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20.38 3.46L16 2a1.86 1.86 0 0 0-1.96 1L12 6 9.96 3a1.86 1.86 0 0 0-1.96-1L3.62 3.46a2 2 0 0 0-1.34 1.5l-1 8a2 2 0 0 0 1.2 2.1l5.48 2a2 2 0 0 0 2.22-.5L12 14.5l1.82 2.1a2 2 0 0 0 2.22.5l5.48-2a2 2 0 0 0 1.2-2.1l-1-8a2 2 0 0 0-1.34-1.5z" />
  </svg>
);

const IronIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 17h16c1.66 0 3-1.34 3-3V9c0-1.1-.9-2-2-2H9C5 7 3.5 11 2 17z" />
    <path d="M7 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
  </svg>
);

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default function CustomerDashboard({ isOpen, onClose, customer, onLogout, onUpdateCustomer }: CustomerDashboardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(customer.name || '');
  const [editPhone, setEditPhone] = useState(customer.phone || '');
  const [editEmail, setEditEmail] = useState(customer.email || '');
  const [editAddress, setEditAddress] = useState(customer.address || '');
  const [editError, setEditError] = useState('');

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsSuccess, setGpsSuccess] = useState(false);

  const handleGetLocation = () => {
    setGpsLoading(true);
    setGpsError('');
    setGpsSuccess(false);

    if (!navigator.geolocation) {
      setGpsError('Gagal mendapatkan lokasi. Browser Anda tidak mendukung Geolocation.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Gunakan Nominatim (OpenStreetMap) Reverse Geocoding
          const fullAddress = await reverseGeocode(latitude, longitude);
          
          const updated: Customer = {
            ...customer,
            address: fullAddress,
            latitude: latitude,
            longitude: longitude,
            location_updated_at: new Date().toLocaleString('id-ID', {
              timeZone: 'Asia/Jakarta',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }).replace(/\./g, ':') + ' WIB'
          };

          if (onUpdateCustomer) {
            await onUpdateCustomer(updated);
          }

          setEditAddress(fullAddress);
          setGpsSuccess(true);
          setGpsLoading(false);
          
          setTimeout(() => {
            setGpsSuccess(false);
          }, 5000);
        } catch (error) {
          setGpsError('Gagal menyimpan lokasi GPS Anda. Silakan coba kembali.');
          setGpsLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Lokasi tidak dapat diakses. Silakan izinkan akses lokasi atau isi alamat secara manual.');
        } else {
          setGpsError('Gagal mendapatkan lokasi. Silakan coba kembali.');
        }
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    if (isOpen) {
      setEditName(customer.name || '');
      setEditPhone(customer.phone || '');
      setEditEmail(customer.email || '');
      setEditAddress(customer.address || '');
      setIsEditing(false);
      setEditError('');
    }
  }, [isOpen, customer]);

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      setEditError('Nama lengkap wajib diisi');
      return;
    }
    if (!editPhone.trim()) {
      setEditError('No. WhatsApp wajib diisi');
      return;
    }

    // Validasi No. WhatsApp
    const numericRegex = /^[0-9]+$/;
    const cleanPhone = editPhone.trim();
    if (!numericRegex.test(cleanPhone)) {
      setEditError('Nomor WhatsApp hanya boleh berisi angka.');
      return;
    }
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      setEditError('Nomor WhatsApp harus berkisar antara 10 sampai 15 digit.');
      return;
    }

    // Check if the phone number already exists on another account
    const registered = getRegisteredUsers();
    const phoneExists = registered.some(u => 
      (u.phone || '').trim() === cleanPhone && 
      (u.email || '').toLowerCase() !== customer.email.toLowerCase()
    );
    if (phoneExists) {
      setEditError('Nomor WhatsApp ini sudah digunakan oleh akun lain.');
      return;
    }
    
    const updated: Customer = {
      ...customer,
      name: editName,
      phone: cleanPhone,
      email: editEmail,
      address: editAddress,
    };
    
    if (onUpdateCustomer) {
      onUpdateCustomer(updated);
    }
    setIsEditing(false);
    setEditError('');
  };

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'Selesai':
        return {
          text: 'Selesai',
          classes: 'bg-emerald-500/10 text-emerald-600 border-emerald-250'
        };
      case 'Dibatalkan':
        return {
          text: 'Dibatalkan',
          classes: 'bg-rose-500/10 text-rose-600 border-rose-250'
        };
      case 'Diproses':
      case 'Sedang Dicuci':
      case 'Proses Penyetrikaan':
      case 'Dicuci':
      case 'Disetrika':
        return {
          text: status,
          classes: 'bg-purple-500/10 text-purple-600 border-purple-250'
        };
      case 'Menunggu Konfirmasi':
      case 'Menunggu Penjemputan':
      case 'Siap Diantar':
      default:
        return {
          text: status,
          classes: 'bg-amber-500/10 text-amber-600 border-amber-250'
        };
    }
  };

  const getStepProgressIndex = (status: string) => {
    switch (status) {
      case 'Menunggu Konfirmasi':
      case 'Menunggu Penjemputan': return 1;
      case 'Diproses':
      case 'Sedang Dicuci':
      case 'Dicuci': return 2;
      case 'Proses Penyetrikaan':
      case 'Disetrika': return 3;
      case 'Siap Diantar': return 4;
      case 'Selesai': return 4; // Final state
      default: return 1;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end font-sans">
          {/* Backdrop blurring the other parts of the site */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#090514]/40 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 210 }}
            className="relative w-full max-w-md h-full bg-gradient-to-b from-[#FAF8FF] to-[#F1EAFF] shadow-2xl border-l border-purple-200 flex flex-col justify-between z-10 overflow-hidden"
          >
            {/* Header top background decor shapes */}
            <div className="absolute top-0 right-0 left-0 h-44 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-200/50 via-purple-100/25 to-transparent pointer-events-none -z-10" />

            {/* Top Toolbar */}
            <div className="p-6 flex items-center justify-between border-b border-purple-200/30 bg-white/45 backdrop-blur-md">
              <div className="flex items-center gap-2">
                {/* Bagian ini telah dihapus sesuai permintaan */}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-purple-100/60 text-slate-500 hover:text-purple-900 rounded-full cursor-pointer transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content wrapper */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Header Welcome text banner */}
              <div>
                <h3 className="font-sans font-extrabold text-[#B78A62] text-[10px] tracking-widest uppercase mb-1">
                  MEMBER DASHBOARD
                </h3>
                <h2 className="font-sans font-extrabold text-2xl text-purple-950 leading-tight">
                  Selamat datang kembali, <span className="text-[#B78A62]">{customer.name}</span>
                </h2>
              </div>

              {/* PROFIL PELANGGAN (Card Glassmorphism) */}
              <div className="p-5 rounded-[22px] bg-white/70 backdrop-blur-md border border-purple-200/50 shadow-[0_8px_32px_rgba(112,72,232,0.04)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Photo Profile / Avatar */}
                    {customer.avatar ? (
                      <img 
                        src={customer.avatar} 
                        alt="Profile" 
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-700 to-[#B78A62] text-white font-sans text-lg font-black flex items-center justify-center border-2 border-white shadow-md select-none shrink-0">
                        {(customer.name || '').substring(0, 2).toUpperCase() || 'CU'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-sans text-xs font-bold text-purple-900 tracking-wider uppercase">
                        ID CUSTOMER
                      </h4>
                      <span className="font-mono text-[10px] text-slate-400 font-bold block">
                        #SUSYI-{customer.phone.slice(-4) || 'MEMBER'}
                      </span>
                      <span className="font-sans text-[11px] text-purple-950/70 font-medium block truncate mt-0.5">
                        {customer.email}
                      </span>
                      {customer.google_linked && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[8px] font-bold">
                          <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                          <span>Google Sign-In</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-2.5 py-1.5 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Profil
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="pt-3 border-t border-purple-200/30 space-y-3.5 text-xs">
                    {editError && (
                      <p className="text-rose-600 font-semibold text-[11px] bg-rose-50 p-2 rounded-lg border border-rose-100">
                        ⚠️ {editError}
                      </p>
                    )}
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nama Lengkap</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-purple-150 rounded-xl focus:border-purple-600 focus:outline-none transition-all font-semibold text-slate-800"
                        placeholder="Nama Lengkap"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">No. WhatsApp</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-purple-150 rounded-xl focus:border-purple-600 focus:outline-none transition-all font-semibold text-slate-800"
                        placeholder="Contoh: 081234567890"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Alamat Email</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-purple-150 rounded-xl focus:border-purple-600 focus:outline-none transition-all font-semibold text-slate-800"
                        placeholder="alamat@email.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Alamat</label>
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={gpsLoading}
                          className="text-[9px] text-purple-600 hover:text-purple-800 font-bold transition-all flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                        >
                          {gpsLoading ? (
                            <>
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              <span>Mencari...</span>
                            </>
                          ) : (
                            <>
                              <span>📍</span>
                              <span>Gunakan GPS</span>
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-purple-150 rounded-xl focus:border-purple-600 focus:outline-none transition-all font-semibold text-slate-800 resize-none h-18 text-[11px]"
                        placeholder="Alamat lengkap penjemputan"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditError('');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-all text-[11px] cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-purple-200/30 space-y-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">👤</span>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-medium block">Nama Lengkap</span>
                        <strong className="text-slate-800 font-bold block truncate">{customer.name}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm">📱</span>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-medium block">No. WhatsApp</span>
                        <strong className="text-slate-800 font-bold block">{customer.phone}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm">✉️</span>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-medium block">Alamat Email</span>
                        <strong className="text-slate-800 font-bold block truncate">{customer.email || "Belum disimpan"}</strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">📍</span>
                      <div className="min-w-0 w-full">
                        <span className="text-[10px] text-slate-400 font-medium block">Alamat</span>
                        <p className="text-slate-700 font-semibold leading-relaxed text-[11px] mb-2 break-words">
                          {customer.address || "Belum diatur"}
                        </p>

                        {/* Coordinates and update timestamp */}
                        {customer.latitude && customer.longitude && (
                          <div className="text-[9px] text-slate-500 font-mono space-y-0.5 bg-purple-50/50 p-1.5 rounded-lg border border-purple-100/40 mb-2">
                            <span className="block font-bold">🛰️ Lat: {customer.latitude.toFixed(6)}, Lng: {customer.longitude.toFixed(6)}</span>
                            {customer.location_updated_at && (
                              <span className="block text-slate-400 font-sans text-[8px]">Diperbarui: {customer.location_updated_at}</span>
                            )}
                          </div>
                        )}

                        {/* Geolocation Controls */}
                        <div className="mt-2">
                          {gpsLoading ? (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-700 bg-purple-50/70 px-2.5 py-1.5 rounded-xl border border-purple-100 animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                              <span>Mencari koordinat &amp; alamat...</span>
                            </div>
                          ) : gpsSuccess ? (
                            <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-150">
                              <span className="text-emerald-500 font-bold">✔</span>
                              <span>Lokasi berhasil diperbarui</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleGetLocation}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-95"
                            >
                              <span>📍</span>
                              <span>
                                {!customer.address || customer.address === "Belum diatur" || customer.address === "Alamat belum diatur"
                                  ? "Gunakan Lokasi Saya"
                                  : "Perbarui Lokasi"}
                              </span>
                            </button>
                          )}

                          {gpsError && (
                            <p className="text-[9px] font-semibold text-rose-600 mt-1.5 leading-relaxed bg-rose-50 p-1.5 rounded-lg border border-rose-100">
                              {gpsError}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RIWAYAT & STATUS CUCIAN */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-bold text-purple-950 text-sm tracking-wide">
                    Riwayat &amp; Status Cucian
                  </h3>
                  <span className="font-sans text-[10px] bg-purple-100/60 text-purple-800 px-3 py-1 rounded-full font-bold">
                    {customer.orders.length} Transaksi
                  </span>
                </div>

                {customer.orders.length === 0 ? (
                  <div className="text-center py-10 px-4 bg-white/50 backdrop-blur-xs rounded-2xl border border-dashed border-purple-200/50">
                    <Package className="w-8 h-8 text-purple-300 mx-auto mb-3" />
                    <p className="font-sans text-xs text-slate-500">
                      Belum ada pemesanan laundry yang berjalan.
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-4 font-sans text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors cursor-pointer"
                    >
                      Mulai Pesan Baru →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customer.orders.map((ord) => {
                      const statusDetail = getStatusDetails(ord.status);
                      const stepIndex = getStepProgressIndex(ord.status);
                      
                      return (
                        <div
                          key={ord.id}
                          className="p-5 rounded-[20px] bg-white border border-purple-200/30 shadow-[0_4px_20px_rgba(112,72,232,0.02)] hover:shadow-md hover:border-purple-300/40 transition-all duration-300 space-y-4"
                        >
                          {/* Order Card Header */}
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-mono text-xs font-black text-purple-900">
                                #{ord.id}
                              </span>
                              <span className="font-sans text-[10px] text-slate-400 block mt-0.5">
                                Order pada {ord.date}
                              </span>
                            </div>
                            <span className={`text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full border ${statusDetail.classes}`}>
                              {statusDetail.text}
                            </span>
                          </div>

                          {/* Order Details */}
                          <div className="flex justify-between items-center text-xs font-sans pb-1">
                            <span className="text-slate-500 font-semibold">{ord.serviceType}</span>
                            <span className="font-black text-purple-950">
                              Rp {ord.totalPrice.toLocaleString('id-ID')}
                            </span>
                          </div>

                          {/* Custom OSRM route selection metadata */}
                          {(ord as any).routeType && (
                            <div className="flex flex-wrap gap-1.5 items-center text-[9px] pb-1.5">
                              <span className="bg-blue-50 text-blue-700 font-sans font-semibold px-1.5 py-0.5 rounded border border-blue-100/50">
                                🛣️ Rute: {(ord as any).routeType}
                              </span>
                              {(ord as any).routeDistance !== undefined && (
                                <span className="bg-emerald-50 text-emerald-700 font-sans font-semibold px-1.5 py-0.5 rounded border border-emerald-100/50">
                                  📏 {(ord as any).routeDistance} km
                                </span>
                              )}
                              {(ord as any).routeDuration !== undefined && (
                                <span className="bg-amber-50 text-amber-700 font-sans font-semibold px-1.5 py-0.5 rounded border border-amber-100/50">
                                  ⏱️ {(ord as any).routeDuration} mnt
                                </span>
                              )}
                            </div>
                          )}

                          {/* Order Map if coordinates exist */}
                          {ord.coordinates && ord.coordinates.length === 2 && (
                            <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-150 relative z-0 mt-1">
                              <CustomerOrderMap 
                                orderCoords={[ord.coordinates[0], ord.coordinates[1]]} 
                                orderAddress={ord.address} 
                              />
                            </div>
                          )}

                          {/* PROGRESS TRACKING */}
                          <div className="pt-2.5 border-t border-purple-50">
                            <div className="flex justify-between items-center relative">
                              
                              {/* Background Line */}
                              <div className="absolute left-[8%] right-[8%] top-[12px] h-[3px] bg-slate-200 -z-10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#B78A62] to-purple-600 transition-all duration-1000"
                                  style={{ width: `${ord.status === 'Selesai' ? 100 : ((stepIndex - 1) / 3) * 100}%` }}
                                />
                              </div>

                              {/* Step 1: Jemput */}
                              <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                                  ord.status === 'Selesai' || stepIndex > 1
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : stepIndex === 1
                                    ? 'bg-purple-600 text-[#FFDF9F] animate-pulse ring-2 ring-purple-200'
                                    : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {ord.status === 'Selesai' || stepIndex > 1 ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  ) : (
                                    <TruckIcon className="w-3 h-3" />
                                  )}
                                </div>
                                <span className={`text-[9px] mt-1 font-bold ${stepIndex >= 1 ? 'text-purple-900' : 'text-slate-400'}`}>
                                  Jemput
                                </span>
                              </div>

                              {/* Step 2: Cuci */}
                              <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                                  ord.status === 'Selesai' || stepIndex > 2
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : stepIndex === 2
                                    ? 'bg-purple-600 text-[#FFDF9F] animate-pulse ring-2 ring-purple-200'
                                    : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {ord.status === 'Selesai' || stepIndex > 2 ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  ) : (
                                    <ShirtIcon className="w-3 h-3" />
                                  )}
                                </div>
                                <span className={`text-[9px] mt-1 font-bold ${stepIndex >= 2 ? 'text-purple-900' : 'text-slate-400'}`}>
                                  Cuci
                                </span>
                              </div>

                              {/* Step 3: Setrika */}
                              <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                                  ord.status === 'Selesai' || stepIndex > 3
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : stepIndex === 3
                                    ? 'bg-purple-600 text-[#FFDF9F] animate-pulse ring-2 ring-purple-200'
                                    : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {ord.status === 'Selesai' || stepIndex > 3 ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  ) : (
                                    <IronIcon className="w-3 h-3" />
                                  )}
                                </div>
                                <span className={`text-[9px] mt-1 font-bold ${stepIndex >= 3 ? 'text-purple-900' : 'text-slate-400'}`}>
                                  Setrika
                                </span>
                              </div>

                              {/* Step 4: Kirim */}
                              <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                                  ord.status === 'Selesai'
                                    ? 'bg-emerald-500 text-white shadow-lg'
                                    : stepIndex >= 4
                                    ? 'bg-purple-600 text-[#FFDF9F] animate-pulse ring-2 ring-purple-200'
                                    : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {ord.status === 'Selesai' ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  ) : (
                                    <CheckCircleIcon className="w-3 h-3" />
                                  )}
                                </div>
                                <span className={`text-[9px] mt-1 font-bold ${stepIndex >= 4 ? 'text-purple-900' : 'text-slate-400'}`}>
                                  Kirim
                                </span>
                              </div>

                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Bottom tools with logout button */}
            <div className="p-6 border-t border-purple-200/40 bg-white/45 backdrop-blur-sm flex items-center justify-between">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-950 via-purple-900 to-[#4A207B] hover:opacity-90 text-[#FFDF9F] rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <LogOut className="w-4 h-4 text-[#FFDF9F]" />
                LOGOUT
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

