import AppText from '../../components/AppText';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import DietSelector from '../../components/DietSelector';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { DietaryPreference } from '../../shared/enums';
import { useToggleDiet } from '../../hooks/useToggleList';
import { fonts } from '../../theme/typography';
import type { OnboardingParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingParamList, 'OBDiet'>;

export default function OBDietScreen() {
  const navigation = useNavigation<Nav>();
  const { data, updateData } = useOnboarding();

  const setDiets = (next: DietaryPreference[]) => updateData({ diets: next });
  const toggleDiet = useToggleDiet(data.diets, setDiets);

  return (
    <OnboardingLayout
      step={2}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('OBExclude')}>
      <AppText
        className="text-2xl text-espresso mb-2 mt-2"
        style={{ fontFamily: fonts.serif }}>
        Dietary Preferences
      </AppText>
      <AppText className="text-base leading-[22px] text-stone mb-6">
        Select any that apply. Our AI will use these to tailor recipe
        suggestions.
      </AppText>

      <DietSelector selectedDiets={data.diets} onToggle={toggleDiet} />
    </OnboardingLayout>
  );
}
