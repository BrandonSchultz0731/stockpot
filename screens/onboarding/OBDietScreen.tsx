import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import PillButton from '../../components/onboarding/PillButton';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { DietaryPreference } from '../../shared/enums';
import type { OnboardingParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingParamList, 'OBDiet'>;

const ALL_DIETS = Object.values(DietaryPreference);

export default function OBDietScreen() {
  const navigation = useNavigation<Nav>();
  const { data, updateData } = useOnboarding();

  const toggleDiet = (diet: DietaryPreference) => {
    if (diet === DietaryPreference.None) {
      // "None" clears all others
      updateData({ diets: [DietaryPreference.None] });
      return;
    }
    // Any other diet clears "None"
    const withoutNone = data.diets.filter(d => d !== DietaryPreference.None);
    if (withoutNone.includes(diet)) {
      updateData({ diets: withoutNone.filter(d => d !== diet) });
    } else {
      updateData({ diets: [...withoutNone, diet] });
    }
  };

  return (
    <OnboardingLayout
      step={2}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('OBExclude')}>
      <Text
        className="text-2xl text-dark mb-2 mt-2"
        style={{ fontWeight: '700' }}>
        Dietary Preferences
      </Text>
      <Text className="text-base text-muted mb-6" style={{ lineHeight: 22 }}>
        Select any that apply. Our AI will use these to tailor recipe
        suggestions.
      </Text>

      <View className="flex-row flex-wrap">
        {ALL_DIETS.map(diet => (
          <PillButton
            key={diet}
            label={diet}
            selected={data.diets.includes(diet)}
            onPress={() => toggleDiet(diet)}
            variant="diet"
          />
        ))}
      </View>
    </OnboardingLayout>
  );
}
