import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  serverTimestamp,
  or,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Customer, Order } from '../types';

export function formatTimestamp(ts: any): string {
  if (!ts) return '';
  if (typeof ts === 'string') return ts;
  if (ts.toDate && typeof ts.toDate === 'function') {
    return ts.toDate().toISOString();
  }
  if (ts.seconds) {
    return new Date(ts.seconds * 1000).toISOString();
  }
  return String(ts);
}

// ==========================================
// 1. FIRESTORE ERROR HANDLING & TYPES
// ==========================================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('[Services Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// 2. STORAGE SERVICE (Local Caching helper)
// ==========================================

export const StorageService = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved) as T;
      }
    } catch (e) {
      console.warn(`[StorageService] Failed to parse key "${key}":`, e);
    }
    return defaultValue;
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[StorageService] Failed to set key "${key}":`, e);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[StorageService] Failed to remove key "${key}":`, e);
    }
  }
};

// ==========================================
// 3. CUSTOMER SERVICE
// ==========================================

export const CustomerService = {
  /**
   * Map Customer to Firestore format (No embedded orders array!)
   */
  mapToFirestore(customer: Customer, uid: string, provider?: string): any {
    const payload: any = {
      uid: uid,
      namaLengkap: customer.name || '',
      nomorWhatsapp: customer.phone || '',
      email: (customer.email || '').toLowerCase(),
      photoURL: customer.avatar || '',
      provider: provider || (customer.google_linked ? 'Google' : 'Email'),
      role: customer.role || 'customer',
      status: customer.status || 'Active',
      alamat: customer.address || '',
      latitude: customer.latitude || null,
      longitude: customer.longitude || null,
      lastLogin: serverTimestamp(),

      // Flat compatibility fields
      name: customer.name || '',
      phone: customer.phone || '',
      address: customer.address || '',
      avatar: customer.avatar || '',
      google_linked: customer.google_linked || false,
      points: customer.points || 0
    };

    if (customer.createdAt) {
      payload.createdAt = customer.createdAt;
    } else {
      payload.createdAt = serverTimestamp();
    }

    return payload;
  },

  /**
   * Map Firestore user data back to Customer
   */
  mapFromFirestore(docData: any): Customer {
    return {
      uid: docData.uid || '',
      name: docData.namaLengkap || docData.name || '',
      phone: docData.nomorWhatsapp || docData.phone || '',
      email: docData.email || '',
      address: docData.alamat || docData.address || '',
      points: docData.points || 0,
      role: docData.role || 'customer',
      latitude: docData.latitude !== null && docData.latitude !== undefined ? docData.latitude : undefined,
      longitude: docData.longitude !== null && docData.longitude !== undefined ? docData.longitude : undefined,
      location_updated_at: docData.createdAt ? formatTimestamp(docData.createdAt) : undefined,
      avatar: docData.photoURL || docData.avatar || '',
      google_linked: docData.provider?.includes('Google') || docData.google_linked || false,
      provider: docData.provider || (docData.google_linked ? 'Google' : 'Email'),
      status: docData.status || 'Active',
      createdAt: docData.createdAt ? formatTimestamp(docData.createdAt) : undefined,
      lastLogin: docData.lastLogin ? formatTimestamp(docData.lastLogin) : undefined,
      orders: [] // orders are loaded separately now!
    };
  },

  /**
   * Retrieve customer profile from Firestore
   */
  async getCustomer(uid: string): Promise<Customer | null> {
    console.log(`[CustomerService] Fetching customer profile for: ${uid}`);
    const userRef = doc(db, 'users', uid);
    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return this.mapFromFirestore(docSnap.data());
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  },

  /**
   * Save customer profile to Firestore (Removes orders field entirely to maintain relational model)
   */
  async saveCustomer(uid: string, customer: Customer, provider?: string): Promise<void> {
    console.log(`[CustomerService] Saving customer profile to Firestore for: ${uid}`);
    if (customer.is_local_sandbox) {
      console.warn('[CustomerService] Sandbox mode. Bypassing Firestore save.');
      return;
    }

    // Bypass saving if it's a mock/guest UID or if no user is authenticated to avoid permission errors.
    if (uid.startsWith('mock_uid_') || !auth.currentUser) {
      console.warn(`[CustomerService] Unauthenticated guest or temporary profile ${uid}. Bypassing Firestore save.`);
      return;
    }

    const userRef = doc(db, 'users', uid);
    const data = this.mapToFirestore(customer, uid, provider);

    try {
      await setDoc(userRef, data, { merge: true });
      console.log(`[CustomerService] Customer profile synced to Firestore: ${uid}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  },

  /**
   * Realtime Listener for all users (Admin view)
   */
  listenToCustomers(onUpdate: (users: Customer[]) => void): () => void {
    console.log('[CustomerService] Initializing realtime users snapshot listener');
    const usersCol = collection(db, 'users');
    
    return onSnapshot(usersCol, (snapshot) => {
      const list: Customer[] = [];
      snapshot.forEach((doc) => {
        const uid = doc.id;
        if (uid.startsWith('mock_uid_')) return; // skip dummy ids
        const data = doc.data();
        const email = (data.email || '').toLowerCase().trim();
        if (email === 'admin@laundry' || email === 'admin@laundry.com') return;

        const mapped = this.mapFromFirestore(data);
        mapped.uid = uid;
        list.push(mapped);
      });
      onUpdate(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
  }
};

// ==========================================
// 4. ORDER SERVICE
// ==========================================

export const OrderService = {
  /**
   * Map standard Order object to Firestore document fields
   */
  mapToFirestore(order: Order, customerId: string): any {
    return {
      // Requested core fields:
      customerId: customerId,
      customerName: order.customer_name || '',
      phone: order.whatsapp || '',
      pickupAddress: order.address || '',
      service: order.main_service || '',
      status: order.order_status || 'Menunggu Konfirmasi',
      createdAt: order.created_at ? (typeof order.created_at === 'string' ? order.created_at : serverTimestamp()) : serverTimestamp(),

      // Retained legacy compatibility fields to prevent information loss:
      order_id: order.order_id,
      customer_name: order.customer_name || '',
      whatsapp: order.whatsapp || '',
      email: order.email || '',
      pickup_date: order.pickup_date || '',
      pickup_time: order.pickup_time || '',
      address: order.address || '',
      notes: order.notes || '',
      main_service: order.main_service || '',
      additional_service: order.additional_service || 'reguler',
      item_details: order.item_details || [],
      subtotal: order.subtotal || 0,
      additional_fee: order.additional_fee || 0,
      grand_total: order.grand_total || 0,
      order_status: order.order_status || 'Menunggu Konfirmasi',
      coordinates: order.coordinates || null,
      updated_at: serverTimestamp(),
      routeType: order.routeType || '',
      routeDistance: order.routeDistance || 0,
      routeDuration: order.routeDuration || 0,
      routeGeometry: Array.isArray(order.routeGeometry) ? JSON.stringify(order.routeGeometry) : '[]'
    };
  },

  /**
   * Map Firestore document fields back to standard Order object
   */
  mapFromFirestore(docData: any): Order {
    return {
      order_id: docData.order_id || docData.id || '',
      customer_name: docData.customerName || docData.customer_name || '',
      whatsapp: docData.phone || docData.whatsapp || '',
      email: docData.email || '',
      pickup_date: docData.pickup_date || docData.pickupDate || '',
      pickup_time: docData.pickup_time || docData.pickupTime || '',
      address: docData.pickupAddress || docData.address || '',
      notes: docData.notes || '',
      main_service: docData.service || docData.main_service || '',
      additional_service: docData.additional_service || 'reguler',
      item_details: docData.item_details || [],
      subtotal: docData.subtotal || 0,
      additional_fee: docData.additional_fee || 0,
      grand_total: docData.grand_total || docData.totalPrice || 0,
      order_status: docData.status || docData.order_status || 'Menunggu Konfirmasi',
      coordinates: docData.coordinates || null,
      created_at: docData.createdAt ? formatTimestamp(docData.createdAt) : (docData.created_at ? formatTimestamp(docData.created_at) : ''),
      updated_at: docData.updatedAt ? formatTimestamp(docData.updatedAt) : (docData.updated_at ? formatTimestamp(docData.updated_at) : ''),
      routeType: docData.routeType || '',
      routeDistance: docData.routeDistance || 0,
      routeDuration: docData.routeDuration || 0,
      routeGeometry: (() => {
        if (typeof docData.routeGeometry === 'string') {
          try {
            return JSON.parse(docData.routeGeometry);
          } catch (e) {
            return [];
          }
        }
        return docData.routeGeometry || [];
      })()
    };
  },

  /**
   * Save order directly to Firestore /orders collection
   */
  async saveOrder(order: Order, customerId: string): Promise<void> {
    console.log(`[OrderService] Storing order ${order.order_id} directly under customer ${customerId}`);
    const orderRef = doc(db, 'orders', order.order_id);
    const data = this.mapToFirestore(order, customerId);

    try {
      await setDoc(orderRef, data, { merge: true });
      console.log(`[OrderService] Order ${order.order_id} saved successfully to Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${order.order_id}`);
    }
  },

  /**
   * Delete order from Firestore /orders collection
   */
  async deleteOrder(orderId: string): Promise<void> {
    console.log(`[OrderService] Deleting order: ${orderId}`);
    const orderRef = doc(db, 'orders', orderId);
    try {
      await deleteDoc(orderRef);
      console.log(`[OrderService] Order ${orderId} deleted successfully.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
    }
  },

  /**
   * Realtime Listener for ALL orders (Admin view)
   */
  listenToAllOrders(onUpdate: (orders: Order[]) => void): () => void {
    console.log('[OrderService] Setting up realtime listener for ALL orders');
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((doc) => {
        list.push(this.mapFromFirestore(doc.data()));
      });
      
      console.log(`[OrderService] Realtime global orders updated: ${list.length} records`);
      onUpdate(list);
    }, (error) => {
      const errMsg = error instanceof Error ? error.message : String(error);
      const isPermissionError = errMsg.toLowerCase().includes('permission') || (error as any).code === 'permission-denied';
      
      if (isPermissionError) {
        console.warn('[OrderService] Realtime global orders listener permission denied. Gracefully falling back to cached local storage.');
        onUpdate(StorageService.get<Order[]>('lavender_orders', []));
        return;
      }
      handleFirestoreError(error, OperationType.GET, 'orders');
    });
  },

  /**
   * Realtime Listener for specific customer's orders (Customer view)
   */
  listenToCustomerOrders(
    customerId: string, 
    email: string, 
    phone: string, 
    onUpdate: (orders: Order[]) => void
  ): () => void {
    console.log(`[OrderService] Listening to customer orders for customerId: ${customerId}, email: ${email}`);
    
    if (!customerId) {
      console.warn('[OrderService] No customer ID provided for listening to orders. Returning empty array.');
      onUpdate([]);
      return () => {};
    }

    const ordersCol = collection(db, 'orders');
    const q = query(
      ordersCol, 
      where('customerId', '==', customerId)
    );

    return onSnapshot(q, (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((doc) => {
        list.push(this.mapFromFirestore(doc.data()));
      });

      // Fallback for older orders: merge any cached local orders that match email/phone and are not in the list
      const cached = StorageService.get<Order[]>('lavender_orders', []);
      for (const cachedOrder of cached) {
        if (
          (cachedOrder.email?.toLowerCase().trim() === email.toLowerCase().trim() ||
           cachedOrder.whatsapp?.trim() === phone.trim()) &&
          !list.some(o => o.order_id === cachedOrder.order_id)
        ) {
          list.push(cachedOrder);
        }
      }

      list.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });

      console.log(`[OrderService] Realtime customer orders updated for ${customerId}: ${list.length} records`);
      onUpdate(list);
    }, (error) => {
      const errMsg = error instanceof Error ? error.message : String(error);
      const isPermissionError = errMsg.toLowerCase().includes('permission') || (error as any).code === 'permission-denied';

      if (isPermissionError) {
        console.warn(`[OrderService] Realtime customer orders listener permission denied for ${customerId}. Gracefully falling back to matching cached orders.`);
        const cached = StorageService.get<Order[]>('lavender_orders', []);
        const filtered = cached.filter(o => 
          o.email?.toLowerCase().trim() === email.toLowerCase().trim() || 
          o.whatsapp?.trim() === phone.trim()
        );
        onUpdate(filtered);
        return;
      }
      handleFirestoreError(error, OperationType.GET, `orders (query customerId=${customerId})`);
    });
  },

  /**
   * Safely migrate old embedded orders or localStorage orders into the standalone `orders` collection
   */
  async migrateLegacyOrders(customers: Customer[], localOrders: Order[]): Promise<void> {
    console.log('[OrderService] Starting legacy order migration check...');
    try {
      // 1. Migrate localStorage orders
      if (localOrders && localOrders.length > 0) {
        for (const order of localOrders) {
          // Identify corresponding customerId if any, otherwise map to 'guest_order' or similar
          let orderCustomerId = 'guest_order';
          const matchedCust = customers.find(c => 
            c.email.toLowerCase() === (order.email || '').toLowerCase() || 
            c.phone === order.whatsapp
          );
          if (matchedCust && matchedCust.uid) {
            orderCustomerId = matchedCust.uid;
          }

          // Save to Firestore under standalone orders collection if online
          const orderRef = doc(db, 'orders', order.order_id);
          const docSnap = await getDoc(orderRef);
          if (!docSnap.exists()) {
            console.log(`[Migration] Migrating local order ${order.order_id} to Firestore.`);
            await this.saveOrder(order, orderCustomerId);
          }
        }
      }

      // 2. Migrate embedded orders from Customer profile documents
      for (const cust of customers) {
        if (cust.uid && cust.orders && cust.orders.length > 0) {
          for (const embedded of cust.orders) {
            const orderId = embedded.id;
            const orderRef = doc(db, 'orders', orderId);
            const docSnap = await getDoc(orderRef);
            
            if (!docSnap.exists()) {
              console.log(`[Migration] Migrating embedded order ${orderId} of user ${cust.name} to Firestore.`);
              // Create a fully-fledged order object from embedded info
              const fullOrder: Order = {
                order_id: orderId,
                customer_name: cust.name,
                whatsapp: cust.phone,
                email: cust.email,
                pickup_date: embedded.date || new Date().toISOString().split('T')[0],
                pickup_time: '08:00 - 12:00',
                address: cust.address || embedded.address || '',
                notes: 'Migrated from customer profile',
                main_service: embedded.serviceType,
                additional_service: 'reguler',
                item_details: [],
                subtotal: embedded.totalPrice,
                additional_fee: 0,
                grand_total: embedded.totalPrice,
                order_status: embedded.status as any,
                coordinates: embedded.coordinates,
                created_at: embedded.date ? new Date(embedded.date).toISOString() : new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              await this.saveOrder(fullOrder, cust.uid);
            }
          }
        }
      }
      console.log('[OrderService] Legacy order migration completed.');
    } catch (e) {
      console.warn('[OrderService] Error running legacy orders migration:', e);
    }
  }
};

