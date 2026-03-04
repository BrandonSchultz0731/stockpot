import { Text, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Zap } from 'lucide-react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import InfoBanner from '../../components/InfoBanner';
import ExcludedIngredientsSelector from '../../components/ExcludedIngredientsSelector';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useToggleItem } from '../../hooks/useToggleList';
import colors from '../../theme/colors';
import { fonts } from '../../theme/typography';
import type { OnboardingParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingParamList, 'OBExclude'>;

export default function OBExcludeScreen() {
  const navigation = useNavigation<Nav>();
  const { data, updateData } = useOnboarding();

  const setExcluded = (next: string[]) =>
    updateData({ excludedIngredients: next });
  const toggleIngredient = useToggleItem(data.excludedIngredients, setExcluded);

  return (
    <OnboardingLayout
      step={3}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('OBHousehold')}>
      <Text
        className="text-2xl text-espresso mb-2 mt-2"
        style={{ fontFamily: fonts.serif }}>
        Ingredients to Avoid
      </Text>
      <Text className="text-base leading-[22px] text-stone mb-5">
        We'll make sure these never show up in your recipes.
      </Text>

      {/* Search input (placeholder, no filtering) */}
      <TextInput
        className="bg-cream border border-line rounded-2xl px-4 py-3 text-base text-espresso mb-5"
        placeholder="Search ingredients..."
        placeholderTextColor={colors.stone}
        editable={false}
      />

      <Text className="text-xs font-semibold tracking-[1px] text-stone mb-3 uppercase">
        Common allergens & dislikes
      </Text>

      <ExcludedIngredientsSelector
        selectedIngredients={data.excludedIngredients}
        onToggle={toggleIngredient}
      />

      {data.excludedIngredients.length > 0 && (
        <InfoBanner
          icon={<Zap size={18} color={colors.terra.DEFAULT} className="mt-px" />}
          className="mt-5"
        >
          We'll automatically filter out recipes containing{' '}
          {data.excludedIngredients.join(', ')}.
        </InfoBanner>
      )}
    </OnboardingLayout>
  );
}
