import { Customer } from '../types';

export interface AdminService {
  id: string;
  name: string;
  category: string; // e.g. "Terpilih & Bersih", "Setrika Saja", etc.
  description: string;
  icon: string; // icon name like "Shirt", "Sparkles", "Wind"
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface AdminCategory {
  id: string;
  name: string;
  icon: string;
  items: {
    id: string;
    name: string;
    price: number;
    isActive: boolean;
  }[];
  createdAt?: any;
  updatedAt?: any;
}

export interface WebInfo {
  heroBannerTitle: string;
  heroBannerText: string;
  heroBannerVisible: boolean;
  adminWhatsapp: string;
  operationalHours: string[];
  promoText: string;
  terms: string[];
}

// ---------------- DEFAULT INITIALIZERS ----------------

const DEFAULT_SERVICES: AdminService[] = [
  {
    id: 'cuci-komplit',
    name: 'Cuci Komplit',
    category: 'Terpilih & Bersih',
    description: 'Dicuci, Dikeringkan, Disetrika, serta dikemas wangi dan rapi',
    icon: 'Shirt',
    isActive: true
  },
  {
    id: 'setrika-saja',
    name: 'Setrika Saja',
    category: 'Setrika Saja',
    description: 'Disetrika, serta dikemas wangi dan rapi',
    icon: 'Sparkles',
    isActive: true
  },
  {
    id: 'cuci-kering',
    name: 'Cuci Kering',
    category: 'Bahan Eksklusif',
    description: 'Dicuci, Dikeringkan, Dilipat rapi, serta dikemas wangi',
    icon: 'Wind',
    isActive: true
  }
];

const DEFAULT_CATEGORIES: AdminCategory[] = [
  {
    id: 'pakaian',
    name: 'Pakaian',
    icon: '👕',
    items: [
      { id: 'item-kaos', name: 'Kaos', price: 500, isActive: true },
      { id: 'item-mukena', name: 'Mukena', price: 1000, isActive: true },
      { id: 'item-kemeja', name: 'Kemeja', price: 500, isActive: true },
      { id: 'item-blus', name: 'Blus', price: 100, isActive: true },
      { id: 'item-rok-panjang', name: 'Rok Panjang', price: 500, isActive: true },
      { id: 'item-rok-pendek', name: 'Rok Pendek', price: 500, isActive: true },
      { id: 'item-celana-panjang', name: 'Celana Panjang', price: 500, isActive: true },
      { id: 'item-celana-pendek', name: 'Celana Pendek', price: 500, isActive: true },
      { id: 'item-jeans', name: 'Jeans', price: 1000, isActive: true },
      { id: 'item-jaket', name: 'Jaket', price: 2000, isActive: true },
      { id: 'item-jas', name: 'Jas', price: 200, isActive: true },
      { id: 'item-piyama', name: 'Piyama', price: 1000, isActive: true },
      { id: 'item-kebaya', name: 'Kebaya', price: 2000, isActive: true },
      { id: 'item-seragam', name: 'Seragam', price: 1000, isActive: true }
    ]
  },
  {
    id: 'aksesoris',
    name: 'Aksesoris',
    icon: '🎗️',
    items: [
      { id: 'item-jilbab', name: 'Jilbab', price: 500, isActive: true },
      { id: 'item-topi', name: 'Topi', price: 500, isActive: true },
      { id: 'item-sarung-tangan', name: 'Sarung Tangan', price: 500, isActive: true },
      { id: 'item-kaos-kaki', name: 'Kaos Kaki', price: 500, isActive: true },
      { id: 'item-dasi', name: 'Dasi', price: 500, isActive: true },
      { id: 'item-handuk', name: 'Handuk', price: 500, isActive: true }
    ]
  },
  {
    id: 'perlengkapan',
    name: 'Perlengkapan Rumah',
    icon: '🏠',
    items: [
      { id: 'item-selimut', name: 'Selimut', price: 2000, isActive: true },
      { id: 'item-sprei', name: 'Sprei', price: 2000, isActive: true },
      { id: 'item-bed-cover', name: 'Bed Cover', price: 2000, isActive: true }
    ]
  },
  {
    id: 'boneka',
    name: 'Boneka',
    icon: '🧸',
    items: [
      { id: 'item-boneka-kecil', name: 'Boneka Kecil', price: 1000, isActive: true },
      { id: 'item-boneka-medium', name: 'Boneka Medium', price: 2000, isActive: true },
      { id: 'item-boneka-besar', name: 'Boneka Besar', price: 3000, isActive: true }
    ]
  }
];

const DEFAULT_WEB_INFO: WebInfo = {
  heroBannerTitle: 'Informasi Penting',
  heroBannerText: 'Layanan antar jemput hanya tersedia untuk alamat dalam radius maksimal 2 km dari outlet laundry. Silakan gunakan fitur Cek Rute Kami untuk memastikan lokasi Anda berada dalam jangkauan layanan.',
  heroBannerVisible: true,
  adminWhatsapp: '0812-3100-9060',
  operationalHours: [
    'Senin - Sabtu: 07:00 - 19:00 WIB',
    'Minggu: 08:00 - 16:00 WIB',
    'Hari Libur Nasional: Tutup'
  ],
  promoText: 'Laundry berkualitas dengan harga terjangkau, hasil bersih, wangi, rapi, Express 1 Hari, dan gratis antar-jemput hingga 2 km.',
  terms: [
    'Pemesanan antar jemput minimal Rp 30.000 untuk gratis ongkir.',
    'Mohon pisahkan pakaian luntur dari cucian reguler.',
    'Estimasi pengerjaan reguler adalah 2-3 hari kerja.',
    'Estimasi pengerjaan ekspres selesai dalam waktu 24 jam dengan biaya tambahan.'
  ]
};

// ---------------- DB GETTERS AND SETTERS ----------------

export const getServices = (): AdminService[] => {
  const data = localStorage.getItem('lavender_services');
  if (!data) {
    localStorage.setItem('lavender_services', JSON.stringify(DEFAULT_SERVICES));
    return DEFAULT_SERVICES;
  }
  try {
    const services = JSON.parse(data) as AdminService[];
    let updated = false;
    const cuciKomplit = services.find(s => s.id === 'cuci-komplit');
    if (cuciKomplit && (cuciKomplit.description.includes('Disuci') || cuciKomplit.description.includes('disetrika uap presisi'))) {
      cuciKomplit.description = 'Dicuci, Dikeringkan, Disetrika, serta dikemas wangi dan rapi';
      updated = true;
    }
    const setrikaSaja = services.find(s => s.id === 'setrika-saja');
    if (setrikaSaja && setrikaSaja.description.includes('Merapikan kekusutan')) {
      setrikaSaja.description = 'Disetrika, serta dikemas wangi dan rapi';
      updated = true;
    }
    const cuciKering = services.find(s => s.id === 'cuci-kering');
    if (cuciKering && cuciKering.description.includes('Pembersihan sirkulasi')) {
      cuciKering.description = 'Dicuci, Dikeringkan, Dilipat rapi, serta dikemas wangi';
      updated = true;
    }
    if (updated) {
      localStorage.setItem('lavender_services', JSON.stringify(services));
    }
    return services;
  } catch (e) {
    return DEFAULT_SERVICES;
  }
};

export const saveServices = (services: AdminService[]) => {
  localStorage.setItem('lavender_services', JSON.stringify(services));
};

export const getCategories = (): AdminCategory[] => {
  const data = localStorage.getItem('lavender_categories');
  if (!data) {
    localStorage.setItem('lavender_categories', JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  }
  return JSON.parse(data);
};

export const saveCategories = (categories: AdminCategory[]) => {
  localStorage.setItem('lavender_categories', JSON.stringify(categories));
};

export const getWebInfo = (): WebInfo => {
  const data = localStorage.getItem('lavender_web_info');
  if (!data) {
    localStorage.setItem('lavender_web_info', JSON.stringify(DEFAULT_WEB_INFO));
    return DEFAULT_WEB_INFO;
  }
  const parsed = JSON.parse(data);
  if (
    !parsed.promoText ||
    parsed.promoText.includes('Diskon Spesial') ||
    parsed.promoText.includes('Diskon spesial')
  ) {
    parsed.promoText = DEFAULT_WEB_INFO.promoText;
    localStorage.setItem('lavender_web_info', JSON.stringify(parsed));
  }
  return parsed;
};

export const saveWebInfo = (info: WebInfo) => {
  localStorage.setItem('lavender_web_info', JSON.stringify(info));
};

const DEFAULT_USERS: Customer[] = [];

export const getRegisteredUsers = (): Customer[] => {
  const data = localStorage.getItem('lavender_registered_users');
  if (!data) {
    localStorage.setItem('lavender_registered_users', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_USERS;
  }
};

export const saveRegisteredUser = (user: Customer) => {
  const users = getRegisteredUsers();
  const index = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
  const cleanUser = { ...user };
  delete (cleanUser as any).password;

  if (index !== -1) {
    users[index] = { 
      ...users[index], 
      ...cleanUser
    };
    delete (users[index] as any).password;
  } else {
    users.push(cleanUser);
  }
  localStorage.setItem('lavender_registered_users', JSON.stringify(users));
};

export const findRegisteredUserByEmail = (email: string): Customer | undefined => {
  const users = getRegisteredUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const findRegisteredUserByPhone = (phone: string): Customer | undefined => {
  const users = getRegisteredUsers();
  return users.find(u => (u.phone || '').trim() === phone.trim());
};

