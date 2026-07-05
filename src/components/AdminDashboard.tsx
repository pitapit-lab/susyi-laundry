import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Trash2, Edit2, Plus, Check, Search, Filter, Calendar, 
  Clock, MapPin, Phone, User, Tag, ShoppingBag, AlertTriangle, Save, LogOut,
  Info, LayoutDashboard, Settings, Layers, HelpCircle, ToggleLeft, ToggleRight, ArrowLeft,
  Users, Coins, Megaphone, TrendingUp, Menu, ChevronLeft, ChevronRight, Bell, Mail,
  Sun, Moon, Sparkles, Activity, CheckCircle2, FileText, FileSpreadsheet, Download, Printer, TrendingDown, RefreshCw, ChevronUp, ChevronDown, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderItem, Customer } from '../types';
import { AdminService, AdminCategory, WebInfo, getRegisteredUsers, saveRegisteredUser } from '../utils/database';
import { listenToUsersInFirestore, deleteUserFromFirestore } from '../utils/firebaseSync';
import AdminOrderMap from './AdminOrderMap';
import CustomerOrderMap from './CustomerOrderMap';
import FinancialCharts from './FinancialCharts';

export interface OrderNotification {
  id: string;
  orderId: string;
  customerName: string;
  mainService: string;
  additionalService: 'reguler' | 'ekspres';
  timeStr: string;
}

interface ToastProps {
  notification: OrderNotification;
  onClose: (id: string) => void;
  onView: (orderId: string) => void;
}

