import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ChefHat,
  Clock,
  CookingPot,
  Flame,
  Heart,
  Minus,
  Plus,
} from 'lucide-react-native';
import colors from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { cardShadow } from '../../theme/shadows';
import ScreenHeader from '../../components/ScreenHeader';
import PantryStatusIcon from '../../components/PantryStatusIcon';
import ErrorState from '../../components/ErrorState';
import LoadingScreen from '../../components/LoadingScreen';
import { useRecipeDetailQuery } from '../../hooks/useRecipeDetailQuery';
import { usePantryCheckQuery } from '../../hooks/usePantryCheckQuery';
import { useSavedRecipes } from '../../hooks/useSavedRecipes';
import { api } from '../../services/api';
import { ROUTES } from '../../services/routes';
import type { MealsStackParamList } from '../../navigation/types';
import { countByPantryStatus } from '../../shared/pantryStatusCounts';
import type { RecipeIngredient, RecipeStep } from '../../shared/enums';
import { formatQuantity } from '../../utils/formatQuantity';

type ScreenProps = NativeStackScreenProps<MealsStackParamList, 'RecipeDetail'>;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RecipeInfoPills({
  totalTimeMinutes,
  calories,
  difficulty,
}: {
  totalTimeMinutes: number;
  calories: number | undefined;
  difficulty: string;
}) {
  const pills: { icon: React.ReactNode; label: string; bg: string; fg: string }[] = [];

  if (totalTimeMinutes > 0) {
    pills.push({
      icon: <Clock size={13} color={colors.terra.DEFAULT} />,
      label: `${totalTimeMinutes} min`,
      bg: colors.terra.pale,
      fg: colors.terra.DEFAULT,
    });
  }
  if (calories != null) {
    pills.push({
      icon: <Flame size={13} color={colors.honey.DEFAULT} />,
      label: `${calories} cal`,
      bg: colors.honey.pale,
      fg: colors.honey.DEFAULT,
    });
  }
  if (difficulty) {
    pills.push({
      icon: <ChefHat size={13} color={colors.sage.DEFAULT} />,
      label: difficulty,
      bg: colors.sage.pale,
      fg: colors.sage.DEFAULT,
    });
  }

  if (pills.length === 0) return null;

  return (
    <View className="flex-row flex-wrap gap-2 px-5 mt-3">
      {pills.map((p) => (
        <View
          key={p.label}
          className="flex-row items-center rounded-full px-3 py-1.5"
          style={{ backgroundColor: p.bg }}
        >
          {p.icon}
          <Text
            className="ml-1.5 text-[12px] font-semibold"
            style={{ color: p.fg }}
          >
            {p.label}
          </Text>
        </View>
      ))}
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
      <Text
        className="text-[22px] tracking-[-0.3px] text-espresso"
        style={{ fontFamily: fonts.serif }}
      >
        {title}
      </Text>
      {description ? (
        <Text className="mt-1.5 text-[13px] text-stone">{description}</Text>
      ) : null}
    </View>
  );
}

function ServingDisplay({ servings }: { servings: number }) {
  return (
    <View
      className="mx-5 mt-4 flex-row items-center rounded-xl bg-white px-3.5 py-2.5"
      style={cardShadow}
    >
      <Text className="text-[13px] font-semibold text-espresso">Servings</Text>
      <View className="flex-1" />
      <Text className="text-[16px] font-bold text-terra">{servings}</Text>
    </View>
  );
}

