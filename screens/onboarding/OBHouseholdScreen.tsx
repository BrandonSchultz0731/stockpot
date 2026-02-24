import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import SelectableCard from '../../components/onboarding/SelectableCard';
import { useOnboarding } from '../../contexts/OnboardingContext';
import {
  CookingSkill,
  COOKING_SKILL_DESCRIPTIONS,
} from '../../shared/enums';
import type { OnboardingParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingParamList, 'OBHousehold'>;

export default function OBHouseholdScreen() {
  const navigation = useNavigation<Nav>();
  const { data, updateData } = useOnboarding();

  const decrement = () => {
    if (data.householdSize > 1) {
      updateData({ householdSize: data.householdSize - 1 });
    }
  };

  const increment = () => {
    if (data.householdSize < 10) {
      updateData({ householdSize: data.householdSize + 1 });
    }
  };

  return (
    <OnboardingLayout
      step={4}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('OBGoals')}>
      <Text className="text-2xl font-bold text-dark mb-2 mt-2">
        Your Household
      </Text>
      <Text className="text-base leading-[22px] text-muted mb-6">
        This helps us scale recipes and shopping lists.
      </Text>

      {/* Household size stepper */}
      <View className="items-center mb-8">
        <View className="flex-row items-center">
          <Pressable
            className={`w-12 h-12 rounded-full border border-border items-center justify-center bg-white ${data.householdSize <= 1 ? 'opacity-30' : ''}`}
            disabled={data.householdSize <= 1}
            onPress={decrement}>
            <Text className="text-2xl font-semibold -mt-0.5 text-dark">
              −
            </Text>
          </Pressable>

          <View className="mx-8 items-center">
            <Text className="text-5xl font-bold text-dark">
              {data.householdSize}
            </Text>
            <Text className="text-sm text-muted mt-1">
              {data.householdSize === 1 ? 'person' : 'people'}
            </Text>
          </View>

          <Pressable
            className={`w-12 h-12 rounded-full border border-border items-center justify-center bg-white ${data.householdSize >= 10 ? 'opacity-30' : ''}`}
            disabled={data.householdSize >= 10}
            onPress={increment}>
            <Text className="text-2xl font-semibold -mt-0.5 text-dark">
              +
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Cooking skill */}
      <Text className="text-lg font-semibold text-dark mb-3">
        Cooking Skill
      </Text>

      {Object.values(CookingSkill).map(skill => (
        <SelectableCard
          key={skill}
          title={skill}
          description={COOKING_SKILL_DESCRIPTIONS[skill]}
          selected={data.cookingSkill === skill}
          onPress={() => updateData({ cookingSkill: skill })}
        />
      ))}
    </OnboardingLayout>
  );
}
