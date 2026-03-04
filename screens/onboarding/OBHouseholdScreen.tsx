import AppText from '../../components/AppText';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import HouseholdSizeStepper from '../../components/HouseholdSizeStepper';
import CookingSkillSelector from '../../components/CookingSkillSelector';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { fonts } from '../../theme/typography';
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
      <AppText
        className="text-2xl text-espresso mb-2 mt-2"
        style={{ fontFamily: fonts.serif }}>
        Your Household
      </AppText>
      <AppText className="text-base leading-[22px] text-stone mb-6">
        This helps us scale recipes and shopping lists.
      </AppText>

      <HouseholdSizeStepper
        value={data.householdSize}
        onChange={(n) => updateData({ householdSize: n })}
      />

      {/* Cooking skill */}
      <AppText
        className="text-lg text-espresso mb-3"
        style={{ fontFamily: fonts.serif }}>
        Cooking Skill
      </AppText>

      <CookingSkillSelector
        selectedSkill={data.cookingSkill}
        onSelect={(skill) => updateData({ cookingSkill: skill })}
      />
    </OnboardingLayout>
  );
}
