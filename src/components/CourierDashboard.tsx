import { useState } from 'react';
import { Truck, LogOut } from 'lucide-react';
import CourierManagement from './CourierManagement';
import CustomerOrderMap from './CustomerOrderMap';
import { Customer, Order } from '../types';

interface CourierDashboardProps {
  customer: Customer;
  orders: Order[];
  onUpdateOrder: (updatedOrder: Order) => Promise<void> | void;
  onLogout: () => void;
  onGoHome: () => void;
}

export default function CourierDashboard({
  customer,
  orders,
  onUpdateOrder,
  onLogout,
  onGoHome,
}: CourierDashboardProps) {
  const [openedMapOrderId, setOpenedMapOrderId] = useState<string | null>(null);

  const openedMapOrder = orders.find(o => o.order_id === openedMapOrderId);

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col font-sans select-none">
      {/* Top Header Navigation Bar */}
      <header className="h-16 bg-[#1F1147] text-white shadow-xl px-4 sm:px-8 flex items-center justify-between shrink-0 relative z-30 border-b border-purple-900/60">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div 
            onClick={onGoHome}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg border border-purple-400/30 shrink-0">
              <Truck className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wider text-purple-100 uppercase flex items-center gap-1.5">
                SUSYI LAUNDRY
                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-purple-950 text-[8px] font-black uppercase tracking-wider">
                  KURIR
                </span>
              </span>
              <span className="text-[10px] text-purple-300 font-mono font-semibold">
                Dasboard Operasional Antar - Jemput
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-200 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Keluar dari Sistem Kurir"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Viewport rendering existing CourierManagement component */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
        <CourierManagement
          orders={orders}
          onUpdateOrder={onUpdateOrder}
          onOpenMapModal={(orderId) => setOpenedMapOrderId(orderId)}
        />
      </main>

      {/* Interactive Map Modal Overlay if triggered */}
      {openedMapOrder && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-sm text-slate-800">
                  Rute Pelanggan #{openedMapOrder.order_id} ({openedMapOrder.customer_name})
                </h3>
              </div>
              <button
                onClick={() => setOpenedMapOrderId(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <CustomerOrderMap
              orderCoords={openedMapOrder.coordinates || [-7.5785444, 112.7257545]}
              orderAddress={openedMapOrder.address}
            />
          </div>
        </div>
      )}
    </div>
  );
}
