import { View, Text, Pressable } from 'react-native';
import { Clock, ChefHat } from 'lucide-react-native';
import colors from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { cardShadow } from '../../theme/shadows';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RichRecipeCardProps {
  data: {
    id?: string;
    title?: string;
    description?: string;
    totalTimeMinutes?: number;
    difficulty?: string;
    cuisine?: string;
    pantryMatch?: number;
  };
  onPress?: (recipeId: string) => void;
}

export default function RichRecipeCard({ data, onPress }: RichRecipeCardProps) {
  const { id, title, description, totalTimeMinutes, difficulty, cuisine, pantryMatch } = data;
  const isTappable = !!(id && UUID_REGEX.test(id) && onPress);

  return (
    <Pressable
      onPress={() => isTappable && onPress!(id!)}
      disabled={!isTappable}
      className="my-2 rounded-card bg-cream p-4"
      style={({ pressed }) => ({
        ...cardShadow,
        opacity: pressed && isTappable ? 0.7 : 1,
      })}
    >
      <View className="flex-row items-start justify-between">
        <Text
          className="flex-1 text-[15px] text-espresso"
          style={{ fontFamily: fonts.serif }}
        >
          {title}
        </Text>
        {pantryMatch != null && (
          <View className="ml-2 rounded-full bg-sage-pale px-2 py-0.5">
            <Text className="text-[11px] font-semibold text-sage">{pantryMatch}% match</Text>
          </View>
        )}
      </View>
      {description ? (
        <Text className="mt-1 text-[13px] text-ink" numberOfLines={2}>
          {description}
        </Text>
      ) : null}
      <View className="mt-2 flex-row items-center">
        {totalTimeMinutes ? (
          <View className="mr-3 flex-row items-center">
            <Clock size={13} color={colors.stone} />
            <Text className="ml-1 text-xs text-stone">{totalTimeMinutes} min</Text>
          </View>
        ) : null}
        {difficulty ? (
          <View className="mr-3 flex-row items-center">
            <ChefHat size={13} color={colors.stone} />
            <Text className="ml-1 text-xs text-stone">{difficulty}</Text>
          </View>
        ) : null}
        {cuisine ? (
          <Text className="text-xs text-stone">{cuisine}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