function OrderNotificationToast({ notification, onClose, onView }: ToastProps) {
  const duration = 6500; // 5-7 seconds (using 6.5s)

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const isExpress = notification.additionalService === 'ekspres';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.9 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border pointer-events-auto ${
        isExpress 
          ? 'bg-gradient-to-br from-orange-500 via-red-500 to-red-600 text-white border-orange-400/30' 
          : 'bg-white text-slate-800 border-slate-100'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Animated/Glowing Icon */}
          <div className={`p-2.5 rounded-xl shrink-0 ${
            isExpress 
              ? 'bg-white/20 text-white animate-pulse shadow-md shadow-orange-600/20' 
              : 'bg-purple-50 text-purple-600 border border-purple-100'
          }`}>
            {isExpress ? (
              <Zap className="w-5 h-5 fill-current" />
            ) : (
              <ShoppingBag className="w-5 h-5" />
            )}
          </div>

          {/* Details Content */}
          <div className="flex-1 min-w-0 pr-4">
            <h4 className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              {isExpress ? (
                <>
                  <span>⚡</span>
                  <span className="text-amber-100 tracking-widest font-extrabold text-[11px]">PESANAN EXPRESS</span>
                </>
              ) : (
                <>
                  <span>🧺</span>
                  <span className="text-purple-700 tracking-wide font-extrabold">Pesanan Baru</span>
                </>
              )}
            </h4>
            
            <p className="text-sm font-bold truncate mt-1">
              Pelanggan: {notification.customerName}
            </p>
            
            <div className="mt-1.5 space-y-1 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className={isExpress ? 'text-white/80 font-normal' : 'text-slate-500 font-normal'}>Layanan:</span>
                <span className="font-extrabold">{notification.mainService}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className={isExpress ? 'text-white/80 font-normal' : 'text-slate-500 font-normal'}>Status:</span>
                {isExpress ? (
                  <span className="bg-amber-400/30 text-amber-100 font-black px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider animate-pulse border border-amber-400/20">
                    🔥 Pesanan Prioritas
                  </span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-black px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider">
                    Reguler
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 mt-1.5 text-xs font-bold opacity-90">
                <span>🕒</span>
                <span>{notification.timeStr}</span>
              </div>
            </div>

            {/* CTA action button */}
            <button
              onClick={() => onView(notification.orderId)}
              className={`mt-3 w-full py-2.5 px-3 rounded-xl text-xs font-black tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                isExpress 
                  ? 'bg-white text-red-600 hover:bg-orange-50 hover:shadow-md' 
                  : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md'
              }`}
            >
              <span>Lihat Pesanan</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => onClose(notification.id)}
            className={`absolute top-3 right-3 p-1 rounded-lg transition-colors ${
              isExpress 
                ? 'text-white/70 hover:text-white hover:bg-white/10' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar Animation */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black/10">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className={`h-full ${isExpress ? 'bg-amber-300' : 'bg-purple-600'}`}
        />
      </div>
    </motion.div>
  );
}

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrder: (updatedOrder: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onLogout: () => void;
  services: AdminService[];
  onUpdateServices: (services: AdminService[]) => void;
  categories: AdminCategory[];
  onUpdateCategories: (categories: AdminCategory[]) => void;
  webInfo: WebInfo;
  onUpdateWebInfo: (info: WebInfo) => void;
}

const formatRupiah = (amount: number) => {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
};

export default function AdminDashboard({ 
  isOpen, 
  onClose, 
  orders, 
  onUpdateOrder, 
  onDeleteOrder,
  onLogout,
  services,
  onUpdateServices,
  categories,
  onUpdateCategories,
  webInfo,
  onUpdateWebInfo
}: AdminDashboardProps) {
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'customers' | 'services' | 'categories' | 'reports'>('dashboard');

  // Real-time order notifications list state
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);

  // Real-time order notification broadcast, custom event listener, and database polling
  useEffect(() => {
    const extractOrderTime = (createdAtStr: string): string => {
      if (!createdAtStr) {
        return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\./g, ':') + ' WIB';
      }
      // Try to find HH:mm or HH.mm pattern inside the string
      const timeMatch = createdAtStr.match(/(\d{2})[:.](\d{2})/);
      if (timeMatch) {
        return `${timeMatch[1]}:${timeMatch[2]} WIB`;
      }
      // Try standard parsing
      try {
        const d = new Date(createdAtStr);
        if (!isNaN(d.getTime())) {
          const hrs = d.getHours();
          const mins = d.getMinutes();
          if (hrs !== 0 || mins !== 0) {
            return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\./g, ':') + ' WIB';
          }
        }
      } catch (e) {}
      // Fallback to current time
      return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\./g, ':') + ' WIB';
    };

    const handleNewOrder = (orderId: string) => {
      try {
        const dbOrdersStr = localStorage.getItem('lavender_orders');
        if (dbOrdersStr) {
          const dbOrders = JSON.parse(dbOrdersStr) as Order[];
          const matchedOrder = dbOrders.find(o => o.order_id === orderId);
          if (matchedOrder) {
            setNotifications(prev => {
              // Prevent duplicates
              if (prev.some(n => n.orderId === orderId)) {
                return prev;
              }
              
              const orderTime = extractOrderTime(matchedOrder.created_at);

              const newNotif: OrderNotification = {
                id: Math.random().toString(36).substring(2, 9),
                orderId: matchedOrder.order_id,
                customerName: matchedOrder.customer_name,
                mainService: matchedOrder.main_service,
                additionalService: matchedOrder.additional_service,
                timeStr: orderTime
              };

              // Limit to max 3 notifications stacked
              const updated = [newNotif, ...prev];
              if (updated.length > 3) {
                return updated.slice(0, 3);
              }
              return updated;
            });

            // Mark as notified in database list to prevent duplicate alerts on refresh/login
            try {
              const notifiedIdsStr = localStorage.getItem('lavender_notified_order_ids') || '[]';
              const notifiedIds: string[] = JSON.parse(notifiedIdsStr);
              if (!notifiedIds.includes(orderId)) {
                notifiedIds.push(orderId);
                localStorage.setItem('lavender_notified_order_ids', JSON.stringify(notifiedIds));
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching order from database for real-time notification:', err);
      }
    };

    // 1. Same-tab Custom Event listener (when customer orders on the same window session)
    const localListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.orderId) {
        handleNewOrder(customEvent.detail.orderId);
      }
    };
    window.addEventListener('lavender_new_order', localListener);

    // 2. Cross-tab BroadcastChannel (when customer is on another tab)
    const channel = new BroadcastChannel('lavender_realtime_orders');
    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'NEW_ORDER' && event.data.orderId) {
        handleNewOrder(event.data.orderId);
      }
    };

    // 3. Fallback / Polling Mechanism: periodic checking of localStorage orders
    // This serves as an active polling fallback to catch database modifications safely
    let lastCheckedOrdersStr = localStorage.getItem('lavender_orders') || '[]';
    const intervalId = setInterval(() => {
      try {
        const currentOrdersStr = localStorage.getItem('lavender_orders') || '[]';
        if (currentOrdersStr !== lastCheckedOrdersStr) {
          const lastOrders = JSON.parse(lastCheckedOrdersStr) as Order[];
          const currentOrders = JSON.parse(currentOrdersStr) as Order[];
          
          // Find newly added orders in current that weren't in last
          const lastIds = new Set(lastOrders.map(o => o.order_id));
          const newOrders = currentOrders.filter(o => !lastIds.has(o.order_id));
          
          for (const newO of newOrders) {
            handleNewOrder(newO.order_id);
          }
          lastCheckedOrdersStr = currentOrdersStr;
        }
      } catch (e) {
        // ignore parsing errors
      }
    }, 1500);

    // 4. Initial Load Check: retrieve unnotified pending orders on mount
    try {
      const dbOrdersStr = localStorage.getItem('lavender_orders');
      if (dbOrdersStr) {
        const allOrders = JSON.parse(dbOrdersStr) as Order[];
        const pendingOrders = allOrders.filter(o => o.order_status === 'Menunggu Konfirmasi');
        const notifiedIdsStr = localStorage.getItem('lavender_notified_order_ids') || '[]';
        const notifiedIds: string[] = JSON.parse(notifiedIdsStr);
        const unnotified = pendingOrders.filter(o => !notifiedIds.includes(o.order_id));
        
        if (unnotified.length > 0) {
          // Show up to 3
          const toShow = unnotified.slice(0, 3);
          const newNotifs: OrderNotification[] = toShow.map(o => {
            const orderTime = extractOrderTime(o.created_at);

            return {
              id: Math.random().toString(36).substring(2, 9),
              orderId: o.order_id,
              customerName: o.customer_name,
              mainService: o.main_service,
              additionalService: o.additional_service,
              timeStr: orderTime
            };
          });
          setNotifications(newNotifs);

          const newlyNotified = Array.from(new Set([...notifiedIds, ...toShow.map(o => o.order_id)]));
          localStorage.setItem('lavender_notified_order_ids', JSON.stringify(newlyNotified));
        }
      }
    } catch (err) {
      console.error('Error with initial order check:', err);
    }

    return () => {
      window.removeEventListener('lavender_new_order', localListener);
      channel.close();
      clearInterval(intervalId);
    };
  }, []);

  // Search & Filter state for Orders list
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Order | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [openedMapOrderId, setOpenedMapOrderId] = useState<string | null>(null);

  // Available laundry items list generated dynamically from categories prop for editing dropdowns
  const categoriesDb = useMemo(() => {
    return categories.map(cat => ({
      name: cat.name,
      items: cat.items.map(i => ({
        name: i.name,
        price: i.price
      }))
    }));
  }, [categories]);

  // States for Adding a New Item to the order currently being edited
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || 'Pakaian');
  const [selectedItemName, setSelectedItemName] = useState(categories[0]?.items[0]?.name || 'Kaos');
  const [customItemPrice, setCustomItemPrice] = useState<number>(500);
  const [customItemQty, setCustomItemQty] = useState<number>(1);
  const [isAddingItemPanelOpen, setIsAddingItemPanelOpen] = useState(false);

  // States for Inline Editing of an item already in the order
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemPrice, setEditingItemPrice] = useState<number>(0);
  const [editingItemQty, setEditingItemQty] = useState<number>(1);

  // ==================== SERVICE MANAGEMENT STATE ====================
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState<number>(0);
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceBadge, setServiceBadge] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);

  // ==================== CATEGORY & ITEM STATE ====================
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  const [editingItemInCat, setEditingItemInCat] = useState<{ catId: string; itemName: string } | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [isAddingItemToCatId, setIsAddingItemToCatId] = useState<string | null>(null);

  // ==================== CUSTOMER MANAGEMENT STATE ====================
  const [customerSearch, setCustomerSearch] = useState('');
  const [editingCustomerPhone, setEditingCustomerPhone] = useState<string | null>(null);
  const [custFormName, setCustFormName] = useState('');
  const [custFormPhone, setCustFormPhone] = useState('');
  const [custFormEmail, setCustFormEmail] = useState('');
  const [custFormAddress, setCustFormAddress] = useState('');
  const [custFormNotes, setCustFormNotes] = useState('');
  const [deletingCustomerPhone, setDeletingCustomerPhone] = useState<string | null>(null);

  // ==================== WEBPAGE SETTINGS STATE ====================
  const [promoText, setPromoText] = useState(webInfo.promoText);
  const [bannerTitle, setBannerTitle] = useState(webInfo.heroBannerTitle);
  const [bannerText, setBannerText] = useState(webInfo.heroBannerText);
  const [bannerVisible, setBannerVisible] = useState(webInfo.heroBannerVisible);
  const [adminPhone, setAdminPhone] = useState(webInfo.adminWhatsapp);
  const [newOpHour, setNewOpHour] = useState('');

  // ==================== SAAS REDESIGN INTERACTIVE STATES ====================
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [topSearch, setTopSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [activeChartTab, setActiveChartTab] = useState<'revenue' | 'orders'>('revenue');

  // ==================== FINANCIAL REPORTS STATES ====================
  const [reportFilter, setReportFilter] = useState<'hari-ini' | 'kemarin' | 'minggu-ini' | 'bulan-ini' | 'tahun-ini' | 'custom'>('bulan-ini');
  const [customStartDate, setCustomStartDate] = useState('2026-06-01');
  const [customEndDate, setCustomEndDate] = useState('2026-06-28');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportSortField, setReportSortField] = useState<'order_id' | 'created_at' | 'customer_name' | 'grand_total' | 'order_status'>('created_at');
  const [reportSortOrder, setReportSortOrder] = useState<'asc' | 'desc'>('desc');
  const [reportCurrentPage, setReportCurrentPage] = useState(1);
  const [reportItemsPerPage, setReportItemsPerPage] = useState(10);

  // ==================== REAL-TIME FIRESTORE CUSTOMERS STATE ====================
  const [firestoreCustomers, setFirestoreCustomers] = useState<Customer[]>(() => getRegisteredUsers());

  useEffect(() => {
    const unsubscribe = listenToUsersInFirestore((users) => {
      // Filter out admin users from lists for client view simplicity
      const onlyCustomers = users.filter(u => u.role !== 'admin');
      setFirestoreCustomers(onlyCustomers);
    });
    return () => unsubscribe();
  }, []);

  // ==================== COMPUTED CUSTOMERS LIST ====================
  const customerList = useMemo(() => {
    const registered = firestoreCustomers;
    const map = new Map<string, { 
      name: string; 
      phone: string; 
      email: string; 
      address: string; 
      notes: string; 
      ordersCount: number;
      latitude?: number;
      longitude?: number;
      location_updated_at?: string;
      provider?: string;
      status?: string;
      createdAt?: string;
      lastLogin?: string;
      uid?: string;
    }>();
    
    // Seed map with all registered non-admin customers
    registered.forEach(user => {
      if (user.role === 'admin') return;
      const phone = (user.phone || '').trim();
      map.set(phone, {
        name: user.name,
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || '',
        notes: '',
        ordersCount: 0,
        latitude: user.latitude,
        longitude: user.longitude,
        location_updated_at: user.location_updated_at,
        provider: user.provider || (user.google_linked ? 'Google' : 'Email'),
        status: user.status || 'Active',
        createdAt: user.createdAt || user.location_updated_at,
        lastLogin: user.lastLogin || user.location_updated_at,
        uid: user.uid
      });
    });

    // Aggregate with existing orders to count them and find notes, or add one-off customers
    orders.forEach(order => {
      const phone = (order.whatsapp || '').trim();
      const existing = map.get(phone);
      if (existing) {
        existing.ordersCount += 1;
        if (order.notes && !existing.notes) {
          existing.notes = order.notes;
        }
        if (order.coordinates && !existing.latitude && !existing.longitude) {
          existing.latitude = order.coordinates[0];
          existing.longitude = order.coordinates[1];
        }
      } else {
        map.set(phone, {
          name: order.customer_name,
          phone: order.whatsapp,
          email: order.email || '',
          address: order.address || '',
          notes: order.notes || '',
          ordersCount: 1,
          latitude: order.coordinates ? order.coordinates[0] : undefined,
          longitude: order.coordinates ? order.coordinates[1] : undefined,
          provider: 'Email',
          status: 'Active',
          createdAt: order.created_at,
          lastLogin: order.created_at
        });
      }
    });
    
    return Array.from(map.values()).filter(cust => {
      const q = customerSearch.toLowerCase();
      return cust.name.toLowerCase().includes(q) || cust.phone.includes(q) || cust.address.toLowerCase().includes(q) || (cust.email && cust.email.toLowerCase().includes(q));
    });
  }, [orders, customerSearch, firestoreCustomers]);

  // ==================== ORDER LIST FILTERS ====================
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.whatsapp.includes(searchQuery) ||
        order.order_id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'Semua' || order.order_status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => b.order_id.localeCompare(a.order_id));
  }, [orders, searchQuery, statusFilter]);

  // ==================== ORDER CRUD HANDLERS ====================
  const handleStartEdit = (order: Order) => {
    setEditingOrderId(order.order_id);
    setEditFormData(JSON.parse(JSON.stringify(order))); // Deep copy
    setIsAddingItemPanelOpen(false);
    setEditingItemIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setEditFormData(null);
    setIsAddingItemPanelOpen(false);
    setEditingItemIndex(null);
  };

  const handleSaveOrderEdit = () => {
    if (!editFormData) return;
    onUpdateOrder(editFormData);
    setEditingOrderId(null);
    setEditFormData(null);
    setIsAddingItemPanelOpen(false);
    setEditingItemIndex(null);
  };

  const recalculateOrderTotals = (updatedItems: OrderItem[], additionalService?: 'reguler' | 'ekspres') => {
    if (!editFormData) return;
    const itemsSubtotal = updatedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const service = additionalService || editFormData.additional_service;
    const additionalFee = service === 'ekspres' ? 10000 : 0;
    const grandTotal = itemsSubtotal + additionalFee;

    setEditFormData({
      ...editFormData,
      item_details: updatedItems,
      subtotal: itemsSubtotal,
      additional_fee: additionalFee,
      grand_total: grandTotal,
      updated_at: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    });
  };

  const handleEditItemQty = (index: number, newQty: number) => {
    if (!editFormData) return;
    const updatedItems = [...editFormData.item_details];
    if (newQty <= 0) {
      updatedItems.splice(index, 1);
    } else {
      updatedItems[index].qty = newQty;
      updatedItems[index].itemSubtotal = updatedItems[index].price * newQty;
    }
    recalculateOrderTotals(updatedItems);
  };

  const handleDeleteItem = (index: number) => {
    if (!editFormData) return;
    const updatedItems = [...editFormData.item_details];
    updatedItems.splice(index, 1);
    recalculateOrderTotals(updatedItems);
  };

  const handleStartEditItem = (index: number, item: OrderItem) => {
    setEditingItemIndex(index);
    setEditingItemPrice(item.price);
    setEditingItemQty(item.qty);
  };

  const handleSaveItemChanges = (index: number) => {
    if (!editFormData) return;
    const updatedItems = [...editFormData.item_details];
    updatedItems[index].price = editingItemPrice;
    updatedItems[index].qty = editingItemQty;
    updatedItems[index].itemSubtotal = editingItemPrice * editingItemQty;
    recalculateOrderTotals(updatedItems);
    setEditingItemIndex(null);
  };

  const handleCategoryChange = (catName: string) => {
    setSelectedCategory(catName);
    const cat = categoriesDb.find(c => c.name === catName);
    if (cat && cat.items.length > 0) {
      setSelectedItemName(cat.items[0].name);
      setCustomItemPrice(cat.items[0].price);
    }
  };

  const handleItemNameChange = (name: string) => {
    setSelectedItemName(name);
    const cat = categoriesDb.find(c => c.name === selectedCategory);
    const item = cat?.items.find(i => i.name === name);
    if (item) {
      setCustomItemPrice(item.price);
    }
  };

  const handleAddNewItem = () => {
    if (!editFormData) return;
    const existingIdx = editFormData.item_details.findIndex(i => i.name === selectedItemName);
    let updatedItems = [...editFormData.item_details];

    if (existingIdx > -1) {
      updatedItems[existingIdx].qty += customItemQty;
      updatedItems[existingIdx].itemSubtotal = updatedItems[existingIdx].price * updatedItems[existingIdx].qty;
    } else {
      updatedItems.push({
        name: selectedItemName,
        qty: customItemQty,
        price: customItemPrice,
        itemSubtotal: customItemPrice * customItemQty
      });
    }

    recalculateOrderTotals(updatedItems);
    setCustomItemQty(1);
  };

  const handleDeleteOrderClick = (orderId: string) => {
    setDeletingOrderId(orderId);
  };

  const handleConfirmDelete = (orderId: string) => {
    onDeleteOrder(orderId);
    setDeletingOrderId(null);
  };

  // ==================== SERVICES CRUD HANDLERS ====================
  const handleStartEditService = (service: AdminService) => {
    setEditingServiceId(service.id);
    setServiceName(service.name);
    setServiceDesc(service.description);
    setServiceBadge(service.category);
  };

  const handleSaveService = () => {
    if (!serviceName) return;
    let updated = [...services];
    if (editingServiceId) {
      // Edit mode
      updated = updated.map(s => s.id === editingServiceId ? {
        ...s,
        name: serviceName,
        description: serviceDesc,
        category: serviceBadge
      } : s);
    } else {
      // Add mode
      const newId = serviceName.toLowerCase().replace(/\s+/g, '-');
      updated.push({
        id: newId,
        name: serviceName,
        category: serviceBadge || 'Layanan Premium',
        description: serviceDesc,
        icon: 'Shirt',
        isActive: true
      });
    }
    onUpdateServices(updated);
    setEditingServiceId(null);
    setIsAddingService(false);
    setServiceName('');
    setServiceDesc('');
    setServiceBadge('');
  };

  const handleToggleService = (id: string) => {
    const updated = services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    onUpdateServices(updated);
  };

  const handleDeleteService = (id: string) => {
    const updated = services.filter(s => s.id !== id);
    onUpdateServices(updated);
  };

  // ==================== CATEGORIES & ITEMS CRUD HANDLERS ====================
  const handleSaveCategory = () => {
    if (!catName) return;
    let updated = [...categories];
    if (editingCatId) {
      updated = updated.map(c => c.id === editingCatId ? { ...c, name: catName, icon: catIcon } : c);
    } else {
      const newId = catName.toLowerCase().replace(/\s+/g, '-');
      updated.push({
        id: newId,
        name: catName,
        icon: catIcon || '👕',
        items: []
      });
    }
    onUpdateCategories(updated);
    setEditingCatId(null);
    setIsAddingCat(false);
    setCatName('');
    setCatIcon('');
  };

  const handleDeleteCategory = (catId: string) => {
    const updated = categories.filter(c => c.id !== catId);
    onUpdateCategories(updated);
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const updated = [...categories];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    
    onUpdateCategories(updated);
  };

  const handleSaveItemInCat = (catId: string) => {
    if (!itemName) return;
    let updated = [...categories];
    const catIdx = updated.findIndex(c => c.id === catId);
    if (catIdx === -1) return;

    let itemsList = [...updated[catIdx].items];
    if (editingItemInCat) {
      // Edit
      itemsList = itemsList.map(i => i.name === editingItemInCat.itemName ? {
        ...i,
        name: itemName,
        price: itemPrice
      } : i);
    } else {
      // Add
      const newItemId = 'item-' + itemName.toLowerCase().replace(/\s+/g, '-');
      itemsList.push({
        id: newItemId,
        name: itemName,
        price: itemPrice,
        isActive: true
      });
    }

    updated[catIdx].items = itemsList;
    onUpdateCategories(updated);
    setEditingItemInCat(null);
    setIsAddingItemToCatId(null);
    setItemName('');
    setItemPrice(0);
  };

  const handleToggleItemInCat = (catId: string, itemIdx: number) => {
    const updated = [...categories];
    const catIdx = updated.findIndex(c => c.id === catId);
    if (catIdx > -1) {
      const itemsList = [...updated[catIdx].items];
      itemsList[itemIdx] = { ...itemsList[itemIdx], isActive: !itemsList[itemIdx].isActive };
      updated[catIdx].items = itemsList;
      onUpdateCategories(updated);
    }
  };

  const handleDeleteItemInCat = (catId: string, itemName: string) => {
    const updated = [...categories];
    const catIdx = updated.findIndex(c => c.id === catId);
    if (catIdx > -1) {
      updated[catIdx].items = updated[catIdx].items.filter(i => i.name !== itemName);
      onUpdateCategories(updated);
    }
  };

  // ==================== CUSTOMER DATA CRUD HANDLERS ====================
  const handleStartEditCustomer = (cust: any) => {
    setEditingCustomerPhone(cust.phone);
    setCustFormName(cust.name);
    setCustFormPhone(cust.phone);
    setCustFormEmail(cust.email || '');
    setCustFormAddress(cust.address);
    setCustFormNotes(cust.notes);
  };

  const handleSaveCustomer = () => {
    if (!custFormPhone || !custFormName) return;
    
    // Propagate changes globally to all orders corresponding to this customer phone!
    const updatedOrders = orders.map(order => {
      if (order.whatsapp.trim() === editingCustomerPhone?.trim()) {
        return {
          ...order,
          customer_name: custFormName,
          whatsapp: custFormPhone,
          email: custFormEmail,
          address: custFormAddress,
          notes: custFormNotes
        };
      }
      return order;
    });

    // Save to App State
    updatedOrders.forEach(o => onUpdateOrder(o));
    
    // Persist to Central Registered Users Database
    const registered = getRegisteredUsers();
    const existingUser = registered.find(u => (u.phone || '').trim() === editingCustomerPhone?.trim() || (editingCustomerPhone && (u.email || '').toLowerCase() === editingCustomerPhone.toLowerCase()));
    if (existingUser) {
      const updatedUser: Customer = {
        ...existingUser,
        name: custFormName,
        phone: custFormPhone,
        email: custFormEmail,
        address: custFormAddress
      };
      saveRegisteredUser(updatedUser);
    } else {
      const newUser: Customer = {
        name: custFormName,
        phone: custFormPhone,
        email: custFormEmail || `${custFormName.toLowerCase().replace(/\s+/g, '')}@lavender.com`,
        address: custFormAddress,
        points: 0,
        role: 'customer',
        orders: []
      };
      saveRegisteredUser(newUser);
    }

    setEditingCustomerPhone(null);
  };

  const handleConfirmDeleteCustomer = (uid: string, phone: string) => {
    // Delete associated orders as well to clean up customer completely
    orders.forEach(o => {
      if ((o.whatsapp || '').trim() === phone.trim()) {
        onDeleteOrder(o.order_id);
      }
    });

    // Delete from Firestore
    if (uid) {
      deleteUserFromFirestore(uid)
        .then(() => {
          alert("Data pelanggan berhasil dihapus!");
        })
        .catch(err => {
          console.error("Failed to delete customer from Firestore:", err);
          alert("Gagal menghapus data pelanggan dari Firestore.");
        });
    } else {
      console.warn("No Firestore Document ID (uid) found for this customer. Skipping Firestore deletion.");
    }

    // Optimistically update local firestore customers state so it disappears instantly from UI
    setFirestoreCustomers(prev => prev.filter(u => u.uid !== uid));

    // Delete from Central Registered Users Database
    const registered = getRegisteredUsers();
    const remainingUsers = registered.filter(u => {
      const uPhone = (u.phone || '').trim();
      const pPhone = phone.trim();
      const matchPhone = uPhone && pPhone && uPhone === pPhone;
      const matchUid = u.uid && uid && u.uid === uid;
      return !matchPhone && !matchUid;
    });
    localStorage.setItem('lavender_registered_users', JSON.stringify(remainingUsers));

    setDeletingCustomerPhone(null);
  };

  // ==================== WEBPAGE INFO SETTINGS HANDLERS ====================
  const handleSaveWebSettings = () => {
    onUpdateWebInfo({
      promoText,
      heroBannerTitle: bannerTitle,
      heroBannerText: bannerText,
      heroBannerVisible: bannerVisible,
      adminWhatsapp: adminPhone,
      operationalHours: webInfo.operationalHours,
      terms: webInfo.terms
    });
    alert('Informasi website berhasil diperbarui!');
  };

  const handleAddOpHour = () => {
    if (!newOpHour) return;
    const updatedHours = [...webInfo.operationalHours, newOpHour];
    onUpdateWebInfo({ ...webInfo, operationalHours: updatedHours });
    setNewOpHour('');
  };

  const handleDeleteOpHour = (idx: number) => {
    const updatedHours = webInfo.operationalHours.filter((_, i) => i !== idx);
    onUpdateWebInfo({ ...webInfo, operationalHours: updatedHours });
  };

  return (
    <div className={`min-h-screen w-full bg-[#F8F7FF] flex font-sans select-none overflow-hidden ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'text-slate-800'}`}>
      
      {/* Real-time Order Notifications Popup Overlay */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {notifications.map(notif => (
            <div key={notif.id} className="pointer-events-auto">
              <OrderNotificationToast
                notification={notif}
                onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
                onView={(orderId) => {
                  setActiveTab('orders');
                  setStatusFilter('Semua');
                  setSearchQuery(orderId);
                  setNotifications(prev => prev.filter(n => n.orderId !== orderId));
                }}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* 1. SaaS Midnight Sidebar Container */}
      <aside 
        className={`bg-[#1F1147] text-slate-100 flex flex-col h-screen transition-all duration-300 relative z-30 shadow-2xl border-r border-purple-950/40 shrink-0 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-purple-900/60 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] flex items-center justify-center shadow-lg border border-[#D4AF37]/30 shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-wider text-purple-250 uppercase bg-clip-text text-transparent bg-gradient-to-r from-purple-100 via-indigo-100 to-white">
                  SUSYI LAUNDRY
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Sidebar List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-purple-900">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tag: 'Overview' },
            { id: 'orders', label: 'Data Pesanan', icon: ShoppingBag, badge: orders.length },
            { id: 'customers', label: 'Data Pelanggan', icon: Users, badge: customerList.length },
            { id: 'services', label: 'Manajemen Layanan', icon: Layers, tag: 'Layanan' },
            { id: 'categories', label: 'Item Laundry', icon: Tag },
            { id: 'reports', label: 'Laporan & Analitik', icon: TrendingUp },
          ].map((item) => {
            const isActive = activeTab === item.id;
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  if (window.innerWidth < 768) {
                    setIsSidebarCollapsed(true);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer relative group ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30 border border-purple-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-purple-950/40'
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <IconComponent className={`w-4.5 h-4.5 shrink-0 transition-transform ${isActive ? 'scale-110 text-amber-300' : 'group-hover:scale-110'}`} />
                
                {!isSidebarCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {/* Badges/Tags */}
                {!isSidebarCollapsed && item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                    isActive ? 'bg-white/25 text-white' : 'bg-purple-900 text-purple-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {!isSidebarCollapsed && item.tag && isActive && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-purple-950 text-[8px] font-black uppercase shrink-0">
                    {item.tag}
                  </span>
                )}

                {/* Collapsed Tooltip */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1.5 bg-[#1F1147] text-white text-[10px] rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-purple-900/50 z-50">
                    {item.label} {item.badge !== undefined ? `(${item.badge})` : ''}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer - Admin Profile Quickview */}
        <div className="p-4 border-t border-purple-900/60 bg-purple-950/30 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md border border-purple-400/20">
                A
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#1F1147] animate-pulse"></span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate text-white">Admin Susyi</p>
              </div>
            )}
            {!isSidebarCollapsed && (
              <button 
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="p-1.5 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 rounded-lg transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Collapse Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute top-1/2 -translate-y-1/2 -right-3 w-6.5 h-6.5 rounded-full bg-purple-600 text-white border border-purple-400/30 flex items-center justify-center shadow-lg hover:bg-purple-500 transition-colors z-50 cursor-pointer hidden md:flex"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </aside>

      {/* 2. SaaS Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* Top Header Navigation Bar */}
        <header className="h-16 border-b border-slate-150 bg-white shadow-xs px-6 flex items-center justify-between shrink-0 relative z-20">
          
          {/* Left: Mobile Toggle & Header Search */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative hidden sm:block w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={topSearch}
                onChange={(e) => {
                  setTopSearch(e.target.value);
                  // Global smart input mapping to orders search query
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'orders' && activeTab !== 'customers' && e.target.value) {
                    setActiveTab('orders');
                  }
                }}
                placeholder="Search orders, clients, transactions..."
                className="w-full pl-10 pr-12 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200/80 focus:border-purple-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-200/50 text-[9px] text-slate-400 font-black font-mono">
                ⌘K
              </div>
            </div>
          </div>

          {/* Right: Notifications, Home button */}
          <div className="flex items-center gap-3">

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                }}
                className={`p-2 hover:bg-slate-50 rounded-xl text-slate-505 hover:text-purple-600 transition-colors cursor-pointer relative ${showNotifications ? 'bg-purple-50 text-purple-600' : ''}`}
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border border-white animate-pulse"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl shadow-xl border border-slate-150 py-3 z-50 text-xs">
                  <div className="px-4 pb-2 border-b border-slate-100 flex justify-between items-center font-bold">
                    <span className="text-slate-800">Aktivitas Sistem Terbaru</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Aktif</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                    {orders.slice(0, 4).map((order, idx) => (
                      <div 
                        key={idx} 
                        className="p-3.5 hover:bg-slate-50/70 transition-colors flex gap-3 cursor-pointer"
                        onClick={() => {
                          setShowNotifications(false);
                          setActiveTab('orders');
                          setSearchQuery(order.order_id);
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800">Order Baru {order.order_id}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Customer {order.customer_name} telah memesan service.</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-1">{order.created_at}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* 3. Main Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8F7FF] min-h-0 w-full">
        
        {/* TAB 0: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in pb-12">
            
            {/* SaaS Gradient Welcome Banner */}
            <div className="relative rounded-[24px] bg-gradient-to-r from-[#1F1147] via-[#321877] to-[#140A32] p-6 md:p-8 text-white overflow-hidden shadow-xl border border-purple-950/50">
              {/* Background abstract circles */}
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2.5 max-w-xl">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest text-[#D4AF37] uppercase border border-white/10">
                    <Sparkles className="w-3 h-3 animate-spin" />
                    Admin Control Center
                  </span>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
                    Selamat Datang Kembali, Admin <span className="animate-pulse">👋</span>
                  </h2>
                  <p className="text-xs text-purple-200 leading-relaxed font-medium">
                    Hari ini, {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}. 
                    Anda memiliki <strong className="text-amber-300 font-black">{orders.filter(o => o.order_status === 'Menunggu Konfirmasi').length} pesanan baru</strong> yang menunggu konfirmasi.
                  </p>

                </div>


              </div>
            </div>

            {/* Redesigned Four Dashboard Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              


              {/* Stat 2: Total Orders */}
              <div className="bg-white p-5 rounded-[20px] border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                    +8.5%
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pesanan</p>
                  <h3 className="text-base font-black text-slate-800 tracking-tight mt-0.5">
                    {orders.length} <span className="text-xs text-slate-400 font-normal">Antrean</span>
                  </h3>
                  {/* Miniature Sparkline */}
                  <div className="mt-2 h-6 w-full">
                    <svg className="w-full h-full" viewBox="0 0 100 25">
                      <path d="M0 15 L20 10 L40 18 L60 8 L80 12 L100 3" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Stat 3: Total Customers */}
              <div className="bg-white p-5 rounded-[20px] border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                    +18.1%
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Customer</p>
                  <h3 className="text-base font-black text-slate-800 tracking-tight mt-0.5">
                    {customerList.length} <span className="text-xs text-slate-400 font-normal">Orang</span>
                  </h3>
                  {/* Miniature Sparkline */}
                  <div className="mt-2 h-6 w-full">
                    <svg className="w-full h-full" viewBox="0 0 100 25">
                      <path d="M0 22 L20 19 L40 12 L60 17 L80 8 L100 5" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Stat 4: Pending Confirmation */}
              <div className="bg-white p-5 rounded-[20px] border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                {(() => {
                  const pending = orders.filter(o => o.order_status === 'Menunggu Konfirmasi').length;
                  return (
                    <>
                      <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-xl border ${pending > 0 ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        {pending > 0 && (
                          <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-bounce">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Butuh Konfirmasi</p>
                        <h3 className="text-base font-black text-slate-800 tracking-tight mt-0.5">
                          {pending} <span className="text-xs text-slate-400 font-normal">Antrean</span>
                        </h3>
                        <div className="mt-2 h-6 w-full flex items-center">
                          <span className={`text-[10px] font-bold ${pending > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {pending > 0 ? '⚠️ Segera konfirmasi!' : '✅ Bersih & Aman'}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Stat 5: Completed Orders */}
              <div className="bg-white p-5 rounded-[20px] border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                    <Check className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Selesai
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selesai Dicuci</p>
                  <h3 className="text-base font-black text-slate-800 tracking-tight mt-0.5">
                    {orders.filter(o => o.order_status === 'Selesai').length} <span className="text-xs text-slate-400 font-normal">Baju</span>
                  </h3>
                  <div className="mt-2 h-6 w-full flex items-center">
                    <span className="text-[10px] font-bold text-emerald-600">
                      100% Selesai Sempurna
                    </span>
                  </div>
                </div>
              </div>



            </div>

            {/* Dashboard Split Sections Grid */}
            <div className="space-y-6">
                


                {/* 2. Premium Antrean Pesanan Terbaru Table */}
                <div className="bg-white p-6 rounded-[20px] border border-slate-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <ShoppingBag className="w-4.5 h-4.5 text-purple-600" />
                        📋 Antrean &amp; Distribusi Pesanan Terbaru
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Tampilan cepat 5 aktivitas laundry terkini</p>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveTab('orders');
                        setSearchQuery('');
                        setStatusFilter('Semua');
                      }}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-black rounded-lg border border-purple-200 transition-all cursor-pointer"
                    >
                      Lihat Semua
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-300" />
                      Belum ada aktivitas pesanan laundry saat ini.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[550px] border-collapse">
                        <thead>
                          <tr className="text-slate-400 font-extrabold uppercase tracking-widest text-[9px] border-b border-slate-100">
                            <th className="pb-2.5">ID Order</th>
                            <th className="pb-2.5">Customer</th>
                            <th className="pb-2.5">Tanggal Masuk</th>
                            <th className="pb-2.5">Total Bayar</th>
                            <th className="pb-2.5">Status Alur</th>
                            <th className="pb-2.5 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {orders.slice(0, 5).map((order) => {
                            let statusColor = 'bg-slate-50 text-slate-600 border-slate-200/50';
                            if (order.order_status === 'Menunggu Konfirmasi') statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
                            else if (order.order_status === 'Diproses' || order.order_status === 'Dicuci' || order.order_status === 'Disetrika') statusColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                            else if (order.order_status === 'Siap Diantar') statusColor = 'bg-purple-50 text-purple-700 border-purple-200';
                            else if (order.order_status === 'Selesai') statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            else if (order.order_status === 'Dibatalkan') statusColor = 'bg-rose-50 text-rose-700 border-rose-200';

                            return (
                              <tr key={order.order_id} className="hover:bg-slate-50/50 transition-colors duration-200">
                                <td className="py-3.5 font-mono font-black text-purple-900">{order.order_id}</td>
                                <td className="py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-[10px]">
                                      {order.customer_name[0] || 'C'}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-800">{order.customer_name}</p>
                                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{order.whatsapp}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 text-slate-500 font-medium">{order.created_at || 'Baru'}</td>
                                <td className="py-3.5 font-black text-slate-800">Rp {(order.grand_total || 0).toLocaleString('id-ID')}</td>
                                <td className="py-3.5">
                                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${statusColor}`}>
                                    {order.order_status}
                                  </span>
                                </td>
                                <td className="py-3.5 text-right">
                                  <button
                                    onClick={() => {
                                      setActiveTab('orders');
                                      setSearchQuery(order.order_id);
                                    }}
                                    className="px-2.5 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 rounded-lg text-[10px] font-bold border border-purple-100 transition-colors cursor-pointer"
                                  >
                                    Ubah Sesi
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

            </div>
          </div>
        )}

        {/* TAB 1: ORDERS LIST (Full CRUD) */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Quick Search and Status Filter */}
            <div className="p-4 rounded-2xl bg-white border border-slate-250/40 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari ID pesanan, Nama Customer, No. WhatsApp..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-600" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-semibold py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-700 cursor-pointer focus:outline-none focus:border-purple-600"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Dicuci">Dicuci</option>
                  <option value="Disetrika">Disetrika</option>
                  <option value="Siap Diantar">Siap Diantar</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>
            </div>

            {/* Orders container */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-250">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-sm font-semibold">Tidak ditemukan data pesanan laundry.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order) => {
                  return (
                    <div
                      key={order.order_id}
                      className="bg-white rounded-3xl border border-slate-150 hover:border-purple-200 hover:shadow-md transition-all duration-300 p-6 shadow-sm"
                    >
                      {/* Order Header Block */}
                      <div className="flex flex-col md:flex-row justify-between gap-4 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-sm font-black text-purple-950 bg-purple-100 px-2.5 py-0.5 rounded-md">
                              {order.order_id}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              Diinput: {order.created_at}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-[#B78A62] shrink-0" />
                              <span className="text-slate-700 font-extrabold">{order.customer_name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-[#B78A62] shrink-0" />
                              <span className="text-slate-600 font-medium">{order.whatsapp}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs shrink-0">✉️</span>
                              <span className="text-slate-600 font-medium truncate max-w-[150px]" title={order.email}>{order.email || 'Tidak ada email'}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-[#B78A62] shrink-0" />
                              <span className="text-slate-600 font-medium">{order.pickup_date}</span>
                            </div>

                            <div className="flex flex-col gap-1 sm:col-span-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-[#B78A62] shrink-0" />
                                <span className="text-slate-600 font-medium leading-relaxed truncate max-w-lg">{order.address}</span>
                              </div>
                              {order.coordinates && order.coordinates.length === 2 && (
                                <div className="space-y-2 mt-2 pl-5.5 max-w-lg">
                                  <div className="flex flex-wrap gap-2 items-center text-[10px]">
                                    <span className="bg-purple-50 text-purple-700 font-mono px-1.5 py-0.5 rounded border border-purple-100/50">
                                      🛰️ Lat: {order.coordinates[0].toFixed(6)}, Lng: {order.coordinates[1].toFixed(6)}
                                    </span>
                                    {order.routeType && (
                                      <span className="bg-blue-50 text-blue-700 font-sans font-semibold px-1.5 py-0.5 rounded border border-blue-100/50">
                                        🛣️ Rute: {order.routeType}
                                      </span>
                                    )}
                                    {order.routeDistance !== undefined && (
                                      <span className="bg-emerald-50 text-emerald-700 font-sans font-semibold px-1.5 py-0.5 rounded border border-emerald-100/50">
                                        📏 Jarak: {order.routeDistance} km
                                      </span>
                                    )}
                                    {order.routeDuration !== undefined && (
                                      <span className="bg-amber-50 text-amber-700 font-sans font-semibold px-1.5 py-0.5 rounded border border-amber-100/50">
                                        ⏱️ Durasi: {order.routeDuration} mnt
                                      </span>
                                    )}
                                    <a 
                                      href={`https://www.google.com/maps/search/?api=1&query=${order.coordinates[0]},${order.coordinates[1]}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-0.5 font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                    >
                                      🗺️ Google Maps
                                    </a>
                                  </div>
                                  <div className="w-full h-52 rounded-2xl overflow-hidden border border-slate-200 shadow-xs relative z-0">
                                    <CustomerOrderMap 
                                      orderCoords={[order.coordinates[0], order.coordinates[1]]} 
                                      orderAddress={order.address} 
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-[#B78A62] shrink-0" />
                              <span className="text-amber-800 font-bold">{order.pickup_time} WIB</span>
                            </div>
                          </div>

                          <div className="mt-2 text-xs flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[#B78A62] font-semibold shrink-0">Catatan:</span>
                            <p className="italic text-slate-500 font-medium">"{order.notes || 'Tidak ada catatan'}"</p>
                          </div>


                        </div>

                        {/* Order action handles */}
                        <div className="flex flex-col items-end gap-3 self-start">
                          {deletingOrderId === order.order_id ? (
                            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-1.5 rounded-2xl shadow-xs shrink-0">
                              <span className="text-[10px] text-rose-750 font-extrabold px-1.5 whitespace-nowrap">Yakin hapus?</span>
                              <button
                                onClick={() => handleConfirmDelete(order.order_id)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-xs whitespace-nowrap"
                              >
                                Ya, Hapus
                              </button>
                              <button
                                onClick={() => setDeletingOrderId(null)}
                                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDeleteOrderClick(order.order_id)}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Hapus Pesanan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus Pesanan
                            </button>
                          )}

                          <div className="space-y-1.5 text-right">
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mr-1 mb-1">Status Pesanan:</span>
                              <select
                                value={order.order_status}
                                onChange={(e) => {
                                  onUpdateOrder({
                                    ...order,
                                    order_status: e.target.value as any,
                                    updated_at: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                  });
                                }}
                                className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase border cursor-pointer focus:outline-none transition-colors ${
                                  order.order_status === 'Selesai' 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                    : order.order_status === 'Dibatalkan'
                                    ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                    : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
                                }`}
                              >
                                <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                                <option value="Diproses">Diproses</option>
                                <option value="Dicuci">Dicuci</option>
                                <option value="Disetrika">Disetrika</option>
                                <option value="Siap Diantar">Siap Diantar</option>
                                <option value="Selesai">Selesai</option>
                                <option value="Dibatalkan">Dibatalkan</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Services details mapping */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Layanan Utama:</span>
                              <strong className="text-purple-900 font-extrabold text-sm block">
                                {order.main_service}
                              </strong>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kecepatan Selesai:</span>
                              <strong className="text-slate-700 font-extrabold text-xs block uppercase">
                                {order.additional_service === 'ekspres' ? '⚡ EKSPRES' : '🐢 REGULER'}
                              </strong>
                            </div>
                          </div>

                          <div className="bg-purple-950/5 p-4 rounded-2xl border border-purple-100/40 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-500">
                              <span>Subtotal Item:</span>
                              <span className="font-semibold text-slate-700">
                                Rp {order.subtotal.toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>Biaya Tambahan:</span>
                              <span className="font-semibold text-amber-600">
                                + Rp {order.additional_fee.toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-purple-100 text-sm font-bold">
                              <span className="text-slate-800">Grand Total:</span>
                              <span className="text-purple-700 font-black">
                                Rp {order.grand_total.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Items detail loop */}
                        <div className="md:col-span-2">
                          <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-purple-600" />
                                Rincian Item Laundry ({order.item_details.length} item)
                              </h4>
                            </div>

                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                              {order.item_details.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs py-2 px-1 border-b border-slate-100 hover:bg-slate-50/50 rounded-lg">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-bold text-slate-700 block truncate">{item.name}</span>
                                    <span className="text-slate-400 text-[10px]">
                                      Rp {item.price.toLocaleString('id-ID')} / pcs
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-500 font-bold">x{item.qty} pcs</span>
                                    </div>

                                    <div className="w-24 text-right font-extrabold text-slate-800">
                                      Rp {item.itemSubtotal.toLocaleString('id-ID')}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CUSTOMERS DIRECTORY */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Cari Pelanggan berdasarkan nama, nomor telepon, atau alamat..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-4 px-6">Nama Lengkap</th>
                      <th className="py-4 px-6">Nomor WhatsApp</th>
                      <th className="py-4 px-6">Email</th>
                      <th className="py-4 px-6">Alamat Utama (GPS)</th>
                      <th className="py-4 px-6 text-center">Provider Login</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6">Tanggal Registrasi</th>
                      <th className="py-4 px-6">Login Terakhir</th>
                      <th className="py-4 px-6 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                    {customerList.map((cust) => {
                      // Format dates nicely in Indonesian language
                      const formatDate = (isoStr?: string) => {
                        if (!isoStr) return '-';
                        try {
                          return new Date(isoStr).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        } catch (e) {
                          return isoStr;
                        }
                      };

                      return (
                        <tr key={cust.phone} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-800">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-purple-600 shrink-0" />
                              <span>{cust.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-600">{cust.phone}</td>
                          <td className="py-4 px-6 text-slate-500">{cust.email || '-'}</td>
                          <td className="py-4 px-6 max-w-xs">
                            <p className="line-clamp-2 leading-relaxed" title={cust.address}>{cust.address || 'Alamat belum diatur'}</p>
                            {cust.latitude && cust.longitude && (
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${cust.latitude},${cust.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 mt-1 font-bold text-indigo-600 hover:text-indigo-800 transition-colors text-[10px]"
                              >
                                🛰️ Lihat GPS
                              </a>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cust.provider === 'Google' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                : cust.provider === 'Email + Google'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                : 'bg-slate-100 text-slate-750 border border-slate-200'
                            }`}>
                              {cust.provider || 'Email'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {cust.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-400 font-sans text-[11px]">
                            {formatDate(cust.createdAt)}
                          </td>
                          <td className="py-4 px-6 text-slate-400 font-sans text-[11px]">
                            {formatDate(cust.lastLogin)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center">
                              {deletingCustomerPhone === cust.phone ? (
                                <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-xl text-[10px]">
                                  <span className="text-rose-700 font-extrabold px-1">Hapus?</span>
                                  <button
                                    onClick={() => {
                                      handleConfirmDeleteCustomer(cust.uid || '', cust.phone);
                                      setDeletingCustomerPhone(null);
                                    }}
                                    className="px-2 py-0.5 bg-rose-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                  >
                                    Ya
                                  </button>
                                  <button
                                    onClick={() => setDeletingCustomerPhone(null)}
                                    className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeletingCustomerPhone(cust.phone)}
                                  className="text-rose-500 hover:text-rose-700 p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Pelanggan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {customerList.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                          Tidak ada data pelanggan yang cocok dengan pencarian Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SERVICES MANAGEMENT (CRUD) */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Manajemen Layanan Utama</h3>
                <p className="text-xs text-slate-400 mt-0.5">Edit tariff dasar, deskripsi, dan status aktif layanan laundry customer.</p>
              </div>
              <button
                onClick={() => {
                  setIsAddingService(true);
                  setEditingServiceId(null);
                  setServiceName('');
                  setServicePrice(0);
                  setServiceDesc('');
                  setServiceBadge('');
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Layanan Baru
              </button>
            </div>

            {/* Service Form Panel (Add / Edit inline) */}
            {(isAddingService || editingServiceId) && (
              <div className="bg-white border border-purple-200 rounded-3xl p-6 shadow-sm space-y-4 max-w-2xl">
                <h4 className="text-sm font-bold text-purple-900 border-b border-purple-100 pb-2 flex items-center gap-1.5">
                  🛡️ {editingServiceId ? 'Edit Layanan' : 'Layanan Baru'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Nama Layanan:</label>
                    <input
                      type="text"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="Contoh: Cuci Komplit, Setrika Saja"
                      className="w-full p-2 border border-slate-250 rounded-xl bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Harga Mulai (Rp):</label>
                    <input
                      type="number"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(Number(e.target.value))}
                      className="w-full p-2 border border-slate-250 rounded-xl bg-slate-50"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-600 block mb-1">Badge Spesial:</label>
                    <input
                      type="text"
                      value={serviceBadge}
                      onChange={(e) => setServiceBadge(e.target.value)}
                      placeholder="Contoh: Populer, Terlaris, Hemat"
                      className="w-full p-2 border border-slate-250 rounded-xl bg-slate-50"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-600 block mb-1">Deskripsi Layanan (Pemisah baris dengan koma):</label>
                    <textarea
                      rows={3}
                      value={serviceDesc}
                      onChange={(e) => setServiceDesc(e.target.value)}
                      placeholder="Deskripsikan fitur layanan. Contoh: Dicuci bersih, Disetrika rapi, Parfum mewah"
                      className="w-full p-2 border border-slate-250 rounded-xl bg-slate-50 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={handleSaveService}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Simpan Layanan
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingService(false);
                      setEditingServiceId(null);
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Services Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`bg-white p-6 rounded-3xl border shadow-xs flex flex-col justify-between gap-4 transition-all duration-300 ${
                    service.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-100/50 opacity-70'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{service.name}</h4>
                        {service.category && (
                          <span className="inline-block mt-1 text-[9px] font-bold bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {service.category}
                          </span>
                        )}
                      </div>
                      
                      {/* Active Toggle */}
                      <button
                        onClick={() => handleToggleService(service.id)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          service.isActive ? 'text-purple-600' : 'text-slate-400'
                        }`}
                        title={service.isActive ? "Nonaktifkan Layanan" : "Aktifkan Layanan"}
                      >
                        {service.isActive ? (
                          <ToggleRight className="w-8 h-8" />
                        ) : (
                          <ToggleLeft className="w-8 h-8" />
                        )}
                      </button>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-purple-700 font-extrabold text-[11px]">
                        Layanan Satuan Interaktif
                      </p>
                      <p className="text-slate-400 text-[11px] leading-relaxed italic mt-1.5">
                        "{service.description || 'Tidak ada deskripsi'}"
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-50">
                    <button
                      onClick={() => handleStartEditService(service)}
                      className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-[11px] font-bold border border-purple-150 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                      title="Hapus Layanan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORIES & ITEMS MANAGEMENT (CRUD) */}
        {activeTab === 'categories' && (
          <div id="categories-tab-content" className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Manajemen Kategori &amp; Laundry Items</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kelola tarif pakaian, sprei, selimut, boneka, aksesoris, dan golongannya.</p>
              </div>
              <button
                onClick={() => {
                  setIsAddingCat(true);
                  setEditingCatId(null);
                  setCatName('');
                  setCatIcon('');
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Kategori Baru
              </button>
            </div>

            {/* Category Form Panel */}
            {(isAddingCat || editingCatId) && (
              <div className="bg-white border border-purple-200 rounded-3xl p-6 shadow-sm space-y-4 max-w-md">
                <h4 className="text-sm font-bold text-purple-900 border-b border-purple-100 pb-2">
                  {editingCatId ? 'Edit Kategori' : 'Kategori Baru'}
                </h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Nama Kategori:</label>
                    <input
                      type="text"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="Contoh: Pakaian, Aksesoris, Boneka"
                      className="w-full p-2 border border-slate-250 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Emoji / Icon:</label>
                    <input
                      type="text"
                      value={catIcon}
                      onChange={(e) => setCatIcon(e.target.value)}
                      placeholder="Contoh: 👕, 🧸, 🎗️"
                      className="w-full p-2 border border-slate-250 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 text-xs">
                  <button
                    onClick={handleSaveCategory}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingCat(false);
                      setEditingCatId(null);
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Categories Bento Grid with Nested Items CRUD */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {categories.map((cat, idx) => (
                <div key={cat.id} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{cat.icon}</span>
                        <h4 className="text-sm font-bold text-slate-800">{cat.name}</h4>
                      </div>

                      <div className="flex items-center gap-1">
                        {deletingCatId === cat.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-xl shadow-xs text-[10px]">
                            <span className="text-rose-750 font-extrabold px-1 whitespace-nowrap">Yakin?</span>
                            <button
                              onClick={() => {
                                handleDeleteCategory(cat.id);
                                setDeletingCatId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-[10px] cursor-pointer"
                            >
                              Ya
                            </button>
                            <button
                              onClick={() => setDeletingCatId(null)}
                              className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-bold text-[10px] cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Reorder Buttons */}
                            <button
                              disabled={idx === 0}
                              onClick={() => handleMoveCategory(idx, 'up')}
                              className={`p-1 rounded-md transition-all duration-200 ${
                                idx === 0 
                                  ? 'text-slate-200 cursor-not-allowed opacity-50' 
                                  : 'hover:bg-purple-50 text-slate-400 hover:text-purple-600 cursor-pointer active:scale-95'
                              }`}
                              title="Geser ke Atas"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              disabled={idx === categories.length - 1}
                              onClick={() => handleMoveCategory(idx, 'down')}
                              className={`p-1 rounded-md transition-all duration-200 ${
                                idx === categories.length - 1 
                                  ? 'text-slate-200 cursor-not-allowed opacity-50' 
                                  : 'hover:bg-purple-50 text-slate-400 hover:text-purple-600 cursor-pointer active:scale-95'
                              }`}
                              title="Geser ke Bawah"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>

                            <div className="w-px h-3.5 bg-slate-200 mx-1" />

                            <button
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setCatName(cat.name);
                                setCatIcon(cat.icon);
                                document.getElementById('categories-tab-content')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="p-1 hover:bg-slate-100 text-purple-600 rounded-md cursor-pointer"
                              title="Edit Kategori"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingCatId(cat.id)}
                              className="p-1 hover:bg-rose-50 text-rose-500 rounded-md cursor-pointer"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Add Item form panel in this category */}
                    {isAddingItemToCatId === cat.id ? (
                      <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 my-3 text-xs space-y-3">
                        <p className="font-bold text-purple-950">Laundri Item Baru:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Nama Item (e.g. Jas)"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            className="p-1.5 border border-slate-200 bg-white rounded-md"
                          />
                          <input
                            type="number"
                            placeholder="Tarif Rp"
                            value={itemPrice || ''}
                            onChange={(e) => setItemPrice(Number(e.target.value))}
                            className="p-1.5 border border-slate-200 bg-white rounded-md"
                          />
                        </div>
                        <div className="flex justify-end gap-1 text-[10px]">
                          <button
                            onClick={() => handleSaveItemInCat(cat.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-md font-bold"
                          >
                            Tambah
                          </button>
                          <button
                            onClick={() => setIsAddingItemToCatId(null)}
                            className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-md font-bold"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setIsAddingItemToCatId(cat.id);
                          setEditingItemInCat(null);
                          setItemName('');
                          setItemPrice(0);
                        }}
                        className="w-full py-2 border border-dashed border-purple-200/60 text-purple-600 text-xs font-bold rounded-2xl bg-purple-50/15 hover:bg-purple-50 hover:border-purple-300 transition-colors my-3 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Item ke Kategori Ini
                      </button>
                    )}

                    {/* Items inside Category */}
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {cat.items.map((item, idx) => {
                        const isEditingThisItem = editingItemInCat?.catId === cat.id && editingItemInCat?.itemName === item.name;
                        return (
                          <div key={item.name} className={`flex justify-between items-center text-xs py-2 px-2.5 border-b border-slate-50 rounded-xl transition-colors ${
                            item.isActive ? 'hover:bg-slate-50' : 'bg-slate-50 opacity-60'
                          }`}>
                            <div className="flex-1">
                              {isEditingThisItem ? (
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    className="p-1 border border-slate-300 rounded text-xs bg-white font-bold"
                                  />
                                  <input
                                    type="number"
                                    value={itemPrice}
                                    onChange={(e) => setItemPrice(Number(e.target.value))}
                                    className="p-1 border border-slate-300 rounded text-xs bg-white text-center w-20"
                                  />
                                </div>
                              ) : (
                                <>
                                  <span className="font-bold text-slate-700 block">{item.name}</span>
                                  <span className="text-slate-400 text-[10px]">Rp {item.price.toLocaleString('id-ID')} / pcs</span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Toggle active / inactive item */}
                              <button
                                onClick={() => handleToggleItemInCat(cat.id, idx)}
                                className={`text-[10px] font-black border px-2 py-0.5 rounded-md ${
                                  item.isActive 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                    : 'bg-rose-50 border-rose-200 text-rose-500'
                                }`}
                              >
                                {item.isActive ? 'AKTIF' : 'MATI'}
                              </button>

                              {isEditingThisItem ? (
                                <button
                                  onClick={() => handleSaveItemInCat(cat.id)}
                                  className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-md cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingItemInCat({ catId: cat.id, itemName: item.name });
                                    setItemName(item.name);
                                    setItemPrice(item.price);
                                  }}
                                  className="p-1 hover:bg-slate-100 text-purple-600 rounded-md cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteItemInCat(cat.id, item.name)}
                                className="p-1 hover:bg-rose-50 text-rose-500 rounded-md cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* TAB 7: REPORTING & INSIGHTS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Embedded styles for beautiful printing */}
            <style>{`
              @media print {
                /* Hide everything */
                body * {
                  visibility: hidden;
                  background: none !important;
                  color: black !important;
                }
                /* Show ONLY the printable report */
                #print-report-area, #print-report-area * {
                  visibility: visible;
                }
                #print-report-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  background: white !important;
                  color: black !important;
                  font-size: 11px;
                }
                .no-print {
                  display: none !important;
                }
                .print-table th {
                  background-color: #f1f5f9 !important;
                  color: #000 !important;
                  border: 1px solid #cbd5e1 !important;
                }
                .print-table td {
                  border: 1px solid #cbd5e1 !important;
                }
              }
            `}</style>

            {(() => {
              // 1. Anchor today as '2026-06-28' to work flawlessly with mock data and match current metadata
              const today = new Date('2026-06-28');

              // Helper to parse dates safely
              const parseDate = (dStr: string) => {
                if (!dStr) return new Date(today);
                const clean = dStr.trim();
                const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (match) {
                  const yr = parseInt(match[1]);
                  const mo = parseInt(match[2]) - 1;
                  const dy = parseInt(match[3]);
                  const timeMatch = clean.match(/\s+(\d{2}):(\d{2})/);
                  if (timeMatch) {
                    return new Date(yr, mo, dy, parseInt(timeMatch[1]), parseInt(timeMatch[2]));
                  }
                  return new Date(yr, mo, dy, 12, 0, 0);
                }
                const p = new Date(dStr);
                return isNaN(p.getTime()) ? new Date(today) : p;
              };

              // Calculate active ranges
              let activeStart = new Date(today);
              let activeEnd = new Date(today);
              let prevStart = new Date(today);
              let prevEnd = new Date(today);
              let rangeLabel = '';
              let comparisonLabel = '';

              switch (reportFilter) {
                case 'hari-ini':
                  activeStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
                  activeEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
                  prevStart = new Date(activeStart);
                  prevStart.setDate(prevStart.getDate() - 1);
                  prevEnd = new Date(activeEnd);
                  prevEnd.setDate(prevEnd.getDate() - 1);
                  rangeLabel = 'Hari Ini (28 Juni 2026)';
                  comparisonLabel = 'hari kemarin';
                  break;

                case 'kemarin':
                  activeStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 0, 0, 0);
                  activeEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 23, 59, 59);
                  prevStart = new Date(activeStart);
                  prevStart.setDate(prevStart.getDate() - 1);
                  prevEnd = new Date(activeEnd);
                  prevEnd.setDate(prevEnd.getDate() - 1);
                  rangeLabel = 'Kemarin (27 Juni 2026)';
                  comparisonLabel = 'hari sebelumnya';
                  break;

                case 'minggu-ini': {
                  const day = today.getDay();
                  const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
                  activeStart = new Date(today.getFullYear(), today.getMonth(), diffToMonday, 0, 0, 0);
                  activeEnd = new Date(today.getFullYear(), today.getMonth(), diffToMonday + 6, 23, 59, 59);
                  prevStart = new Date(activeStart);
                  prevStart.setDate(prevStart.getDate() - 7);
                  prevEnd = new Date(activeEnd);
                  prevEnd.setDate(prevEnd.getDate() - 7);
                  rangeLabel = 'Minggu Ini (22 - 28 Juni 2026)';
                  comparisonLabel = 'minggu lalu';
                  break;
                }

                case 'bulan-ini':
                  activeStart = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
                  activeEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
                  prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1, 0, 0, 0);
                  prevEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
                  rangeLabel = 'Bulan Ini (Juni 2026)';
                  comparisonLabel = 'bulan lalu';
                  break;

                case 'tahun-ini':
                  activeStart = new Date(today.getFullYear(), 0, 1, 0, 0, 0);
                  activeEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
                  prevStart = new Date(today.getFullYear() - 1, 0, 1, 0, 0, 0);
                  prevEnd = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59);
                  rangeLabel = 'Tahun Ini (2026)';
                  comparisonLabel = 'tahun lalu';
                  break;

                case 'custom':
                default:
                  activeStart = parseDate(customStartDate);
                  activeStart.setHours(0, 0, 0);
                  activeEnd = parseDate(customEndDate);
                  activeEnd.setHours(23, 59, 59);
                  const diff = activeEnd.getTime() - activeStart.getTime();
                  prevStart = new Date(activeStart.getTime() - diff - 1000);
                  prevEnd = new Date(activeStart.getTime() - 1000);
                  rangeLabel = `${activeStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${activeEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                  comparisonLabel = 'periode sebelumnya';
                  break;
              }

              // Compute stats helper
              const getRevenueForRange = (start: Date, end: Date) => {
                return orders
                  .filter(o => o.order_status !== 'Dibatalkan')
                  .filter(o => {
                    const d = parseDate(o.created_at);
                    return d >= start && d <= end;
                  })
                  .reduce((acc, o) => acc + (o.grand_total || 0), 0);
              };

              const getOrdersCountForRange = (start: Date, end: Date) => {
                return orders.filter(o => {
                  const d = parseDate(o.created_at);
                  return d >= start && d <= end;
                }).length;
              };

              const getCompletedOrdersCountForRange = (start: Date, end: Date) => {
                return orders
                  .filter(o => o.order_status === 'Selesai')
                  .filter(o => {
                    const d = parseDate(o.created_at);
                    return d >= start && d <= end;
                  }).length;
              };

              // Calculations for specific static periods requested by user
              const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
              const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
              const yesterdayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 0, 0, 0);
              const yesterdayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 23, 59, 59);

              const revenueToday = getRevenueForRange(todayStart, todayEnd);
              const revenueYesterday = getRevenueForRange(yesterdayStart, yesterdayEnd);

              const dayOfWeek = today.getDay();
              const diffMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
              const weekStart = new Date(today.getFullYear(), today.getMonth(), diffMonday, 0, 0, 0);
              const weekEnd = new Date(today.getFullYear(), today.getMonth(), diffMonday + 6, 23, 59, 59);
              const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
              const lastWeekEnd = new Date(weekEnd); lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

              const revenueThisWeek = getRevenueForRange(weekStart, weekEnd);
              const revenueLastWeek = getRevenueForRange(lastWeekStart, lastWeekEnd);

              const monthStart = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
              const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
              const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1, 0, 0, 0);
              const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

              const revenueThisMonth = getRevenueForRange(monthStart, monthEnd);
              const revenueLastMonth = getRevenueForRange(lastMonthStart, lastMonthEnd);

              const yearStart = new Date(today.getFullYear(), 0, 1, 0, 0, 0);
              const yearEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
              const lastYearStart = new Date(today.getFullYear() - 1, 0, 1, 0, 0, 0);
              const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59);

              const revenueThisYear = getRevenueForRange(yearStart, yearEnd);
              const revenueLastYear = getRevenueForRange(lastYearStart, lastYearEnd);

              // Filtering orders under active filter for lists & table
              const activeOrdersFiltered = orders.filter(o => {
                const d = parseDate(o.created_at);
                return d >= activeStart && d <= activeEnd;
              });

              // Calculations for active period vs prev period for Order and Finished Counts
              const activeOrdersCount = activeOrdersFiltered.length;
              const prevOrdersCount = getOrdersCountForRange(prevStart, prevEnd);

              const activeCompletedCount = activeOrdersFiltered.filter(o => o.order_status === 'Selesai').length;
              const prevCompletedCount = getCompletedOrdersCountForRange(prevStart, prevEnd);

              // Percentage comparisons helper
              const getPercentBadge = (current: number, previous: number, label: string) => {
                if (previous === 0) {
                  if (current === 0) {
                    return (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-slate-50 text-slate-500 font-mono">
                        0% dibanding {label}
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-50 text-emerald-600 font-mono">
                      <ChevronUp className="w-3 h-3 shrink-0" />
                      +100% dibanding {label}
                    </span>
                  );
                }
                const diff = current - previous;
                const pct = (diff / previous) * 100;
                const isPositive = pct >= 0;
                return (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black font-mono ${
                    isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {isPositive ? <ChevronUp className="w-3 h-3 shrink-0" /> : <TrendingDown className="w-3 h-3 shrink-0" />}
                    {isPositive ? '+' : ''}{pct.toFixed(1)}% dibanding {label}
                  </span>
                );
              };

              // Process search & sort for transaction list
              let tableOrders = [...activeOrdersFiltered];
              if (reportSearchQuery.trim()) {
                const query = reportSearchQuery.toLowerCase();
                tableOrders = tableOrders.filter(o => 
                  o.order_id.toLowerCase().includes(query) ||
                  o.customer_name.toLowerCase().includes(query) ||
                  o.main_service.toLowerCase().includes(query) ||
                  o.order_status.toLowerCase().includes(query) ||
                  (o.item_details || []).some(item => item.name.toLowerCase().includes(query))
                );
              }

              // Sort
              tableOrders.sort((a, b) => {
                let valA: any = a[reportSortField];
                let valB: any = b[reportSortField];

                if (reportSortField === 'created_at') {
                  return reportSortOrder === 'asc' 
                    ? parseDate(a.created_at).getTime() - parseDate(b.created_at).getTime()
                    : parseDate(b.created_at).getTime() - parseDate(a.created_at).getTime();
                }

                if (typeof valA === 'string') {
                  valA = valA.toLowerCase();
                  valB = valB.toLowerCase();
                }

                if (valA < valB) return reportSortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return reportSortOrder === 'asc' ? 1 : -1;
                return 0;
              });

              // Paginate
              const totalItems = tableOrders.length;
              const totalPages = Math.ceil(totalItems / reportItemsPerPage) || 1;
              const paginatedOrders = tableOrders.slice(
                (reportCurrentPage - 1) * reportItemsPerPage,
                (reportCurrentPage - 1) * reportItemsPerPage + reportItemsPerPage
              );

              // CSV Exporter
              const handleExportCSV = () => {
                const headers = ['Nomor Invoice', 'Tanggal', 'Nama Customer', 'Layanan Utama', 'Item Details', 'Layanan Tambahan', 'Total Pembayaran', 'Status'];
                const rows = activeOrdersFiltered.map(o => [
                  o.order_id,
                  o.created_at,
                  o.customer_name,
                  o.main_service,
                  (o.item_details || []).map(i => `${i.name} (x${i.qty})`).join('; '),
                  o.additional_service === 'ekspres' ? 'Ekspres (Express)' : 'Reguler',
                  o.grand_total,
                  o.order_status
                ]);

                const csvContent = [
                  ['LAVENDER LAUNDRY FINANCIAL REPORT'],
                  [`Periode Laporan: ${rangeLabel}`],
                  [`Tanggal Export: ${today.toLocaleDateString('id-ID')}`],
                  [`Nama Admin: Administrator (Full Access)`],
                  [],
                  headers,
                  ...rows
                ].map(e => e.map(val => {
                  const s = String(val);
                  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                    return `"${s.replace(/"/g, '""')}"`;
                  }
                  return s;
                }).join(',')).join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `Financial_Report_${today.toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              };

              // Excel Exporter
              const handleExportExcel = () => {
                const rowsHtml = activeOrdersFiltered.map(o => `
                  <tr>
                    <td style="border:1px solid #ddd; padding:6px; font-family:monospace;">${o.order_id}</td>
                    <td style="border:1px solid #ddd; padding:6px;">${o.created_at}</td>
                    <td style="border:1px solid #ddd; padding:6px; font-weight:bold;">${o.customer_name}</td>
                    <td style="border:1px solid #ddd; padding:6px;">${o.main_service}</td>
                    <td style="border:1px solid #ddd; padding:6px;">${(o.item_details || []).map(i => `${i.name} (x${i.qty})`).join(', ')}</td>
                    <td style="border:1px solid #ddd; padding:6px;">${o.additional_service === 'ekspres' ? 'Ekspres' : 'Reguler'}</td>
                    <td style="border:1px solid #ddd; padding:6px; font-weight:bold; color:#7C3AED; font-family:monospace;">Rp ${o.grand_total.toLocaleString('id-ID')}</td>
                    <td style="border:1px solid #ddd; padding:6px;">${o.order_status}</td>
                  </tr>
                `).join('');

                const excelTemplate = `
                  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                  <head>
                    <meta http-equiv="content-type" content="text/plain; charset=UTF-8">
                    <style>
                      table { border-collapse: collapse; width: 100%; }
                      th { background-color: #7C3AED; color: white; font-weight: bold; text-align: left; padding: 8px; border: 1px solid #ddd; }
                    </style>
                  </head>
                  <body>
                    <div style="font-size: 18px; font-weight: bold; color: #7C3AED; margin-bottom: 5px;">LAVENDER LAUNDRY FINANCIAL REPORT</div>
                    <div style="font-size: 12px; margin-bottom: 2px;"><b>Periode Laporan:</b> ${rangeLabel}</div>
                    <div style="font-size: 12px; margin-bottom: 2px;"><b>Tanggal Export:</b> ${today.toLocaleDateString('id-ID')}</div>
                    <div style="font-size: 12px; margin-bottom: 15px;"><b>Nama Admin:</b> Administrator (Full Access)</div>
                    
                    <h3 style="color:#1e293b; border-bottom:2px solid #7C3AED; padding-bottom:5px; margin-top:20px;">Ringkasan Pendapatan</h3>
                    <table style="margin-bottom:25px;">
                      <tr style="background:#f8fafc;">
                        <th style="background:#581c87; color:white; border:1px solid #ddd;">Pendapatan Hari Ini</th>
                        <th style="background:#581c87; color:white; border:1px solid #ddd;">Pendapatan Minggu Ini</th>
                        <th style="background:#581c87; color:white; border:1px solid #ddd;">Pendapatan Bulan Ini</th>
                        <th style="background:#581c87; color:white; border:1px solid #ddd;">Pendapatan Tahun Ini</th>
                        <th style="background:#581c87; color:white; border:1px solid #ddd;">Total Pesanan Masuk</th>
                        <th style="background:#581c87; color:white; border:1px solid #ddd;">Total Pesanan Selesai</th>
                      </tr>
                      <tr>
                        <td style="border:1px solid #ddd; padding:8px; font-weight:bold; font-family:monospace;">Rp ${revenueToday.toLocaleString('id-ID')}</td>
                        <td style="border:1px solid #ddd; padding:8px; font-weight:bold; font-family:monospace;">Rp ${revenueThisWeek.toLocaleString('id-ID')}</td>
                        <td style="border:1px solid #ddd; padding:8px; font-weight:bold; font-family:monospace;">Rp ${revenueThisMonth.toLocaleString('id-ID')}</td>
                        <td style="border:1px solid #ddd; padding:8px; font-weight:bold; font-family:monospace;">Rp ${revenueThisYear.toLocaleString('id-ID')}</td>
                        <td style="border:1px solid #ddd; padding:8px; font-weight:bold; font-family:monospace;">${activeOrdersCount} Pesanan</td>
                        <td style="border:1px solid #ddd; padding:8px; font-weight:bold; font-family:monospace;">${activeCompletedCount} Selesai</td>
                      </tr>
                    </table>

                    <h3 style="color:#1e293b; border-bottom:2px solid #7C3AED; padding-bottom:5px;">Riwayat Transaksi (${activeOrdersFiltered.length} Data)</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Nomor Invoice</th>
                          <th>Tanggal</th>
                          <th>Nama Customer</th>
                          <th>Layanan Utama</th>
                          <th>Item Details</th>
                          <th>Layanan Tambahan</th>
                          <th>Total Pembayaran</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${rowsHtml}
                      </tbody>
                    </table>
                    <br/>
                    <div style="font-size:10px; color:#94a3b8; text-align:center; margin-top:30px;">Generated Automatically by Admin Dashboard - Susyi Laundry Control Center</div>
                  </body>
                  </html>
                `;

                const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `Financial_Report_${today.toISOString().split('T')[0]}.xls`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              };

              // Print triggering
              const handlePrintReport = () => {
                window.print();
              };

              return (
                <div className="space-y-6">
                  {/* Top Notification Status Banner */}
                  <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-6 rounded-[28px] border border-purple-500/20 shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.15),transparent_60%)] pointer-events-none" />
                    <div className="space-y-1.5 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-500 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white shadow-md shadow-purple-500/10">
                          Laporan Keuangan Susyi Laundry
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                        Dashboard Keuangan
                      </h2>
                      <p className="text-xs text-purple-200 font-medium max-w-xl">
                        Pantau omzet, transaksi, dan laporan.
                      </p>
                    </div>

                    {/* Quick filter picker */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl border border-white/10 relative z-10 w-full md:w-auto">
                      {[
                        { id: 'hari-ini', label: 'Hari Ini' },
                        { id: 'kemarin', label: 'Kemarin' },
                        { id: 'minggu-ini', label: 'Minggu Ini' },
                        { id: 'bulan-ini', label: 'Bulan Ini' },
                        { id: 'tahun-ini', label: 'Tahun Ini' },
                        { id: 'custom', label: 'Kustom' },
                      ].map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => {
                            setReportFilter(preset.id as any);
                            setReportCurrentPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide transition-all cursor-pointer flex-1 md:flex-none text-center ${
                            reportFilter === preset.id
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                              : 'text-purple-100 hover:bg-white/10'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kustom Date Range selector box if custom filter selected */}
                  {reportFilter === 'custom' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-end gap-4"
                    >
                      <div className="space-y-2 w-full md:w-auto">
                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Tanggal Mulai</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => {
                              setCustomStartDate(e.target.value);
                              setReportCurrentPage(1);
                            }}
                            className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-mono font-bold w-full md:w-48 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 w-full md:w-auto">
                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Tanggal Selesai</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => {
                              setCustomEndDate(e.target.value);
                              setReportCurrentPage(1);
                            }}
                            className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-mono font-bold w-full md:w-48 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setReportCurrentPage(1);
                        }}
                        className="px-5 py-3 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors w-full md:w-auto flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Sinkronkan Tanggal
                      </button>
                    </motion.div>
                  )}

                  {/* SIX MODERN STAT CARDS REQUESTED BY THE USER */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* 1. Pendapatan Hari Ini */}
                    <div className="bg-white p-5 rounded-[22px] border-l-4 border-l-purple-600 border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-purple-600 transition-colors">Pendapatan Hari Ini</p>
                          <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight">{formatRupiah(revenueToday)}</h3>
                        </div>
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                          <Clock className="w-4.5 h-4.5" />
                        </div>
                      </div>
                      <div className="mt-4 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                        {getPercentBadge(revenueToday, revenueYesterday, 'kemarin')}
                        <span className="text-[8px] text-slate-400 font-bold font-mono uppercase tracking-wider">Reference Date</span>
                      </div>
                    </div>

                    {/* 2. Pendapatan Minggu Ini */}
                    <div className="bg-white p-5 rounded-[22px] border-l-4 border-l-indigo-600 border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Pendapatan Minggu Ini</p>
                          <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight">{formatRupiah(revenueThisWeek)}</h3>
                        </div>
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                          <Calendar className="w-4.5 h-4.5" />
                        </div>
                      </div>
                      <div className="mt-4 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                        {getPercentBadge(revenueThisWeek, revenueLastWeek, 'minggu lalu')}
                        <span className="text-[8px] text-slate-400 font-bold font-mono uppercase tracking-wider">Calendar Week</span>
                      </div>
                    </div>

                    {/* 3. Pendapatan Bulan Ini */}
                    <div className="bg-white p-5 rounded-[22px] border-l-4 border-l-purple-500 border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-purple-500 transition-colors">Pendapatan Bulan Ini</p>
                          <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight">{formatRupiah(revenueThisMonth)}</h3>
                        </div>
                        <div className="p-2.5 bg-purple-50 text-purple-500 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                          <Coins className="w-4.5 h-4.5" />
                        </div>
                      </div>
                      <div className="mt-4 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                        {getPercentBadge(revenueThisMonth, revenueLastMonth, 'bulan lalu')}
                        <span className="text-[8px] text-slate-400 font-bold font-mono uppercase tracking-wider">Current Month</span>
                      </div>
                    </div>

                    {/* 4. Pendapatan Tahun Ini */}
                    <div className="bg-white p-5 rounded-[22px] border-l-4 border-l-amber-500 border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-amber-550 transition-colors">Pendapatan Tahun Ini</p>
                          <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight">{formatRupiah(revenueThisYear)}</h3>
                        </div>
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                          <TrendingUp className="w-4.5 h-4.5" />
                        </div>
                      </div>
                      <div className="mt-4 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                        {getPercentBadge(revenueThisYear, revenueLastYear, 'tahun lalu')}
                        <span className="text-[8px] text-slate-400 font-bold font-mono uppercase tracking-wider">Current Year</span>
                      </div>
                    </div>

                    {/* 5. Total Pesanan Masuk (Sesuai Filter Aktif) */}
                    <div className="bg-white p-5 rounded-[22px] border-l-4 border-l-emerald-600 border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Pesanan Masuk Filtered</p>
                          <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight">{activeOrdersCount} Pesanan</h3>
                        </div>
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                          <ShoppingBag className="w-4.5 h-4.5" />
                        </div>
                      </div>
                      <div className="mt-4 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                        {getPercentBadge(activeOrdersCount, prevOrdersCount, comparisonLabel)}
                        <span className="text-[8px] text-slate-400 font-bold font-mono uppercase tracking-wider">Active Filter</span>
                      </div>
                    </div>

                    {/* 6. Total Pesanan Selesai (Sesuai Filter Aktif) */}
                    <div className="bg-white p-5 rounded-[22px] border-l-4 border-l-blue-600 border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Pesanan Selesai Filtered</p>
                          <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight">{activeCompletedCount} Selesai</h3>
                        </div>
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                          <CheckCircle2 className="w-4.5 h-4.5" />
                        </div>
                      </div>
                      <div className="mt-4 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                        {getPercentBadge(activeCompletedCount, prevCompletedCount, comparisonLabel)}
                        <span className="text-[8px] text-slate-400 font-bold font-mono uppercase tracking-wider">Active Filter</span>
                      </div>
                    </div>
                  </div>

                  {/* CHARTS COMPONENT */}
                  <FinancialCharts 
                    orders={orders} 
                    activeFilterType={reportFilter} 
                    startDate={activeStart} 
                    endDate={activeEnd} 
                  />

                  {/* TRANSACTION LIST WITH ADVANCED SAAS TABLE */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
                    {/* Table toolbar & Exports */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pb-4 border-b border-slate-100">
                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-slate-800">
                          Riwayat Transaksi Kasir (Sesuai Filter)
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Ditemukan {totalItems} transaksi yang terdaftar dalam periode {rangeLabel}.
                        </p>
                      </div>

                      {/* Export buttons block & Search */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                        {/* Search field */}
                        <div className="relative flex-1 sm:flex-none">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Cari invoice, nama customer, status..."
                            value={reportSearchQuery}
                            onChange={(e) => {
                              setReportSearchQuery(e.target.value);
                              setReportCurrentPage(1);
                            }}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* EXPORTS BAR WITH LUCIDE ICONS */}
                        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={handleExportCSV}
                            title="Unduh laporan berformat CSV"
                            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-purple-600" />
                            CSV
                          </button>
                          
                          <button
                            onClick={handleExportExcel}
                            title="Unduh laporan berformat Excel (.xls)"
                            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            Excel
                          </button>

                          <button
                            onClick={handlePrintReport}
                            title="Unduh laporan berformat PDF"
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm shadow-purple-600/15"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Cetak PDF
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200/60 max-h-[420px] overflow-y-auto relative">
                      <table className="w-full text-left text-xs border-collapse">
                        {/* Sticky Header */}
                        <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-xs border-b border-slate-100">
                          <tr>
                            {[
                              { id: 'order_id', label: 'Invoice' },
                              { id: 'created_at', label: 'Tanggal' },
                              { id: 'customer_name', label: 'Nama Customer' },
                              { id: 'main_service', label: 'Layanan' },
                              { id: 'items', label: 'Item' },
                              { id: 'additional_service', label: 'Layanan Tambahan' },
                              { id: 'grand_total', label: 'Total Pembayaran' },
                              { id: 'order_status', label: 'Status' },
                            ].map(col => {
                              const isSortable = ['order_id', 'created_at', 'customer_name', 'grand_total', 'order_status'].includes(col.id);
                              return (
                                <th 
                                  key={col.id} 
                                  onClick={() => {
                                    if (!isSortable) return;
                                    if (reportSortField === col.id) {
                                      setReportSortOrder(reportSortOrder === 'asc' ? 'desc' : 'asc');
                                    } else {
                                      setReportSortField(col.id as any);
                                      setReportSortOrder('desc');
                                    }
                                  }}
                                  className={`py-3 px-4 select-none ${isSortable ? 'cursor-pointer hover:bg-slate-100 text-slate-700 transition-colors' : ''}`}
                                >
                                  <div className="flex items-center gap-1">
                                    {col.label}
                                    {isSortable && reportSortField === col.id && (
                                      <span>{reportSortOrder === 'asc' ? '▲' : '▼'}</span>
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedOrders.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                                Tidak ada data transaksi yang cocok dengan pencarian / filter tanggal.
                              </td>
                            </tr>
                          ) : (
                            paginatedOrders.map((order, idx) => (
                              <tr 
                                key={order.order_id || idx} 
                                className="hover:bg-purple-50/20 transition-all font-medium text-slate-700 duration-150"
                              >
                                <td className="py-3 px-4 font-mono font-bold text-slate-800 text-[11px]">
                                  {order.order_id}
                                </td>
                                <td className="py-3 px-4 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                                  {order.created_at || 'Baru'}
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                                  {order.customer_name}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600">
                                    {order.main_service}
                                  </span>
                                </td>
                                <td className="py-3 px-4 max-w-[180px] truncate text-slate-500" title={(order.item_details || []).map(i => `${i.name} (x${i.qty})`).join(', ')}>
                                  {(order.item_details || []).length > 0 
                                    ? (order.item_details || []).map(i => `${i.name} (x${i.qty})`).join(', ') 
                                    : '-'}
                                </td>
                                <td className="py-3 px-4 font-bold">
                                  {order.additional_service === 'ekspres' ? (
                                    <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                                      Ekspres
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 text-[10px] font-bold">Reguler</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                  {formatRupiah(order.grand_total || 0)}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide uppercase ${
                                    order.order_status === 'Selesai'
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                      : order.order_status === 'Dibatalkan'
                                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                      : order.order_status === 'Menunggu Konfirmasi'
                                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                                  }`}>
                                    {order.order_status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination control footer */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 text-[11px] text-slate-400 font-bold border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span>Tampilkan baris per halaman:</span>
                        <select 
                          value={reportItemsPerPage}
                          onChange={(e) => {
                            setReportItemsPerPage(Number(e.target.value));
                            setReportCurrentPage(1);
                          }}
                          className="p-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setReportCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={reportCurrentPage === 1}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span>Halaman {reportCurrentPage} dari {totalPages}</span>
                        <button
                          onClick={() => setReportCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={reportCurrentPage === totalPages}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 
                    HIDDEN PRINT-ONLY REPORT ELEMENT (#print-report-area)
                    This matches exactly the content, logo, corporate styling, headers, metrics, transactions and signature blocks requested by the user.
                    Styled specifically for printed papers.
                  */}
                  <div id="print-report-area" className="hidden print:block p-10 bg-white text-slate-900 leading-normal">
                    {/* Header: Corporate letterhead */}
                    <div className="flex justify-between items-start border-b-4 border-purple-600 pb-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black uppercase tracking-tight text-purple-700">SUSYI LAUNDRY</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500">Premium Laundry &amp; Dry Cleaning Services</p>
                        <p className="text-[10px] text-slate-400">
                          Jl. Boulevard Susyi No. 88, Jakarta Selatan, 12190<br/>
                          Telepon: +62 821-4567-8901 | Email: info@susyilaundry.com<br/>
                          Website: www.susyilaundry.com
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-[9px] font-bold rounded-md">
                          LAPORAN KEUANGAN RESMI
                        </span>
                        <p className="text-[10px] text-slate-500 mt-2">
                          <b>Periode:</b> {rangeLabel}<br/>
                          <b>Tanggal Export:</b> {today.toLocaleDateString('id-ID')}<br/>
                          <b>Waktu Cetak:</b> {new Date().toLocaleTimeString('id-ID')} WIB<br/>
                          <b>Pencetak:</b> Administrator (Super Admin)
                        </p>
                      </div>
                    </div>

                    {/* Ringkasan Pendapatan section */}
                    <div className="my-8">
                      <h3 className="text-sm font-black border-b border-slate-200 pb-1.5 uppercase tracking-wider text-purple-800">
                        I. Ringkasan Pendapatan (Revenue Metrics)
                      </h3>
                      <table className="w-full mt-3 text-left border-collapse text-[10px] print-table">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="p-2 border border-slate-300 font-bold">Laporan</th>
                            <th className="p-2 border border-slate-300 font-bold">Total Nilai (Rupiah)</th>
                            <th className="p-2 border border-slate-300 font-bold">Keterangan Akuntansi</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-2 border border-slate-300 font-bold">Total Pendapatan Hari Ini</td>
                            <td className="p-2 border border-slate-300 font-bold font-mono text-purple-700">{formatRupiah(revenueToday)}</td>
                            <td className="p-2 border border-slate-300">Pendapatan terkumpul pada tanggal 28 Juni 2026</td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-300 font-bold">Total Pendapatan Minggu Ini</td>
                            <td className="p-2 border border-slate-300 font-bold font-mono text-purple-700">{formatRupiah(revenueThisWeek)}</td>
                            <td className="p-2 border border-slate-300">Pendapatan terkumpul minggu ini (22 - 28 Juni 2026)</td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-300 font-bold">Total Pendapatan Bulan Ini</td>
                            <td className="p-2 border border-slate-300 font-bold font-mono text-purple-700">{formatRupiah(revenueThisMonth)}</td>
                            <td className="p-2 border border-slate-300">Pendapatan terkumpul bulan ini (Juni 2026)</td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-300 font-bold">Total Pendapatan Tahun Ini</td>
                            <td className="p-2 border border-slate-300 font-bold font-mono text-purple-700">{formatRupiah(revenueThisYear)}</td>
                            <td className="p-2 border border-slate-300">Pendapatan tahunan berjalan berjalan (Tahun Buku 2026)</td>
                          </tr>
                          <tr className="bg-purple-50/20">
                            <td className="p-2 border border-slate-300 font-bold">Total Pesanan Masuk (Periode Ini)</td>
                            <td className="p-2 border border-slate-300 font-bold font-mono text-slate-800">{activeOrdersCount} Pesanan</td>
                            <td className="p-2 border border-slate-300">Akumulasi jumlah transaksi masuk sesuai filter aktif</td>
                          </tr>
                          <tr className="bg-purple-50/20">
                            <td className="p-2 border border-slate-300 font-bold">Total Pesanan Selesai (Periode Ini)</td>
                            <td className="p-2 border border-slate-300 font-bold font-mono text-emerald-700">{activeCompletedCount} Pesanan</td>
                            <td className="p-2 border border-slate-300">Jumlah pesanan yang berstatus selesai dan diserahkan</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Riwayat Transaksi section */}
                    <div className="my-8">
                      <h3 className="text-sm font-black border-b border-slate-200 pb-1.5 uppercase tracking-wider text-purple-800">
                        II. Buku Jurnal &amp; Riwayat Transaksi Ringkas
                      </h3>
                      <table className="w-full mt-3 text-left border-collapse text-[9px] print-table">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="p-2 border border-slate-300 font-bold">Invoice</th>
                            <th className="p-2 border border-slate-300 font-bold">Tanggal</th>
                            <th className="p-2 border border-slate-300 font-bold">Nama Customer</th>
                            <th className="p-2 border border-slate-300 font-bold">Layanan</th>
                            <th className="p-2 border border-slate-300 font-bold">Item Details</th>
                            <th className="p-2 border border-slate-300 font-bold">Layanan Tambahan</th>
                            <th className="p-2 border border-slate-300 font-bold">Total Pembayaran</th>
                            <th className="p-2 border border-slate-300 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeOrdersFiltered.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-4 text-center text-slate-400">Tidak ada data transaksi terekam pada periode ini.</td>
                            </tr>
                          ) : (
                            activeOrdersFiltered.map((o, index) => (
                              <tr key={o.order_id || index}>
                                <td className="p-1.5 border border-slate-300 font-mono font-bold">{o.order_id}</td>
                                <td className="p-1.5 border border-slate-300 font-mono text-[8px]">{o.created_at}</td>
                                <td className="p-1.5 border border-slate-300 font-bold">{o.customer_name}</td>
                                <td className="p-1.5 border border-slate-300">{o.main_service}</td>
                                <td className="p-1.5 border border-slate-300 max-w-[120px] truncate">
                                  {(o.item_details || []).map(i => `${i.name} (x${i.qty})`).join(', ')}
                                </td>
                                <td className="p-1.5 border border-slate-300 capitalize">{o.additional_service}</td>
                                <td className="p-1.5 border border-slate-300 font-mono font-bold text-purple-800">{formatRupiah(o.grand_total)}</td>
                                <td className="p-1.5 border border-slate-300 text-[8px] font-bold uppercase">{o.order_status}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer / Signatures */}
                    <div className="mt-16 pt-5 border-t border-slate-200 text-center text-[10px] text-slate-400 flex justify-between">
                      <span>Generated Automatically by Admin Dashboard | Susyi Laundry Control Center</span>
                      <span>Tanggal Cetak: {today.toLocaleDateString('id-ID')}</span>
                      <span>Halaman 1 dari 1</span>
                    </div>

                    {/* Official Stamp & Sign Blocks */}
                    <div className="mt-12 grid grid-cols-2 gap-20 text-[10px]">
                      <div className="text-center space-y-12">
                        <p className="font-bold">Dibuat Oleh:</p>
                        <div>
                          <p className="font-bold underline">Admin Susyi Laundry</p>
                          <p className="text-slate-400">Petugas Keuangan (Finance)</p>
                        </div>
                      </div>
                      <div className="text-center space-y-12">
                        <p className="font-bold">Disetujui Oleh:</p>
                        <div>
                          <p className="font-bold underline">Super Administrator</p>
                          <p className="text-slate-400">Pemilik Bisnis (Owner)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}



      </div>

      {/* Bottom Panel footer */}
      <div className="p-4 border-t border-slate-200 bg-white text-center text-[10px] text-slate-400 flex justify-center px-6 shrink-0">
        <span>©️2026 Susy Laundry - take care with ❤</span>
      </div>

      </div>
    </div>
  );
}
