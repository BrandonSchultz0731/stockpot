import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { X, Check, Crown, Sparkles } from 'lucide-react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  getActiveEntitlement,
} from '../services/purchases';
import { QUERY_KEYS } from '../services/queryKeys';
import AppText from '../components/AppText';
import Button from '../components/Button';
import colors from '../theme/colors';

const PLUS_FEATURES = [
  'More recipe generations per month',
  'More meal plans per month',
  'More receipt scans per month',
  'More AI chat messages',
];

const PRO_FEATURES = [
  'Maximum recipe generations',
  'Maximum meal plans',
  'Unlimited receipt scans',
  'Unlimited AI chat messages',
  'Priority support',
];

export default function PaywallScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    getOfferings()
      .then(setPackages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePurchase = useCallback(
    async (pkg: PurchasesPackage) => {
      setPurchasing(true);
      try {
        await purchasePackage(pkg);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE });
        navigation.goBack();
      } catch (e: unknown) {
        const err = e as { userCancelled?: boolean };
        if (!err.userCancelled) {
          Alert.alert('Purchase failed', 'Please try again later.');
        }
      } finally {
        setPurchasing(false);
      }
    },
    [navigation, queryClient],
  );

  const handleRestore = useCallback(async () => {
    setPurchasing(true);
    try {
      const info = await restorePurchases();
      const entitlement = getActiveEntitlement(info);
      if (entitlement) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE });
        navigation.goBack();
      } else {
        Alert.alert('No subscriptions found', 'We could not find any active subscriptions to restore.');
      }
    } catch {
      Alert.alert('Restore failed', 'Please try again later.');
    } finally {
      setPurchasing(false);
    }
  }, [navigation, queryClient]);

  const plusPkg = packages.find(
    (p) => p.identifier.includes('plus') || p.identifier === '$rc_monthly',
  );
  const proPkg = packages.find((p) => p.identifier.includes('pro'));

  return (
    <SafeAreaView className="flex-1 bg-ivory">
      {/* Close button */}
      <View className="flex-row justify-end px-5 pt-2">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={24} color={colors.stone} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-6 pb-12">
        {/* Header */}
        <View className="items-center mt-2 mb-6">
          <AppText font="serifHeavy" className="text-[26px] text-espresso tracking-[-0.3px]">
            Upgrade Your Plan
          </AppText>
          <AppText className="mt-2 text-[14px] text-stone text-center">
            Unlock more recipes, meal plans, and AI features.
          </AppText>
        </View>

        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color={colors.terra.DEFAULT} />
          </View>
        ) : (
          <>
            {/* Plus card */}
            {plusPkg && (
              <PlanCard
                title="Plus"
                icon={<Sparkles size={20} color={colors.terra.DEFAULT} />}
                price={plusPkg.product.priceString}
                period={plusPkg.product.subscriptionPeriod ?? 'month'}
                features={PLUS_FEATURES}
                onSubscribe={() => handlePurchase(plusPkg)}
                disabled={purchasing}
              />
            )}

            {/* Pro card */}
            {proPkg && (
              <PlanCard
                title="Pro"
                icon={<Crown size={20} color={colors.terra.DEFAULT} />}
                price={proPkg.product.priceString}
                period={proPkg.product.subscriptionPeriod ?? 'month'}
                features={PRO_FEATURES}
                onSubscribe={() => handlePurchase(proPkg)}
                disabled={purchasing}
                highlighted
              />
            )}

            {/* Restore purchases */}
            <Pressable
              onPress={handleRestore}
              disabled={purchasing}
              className="items-center mt-4"
              accessibilityRole="button"
              accessibilityLabel="Restore purchases"
            >
              <AppText className="text-[13px] text-stone underline">
                Restore Purchases
              </AppText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanCard({
  title,
  icon,
  price,
  period,
  features,
  onSubscribe,
  disabled,
  highlighted,
}: {
  title: string;
  icon: React.ReactNode;
  price: string;
  period: string;
  features: string[];
  onSubscribe: () => void;
  disabled: boolean;
  highlighted?: boolean;
}) {
  return (
    <View
      className={`mb-4 p-5 rounded-[20px] ${highlighted ? 'bg-espresso' : 'bg-white border border-line'}`}
    >
      <View className="flex-row items-center gap-2 mb-1">
        {icon}
        <AppText
          font="sansBold"
          className={`text-[17px] ${highlighted ? 'text-white' : 'text-espresso'}`}
        >
          {title}
        </AppText>
      </View>

      <View className="flex-row items-baseline gap-1 mb-4">
        <AppText
          font="serifHeavy"
          className={`text-[28px] ${highlighted ? 'text-white' : 'text-espresso'}`}
        >
          {price}
        </AppText>
        <AppText
          className={`text-[13px] ${highlighted ? 'text-white/50' : 'text-stone'}`}
        >
          / {period}
        </AppText>
      </View>

      {features.map((feature) => (
        <View key={feature} className="flex-row items-center gap-2.5 mb-2">
          <Check
            size={16}
            color={highlighted ? 'rgba(255,255,255,0.6)' : colors.sage.DEFAULT}
          />
          <AppText
            className={`text-[13px] flex-1 ${highlighted ? 'text-white/80' : 'text-ink'}`}
          >
            {feature}
          </AppText>
        </View>
      ))}

      <View className="mt-3">
        <Button
          label={`Subscribe to ${title}`}
          variant={highlighted ? 'primary' : 'outline'}
          onPress={onSubscribe}
          disabled={disabled}
        />
      </View>
    </View>
  );
}
