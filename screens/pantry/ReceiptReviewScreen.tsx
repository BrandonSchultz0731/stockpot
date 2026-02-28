import { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import ExpirationDateInput from '../../components/pantry/ExpirationDateInput';
import {
  useBulkCreatePantryItemsMutation,
  type CreatePantryItemRequest,
} from '../../hooks/usePantryMutations';
import { UnitOfMeasure, StorageLocation, type ShelfLife } from '../../shared/enums';
import pluralize from 'pluralize';
import colors from '../../theme/colors';
import type { PantryStackParamList } from '../../navigation/types';
import {
  calculateExpirationDate,
  formatISODate,
} from '../../shared/dates';

type Nav = NativeStackNavigationProp<PantryStackParamList, 'ReceiptReview'>;
type Route = RouteProp<PantryStackParamList, 'ReceiptReview'>;

interface EditableItem extends Partial<CreatePantryItemRequest> {
  _key: string;
  expirationDate?: string;
  expiryIsEstimated?: boolean;
  estimatedShelfLife?: ShelfLife;
}

function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ReceiptReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const bulkCreate = useBulkCreatePantryItemsMutation();

  const [items, setItems] = useState<EditableItem[]>(() =>
    params.items.map((item, i) => {
      const shelfLife = item.estimatedShelfLife;
      const storageLocation = item.suggestedStorageLocation;

      // Compute estimated expiration from shelf life
      const estimatedDate = calculateExpirationDate(shelfLife, storageLocation);

      return {
        ...item,
        storageLocation,
        estimatedShelfLife: shelfLife,
        expirationDate: estimatedDate ? formatISODate(estimatedDate) : undefined,
        expiryIsEstimated: estimatedDate ? true : undefined,
        _key: `${i}-${Date.now()}`,
      };
    }),
  );

  // Inline edit modal state
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editUnit, setEditUnit] = useState<UnitOfMeasure>(UnitOfMeasure.Count);
  const [editStorage, setEditStorage] = useState<StorageLocation | null>(null);
  const [editExpiration, setEditExpiration] = useState<Date | null>(null);
  const [editExpiryIsEstimated, setEditExpiryIsEstimated] = useState(false);

  const openEdit = (index: number) => {
    const item = items[index];
    setEditIndex(index);
    setEditName(item.displayName ?? '');
    setEditQuantity(String(item.quantity ?? 1));
    setEditUnit(item.unit ?? UnitOfMeasure.Count);
    setEditStorage((item.storageLocation as StorageLocation) ?? null);
    setEditExpiration(
      item.expirationDate ? new Date(item.expirationDate + 'T00:00:00') : null,
    );
    setEditExpiryIsEstimated(item.expiryIsEstimated ?? false);
  };

  const handleStorageChange = (newStorage: StorageLocation | null) => {
    setEditStorage(newStorage);

    // If the date is still estimated, recalculate from shelf life + new storage
    if (editExpiryIsEstimated && editIndex !== null) {
      const item = items[editIndex];
      if (item.estimatedShelfLife) {
        const newDate = calculateExpirationDate(
          item.estimatedShelfLife,
          newStorage,
        );
        setEditExpiration(newDate);
      }
    }
  };

  const handleExpirationChange = (date: Date | null) => {
    setEditExpiration(date);
    if (date) {
      // User manually set a date — no longer estimated
      setEditExpiryIsEstimated(false);
    } else if (editIndex !== null) {
      // User cleared the date — recalculate from shelf life
      const item = items[editIndex];
      if (item.estimatedShelfLife) {
        const recalc = calculateExpirationDate(
          item.estimatedShelfLife,
          editStorage,
        );
        if (recalc) {
          setEditExpiration(recalc);
          setEditExpiryIsEstimated(true);
        }
      }
    }
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
            expirationDate: editExpiration
              ? formatISODate(editExpiration)
              : undefined,
            expiryIsEstimated: editExpiration
              ? editExpiryIsEstimated
              : undefined,
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
      expirationDate: i.expirationDate,
      expiryIsEstimated: i.expiryIsEstimated,
      estimatedShelfLife: i.estimatedShelfLife,
    }));

    bulkCreate.mutate(payload, {
      onSuccess: () => navigation.popToTop(),
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
          className="text-[26px] text-navy mb-1 font-extrabold tracking-[-0.5px]">
          Review Items
        </Text>
        <Text className="text-[14px] text-muted mb-4">
          {items.length} {pluralize('item', items.length)} found. Edit or
          remove before adding.
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item._key}
        contentContainerClassName="px-5 pb-[100px]"
        renderItem={({ item, index }) => (
          <View className="bg-white rounded-card border border-border p-3.5 mb-2 flex-row items-center">
            <View className="flex-1 mr-2">
              <Text
                className="text-[14px] text-dark font-semibold"
                numberOfLines={1}>
                {item.displayName || 'Unnamed item'}
              </Text>
              <Text className="text-[12px] text-muted mt-0.5">
                {item.quantity ?? 1} {item.unit ?? UnitOfMeasure.Count}
                {item.storageLocation ? `  ·  ${item.storageLocation}` : ''}
              </Text>
              {item.expirationDate && (
                <Text className="text-[11px] text-muted mt-0.5">
                  Expires: {formatDisplayDate(item.expirationDate)}
                  {item.expiryIsEstimated ? ' (est.)' : ''}
                </Text>
              )}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1">
          <Pressable
            className="flex-1 bg-black/40"
            onPress={() => setEditIndex(null)}
          />
          <View className="bg-white rounded-t-2xl pb-8 px-5 pt-5">
            <Text
              className="text-[18px] text-navy mb-4 font-bold">
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
                  onSelect={handleStorageChange}
                />
              </View>
            </ScrollView>

            <Text className="text-[13px] text-muted font-semibold mb-1.5">
              EXPIRATION DATE
              {editExpiryIsEstimated && editExpiration ? ' (estimated)' : ''}
            </Text>
            <View className="mb-4">
              <ExpirationDateInput
                date={editExpiration}
                onChange={handleExpirationChange}
              />
            </View>

            <Button label="Save" onPress={saveEdit} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
