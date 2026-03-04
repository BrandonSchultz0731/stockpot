import { View } from 'react-native';
import AppText from '../../components/AppText';
import { Package, AlertTriangle } from 'lucide-react-native';
import colors from '../../theme/colors';

interface RichPantrySummaryProps {
  data: {
    totalItems?: number;
    expiringCount?: number;
    topExpiring?: string[];
  };
}

export default function RichPantrySummary({ data }: RichPantrySummaryProps) {
  return (
    <View className="my-2 rounded-2xl border border-line bg-cream p-4">
      <View className="flex-row items-center">
        <Package size={18} color={colors.espresso} />
        <AppText className="ml-2 text-[15px] font-bold text-espresso">Pantry Overview</AppText>
      </View>
      <View className="mt-3 flex-row">
        <View className="mr-6">
          <AppText className="text-2xl font-bold text-espresso">{data.totalItems ?? 0}</AppText>
          <AppText className="text-xs text-stone">Total Items</AppText>
        </View>
        {(data.expiringCount ?? 0) > 0 && (
          <View>
            <AppText className="text-2xl font-bold" style={{ color: colors.honey.DEFAULT }}>
              {data.expiringCount}
            </AppText>
            <AppText className="text-xs text-stone">Expiring Soon</AppText>
          </View>
        )}
      </View>
      {data.topExpiring && data.topExpiring.length > 0 && (
        <View className="mt-3 rounded-xl bg-honey-pale p-3">
          <View className="flex-row items-center">
            <AlertTriangle size={14} color={colors.honey.DEFAULT} />
            <AppText className="ml-1.5 text-xs font-semibold" style={{ color: colors.honey.DEFAULT }}>
              Expiring soon
            </AppText>
          </View>
          {data.topExpiring.map((item, idx) => (
            <AppText key={idx} className="mt-1 text-xs" style={{ color: colors.honey.DEFAULT }}>
              {item}
            </AppText>
          ))}
        </View>
      )}
    </View>
  );
}
