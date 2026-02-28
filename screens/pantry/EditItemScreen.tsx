import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import PantryItemForm from '../../components/pantry/PantryItemForm';
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
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
          <Pressable onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={colors.navy.DEFAULT} />
          </Pressable>
          <Text
            className="text-[18px] text-navy font-bold">
            Edit Item
          </Text>
          <Pressable onPress={handleDelete}>
            <Trash2 size={22} color={colors.danger.DEFAULT} />
          </Pressable>
        </View>

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
