import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Info } from 'lucide-react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import SelectableCard from '../../components/onboarding/SelectableCard';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useCompleteOnboardingMutation } from '../../hooks/useCompleteOnboardingMutation';
import { GoalType, MACRO_PRESETS } from '../../shared/enums';
import colors from '../../theme/colors';
import type { OnboardingParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingParamList, 'OBGoals'>;

const GOAL_EMOJIS: Record<GoalType, string> = {
  [GoalType.LoseWeight]: '📉',
  [GoalType.Maintain]: '⚖️',
  [GoalType.BuildMuscle]: '💪',
};

const MACRO_MAX = { calories: 3000, protein: 250, carbs: 400, fat: 100 };

interface MacroRowProps {
  label: string;
  value: number;
  max: number;
  unit: string;
}

function MacroRow({ label, value, max, unit }: MacroRowProps) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-sm font-medium text-dark">
          {label}
        </Text>
        <Text className="text-sm text-muted">
          {value}
          {unit}
        </Text>
      </View>
      <View className="h-2 rounded-full bg-border overflow-hidden">
        <View
          className="h-2 rounded-full bg-orange"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}

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
      <Text className="text-2xl font-bold text-dark mb-2 mt-2">
        Nutrition Goals
      </Text>
      <Text className="text-base leading-[22px] text-muted mb-6">
        Choose a goal and we'll set smart defaults for your daily targets.
      </Text>

      {/* Goal type cards */}
      {Object.values(GoalType).map(goal => (
        <SelectableCard
          key={goal}
          title={`${GOAL_EMOJIS[goal]}  ${goal}`}
          selected={data.goalType === goal}
          onPress={() => selectGoal(goal)}
        />
      ))}

      {/* Daily targets */}
      <Text className="text-lg font-semibold text-dark mb-4 mt-4">
        Daily Targets
      </Text>

      <MacroRow
        label="Calories"
        value={data.dailyCalories}
        max={MACRO_MAX.calories}
        unit=" cal"
      />
      <MacroRow
        label="Protein"
        value={data.dailyProteinGrams}
        max={MACRO_MAX.protein}
        unit="g"
      />
      <MacroRow
        label="Carbs"
        value={data.dailyCarbsGrams}
        max={MACRO_MAX.carbs}
        unit="g"
      />
      <MacroRow
        label="Fat"
        value={data.dailyFatGrams}
        max={MACRO_MAX.fat}
        unit="g"
      />

      {/* Info note */}
      <View className="flex-row items-start bg-orange-pale rounded-2xl p-4 mt-2">
        <Info size={16} color={colors.orange.DEFAULT} className="mt-px" />
        <Text
          className="text-sm leading-5 text-dark flex-1 ml-2.5">
          You can adjust these anytime in your profile.
        </Text>
      </View>

      {/* Error state */}
      {mutation.isError && (
        <Text className="text-sm text-danger mt-3 text-center">
          Something went wrong. Please try again.
        </Text>
      )}
    </OnboardingLayout>
  );
}
