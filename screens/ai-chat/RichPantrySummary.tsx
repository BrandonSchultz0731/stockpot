import { View, Text } from 'react-native';
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
    <View className="my-2 rounded-2xl border border-border bg-white p-4">
      <View className="flex-row items-center">
        <Package size={18} color={colors.navy.DEFAULT} />
        <Text className="ml-2 text-[15px] font-bold text-navy">Pantry Overview</Text>
      </View>
      <View className="mt-3 flex-row">
        <View className="mr-6">
          <Text className="text-2xl font-bold text-navy">{data.totalItems ?? 0}</Text>
          <Text className="text-xs text-muted">Total Items</Text>
        </View>
        {(data.expiringCount ?? 0) > 0 && (
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.warning.DEFAULT }}>
              {data.expiringCount}
            </Text>
            <Text className="text-xs text-muted">Expiring Soon</Text>
          </View>
        )}
      </View>
      {data.topExpiring && data.topExpiring.length > 0 && (
        <View className="mt-3 rounded-xl bg-warning-pale p-3">
          <View className="flex-row items-center">
            <AlertTriangle size={14} color={colors.warning.icon} />
            <Text className="ml-1.5 text-xs font-semibold" style={{ color: colors.warning.dark }}>
              Expiring soon
            </Text>
          </View>
          {data.topExpiring.map((item, idx) => (
            <Text key={idx} className="mt-1 text-xs" style={{ color: colors.warning.text }}>
              {item}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
