import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '../../components/ScreenHeader';
import HouseholdSizeStepper from '../../components/HouseholdSizeStepper';
import DietSelector from '../../components/DietSelector';
import ExcludedIngredientsSelector from '../../components/ExcludedIngredientsSelector';
import CookingSkillSelector from '../../components/CookingSkillSelector';
import { useUserProfileQuery } from '../../hooks/useUserProfileQuery';
import { useUpdateProfileMutation } from '../../hooks/useUpdateProfileMutation';
import { useToggleDiet, useToggleItem } from '../../hooks/useToggleList';
import { DietaryPreference, CookingSkill } from '../../shared/enums';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'EditDietaryProfile'>;

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

  const toggleDiet = useToggleDiet(diets, setDiets);
  const toggleIngredient = useToggleItem(excludedIngredients, setExcludedIngredients);

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
      <ScreenHeader
        title="Dietary Profile"
        centerTitle
        onSave={handleSave}
        isSaving={mutation.isPending}
      />

      <ScrollView contentContainerClassName="px-5 pb-10">
        {/* Dietary Preferences */}
        <Text className="text-lg font-bold text-dark mb-2 mt-2">
          Dietary Preferences
        </Text>
        <Text className="text-sm text-muted mb-4">
          Select any that apply to your diet.
        </Text>
        <DietSelector
          selectedDiets={diets}
          onToggle={toggleDiet}
          className="mb-6"
        />

        {/* Excluded Ingredients */}
        <Text className="text-lg font-bold text-dark mb-2">
          Ingredients to Avoid
        </Text>
        <Text className="text-sm text-muted mb-4">
          We'll make sure these never show up in your recipes.
        </Text>
        <ExcludedIngredientsSelector
          selectedIngredients={excludedIngredients}
          onToggle={toggleIngredient}
          className="mb-6"
        />

        {/* Household Size */}
        <Text className="text-lg font-bold text-dark mb-4">
          Household Size
        </Text>
        <HouseholdSizeStepper
          value={householdSize}
          onChange={setHouseholdSize}
        />

        {/* Cooking Skill */}
        <Text className="text-lg font-bold text-dark mb-3">
          Cooking Skill
        </Text>
        <CookingSkillSelector
          selectedSkill={cookingSkill}
          onSelect={setCookingSkill}
        />

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