import { AdminService, AdminCategory, WebInfo } from './database';

const DEFAULT_SERVICES_MIGRATION: AdminService[] = [
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
    description: 'Disetrika, serta dikemas wangi and rapi',
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

const DEFAULT_CATEGORIES_MIGRATION: AdminCategory[] = [
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

const DEFAULT_WEB_INFO_MIGRATION: WebInfo = {
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

// ==========================================
// 5. MASTER SERVICES SERVICE
// ==========================================
export const ServiceService = {
  async saveService(service: AdminService): Promise<void> {
    const path = `services/${service.id}`;
    try {
      const docRef = doc(db, 'services', service.id);
      const payload: any = {
        id: service.id,
        name: service.name,
        category: service.category || 'Layanan Premium',
        description: service.description || '',
        icon: service.icon || 'Shirt',
        isActive: service.isActive !== undefined ? service.isActive : true,
        status: service.isActive ? 'active' : 'inactive',
        price: (service as any).price || 0,
        unit: (service as any).unit || 'kg',
        updatedAt: serverTimestamp()
      };

      if (service.createdAt) {
        payload.createdAt = service.createdAt;
      } else {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(docRef, payload, { merge: true });
      console.log(`[ServiceService] Service ${service.id} successfully saved to Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveServicesBatch(updatedServices: AdminService[], currentServices: AdminService[]): Promise<void> {
    const batch = writeBatch(db);
    let hasChanges = false;

    // 1. Additions and updates
    for (const service of updatedServices) {
      const match = currentServices.find(s => s.id === service.id);
      
      const isChanged = !match || 
        match.name !== service.name ||
        match.category !== service.category ||
        match.description !== service.description ||
        match.icon !== service.icon ||
        match.isActive !== service.isActive ||
        (match as any).price !== (service as any).price ||
        (match as any).unit !== (service as any).unit;

      if (isChanged) {
        const docRef = doc(db, 'services', service.id);
        const payload: any = {
          id: service.id,
          name: service.name,
          category: service.category || 'Layanan Premium',
          description: service.description || '',
          icon: service.icon || 'Shirt',
          isActive: service.isActive !== undefined ? service.isActive : true,
          status: service.isActive ? 'active' : 'inactive',
          price: (service as any).price || 0,
          unit: (service as any).unit || 'kg',
          updatedAt: serverTimestamp()
        };

        if (match && match.createdAt) {
          payload.createdAt = match.createdAt;
        } else if (service.createdAt) {
          payload.createdAt = service.createdAt;
        } else {
          payload.createdAt = serverTimestamp();
        }

        batch.set(docRef, payload, { merge: true });
        hasChanges = true;
      }
    }

    // 2. Deletions
    for (const service of currentServices) {
      const match = updatedServices.find(s => s.id === service.id);
      if (!match) {
        const docRef = doc(db, 'services', service.id);
        batch.delete(docRef);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await batch.commit();
      console.log('[ServiceService] Batch services update committed successfully.');
    }
  },

  async deleteService(serviceId: string): Promise<void> {
    const path = `services/${serviceId}`;
    try {
      await deleteDoc(doc(db, 'services', serviceId));
      console.log(`[ServiceService] Service ${serviceId} deleted from Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  listenToServices(onUpdate: (services: AdminService[]) => void): () => void {
    const path = 'services';
    console.log('[ServiceService] Starting realtime services listener...');
    const servicesCol = collection(db, 'services');

    return onSnapshot(servicesCol, async (snapshot) => {
      let list: AdminService[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: data.id || doc.id,
          name: data.name || '',
          category: data.category || '',
          description: data.description || '',
          icon: data.icon || 'Shirt',
          isActive: data.isActive !== undefined ? data.isActive : (data.status === 'active'),
          price: data.price,
          unit: data.unit,
          status: data.status,
          createdAt: data.createdAt ? formatTimestamp(data.createdAt) : undefined,
          updatedAt: data.updatedAt ? formatTimestamp(data.updatedAt) : undefined
        } as any);
      });

      if (snapshot.empty) {
        console.log('[ServiceService] services collection is empty. Seeding defaults / local storage migration...');
        let localData: AdminService[] = [];
        try {
          const raw = localStorage.getItem('lavender_services');
          if (raw) localData = JSON.parse(raw);
        } catch (e) {}

        const sourceList = localData.length > 0 ? localData : DEFAULT_SERVICES_MIGRATION;
        onUpdate(sourceList);

        // Seed everything in ONE atomic writeBatch
        const batch = writeBatch(db);
        for (const s of sourceList) {
          const docRef = doc(db, 'services', s.id);
          const payload = {
            id: s.id,
            name: s.name,
            category: s.category || 'Layanan Premium',
            description: s.description || '',
            icon: s.icon || 'Shirt',
            isActive: s.isActive !== undefined ? s.isActive : true,
            status: s.isActive ? 'active' : 'inactive',
            price: (s as any).price || 0,
            unit: (s as any).unit || 'kg',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          batch.set(docRef, payload, { merge: true });
        }

        try {
          await batch.commit();
          console.log('[ServiceService] Atomic batch seeding of services completed.');
        } catch (err) {
          console.warn('[ServiceService] Seeding services batch skipped (probably not an admin yet):', err);
        }
        return;
      }

      console.log(`[ServiceService] Realtime services updated: ${list.length} records`);
      onUpdate(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }
};

// ==========================================
// 6. LAUNDRY CATEGORIES SERVICE
// ==========================================
export const CategoryService = {
  async saveCategory(category: AdminCategory): Promise<void> {
    const path = `categories/${category.id}`;
    try {
      const docRef = doc(db, 'categories', category.id);
      const payload: any = {
        id: category.id,
        name: category.name,
        icon: category.icon || '',
        items: category.items || [],
        updatedAt: serverTimestamp()
      };

      if ((category as any).createdAt) {
        payload.createdAt = (category as any).createdAt;
      } else {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(docRef, payload, { merge: true });
      console.log(`[CategoryService] Category ${category.id} successfully saved to Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveCategoriesBatch(updatedCategories: AdminCategory[], currentCategories: AdminCategory[]): Promise<void> {
    const batch = writeBatch(db);
    let hasChanges = false;

    // 1. Additions and updates
    for (const cat of updatedCategories) {
      const match = currentCategories.find(c => c.id === cat.id);
      
      const isChanged = !match || JSON.stringify(match) !== JSON.stringify(cat);

      if (isChanged) {
        const docRef = doc(db, 'categories', cat.id);
        const payload: any = {
          id: cat.id,
          name: cat.name,
          icon: cat.icon || '',
          items: cat.items || [],
          updatedAt: serverTimestamp()
        };

        if (match && (match as any).createdAt) {
          payload.createdAt = (match as any).createdAt;
        } else if ((cat as any).createdAt) {
          payload.createdAt = (cat as any).createdAt;
        } else {
          payload.createdAt = serverTimestamp();
        }

        batch.set(docRef, payload, { merge: true });
        hasChanges = true;
      }
    }

    // 2. Deletions
    for (const cat of currentCategories) {
      const match = updatedCategories.find(c => c.id === cat.id);
      if (!match) {
        const docRef = doc(db, 'categories', cat.id);
        batch.delete(docRef);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await batch.commit();
      console.log('[CategoryService] Batch categories update committed successfully.');
    }
  },

  async deleteCategory(categoryId: string): Promise<void> {
    const path = `categories/${categoryId}`;
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      console.log(`[CategoryService] Category ${categoryId} deleted from Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  listenToCategories(onUpdate: (categories: AdminCategory[]) => void): () => void {
    const path = 'categories';
    console.log('[CategoryService] Starting realtime categories listener...');
    const categoriesCol = collection(db, 'categories');

    return onSnapshot(categoriesCol, async (snapshot) => {
      const list: AdminCategory[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: data.id || doc.id,
          name: data.name || '',
          icon: data.icon || '',
          items: data.items || [],
          createdAt: data.createdAt ? formatTimestamp(data.createdAt) : undefined,
          updatedAt: data.updatedAt ? formatTimestamp(data.updatedAt) : undefined
        } as any);
      });

      if (snapshot.empty) {
        console.log('[CategoryService] categories collection is empty. Seeding defaults...');
        let localData: AdminCategory[] = [];
        try {
          const raw = localStorage.getItem('lavender_categories');
          if (raw) localData = JSON.parse(raw);
        } catch (e) {}

        const sourceList = localData.length > 0 ? localData : DEFAULT_CATEGORIES_MIGRATION;
        onUpdate(sourceList);

        // Seed everything in ONE atomic writeBatch
        const batch = writeBatch(db);
        for (const c of sourceList) {
          const docRef = doc(db, 'categories', c.id);
          const payload = {
            id: c.id,
            name: c.name,
            icon: c.icon || '',
            items: c.items || [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          batch.set(docRef, payload, { merge: true });
        }

        try {
          await batch.commit();
          console.log('[CategoryService] Atomic batch seeding of categories completed.');
        } catch (err) {
          console.warn('[CategoryService] Seeding categories batch skipped (probably not an admin yet):', err);
        }
        return;
      }

      console.log(`[CategoryService] Realtime categories updated: ${list.length} records`);
      onUpdate(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }
};

// ==========================================
// 7. WEB INFO / SETTINGS SERVICE
// ==========================================
export const SettingsService = {
  async saveWebInfo(info: WebInfo): Promise<void> {
    const path = 'settings/web_info';
    try {
      const docRef = doc(db, 'settings', 'web_info');
      await setDoc(docRef, info);
      console.log('[SettingsService] App settings updated in Firestore.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  listenToWebInfo(onUpdate: (info: WebInfo) => void): () => void {
    const path = 'settings/web_info';
    console.log('[SettingsService] Starting web_info settings listener...');
    const docRef = doc(db, 'settings', 'web_info');

    return onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as WebInfo);
      } else {
        console.log('[SettingsService] Settings web_info document not found. Seeding defaults...');
        let localData: WebInfo | null = null;
        try {
          const raw = localStorage.getItem('lavender_web_info');
          if (raw) localData = JSON.parse(raw);
        } catch (e) {}

        const finalInfo = localData || DEFAULT_WEB_INFO_MIGRATION;
        onUpdate(finalInfo);

        // Run seeding and catch any permission errors gracefully
        try {
          await this.saveWebInfo(finalInfo);
        } catch (err) {
          console.warn('[SettingsService] Seeding settings skipped (probably not an admin yet):', err);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }
};
