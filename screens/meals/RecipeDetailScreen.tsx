import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Check,
  ChefHat,
  ChevronLeft,
  Clock,
  CookingPot,
  Flame,
  Heart,
  X,
} from 'lucide-react-native';
import colors from '../../theme/colors';
import { useRecipeDetailQuery } from '../../hooks/useRecipeDetailQuery';
import { useSavedRecipes } from '../../hooks/useSavedRecipes';
import type { MealsStackParamList } from '../../navigation/types';
import type { RecipeIngredient, RecipeStep } from '../../shared/enums';

type ScreenProps = NativeStackScreenProps<MealsStackParamList, 'RecipeDetail'>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatQuantity(quantity: number): string {
  if (quantity === 0) return '';
  if (Number.isInteger(quantity)) return String(quantity);
  // Common fractions
  const fractions: Record<string, string> = {
    '0.25': '\u00BC',
    '0.33': '\u2153',
    '0.5': '\u00BD',
    '0.67': '\u2154',
    '0.75': '\u00BE',
  };
  const whole = Math.floor(quantity);
  const frac = quantity - whole;
  const fracKey = frac.toFixed(2);
  const fracStr = fractions[fracKey];
  if (fracStr) {
    return whole > 0 ? `${whole}${fracStr}` : fracStr;
  }
  return quantity % 1 === 0 ? String(quantity) : quantity.toFixed(1);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Header({
  isSaved,
  onToggleSave,
  showHeart,
}: {
  isSaved: boolean;
  onToggleSave: () => void;
  showHeart: boolean;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<MealsStackParamList>>();

  return (
    <View className="flex-row items-center justify-between px-5 py-3">
      <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
        <ChevronLeft size={22} color={colors.navy.DEFAULT} />
      </Pressable>
      {showHeart && (
        <Pressable onPress={onToggleSave} hitSlop={8}>
          <Heart
            size={22}
            color={isSaved ? colors.orange.DEFAULT : colors.muted}
            fill={isSaved ? colors.orange.DEFAULT : 'none'}
          />
        </Pressable>
      )}
    </View>
  );
}

function HeroBanner({
  totalTimeMinutes,
  calories,
  difficulty,
}: {
  totalTimeMinutes: number;
  calories: number | undefined;
  difficulty: string;
}) {
  const badges: { icon: React.ReactNode; label: string }[] = [];

  if (totalTimeMinutes > 0) {
    badges.push({
      icon: <Clock size={12} color="#fff" />,
      label: `${totalTimeMinutes} min`,
    });
  }
  if (calories != null) {
    badges.push({
      icon: <Flame size={12} color="#fff" />,
      label: `${calories} cal`,
    });
  }
  if (difficulty) {
    badges.push({
      icon: <ChefHat size={12} color="#fff" />,
      label: difficulty,
    });
  }

  return (
    <View
      className="mx-4 h-40 items-center justify-end overflow-hidden rounded-[20px]"
      style={{ backgroundColor: colors.navy.DEFAULT }}
    >
      <View className="flex-row gap-2 px-4 pb-3">
        {badges.map((b) => (
          <View
            key={b.label}
            className="flex-row items-center rounded-lg bg-white/15 px-2.5 py-1"
          >
            {b.icon}
            <Text className="ml-1 text-[11px] font-semibold text-white">
              {b.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TitleSection({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <View className="px-5 pt-4">
      <Text className="text-[22px] font-extrabold tracking-[-0.3px] text-navy">
        {title}
      </Text>
      {description ? (
        <Text className="mt-1.5 text-[13px] text-muted">{description}</Text>
      ) : null}
    </View>
  );
}

function ServingDisplay({ servings }: { servings: number }) {
  return (
    <View className="mx-5 mt-4 flex-row items-center rounded-xl border border-border bg-white px-3.5 py-2.5">
      <Text className="text-[13px] font-semibold text-dark">Servings</Text>
      <View className="flex-1" />
      <Text className="text-[16px] font-bold text-orange">{servings}</Text>
    </View>
  );
}

function IngredientRow({
  ingredient,
  scale,
  isLast,
}: {
  ingredient: RecipeIngredient;
  scale: number;
  isLast: boolean;
}) {
  const scaledQty = ingredient.quantity * scale;
  const qtyLabel = `${formatQuantity(scaledQty)} ${ingredient.unit}`.trim();

  return (
    <View
      className={`flex-row items-center px-3.5 py-2.5 ${
        !isLast ? 'border-b border-border' : ''
      }`}
    >
      <Text className="flex-1 text-[13px] text-dark">{ingredient.name}</Text>
      <Text className="mr-2 text-[12px] text-muted">{qtyLabel}</Text>
      {ingredient.inPantry ? (
        <View className="h-5 w-5 items-center justify-center rounded-full bg-success-pale">
          <Check size={12} color={colors.success.DEFAULT} />
        </View>
      ) : (
        <View className="h-5 w-5 items-center justify-center rounded-full bg-danger-pale">
          <X size={12} color={colors.danger.DEFAULT} />
        </View>
      )}
    </View>
  );
}

function IngredientsSection({
  ingredients,
  scale,
}: {
  ingredients: RecipeIngredient[];
  scale: number;
}) {
  const pantryCount = ingredients.filter((i) => i.inPantry).length;

  return (
    <View className="px-5 pt-5">
      <Text className="mb-3 text-[16px] font-bold text-navy">Ingredients</Text>
      <View className="overflow-hidden rounded-[14px] border border-border bg-white">
        {ingredients.map((ing, i) => (
          <IngredientRow
            key={`${ing.name}-${i}`}
            ingredient={ing}
            scale={scale}
            isLast={i === ingredients.length - 1}
          />
        ))}
      </View>
      <Text className="mt-2 text-center text-[12px] font-semibold text-orange">
        {pantryCount}/{ingredients.length} ingredients in pantry
      </Text>
    </View>
  );
}

function InstructionsSection({ steps }: { steps: RecipeStep[] }) {
  const sorted = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

  return (
    <View className="px-5 pt-5">
      <Text className="mb-3 text-[16px] font-bold text-navy">
        Instructions
      </Text>
      {sorted.map((step) => (
        <View key={step.stepNumber} className="mb-3 flex-row gap-3">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-orange-pale">
            <Text className="text-[11px] font-bold text-orange">
              {step.stepNumber}
            </Text>
          </View>
          <Text className="flex-1 text-[13px] leading-5 text-body">
            {step.instruction}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function RecipeDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MealsStackParamList>>();
  const route = useRoute<ScreenProps['route']>();
  const { recipeId, title: routeTitle, entryId, isCooked } = route.params;

  const { data: recipe, isLoading, isError } = useRecipeDetailQuery(recipeId);
  const { isSaved, toggleSave } = useSavedRecipes();

  const saved = isSaved(recipeId);
  const scale = 1;

  // Loading state
  if (isLoading || !recipe) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-cream">
        <Header isSaved={false} onToggleSave={() => {}} showHeart={false} />
        {routeTitle ? (
          <Text className="px-5 pt-4 text-[22px] font-extrabold tracking-[-0.3px] text-navy">
            {routeTitle}
          </Text>
        ) : null}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.orange.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-cream">
        <Header isSaved={false} onToggleSave={() => {}} showHeart={false} />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-[14px] text-muted">
            Failed to load recipe.
          </Text>
          <Pressable onPress={() => navigation.goBack()} className="mt-3">
            <Text className="text-[14px] font-semibold text-orange">
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <Header
        isSaved={saved}
        onToggleSave={() => toggleSave(recipeId)}
        showHeart
      />
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <HeroBanner
          totalTimeMinutes={recipe.totalTimeMinutes}
          calories={recipe.nutrition?.calories}
          difficulty={recipe.difficulty}
        />
        <TitleSection
          title={recipe.title}
          description={recipe.description}
        />
        <ServingDisplay servings={recipe.servings} />
        <IngredientsSection
          ingredients={recipe.ingredients}
          scale={scale}
        />
        <InstructionsSection steps={recipe.steps} />
        {entryId && !isCooked && (
          <Pressable
            onPress={() => navigation.navigate('CookedReview', { entryId })}
            className="mx-5 mt-6 flex-row items-center justify-center rounded-[14px] bg-success py-3.5"
          >
            <CookingPot size={18} color="#fff" />
            <Text className="ml-2 text-[15px] font-bold text-white">
              Mark as Cooked
            </Text>
          </Pressable>
        )}
        <View className="h-5" />
      </ScrollView>
    </SafeAreaView>
  );
}
