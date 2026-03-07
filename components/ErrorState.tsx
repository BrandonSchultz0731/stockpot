import { Pressable, View } from 'react-native';
import AppText from './AppText';

interface ErrorStateProps {
  message: string;
  onGoBack?: () => void;
  actionLabel?: string;
}

export default function ErrorState({
  message,
  onGoBack,
  actionLabel = 'Go Back',
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <AppText className="text-center text-[14px] text-stone">{message}</AppText>
      {onGoBack && (
        <Pressable onPress={onGoBack} className="mt-3" accessibilityRole="button" accessibilityLabel={actionLabel}>
          <AppText className="text-[14px] font-semibold text-terra">
            {actionLabel}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}
