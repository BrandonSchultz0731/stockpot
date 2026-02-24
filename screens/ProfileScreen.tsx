import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfileQuery } from '../hooks/useUserProfileQuery';
import { useUsageQuery } from '../hooks/useUsageQuery';
import { SubscriptionTier } from '../shared/enums';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import colors from '../theme/colors';
import Button from '../components/Button';

const TIER_COLORS: Record<SubscriptionTier, { bg: string; text: string }> = {
  [SubscriptionTier.Free]: { bg: 'bg-border', text: 'text-body' },
  [SubscriptionTier.Plus]: { bg: 'bg-orange-pale', text: 'text-orange' },
  [SubscriptionTier.Pro]: { bg: 'bg-success-pale', text: 'text-success' },
};

interface StatRowProps {
  label: string;
  value: number;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-border">
      <Text className="text-sm text-body">{label}</Text>
      <Text className="text-sm text-dark" style={{ fontWeight: '600' }}>
        {value}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { clearTokens, refreshToken } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfileQuery();
  const { data: usage, isLoading: usageLoading } = useUsageQuery();

  const handleSignOut = async () => {
    try {
      await api.post(ROUTES.AUTH.LOGOUT, { refreshToken });
    } catch {
      // best-effort logout
    }
    await clearTokens();
  };

  if (profileLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator size="large" color={colors.navy.DEFAULT} />
      </SafeAreaView>
    );
  }

  const tier = profile?.subscriptionTier ?? SubscriptionTier.Free;
  const tierStyle = TIER_COLORS[tier];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView contentContainerClassName="px-5 pb-10">
        <Text className="text-[28px] font-bold text-navy mt-2 mb-6">
          Profile
        </Text>

        {/* User Info */}
        <View className="bg-white rounded-card p-5 mb-4">
          <Text className="text-lg text-dark" style={{ fontWeight: '600' }}>
            {profile?.firstName}
            {profile?.lastName ? ` ${profile.lastName}` : ''}
          </Text>
          <Text className="text-sm text-muted mt-1">{profile?.email}</Text>
          <View className="flex-row mt-3">
            <View className={`px-3 py-1 rounded-full ${tierStyle.bg}`}>
              <Text className={`text-xs ${tierStyle.text}`} style={{ fontWeight: '600' }}>
                {tier}
              </Text>
            </View>
          </View>
        </View>

        {/* Usage Stats */}
        <View className="bg-white rounded-card p-5 mb-4">
          <Text className="text-base text-dark mb-2" style={{ fontWeight: '600' }}>
            This Month's Usage
          </Text>
          {usageLoading ? (
            <ActivityIndicator size="small" color={colors.navy.DEFAULT} />
          ) : usage ? (
            <View>
              <StatRow label="Receipt Scans" value={usage.receiptScans} />
              <StatRow label="Meal Plans Generated" value={usage.mealPlansGenerated} />
              <StatRow label="Recipes Generated" value={usage.recipesGenerated} />
              <StatRow label="AI Chat Messages" value={usage.aiChatMessages} />
              <StatRow label="Substitution Requests" value={usage.substitutionRequests} />
            </View>
          ) : (
            <Text className="text-sm text-muted">No usage data available.</Text>
          )}
        </View>

        {/* Sign Out */}
        <Button label="Sign Out" variant="outline" onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}
