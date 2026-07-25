import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  PackageCheck, 
  Search, 
  Filter, 
  X, 
  Navigation, 
  Eye, 
  ShoppingBag, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Order } from '../types';
import PickupVerificationSection from './PickupVerificationSection';

interface CourierManagementProps {
  orders: Order[];
  onUpdateOrder: (updatedOrder: Order) => void;
  onOpenMapModal?: (orderId: string) => void;
}

export default function CourierManagement({ orders, onUpdateOrder, onOpenMapModal }: CourierManagementProps) {
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<'semua' | 'pickup' | 'delivery' | 'selesai'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);

  // Local state for photo uploads in modal
  const [pickupPhotoPreview, setPickupPhotoPreview] = useState<string | null>(null);
  const [locationPhotoPreview, setLocationPhotoPreview] = useState<string | null>(null);
  const [deliveryPhotoPreview, setDeliveryPhotoPreview] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Sync previews when selected order changes
  const handleOpenDetail = (order: Order) => {
    setSelectedOrderForDetail(order);
    setPickupPhotoPreview(order.pickup_proof_photo || null);
    setLocationPhotoPreview(order.location_proof_photo || null);
    setDeliveryPhotoPreview(order.delivery_proof_photo || null);
    setActionSuccessMsg(null);
  };

  const handleCloseDetail = () => {
    setSelectedOrderForDetail(null);
    setPickupPhotoPreview(null);
    setLocationPhotoPreview(null);
    setDeliveryPhotoPreview(null);
    setActionSuccessMsg(null);
  };

  // Helper to determine task type for an order
  const getTaskType = (order: Order): 'Pickup' | 'Delivery' => {
    if (order.order_status === 'Siap Diantar' || order.courier_status === 'Sedang Diantar' || order.courier_status === 'Berhasil Diantar' || (order.pickup_completed_at && order.order_status !== 'Menunggu Konfirmasi')) {
      if (order.order_status === 'Selesai') {
        return 'Delivery';
      }
      if (['Dicuci', 'Disetrika', 'Siap Diantar'].includes(order.order_status) || order.courier_status === 'Menunggu Delivery' || order.courier_status === 'Sedang Diantar') {
        return 'Delivery';
      }
    }
    return 'Pickup';
  };

  // Helper to derive courier status if not set
  const getDerivedCourierStatus = (order: Order): string => {
    if (order.courier_status) return order.courier_status;
    if (order.order_status === 'Selesai') return 'Berhasil Diantar';
    if (order.order_status === 'Siap Diantar') return 'Menunggu Delivery';
    if (order.order_status === 'Menunggu Konfirmasi') return 'Menunggu Pickup';
    if (order.pickup_completed_at || ['Diproses', 'Dicuci', 'Disetrika'].includes(order.order_status)) return 'Laundry Berhasil Dijemput';
    return 'Menunggu Pickup';
  };

  // 1. Ringkasan Kurir (Summary Statistics)
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    let pickupToday = 0;
    let deliveryToday = 0;
    let pickupSelesai = 0;
    let deliverySelesai = 0;
    let pickupMenunggu = 0;
    let deliveryMenunggu = 0;

    orders.forEach(o => {
      const taskType = getTaskType(o);
      const cStatus = getDerivedCourierStatus(o);

      if (taskType === 'Pickup') {
        pickupToday++;
        if (cStatus === 'Laundry Berhasil Dijemput' || o.pickup_completed_at) {
          pickupSelesai++;
        } else {
          pickupMenunggu++;
        }
      } else {
        deliveryToday++;
        if (cStatus === 'Berhasil Diantar' || o.order_status === 'Selesai') {
          deliverySelesai++;
        } else {
          deliveryMenunggu++;
        }
      }
    });

    return {
      pickupToday,
      deliveryToday,
      pickupSelesai,
      deliverySelesai,
      pickupMenunggu,
      deliveryMenunggu
    };
  }, [orders]);

  // 2. Filtered Tasks List
  const filteredTasks = useMemo(() => {
    return orders.filter(order => {
      const taskType = getTaskType(order);
      const cStatus = getDerivedCourierStatus(order);

      // Search match
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        order.order_id.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.whatsapp.includes(q) ||
        (order.address && order.address.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Tab filter match
      if (selectedTaskFilter === 'pickup') {
        return taskType === 'Pickup' && cStatus !== 'Laundry Berhasil Dijemput';
      }
      if (selectedTaskFilter === 'delivery') {
        return taskType === 'Delivery' && cStatus !== 'Berhasil Diantar';
      }
      if (selectedTaskFilter === 'selesai') {
        return cStatus === 'Berhasil Diantar' || cStatus === 'Laundry Berhasil Dijemput' || order.order_status === 'Selesai';
      }
      return true; // 'semua'
    }).sort((a, b) => b.order_id.localeCompare(a.order_id));
  }, [orders, selectedTaskFilter, searchQuery]);

  // Photo handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'pickup' | 'location' | 'delivery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'pickup') setPickupPhotoPreview(base64);
      if (type === 'location') setLocationPhotoPreview(base64);
      if (type === 'delivery') setDeliveryPhotoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  // Google Maps navigation handler
  const handleOpenGoogleMaps = (order: Order) => {
    if (order.coordinates && order.coordinates[0] && order.coordinates[1]) {
      const url = `https://www.google.com/maps/search/?api=1&query=${order.coordinates[0]},${order.coordinates[1]}`;
      window.open(url, '_blank');
    } else if (order.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;
      window.open(url, '_blank');
    } else {
      alert('Alamat customer belum memiliki titik lokasi atau alamat lengkap.');
    }
  };

  // Status Action: Pickup Berhasil
  const handleConfirmPickupSuccess = () => {
    if (!selectedOrderForDetail) return;

    const nowStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const updated: Order = {
      ...selectedOrderForDetail,
      courier_status: 'Laundry Berhasil Dijemput',
      pickup_completed_at: nowStr,
      pickup_proof_photo: pickupPhotoPreview || selectedOrderForDetail.pickup_proof_photo,
      location_proof_photo: locationPhotoPreview || selectedOrderForDetail.location_proof_photo,
      order_status: selectedOrderForDetail.order_status === 'Menunggu Konfirmasi' ? 'Diproses' : selectedOrderForDetail.order_status,
      updated_at: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    onUpdateOrder(updated);
    setSelectedOrderForDetail(updated);
    setActionSuccessMsg('Penjemputan laundry berhasil dikonfirmasi dan dicatat!');
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Status Action: Kurir Menuju Lokasi
  const handleKurirEnRoute = () => {
    if (!selectedOrderForDetail) return;

    const updated: Order = {
      ...selectedOrderForDetail,
      courier_status: 'Kurir Menuju Lokasi',
      updated_at: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    onUpdateOrder(updated);
    setSelectedOrderForDetail(updated);
    setActionSuccessMsg('Status diperbarui: Kurir sedang menuju lokasi penjemputan.');
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Status Action: Mulai Pengantaran
  const handleStartDelivery = () => {
    if (!selectedOrderForDetail) return;

    const nowStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const updated: Order = {
      ...selectedOrderForDetail,
      courier_status: 'Sedang Diantar',
      order_status: 'Siap Diantar',
      delivery_started_at: nowStr,
      updated_at: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    onUpdateOrder(updated);
    setSelectedOrderForDetail(updated);
    setActionSuccessMsg('Status diperbarui: Pengantaran laundry dimulai!');
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Status Action: Pesanan Berhasil Diantar
  const handleConfirmDeliverySuccess = () => {
    if (!selectedOrderForDetail) return;

    const nowStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const updated: Order = {
      ...selectedOrderForDetail,
      courier_status: 'Berhasil Diantar',
      order_status: 'Selesai',
      delivery_completed_at: nowStr,
      delivery_proof_photo: deliveryPhotoPreview || selectedOrderForDetail.delivery_proof_photo,
      updated_at: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    onUpdateOrder(updated);
    setSelectedOrderForDetail(updated);
    setActionSuccessMsg('Pengantaran laundry berhasil! Pesanan ditandai Selesai.');
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Title & Description Banner */}
      <div className="bg-gradient-to-r from-[#1F1147] via-purple-900 to-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] uppercase font-black tracking-widest">
              <Truck className="w-3.5 h-3.5" />
              Modul Kurir & Penjemputan
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Manajemen Kurir & Operasional
            </h2>
            <p className="text-xs text-purple-200 font-medium max-w-xl">
              Kelola tugas pickup & delivery laundry, verifikasi item fisik langsung saat penjemputan, navigasi lokasi, dan pantau bukti pengantaran.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Ringkasan Kurir (Summary Metric Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Pickup */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Tugas Pickup</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-purple-950">{stats.pickupToday}</span>
            <span className="text-[10px] font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Hari Ini</span>
          </div>
        </div>

        {/* Total Delivery */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Tugas Delivery</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-indigo-950">{stats.deliveryToday}</span>
            <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Hari Ini</span>
          </div>
        </div>

        {/* Pickup Selesai */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Pickup Selesai</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-600">{stats.pickupSelesai}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* Delivery Selesai */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Delivery Selesai</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-teal-600">{stats.deliverySelesai}</span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
        </div>

        {/* Pickup Menunggu */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Pickup Menunggu</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-amber-600">{stats.pickupMenunggu}</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          </div>
        </div>

        {/* Delivery Menunggu */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Delivery Menunggu</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-blue-600">{stats.deliveryMenunggu}</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
        </div>
      </div>

      {/* 2. Daftar Tugas Kurir Controls & Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Filters and Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-150 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Tabs Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl w-full md:w-auto overflow-x-auto">
            {(['semua', 'pickup', 'delivery', 'selesai'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTaskFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black capitalize transition-all whitespace-nowrap cursor-pointer ${
                  selectedTaskFilter === tab
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab === 'semua' && 'Semua Tugas'}
                {tab === 'pickup' && '🔑 Penjemputan (Pickup)'}
                {tab === 'delivery' && '🚚 Pengantaran (Delivery)'}
                {tab === 'selesai' && '✅ Selesai'}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID pesanan, nama, no HP..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-800"
            />
          </div>
        </div>

        {/* Task Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
                <th className="py-3 px-4">ID Pesanan</th>
                <th className="py-3 px-4">Nama Customer</th>
                <th className="py-3 px-4">No. Telepon / WA</th>
                <th className="py-3 px-4">Alamat Penjemputan</th>
                <th className="py-3 px-4 text-center">Jenis Tugas</th>
                <th className="py-3 px-4">Jadwal Pickup</th>
                <th className="py-3 px-4 text-center">Status Kurir</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada tugas kurir yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((order) => {
                  const taskType = getTaskType(order);
                  const courierStatus = getDerivedCourierStatus(order);

                  return (
                    <tr key={order.order_id} className="hover:bg-slate-50/80 transition-colors">
                      {/* ID Pesanan */}
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-900">
                        {order.order_id}
                        {order.additional_service === 'ekspres' && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-800 font-black rounded text-[9px]">
                            ⚡ EX
                          </span>
                        )}
                      </td>

                      {/* Customer Name */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-800 block">{order.customer_name}</span>
                        <span className="text-[10px] text-slate-400">{order.main_service}</span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        <a 
                          href={`https://wa.me/${order.whatsapp.replace(/^0/, '62').replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="hover:text-emerald-600 transition-colors inline-flex items-center gap-1 font-mono text-[11px]"
                        >
                          <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                          {order.whatsapp}
                        </a>
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 max-w-xs text-slate-600 truncate" title={order.address}>
                        {order.address || 'Alamat belum diisi'}
                      </td>

                      {/* Task Type Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {taskType === 'Pickup' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-extrabold text-[10px]">
                            <ShoppingBag className="w-3 h-3 text-purple-600" />
                            Pickup
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold text-[10px]">
                            <Truck className="w-3 h-3 text-indigo-600" />
                            Delivery
                          </span>
                        )}
                      </td>

                      {/* Schedule */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="font-bold block text-[11px]">{order.pickup_date}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{order.pickup_time} WIB</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-extrabold text-[10px] uppercase ${
                          courierStatus === 'Berhasil Diantar' || courierStatus === 'Laundry Berhasil Dijemput'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : courierStatus === 'Kurir Menuju Lokasi' || courierStatus === 'Sedang Diantar'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {courierStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(order)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs hover:shadow transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Lihat Detail
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleOpenGoogleMaps(order)}
                            className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-xl transition-all cursor-pointer"
                            title="Buka Navigasi Google Maps"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Detail Tugas Modal */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full my-8 shadow-2xl border border-slate-100 overflow-hidden space-y-0 text-slate-800 animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1F1147] to-purple-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Truck className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base tracking-wide flex items-center gap-2">
                    Detail Tugas Kurir #{selectedOrderForDetail.order_id}
                  </h3>
                  <p className="text-xs text-purple-200">
                    Jadwal Penjemputan: {selectedOrderForDetail.pickup_date} @ {selectedOrderForDetail.pickup_time} WIB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">

              {/* Action Success Alert */}
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-extrabold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}

              {/* Top Quick Actions Banner */}
              <div className="bg-purple-50/80 border border-purple-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-black text-purple-600 tracking-wider">Status Tugas Saat Ini:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-purple-950">
                      {getDerivedCourierStatus(selectedOrderForDetail)}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      ({selectedOrderForDetail.order_status})
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Google Maps Nav Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenGoogleMaps(selectedOrderForDetail)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Buka Google Maps
                  </button>

                  {/* Contextual Courier Workflow Actions */}
                  {getDerivedCourierStatus(selectedOrderForDetail) === 'Menunggu Pickup' && (
                    <button
                      type="button"
                      onClick={handleKurirEnRoute}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Kurir Menuju Lokasi
                    </button>
                  )}

                  {['Menunggu Pickup', 'Kurir Menuju Lokasi'].includes(getDerivedCourierStatus(selectedOrderForDetail)) && (
                    <button
                      type="button"
                      onClick={handleConfirmPickupSuccess}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Pickup Berhasil
                    </button>
                  )}

                  {getDerivedCourierStatus(selectedOrderForDetail) === 'Menunggu Delivery' && (
                    <button
                      type="button"
                      onClick={handleStartDelivery}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Mulai Pengantaran
                    </button>
                  )}

                  {getDerivedCourierStatus(selectedOrderForDetail) === 'Sedang Diantar' && (
                    <button
                      type="button"
                      onClick={handleConfirmDeliverySuccess}
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      Pesanan Berhasil Diantar
                    </button>
                  )}
                </div>
              </div>

              {/* Grid 2 Columns: Info Customer & Info Pesanan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Info Customer */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                    <User className="w-4 h-4 text-purple-600" />
                    Informasi Customer
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Nama Lengkap</span>
                      <strong className="text-slate-800 text-sm">{selectedOrderForDetail.customer_name}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Nomor Telepon / WhatsApp</span>
                      <a 
                        href={`https://wa.me/${selectedOrderForDetail.whatsapp.replace(/^0/, '62').replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {selectedOrderForDetail.whatsapp}
                      </a>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Alamat Penjemputan</span>
                      <p className="text-slate-700 font-medium">{selectedOrderForDetail.address || 'Alamat tidak diisi'}</p>
                    </div>

                    {selectedOrderForDetail.coordinates && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Titik Koordinat Maps</span>
                        <p className="text-slate-600 font-mono text-[11px]">
                          Lat: {selectedOrderForDetail.coordinates[0]}, Lng: {selectedOrderForDetail.coordinates[1]}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Catatan Tambahan Customer</span>
                      <p className="text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200">
                        "{selectedOrderForDetail.notes || 'Tidak ada catatan.'}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Pesanan */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                    <ShoppingBag className="w-4 h-4 text-purple-600" />
                    Informasi Pesanan & Layanan
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Layanan Utama</span>
                        <strong className="text-purple-900 text-xs">{selectedOrderForDetail.main_service}</strong>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        selectedOrderForDetail.additional_service === 'ekspres' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {selectedOrderForDetail.additional_service === 'ekspres' ? '⚡ Ekspres' : 'Reguler'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Daftar Item Laundry</span>
                      <div className="bg-white rounded-xl p-2.5 border border-slate-200 space-y-1.5 max-h-36 overflow-y-auto">
                        {(selectedOrderForDetail.item_details || []).map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] pb-1 border-b border-slate-100 last:border-0">
                            <span className="font-bold text-slate-700">{item.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 font-mono">{item.qty} pcs</span>
                              <span className="font-extrabold text-slate-800">Rp {(item.itemSubtotal || item.price * item.qty).toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-slate-600">Total Harga Pesanan:</span>
                      <strong className="text-base font-black text-purple-900">
                        Rp {(selectedOrderForDetail.grand_total || 0).toLocaleString('id-ID')}
                      </strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* 4. Verifikasi Item Saat Pickup Component Integration */}
              <div className="space-y-2">
                <PickupVerificationSection 
                  order={selectedOrderForDetail} 
                  onUpdateOrder={(updated) => {
                    onUpdateOrder(updated);
                    setSelectedOrderForDetail(updated);
                  }} 
                />
              </div>

              {/* 6. Bukti Penjemputan / Delivery (Foto Dokumentasi) */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <Camera className="w-4 h-4 text-purple-600" />
                  Foto Bukti Penjemputan & Pengantaran
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Foto Laundry */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">1. Foto Laundry (Pickup)</span>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 bg-white text-center flex flex-col items-center justify-center min-h-[110px] relative overflow-hidden">
                      {pickupPhotoPreview ? (
                        <div className="relative w-full h-24">
                          <img src={pickupPhotoPreview} alt="Bukti Laundry" className="w-full h-full object-cover rounded-lg" />
                          <button 
                            type="button" 
                            onClick={() => setPickupPhotoPreview(null)}
                            className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full text-[10px]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-1 w-full h-full">
                          <Upload className="w-5 h-5 text-slate-400" />
                          <span className="text-[10px] font-bold text-purple-600">Upload Foto Laundry</span>
                          <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'pickup')} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Foto Lokasi */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">2. Foto Lokasi (Opsional)</span>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 bg-white text-center flex flex-col items-center justify-center min-h-[110px] relative overflow-hidden">
                      {locationPhotoPreview ? (
                        <div className="relative w-full h-24">
                          <img src={locationPhotoPreview} alt="Bukti Lokasi" className="w-full h-full object-cover rounded-lg" />
                          <button 
                            type="button" 
                            onClick={() => setLocationPhotoPreview(null)}
                            className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full text-[10px]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-1 w-full h-full">
                          <Upload className="w-5 h-5 text-slate-400" />
                          <span className="text-[10px] font-bold text-purple-600">Upload Foto Lokasi</span>
                          <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'location')} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Foto Serah Terima Delivery */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">3. Foto Serah Terima (Delivery)</span>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 bg-white text-center flex flex-col items-center justify-center min-h-[110px] relative overflow-hidden">
                      {deliveryPhotoPreview ? (
                        <div className="relative w-full h-24">
                          <img src={deliveryPhotoPreview} alt="Bukti Serah Terima" className="w-full h-full object-cover rounded-lg" />
                          <button 
                            type="button" 
                            onClick={() => setDeliveryPhotoPreview(null)}
                            className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full text-[10px]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-1 w-full h-full">
                          <Upload className="w-5 h-5 text-slate-400" />
                          <span className="text-[10px] font-bold text-purple-600">Upload Foto Serah Terima</span>
                          <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'delivery')} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamp Tracking Summary */}
              <div className="bg-slate-100 p-3.5 rounded-2xl text-[11px] font-semibold text-slate-600 flex flex-wrap gap-4 justify-between border border-slate-200">
                <div>
                  <span>Waktu Pickup:</span>{' '}
                  <strong className="text-slate-800">{selectedOrderForDetail.pickup_completed_at || 'Belum dijemput'}</strong>
                </div>
                <div>
                  <span>Waktu Mulai Delivery:</span>{' '}
                  <strong className="text-slate-800">{selectedOrderForDetail.delivery_started_at || 'Belum diantar'}</strong>
                </div>
                <div>
                  <span>Waktu Selesai Delivery:</span>{' '}
                  <strong className="text-slate-800">{selectedOrderForDetail.delivery_completed_at || 'Belum selesai'}</strong>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
