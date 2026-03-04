import AppText from '../../components/AppText';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import InfoBanner from '../../components/InfoBanner';
import GoalTypeSelector from '../../components/GoalTypeSelector';
import MacroProgressBar from '../../components/MacroProgressBar';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useCompleteOnboardingMutation } from '../../hooks/useCompleteOnboardingMutation';
import { GoalType, MACRO_PRESETS } from '../../shared/enums';
import { fonts } from '../../theme/typography';
import type { OnboardingParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingParamList, 'OBGoals'>;

const MACRO_MAX = { calories: 3000, protein: 250, carbs: 400, fat: 100 };

export default function OBGoalsScreen() {
  const navigation = useNavigation<Nav>();
  const { data, updateData } = useOnboarding();
  const mutation = useCompleteOnboardingMutation();

  const selectGoal = (goal: GoalType) => {
    const preset = MACRO_PRESETS[goal];
    updateData({
      goalType: goal,
      dailyCalories: preset.calories,
      dailyProteinGrams: preset.protein,
      dailyCarbsGrams: preset.carbs,
      dailyFatGrams: preset.fat,
    });
  };

  const handleFinish = () => {
    mutation.mutate(data);
  };

  return (
    <OnboardingLayout
      step={5}
      onBack={() => navigation.goBack()}
      onNext={handleFinish}
      nextLabel="Finish Setup"
      isSubmitting={mutation.isPending}>
      <AppText
        className="text-2xl text-espresso mb-2 mt-2"
        style={{ fontFamily: fonts.serif }}>
        Nutrition Goals
      </AppText>
      <AppText className="text-base leading-[22px] text-stone mb-6">
        Choose a goal and we'll set smart defaults for your daily targets.
      </AppText>

      <GoalTypeSelector
        selectedGoal={data.goalType}
        onSelect={selectGoal}
      />

      {/* Daily targets */}
      <AppText
        className="text-lg text-espresso mb-4 mt-4"
        style={{ fontFamily: fonts.serif }}>
        Daily Targets
      </AppText>

      <MacroProgressBar
        label="Calories"
        displayValue={`${data.dailyCalories} cal`}
        progress={data.dailyCalories / MACRO_MAX.calories}
      />
      <MacroProgressBar
        label="Protein"
        displayValue={`${data.dailyProteinGrams}g`}
        progress={data.dailyProteinGrams / MACRO_MAX.protein}
      />
      <MacroProgressBar
        label="Carbs"
        displayValue={`${data.dailyCarbsGrams}g`}
        progress={data.dailyCarbsGrams / MACRO_MAX.carbs}
      />
      <MacroProgressBar
        label="Fat"
        displayValue={`${data.dailyFatGrams}g`}
        progress={data.dailyFatGrams / MACRO_MAX.fat}
      />

      <InfoBanner className="mt-2">
        You can adjust these anytime in your profile.
      </InfoBanner>

      {/* Error state */}
      {mutation.isError && (
        <AppText className="text-sm text-berry mt-3 text-center">
          Something went wrong. Please try again.
        </AppText>
      )}
    </OnboardingLayout>
  );
}
