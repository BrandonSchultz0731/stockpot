import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Zap } from 'lucide-react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import PillButton from '../../components/onboarding/PillButton';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { EXCLUDED_INGREDIENT_SUGGESTIONS } from '../../shared/enums';
import colors from '../../theme/colors';
import type { OnboardingParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingParamList, 'OBExclude'>;

const styles = StyleSheet.create({
  iconOffset: { marginTop: 1 },
});

export default function OBExcludeScreen() {
  const navigation = useNavigation<Nav>();
  const { data, updateData } = useOnboarding();

  const toggleIngredient = (ingredient: string) => {
    if (data.excludedIngredients.includes(ingredient)) {
      updateData({
        excludedIngredients: data.excludedIngredients.filter(
          i => i !== ingredient,
        ),
      });
    } else {
      updateData({
        excludedIngredients: [...data.excludedIngredients, ingredient],
      });
    }
  };

  return (
    <OnboardingLayout
      step={3}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('OBHousehold')}>
      <Text className="text-2xl font-bold text-dark mb-2 mt-2">
        Ingredients to Avoid
      </Text>
      <Text className="text-base leading-[22px] text-muted mb-5">
        We'll make sure these never show up in your recipes.
      </Text>

      {/* Search input (placeholder, no filtering) */}
      <TextInput
        className="bg-white border border-border rounded-2xl px-4 py-3 text-base text-dark mb-5"
        placeholder="Search ingredients..."
        placeholderTextColor={colors.muted}
        editable={false}
      />

      <Text className="text-xs font-semibold tracking-[1px] text-muted mb-3 uppercase">
        Common allergens & dislikes
      </Text>

      <View className="flex-row flex-wrap">
        {EXCLUDED_INGREDIENT_SUGGESTIONS.map(ingredient => (
          <PillButton
            key={ingredient}
            label={ingredient}
            selected={data.excludedIngredients.includes(ingredient)}
            onPress={() => toggleIngredient(ingredient)}
            variant="exclude"
          />
        ))}
      </View>

      {data.excludedIngredients.length > 0 && (
        <View className="bg-orange-pale rounded-2xl p-4 mt-5 flex-row items-start">
          <Zap size={18} color={colors.orange.DEFAULT} style={styles.iconOffset} />
          <Text
            className="text-sm leading-5 text-dark flex-1 ml-2.5">
            We'll automatically filter out recipes containing{' '}
            {data.excludedIngredients.join(', ')}.
          </Text>
        </View>
      )}
    </OnboardingLayout>
  );
}
