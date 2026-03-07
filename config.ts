import { Platform } from 'react-native';

const API_BASE_URL = __DEV__
  ? 'http://192.168.0.42:3001'
  : 'https://stockpot-server-production.up.railway.app';

// RevenueCat public API keys (safe to include in client bundle)
export const REVENUECAT_API_KEY = Platform.select({
  ios: 'appl_pdfBHhCiTgfehjHaqpAWyIWdTHW',
  android: 'YOUR_REVENUECAT_GOOGLE_API_KEY',
});

export default API_BASE_URL;
