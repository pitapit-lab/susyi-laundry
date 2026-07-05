import { useState, FormEvent } from 'react';
import { Mail, Lock, Sparkles, LogIn, ArrowLeft, Info, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { Customer } from '../types';
import { auth, getReadableAuthError } from '../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getUserFromFirestore, saveUserToFirestore, normalizeEmailForAuth } from '../utils/firebaseSync';

interface AdminLoginProps {
  onLoginSuccess: (customer: Customer) => void;
  onGoHome: () => void;
}

export default function AdminLogin({ onLoginSuccess, onGoHome }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoAdminLogin = async () => {
    setError('');
    setIsLoading(true);
    const targetEmail = 'admin@laundry';
    const targetPassword = 'baksourat999';
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizeEmailForAuth(targetEmail), targetPassword);
      const user = userCredential.user;
      let profile = await getUserFromFirestore(user.uid);
      if (!profile) {
        profile = {
          name: 'Administrator',
          phone: '',
          email: targetEmail,
          address: '',
          points: 0,
          role: 'admin',
          orders: [],
          avatar: '',
          google_linked: false,
          status: 'aktif'
        };
        await saveUserToFirestore(user.uid, profile, 'Email');
      }

      onLoginSuccess(profile);
    } catch (err: any) {
      console.error('Demo Admin Auth Error:', err);
      setError('Gagal masuk sebagai Admin Demo: ' + getReadableAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setError('Mohon lengkapi email dan password administrator.');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizeEmailForAuth(cleanEmail), cleanPassword);
      const user = userCredential.user;
      const profile = await getUserFromFirestore(user.uid);
      
      if (!profile || profile.role !== 'admin') {
        setError('Akses Ditolak: Akun ini tidak terdaftar sebagai Administrator.');
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      onLoginSuccess(profile);
    } catch (err: any) {
      console.error('Admin Login Error:', err);
      setError('Gagal masuk sebagai Admin: ' + getReadableAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#FAF8FF] to-[#F1EAFF] flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Decorative floral and glow items */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/45 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Back to Home action */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-purple-800 border border-purple-100 shadow-xs transition-all text-xs font-semibold cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </button>
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl border border-purple-200/50 shadow-[0_20px_50px_rgba(112,72,232,0.12)] p-8 relative z-10 overflow-hidden"
      >
        {/* Aesthetic background mesh */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-100/50 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-6">
          {/* Header Title */}
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4 relative">
              <ShieldAlert className="w-6 h-6" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-1 -right-1 text-amber-400"
              >
                <Sparkles className="w-4 h-4 fill-amber-400" />
              </motion.div>
            </div>
            
            <h1 className="font-display text-2xl font-bold text-slate-800 tracking-tight">
              Control Panel Login
            </h1>
            <p className="font-sans text-xs text-slate-500 mt-2 max-w-[280px] leading-relaxed">
              Area terbatas khusus Administrator Susyi Laundry. Silakan masukkan kredensial admin Anda.
            </p>
          </div>

          {/* Quick Access Demo Badge */}
          <div className="bg-amber-50/80 border border-amber-200/50 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-amber-900 font-extrabold uppercase tracking-wider block">
                Akses Pengujian Cepat
              </span>
            </div>
            <p className="font-sans text-[10px] text-amber-800 leading-relaxed">
              Klik tombol di bawah untuk masuk secara instan ke dalam Dashboard Admin dengan status Administrator penuh.
            </p>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleDemoAdminLogin}
              className="w-full py-2.5 px-4 bg-white hover:bg-amber-100/20 text-amber-800 border border-amber-200 hover:border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4 text-amber-600" />
              {isLoading ? 'Sedang Memproses...' : 'Masuk Instan Demo Admin'}
            </button>
          </div>

          {/* Main Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-start gap-2 animate-in fade-in duration-200">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Email Administrator
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@laundry"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-350 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Password / PIN Keamanan
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-355 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 bg-gradient-to-r from-purple-700 to-[#B78A62] hover:opacity-95 text-white font-sans text-xs font-semibold uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-md shadow-purple-900/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Sedang Memproses...' : 'Masuk Ke Control Panel'}
              <LogIn className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      </motion.div>

      {/* Footer copyright block */}
      <p className="mt-8 text-[11px] text-slate-400">
        Copyright © 2026 Susyi Laundry Control Center • All Rights Reserved
      </p>
    </div>
  );
}
