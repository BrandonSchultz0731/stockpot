import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Trash2 } from 'lucide-react-native';
import PantryItemForm from '../../components/pantry/PantryItemForm';
import ScreenHeader from '../../components/ScreenHeader';
import {
  useUpdatePantryItemMutation,
  useDeletePantryItemMutation,
} from '../../hooks/usePantryMutations';
import { StorageLocation } from '../../shared/enums';
import colors from '../../theme/colors';
import type { PantryStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<PantryStackParamList, 'EditItem'>;
type Route = RouteProp<PantryStackParamList, 'EditItem'>;

export default function EditItemScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { item } = params;

  const updateMutation = useUpdatePantryItemMutation();
  const deleteMutation = useDeletePantryItemMutation();

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to remove "${item.displayName}" from your pantry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteMutation.mutate(item.id, {
              onSuccess: () => navigation.goBack(),
              onError: () =>
                Alert.alert('Error', 'Failed to delete item. Please try again.'),
            }),
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-ivory">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader
          title="Edit Item"
          centerTitle
          rightAction={
            <Pressable onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete item">
              <Trash2 size={22} color={colors.berry.DEFAULT} />
            </Pressable>
          }
        />

        <PantryItemForm
          initialValues={{
            displayName: item.displayName,
            quantity: String(item.quantity),
            unit: item.unit,
            storageLocation: (item.storageLocation as StorageLocation) ?? null,
            expirationDate: item.expirationDate
              ? new Date(item.expirationDate + 'T00:00:00')
              : null,
            notes: item.notes ?? '',
          }}
          submitLabel="Save Changes"
          isPending={updateMutation.isPending}
          onSubmit={(values) =>
            updateMutation.mutate(
              { id: item.id, data: values },
              {
                onSuccess: () => navigation.goBack(),
                onError: () =>
                  Alert.alert('Error', 'Failed to save changes. Please try again.'),
              },
            )
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
