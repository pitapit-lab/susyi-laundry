import { useState, useEffect } from 'react';
import { Menu, X, Sparkles, LogIn, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer } from '../types';
import { WebInfo } from '../utils/database';

interface HeaderProps {
  onOpenBooking: () => void;
  customer: Customer | null;
  onOpenLogin: () => void;
  onOpenDashboard: () => void;
  webInfo?: WebInfo;
}

export default function Header({ onOpenBooking, customer, onOpenLogin, onOpenDashboard, webInfo }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      const sections = ['home', 'cekrute', 'layanan-harga', 'pesan-form', 'testimoni', 'kontak'];
      const scrollPosition = window.scrollY + 120;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { id: 'home', label: 'Beranda' },
    { id: 'cekrute', label: 'Cek Rute' },
    { id: 'layanan-harga', label: 'Layanan & Harga' },
    { id: 'pesan-form', label: 'Pesan' },
    { id: 'kontak', label: 'Kontak' },
  ];

  const handleScrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of sticking navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header
      id="app-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/70 backdrop-blur-md shadow-sm border-b border-purple-100/40 py-2.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Elegant Flower Logo with "Laundry" */}
        <div
          onClick={() => handleScrollTo('home')}
          className="flex items-center gap-3 cursor-pointer group"
          id="brand-logo"
        >
          <div className="relative flex items-center justify-center">
            {/* Elegant Hand-drawn SVG flower shape as logo */}
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="transform group-hover:rotate-12 transition-transform duration-500"
            >
              <path
                d="M18 4C18 4 11 11 11 16.5C11 21.5 14 24.5 18 24.5C22 24.5 25 21.5 25 16.5C25 11 18 4 18 4Z"
                fill="#E5DBFF"
                stroke="#7048E8"
                strokeWidth="1.5"
              />
              <path
                d="M18 4C18 4 25 11 25 16.5C25 21.5 22 24.5 18 24.5Z"
                fill="#D0BFFF"
                opacity="0.8"
              />
              {/* Golden Leaf Accents */}
              <path
                d="M18 16.5C18 16.5 13 18.5 12 21.5C15 21.5 17.5 19 18 16.5Z"
                fill="#D4AF37"
              />
              <path
                d="M18 16.5C18 16.5 23 18.5 24 21.5C21 21.5 18.5 19 18 16.5Z"
                fill="#B78A62"
              />
              {/* Center pistil */}
              <circle cx="18" cy="16.5" r="2.5" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="1" />
            </svg>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-1 -right-1 text-gold-accent"
            >
              <Sparkles className="w-3 h-3" />
            </motion.div>
          </div>
          <div>
            <span className="font-display text-xl tracking-wide font-semibold text-slate-aesthetic group-hover:text-purple-900 transition-colors">
              Susyi
            </span>
            <span className="font-sans text-xs uppercase block tracking-[0.25em] text-gold-rose font-medium leading-3">
              L a u n d r y
            </span>
          </div>
        </div>

        {/* Desktop Navbar Links */}
        <nav className="hidden md:flex items-center gap-8">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleScrollTo(item.id)}
              className={`relative font-sans text-sm font-medium tracking-wide transition-colors py-1 ${
                activeSection === item.id
                  ? 'text-purple-800'
                  : 'text-slate-500 hover:text-purple-700'
              }`}
            >
              {item.label}
              {activeSection === item.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-1 right-1 h-0.5 bg-gradient-to-r from-purple-500 to-gold-rose rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={onOpenBooking}
            className="relative overflow-hidden group cursor-pointer px-5 py-2.5 rounded-full font-serif text-xs font-medium tracking-wide border border-gold-rose/40 bg-white hover:bg-gold-light text-slate-aesthetic shadow-sm hover:shadow-md transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-1 text-gold-rose">
              <Sparkles className="w-3.5 h-3.5 stroke-[1.5]" />
              Pesan Antar-Jemput
            </span>
            <span className="absolute inset-0 bg-gold-rose/5 transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
          </button>

          {customer ? (
            /* Logged-in Lounge Button */
            <button
              onClick={onOpenDashboard}
              className="flex items-center gap-2 px-3.5 py-2 border border-purple-100 bg-[#fbf6fc]/80 hover:bg-purple-100/40 rounded-full font-sans text-xs font-semibold text-purple-700 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-serif text-[10px] font-bold flex items-center justify-center">
                {customer.role === 'admin' ? '🛡️' : ((customer.name || '').substring(0, 2).replace('K', '').replace('a', '').trim() || 'C')}
              </div>
              <span className="max-w-[130px] truncate">
                {customer.role === 'admin' ? 'dasboard admin' : (customer.name || '').replace('Kak ', '')}
              </span>
            </button>
          ) : (
            /* Login Entry Button */
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-sans text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              Masuk
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center gap-3">
          {customer && (
            <button
              onClick={onOpenDashboard}
              className="w-8 h-8 rounded-full bg-purple-600 text-white font-serif text-[11px] font-semibold flex items-center justify-center border border-white shadow-xs"
            >
              {customer.role === 'admin' ? '🛡️' : ((customer.name || '').substring(0, 2).replace('K', '').replace('a', '').trim() || 'C')}
            </button>
          )}
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 hover:bg-purple-50/50 rounded-full transition-colors text-slate-aesthetic"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Slider Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 top-[60px] bg-slate-900/60 z-40"
            />

            {/* Cabinet */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed right-0 left-0 top-[61px] bg-white/95 backdrop-blur-md border-b border-purple-100 p-6 z-40 flex flex-col gap-4 shadow-lg rounded-b-3xl"
            >
              <div className="flex flex-col gap-3">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleScrollTo(item.id)}
                    className={`w-full py-2.5 px-4 rounded-xl text-left font-sans text-base transition-colors ${
                      activeSection === item.id
                        ? 'bg-purple-50/70 text-purple-800 font-medium'
                        : 'text-slate-600 hover:bg-purple-50/30'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="border-t border-purple-50 pt-4 flex flex-col gap-3">
                {customer ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenDashboard();
                    }}
                    className="w-full text-center py-3 px-5 rounded-2xl bg-[#fbf6fc]/85 border border-purple-150 text-purple-800 font-semibold text-sm shadow-xs flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4 shrink-0 text-purple-600" />
                    {customer.role === 'admin' ? '🛡️ Administrator (Full Access)' : `Susyi Member: ${customer.name || 'Pelanggan'}`}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenLogin();
                    }}
                    className="w-full text-center py-3 px-5 rounded-2xl bg-purple-600 text-white font-medium text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4 shrink-0" />
                    Masuk Ke Akun
                  </button>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBooking();
                  }}
                  className="w-full text-center py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm shadow-md hover:shadow-lg transition-transform focus:scale-[0.98]"
                >
                  Pesan Antar-Jemput
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
