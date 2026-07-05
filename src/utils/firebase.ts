import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import config from "../../firebase-applet-config.json";

// Environment variables with VITE_ prefix, falling back to JSON configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || config.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || config.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || config.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || config.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || config.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || config.measurementId,
};

// Ensure a single Firebase app instance is initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const dbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || config.firestoreDatabaseId;
const finalDbId = dbId && dbId !== "(default)" ? dbId : undefined;

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, finalDbId);

export { firebaseConfig };

/**
 * Translates Firebase Auth error codes into clear, instructive, and friendly messages.
 * Specifically handles popup cancellations and disabled console settings, while retaining the raw error details.
 */
export function getReadableAuthError(err: any): string {
  if (!err) return 'Error tidak diketahui';
  const code = err.code || '';
  const originalMessage = err.message || String(err);
  
  let friendlyMessage = '';
  switch (code) {
    case 'auth/operation-not-allowed':
      friendlyMessage = "Metode masuk (Email/Password atau Google) belum diaktifkan di Firebase Console Anda. Silakan buka Firebase Console -> Authentication -> Sign-in method, lalu aktifkan provider tersebut.";
      break;
    case 'auth/popup-closed-by-user':
      friendlyMessage = "Proses login Google dibatalkan karena jendela pop-up ditutup sebelum selesai.";
      break;
    case 'auth/popup-blocked':
      friendlyMessage = "Pop-up masuk diblokir oleh browser. Silakan izinkan pop-up untuk situs ini.";
      break;
    case 'auth/email-already-in-use':
      friendlyMessage = "Alamat email ini sudah terdaftar. Silakan gunakan menu masuk.";
      break;
    case 'auth/weak-password':
      friendlyMessage = "Password terlalu lemah. Mohon gunakan minimal 6 karakter.";
      break;
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      friendlyMessage = "Email atau password salah. Silakan periksa kembali kredensial Anda.";
      break;
    case 'auth/user-not-found':
      friendlyMessage = "Akun tidak ditemukan. Silakan mendaftar terlebih dahulu.";
      break;
    case 'auth/too-many-requests':
      friendlyMessage = "Terlalu banyak percobaan masuk yang gagal. Akun ini telah ditangguhkan sementara demi keamanan. Silakan coba lagi beberapa saat lagi.";
      break;
    default:
      friendlyMessage = originalMessage;
      break;
  }

  return friendlyMessage;
}
