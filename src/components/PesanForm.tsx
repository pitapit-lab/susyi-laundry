import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, CheckCircle, Clipboard, ArrowRight, MessageSquare, 
  AlertCircle, Sparkles, Loader2, Smile, ArrowLeft, Plus, Minus, 
  Clock, Zap, Shirt, Wind, Info, MapPin, User, Phone, Check, ShoppingBag,
  Lock
} from 'lucide-react';

import { Order, OrderItem, Customer } from '../types';
import { AdminService, AdminCategory, WebInfo } from '../utils/database';

interface RouteData {
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
}

interface PesanFormProps {
  routeData: RouteData | null;
  setRouteData?: (data: RouteData | null) => void;
  onSuccess: (newOrder: Order) => void;
  preselectedService?: string;
  customer?: Customer | null;
  onOpenLogin?: () => void;
  services?: AdminService[];
  categories?: AdminCategory[];
  webInfo?: WebInfo;
}

interface ItemDetail {
  name: string;
  price: number;
}

interface CategoryDetails {
  id: string;
  name: string;
  icon: string;
  items: ItemDetail[];
}

export default function PesanForm({ 
  routeData, 
  setRouteData, 
  onSuccess, 
  preselectedService, 
  customer, 
  onOpenLogin,
  services,
  categories: propCategories,
  webInfo
}: PesanFormProps) {
  // Wizard steps: 1 to 6
  const [currentStep, setCurrentStep] = useState(1);
  const [activeCategoryTab, setActiveCategoryTab] = useState('pakaian');

  // Core Form Input states
  const [serviceType, setServiceType] = useState('Cuci Komplit');
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [shippingSpeed, setShippingSpeed] = useState<'reguler' | 'ekspres'>('reguler');

  // Customer credentials / information
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    pickupDate: '',
    pickupTime: '',
    notes: ''
  });

  // Prefill details if customer is logged in
  useEffect(() => {
    if (customer && customer.role !== 'admin') {
      setFormData(prev => ({
        ...prev,
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || ''
      }));
    }
  }, [customer]);

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [generatedWaLink, setGeneratedWaLink] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [showSuccessRadiusModal, setShowSuccessRadiusModal] = useState(false);

  const formatRupiahText = (num: number): string => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // Helper to get current time in Asia/Jakarta (WIB)
  const getJakartaTime = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
    
    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hour = parseInt(getPart('hour'), 10);
    const minute = parseInt(getPart('minute'), 10);
    
    return {
      dateStr: `${year}-${month}-${day}`, // YYYY-MM-DD
      hour,
      minute
    };
  };

  // Helper to compute min pickup date based on operations
  const getMinPickupDate = () => {
    const { dateStr, hour } = getJakartaTime();
    if (hour >= 20) {
      // Past 20:00 WIB, so tomorrow is the min date.
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const parts = formatter.formatToParts(tomorrow);
      const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
      return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
    }
    return dateStr;
  };

  const allTimeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const isTimeSlotDisabled = (time: string) => {
    const { dateStr, hour } = getJakartaTime();
    
    // If selecting today
    if (formData.pickupDate === dateStr) {
      const slotHour = parseInt(time.split(':')[0], 10);
      // Disable if slot hour is <= current hour in Jakarta
      if (slotHour <= hour) {
        return true;
      }
    }
    return false;
  };

  const getRawMessageText = (): string => {
    const list = getActiveItemsList();
    const itemsListString = list
      .map(item => `- ${item.name} (${item.qty} pcs) x ${formatRupiahText(item.price)} = ${formatRupiahText(item.itemSubtotal)}`)
      .join('\n');

    const estimateTime = shippingSpeed === 'ekspres' ? 'Ekspres 1 Hari' : 'Reguler 2-3 Hari';
    const speedFeeText = formatRupiahText(getShippingFee());

    return `*✦ ORDER SUSYI LAUNDRY ✦*

*=== DETAIL PELANGGAN ===*
👤 *Nama Lengkap:* ${formData.name}
📱 *No. WhatsApp:* ${formData.phone}
✉️ *Email:* ${formData.email || '-'}
📍 *Alamat Jemput:* ${formData.address}
📅 *Rencana Jemput:* ${formData.pickupDate}
🕐 *Jam Jemput:* ${formData.pickupTime ? `${formData.pickupTime} WIB` : '-'}
📝 *Catatan Tambahan:* ${formData.notes || '-'}

*=== DETAIL LAYANAN ===*
🧺 *Layanan Utama:* ${serviceType}
⏱️ *Durasi Selesai:* ${estimateTime}

*=== RINCIAN ITEM ===*
${itemsListString}

*=== RINGKASAN BIAYA ===*
💰 *Subtotal Item:* ${formatRupiahText(getItemsSubtotal())}
⚡ *Tambahan Speed:* ${speedFeeText}
💎 *TOTAL AKHIR:* ${formatRupiahText(getGrandTotal())}

*=== DETAIL RUTE KURIR ===*
📍 *Jarak:* ${routeData?.distance || 0} km
🚗 *Estimasi Kendaraan:* ${routeData?.durationDriving || 0} menit
🛣️ *Pilihan Rute:* ${routeData?.routeType || 'Rute Tercepat'}

_Terima kasih telah memesan di Susyi Laundry. Mohon konfirmasi pesan WhatsApp ini agar Kurir kami segera meluncur ke lokasi Anda._`;
  };

  const getOutOfRadiusMessageText = (): string => {
    const list = getActiveItemsList();
    const hasOrdered = list.length > 0;

    const name = hasOrdered && formData.name ? formData.name : '';
    const phone = hasOrdered && formData.phone ? formData.phone : '';
    const email = hasOrdered && formData.email ? formData.email : '';
    const address = formData.address || '';
    const pickupDate = hasOrdered && formData.pickupDate ? formData.pickupDate : '';
    const pickupTime = hasOrdered && formData.pickupTime ? `${formData.pickupTime} WIB` : '';
    const notes = hasOrdered && formData.notes ? formData.notes : '';

    const displayServiceType = hasOrdered && serviceType ? serviceType : '';
    const durationSelesai = hasOrdered ? (shippingSpeed === 'ekspres' ? 'Ekspres 1 Hari' : 'Reguler 2-3 Hari') : '';

    const itemsListString = hasOrdered
      ? list.map(item => `- ${item.name} (${item.qty} pcs) - ${formatRupiahText(item.itemSubtotal)}`).join('\n')
      : '';

    const subtotalText = hasOrdered ? formatRupiahText(getItemsSubtotal()) : 'Rp 0';
    const speedFeeText = hasOrdered ? formatRupiahText(getShippingFee()) : 'Rp 0';
    const grandTotalText = hasOrdered ? formatRupiahText(getGrandTotal()) : 'Rp 0';

    const distanceText = routeData?.distance ? `${routeData.distance} km` : '';
    const durationText = routeData?.durationDriving ? `${routeData.durationDriving} menit` : '';

    return `✦ ORDER SUSYI LAUNDRY (DI LUAR RADIUS) ✦

Pesanan ini berada di luar radius layanan otomatis sehingga memerlukan persetujuan Admin.

=== DETAIL PELANGGAN ===
👤 Nama Lengkap : ${name}
📱 Nomor WhatsApp : ${phone}
✉️ Email : ${email}
📍 Alamat Jemput : ${address}
📅 Tanggal Jemput : ${pickupDate}
🕐 Jam Jemput : ${pickupTime}
📝 Catatan Tambahan : ${notes}

=== DETAIL LAYANAN ===
🧺 Layanan Utama : ${displayServiceType}
⏱️ Durasi Selesai : ${durationSelesai}

=== RINCIAN ITEM ===
${itemsListString}

=== RINGKASAN BIAYA ===
💰 Subtotal Item : ${subtotalText}
⚡ Tambahan Speed : ${speedFeeText}
💎 Total Akhir : ${grandTotalText}

=== DETAIL RUTE KURIR ===
📍 Jarak : ${distanceText}
🚗 Estimasi Kendaraan : ${durationText}

Mohon konfirmasi apakah pesanan ini dapat diterima.
Saya menunggu konfirmasi dari Admin Susyi Laundry.`;
  };

  const handleCopyToClipboard = () => {
    const text = getRawMessageText();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }).catch(err => {
      console.error('Gagal menyalin teks:', err);
    });
  };

  const handleFinishAndClose = () => {
    // Reset to first step
    setCurrentStep(1);
    // Clear item selections
    setItemQuantities({});
    // Reset form details while keeping user profile if logged in
    setFormData(prev => ({
      name: customer?.name || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
      pickupDate: '',
      pickupTime: '',
      notes: ''
    }));
    // Close modal
    setShowSuccessPopup(false);
    // Smooth scroll back to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Structured categories data computed dynamically from database
  const categories: CategoryDetails[] = React.useMemo(() => {
    if (propCategories && propCategories.length > 0) {
      return propCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '👕',
        items: cat.items
          .filter(item => item.isActive)
          .map(item => ({
            name: item.name,
            price: item.price
          }))
      }));
    }
    return [
      {
        id: 'pakaian',
        name: 'Pakaian',
        icon: '👕',
        items: [
          { name: 'Kaos', price: 500 },
          { name: 'Mukena', price: 1000 },
          { name: 'Kemeja', price: 500 },
          { name: 'Blus', price: 100 },
          { name: 'Rok Panjang', price: 500 },
          { name: 'Rok Pendek', price: 500 },
          { name: 'Celana Panjang', price: 500 },
          { name: 'Celana Pendek', price: 500 },
          { name: 'Jeans', price: 1000 },
          { name: 'Jaket', price: 2000 },
          { name: 'Jas', price: 200 },
          { name: 'Piyama', price: 1000 },
          { name: 'Kebaya', price: 2000 },
          { name: 'Seragam', price: 1000 }
        ]
      },
      {
        id: 'aksesoris',
        name: 'Aksesoris',
        icon: '🎗️',
        items: [
          { name: 'Jilbab', price: 500 },
          { name: 'Topi', price: 500 },
          { name: 'Sarung Tangan', price: 500 },
          { name: 'Kaos Kaki', price: 500 },
          { name: 'Dasi', price: 500 },
          { name: 'Handuk', price: 500 }
        ]
      },
      {
        id: 'perlengkapan',
        name: 'Perlengkapan Rumah',
        icon: '🏠',
        items: [
          { name: 'Selimut', price: 2000 },
          { name: 'Sprei', price: 2000 },
          { name: 'Bed Cover', price: 2000 }
        ]
      },
      {
        id: 'boneka',
        name: 'Boneka',
        icon: '🧸',
        items: [
          { name: 'Boneka Kecil', price: 1000 },
          { name: 'Boneka Medium', price: 2000 },
          { name: 'Boneka Besar', price: 3000 }
        ]
      }
    ];
  }, [propCategories]);

  // Map representation for easy price looking
  const allItemsMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    categories.forEach(cat => {
      cat.items.forEach(item => {
        map[item.name] = item.price;
      });
    });
    return map;
  }, [categories]);

  // Preselect service type from cards
  useEffect(() => {
    if (preselectedService) {
      let matched = 'Cuci Komplit';
      if (preselectedService.toLowerCase().includes('kering')) {
        matched = 'Cuci Kering';
      } else if (preselectedService.toLowerCase().includes('setrika')) {
        matched = 'Setrika Saja';
      } else if (preselectedService.toLowerCase().includes('komplit')) {
        matched = 'Cuci Komplit';
      }
      setServiceType(matched);
      // Auto advance to clothes quantities to let user proceed fast
      setCurrentStep(2);
    }
  }, [preselectedService]);

  const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return Math.round(d * 10) / 10; // Round to 1 decimal place
  };

  const [isTypingChecking, setIsTypingChecking] = useState(false);

  // Prefill address from searched map address if current address is empty, and check distance radius
  useEffect(() => {
    if (routeData?.address && !formData.address) {
      setFormData(prev => ({
        ...prev,
        address: routeData.address
      }));
      setFormError('');
    }
    if (routeData && routeData.routeChecked) {
      if (routeData.distance > 2) {
        setShowRadiusModal(true);
        setShowSuccessRadiusModal(false);
        setFormError('Alamat penjemputan berada di luar radius layanan antar jemput (Maksimal 2 km). Silakan hubungi WhatsApp.');
      } else {
        setShowRadiusModal(false);
        setFormError('');
      }
    }
  }, [routeData]);

  // Helper calculation functions
  const getItemQty = (name: string): number => {
    return itemQuantities[name] || 0;
  };

  const handleAdjustQty = (name: string, adjustment: number) => {
    setItemQuantities(prev => {
      const current = prev[name] || 0;
      const next = current + adjustment;
      const updated = { ...prev };
      if (next <= 0) {
        delete updated[name];
      } else {
        updated[name] = next;
      }
      return updated;
    });
    setFormError('');
  };

  const getSubtotalPerCategory = (catId: string): number => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return 0;
    return cat.items.reduce((acc, item) => {
      const qty = getItemQty(item.name);
      return acc + (qty * item.price);
    }, 0);
  };

  const getItemsSubtotal = (): number => {
    return Object.entries(itemQuantities).reduce<number>((acc, [name, qty]) => {
      const price = allItemsMap[name] || 0;
      const qVal = qty as number;
      return acc + (qVal * price);
    }, 0);
  };

  const getShippingFee = (): number => {
    return shippingSpeed === 'ekspres' ? 10000 : 0;
  };

  const getGrandTotal = (): number => {
    return getItemsSubtotal() + getShippingFee();
  };

  const totalItemsCount = (): number => {
    return Object.values(itemQuantities).reduce<number>((acc, qty) => acc + (qty as number), 0);
  };

  const getActiveItemsList = () => {
    return Object.entries(itemQuantities).map(([name, qty]) => {
      const price = allItemsMap[name] || 0;
      const qVal = qty as number;
      return {
        name,
        qty: qVal,
        price,
        itemSubtotal: qVal * price
      };
    });
  };

  const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleNextStep = () => {
    setFormError('');

    if (currentStep === 1) {
      // Step 1: Layanan is selected (initialized safely)
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Step 2: Validate at least 1 item is added to cart
      if (totalItemsCount() <= 0) {
        setFormError('Silakan pilih minimal 1 item pakaian/kategori untuk melanjutkan!');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Step 3: Fast vs Regular (always preselected)
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Step 4: Cost breakdown, just review & continue
      setCurrentStep(5);
    } else if (currentStep === 5) {
      // Step 5: Validate customer form fields
      if (!formData.name.trim()) {
        setFormError('Nama Lengkap wajib diisi.');
        return;
      }
      if (!formData.phone.trim()) {
        setFormError('Nomor WhatsApp wajib diisi.');
        return;
      }
      if (!formData.address.trim()) {
        setFormError('Alamat lengkap penjemputan wajib diisi.');
        return;
      }
      if (!formData.pickupDate) {
        setFormError('Pilih Rencana Tanggal Pengambilan.');
        return;
      }

      const pickupDateVal = new Date(formData.pickupDate);
      pickupDateVal.setHours(0, 0, 0, 0);

      const todayVal = new Date();
      todayVal.setHours(0, 0, 0, 0);

      if (pickupDateVal < todayVal) {
        setFormError("Tanggal penjemputan tidak boleh sebelum hari ini.");
        return;
      }

      if (!formData.pickupTime) {
        setFormError('Pilih Jam Penjemputan.');
        return;
      }

      // Check radius limits
      if (routeData && routeData.routeChecked) {
        if (routeData.distance > 2) {
          setShowRadiusModal(true);
          setShowSuccessRadiusModal(false);
          setFormError('Alamat penjemputan berada di luar radius layanan antar jemput (Maksimal 2 km). Silakan hubungi WhatsApp.');
          return;
        } else {
          setShowSuccessRadiusModal(true);
          setShowRadiusModal(false);
          return;
        }
      } else {
        setFormError('Silakan pilih lokasi penjemputan Anda di peta (Langkah 4) terlebih dahulu.');
        return;
      }
    }
  };

  const handlePrevStep = () => {
    setFormError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitFinal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Authentication Guard
    if (!customer) {
      setFormError('Silakan login terlebih dahulu untuk melakukan pemesanan.');
      return;
    }

    // Pre-flight checks again
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.address.trim() || !formData.pickupDate || !formData.pickupTime) {
      setFormError('Silakan lengkapi data diri Anda di Step 5 terlebih dahulu.');
      setCurrentStep(5);
      return;
    }

    const pickupDateVal = new Date(formData.pickupDate);
    pickupDateVal.setHours(0, 0, 0, 0);

    const todayVal = new Date();
    todayVal.setHours(0, 0, 0, 0);

    if (pickupDateVal < todayVal) {
      setFormError("Tanggal penjemputan tidak boleh sebelum hari ini.");
      setCurrentStep(5);
      return;
    }

    if (totalItemsCount() <= 0) {
      setFormError('Daftar keranjang pakaian kosong. Silakan pilih pakaian di Step 2.');
      setCurrentStep(2);
      return;
    }

    // MANDATORY ROUTE CHECK REQUIREMENT (if applicable)
    if (!routeData || !routeData.routeChecked) {
      setFormError('WAJIB mengecek rute & menentukan lokasi penjemputan pada PETA sebelum melakukan pemesanan!');
      scrollAndFocusRoute();
      return;
    }

    setIsSubmitting(true);

    // Locally validate pickup date and time under Asia/Jakarta (WIB) timezone
    const getJakartaTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const parts = formatter.formatToParts(now);
      const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
      
      const year = getPart('year');
      const month = getPart('month');
      const day = getPart('day');
      const hour = parseInt(getPart('hour'), 10);
      const minute = parseInt(getPart('minute'), 10);
      
      return {
        dateStr: `${year}-${month}-${day}`,
        hour,
        minute,
        year: parseInt(year, 10),
        month: parseInt(month, 10),
        day: parseInt(day, 10),
      };
    };

    const validatePickupDateTimeLocal = (pDate: string, pTime: string) => {
      const jk = getJakartaTime();
      
      // 1. parse pickupDate (format: "YYYY-MM-DD")
      const dateParts = pDate.split('-');
      if (dateParts.length !== 3) {
        return { valid: false, error: "Format tanggal tidak valid (harus YYYY-MM-DD)." };
      }
      const pYear = parseInt(dateParts[0], 10);
      const pMonth = parseInt(dateParts[1], 10);
      const pDay = parseInt(dateParts[2], 10);

      // Compare pickup date with current date (ignoring time)
      const isPastDate = pYear < jk.year || 
                         (pYear === jk.year && pMonth < jk.month) || 
                         (pYear === jk.year && pMonth === jk.month && pDay < jk.day);
                         
      if (isPastDate) {
        return { valid: false, error: "Tanggal penjemputan tidak boleh berada di masa lalu." };
      }

      // 2. parse pickupTime (format: "HH:MM")
      const timeParts = pTime.split(':');
      if (timeParts.length < 2) {
        return { valid: false, error: "Format jam tidak valid (harus HH:MM)." };
      }
      const pHour = parseInt(timeParts[0], 10);
      const pMinute = parseInt(timeParts[1], 10);

      // Jam penjemputan hanya boleh antara 08.00 WIB hingga 20.00 WIB
      if (pHour < 8 || pHour > 20 || (pHour === 20 && pMinute > 0)) {
        return { valid: false, error: "Jam penjemputan hanya boleh antara 08.00 WIB hingga 20.00 WIB." };
      }

      // 3. If time server has passed 20.00 WIB, the minimum pickup date is tomorrow
      if (jk.hour >= 20) {
        const isToday = pYear === jk.year && pMonth === jk.month && pDay === jk.day;
        if (isToday) {
          return { valid: false, error: "Pemesanan hari ini sudah ditutup (lewat jam 20:00 WIB). Minimal tanggal penjemputan adalah esok hari." };
        }
      }

      // 4. If choosing today, pickup time must be in the future (greater than current hour)
      const isToday = pYear === jk.year && pMonth === jk.month && pDay === jk.day;
      if (isToday) {
        if (pHour <= jk.hour) {
          return { valid: false, error: `Jam penjemputan (${pTime} WIB) sudah terlewati atau tidak tersedia untuk hari ini (Sekarang ${String(jk.hour).padStart(2, '0')}:${String(jk.minute).padStart(2, '0')} WIB).` };
        }
      }

      return { valid: true };
    };

    const validation = validatePickupDateTimeLocal(formData.pickupDate, formData.pickupTime);
    if (!validation.valid) {
      setIsSubmitting(false);
      setFormError(validation.error || 'Validasi tanggal & jam penjemputan gagal.');
      // Scroll to form error
      const el = document.getElementById('pesan-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (routeData && routeData.distance > 2) {
      setIsSubmitting(false);
      const outOfRadiusMsg = getOutOfRadiusMessageText();
      const encodedMsg = encodeURIComponent(outOfRadiusMsg);
      const waNumber = '6281231009060';
      const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encodedMsg}`;
      window.open(waUrl, '_blank');
      setShowRadiusModal(true);
      return;
    }

    // Formulate beautiful WhatsApp receipt
    const rawMsg = getRawMessageText();
    const encodedMsg = encodeURIComponent(rawMsg);
    // Real number for business communication
    const waNumber = '6281231009060';
    const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encodedMsg}`;

    setGeneratedWaLink(waUrl);

    const newOrder: Order = {
      order_id: 'LVD-' + Math.floor(1000 + Math.random() * 9000),
      customer_name: formData.name,
      whatsapp: formData.phone,
      email: formData.email,
      pickup_date: formData.pickupDate,
      pickup_time: formData.pickupTime,
      address: formData.address,
      notes: formData.notes,
      main_service: serviceType,
      additional_service: shippingSpeed,
      coordinates: routeData?.coordinates || (customer?.latitude && customer?.longitude ? [customer.latitude, customer.longitude] : undefined),
      item_details: getActiveItemsList().map(item => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        itemSubtotal: item.itemSubtotal
      })),
      subtotal: getItemsSubtotal(),
      additional_fee: getShippingFee(),
      grand_total: getGrandTotal(),
      order_status: 'Menunggu Konfirmasi',
      created_at: (() => {
        const d = new Date();
        const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\./g, ':');
        return `${dateStr} ${timeStr}`;
      })(),
      updated_at: (() => {
        const d = new Date();
        const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\./g, ':');
        return `${dateStr} ${timeStr}`;
      })(),
      routeType: routeData?.routeType || 'Rute Tercepat',
      routeDistance: routeData?.routeDistance || routeData?.distance,
      routeDuration: routeData?.routeDuration || (shippingSpeed === 'ekspres' ? routeData?.durationDriving : routeData?.durationWalking),
      routeGeometry: routeData?.routeGeometry,
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessPopup(true);
      onSuccess(newOrder);
    }, 1500);
  };

  const scrollAndFocusRoute = () => {
    const el = document.getElementById('cekrute');
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      window.scrollTo({
        top: elementRect - bodyRect - offset,
        behavior: 'smooth'
      });
    }
  };

  const handleRedirectWhatsApp = () => {
    window.open(generatedWaLink, '_blank');
    setShowSuccessPopup(false);
  };

  const handleOutOfRadiusWhatsApp = () => {
    try {
      const existing = localStorage.getItem('lavender_out_of_radius_leads');
      const leads = existing ? JSON.parse(existing) : [];
      const newLead = {
        id: 'LEAD-' + Date.now(),
        name: formData.name || 'Pelanggan Anonim',
        phone: formData.phone || '-',
        address: formData.address || '(alamat belum diisi)',
        distance: routeData?.distance || 0,
        timestamp: new Date().toISOString()
      };
      leads.push(newLead);
      localStorage.setItem('lavender_out_of_radius_leads', JSON.stringify(leads));
    } catch (e) {
      console.error('Error saving lead:', e);
    }
  };

  // Render Step 1
  const renderStep1 = () => {
    // If dynamic services are available, render them!
    const activeServices = services ? services.filter(s => s.isActive) : [];
    
    // Default list if none
    const displayServices = activeServices.length > 0 ? activeServices : [
      { name: 'Cuci Komplit', description: 'Dicuci, Dikeringkan, Disetrika, serta dikemas wangi dan rapi', badge: 'Terpilih & Bersih' },
      { name: 'Setrika Saja', description: 'Disetrika, serta dikemas wangi dan rapi', badge: 'Setrika Saja' },
      { name: 'Cuci Kering', description: 'Dicuci, Dikeringkan, Dilipat rapi, serta dikemas wangi', badge: 'Bahan Eksklusif' }
    ];

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h4 className="font-display text-lg font-bold text-slate-800">
            Pilih Layanan Utama
          </h4>
          <p className="font-sans text-xs text-slate-400 mt-1">
            Layanan sterilisasi dasar premium yang dicocokkan sesuai kebutuhan cuci Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {displayServices.map((service) => {
            const isSelected = serviceType === service.name;
            let IconComp = Shirt;
            if (service.name.toLowerCase().includes('kering')) IconComp = Wind;
            else if (service.name.toLowerCase().includes('setrika')) IconComp = Sparkles;
            
            return (
              <button
                key={service.name}
                type="button"
                onClick={() => setServiceType(service.name)}
                className={`p-6 rounded-3xl border-2 text-left flex flex-col justify-between transition-all duration-300 relative group cursor-pointer ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/50 shadow-md ring-1 ring-purple-600'
                    : 'border-purple-100 bg-white hover:border-purple-300 hover:bg-slate-50/50 shadow-sm'
                }`}
              >
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                  <IconComp className="w-3.5 h-3.5" />
                </div>
                <div className="mt-4">
                  <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-100/60 px-2.5 py-0.5 rounded-full inline-block mb-2">
                    {service.badge || 'Layanan Premium'}
                  </span>
                  <h5 className="font-display font-bold text-slate-800 text-sm">
                    {service.name}
                  </h5>
                  <p className="font-sans text-[11px] text-slate-500 mt-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Step 2
  const renderStep2 = () => {
    const currentTabDetails = categories.find(c => c.id === activeCategoryTab) || categories[0];

    return (
      <div className="space-y-6">
        <div className="text-center max-w-lg mx-auto">
          <h4 className="font-display text-lg font-bold text-slate-800">
            Pilih Kategori & Jumlah Pakaian
          </h4>
          <p className="font-sans text-xs text-slate-400 mt-1">
            Tambah jumlah satuan pakaian yang akan dilaundry. Layanan terpilih: <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md">{serviceType}</span>
          </p>
        </div>

        {/* Category filtering buttons layout */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-purple-100 pb-4">
          {categories.map((cat) => {
            const qtyInCat = cat.items.reduce((acc, item) => acc + getItemQty(item.name), 0);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryTab(cat.id)}
                className={`flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-300 ${
                  activeCategoryTab === cat.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-100'
                    : 'bg-white text-slate-500 hover:text-slate-850 hover:bg-slate-50 border border-slate-150'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                {qtyInCat > 0 && (
                  <span className="bg-white text-purple-600 font-bold w-4.5 h-4.5 rounded-full text-[9px] flex items-center justify-center shadow-xs ml-1">
                    {qtyInCat}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Item listing inside selected category glassmorphism list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentTabDetails.items.map((item) => {
            const qty = getItemQty(item.name);
            return (
              <div
                key={item.name}
                className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-purple-100/40 hover:border-purple-300 hover:bg-white/80 transition-all duration-300 shadow-[0_4px_12px_rgba(112,72,232,0.01)] flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-755 font-display">
                    {item.name}
                  </span>
                  <span className="block text-[11px] text-purple-600 font-semibold font-sans">
                    {formatRupiah(item.price)} / pcs
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAdjustQty(item.name, -1)}
                    disabled={qty <= 0}
                    className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 cursor-pointer flex items-center justify-center hover:bg-purple-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-purple-900">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustQty(item.name, 1)}
                    className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 cursor-pointer flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all active:scale-95 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live tally calculation banner inside Step 2 */}
        <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-purple-600 font-semibold block">Total Keranjang Terpilih:</span>
            <span className="text-slate-600 text-[11px]">{totalItemsCount()} total pakaian diinput</span>
          </div>
          <span className="text-sm font-extrabold text-purple-700">
            {formatRupiah(getItemsSubtotal())}
          </span>
        </div>
      </div>
    );
  };

  // Render Step 3
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center max-w-lg mx-auto">
        <h4 className="font-display text-lg font-bold text-slate-800">
          Pilih Layanan Tambahan (Waktu Selesai)
        </h4>
        <p className="font-sans text-xs text-slate-400 mt-1">
          Sesuaikan kecepatan prioritas penanganan laundry estetik dengan anggaran harian keluarga Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Reguler speed */}
        <button
          type="button"
          onClick={() => setShippingSpeed('reguler')}
          className={`p-6 rounded-3xl border-2 text-left flex flex-col justify-between transition-all duration-300 relative group cursor-pointer ${
            shippingSpeed === 'reguler'
              ? 'border-purple-600 bg-purple-50/50 shadow-md ring-1 ring-purple-600'
              : 'border-purple-100 bg-white hover:border-purple-300 hover:bg-slate-50/50 shadow-sm'
          }`}
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h5 className="font-display font-bold text-slate-800 text-sm">
                REGULER (2-3 Hari)
              </h5>
              <span className="text-[9px] uppercase font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                Hemat
              </span>
            </div>
            <p className="font-sans text-[11px] text-slate-400 mt-2 leading-relaxed">
              Pencucian ramah kantong harian tanpa tambahan biaya. Rapi, presisi, bersih steril, &amp; dilipat estetik.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-purple-200/30 flex items-center justify-between w-full">
            <span className="text-xs text-slate-400 font-medium">Biaya Tambahan</span>
            <span className="text-xs text-emerald-600 font-bold">Rp 0 (Gratis)</span>
          </div>
        </button>

        {/* Ekspres speed */}
        <button
          type="button"
          onClick={() => setShippingSpeed('ekspres')}
          className={`p-6 rounded-3xl border-2 text-left flex flex-col justify-between transition-all duration-300 relative group cursor-pointer ${
            shippingSpeed === 'ekspres'
              ? 'border-gold-rose bg-amber-50/10 shadow-md ring-1 ring-gold-rose'
              : 'border-purple-100 bg-white hover:border-gold-rose/45 hover:bg-amber-50/5 shadow-sm'
          }`}
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 border border-amber-200/50">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <div className="flex items-center gap-2">
              <h5 className="font-display font-bold text-slate-800 text-sm">
                EKSPRES / KILAT (1 Hari)
              </h5>
              <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Cepat
              </span>
            </div>
            <p className="font-sans text-[11px] text-slate-400 mt-2 leading-relaxed">
              Prioritas utama pengerjaan cepat premium laundry. Selesai dalam 1 hari penuh untuk kebutuhan darurat.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-amber-200/30 flex items-center justify-between w-full">
            <span className="text-xs text-slate-400 font-medium">Biaya Tambahan</span>
            <span className="text-xs text-amber-600 font-extrabold">+ Rp 10.000</span>
          </div>
        </button>
      </div>
    </div>
  );

  // Render Step 4
  const renderStep4 = () => {
    const list = getActiveItemsList();
    const estimateTimeText = shippingSpeed === 'ekspres' ? '1 Hari (Ekspres Prioritas)' : '2-3 Hari (Reguler)';

    return (
      <div className="space-y-6">
        <div className="text-center max-w-lg mx-auto">
          <h4 className="font-display text-lg font-bold text-slate-800">
            Ringkasan Rincian Pesanan
          </h4>
          <p className="font-sans text-xs text-slate-400 mt-1">
            Hitungan transparan biaya penanganan cucian. Sesuai jumlah pakaian yang Anda input di Step 2.
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-purple-100 shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-purple-100 text-xs">
            <span className="text-slate-400">Pilihan Layanan:</span>
            <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg">{serviceType}</span>
          </div>

          {/* Table display */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {list.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-[12px] py-1 border-b border-dashed border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">{item.name}</span>
                  <span className="text-slate-400 text-[10px] bg-slate-100 px-1.5 py-0.2 rounded-full">x{item.qty} pcs</span>
                </div>
                <div className="font-medium text-slate-600">
                  {formatRupiah(item.itemSubtotal)}
                </div>
              </div>
            ))}
          </div>

          {/* Subtotals & speed costs */}
          <div className="space-y-2 pt-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal Pakaian:</span>
              <span className="font-medium">{formatRupiah(getItemsSubtotal())}</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Layanan Tambahan ({shippingSpeed === 'ekspres' ? 'Ekspres 1 Hari' : 'Reguler'}):</span>
              <span className="font-medium text-amber-600">+{formatRupiah(getShippingFee())}</span>
            </div>

            <div className="flex justify-between text-slate-550">
              <span>Estimasi Waktu Selesai:</span>
              <span className="font-bold text-purple-600">{estimateTimeText}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between pt-4 border-t border-purple-100 text-base">
              <span className="font-bold text-slate-800">TOTAL ESTIMASI:</span>
              <span className="font-extrabold text-purple-700 md:text-lg">{formatRupiah(getGrandTotal())}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Step 5
  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center max-w-lg mx-auto">
        <h4 className="font-display text-lg font-bold text-slate-800">
          Form Data Diri Customer
        </h4>
        <p className="font-sans text-xs text-slate-400 mt-1">
          Lengkapi data alamat penjemputan &amp; kontak agar kurir Susyi Laundry bisa menelusuri lokasi Anda dengan mudah.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
        {/* Name */}
        <div>
          <label className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-purple-400" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama lengkap Anda"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-350 text-sm font-medium text-slate-700 font-sans"
            />
          </div>
        </div>

        {/* Whatsapp */}
        <div>
          <label className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Nomor WhatsApp <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-purple-400" />
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Masukkan nomor WhatsApp aktif"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-355 text-sm font-medium text-slate-700 font-sans"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Alamat Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-sm">✉️</span>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Masukkan alamat email aktif"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-355 text-sm font-medium text-slate-700 font-sans"
            />
          </div>
        </div>

        {/* Date picker */}
        <div>
          <label className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Tanggal Pengambilan Kurir <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-purple-400 pointer-events-none" />
            <input
              type="date"
              required
              min={getMinPickupDate()}
              value={formData.pickupDate}
              onChange={(e) => {
                const newDate = e.target.value;
                const { dateStr, hour } = getJakartaTime();
                let newTime = formData.pickupTime;
                
                // If they changed to today, and currently selected time is now disabled
                if (newDate === dateStr && newTime) {
                  const slotHour = parseInt(newTime.split(':')[0], 10);
                  if (slotHour <= hour) {
                    newTime = ''; // reset invalid time
                  }
                }
                setFormData({ ...formData, pickupDate: newDate, pickupTime: newTime });
              }}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all text-sm text-slate-600 font-sans"
            />
          </div>
        </div>

        {/* Jam Penjemputan Dropdown */}
        <div>
          <label className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Jam Penjemputan <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-purple-400 pointer-events-none" />
            <select
              required
              value={formData.pickupTime}
              onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all text-sm text-slate-700 font-medium font-sans appearance-none cursor-pointer"
            >
              <option value="">Pilih Jam Jemput (08:00 - 20:00)</option>
              {allTimeSlots.map((time) => {
                const isDisabled = isTimeSlotDisabled(time);
                return (
                  <option 
                    key={time} 
                    value={time} 
                    disabled={isDisabled}
                    className={isDisabled ? 'text-slate-300' : 'text-slate-700'}
                  >
                    {time} WIB {isDisabled ? '(Sudah Lewat / Tidak Tersedia)' : ''}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-purple-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          {/* Operational Hours info block */}
          <div className="mt-2 bg-purple-50/50 border border-purple-100/40 p-2.5 rounded-xl text-[10px] text-slate-500 flex items-start gap-1.5 leading-relaxed font-sans font-medium">
            <span className="shrink-0 select-none text-xs">🕐</span>
            <div>
              <span className="font-bold text-purple-950 block">Jam Operasional: Senin - Minggu (08.00 - 20.00)</span>
              <p className="text-slate-500 text-[9px] font-normal mt-0.5">Kurir kami siap menjemput pukul 08.00 - 20.00 WIB</p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Alamat Lengkap Rumah <span className="text-red-500">*</span>
          </label>
          <span className="text-[10px] text-purple-500 bg-purple-50/70 px-2.5 py-1.5 rounded-xl inline-block mb-1.5 font-medium leading-relaxed font-sans">
            💡 Untuk kepresisian titik lokasi kurir, disarankan cek dan pilih rute penjemputan dari Peta di atas terlebih dahulu.
          </span>
          <textarea
            rows={2}
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Masukkan alamat lengkap rumah Anda"
            className="w-full px-4 py-3 rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-350 text-sm resize-none text-slate-700 leading-normal font-sans"
          />

          {/* DYNAMIC SERVICE RADIUS STATUS */}
          <div className="mt-3">
            {!routeData?.routeChecked ? (
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/50 flex items-start gap-2.5 text-xs font-medium font-sans">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Status Jangkauan: Belum Dicek</span>
                  <p className="text-amber-750 text-[11px] font-normal mt-0.5">Silakan tentukan rute dan titik penjemputan pada peta di atas terlebih dahulu untuk memverifikasi jangkauan kurir kami.</p>
                </div>
              </div>
            ) : routeData.distance <= 2 ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-250 flex items-start gap-2.5 text-xs font-medium font-sans shadow-xs">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-950 block">✅ Alamat Anda dalam jangkauan layanan antar jemput</span>
                  <div className="mt-1 text-slate-600 font-medium space-y-0.5 text-[11px]">
                    <p>📍 Jarak Anda: <strong className="text-emerald-800 font-bold">{routeData.distance} km</strong></p>
                    <p>📍 Maksimal: <strong className="text-slate-700">2 km</strong></p>
                    <p className="text-emerald-750 text-[10px] font-normal mt-1 leading-relaxed">Selamat! Anda dapat melanjutkan pemesanan langsung via website ini.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200 flex flex-col gap-3 text-xs font-medium font-sans shadow-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-950 block">❌ DI LUAR RADIUS LAYANAN</span>
                    <p className="text-rose-750 text-[11px] font-normal mt-1 leading-relaxed">
                      Maaf, alamat Anda berada di luar radius layanan antar jemput kami.
                    </p>
                    <div className="mt-2 text-slate-600 font-semibold space-y-0.5 text-[11px]">
                      <p>📍 Jarak Anda: <strong className="text-rose-700 font-bold">{routeData.distance} km</strong></p>
                      <p>📍 Maksimal: <strong className="text-slate-700">2 km</strong></p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/60 p-3 rounded-xl border border-rose-100/50">
                  <p className="text-[11px] text-slate-650 leading-relaxed font-normal">
                    Silakan hubungi kami langsung melalui WhatsApp untuk pemesanan manual. Admin kami siap membantu Anda!
                  </p>
                  <a
                    href={`https://api.whatsapp.com/send?phone=6281231009060&text=${encodeURIComponent(getOutOfRadiusMessageText())}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3.5 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-purple-950 bg-gradient-to-r from-amber-200 via-amber-300 to-[#B78A62] hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer text-center"
                    style={{ border: '1px solid rgba(183,138,98,0.2)' }}
                  >
                    <MessageSquare className="w-4 h-4 stroke-purple-950" />
                    💬 Hubungi WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Contoh: Titip pewangi lavender ekstra banyak, pisahkan pakaian berwarna putih..."
            className="w-full px-4 py-3 rounded-2xl bg-white border border-purple-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 focus:outline-none transition-all placeholder:text-slate-350 text-sm resize-none text-slate-700 leading-normal font-sans"
          />
        </div>
      </div>
    </div>
  );

  // Render Step 6
  const renderStep6 = () => {
    const list = getActiveItemsList();
    const estimateTimeText = shippingSpeed === 'ekspres' ? '1 Hari (Prioritas Ekspres)' : '2-3 Hari (Reguler)';

    return (
      <div className="space-y-6">
        <div className="text-center max-w-lg mx-auto">
          <h4 className="font-display text-lg font-bold text-slate-800">
            Review Rencana Order
          </h4>
          <p className="font-sans text-xs text-slate-400 mt-1">
            Konfirmasi data akhir order sebelum diarahkan langsung ke WhatsApp Hotline kurir kami.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Customer info review box */}
          <div className="bg-white/60 border border-purple-100 rounded-3xl p-5 space-y-3.5 text-xs">
            <h5 className="font-display font-bold text-slate-800 pb-2 border-b border-purple-100 flex items-center gap-1.5 text-xs">
              <User className="w-4 h-4 text-purple-600" /> Data Customer &amp; Kontak
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Nama:</span>
                <span className="font-semibold text-slate-700">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">WhatsApp:</span>
                <span className="font-semibold text-slate-700">{formData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Email:</span>
                <span className="font-semibold text-slate-700">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Rencana Jemput:</span>
                <span className="font-semibold text-slate-700">{formData.pickupDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Jam Jemput:</span>
                <span className="font-bold text-amber-800">{formData.pickupTime ? `${formData.pickupTime} WIB` : '-'}</span>
              </div>
              <div className="pt-2 border-t border-dashed border-purple-100">
                <span className="text-slate-400 font-medium block mb-1">Alamat Penjemputan:</span>
                <p className="font-medium text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {formData.address}
                </p>
              </div>
              {formData.notes && (
                <div className="pt-1">
                  <span className="text-slate-400 font-medium block mb-1">Catatan:</span>
                  <p className="italic text-slate-500 font-medium text-[11px] leading-normal">
                    "{formData.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing review box */}
          <div className="bg-purple-950/5/90 border border-purple-100 rounded-3xl p-5 space-y-3 flex flex-col justify-between text-xs">
            <div className="space-y-3">
              <h5 className="font-display font-bold text-slate-800 pb-2 border-b border-purple-100 flex items-center gap-1.5 text-xs">
                <ShoppingBag className="w-4 h-4 text-purple-600" /> Ringkasan Pembayaran
              </h5>
              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-0.5 text-[11px]">
                {list.map(item => (
                  <div key={item.name} className="flex justify-between text-slate-600">
                    <span>{item.name} (x{item.qty})</span>
                    <span className="font-medium">{formatRupiah(item.itemSubtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-dashed border-purple-200 text-[11px] space-y-1.5 text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal Item:</span>
                  <span className="font-medium text-slate-700">{formatRupiah(getItemsSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkos Kilat:</span>
                  <span className="font-medium text-slate-700">{formatRupiah(getShippingFee())}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>Waktu Kirim:</span>
                  <span className="font-bold text-purple-700">{estimateTimeText}</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-3 rounded-2xl flex justify-between items-center border border-purple-100 mt-2">
              <span className="font-bold text-slate-700 text-[11px]">TOTAL TAGIHAN:</span>
              <span className="font-extrabold text-purple-700 text-sm md:text-base">{formatRupiah(getGrandTotal())}</span>
            </div>
          </div>
        </div>

        {/* Live routing check indicator inside Step 6 */}
        {routeData?.routeChecked && (
          <div className="max-w-3xl mx-auto rounded-2xl p-3 bg-emerald-50 text-emerald-800 border border-emerald-150 flex items-start gap-2 text-[11px]">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Integrasi GIS Aktif!</span>
              <span>
                Disiapkan navigasi kurir Beji berkeliling <strong className="font-semibold">{routeData.distance} km</strong> dengan estimasi jemput berkendara <strong className="font-semibold">{routeData.durationDriving} menit</strong>.
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWizardContent = () => {
    switch(currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return renderStep1();
    }
  };

  return (
    <section id="pesan-form" className="py-20 md:py-28 bg-gradient-to-tr from-purple-100/40 via-purple-50/10 to-white relative overflow-hidden">
      
      {/* Absolute decorative accents */}
      <div className="absolute top-1/2 left-10 w-72 h-72 bg-gradient-to-tr from-lavender-accent/10 to-purple-200/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className={`max-w-4xl mx-auto px-6 relative z-10 transition-all duration-500 ${!customer ? 'filter blur-md pointer-events-none select-none' : ''}`}>
        <fieldset disabled={!customer} className="w-full space-y-0 block border-0 p-0 m-0">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="font-sans text-xs font-semibold text-purple-700 tracking-widest uppercase bg-purple-100/55 px-3 py-1 rounded-full inline-block">
            Sistem Booking Mandiri
          </span>
          <h2 className="font-display text-3xl md:text-4xl text-slate-aesthetic mt-3 mb-4 font-bold leading-tight">
            Formulir Layanan Pesanan
          </h2>
          <p className="font-sans text-sm text-slate-500">
            Pilih jenis cuci, list pakaian secara interaktif, isi detail Anda, dan selesaikan penjemputan dengan satu ketukan praktis.
          </p>
        </div>

        {/* Global Progress Bar Checklist */}
        <div className="mb-10 max-w-2xl mx-auto">
          {/* Progress indicators on desktop / tablet */}
          <div className="hidden sm:flex justify-between items-center relative after:content-[''] after:h-0.5 after:bg-purple-100 after:absolute after:left-4 after:right-4 after:top-1/2 after:-translate-y-1/2 after:-z-10 cursor-default">
            {[1, 2, 3, 4, 5, 6].map((step) => {
              const labels = ['Layanan', 'Kategori', 'Waktu', 'Tally', 'Customer', 'Review'];
              const isStepActive = step === currentStep;
              const isStepDone = step < currentStep;

              return (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-xs font-bold transition-all duration-300 border-2 select-none ${
                    isStepActive 
                      ? 'bg-purple-600 border-purple-600 text-white ring-4 ring-purple-100 scale-105 shadow-md shadow-purple-200' 
                      : isStepDone 
                        ? 'bg-purple-150 border-purple-300 text-purple-700 font-extrabold'
                        : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {isStepDone ? <Check className="w-3.5 h-3.5" /> : step}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold mt-2 transition-colors ${
                    isStepActive ? 'text-purple-700 font-extrabold' : 'text-slate-400'
                  }`}>
                    {labels[step - 1]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Simple progress indicators on mobile */}
          <div className="sm:hidden flex items-center justify-between bg-purple-50 p-3.5 rounded-2xl border border-purple-100">
            <span className="text-xs font-bold text-purple-700 font-display">
              Wizard Step {currentStep} dari 6
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div 
                  key={step} 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step === currentStep 
                      ? 'w-6 bg-purple-600' 
                      : step < currentStep 
                        ? 'w-2 bg-purple-300' 
                        : 'w-2 bg-slate-250'
                  }`} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Outer card (Wizard glassmorphism layout card style) */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-10 border border-purple-100/65 shadow-[0_12px_44px_rgba(112,72,232,0.02)] min-h-[460px] flex flex-col justify-between">
          
          {/* Top route checked status bar for immediate notification validation */}
          {!routeData?.routeChecked && (
            <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs mb-6">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-normal">
                  <span className="font-bold block">Cek Rute Peta Belum Dilaksanakan</span>
                  <span className="text-amber-750 font-medium">
                    Sesuai petunjuk, silakan tandai titik rumah Anda di peta terlebih dahulu sebelum menyelesaikan pemesanan!
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={scrollAndFocusRoute}
                className="text-[10px] uppercase font-bold text-amber-800 hover:text-amber-900 border border-amber-250 hover:bg-amber-100/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Cek Peta Atas
              </button>
            </div>
          )}

          {/* Animate wizard steps transition nicely */}
          <div className="flex-grow py-2">
            {renderWizardContent()}
          </div>

          {/* Error notification indicator block */}
          {formError && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-650 text-xs border border-red-100 mt-6 flex items-start gap-2.5 max-w-2xl mx-auto w-full">
              <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
              <span className="font-semibold">{formError}</span>
            </div>
          )}

          {/* Navigation Action Footer panel */}
          <div className="flex items-center justify-between pt-8 border-t border-purple-100 mt-8 gap-4">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="py-3 px-5 bg-purple-50 hover:bg-purple-100/75 text-purple-700 hover:text-purple-900 border border-purple-200 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              KEMBALI
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-100 transition-all active:scale-95"
              >
                Lanjutkan Step
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : currentStep === 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="py-3 px-6 bg-[#B78A62] hover:bg-[#976A42] text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-900/10 transition-all active:scale-95"
              >
                LANJUTKAN STEP
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitFinal}
                disabled={isSubmitting}
                className={`py-3.5 px-8 font-sans text-xs font-extrabold uppercase tracking-widest rounded-2xl cursor-pointer transition-all focus:outline-none flex items-center gap-2 relative overflow-hidden ${
                  routeData?.routeChecked 
                    ? 'bg-[#B78A62] hover:bg-[#996F4B] text-white shadow-amber-900/10 shadow-[0_0_20px_rgba(183,138,98,0.3)] animate-pulse' 
                    : 'bg-slate-400 text-white cursor-not-allowed opacity-80'
                }`}
                style={{
                  boxShadow: routeData?.routeChecked ? '0 0 20px 2px rgba(183, 138, 98, 0.4)' : 'none'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan Pesanan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-250 animate-bounce" />
                    PESAN SEKARANG (WHATSAPP)
                  </>
                )}
              </button>
            )}
          </div>

        </div>
        </fieldset>
      </div>

      {/* Centered Login Overlay when user is not authenticated */}
      {!customer && (
        <div className="absolute inset-0 z-20 bg-[#FAF8FF]/45 flex items-center justify-center p-6 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md max-w-sm w-full p-8 rounded-3xl border border-purple-200/80 shadow-[0_20px_50px_rgba(112,72,232,0.15)] text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto text-purple-700">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-slate-800">
                Akses Terbatas
              </h3>
              <p className="font-sans text-xs text-slate-500 mt-2 leading-relaxed">
                Silakan login terlebih dahulu untuk melakukan pemesanan.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full py-3 px-5 bg-gradient-to-r from-purple-700 to-[#B78A62] hover:opacity-95 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4 shrink-0" />
              Masuk / Login Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Success Popup Modal */}
      <AnimatePresence>
        {showSuccessPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/20 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[420px] mx-auto bg-gradient-to-b from-[#FAF8FF] to-[#F1EAFF] rounded-[24px] border border-purple-200/50 shadow-[0_20px_50px_rgba(112,72,232,0.18)] overflow-hidden relative font-sans text-slate-800"
            >
              {/* Ticket Cut Accent Effect at Left and Right */}
              <div className="absolute left-[-10px] top-[140px] w-5 h-5 rounded-full bg-slate-900/40 z-20" />
              <div className="absolute right-[-10px] top-[140px] w-5 h-5 rounded-full bg-slate-900/40 z-20" />

              {/* Header Section */}
              <div className="bg-gradient-to-r from-purple-900 via-purple-950 to-[#4A207B] p-6 text-center relative border-b border-dashed border-purple-300/30">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
                <div className="mx-auto w-12 h-12 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200 to-[#B78A62] flex items-center justify-center shadow-lg border border-white/20 mb-3 animate-pulse">
                  {/* Sparkles or leaf icon in gold color */}
                  <Sparkles className="w-5 h-5 text-purple-950 stroke-amber-100" />
                </div>
                <h3 className="font-sans font-extrabold text-[12px] tracking-[0.15em] text-[#FFDF9F] uppercase text-center flex items-center justify-center gap-1">
                  ✦ ORDER SUSYI LAUNDRY ✦
                </h3>
                <p className="text-[10px] text-purple-200 font-medium leading-relaxed max-w-[280px] mx-auto mt-1.5 italic">
                  "Terima kasih telah mempercayakan laundry Anda kepada kami"
                </p>
              </div>

              {/* Body Content with simulated dashed layout ticket */}
              <div className="p-6 space-y-5 max-h-[50vh] overflow-y-auto">
                {/* Detail Pelanggan */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#B78A62] flex items-center gap-1.5 align-middle">
                    <span className="text-[12px]">👤</span> Detail Pelanggan
                  </h4>
                  <div className="bg-white/80 p-3.5 rounded-2xl border border-purple-100/60 space-y-2 text-xs shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 font-medium shrink-0">Nama Lengkap:</span>
                      <span className="font-bold text-slate-800 text-right">{formData.name}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 font-medium shrink-0">No. WhatsApp:</span>
                      <span className="font-semibold text-slate-700 text-right">{formData.phone}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 font-medium shrink-0">Alamat Email:</span>
                      <span className="font-semibold text-slate-700 text-right">{formData.email}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 font-medium shrink-0">Rencana Jemput:</span>
                      <span className="font-semibold text-slate-700 text-right">{formData.pickupDate}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 font-medium shrink-0">Jam Jemput:</span>
                      <span className="font-bold text-amber-800 text-right">{formData.pickupTime ? `${formData.pickupTime} WIB` : '-'}</span>
                    </div>
                    <div className="pt-2 border-t border-dashed border-purple-100 flex flex-col gap-1">
                      <span className="text-slate-400 font-medium text-[9px] uppercase tracking-wider block">Alamat Jemput:</span>
                      <p className="font-medium text-slate-600 bg-purple-50/55 p-2 rounded-xl text-[11px] leading-relaxed">
                        {formData.address}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400 font-medium text-[9px] uppercase tracking-wider block">Catatan Tambahan:</span>
                      <p className="font-medium text-slate-600 italic bg-purple-50/55 p-2 rounded-xl text-[11px]">
                        {formData.notes || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detail Layanan */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#B78A62] flex items-center gap-1.5 align-middle">
                    <span className="text-[12px]">🧺</span> Detail Layanan
                  </h4>
                  <div className="bg-white/80 p-3.5 rounded-2xl border border-purple-100/60 space-y-2 text-xs shadow-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Layanan Utama:</span>
                      <span className="font-bold text-purple-700 bg-purple-100/50 px-2.5 py-0.5 rounded-lg text-[11px]">
                        {serviceType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Durasi Selesai:</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg text-[11px]">
                        {shippingSpeed === 'ekspres' ? 'Ekspres 1 Hari' : 'Reguler 2-3 Hari'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rincian Item Itemized Receipt */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#B78A62] flex items-center gap-1.5 align-middle">
                    <span className="text-[12px]">👔</span> Rincian Item ({totalItemsCount()} Pcs)
                  </h4>
                  <div className="bg-white/80 p-3.5 rounded-2xl border border-purple-100/60 text-xs shadow-xs">
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {getActiveItemsList().map((item) => (
                        <div key={item.name} className="flex justify-between items-center text-[11px] py-1 border-b border-purple-100/20">
                          <span className="font-semibold text-slate-700">{item.name}</span>
                          <span className="text-slate-500 font-medium">
                            ({item.qty} pcs) x {formatRupiahText(item.price)} = <strong className="text-purple-950 font-bold">{formatRupiahText(item.itemSubtotal)}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ringkasan Biaya with gold rose gradient aesthetic */}
                <div className="bg-gradient-to-r from-purple-900 to-[#5C2B92] p-4 rounded-2xl border border-purple-100/30 text-white space-y-2 shadow-md">
                  <div className="flex justify-between text-[11px] opacity-95">
                    <span>Subtotal Item:</span>
                    <span className="font-medium">{formatRupiahText(getItemsSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-[11px] opacity-95">
                    <span>Tambahan Speed:</span>
                    <span className="font-medium">
                      {shippingSpeed === 'ekspres' ? `+ ${formatRupiahText(10000)}` : 'Rp 0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2.5 border-t border-white/20">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200">TOTAL AKHIR</span>
                    <span className="text-lg font-extrabold text-[#FFDF9F]">
                      {formatRupiahText(getGrandTotal())}
                    </span>
                  </div>
                </div>

                {/* Detail Rute Kurir Integrations GIS */}
                {routeData?.routeChecked && (
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#B78A62] flex items-center gap-1.5 align-middle">
                      <span className="text-[12px]">📍</span> Detail Rute Kurir
                    </h4>
                    <div className="bg-[#FCFAF2] p-3.5 rounded-2xl border border-amber-100 flex items-center justify-between text-[11px] shadow-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Jarak Navigasi:</span>
                        <strong className="text-slate-800 font-bold">{routeData.distance} km</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block font-medium">Estimasi Udara/Jalan:</span>
                        <strong className="text-[#B78A62] font-bold">{routeData.durationDriving} menit</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Callout Message */}
                <div className="text-center pt-2 pb-1">
                  <p className="text-[10px] text-purple-600 font-semibold leading-relaxed max-w-[270px] mx-auto italic">
                    "Mohon konfirmasi pesan WhatsApp ini agar Kurir kami segera meluncur ke lokasi Anda."
                  </p>
                </div>
              </div>

              {/* Button Section inside mobile chat receipt view */}
              <div className="bg-purple-100/40 p-5 border-t border-purple-200/50 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleRedirectWhatsApp}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-100 transition-all active:scale-95 text-center"
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    Kirim WA
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className="py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-100 transition-all active:scale-95 text-center"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200 shrink-0" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-4 h-4 shrink-0" />
                        Salin Nota
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleFinishAndClose}
                  className="py-3.5 w-full bg-gradient-to-r from-purple-800 to-[#B78A62] hover:opacity-95 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer text-center shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4.5 h-4.5 shrink-0 text-emerald-300" />
                  Selesai & Kembali ke Beranda
                </button>

                <button
                  type="button"
                  onClick={() => setShowSuccessPopup(false)}
                  className="py-2.5 w-full bg-white hover:bg-slate-50 border border-slate-150 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  KOREKSI / EDIT KEMBALI
                </button>

                {/* Beautiful copyright line */}
                <div className="text-center text-[9px] text-purple-400 font-bold pt-1.5">
                  © 2026 Susyi Laundry - take care with ❤️
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Out of Service Radius Modal */}
        {showRadiusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[420px] mx-auto bg-gradient-to-b from-[#FAF8FF] to-[#F1EAFF] rounded-[24px] border border-rose-200/55 shadow-[0_20px_50px_rgba(225,29,72,0.15)] overflow-hidden relative font-sans text-slate-800"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowRadiusModal(false)}
                className="absolute right-4 top-4 w-7 h-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-slate-500 hover:text-slate-700 transition-all cursor-pointer z-30 font-bold"
                aria-label="Tutup"
              >
                <span className="text-xs font-semibold">✕</span>
              </button>

              {/* Header Section */}
              <div className="bg-gradient-to-r from-purple-900 via-purple-950 to-[#4A207B] p-6 text-center relative border-b border-dashed border-rose-300/30">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
                <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shadow-md border border-rose-200 mb-3 animate-bounce">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="font-sans font-extrabold text-[12px] tracking-[0.15em] text-rose-200 uppercase text-center flex items-center justify-center gap-1">
                  ❌ DI LUAR RADIUS LAYANAN ❌
                </h3>
                <p className="text-[10px] text-purple-200 font-medium leading-relaxed max-w-[280px] mx-auto mt-1.5 italic">
                  "Silahkan ajukan pemesanan manual melalui admin kami"
                </p>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-4 text-center">
                <p className="text-sm font-bold text-slate-700 leading-relaxed">
                  Maaf, alamat Anda berada di luar radius layanan antar jemput kami.
                </p>

                {/* Range stats */}
                <div className="bg-white/80 p-4 rounded-2xl border border-purple-100/60 max-w-xs mx-auto space-y-2.5 text-xs shadow-xs text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <span>📍</span> Jarak Anda:
                    </span>
                    <span className="font-extrabold text-rose-600 text-sm">
                      {routeData?.distance} km
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <span>📍</span> Jangkauan Maksimal:
                    </span>
                    <span className="font-bold text-slate-700">
                      2 km
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed max-w-[285px] mx-auto">
                  Silakan hubungi kami langsung melalui WhatsApp untuk pemesanan manual.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="bg-purple-100/40 p-5 border-t border-purple-200/50 flex flex-col gap-2.5">
                <a
                  href={`https://api.whatsapp.com/send?phone=6281231009060&text=${encodeURIComponent(getOutOfRadiusMessageText())}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleOutOfRadiusWhatsApp}
                  className="py-3.5 px-4 bg-gradient-to-r from-amber-200 via-amber-300 to-[#B78A62] hover:opacity-95 text-purple-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-900/10 transition-all active:scale-95 text-center font-sans border border-amber-400/20"
                >
                  <MessageSquare className="w-4 h-4 stroke-purple-950 shrink-0" />
                  Hubungi WhatsApp
                </a>

                <button
                  type="button"
                  onClick={() => setShowRadiusModal(false)}
                  className="py-2.5 w-full bg-white hover:bg-slate-50 border border-slate-150 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center font-sans"
                >
                  KOREKSI ALAMAT / PETA
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Within Service Radius Modal (Success Notification) */}
        {showSuccessRadiusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[420px] mx-auto bg-gradient-to-b from-[#FAF8FF] to-[#F1EAFF] rounded-[24px] border border-emerald-200/55 shadow-[0_20px_50px_rgba(16,185,129,0.15)] overflow-hidden relative font-sans text-slate-800"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowSuccessRadiusModal(false)}
                className="absolute right-4 top-4 w-7 h-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-slate-500 hover:text-slate-700 transition-all cursor-pointer z-30 font-bold"
                aria-label="Tutup"
              >
                <span className="text-xs font-semibold">✕</span>
              </button>

              {/* Header Section */}
              <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 p-6 text-center relative border-b border-dashed border-emerald-300/30">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shadow-md border border-emerald-250 mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-sans font-extrabold text-[12px] tracking-[0.15em] text-emerald-200 uppercase text-center flex items-center justify-center gap-1">
                  ✅ DALAM JANGKAUAN LAYANAN ✅
                </h3>
                <p className="text-[10px] text-emerald-100 font-medium leading-relaxed max-w-[280px] mx-auto mt-1.5 italic">
                  "Alamat Anda berada dalam jangkauan kurir kami"
                </p>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-4 text-center">
                <p className="text-sm font-bold text-slate-700 leading-relaxed">
                  Alamat Anda dalam radius layanan antar jemput kami.
                </p>

                {/* Range stats */}
                <div className="bg-white/80 p-4 rounded-2xl border border-emerald-100/60 max-w-xs mx-auto space-y-2.5 text-xs shadow-xs text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <span>📍</span> Jarak Anda:
                    </span>
                    <span className="font-extrabold text-emerald-600 text-sm">
                      {routeData?.distance} km
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <span>📍</span> Jangkauan Maksimal:
                    </span>
                    <span className="font-bold text-slate-700">
                      2 km
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed max-w-[285px] mx-auto">
                  Silakan lanjutkan pemesanan Anda.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="bg-emerald-50/50 p-5 border-t border-emerald-100/50 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessRadiusModal(false);
                    setCurrentStep(6);
                  }}
                  className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-900/10 transition-all active:scale-95 text-center font-sans border border-emerald-500/20"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  📝 Lanjutkan Pemesanan
                </button>

                <button
                  type="button"
                  onClick={() => setShowSuccessRadiusModal(false)}
                  className="py-2.5 w-full bg-white hover:bg-slate-50 border border-slate-150 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center font-sans"
                >
                  KOREKSI ALAMAT / PETA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
