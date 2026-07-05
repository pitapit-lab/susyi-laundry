import { useState, FormEvent, useEffect } from 'react';
import { X, Mail, Lock, Phone, User, Sparkles, LogIn, UserPlus, Info, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer } from '../types';
import { auth, getReadableAuthError, firebaseConfig } from '../utils/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider 
} from 'firebase/auth';
import {
  saveUserToFirestore,
  getUserFromFirestore,
  findUserByEmailInFirestore,
  normalizeEmailForAuth
} from '../utils/firebaseSync';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (customer: Customer) => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [authStep, setAuthStep] = useState<'login_or_register' | 'complete_data'>('login_or_register');
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Input fields state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Google sign up flow data cache
  const [googleUserCache, setGoogleUserCache] = useState<{
    uid: string;
    name: string;
    email: string;
    avatar: string;
  } | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappError, setWhatsappError] = useState('');

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setAuthStep('login_or_register');
      setIsLoginMode(true);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setName('');
      setPhone('');
      setAddress('');
      setError('');
      setGoogleUserCache(null);
      setWhatsapp('');
      setWhatsappError('');

      // Check for redirect google login errors
      const redirectError = localStorage.getItem('google_login_error');
      if (redirectError) {
        setError(redirectError);
        localStorage.removeItem('google_login_error');
      }
    } else {
      // Safely sign out if modal closed during partial Google registration
      if (auth.currentUser && authStep === 'complete_data') {
        auth.signOut().catch(console.error);
      }
    }
  }, [isOpen]);

  // Google Sign-In Trigger
  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Enforce select account screen to ensure clear UX
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Temporary logging to inspect configuration on login trigger
      console.log('=== PEMERIKSAAN CONFIG / OAUTH DEBUG ===');
      console.log('1. authDomain:', firebaseConfig.authDomain);
      console.log('2. projectId:', firebaseConfig.projectId);
      console.log('3. provider:', provider.providerId);
      console.log('4. current URL:', window.location.href);
      console.log('5. Firebase App Name:', auth.app.name);
      console.log('========================================');

      // Set registering flag if we are in registration mode so onAuthStateChanged doesn't auto-signout
      if (!isLoginMode) {
        sessionStorage.setItem('lavender_auth_registering', 'true');
      }

      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupErr: any) {
        console.warn('Google Popup blocked or closed, falling back to Redirect:', popupErr);
        // Fallback to signInWithRedirect if blocked or closed
        if (
          popupErr.code === 'auth/popup-blocked' || 
          popupErr.code === 'auth/popup-closed-by-user' || 
          popupErr.code === 'auth/cancelled-popup-request' ||
          popupErr.message?.includes('popup')
        ) {
          console.log('Triggering signInWithRedirect...');
          await signInWithRedirect(auth, provider);
          return; // Stop execution as the page is redirecting
        }
        sessionStorage.removeItem('lavender_auth_registering');
        throw popupErr; // Re-throw other errors to outer catch block
      }

      const user = result.user;

      if (!user.email) {
        sessionStorage.removeItem('lavender_auth_registering');
        throw new Error('Email akun Google tidak dapat diakses.');
      }

      const gEmail = user.email;
      const gAvatar = user.photoURL || `https://www.gravatar.com/avatar/${btoa(gEmail).substring(0, 10)}?d=identicon`;
      const gUid = user.uid;

      // Search if email/uid already exists in Firestore (Prioritize UID, fallback to Email)
      let existingRecord = null;
      const profileByUid = await getUserFromFirestore(gUid);
      if (profileByUid) {
        existingRecord = { uid: gUid, customer: profileByUid };
      } else {
        const profileByEmail = await findUserByEmailInFirestore(gEmail);
        if (profileByEmail) {
          existingRecord = profileByEmail;
        }
      }

      if (isLoginMode) {
        // --- LOGIN FLOW ---
        if (existingRecord) {
          // Yes, account already exists! Link Google profile fields to it
          const mergedCustomer: Customer = {
            ...existingRecord.customer,
            google_linked: true,
            avatar: existingRecord.customer.avatar || gAvatar
          };

          // Save under the new Google UID to link authentication
          await saveUserToFirestore(gUid, mergedCustomer, existingRecord.customer.provider || 'Email + Google');

          onLoginSuccess(mergedCustomer);
          onClose();
        } else {
          // Not registered! Sign out immediately and show the specific error message
          await auth.signOut();
          setError('Akun Google ini belum terdaftar. Silakan daftar terlebih dahulu.');
        }
      } else {
        // --- REGISTRATION FLOW ---
        if (existingRecord) {
          // Email already registered: Do NOT create duplicate account, sign out, show specific error
          sessionStorage.removeItem('lavender_auth_registering');
          await auth.signOut();
          setError('Email Google ini sudah terdaftar. Silakan masuk menggunakan Login Google.');
        } else {
          // Email not registered: Cache Google profile, transition to complete_data screen
          setGoogleUserCache({
            uid: gUid,
            name: user.displayName || '',
            email: gEmail,
            avatar: gAvatar
          });
          setAuthStep('complete_data');
          setError(''); // clear any errors
        }
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      sessionStorage.removeItem('lavender_auth_registering');
      setError(getReadableAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Save additional data for new Google Account signups
  const handleCompleteDataSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWhatsappError('');

    if (!googleUserCache) {
      setWhatsappError('Data Google tidak valid. Silakan coba masuk lagi.');
      return;
    }

    // 1. Validation: numbers only
    const numericRegex = /^[0-9]+$/;
    const cleanWhatsapp = whatsapp.trim();
    if (!numericRegex.test(cleanWhatsapp)) {
      setWhatsappError('Nomor WhatsApp hanya boleh berisi angka.');
      return;
    }

    // 2. Validation: length between 10 and 15 digits
    if (cleanWhatsapp.length < 10 || cleanWhatsapp.length > 15) {
      setWhatsappError('Nomor WhatsApp harus berkisar antara 10 sampai 15 digit.');
      return;
    }

    setIsLoading(true);
    try {
      // Create new customer profile and save to Firestore
      const newCustomer: Customer = {
        name: googleUserCache.name,
        email: googleUserCache.email,
        phone: cleanWhatsapp,
        address: address.trim() || '',
        points: 10, // Welcome points
        role: 'customer',
        avatar: googleUserCache.avatar,
        google_linked: true,
        orders: []
      };

      await saveUserToFirestore(googleUserCache.uid, newCustomer, 'Google');
      sessionStorage.removeItem('lavender_auth_registering');
      onLoginSuccess(newCustomer);
      onClose();
    } catch (err: any) {
      setWhatsappError('Gagal menyimpan profil: ' + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    sessionStorage.removeItem('lavender_auth_registering');
    if (auth.currentUser && authStep === 'complete_data') {
      try {
        await auth.signOut();
      } catch (err) {
        console.error('Sign out during close error:', err);
      }
    }
    onClose();
  };

  const handleCancelCompleteData = async () => {
    setIsLoading(true);
    try {
      sessionStorage.removeItem('lavender_auth_registering');
      await auth.signOut();
      setGoogleUserCache(null);
      setWhatsapp('');
      setAuthStep('login_or_register');
    } catch (err) {
      console.error('Cancel complete data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit standard email and password form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    if (isLoginMode) {
      if (!email || !password) {
        setError('Mohon isi email dan password Anda.');
        return;
      }

      if (password.length < 6) {
        setError('Password minimal harus 6 karakter.');
        return;
      }

      if (cleanEmail !== 'admin@laundry' && !cleanEmail.endsWith('@gmail.com')) {
        setError('Login customer hanya diperbolehkan menggunakan email dengan domain @gmail.com.');
        return;
      }

      setIsLoading(true);
      try {
        let result;
        if (cleanEmail === 'admin@laundry') {
          if (password !== 'baksourat999') {
            setError('Password administrator salah.');
            setIsLoading(false);
            return;
          }
        }
        
        result = await signInWithEmailAndPassword(auth, normalizeEmailForAuth(cleanEmail), password);
        const user = result.user;

        // Fetch corresponding profile from Firestore (Prioritize UID, fallback to Email query)
        let profile = await getUserFromFirestore(user.uid);
        if (!profile && user.email) {
          const existingRecord = await findUserByEmailInFirestore(user.email);
          if (existingRecord) {
            profile = existingRecord.customer;
            // Link it to the UID if needed
            await saveUserToFirestore(user.uid, profile, 'Email');
          }
        }
        
        if (profile) {
          onLoginSuccess(profile);
          onClose();
        } else {
          // If it is admin, we can auto-create the profile as safety fallback
          if (cleanEmail === 'admin@laundry') {
            const adminProfile: Customer = {
              name: 'Administrator',
              email: cleanEmail,
              phone: '',
              address: '',
              points: 0,
              role: 'admin',
              orders: [],
              avatar: `https://www.gravatar.com/avatar/${btoa(cleanEmail).substring(0, 10)}?d=identicon`,
              google_linked: false,
              status: 'aktif'
            };
            await saveUserToFirestore(user.uid, adminProfile, 'Email');
            onLoginSuccess(adminProfile);
            onClose();
          } else {
            await auth.signOut();
            setError('Akun belum terdaftar. Silakan daftar terlebih dahulu.');
          }
        }
      } catch (err: any) {
        console.error('Login Error:', err);
        setError(getReadableAuthError(err));
      } finally {
        setIsLoading(false);
      }
    } else {
      // Registration Mode
      if (!name || !phone || !email || !password || !confirmPassword) {
        setError('Mohon lengkapi seluruh kolom wajib.');
        return;
      }

      if (cleanEmail === 'admin@laundry') {
        setError('Email administrator utama tidak dapat didaftarkan sebagai customer baru.');
        return;
      }

      if (!cleanEmail.endsWith('@gmail.com')) {
        setError('Pendaftaran hanya diperbolehkan menggunakan email dengan domain @gmail.com.');
        return;
      }

      if (password.length < 6) {
        setError('Password minimal harus 6 karakter.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Konfirmasi password tidak cocok.');
        return;
      }

      // Format & Validate Phone Number
      const numericRegex = /^[0-9]+$/;
      const cleanPhone = phone.trim();
      if (!numericRegex.test(cleanPhone)) {
        setError('Nomor WhatsApp hanya boleh berisi angka.');
        return;
      }
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        setError('Nomor WhatsApp harus berkisar antara 10 sampai 15 digit.');
        return;
      }

      setIsLoading(true);
      try {
        // Set registering flag so onAuthStateChanged doesn't auto-signout
        sessionStorage.setItem('lavender_auth_registering', 'true');

        // 1. Create Auth User directly (Firebase Auth automatically ensures email uniqueness)
        const result = await createUserWithEmailAndPassword(auth, normalizeEmailForAuth(cleanEmail), password);
        const user = result.user;

        // 2. Save profile to Firestore
        const newUser: Customer = {
          name: name.trim(),
          phone: cleanPhone,
          email: cleanEmail,
          address: address.trim() || '',
          points: 10, // welcome bonus points
          role: 'customer',
          avatar: googleUserCache ? googleUserCache.avatar : `https://www.gravatar.com/avatar/${btoa(cleanEmail).substring(0, 10)}?d=identicon`,
          orders: [],
          google_linked: !!googleUserCache,
          status: 'Active'
        };

        await saveUserToFirestore(user.uid, newUser, googleUserCache ? 'Email + Google' : 'Email');
        
        // Remove registration flag after successful save
        sessionStorage.removeItem('lavender_auth_registering');

        onLoginSuccess(newUser);
        onClose();
      } catch (err: any) {
        console.error('Registration error:', err);
        sessionStorage.removeItem('lavender_auth_registering');
        setError(getReadableAuthError(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Demo Login Backups (Maintains easy evaluation access)
  const handleDemoLogin = async (demoEmail: string, role: 'customer' | 'admin') => {
    setError('');
    setIsLoading(true);

    const targetEmail = role === 'admin' ? 'admin@laundry' : 'amanda.kirana@gmail.com';
    const targetPassword = role === 'admin' ? 'baksourat999' : 'password123';

    try {
      let result;
      try {
        result = await signInWithEmailAndPassword(auth, normalizeEmailForAuth(targetEmail), targetPassword);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          result = await createUserWithEmailAndPassword(auth, normalizeEmailForAuth(targetEmail), targetPassword);
        } else {
          throw err;
        }
      }
      const user = result.user;
      
      let profile = await getUserFromFirestore(user.uid);
      if (!profile) {
        profile = {
          name: role === 'admin' ? 'Administrator' : 'Kak Amanda Kirana',
          phone: role === 'admin' ? '' : '081234567890',
          email: targetEmail,
          address: role === 'admin' ? '' : 'Apartemen Senopati Suites, Kebayoran Baru',
          points: role === 'admin' ? 0 : 15,
          role: role,
          orders: [],
          avatar: '',
          google_linked: false,
          status: role === 'admin' ? 'aktif' : 'Active'
        };
        await saveUserToFirestore(user.uid, profile, 'Email');
      }
      onLoginSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error('Demo auth error:', err);
      setError('Akses demo gagal: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isLoading) handleClose();
            }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative bg-white/95 backdrop-blur-md rounded-3xl border border-purple-100 shadow-2xl p-6 md:p-8 max-w-md w-full z-10 overflow-y-auto overflow-x-hidden no-scrollbar max-h-[90vh]"
          >
            {/* Close Button */}
            {!isLoading && (
              <button
                onClick={handleClose}
                className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-purple-100/60 text-slate-400 hover:text-purple-750 rounded-full transition-colors focus:outline-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Aesthetic Blurs */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-purple-100/40 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-100/20 rounded-full blur-xl pointer-events-none" />

            <div className="relative space-y-6">
              
              {authStep === 'complete_data' ? (
                // ---------------- COMPLETE DATA FORM ----------------
                <div className="space-y-6 pt-2 animate-fade-in">
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 text-2xl">
                      👋
                    </div>
                    <h3 className="font-display text-xl text-slate-800 font-bold">
                      Lengkapi Data Akun
                    </h3>
                    <p className="font-sans text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      Hampir selesai! Mohon lengkapi Nomor WhatsApp Anda agar dapat masuk dan memesan laundry.
                    </p>
                  </div>

                  {googleUserCache && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
                      <img
                        src={googleUserCache.avatar}
                        alt="Avatar Google"
                        className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate">{googleUserCache.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{googleUserCache.email}</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full shrink-0">Verified</span>
                    </div>
                  )}

                  <form onSubmit={handleCompleteDataSubmit} className="space-y-4">
                    {whatsappError && (
                      <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-start gap-2">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{whatsappError}</span>
                      </div>
                    )}

                    <div>
                      <label className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Nomor WhatsApp <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-350 pointer-events-none">
                          <Phone className="w-4 h-4" />
                        </span>
                        <input
                          type="tel"
                          required
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 08123456789"
                          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-300 font-medium"
                        />
                      </div>
                    </div>



                    <div className="flex flex-col gap-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-[#B78A62] hover:bg-[#976A42] text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-md shadow-amber-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isLoading ? 'Memproses...' : 'Selesaikan Pendaftaran'}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelCompleteData}
                        disabled={isLoading}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 hover:text-slate-800 font-sans text-xs font-semibold uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        Kembali ke Halaman Sebelumnya
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                // ---------------- STANDARD LOGIN / REGISTRATION FORM ----------------
                <>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative w-12 h-12 flex items-center justify-center mb-3">
                      <svg
                        width="36"
                        height="36"
                        viewBox="0 0 36 36"
                        fill="none"
                        className="transform rotate-12"
                      >
                        <path
                          d="M18 4C18 4 11 11 11 16.5C11 16.5 14 24.5 18 24.5C22 24.5 25 21.5 25 16.5C25 11 18 4 18 4Z"
                          fill="#E5DBFF"
                          stroke="#7048E8"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M18 4C18 4 25 11 25 16.5C25 21.5 22 24.5 18 24.5Z"
                          fill="#D0BFFF"
                          opacity="0.8"
                        />
                      </svg>
                      <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-purple-600 animate-pulse" />
                    </div>
                    
                    <h3 className="font-display text-2xl text-slate-800 font-semibold">
                      {isLoginMode ? 'Selamat Datang Kembali' : 'Daftar Akun Baru'}
                    </h3>
                    <p className="font-sans text-xs text-slate-400 mt-1 max-w-[280px]">
                      {isLoginMode 
                        ? 'Masuk untuk memantau cucian, riwayat, dan rincian pesanan Susyi Laundry Anda.' 
                        : 'Buat akun baru untuk memesan layanan laundry berkualitas dengan mudah.'}
                    </p>
                  </div>



                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl flex flex-col gap-2 animate-fade-in">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{error}</span>
                        </div>
                        {error.includes('belum terdaftar') && (
                          <button
                            type="button"
                            onClick={() => {
                              setError('');
                              setIsLoginMode(false);
                            }}
                            className="mt-1 text-left self-start text-xs font-bold text-red-700 hover:text-red-900 underline flex items-center gap-1 cursor-pointer"
                          >
                            Daftar Sekarang <span className="text-[10px]">→</span>
                          </button>
                        )}
                        {error.includes('sudah terdaftar') && (
                          <button
                            type="button"
                            onClick={() => {
                              setError('');
                              setIsLoginMode(true);
                            }}
                            className="mt-1 text-left self-start text-xs font-bold text-red-700 hover:text-red-900 underline flex items-center gap-1 cursor-pointer"
                          >
                            Masuk Sekarang <span className="text-[10px]">→</span>
                          </button>
                        )}
                      </div>
                    )}

                    {!isLoginMode && googleUserCache && (
                      <div className="p-3 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-start gap-2 animate-fade-in">
                        <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                        <div>
                          <p className="font-semibold">Profil Google Terhubung!</p>
                          <p className="text-[10px] text-emerald-600/95 mt-0.5">Kami telah mengisi Nama Lengkap dan Email Anda secara otomatis. Silakan lengkapi Nomor WhatsApp dan Password untuk menyelesaikan pendaftaran.</p>
                        </div>
                      </div>
                    )}

                    {!isLoginMode && (
                      <div>
                        <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-350 pointer-events-none">
                            <User className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Amanda Kirana"
                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-300"
                          />
                        </div>
                      </div>
                    )}

                    {!isLoginMode && (
                      <div>
                        <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Nomor WhatsApp <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-350 pointer-events-none">
                            <Phone className="w-4 h-4" />
                          </span>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="e.g. 08123456789"
                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-300"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Alamat Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-350 pointer-events-none">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. amanda@example.com"
                          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Password / PIN <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-350 pointer-events-none">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-300"
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

                    {!isLoginMode && (
                      <div>
                        <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Konfirmasi Password / PIN <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-350 pointer-events-none">
                            <Lock className="w-4 h-4" />
                          </span>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-300"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}



                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-3 bg-[#B78A62] hover:bg-[#976A42] text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-md shadow-amber-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        'Memproses...'
                      ) : isLoginMode ? (
                        <>
                          Masuk Ke Akun
                          <LogIn className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Daftar Sekarang
                          <UserPlus className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Or Continue With Separator Divider */}
                  <div className="flex items-center gap-2 my-2">
                    <div className="h-px bg-slate-100 flex-1" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Atau lanjutkan dengan</span>
                    <div className="h-px bg-slate-100 flex-1" />
                  </div>

                  {/* Google Login Button */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200/85 rounded-2xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2.5 group active:scale-[0.98] disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span className="font-sans text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                      Sign in with Google
                    </span>
                  </button>

                  {/* Toggle Mode Link */}
                  <div className="text-center pt-2 border-t border-purple-50">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setError('');
                        setIsLoginMode(!isLoginMode);
                        setGoogleUserCache(null);
                        setName('');
                        setEmail('');
                      }}
                      className="font-sans text-xs text-purple-650 hover:text-purple-800 hover:underline transition-all cursor-pointer"
                    >
                      {isLoginMode 
                        ? 'Belum punya akun? Daftar sebagai Customer Baru' 
                        : 'Sudah memiliki akun? Masuk sekarang.'}
                    </button>
                  </div>
                </>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
