import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Clock, Instagram, Send, CheckCircle, Smile } from 'lucide-react';
import { GoldSparkle } from './Decorations';
import { WebInfo } from '../utils/database';

interface KontakProps {
  webInfo?: WebInfo;
}

export default function Kontak({ webInfo }: KontakProps) {
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isOpenNow, setIsOpenNow] = useState(true);
  const [currentStatusText, setCurrentStatusText] = useState('Buka Sekarang');

  const adminPhone = webInfo ? webInfo.adminWhatsapp : '0812-3100-9060';
  const displayPhone = adminPhone.startsWith('+62') || adminPhone.startsWith('08') 
    ? adminPhone 
    : `+62 ${adminPhone}`;
  const whatsappUrl = `https://wa.me/${adminPhone.replace(/[^0-9]/g, '')}`;

  const defaultHours = ['Senin - Minggu: 08.00 - 20.00 WIB'];
  const operationalHours = webInfo?.operationalHours || defaultHours;

  // Calculate laundry boutique live open/close status
  useEffect(() => {
    const checkIfOpen = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour >= 8 && hour < 20) {
        setIsOpenNow(true);
        setCurrentStatusText('Buka • Tutup pukul 20.00');
      } else {
        setIsOpenNow(false);
        setCurrentStatusText('Tutup • Buka esok pukul 08.00');
      }
    };

    checkIfOpen();
    const interval = setInterval(checkIfOpen, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    // Simulate messaging success and close after 4 seconds
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', phone: '', message: '' });
    }, 4000);
  };

  const menuItems = [
    { id: 'home', label: 'Beranda' },
    { id: 'cekrute', label: 'Cek Rute' },
    { id: 'layanan', label: 'Layanan' },
    { id: 'harga', label: 'Harga' },
    { id: 'pesan-form', label: 'Pesan' },
    { id: 'kontak', label: 'Kontak' },
  ];

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      window.scrollTo({
        top: elementRect - bodyRect - offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="kontak" className="relative bg-gradient-to-b from-white via-purple-50/50 to-purple-100/40 overflow-hidden">
      <GoldSparkle className="top-[8%] left-[15%]" delay={0.6} />

      {/* Main contact panel */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-16 relative z-10 border-b border-purple-100/50">
        
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <p className="font-sans text-xs font-semibold tracking-[0.2em] uppercase text-gold-rose mb-3">
            Hubungi Kami
          </p>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight text-slate-aesthetic font-semibold">
            Bicara Dengan Kami
          </h2>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Left Block: Contact coordinates (cols 5) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-8">
            <div className="space-y-6">
              <h3 className="font-display text-2xl text-slate-aesthetic font-bold mb-2">
                Susyi Laundry
              </h3>
              <p className="font-sans text-sm text-slate-400 leading-relaxed">
                Butuh layanan cuci komplit, cuci kering, setrika saja atau yang bisa 1 hari selesai? janganragu mngerim pesan Whatsaap atau tanya dengan admin kami.
              </p>

              {/* Live Status Open indicator */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white border border-purple-100 shadow-sm">
                <span className={`relative flex h-2.5 w-2.5`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOpenNow ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOpenNow ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                </span>
                <span className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-aesthetic">
                  {currentStatusText}
                </span>
              </div>
            </div>

            {/* Coordinates detail blocks */}
            <div className="space-y-6">
              
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-white border border-purple-100 text-purple-700 shadow-sm shrink-0">
                  <MapPin className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">
                    Butik Utama Alamat
                  </h4>
                  <p className="font-sans text-sm font-medium text-slate-aesthetic leading-relaxed">
                    Turirejo Rt/Rw 03, RT./Rw 03/RW.08, Candi, Cangkringmalang, Kec. Beji, Pasuruan, Jawa Timur 67154
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-white border border-purple-100 text-purple-700 shadow-sm shrink-0">
                  <Phone className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">
                    WhatsApp Hotline
                  </h4>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-sans text-sm font-semibold text-purple-700 hover:underline leading-relaxed block"
                  >
                    {displayPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-white border border-purple-100 text-purple-700 shadow-sm shrink-0">
                  <Clock className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">
                    Jam Operasional
                  </h4>
                  <div className="space-y-1">
                    {operationalHours.map((hourText, idx) => (
                      <p key={idx} className="font-sans text-xs font-medium text-slate-aesthetic/90">
                        {hourText}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Block: Minimalist Form Card (cols 7) */}
          <div className="lg:col-span-7 bg-white/70 backdrop-blur-md p-6 md:p-10 rounded-3xl border border-purple-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] relative">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form
                  key="contact-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <h3 className="font-display text-xl text-slate-aesthetic font-semibold mb-4">
                    Kirim Pesan Cepat
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Amanda Kirana"
                        className="w-full px-4 py-3 text-sm rounded-2xl bg-white border border-purple-100/80 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>

                    <div>
                      <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                        Nomor WhatsApp / Telp
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. 081234567890"
                        className="w-full px-4 py-3 text-sm rounded-2xl bg-white border border-purple-100/80 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                      Pesan atau Pertanyaan Anda
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="e.g. Apakah bisa menjemput gaun malam berbahan sutra hari ini?"
                      className="w-full px-4 py-3 text-sm rounded-2xl bg-white border border-purple-100/80 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-300 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-md shadow-purple-900/10"
                  >
                    Kirim Pesan
                    <Send className="w-4 h-4" />
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success-screen"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center py-12 space-y-6"
                >
                  <div className="p-4 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100">
                    <CheckCircle className="w-12 h-12 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl text-slate-aesthetic font-semibold mb-2">
                      Pesan Terkirim Indah!
                    </h3>
                    <p className="font-sans text-sm text-slate-450 leading-relaxed max-w-sm">
                      Terima kasih Kak <strong>{formData.name}</strong>, CS kami akan segera menghubungi nomor <strong>{formData.phone}</strong> Anda dalam 10 menit lewat WhatsApp.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gold-rose font-medium">
                    <Smile className="w-4 h-4" />
                    <span>Warna Lavender, Wangi Segar Alami</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Sub Footer - Branding, copyright & quick Navigation */}
      <footer className="max-w-7xl mx-auto px-6 md:px-12 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        
        {/* Brand identity */}
         <div className="text-center sm:text-left">
          <p className="font-display text-sm font-semibold text-slate-aesthetic">
            © 2026 Susyi Laundry - take care with ❤️
          </p>
          <p className="font-sans text-[11px] text-slate-400 mt-0.5">
            Bersih, Rapi, dan Wangi
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleScrollTo(item.id)}
              className="font-sans text-xs text-slate-500 hover:text-purple-700 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Social channels */}
        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/6281231009060"
            target="_blank"
            rel="noreferrer"
            className="h-10 px-4.5 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-all font-sans text-xs font-semibold gap-1.5 active:scale-95"
            aria-label="WhatsApp Hotline"
          >
            <Phone className="w-3.5 h-3.5 text-purple-100" />
            <span>WhatsApp</span>
          </a>
        </div>

      </footer>
    </section>
  );
}
