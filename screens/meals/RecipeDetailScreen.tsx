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
      <Text className="flex-1 text-[13px] font-semibold text-dark">{label}</Text>
      <Pressable
        onPress={onDecrement}
        disabled={value <= min}
        className={`h-8 w-8 items-center justify-center rounded-lg border border-border ${value <= min ? 'opacity-30' : ''}`}
      >
        <Minus size={14} color={colors.dark} />
      </Pressable>
      <Text className="mx-3 min-w-[24px] text-center text-[16px] font-bold text-orange">
        {value}
      </Text>
      <Pressable
        onPress={onIncrement}
        className="h-8 w-8 items-center justify-center rounded-lg border border-border"
      >
        <Plus size={14} color={colors.dark} />
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
    <View className="mx-5 mt-4 rounded-xl border border-border bg-white px-3.5 py-2.5">
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
          <View className="my-2 h-px bg-border" />
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
        <Text className="mt-2 text-center text-[12px] font-semibold text-warning-icon">
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
        !isLast ? 'border-b border-border' : ''
      }`}
    >
      <Text className="flex-1 text-[13px] text-dark">{ingredient.name}</Text>
      <Text className="mr-2 text-[12px] text-muted">{qtyLabel}</Text>
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
        {summaryText}
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
              <Text className="px-5 pt-4 text-[22px] font-extrabold tracking-[-0.3px] text-navy">
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
      <SafeAreaView edges={['top']} className="flex-1 bg-cream">
        <ScreenHeader />
        <ErrorState
          message="Failed to load recipe."
          onGoBack={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScreenHeader
        rightAction={
          <Pressable onPress={() => toggleSave(recipeId)} hitSlop={8}>
            <Heart
              size={22}
              color={saved ? colors.orange.DEFAULT : colors.muted}
              fill={saved ? colors.orange.DEFAULT : 'none'}
            />
          </Pressable>
        }
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
