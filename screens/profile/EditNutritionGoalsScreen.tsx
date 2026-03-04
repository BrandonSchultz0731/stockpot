import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '../../components/ScreenHeader';
import GoalTypeSelector from '../../components/GoalTypeSelector';
import { useUserProfileQuery } from '../../hooks/useUserProfileQuery';
import { useUpdateProfileMutation } from '../../hooks/useUpdateProfileMutation';
import { GoalType, MACRO_PRESETS } from '../../shared/enums';
import colors from '../../theme/colors';
import { fonts } from '../../theme/typography';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'EditNutritionGoals'>;

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
    <SafeAreaView edges={['top']} className="flex-1 bg-ivory">
      <ScreenHeader
        title="Nutrition Goals"
        centerTitle
        onSave={handleSave}
        isSaving={mutation.isPending}
      />

      <ScrollView contentContainerClassName="px-5 pb-10">
        {/* Goal Type */}
        <Text
          className="text-lg text-espresso mb-2 mt-2"
          style={{ fontFamily: fonts.serif }}>
          Goal Type
        </Text>
        <Text className="text-sm text-stone mb-4">
          Choose a goal and we'll set smart defaults for your daily targets.
        </Text>
        <GoalTypeSelector
          selectedGoal={goalType}
          onSelect={selectGoal}
        />

        {/* Macro Targets */}
        <Text
          className="text-lg text-espresso mb-4 mt-4"
          style={{ fontFamily: fonts.serif }}>
          Daily Targets
        </Text>

        <MacroInput label="Calories" value={calories} onChangeText={setCalories} unit="cal" />
        <MacroInput label="Protein" value={protein} onChangeText={setProtein} unit="g" />
        <MacroInput label="Carbs" value={carbs} onChangeText={setCarbs} unit="g" />
        <MacroInput label="Fat" value={fat} onChangeText={setFat} unit="g" />

        {/* Error state */}
        {mutation.isError && (
          <Text className="text-sm text-berry mt-3 text-center">
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
      <Text className="text-sm font-medium text-espresso mb-1.5">{label}</Text>
      <View className="flex-row items-center bg-cream border border-line rounded-2xl px-4 py-3">
        <TextInput
          className="flex-1 text-base text-espresso"
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholderTextColor={colors.stone}
        />
        <Text className="text-sm text-stone ml-2">{unit}</Text>
      </View>
    </View>
  );
}
