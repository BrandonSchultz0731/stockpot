import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import PantryItemForm from '../../components/pantry/PantryItemForm';
import { useCreatePantryItemMutation } from '../../hooks/usePantryMutations';
import colors from '../../theme/colors';
import type { PantryStackParamList } from '../../navigation/types';
import type { UnitOfMeasure, ShelfLife } from '../../shared/enums';

type Nav = NativeStackNavigationProp<PantryStackParamList, 'ManualEntry'>;

function parseShelfLife(raw?: string): ShelfLife | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as ShelfLife;
  } catch {
    return undefined;
  }
}

export default function ManualEntryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<PantryStackParamList, 'ManualEntry'>>();
  const createMutation = useCreatePantryItemMutation();

  const { displayName, quantity, unit, shelfLife: shelfLifeRaw } = route.params ?? {};
  const estimatedShelfLife = parseShelfLife(shelfLifeRaw);

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
            className="text-[26px] text-navy mb-4 font-extrabold tracking-[-0.5px]">
            Add Item
          </Text>
        </View>

        <PantryItemForm
          initialValues={{
            ...(displayName ? { displayName } : {}),
            ...(quantity ? { quantity } : {}),
            ...(unit ? { unit: unit as UnitOfMeasure } : {}),
            ...(estimatedShelfLife ? { estimatedShelfLife } : {}),
          }}
          submitLabel="Add to Pantry"
          isPending={createMutation.isPending}
          onSubmit={(values) =>
            createMutation.mutate(
              values,
              {
                onSuccess: () => navigation.popToTop(),
                onError: () =>
                  Alert.alert('Error', 'Failed to add item. Please try again.'),
              },
            )
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