function ServingStepper({
  label,
  value,
  min,
  onIncrement,
  onDecrement,
}: {
  label: string;
  value: number;
  min: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <View className="flex-row items-center">
      <Text className="flex-1 text-[13px] font-semibold text-espresso">{label}</Text>
      <Pressable
        onPress={onDecrement}
        disabled={value <= min}
        className={`h-8 w-8 items-center justify-center rounded-lg border border-line ${value <= min ? 'opacity-30' : ''}`}
      >
        <Minus size={14} color={colors.espresso} />
      </Pressable>
      <Text className="mx-3 min-w-[24px] text-center text-[16px] font-bold text-terra">
        {value}
      </Text>
      <Pressable
        onPress={onIncrement}
        className="h-8 w-8 items-center justify-center rounded-lg border border-line"
      >
        <Plus size={14} color={colors.espresso} />
      </Pressable>
    </View>
  );
}

function ServingsSection({
  servingsToCook,
  servingsToEat,
  onSetCook,
  onSetEat,
}: {
  servingsToCook: number;
  servingsToEat: number;
  onSetCook: (v: number) => void;
  onSetEat: (v: number) => void;
}) {
  const leftovers = servingsToCook - servingsToEat;

  return (
    <View
      className="mx-5 mt-4 rounded-xl bg-white px-3.5 py-2.5"
      style={cardShadow}
    >
      <ServingStepper
        label="Servings to cook"
        value={servingsToCook}
        min={1}
        onIncrement={() => onSetCook(servingsToCook + 1)}
        onDecrement={() => {
          const next = servingsToCook - 1;
          onSetCook(next);
          if (servingsToEat > next) onSetEat(next);
        }}
      />
      {servingsToCook > 1 && (
        <>
          <View className="my-2 h-px bg-line" />
          <ServingStepper
            label="Servings to eat"
            value={servingsToEat}
            min={1}
            onIncrement={() => {
              if (servingsToEat < servingsToCook) onSetEat(servingsToEat + 1);
            }}
            onDecrement={() => onSetEat(servingsToEat - 1)}
          />
        </>
      )}
      {leftovers > 0 && (
        <Text className="mt-2 text-center text-[12px] font-semibold" style={{ color: colors.honey.DEFAULT }}>
          {leftovers} {leftovers === 1 ? 'serving' : 'servings'} of leftovers
        </Text>
      )}
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
        !isLast ? 'border-b border-line' : ''
      }`}
    >
      <Text className="flex-1 text-[13px] text-ink">{ingredient.name}</Text>
      <Text className="mr-2 text-[12px] text-stone">{qtyLabel}</Text>
      <PantryStatusIcon status={ingredient.pantryStatus} />
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
  const { enough: enoughCount, low: lowCount, none: noneCount } = countByPantryStatus(ingredients);

  const parts: string[] = [];
  if (enoughCount > 0) parts.push(`${enoughCount} ready`);
  if (lowCount > 0) parts.push(`${lowCount} low`);
  if (noneCount > 0) parts.push(`${noneCount} missing`);
  const summaryText = parts.join(' \u00B7 ');

  return (
    <View className="px-5 pt-5">
      <Text
        className="mb-3 text-[16px] text-espresso"
        style={{ fontFamily: fonts.serif }}
      >
        Ingredients
      </Text>
      <View
        className="overflow-hidden rounded-[14px] bg-white"
        style={cardShadow}
      >
        {ingredients.map((ing, i) => (
          <IngredientRow
            key={`${ing.name}-${i}`}
            ingredient={ing}
            scale={scale}
            isLast={i === ingredients.length - 1}
          />
        ))}
      </View>
      <Text className="mt-2 text-center text-[12px] font-semibold text-terra">
        {summaryText}
      </Text>
    </View>
  );
}

function InstructionsSection({ steps }: { steps: RecipeStep[] }) {
  const sorted = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

  return (
    <View className="px-5 pt-5">
      <Text
        className="mb-3 text-[16px] text-espresso"
        style={{ fontFamily: fonts.serif }}
      >
        Instructions
      </Text>
      {sorted.map((step) => (
        <View key={step.stepNumber} className="mb-3 flex-row gap-3">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-terra">
            <Text className="text-[11px] font-bold text-white">
              {step.stepNumber}
            </Text>
          </View>
          <Text className="flex-1 text-[13px] leading-5 text-ink">
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
  const { recipeId, title: routeTitle, entryId, isCooked, isLeftover } = route.params;

  const { data: recipe, isLoading, isError } = useRecipeDetailQuery(recipeId);
  const { isSaved, toggleSave } = useSavedRecipes();

  const saved = isSaved(recipeId);

  // Serving state — only interactive when viewing from a meal plan entry
  const [servingsToCook, setServingsToCook] = useState(0);
  const [servingsToEat, setServingsToEat] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (recipe && !initialized.current) {
      initialized.current = true;
      setServingsToCook(recipe.servings);
      setServingsToEat(recipe.servings);
    }
  }, [recipe]);

  // Debounced PATCH to save serving changes
  const patchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const patchServings = useCallback(
    (cook: number, eat: number) => {
      if (!entryId) return;
      if (patchTimer.current) clearTimeout(patchTimer.current);
      patchTimer.current = setTimeout(() => {
        api.patch(ROUTES.MEAL_PLANS.UPDATE_ENTRY(entryId), {
          servingsToCook: cook,
          servings: eat,
        });
      }, 600);
    },
    [entryId],
  );

  const handleSetCook = useCallback(
    (v: number) => {
      setServingsToCook(v);
      setServingsToEat((prev) => {
        const eat = Math.min(prev, v);
        patchServings(v, eat);
        return eat;
      });
    },
    [patchServings],
  );

  const handleSetEat = useCallback(
    (v: number) => {
      setServingsToEat(v);
      patchServings(servingsToCook, v);
    },
    [patchServings, servingsToCook],
  );

  const scale = recipe ? servingsToCook / (recipe.servings || 1) : 1;
  const displayIngredients = usePantryCheckQuery(recipeId, recipe?.ingredients, scale);

  // Loading state
  if (isLoading || !recipe) {
    return (
      <LoadingScreen
        header={
          <>
            <ScreenHeader />
            {routeTitle ? (
              <Text
                className="px-5 pt-4 text-[22px] tracking-[-0.3px] text-espresso"
                style={{ fontFamily: fonts.serif }}
              >
                {routeTitle}
              </Text>
            ) : null}
          </>
        }
      />
    );
  }

  // Error state
  if (isError) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-ivory">
        <ScreenHeader />
        <ErrorState
          message="Failed to load recipe."
          onGoBack={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-ivory">
      <ScreenHeader
        rightAction={
          <Pressable onPress={() => toggleSave(recipeId)} hitSlop={8}>
            <Heart
              size={22}
              color={saved ? colors.terra.DEFAULT : colors.stone}
              fill={saved ? colors.terra.DEFAULT : 'none'}
            />
          </Pressable>
        }
      />
      <ScrollView className="flex-1" contentContainerClassName="pb-28">
        <TitleSection
          title={recipe.title}
          description={recipe.description}
        />
        <RecipeInfoPills
          totalTimeMinutes={recipe.totalTimeMinutes}
          calories={recipe.nutrition?.calories}
          difficulty={recipe.difficulty}
        />
        {entryId && !isCooked && !isLeftover ? (
          <ServingsSection
            servingsToCook={servingsToCook}
            servingsToEat={servingsToEat}
            onSetCook={handleSetCook}
            onSetEat={handleSetEat}
          />
        ) : (
          <ServingDisplay servings={isLeftover ? servingsToEat : recipe.servings} />
        )}
        <IngredientsSection
          ingredients={displayIngredients}
          scale={scale}
        />
        <InstructionsSection steps={recipe.steps} />
        {entryId && !isCooked && !isLeftover && (
          <Pressable
            onPress={() =>
              navigation.navigate('CookedReview', {
                entryId,
                servingsToCook,
                servingsToEat,
              })
            }
            className="mx-5 mt-6 flex-row items-center justify-center rounded-full bg-sage py-3.5"
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
