import { useState, useEffect } from 'react';
import { AdminCategory, getCategories } from '../utils/database';
import { CategoryService } from '../utils/services';

export function useCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>(() => getCategories());

  useEffect(() => {
    console.log('[useCategories] Subscribing to Firestore real-time categories...');
    const unsubscribe = CategoryService.listenToCategories((firestoreCategories) => {
      setCategories(firestoreCategories);
      localStorage.setItem('lavender_categories', JSON.stringify(firestoreCategories));
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateCategories = async (updatedCategories: AdminCategory[]) => {
    const previousCategories = [...categories];
    setCategories(updatedCategories);
    localStorage.setItem('lavender_categories', JSON.stringify(updatedCategories));

    try {
      await CategoryService.saveCategoriesBatch(updatedCategories, previousCategories);
    } catch (err) {
      console.error('Failed to sync category changes to Firestore:', err);
    }
  };

  return { categories, setCategories, handleUpdateCategories };
}
