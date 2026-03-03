import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';

interface LoadingScreenProps {
  /** Optional header element (e.g. a ScreenHeader) rendered above the spinner */
  header?: React.ReactNode;
  /** Optional message shown below the spinner */
  message?: string;
  /** Spinner colour — defaults to orange */
  color?: string;
}

export default function LoadingScreen({
  header,
  message,
  color = colors.orange.DEFAULT,
}: LoadingScreenProps) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      {header}
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={color} />
        {message ? (
          <Text className="mt-4 text-[14px] text-muted">{message}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
