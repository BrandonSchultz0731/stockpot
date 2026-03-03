import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import PillButton from '../../components/onboarding/PillButton';
import SelectableCard from '../../components/onboarding/SelectableCard';
import { useUserProfileQuery } from '../../hooks/useUserProfileQuery';
import { useUpdateProfileMutation } from '../../hooks/useUpdateProfileMutation';
import {
  DietaryPreference,
  CookingSkill,
  COOKING_SKILL_DESCRIPTIONS,
  EXCLUDED_INGREDIENT_SUGGESTIONS,
} from '../../shared/enums';
import colors from '../../theme/colors';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'EditDietaryProfile'>;

const ALL_DIETS = Object.values(DietaryPreference);

export default function EditDietaryProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { data: profile } = useUserProfileQuery();
  const mutation = useUpdateProfileMutation();

  const dp = profile?.dietaryProfile;

  const [diets, setDiets] = useState<DietaryPreference[]>(dp?.diets ?? []);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>(
    dp?.excludedIngredients ?? [],
  );
  const [householdSize, setHouseholdSize] = useState(dp?.householdSize ?? 2);
  const [cookingSkill, setCookingSkill] = useState<CookingSkill>(
    dp?.cookingSkill ?? CookingSkill.Intermediate,
  );

  const toggleDiet = (diet: DietaryPreference) => {
    if (diet === DietaryPreference.None) {
      setDiets([DietaryPreference.None]);
      return;
    }
    const withoutNone = diets.filter(d => d !== DietaryPreference.None);
    if (withoutNone.includes(diet)) {
      setDiets(withoutNone.filter(d => d !== diet));
    } else {
      setDiets([...withoutNone, diet]);
    }
  };

  const toggleIngredient = (ingredient: string) => {
    if (excludedIngredients.includes(ingredient)) {
      setExcludedIngredients(excludedIngredients.filter(i => i !== ingredient));
    } else {
      setExcludedIngredients([...excludedIngredients, ingredient]);
    }
  };

  const handleSave = () => {
    mutation.mutate(
      {
        dietaryProfile: {
          diets,
          excludedIngredients,
          householdSize,
          cookingSkill,
        },
      },
      { onSuccess: () => navigation.goBack() },
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <ArrowLeft size={24} color={colors.navy.DEFAULT} />
        </Pressable>
        <Text className="text-lg font-bold text-navy">Dietary Profile</Text>
        <Pressable onPress={handleSave} disabled={mutation.isPending} hitSlop={12}>
          {mutation.isPending ? (
            <ActivityIndicator size="small" color={colors.orange.DEFAULT} />
          ) : (
            <Text className="text-[15px] font-semibold text-orange">Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-10">
        {/* Dietary Preferences */}
        <Text className="text-lg font-bold text-dark mb-2 mt-2">
          Dietary Preferences
        </Text>
        <Text className="text-sm text-muted mb-4">
          Select any that apply to your diet.
        </Text>
        <View className="flex-row flex-wrap mb-6">
          {ALL_DIETS.map(diet => (
            <PillButton
              key={diet}
              label={diet}
              selected={diets.includes(diet)}
              onPress={() => toggleDiet(diet)}
              variant="diet"
            />
          ))}
        </View>

        {/* Excluded Ingredients */}
        <Text className="text-lg font-bold text-dark mb-2">
          Ingredients to Avoid
        </Text>
        <Text className="text-sm text-muted mb-4">
          We'll make sure these never show up in your recipes.
        </Text>
        <View className="flex-row flex-wrap mb-6">
          {EXCLUDED_INGREDIENT_SUGGESTIONS.map(ingredient => (
            <PillButton
              key={ingredient}
              label={ingredient}
              selected={excludedIngredients.includes(ingredient)}
              onPress={() => toggleIngredient(ingredient)}
              variant="exclude"
            />
          ))}
        </View>

        {/* Household Size */}
        <Text className="text-lg font-bold text-dark mb-4">
          Household Size
        </Text>
        <View className="items-center mb-8">
          <View className="flex-row items-center">
            <Pressable
              className={`w-12 h-12 rounded-full border border-border items-center justify-center bg-white ${householdSize <= 1 ? 'opacity-30' : ''}`}
              disabled={householdSize <= 1}
              onPress={() => setHouseholdSize(s => s - 1)}>
              <Text className="text-2xl font-semibold -mt-0.5 text-dark">−</Text>
            </Pressable>
            <View className="mx-8 items-center">
              <Text className="text-5xl font-bold text-dark">{householdSize}</Text>
              <Text className="text-sm text-muted mt-1">
                {householdSize === 1 ? 'person' : 'people'}
              </Text>
            </View>
            <Pressable
              className={`w-12 h-12 rounded-full border border-border items-center justify-center bg-white ${householdSize >= 10 ? 'opacity-30' : ''}`}
              disabled={householdSize >= 10}
              onPress={() => setHouseholdSize(s => s + 1)}>
              <Text className="text-2xl font-semibold -mt-0.5 text-dark">+</Text>
            </Pressable>
          </View>
        </View>

        {/* Cooking Skill */}
        <Text className="text-lg font-bold text-dark mb-3">
          Cooking Skill
        </Text>
        {Object.values(CookingSkill).map(skill => (
          <SelectableCard
            key={skill}
            title={skill}
            description={COOKING_SKILL_DESCRIPTIONS[skill]}
            selected={cookingSkill === skill}
            onPress={() => setCookingSkill(skill)}
          />
        ))}

        {/* Error state */}
        {mutation.isError && (
          <Text className="text-sm text-danger mt-3 text-center">
            Something went wrong. Please try again.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
