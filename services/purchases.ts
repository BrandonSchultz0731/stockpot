import Purchases, {
  LOG_LEVEL,
  type PurchasesPackage,
  type CustomerInfo,
} from 'react-native-purchases';
import { REVENUECAT_API_KEY } from '../config';

export async function initPurchases(userId: string): Promise<void> {
  if (!REVENUECAT_API_KEY) {
    return;
  }
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  await Purchases.configure({
    apiKey: REVENUECAT_API_KEY,
    appUserID: userId,
  });
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return await Purchases.restorePurchases();
}

export function getActiveEntitlement(
  info: CustomerInfo,
): 'pro' | 'plus' | null {
  if (info.entitlements.active['pro']) {
    return 'pro';
  }
  if (info.entitlements.active['plus']) {
    return 'plus';
  }
  return null;
}
