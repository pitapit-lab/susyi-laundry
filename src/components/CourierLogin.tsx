import { useState, FormEvent } from 'react';
import { Mail, Lock, Truck, LogIn, ArrowLeft, Info, Eye, EyeOff, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { Customer } from '../types';
import { auth, getReadableAuthError } from '../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getUserFromFirestore, findUserByEmailInFirestore, saveUserToFirestore, normalizeEmailForAuth } from '../utils/firebaseSync';

interface CourierLoginProps {
  onLoginSuccess: (customer: Customer) => void;
  onGoHome: () => void;
}

export default function CourierLogin({ onLoginSuccess, onGoHome }: CourierLoginProps) {
  const [email, setEmail] = useState('kurir@laundry');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setError('Mohon lengkapi email dan password kurir.');
      setIsLoading(false);
      return;
    }

    const normEmail = normalizeEmailForAuth(cleanEmail);

    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, normEmail, cleanPassword);
      } catch (signErr: any) {
        // If user not found and logging in as kurir@laundry, auto-create account in Firebase Auth
        if (
          (cleanEmail === 'kurir@laundry' || normEmail === 'kurir@laundry.com') && 
          (signErr.code === 'auth/user-not-found' || signErr.code === 'auth/invalid-credential')
        ) {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, normEmail, cleanPassword);
            const courierProfile: Customer = {
              uid: newCred.user.uid,
              name: 'Kurir Susyi Laundry',
              email: 'kurir@laundry',
              phone: '081234567890',
              address: 'Outlet Susyi Laundry, Jl. Utama No. 12',
              points: 0,
              role: 'courier',
              orders: []
            };
            await saveUserToFirestore(newCred.user.uid, courierProfile, 'Email');
            onLoginSuccess(courierProfile);
            return;
          } catch (createErr) {
            console.warn('Auto-creation of courier account failed:', createErr);
          }
        }
        throw signErr;
      }

      const user = userCredential.user;
      let profile = await getUserFromFirestore(user.uid);
      
      if (!profile) {
        const existingRecord = await findUserByEmailInFirestore('kurir@laundry');
        if (existingRecord) {
          profile = existingRecord.customer;
          await saveUserToFirestore(user.uid, profile, 'Email');
        }
      }

      if (profile && profile.role !== 'courier') {
        if (cleanEmail === 'kurir@laundry' || normEmail === 'kurir@laundry.com') {
          profile.role = 'courier';
          await saveUserToFirestore(user.uid, profile, 'Email');
        } else {
          await auth.signOut();
          setError('Akses Ditolak. Akun ini bukan Kurir.');
          setIsLoading(false);
          return;
        }
      }

      if (!profile) {
        profile = {
          uid: user.uid,
          name: 'Kurir Susyi Laundry',
          email: 'kurir@laundry',
          phone: '081234567890',
          address: 'Outlet Susyi Laundry',
          points: 0,
          role: 'courier',
          orders: []
        };
        await saveUserToFirestore(user.uid, profile, 'Email');
      }

      onLoginSuccess(profile);
    } catch (err: any) {
      console.error('Courier Login Error:', err);
      if ((cleanEmail === 'kurir@laundry' || normEmail === 'kurir@laundry.com') && cleanPassword === 'baksourat999') {
        const fallbackCourier: Customer = {
          uid: 'courier_laundry_placeholder_uid',
          name: 'Kurir Susyi Laundry',
          email: 'kurir@laundry',
          phone: '081234567890',
          address: 'Outlet Susyi Laundry',
          points: 0,
          role: 'courier',
          is_local_sandbox: true,
          orders: []
        };
        onLoginSuccess(fallbackCourier);
      } else {
        setError('Gagal masuk sebagai Kurir: ' + getReadableAuthError(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#FAF8FF] to-[#F1EAFF] flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Decorative background glows */}
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
        <div className="space-y-6">
          {/* Header Title */}
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-gradient-to-tr from-purple-700 to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4 relative">
              <Truck className="w-7 h-7 text-amber-300" />
            </div>
            
            <h1 className="font-display text-2xl font-bold text-slate-800 tracking-tight">
              Portal Operasional Kurir
            </h1>
            <p className="font-sans text-xs text-slate-500 mt-2 max-w-[300px] leading-relaxed">
              Silakan masukkan kredensial akun Kurir resmi Susyi Laundry untuk mengakses tugas penjemputan & pengantaran.
            </p>
          </div>

          {/* Quick Credential Hint Box */}
          <div className="p-3.5 bg-purple-50/80 border border-purple-100 rounded-2xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-purple-900">
              <KeyRound className="w-3.5 h-3.5 text-purple-600" />
              <span>Kredensial Akses Kurir:</span>
            </div>
            <div className="text-[11px] font-mono text-purple-800 space-y-0.5 pl-5">
              <p>Email: <strong className="text-purple-950 font-bold">kurir@laundry</strong></p>
              <p>Password: <strong className="text-purple-950 font-bold">baksourat999</strong></p>
            </div>
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
                Email Kurir
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kurir@laundry"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-350 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Password Kurir
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
              className="w-full mt-6 py-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:opacity-95 text-white font-sans text-xs font-semibold uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-md shadow-purple-900/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Sedang Memproses...' : 'Masuk Ke Interface Kurir'}
              <LogIn className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      </motion.div>

      {/* Footer copyright block */}
      <p className="mt-8 text-[11px] text-slate-400">
        Copyright © 2026 Susyi Laundry Courier Interface • All Rights Reserved
      </p>
    </div>
  );
}
