import { View, Text } from 'react-native';
import { Circle, CircleAlert, CircleCheck } from 'lucide-react-native';
import { PantryStatus } from '../../shared/enums';
import colors from '../../theme/colors';

interface IngredientItem {
  name: string;
  quantity?: number;
  unit?: string;
  pantryStatus?: PantryStatus;
}

interface RichIngredientListProps {
  data: {
    items?: IngredientItem[];
  };
}

const STATUS_CONFIG: Record<PantryStatus, { icon: typeof CircleCheck; color: string; bg: string }> = {
  [PantryStatus.Enough]: { icon: CircleCheck, color: colors.success.DEFAULT, bg: 'bg-success-pale' },
  [PantryStatus.Low]: { icon: CircleAlert, color: colors.warning.DEFAULT, bg: 'bg-warning-pale' },
  [PantryStatus.None]: { icon: Circle, color: colors.danger.DEFAULT, bg: 'bg-danger-pale' },
};

export default function RichIngredientList({ data }: RichIngredientListProps) {
  const items = data.items ?? [];
  if (items.length === 0) return null;

  return (
    <View className="my-2 rounded-2xl border border-border bg-white p-3">
      {items.map((item, idx) => {
        const status = item.pantryStatus ?? PantryStatus.None;
        const config = STATUS_CONFIG[status];
        const Icon = config.icon;

        return (
          <View
            key={idx}
            className="flex-row items-center border-b border-border py-2 last:border-b-0"
          >
            <View className={`mr-2 rounded-full p-0.5 ${config.bg}`}>
              <Icon size={14} color={config.color} />
            </View>
            <Text className="flex-1 text-[13px] text-navy">{item.name}</Text>
            {item.quantity != null && (
              <Text className="text-xs text-muted">
                {item.quantity} {item.unit}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
