import { useState, useEffect } from 'react';
import { Customer } from '../types';
import { auth } from '../utils/firebase';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { 
  saveUserToFirestore, 
  findUserByEmailInFirestore,
  getUserFromFirestore
} from '../utils/firebaseSync';

export function useAuth() {
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [loginOpen, setLoginOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSandboxNotice, setShowSandboxNotice] = useState(true);

  useEffect(() => {
    setAuthLoading(true);

    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          const user = result.user;
          console.log("Redirect login successful! User:", user.email);
          if (user.email) {
            const gEmail = user.email;
            const gAvatar = user.photoURL || `https://www.gravatar.com/avatar/${btoa(gEmail).substring(0, 10)}?d=identicon`;
            const gUid = user.uid;

            const existingRecord = await findUserByEmailInFirestore(gEmail);
            if (existingRecord) {
              const mergedCustomer: Customer = {
                ...existingRecord.customer,
                google_linked: true,
                avatar: existingRecord.customer.avatar || gAvatar
              };
              delete (mergedCustomer as any).password;
              await saveUserToFirestore(gUid, mergedCustomer, 'Email + Google');
              setCustomer(mergedCustomer);
            } else {
              await signOut(auth);
              localStorage.clear();
              sessionStorage.clear();
              setCustomer(null);
              setLoginOpen(true);
            }
          }
        }
      })
      .catch((err) => {
        console.error("Error processing redirect sign-in result:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (sessionStorage.getItem('lavender_auth_registering') === 'true') {
        console.log('[useAuth] Auth state changed but registration is in progress.');
        setAuthLoading(false);
        return;
      }

      if (user) {
        try {
          const profile = await getUserFromFirestore(user.uid);
          if (profile) {
            delete (profile as any).password;
            setCustomer(profile);
          } else {
            console.warn("Firestore user profile not found for UID:", user.uid);
            await signOut(auth);
            localStorage.clear();
            sessionStorage.clear();
            setCustomer(null);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          await signOut(auth).catch(() => {});
          localStorage.clear();
          sessionStorage.clear();
          setCustomer(null);
        }
      } else {
        setCustomer(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (newCustomer: Customer, navigate: (path: string) => void) => {
    delete (newCustomer as any).password;
    setCustomer(newCustomer);
    if (newCustomer.role === 'admin') {
      navigate('/admin');
    } else {
      setDashboardOpen(true);
      navigate('/customer');
    }
  };

  const handleLogout = async (navigate: (path: string) => void) => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Firebase signOut error:', e);
    }
    localStorage.clear();
    sessionStorage.clear();
    setCustomer(null);
    setDashboardOpen(false);
    navigate('/');
  };

  return {
    customer,
    setCustomer,
    loginOpen,
    setLoginOpen,
    dashboardOpen,
    setDashboardOpen,
    authLoading,
    showSandboxNotice,
    setShowSandboxNotice,
    handleLoginSuccess,
    handleLogout
  };
}
