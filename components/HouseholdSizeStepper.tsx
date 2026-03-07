import { Pressable, View } from 'react-native';
import AppText from './AppText';
import { fonts } from '../theme/typography';

interface HouseholdSizeStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

export default function HouseholdSizeStepper({
  value,
  onChange,
  min = 1,
  max = 10,
}: HouseholdSizeStepperProps) {
  return (
    <View className="items-center mb-8">
      <View className="flex-row items-center">
        <Pressable
          className={`w-12 h-12 rounded-full border border-line items-center justify-center bg-white ${value <= min ? 'opacity-30' : ''}`}
          disabled={value <= min}
          onPress={() => onChange(value - 1)}
          accessibilityRole="button"
          accessibilityLabel="Decrease household size"
        >
          <AppText className="text-2xl font-semibold -mt-0.5 text-espresso">−</AppText>
        </Pressable>

        <View className="mx-8 items-center">
          <AppText
            className="text-5xl font-bold text-terra"
            style={{ fontFamily: fonts.serif }}
          >
            {value}
          </AppText>
          <AppText className="text-sm text-stone mt-1">
            {value === 1 ? 'person' : 'people'}
          </AppText>
        </View>

        <Pressable
          className={`w-12 h-12 rounded-full border border-line items-center justify-center bg-white ${value >= max ? 'opacity-30' : ''}`}
          disabled={value >= max}
          onPress={() => onChange(value + 1)}
          accessibilityRole="button"
          accessibilityLabel="Increase household size"
        >
          <AppText className="text-2xl font-semibold -mt-0.5 text-espresso">+</AppText>
        </Pressable>
      </View>
    </View>
  );
}
