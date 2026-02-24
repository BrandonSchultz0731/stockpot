import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Pencil, X } from 'lucide-react-native';
import Button from '../../components/Button';
import QuantityUnitInput from '../../components/pantry/QuantityUnitInput';
import StorageLocationPills from '../../components/pantry/StorageLocationPills';
import {
  useBulkCreatePantryItemsMutation,
  type CreatePantryItemRequest,
} from '../../hooks/usePantryMutations';
import { UnitOfMeasure, StorageLocation } from '../../shared/enums';
import colors from '../../theme/colors';
import type { PantryStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<PantryStackParamList, 'ReceiptReview'>;
type Route = RouteProp<PantryStackParamList, 'ReceiptReview'>;

interface EditableItem extends Partial<CreatePantryItemRequest> {
  _key: string;
}

export default function ReceiptReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const bulkCreate = useBulkCreatePantryItemsMutation();

  const [items, setItems] = useState<EditableItem[]>(() =>
    params.items.map((item, i) => ({ ...item, _key: `${i}-${Date.now()}` })),
  );

  // Inline edit modal state
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editUnit, setEditUnit] = useState<UnitOfMeasure>(UnitOfMeasure.Count);
  const [editStorage, setEditStorage] = useState<StorageLocation | null>(null);

  const openEdit = (index: number) => {
    const item = items[index];
    setEditIndex(index);
    setEditName(item.displayName ?? '');
    setEditQuantity(String(item.quantity ?? 1));
    setEditUnit(item.unit ?? UnitOfMeasure.Count);
    setEditStorage((item.storageLocation as StorageLocation) ?? null);
  };

  const saveEdit = () => {
    if (editIndex === null) return;
    setItems(prev =>
      prev.map((item, i) =>
        i === editIndex
          ? {
              ...item,
              displayName: editName.trim(),
              quantity: parseFloat(editQuantity) || 1,
              unit: editUnit,
              storageLocation: editStorage ?? undefined,
            }
          : item,
      ),
    );
    setEditIndex(null);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddAll = () => {
    const valid = items.filter(i => i.displayName?.trim());
    if (valid.length === 0) {
      Alert.alert('No items', 'Please add at least one item.');
      return;
    }

    const payload: CreatePantryItemRequest[] = valid.map(i => ({
      displayName: i.displayName!.trim(),
      quantity: i.quantity ?? 1,
      unit: i.unit ?? UnitOfMeasure.Count,
      storageLocation: i.storageLocation,
      foodCacheId: i.foodCacheId,
      fdcId: i.fdcId,
    }));

    bulkCreate.mutate(payload, {
      onSuccess: () => navigation.navigate('PantryList'),
      onError: () =>
        Alert.alert('Error', 'Failed to add items. Please try again.'),
    });
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <View className="px-5 pt-4 pb-2">
        <Pressable onPress={() => navigation.goBack()} className="mb-4">
          <ChevronLeft size={24} color={colors.navy.DEFAULT} />
        </Pressable>
        <Text
          className="text-[26px] text-navy mb-1"
          style={{ fontWeight: '800', letterSpacing: -0.5 }}>
          Review Items
        </Text>
        <Text className="text-[14px] text-muted mb-4">
          {items.length} item{items.length !== 1 ? 's' : ''} found. Edit or
          remove before adding.
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item._key}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        renderItem={({ item, index }) => (
          <View className="bg-white rounded-card border border-border p-3.5 mb-2 flex-row items-center">
            <View className="flex-1 mr-2">
              <Text
                className="text-[14px] text-dark"
                style={{ fontWeight: '600' }}
                numberOfLines={1}>
                {item.displayName || 'Unnamed item'}
              </Text>
              <Text className="text-[12px] text-muted mt-0.5">
                {item.quantity ?? 1} {item.unit ?? 'count'}
                {item.storageLocation ? `  ·  ${item.storageLocation}` : ''}
              </Text>
            </View>
            <Pressable onPress={() => openEdit(index)} className="p-2">
              <Pencil size={16} color={colors.muted} />
            </Pressable>
            <Pressable onPress={() => removeItem(index)} className="p-2">
              <X size={16} color={colors.danger.DEFAULT} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center pt-12">
            <Text className="text-[14px] text-muted">
              All items removed. Go back to scan again.
            </Text>
          </View>
        }
      />

      <View className="px-5 pb-6">
        <Button
          label={`Add All to Pantry (${items.length})`}
          onPress={handleAddAll}
          disabled={items.length === 0 || bulkCreate.isPending}
        />
      </View>

      {/* Inline edit modal */}
      <Modal visible={editIndex !== null} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setEditIndex(null)}
        />
        <View className="bg-white rounded-t-2xl pb-8 px-5 pt-5">
          <Text
            className="text-[18px] text-navy mb-4"
            style={{ fontWeight: '700' }}>
            Edit Item
          </Text>

          <Text className="text-[13px] text-muted font-semibold mb-1.5">
            NAME
          </Text>
          <View className="bg-cream rounded-input border border-border px-3.5 py-3 mb-4">
            <TextInput
              className="text-[14px] leading-[18px] text-dark"
              value={editName}
              onChangeText={setEditName}
              placeholder="Item name"
              placeholderTextColor={colors.muted}
            />
          </View>

          <Text className="text-[13px] text-muted font-semibold mb-1.5">
            QUANTITY
          </Text>
          <View className="mb-4">
            <QuantityUnitInput
              quantity={editQuantity}
              unit={editUnit}
              onQuantityChange={setEditQuantity}
              onUnitChange={setEditUnit}
            />
          </View>

          <Text className="text-[13px] text-muted font-semibold mb-1.5">
            STORAGE LOCATION
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="mb-4">
              <StorageLocationPills
                selected={editStorage}
                onSelect={setEditStorage}
              />
            </View>
          </ScrollView>

          <Button label="Save" onPress={saveEdit} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}
