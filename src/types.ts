export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  duration: string;
  badge?: string;
  priceEstimate: string;
}

export interface PricingItem {
  id: string;
  name: string;
  category: 'kiloan' | 'satuan' | 'special';
  price: number;
  unit: string;
  iconName: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  comment: string;
  tag: string;
}

export interface BookingDetails {
  customerName: string;
  phone: string;
  address: string;
  serviceType: string;
  weight?: number;
  pickupDate: string;
  notes: string;
}

export interface Customer {
  uid?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  points: number;
  role?: 'customer' | 'admin';
  latitude?: number;
  longitude?: number;
  location_updated_at?: string;
  avatar?: string;
  google_linked?: boolean;
  provider?: string;
  status?: string;
  createdAt?: string;
  lastLogin?: string;
  is_local_sandbox?: boolean;
  orders: {
    id: string;
    date: string;
    serviceType: string;
    totalPrice: number;
    status: string;
    coordinates?: [number, number];
    address?: string;
  }[];
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  itemSubtotal: number;
}

export interface Order {
  order_id: string;
  customer_name: string;
  whatsapp: string;
  email?: string;
  pickup_date: string;
  pickup_time: string;
  address: string;
  notes: string;
  main_service: string;
  additional_service: 'reguler' | 'ekspres';
  item_details: OrderItem[];
  subtotal: number;
  additional_fee: number;
  grand_total: number;
  order_status: 'Menunggu Konfirmasi' | 'Diproses' | 'Dicuci' | 'Disetrika' | 'Siap Diantar' | 'Selesai' | 'Dibatalkan';
  coordinates?: [number, number];
  created_at: string;
  updated_at: string;
  routeType?: string;
  routeDistance?: number;
  routeDuration?: number;
  routeGeometry?: [number, number][];
}

