import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import SelectableCard from '../../components/onboarding/SelectableCard';
import { useUserProfileQuery } from '../../hooks/useUserProfileQuery';
import { useUpdateProfileMutation } from '../../hooks/useUpdateProfileMutation';
import { GoalType, MACRO_PRESETS } from '../../shared/enums';
import colors from '../../theme/colors';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'EditNutritionGoals'>;

const GOAL_EMOJIS: Record<GoalType, string> = {
  [GoalType.LoseWeight]: '📉',
  [GoalType.Maintain]: '⚖️',
  [GoalType.BuildMuscle]: '💪',
};

export default function EditNutritionGoalsScreen() {
  const navigation = useNavigation<Nav>();
  const { data: profile } = useUserProfileQuery();
  const mutation = useUpdateProfileMutation();

  const ng = profile?.nutritionalGoals;

  const [goalType, setGoalType] = useState<GoalType>(ng?.goalType ?? GoalType.Maintain);
  const [calories, setCalories] = useState(String(ng?.dailyCalories ?? MACRO_PRESETS[GoalType.Maintain].calories));
  const [protein, setProtein] = useState(String(ng?.dailyProteinGrams ?? MACRO_PRESETS[GoalType.Maintain].protein));
  const [carbs, setCarbs] = useState(String(ng?.dailyCarbsGrams ?? MACRO_PRESETS[GoalType.Maintain].carbs));
  const [fat, setFat] = useState(String(ng?.dailyFatGrams ?? MACRO_PRESETS[GoalType.Maintain].fat));

  const selectGoal = (goal: GoalType) => {
    setGoalType(goal);
    const preset = MACRO_PRESETS[goal];
    setCalories(String(preset.calories));
    setProtein(String(preset.protein));
    setCarbs(String(preset.carbs));
    setFat(String(preset.fat));
  };

  const handleSave = () => {
    mutation.mutate(
      {
        nutritionalGoals: {
          goalType,
          dailyCalories: Number(calories) || 0,
          dailyProteinGrams: Number(protein) || 0,
          dailyCarbsGrams: Number(carbs) || 0,
          dailyFatGrams: Number(fat) || 0,
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
        <Text className="text-lg font-bold text-navy">Nutrition Goals</Text>
        <Pressable onPress={handleSave} disabled={mutation.isPending} hitSlop={12}>
          {mutation.isPending ? (
            <ActivityIndicator size="small" color={colors.orange.DEFAULT} />
          ) : (
            <Text className="text-[15px] font-semibold text-orange">Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-10">
        {/* Goal Type */}
        <Text className="text-lg font-bold text-dark mb-2 mt-2">
          Goal Type
        </Text>
        <Text className="text-sm text-muted mb-4">
          Choose a goal and we'll set smart defaults for your daily targets.
        </Text>
        {Object.values(GoalType).map(goal => (
          <SelectableCard
            key={goal}
            title={`${GOAL_EMOJIS[goal]}  ${goal}`}
            selected={goalType === goal}
            onPress={() => selectGoal(goal)}
          />
        ))}

        {/* Macro Targets */}
        <Text className="text-lg font-bold text-dark mb-4 mt-4">
          Daily Targets
        </Text>

        <MacroInput label="Calories" value={calories} onChangeText={setCalories} unit="cal" />
        <MacroInput label="Protein" value={protein} onChangeText={setProtein} unit="g" />
        <MacroInput label="Carbs" value={carbs} onChangeText={setCarbs} unit="g" />
        <MacroInput label="Fat" value={fat} onChangeText={setFat} unit="g" />

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

function MacroInput({
  label,
  value,
  onChangeText,
  unit,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  unit: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-dark mb-1.5">{label}</Text>
      <View className="flex-row items-center bg-white border border-border rounded-2xl px-4 py-3">
        <TextInput
          className="flex-1 text-base text-dark"
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholderTextColor={colors.muted}
        />
        <Text className="text-sm text-muted ml-2">{unit}</Text>
      </View>
    </View>
  );
}
