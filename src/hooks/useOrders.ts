import { useState, useEffect } from 'react';
import { Order, Customer } from '../types';
import { StorageService, OrderService } from '../utils/services';
import { getRegisteredUsers } from '../utils/database';

export function useOrders(customer: Customer | null) {
  const [orders, setOrders] = useState<Order[]>(() => {
    return StorageService.get<Order[]>('lavender_orders', []);
  });

  // Keep local storage cache in sync
  useEffect(() => {
    StorageService.set('lavender_orders', orders);
  }, [orders]);

  // Background migration runner to transition legacy data to new collection safely
  useEffect(() => {
    const runMigration = async () => {
      try {
        const users = getRegisteredUsers();
        const localOrders = StorageService.get<Order[]>('lavender_orders', []);
        await OrderService.migrateLegacyOrders(users, localOrders);
      } catch (err) {
        console.warn('[useOrders] Legacy orders migration check failed or postponed:', err);
      }
    };

    const timer = setTimeout(() => {
      runMigration();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return { orders, setOrders };
}
