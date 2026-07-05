import { useState, useEffect, FormEvent } from 'react';
import { X, Calendar, MapPin, Phone, User, Clipboard, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BookingDetails, Customer } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  initialData?: {
    serviceType?: string;
    weight?: number;
    notes?: string;
  };
}

export default function BookingModal({ isOpen, onClose, customer, initialData }: BookingModalProps) {
  const [formData, setFormData] = useState<BookingDetails>({
    customerName: '',
    phone: '',
    address: '',
    serviceType: 'Cuci Kering Premium',
    pickupDate: '',
    notes: ''
  });

  const [bookingStep, setBookingStep] = useState<'details' | 'success'>('details');
  const [invoiceId, setInvoiceId] = useState('');
  const [error, setError] = useState('');

  // Sync details from home/calculator values when preset triggers occur
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        serviceType: initialData.serviceType || prev.serviceType,
        notes: initialData.notes || prev.notes
      }));
    }
  }, [initialData, isOpen]);

  // Handle setting default scheduling date & prefilling customer data if logged in
  useEffect(() => {
    if (isOpen) {
      setBookingStep('details');
      setError('');
      // Set default tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      setFormData(prev => ({
        ...prev,
        pickupDate: `${year}-${month}-${day}`,
        customerName: customer ? customer.name : prev.customerName || '',
        phone: customer ? customer.phone : prev.phone || '',
        address: customer ? customer.address : prev.address || '',
      }));
    }
  }, [isOpen, customer]);

  const handleBookingSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phone || !formData.address) return;

    const pickupDate = new Date(formData.pickupDate);
    pickupDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (pickupDate < today) {
      setError("Tanggal penjemputan tidak boleh sebelum hari ini.");
      return;
    }

    setError('');
    // Generate random invoice ID like LVD-4927
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setInvoiceId(`LVD-${randomNum}`);
    setBookingStep('success');
  };

  const getWhatsAppLink = () => {
    const text = `Halo Susyi Laundry! ✨
Saya ingin menjadwalkan layanan Antar-Jemput:

*Nomor Transaksi:* #${invoiceId}
*Nama:* ${formData.customerName}
*WhatsApp:* ${formData.phone}
*Alamat Jam Jemput:* ${formData.address}
*Paket Layanan:* ${formData.serviceType}
*Rencana Jemput:* ${formData.pickupDate}
*Catatan:* ${formData.notes || '-'}

Mohon konfirmasi kurir penjemputan ya CS Susyi Laundry. Terima kasih! 🌸`;

    return `https://wa.me/6281231009060?text=${encodeURIComponent(text)}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative bg-white/95 backdrop-blur-md rounded-3xl border border-purple-100 shadow-2xl p-6 md:p-8 max-w-lg w-full z-10 overflow-y-auto max-h-[90vh]"
          >
            {/* Close Circle Handle */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-purple-100/60 text-slate-400 hover:text-purple-750 rounded-full transition-colors transition-transform focus:scale-[0.9] cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {bookingStep === 'details' ? (
              <form onSubmit={handleBookingSubmit} className="space-y-5">
                
                {/* Header title */}
                <div className="pr-8">
                  <div className="flex items-center gap-2 text-[#B78A62] mb-1.5">
                    <Sparkles className="w-5 h-5 fill-amber-50 stroke-[#B78A62]" />
                    <span className="font-sans text-xs font-semibold uppercase tracking-widest leading-3">
                      Layanan Antar-Jemput
                    </span>
                  </div>
                  <h3 className="font-display text-2xl text-slate-aesthetic font-semibold">
                    Jadwalkan Penjemputan
                  </h3>
                </div>

                {/* Name & Phone fields */}
                <div className="space-y-4">
                  <div>
                    <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Nama Penerima / Pemesan
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-350 pointer-events-none">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        placeholder="e.g. Kak Wulan Kirana"
                        className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Nomor WhatsApp Aktif
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-350 pointer-events-none">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. 0812XXXXXXXX"
                        className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  {/* Pick up Address */}
                  <div>
                    <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Alamat Penjemputan & Pengantaran
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-slate-350 pointer-events-none">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <textarea
                        required
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Tulis alamat rumah, apartemen, atau nomor suite hotel Anda dengan lengkap..."
                        className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-300 resize-none"
                      />
                    </div>
                  </div>

                  {/* Service selections and weight slider */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Jenis Layanan
                      </label>
                      <select
                        value={formData.serviceType}
                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                        className="w-full px-3.5 py-3 text-xs rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:outline-none text-slate-650"
                      >
                        <option>Cuci Kering Premium</option>
                        <option>Setrika Uap Presisi</option>
                        <option>Laundry Kilat 6 Jam</option>
                        <option>Paket Langganan</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Tanggal Penjemputan
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-350 pointer-events-none">
                          <Calendar className="w-4 h-4" />
                        </span>
                        <input
                          type="date"
                          required
                          value={formData.pickupDate}
                          onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 text-xs rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none text-slate-650"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Catatan Serat Khusus (Opsional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-slate-350 pointer-events-none">
                        <Clipboard className="w-4 h-4" />
                      </span>
                      <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="e.g. Jas wol mohon menggunakan hanger khusus, sprei lavender harum pekat."
                        className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-300 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-sans">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit scheduling button */}
                <button
                  type="submit"
                  className="w-full mt-6 py-4 bg-[#B78A62] hover:bg-[#976A42] text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-md shadow-amber-900/10 text-center"
                >
                  Konfirmasi Jadwal Penjemputan
                </button>
              </form>
            ) : (
              /* Success billing screen */
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 pt-3"
              >
                {/* Circular receipt icon */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-indigo-50 text-purple-700 border border-purple-100">
                    <CheckCircle className="w-12 h-12 stroke-[1.2]" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl text-slate-aesthetic font-bold">
                      Jadwal Tersimpan Indah!
                    </h3>
                    <p className="font-sans text-xs text-slate-400 mt-1 max-w-sm">
                      Pesanan kurir Anda terdaftar di Susyi Laundry.
                    </p>
                  </div>
                </div>

                {/* Simulated Invoice Slip */}
                <div className="p-5.5 rounded-2xl bg-slate-50/50 border border-dashed border-purple-200/80 space-y-4 font-sans text-xs text-slate-aesthetic relative">
                  <div className="absolute top-4 right-4 font-mono font-bold text-xs text-purple-700 select-all">
                    #{invoiceId}
                  </div>
                  
                  <div className="space-y-2 border-b border-purple-100 pb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Penerima:</span>
                      <span className="font-medium">{formData.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">WhatsApp:</span>
                      <span className="font-medium">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Paket:</span>
                      <span className="font-medium text-purple-700">{formData.serviceType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jadwal Jemput:</span>
                      <span className="font-medium">{formData.pickupDate}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-slate-450 font-sans text-[11px] leading-relaxed pt-1">
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Arahan Persiapan:</strong> Mohon kelompokkan kain rentan luntur secara terpisah agar mempermudah kerja kurir pencatat. CS akan memverifikasi penjemputan via telefon.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Final redirection link button */}
                <div className="pt-2">
                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 text-center"
                  >
                    Kirim Konfirmasi ke WhatsApp CS
                  </a>
                  <p className="font-sans text-[10px] text-slate-400 text-center mt-2.5">
                    Klik di atas untuk mengirim salinan pesanan instan ke sistem CS kami.
                  </p>
                </div>
              </motion.div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
