import { useState, useEffect } from 'react';
import { WebInfo, getWebInfo } from '../utils/database';
import { SettingsService } from '../utils/services';

export function useSettings() {
  const [webInfo, setWebInfo] = useState<WebInfo>(() => getWebInfo());

  useEffect(() => {
    console.log('[useSettings] Subscribing to Firestore real-time settings (web_info)...');
    const unsubscribe = SettingsService.listenToWebInfo((firestoreWebInfo) => {
      setWebInfo(firestoreWebInfo);
      localStorage.setItem('lavender_web_info', JSON.stringify(firestoreWebInfo));
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateWebInfo = async (updatedWebInfo: WebInfo) => {
    setWebInfo(updatedWebInfo);
    localStorage.setItem('lavender_web_info', JSON.stringify(updatedWebInfo));
    try {
      await SettingsService.saveWebInfo(updatedWebInfo);
    } catch (err) {
      console.error('Failed to sync settings changes to Firestore:', err);
    }
  };

  return { webInfo, setWebInfo, handleUpdateWebInfo };
}
