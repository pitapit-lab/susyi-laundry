import React, { useState, useEffect } from 'react';
import { ClipboardCheck, CheckCircle2, AlertTriangle, RefreshCw, Save, History, Plus, Minus, ShieldCheck, User } from 'lucide-react';
import { Order, OrderItem, PickupVerification, VerificationHistory } from '../types';

interface PickupVerificationSectionProps {
  order: Order;
  onUpdateOrder: (updatedOrder: Order) => void;
}

export default function PickupVerificationSection({ order, onUpdateOrder }: PickupVerificationSectionProps) {
  // Local state for actual quantities per item
  const [itemActualQtys, setItemActualQtys] = useState<number[]>(() => {
    return (order.item_details || []).map(item => item.actualQty ?? item.qty ?? 0);
  });

  const [verifiedBy, setVerifiedBy] = useState<string>(order.pickup_verification?.verified_by || 'Kurir / Admin Laundry');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when order prop changes externally
  useEffect(() => {
    setItemActualQtys((order.item_details || []).map(item => item.actualQty ?? item.qty ?? 0));
    if (order.pickup_verification?.verified_by) {
      setVerifiedBy(order.pickup_verification.verified_by);
    }
  }, [order]);

  const items = order.item_details || [];

  // Helper to change quantity
  const handleQtyChange = (index: number, newQty: number) => {
    if (isNaN(newQty) || newQty < 0) return;
    const updated = [...itemActualQtys];
    updated[index] = newQty;
    setItemActualQtys(updated);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Recalculate prices live
  const recalculatedSubtotal = items.reduce((acc, item, idx) => {
    const qty = itemActualQtys[idx] ?? item.qty ?? 0;
    return acc + (qty * (item.price || 0));
  }, 0);

  const recalculatedGrandTotal = recalculatedSubtotal + (order.additional_fee || 0);

  // Check if all items match customer input
  const allMatch = items.every((item, idx) => {
    const customerQty = item.customerQty ?? item.qty;
    const actualQty = itemActualQtys[idx] ?? 0;
    return customerQty === actualQty;
  });

  const isVerified = order.pickup_verification?.is_verified ?? false;

  const handleSaveVerification = () => {
    // Validation
    for (let i = 0; i < itemActualQtys.length; i++) {
      if (itemActualQtys[i] === undefined || itemActualQtys[i] === null || isNaN(itemActualQtys[i]) || itemActualQtys[i] < 0) {
        setErrorMsg('Semua item wajib memiliki jumlah aktual berupa angka valid (0 atau lebih).');
        return;
      }
    }

    setIsSaving(true);
    setErrorMsg(null);

    const timestampStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const updatedItemDetails: OrderItem[] = items.map((item, idx) => {
      const cQty = item.customerQty ?? item.qty;
      const aQty = itemActualQtys[idx];
      const status: 'Sesuai' | 'Tidak Sesuai' = aQty === cQty ? 'Sesuai' : 'Tidak Sesuai';

      return {
        ...item,
        customerQty: cQty,
        actualQty: aQty,
        qty: aQty, // actual quantity becomes final quantity used by system
        verificationStatus: status,
        itemSubtotal: aQty * (item.price || 0)
      };
    });

    const changeLogs = updatedItemDetails.map((item) => ({
      timestamp: timestampStr,
      item_name: item.name,
      customer_qty: item.customerQty!,
      actual_qty: item.actualQty!,
      status: item.verificationStatus!,
      price: item.price
    }));

    const newHistoryEntry: VerificationHistory = {
      timestamp: timestampStr,
      verified_by: verifiedBy.trim() || 'Kurir / Admin Laundry',
      changes: changeLogs,
      grand_total_before: order.grand_total,
      grand_total_after: recalculatedGrandTotal,
      summary_status: allMatch ? 'Sesuai' : 'Ada Ketidaksesuaian'
    };

    const currentHistory = order.pickup_verification?.history || [];

    const newVerification: PickupVerification = {
      is_verified: true,
      verified_at: timestampStr,
      verified_by: verifiedBy.trim() || 'Kurir / Admin Laundry',
      status_summary: allMatch ? 'Sesuai' : 'Ada Ketidaksesuaian',
      history: [newHistoryEntry, ...currentHistory]
    };

    const updatedOrder: Order = {
      ...order,
      item_details: updatedItemDetails,
      subtotal: recalculatedSubtotal,
      grand_total: recalculatedGrandTotal,
      pickup_verification: newVerification,
      updated_at: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    setTimeout(() => {
      onUpdateOrder(updatedOrder);
      setIsSaving(false);
      setSuccessMsg('Verifikasi penjemputan item berhasil disimpan!');
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 250);
  };

  return (
    <div className="mt-5 bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50 border border-purple-150/70 rounded-2xl p-4 sm:p-5 text-xs font-sans space-y-4 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs shrink-0">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm tracking-wide flex items-center gap-2">
              Verifikasi Item Saat Penjemputan
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Verifikasi kesesuaian jumlah item fisik laundry saat penjemputan oleh kurir / admin.
            </p>
          </div>
        </div>

        {/* Overall Status Badge */}
        <div className="shrink-0 flex items-center gap-2">
          {!isVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-[10px] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Belum Diverifikasi
            </span>
          ) : order.pickup_verification?.status_summary === 'Sesuai' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[10px] uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Terverifikasi (Sesuai)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold text-[10px] uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-indigo-600" />
              Terverifikasi (Ada Penyesuaian)
            </span>
          )}
        </div>
      </div>

      {/* Item Details Verification Table */}
      {items.length === 0 ? (
        <div className="p-4 bg-white rounded-xl text-center text-slate-400 italic">
          Tidak ada rincian item pada pesanan ini.
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] uppercase tracking-wider font-extrabold text-slate-600">
                  <th className="py-2.5 px-3">Nama Item</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Customer</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Aktual (Pemeriksaan)</th>
                  <th className="py-2.5 px-3 text-center">Status Verifikasi</th>
                  <th className="py-2.5 px-3 text-right">Subtotal Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {items.map((item, idx) => {
                  const customerQty = item.customerQty ?? item.qty;
                  const actualQty = itemActualQtys[idx] ?? 0;
                  const isMatch = actualQty === customerQty;
                  const itemSubtotal = actualQty * (item.price || 0);

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      {/* Item Name & Price */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Rp {(item.price || 0).toLocaleString('id-ID')} / pcs
                        </span>
                      </td>

                      {/* Customer Input Quantity */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 font-extrabold rounded-lg text-xs border border-slate-200">
                          {customerQty} pcs
                        </span>
                      </td>

                      {/* Actual Quantity Counter Input */}
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(idx, actualQty - 1)}
                            disabled={actualQty <= 0}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-700 flex items-center justify-center font-bold transition-all cursor-pointer"
                            title="Kurangi"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={actualQty}
                            onChange={(e) => handleQtyChange(idx, parseInt(e.target.value, 10) || 0)}
                            className={`w-14 py-1 text-center font-extrabold text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all ${
                              !isMatch 
                                ? 'bg-amber-50 text-amber-900 border-amber-300 font-black' 
                                : 'bg-slate-50 text-slate-800 border-slate-300'
                            }`}
                          />

                          <button
                            type="button"
                            onClick={() => handleQtyChange(idx, actualQty + 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 flex items-center justify-center font-bold transition-all cursor-pointer"
                            title="Tambah"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Verification Status Badge */}
                      <td className="py-3 px-3 text-center">
                        {isMatch ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Sesuai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[10px] animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Tidak Sesuai
                          </span>
                        )}
                      </td>

                      {/* Final Subtotal */}
                      <td className="py-3 px-3 text-right font-extrabold text-slate-800">
                        Rp {itemSubtotal.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Real-time Recalculation Preview Banner */}
      <div className="bg-white border border-purple-100 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-slate-600 text-[11px] w-full md:w-auto">
          <div className="flex items-center gap-3">
            <span>Subtotal Item Awal:</span>
            <span className="font-semibold text-slate-500 line-through">
              Rp {(order.subtotal || 0).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>Subtotal Hasil Verifikasi:</span>
            <span className="font-bold text-slate-800">
              Rp {recalculatedSubtotal.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>Biaya Tambahan:</span>
            <span className="font-semibold text-amber-600">
              + Rp {(order.additional_fee || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-purple-50/80 p-3 rounded-xl border border-purple-100 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <span className="text-[10px] uppercase font-extrabold text-purple-700 block tracking-wider">
              Total Bayar Baru
            </span>
            <span className="text-base font-black text-purple-900">
              Rp {recalculatedGrandTotal.toLocaleString('id-ID')}
            </span>
          </div>

          {order.grand_total !== recalculatedGrandTotal && (
            <div className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
              Selisih: {recalculatedGrandTotal - order.grand_total > 0 ? '+' : ''}
              Rp {(recalculatedGrandTotal - order.grand_total).toLocaleString('id-ID')}
            </div>
          )}
        </div>
      </div>

      {/* Verification Action Bar & Inspector Name */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[10px] font-bold text-slate-500 shrink-0">Pemeriksa:</span>
          <input
            type="text"
            value={verifiedBy}
            onChange={(e) => setVerifiedBy(e.target.value)}
            placeholder="Nama Kurir / Admin"
            className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none w-36 sm:w-44"
          />
        </div>

        <div className="flex items-center gap-2">
          {(order.pickup_verification?.history || []).length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-purple-600" />
              {showHistory ? 'Sembunyikan Riwayat' : `Riwayat (${(order.pickup_verification?.history || []).length})`}
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveVerification}
            disabled={isSaving}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Simpan Verifikasi
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success and Error Feedback Messages */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold text-xs flex items-center gap-2 animate-shake">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-extrabold text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Riwayat Perubahan (Audit Log History) */}
      {showHistory && (order.pickup_verification?.history || []).length > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-100 space-y-3 animate-fade-in">
          <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
            <History className="w-3.5 h-3.5 text-purple-600" />
            Riwayat Koreksi & Verifikasi Penjemputan
          </h5>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {(order.pickup_verification?.history || []).map((hist, hIdx) => (
              <div key={hIdx} className="bg-white border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[11px]">
                  <span className="font-extrabold text-purple-900">
                    🕒 {hist.timestamp}
                  </span>
                  <span className="text-slate-500 font-medium">
                    Pemeriksa: <strong>{hist.verified_by || 'Kurir/Admin'}</strong>
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  {hist.changes.map((ch, cIdx) => (
                    <div key={cIdx} className="flex justify-between items-center py-0.5 border-b border-dashed border-slate-100 last:border-0">
                      <span className="font-bold text-slate-700">{ch.item_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Customer: {ch.customer_qty} pcs</span>
                        <span className="text-slate-400">➔</span>
                        <span className="font-extrabold text-slate-800">Aktual: {ch.actual_qty} pcs</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                          ch.status === 'Sesuai' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {ch.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1.5 flex justify-between items-center text-[11px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg">
                  <span>Perubahan Total Harga:</span>
                  <span>
                    Rp {hist.grand_total_before.toLocaleString('id-ID')} ➔ <strong className="text-purple-700">Rp {hist.grand_total_after.toLocaleString('id-ID')}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
