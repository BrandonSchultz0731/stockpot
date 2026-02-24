import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import colors from '../../theme/colors';

interface OnboardingLayoutProps {
  step: number;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isSubmitting?: boolean;
  children: React.ReactNode;
}

const TOTAL_STEPS = 5;

export default function OnboardingLayout({
  step,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  isSubmitting = false,
  children,
}: OnboardingLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      {/* Header */}
      <View className="h-11 flex-row items-center px-4">
        {onBack ? (
          <Pressable onPress={onBack} className="p-1 -ml-1">
            <ChevronLeft size={24} color={colors.dark} />
          </Pressable>
        ) : (
          <View className="w-6" />
        )}
      </View>

      {/* Scrollable content */}
      <ScrollView
        contentContainerClassName="flex-grow px-6 pb-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>

      {/* Bottom pinned section */}
      <View className="px-6 pb-8 pt-3 bg-cream">
        {/* Progress bar */}
        <View className="flex-row gap-1.5 mb-4">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < step ? 'bg-orange' : 'bg-border'
              }`}
            />
          ))}
        </View>

        {/* Action button */}
        <Pressable
          className={`items-center justify-center rounded-button bg-orange py-3.5 ${nextDisabled || isSubmitting ? 'opacity-50' : ''}`}
          disabled={nextDisabled || isSubmitting}
          onPress={onNext}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-[15px] font-bold text-white">
              {nextLabel}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
