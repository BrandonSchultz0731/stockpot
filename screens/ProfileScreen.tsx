import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-cream">
      <Text className="text-2xl font-bold text-navy">Profile</Text>
    </SafeAreaView>
  );
}
