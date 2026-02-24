import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import PantryItemForm from '../../components/pantry/PantryItemForm';
import { useCreatePantryItemMutation } from '../../hooks/usePantryMutations';
import colors from '../../theme/colors';
import type { PantryStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<PantryStackParamList, 'ManualEntry'>;

export default function ManualEntryScreen() {
  const navigation = useNavigation<Nav>();
  const createMutation = useCreatePantryItemMutation();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="px-5 pt-4 pb-2">
          <Pressable onPress={() => navigation.goBack()} className="mb-4">
            <ChevronLeft size={24} color={colors.navy.DEFAULT} />
          </Pressable>
          <Text
            className="text-[26px] text-navy mb-4"
            style={{ fontWeight: '800', letterSpacing: -0.5 }}>
            Add Item
          </Text>
        </View>

        <PantryItemForm
          submitLabel="Add to Pantry"
          isPending={createMutation.isPending}
          onSubmit={(values) =>
            createMutation.mutate(values, {
              onSuccess: () => navigation.navigate('PantryList'),
              onError: () =>
                Alert.alert('Error', 'Failed to add item. Please try again.'),
            })
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
