import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import HouseholdSizeStepper from '../../components/HouseholdSizeStepper';
import CookingSkillSelector from '../../components/CookingSkillSelector';
import { useOnboarding } from '../../contexts/OnboardingContext';
import type { OnboardingParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingParamList, 'OBHousehold'>;

export default function OBHouseholdScreen() {
  const navigation = useNavigation<Nav>();
  const { data, updateData } = useOnboarding();

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

      <HouseholdSizeStepper
        value={data.householdSize}
        onChange={(n) => updateData({ householdSize: n })}
      />

      {/* Cooking skill */}
      <Text className="text-lg font-semibold text-dark mb-3">
        Cooking Skill
      </Text>

      <CookingSkillSelector
        selectedSkill={data.cookingSkill}
        onSelect={(skill) => updateData({ cookingSkill: skill })}
      />
    </OnboardingLayout>
  );
}
