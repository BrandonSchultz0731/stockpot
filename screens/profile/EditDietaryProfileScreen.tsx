import { useState } from 'react';
import { ScrollView } from 'react-native';
import AppText from '../../components/AppText';
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
import { fonts } from '../../theme/typography';
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
    <SafeAreaView edges={['top']} className="flex-1 bg-ivory">
      <ScreenHeader
        title="Dietary Profile"
        centerTitle
        onSave={handleSave}
        isSaving={mutation.isPending}
      />

      <ScrollView contentContainerClassName="px-5 pb-28">
        {/* Dietary Preferences */}
        <AppText
          className="text-lg text-espresso mb-2 mt-2"
          style={{ fontFamily: fonts.serif }}>
          Dietary Preferences
        </AppText>
        <AppText className="text-sm text-stone mb-4">
          Select any that apply to your diet.
        </AppText>
        <DietSelector
          selectedDiets={diets}
          onToggle={toggleDiet}
          className="mb-6"
        />

        {/* Excluded Ingredients */}
        <AppText
          className="text-lg text-espresso mb-2"
          style={{ fontFamily: fonts.serif }}>
          Ingredients to Avoid
        </AppText>
        <AppText className="text-sm text-stone mb-4">
          We'll make sure these never show up in your recipes.
        </AppText>
        <ExcludedIngredientsSelector
          selectedIngredients={excludedIngredients}
          onToggle={toggleIngredient}
          className="mb-6"
        />

        {/* Household Size */}
        <AppText
          className="text-lg text-espresso mb-4"
          style={{ fontFamily: fonts.serif }}>
          Household Size
        </AppText>
        <HouseholdSizeStepper
          value={householdSize}
          onChange={setHouseholdSize}
        />

        {/* Cooking Skill */}
        <AppText
          className="text-lg text-espresso mb-3"
          style={{ fontFamily: fonts.serif }}>
          Cooking Skill
        </AppText>
        <CookingSkillSelector
          selectedSkill={cookingSkill}
          onSelect={setCookingSkill}
        />

        {/* Error state */}
        {mutation.isError && (
          <AppText className="text-sm text-berry mt-3 text-center">
            Something went wrong. Please try again.
          </AppText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
