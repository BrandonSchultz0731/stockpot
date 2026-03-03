import { Pressable, Text, View } from 'react-native';

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
          className={`w-12 h-12 rounded-full border border-border items-center justify-center bg-white ${value <= min ? 'opacity-30' : ''}`}
          disabled={value <= min}
          onPress={() => onChange(value - 1)}
        >
          <Text className="text-2xl font-semibold -mt-0.5 text-dark">−</Text>
        </Pressable>

        <View className="mx-8 items-center">
          <Text className="text-5xl font-bold text-dark">{value}</Text>
          <Text className="text-sm text-muted mt-1">
            {value === 1 ? 'person' : 'people'}
          </Text>
        </View>

        <Pressable
          className={`w-12 h-12 rounded-full border border-border items-center justify-center bg-white ${value >= max ? 'opacity-30' : ''}`}
          disabled={value >= max}
          onPress={() => onChange(value + 1)}
        >
          <Text className="text-2xl font-semibold -mt-0.5 text-dark">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
