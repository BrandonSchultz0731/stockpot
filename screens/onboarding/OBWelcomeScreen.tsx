import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import type { OnboardingParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingParamList, 'OBWelcome'>;

export default function OBWelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <OnboardingLayout
      step={1}
      onNext={() => navigation.navigate('OBDiet')}
      nextLabel="Let's Go">
      <View className="flex-1 items-center justify-center">
        <View className="w-24 h-24 rounded-3xl bg-orange-pale items-center justify-center mb-6">
          <Text className="text-[48px]">🍲</Text>
        </View>
        <Text className="text-2xl font-bold text-dark text-center mb-3">
          Welcome to StockPot
        </Text>
        <Text className="text-base leading-[22px] text-muted text-center px-6">
          Let's personalize your experience so our AI chef can suggest meals
          you'll love.
        </Text>
      </View>
    </OnboardingLayout>
  );
}
