import { Pressable, Text, View } from 'react-native';

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
      <Text className="text-center text-[14px] text-stone">{message}</Text>
      {onGoBack && (
        <Pressable onPress={onGoBack} className="mt-3">
          <Text className="text-[14px] font-semibold text-terra">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
