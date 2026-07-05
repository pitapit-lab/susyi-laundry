import { useState, useMemo, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import PetaInteraktif from './components/PetaInteraktif';
import Harga from './components/Harga';
import PesanForm from './components/PesanForm';
import Kontak from './components/Kontak';
import LoginModal from './components/LoginModal';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { FloatingPetals } from './components/Decorations';
import { Customer, Order } from './types';
import { 
  saveRegisteredUser
} from './utils/database';
import { auth } from './utils/firebase';
import { findUserByEmailInFirestore, saveUserToFirestore } from './utils/firebaseSync';
import { CustomerService, OrderService } from './utils/services';

// Custom Hooks
import { useNavigation } from './hooks/useNavigation';
import { useAuth } from './hooks/useAuth';
import { useOrders } from './hooks/useOrders';
import { useRealtime } from './hooks/useRealtime';
import { useServices } from './hooks/useServices';
import { useCategories } from './hooks/useCategories';
import { useSettings } from './hooks/useSettings';

export default function App() {
  const { currentPath, navigate } = useNavigation();
  const {
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
  } = useAuth();

  const { orders, setOrders } = useOrders(customer);
  useRealtime(customer, setOrders);

  const { services, handleUpdateServices } = useServices();
  const { categories, handleUpdateCategories } = useCategories();
  const { webInfo, handleUpdateWebInfo } = useSettings();

  // Route Data calculated from Interactive Peta component
  const [routeData, setRouteData] = useState<{
    distance: number;
    address: string;
    routeChecked: boolean;
    durationDriving: number;
    durationWalking: number;
    coordinates: [number, number];
    routeType?: string;
    routeDistance?: number;
    routeDuration?: number;
    routeGeometry?: [number, number][];
  } | null>(null);

  // Flow preselected services into the final PesanForm
  const [preselectedService, setPreselectedService] = useState<string>('');

  // Synchronized Customer Orders calculated dynamically from the main orders state
  const currentCustomerOrders = useMemo(() => {
    if (!customer) return [];
    if (customer.role === 'admin') return [];
    
    return orders.map(o => ({
      id: o.order_id,
      date: o.pickup_date,
      serviceType: o.main_service,
      totalPrice: o.grand_total,
      status: o.order_status,
      coordinates: o.coordinates,
      address: o.address,
      routeType: o.routeType,
      routeDistance: o.routeDistance,
      routeDuration: o.routeDuration,
      routeGeometry: o.routeGeometry,
    }));
  }, [customer, orders]);

  // Synced customer profile to feed the client dashboard
  const syncedCustomer = useMemo(() => {
    if (!customer) return null;
    return {
      ...customer,
      orders: currentCustomerOrders
    };
  }, [customer, currentCustomerOrders]);

  // Route Guard checks for dashboard paths
  useEffect(() => {
    if (authLoading) return;
    
    const isCustRoute = currentPath === '/customer' || currentPath === '/customer/dashboard' || currentPath === '/dashboard';
    if (isCustRoute) {
      if (customer && customer.role === 'admin') {
        navigate('/admin');
      } else if (customer && customer.role === 'customer') {
        setDashboardOpen(true);
      }
    }
  }, [currentPath, customer, authLoading, navigate, setDashboardOpen]);

  const handleScrollToBookingForm = () => {
    const el = document.getElementById('pesan-form');
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      window.scrollTo({
        top: elementRect - bodyRect - offset,
        behavior: 'smooth',
      });
    }
  };

  const handleSelectPricingCard = (pricingTitle: string) => {
    setPreselectedService(pricingTitle);
    handleScrollToBookingForm();
  };

  const handleSuccessBooking = async (newOrder?: Order) => {
    if (newOrder) {
      console.log('[App] New booking success, starting Firestore save process:', newOrder.order_id);
      setOrders(prev => [newOrder, ...prev]);

      // Real-time notification broadcasts
      try {
        const channel = new BroadcastChannel('lavender_realtime_orders');
        channel.postMessage({ type: 'NEW_ORDER', orderId: newOrder.order_id });
        channel.close();
      } catch (e) {
        console.error('Error broadcasting new order via BroadcastChannel:', e);
      }

      try {
        window.dispatchEvent(new CustomEvent('lavender_new_order', {
          detail: { orderId: newOrder.order_id }
        }));
      } catch (e) {
        console.error('Error dispatching local order event:', e);
      }

      let activeCustomerId = 'guest_uid';

      if (customer) {
        // Customer exists: update local state profile (no embedded orders save)
        const updatedCust = {
          ...customer,
          points: (customer.points || 0) + 10, // give bonus points for ordering!
          orders: [] // reset locally, as it's computed dynamically now
        };
        activeCustomerId = customer.uid || 'guest_uid';

        setCustomer(updatedCust);
        localStorage.setItem('lavender_customer', JSON.stringify({ uid: updatedCust.uid, email: updatedCust.email, role: updatedCust.role }));
        saveRegisteredUser(updatedCust);

        // Sync customer profile to Firestore
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            await CustomerService.saveCustomer(currentUser.uid, updatedCust);
          } else {
            const found = await findUserByEmailInFirestore(updatedCust.email);
            if (found) {
              await CustomerService.saveCustomer(found.uid, updatedCust);
              activeCustomerId = found.uid;
            }
          }
        } catch (err) {
          console.error('Failed to sync customer profile update to Firestore:', err);
        }
      } else {
        // Guest user: create a temporary profile with a mock UID
        const guestEmail = `${newOrder.customer_name.toLowerCase().replace(/\s+/g, '')}@lavender.com`;
        const mockUid = 'mock_uid_' + guestEmail.replace(/[@.]/g, '_');
        activeCustomerId = mockUid;

        const autoCust: Customer = {
          uid: mockUid,
          name: newOrder.customer_name,
          phone: newOrder.whatsapp,
          email: guestEmail,
          address: newOrder.address,
          points: 10,
          role: 'customer',
          orders: [] // computed dynamically
        };
        setCustomer(autoCust);
        localStorage.setItem('lavender_customer', JSON.stringify({ uid: autoCust.uid, email: autoCust.email, role: autoCust.role }));
        saveRegisteredUser(autoCust);

        // Sync guest customer profile to Firestore
        try {
          await CustomerService.saveCustomer(mockUid, autoCust);
        } catch (err) {
          console.error('Failed to sync booking guest update to Firestore:', err);
        }
      }

      // Save the standalone Order directly to the /orders collection in Firestore
      try {
        await OrderService.saveOrder(newOrder, activeCustomerId);
        console.log(`[App] Order ${newOrder.order_id} successfully saved to standalone Firestore collection.`);
      } catch (err) {
        console.error('CRITICAL: Failed to save standalone order to Firestore:', err);
      }

      // Automatically open the Customer Lounge so they see their live order status immediately!
      setTimeout(() => {
        setDashboardOpen(true);
      }, 500);
    }
    console.log('Cucian premium Susyi Laundry telah sukses dipesan!');
  };

  const isAdminRoute = currentPath === '/admin' || currentPath === '/admin/dashboard';
  const isCustomerRoute = currentPath === '/customer' || currentPath === '/customer/dashboard' || currentPath === '/dashboard';

  if (authLoading && (isAdminRoute || isCustomerRoute)) {
    return (
      <div className="min-h-screen bg-[#fcfaf7] flex flex-col justify-center items-center font-sans">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-500 font-medium animate-pulse">Memverifikasi kredensial...</p>
      </div>
    );
  }

  if (isAdminRoute) {
    if (customer) {
      if (customer.role === 'admin') {
        return (
          <AdminDashboard 
            isOpen={true}
            onClose={() => navigate('/')}
            orders={orders}
            onUpdateOrder={async (updatedOrder) => {
              // Optimistically update locally
              setOrders(prev => prev.map(o => o.order_id === updatedOrder.order_id ? updatedOrder : o));
              try {
                // Find matching customerId from profile or fallback
                let custId = 'guest_uid';
                const found = await findUserByEmailInFirestore(updatedOrder.email || '');
                if (found) {
                  custId = found.uid;
                }
                await OrderService.saveOrder(updatedOrder, custId);
                console.log(`[App] Admin updated order ${updatedOrder.order_id} in Firestore.`);
              } catch (err) {
                console.error('Failed to update order in Firestore:', err);
              }
            }}
            onDeleteOrder={async (orderId) => {
              // Optimistically update locally
              setOrders(prev => prev.filter(o => o.order_id !== orderId));
              try {
                await OrderService.deleteOrder(orderId);
                console.log(`[App] Admin deleted order ${orderId} from Firestore.`);
              } catch (err) {
                console.error('Failed to delete order from Firestore:', err);
              }
            }}
            onLogout={() => handleLogout(navigate)}
            services={services}
            onUpdateServices={handleUpdateServices}
            categories={categories}
            onUpdateCategories={handleUpdateCategories}
            webInfo={webInfo}
            onUpdateWebInfo={handleUpdateWebInfo}
          />
        );
      } else {
        // Customer trying to access Admin Dashboard, show Access Denied page
        return (
          <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center font-sans">
            <div className="max-w-md bg-white p-8 rounded-3xl border border-red-100 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                🚫
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">Akses Ditolak</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Maaf, Anda tidak memiliki izin untuk mengakses Dashboard Admin. Halaman ini terbatas untuk Administrator.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    setDashboardOpen(true);
                    navigate('/');
                  }}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-sm"
                >
                  Buka Dashboard Customer
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-semibold uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          </div>
        );
      }
    } else {
      // Guest trying to access Admin, show Admin login page
      return (
        <AdminLogin 
          onLoginSuccess={(newCust) => handleLoginSuccess(newCust, navigate)}
          onGoHome={() => navigate('/')}
        />
      );
    }
  }

  if (isCustomerRoute && !customer) {
    // Guest trying to access Customer Lounge directly, show gating page
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center font-sans">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-purple-100 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Lounge Customer</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Silakan login terlebih dahulu untuk mengakses histori pesanan, poin loyalty, dan layanan khusus Anda di Customer Lounge.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                setLoginOpen(true);
                navigate('/');
              }}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-sm"
            >
              Masuk Sekarang
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-semibold uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-slate-800 font-sans selection:bg-purple-100 selection:text-purple-800 relative select-none">
      {/* Falling lavender petals that drift gently in the background across sections */}
      <FloatingPetals />

      {/* Navigation Header */}
      <Header 
        onOpenBooking={handleScrollToBookingForm} 
        customer={customer}
        onOpenLogin={() => setLoginOpen(true)}
        onOpenDashboard={() => {
          if (customer?.role === 'admin') {
            navigate('/admin');
          } else {
            setDashboardOpen(true);
          }
        }}
        webInfo={webInfo}
      />

      {/* Sandbox Fallback Mode Banner */}
      {customer?.is_local_sandbox && showSandboxNotice && (
        <div className="bg-amber-50 border-y border-amber-200/60 px-4 py-2.5 text-amber-900 text-xs flex items-center justify-between gap-3 animate-fade-in relative z-40">
          <div className="flex items-center gap-2 mx-auto max-w-7xl w-full">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="font-medium leading-normal flex-1">
              <strong>Mode Sandbox Lokal Aktif</strong> — Email & password sign-in belum diaktifkan di Firebase Console Anda. Kami mengaktifkan sesi lokal otomatis agar Anda dapat menguji seluruh fitur aplikasi secara langsung tanpa kendala!
            </p>
            <button 
              onClick={() => setShowSandboxNotice(false)} 
              className="p-1 hover:bg-amber-100 rounded-full transition-all text-amber-700 ml-auto cursor-pointer"
              title="Tutup pesan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <Hero onOpenBooking={handleScrollToBookingForm} webInfo={webInfo} />

      {/* Fitur Peta Interaktif (Utama) */}
      <PetaInteraktif onRouteCalculated={setRouteData} />

      {/* Pricing lists & Dynamic Price Estimator Section */}
      <Harga 
        onSelectPricing={handleSelectPricingCard} 
        services={services}
        categories={categories}
        webInfo={webInfo}
      />

      {/* Form Pemesanan Terintegrasi dengan Peta */}
      <PesanForm 
        routeData={routeData} 
        setRouteData={setRouteData}
        preselectedService={preselectedService} 
        onSuccess={handleSuccessBooking} 
        customer={customer}
        onOpenLogin={() => setLoginOpen(true)}
        services={services}
        categories={categories}
        webInfo={webInfo}
      />

      {/* Contact Forms & Live Open/Close clocks, and Footer links */}
      <Kontak webInfo={webInfo} />

      {/* Customer Login Modal Overlay */}
      <LoginModal 
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={(newCust) => handleLoginSuccess(newCust, navigate)}
      />

      {/* Customer Lounge Dashboard Sliding Panel */}
      {syncedCustomer && syncedCustomer.role !== 'admin' && (
        <CustomerDashboard 
          isOpen={dashboardOpen}
          onClose={() => {
            setDashboardOpen(false);
            const isCustRoute = window.location.pathname === '/customer' || window.location.pathname === '/customer/dashboard' || window.location.pathname === '/dashboard';
            if (isCustRoute) {
              navigate('/');
            }
          }}
          customer={syncedCustomer}
          onLogout={() => handleLogout(navigate)}
          onUpdateCustomer={async (updated) => {
            // Remove password from local state
            delete (updated as any).password;
            setCustomer(updated);
            localStorage.setItem('lavender_customer', JSON.stringify({ uid: updated.uid, email: updated.email, role: updated.role }));
            saveRegisteredUser(updated);

            // Sync with Firestore
            try {
              const currentUser = auth.currentUser;
              if (currentUser) {
                await saveUserToFirestore(currentUser.uid, updated);
              } else {
                const found = await findUserByEmailInFirestore(updated.email);
                if (found) {
                  await saveUserToFirestore(found.uid, updated);
                }
              }
            } catch (err) {
              console.error('Failed to sync updated customer profile to Firestore:', err);
            }
          }}
        />
      )}
    </div>
  );
}
