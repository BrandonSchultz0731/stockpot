import { ActivityIndicator, View } from 'react-native';
import AppText from './AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';

interface LoadingScreenProps {
  /** Optional header element (e.g. a ScreenHeader) rendered above the spinner */
  header?: React.ReactNode;
  /** Optional message shown below the spinner */
  message?: string;
  /** Spinner colour — defaults to terra */
  color?: string;
}

export default function LoadingScreen({
  header,
  message,
  color = colors.terra.DEFAULT,
}: LoadingScreenProps) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-ivory">
      {header}
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={color} />
        {message ? (
          <AppText className="mt-4 text-[14px] text-stone">{message}</AppText>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
