import React, { useEffect } from 'react';
import { Customer, Order } from '../types';
import { OrderService, StorageService } from '../utils/services';

export function useRealtime(
  customer: Customer | null,
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>
) {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (customer) {
      if (customer.role === 'admin') {
        console.log('[useRealtime] Subscribing as Admin to all real-time Firestore orders');
        unsubscribe = OrderService.listenToAllOrders((firestoreOrders) => {
          setOrders(firestoreOrders);
          StorageService.set('lavender_orders', firestoreOrders);
        });
      } else {
        console.log(`[useRealtime] Subscribing as Customer (${customer.name}) to real-time Firestore orders`);
        unsubscribe = OrderService.listenToCustomerOrders(
          customer.uid || '',
          customer.email,
          customer.phone,
          (firestoreOrders) => {
            setOrders(firestoreOrders);
            StorageService.set('lavender_orders', firestoreOrders);
          }
        );
      }
    } else {
      // Offline/Guest fallback: Keep utilizing localStorage cache
      const cached = StorageService.get<Order[]>('lavender_orders', []);
      if (cached.length > 0) {
        setOrders(cached);
      }
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [customer, setOrders]);
}
