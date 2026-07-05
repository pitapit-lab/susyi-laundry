import { useState, useEffect } from 'react';
import { Customer } from '../types';
import { auth } from '../utils/firebase';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { 
  bootstrapDemoUsersToFirestore, 
  saveUserToFirestore, 
  findUserByEmailInFirestore,
  getUserFromFirestore,
  seedAdminAccount
} from '../utils/firebaseSync';

export function useAuth() {
  const [customer, setCustomer] = useState<Customer | null>(() => {
    const saved = localStorage.getItem('lavender_customer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          return parsed;
        }
      } catch (e) {}
    }
    return null;
  });

  const [loginOpen, setLoginOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSandboxNotice, setShowSandboxNotice] = useState(true);

  useEffect(() => {
    seedAdminAccount();
  }, []);

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
              localStorage.setItem('lavender_customer', JSON.stringify({ uid: mergedCustomer.uid, email: mergedCustomer.email, role: mergedCustomer.role }));
            } else {
              await auth.signOut();
              localStorage.setItem('google_login_error', 'Akun Google ini belum terdaftar sebagai Customer. Silakan daftar terlebih dahulu sebelum menggunakan Login Google.');
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
        console.log('[useAuth] Auth state changed but registration is in progress. Bypassing global auto-signout check.');
        setAuthLoading(false);
        return;
      }

      if (user) {
        try {
          const profile = await getUserFromFirestore(user.uid);
          if (profile) {
            delete (profile as any).password;
            setCustomer(profile);
            localStorage.setItem('lavender_customer', JSON.stringify({ uid: profile.uid, email: profile.email, role: profile.role }));
            if (profile.role === 'admin') {
              bootstrapDemoUsersToFirestore();
            }
          } else {
            if (user.email) {
              const existingRecord = await findUserByEmailInFirestore(user.email);
              if (existingRecord) {
                const mergedCustomer: Customer = {
                  ...existingRecord.customer,
                  google_linked: true,
                  avatar: existingRecord.customer.avatar || user.photoURL || ""
                };
                delete (mergedCustomer as any).password;
                await saveUserToFirestore(user.uid, mergedCustomer, 'Email + Google');
                setCustomer(mergedCustomer);
                localStorage.setItem('lavender_customer', JSON.stringify({ uid: mergedCustomer.uid, email: mergedCustomer.email, role: mergedCustomer.role }));
              } else {
                await auth.signOut();
                setCustomer(null);
                localStorage.removeItem('lavender_customer');
              }
            } else {
              await auth.signOut();
              setCustomer(null);
              localStorage.removeItem('lavender_customer');
            }
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setCustomer(null);
          localStorage.removeItem('lavender_customer');
        }
      } else {
        setCustomer(null);
        localStorage.removeItem('lavender_customer');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (newCustomer: Customer, navigate: (path: string) => void) => {
    delete (newCustomer as any).password;
    setCustomer(newCustomer);
    localStorage.setItem('lavender_customer', JSON.stringify({ uid: newCustomer.uid, email: newCustomer.email, role: newCustomer.role }));
    if (newCustomer.role === 'admin') {
      sessionStorage.setItem('lavender_admin_logged_in_just_now', 'true');
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
    setCustomer(null);
    localStorage.removeItem('lavender_customer');
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
