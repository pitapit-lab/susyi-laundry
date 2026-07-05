import { useState, useEffect } from 'react';
import { AdminService, getServices } from '../utils/database';
import { ServiceService } from '../utils/services';

export function useServices() {
  const [services, setServices] = useState<AdminService[]>(() => getServices());

  useEffect(() => {
    console.log('[useServices] Subscribing to Firestore real-time services...');
    const unsubscribe = ServiceService.listenToServices((firestoreServices) => {
      setServices(firestoreServices);
      localStorage.setItem('lavender_services', JSON.stringify(firestoreServices));
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateServices = async (updatedServices: AdminService[]) => {
    const previousServices = [...services];
    setServices(updatedServices);
    localStorage.setItem('lavender_services', JSON.stringify(updatedServices));

    try {
      await ServiceService.saveServicesBatch(updatedServices, previousServices);
    } catch (err) {
      console.error('Failed to sync service changes to Firestore:', err);
    }
  };

  return { services, setServices, handleUpdateServices };
}
