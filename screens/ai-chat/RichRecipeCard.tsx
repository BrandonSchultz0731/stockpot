import { View, Text, Pressable } from 'react-native';
import { Clock, ChefHat } from 'lucide-react-native';
import colors from '../../theme/colors';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RichRecipeCardProps {
  data: {
    id?: string;
    title?: string;
    description?: string;
    totalTimeMinutes?: number;
    difficulty?: string;
    cuisine?: string;
  };
  onPress?: (recipeId: string) => void;
}

export default function RichRecipeCard({ data, onPress }: RichRecipeCardProps) {
  const { id, title, description, totalTimeMinutes, difficulty, cuisine } = data;
  const isTappable = !!(id && UUID_REGEX.test(id) && onPress);

  return (
    <Pressable
      onPress={() => isTappable && onPress!(id!)}
      disabled={!isTappable}
      className="my-2 rounded-2xl border border-border bg-white p-4"
      style={({ pressed }) => ({ opacity: pressed && isTappable ? 0.7 : 1 })}
    >
      <Text className="text-[15px] font-bold text-navy">{title}</Text>
      {description ? (
        <Text className="mt-1 text-[13px] text-body" numberOfLines={2}>
          {description}
        </Text>
      ) : null}
      <View className="mt-2 flex-row items-center">
        {totalTimeMinutes ? (
          <View className="mr-3 flex-row items-center">
            <Clock size={13} color={colors.muted} />
            <Text className="ml-1 text-xs text-muted">{totalTimeMinutes} min</Text>
          </View>
        ) : null}
        {difficulty ? (
          <View className="mr-3 flex-row items-center">
            <ChefHat size={13} color={colors.muted} />
            <Text className="ml-1 text-xs text-muted">{difficulty}</Text>
          </View>
        ) : null}
        {cuisine ? (
          <Text className="text-xs text-muted">{cuisine}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
