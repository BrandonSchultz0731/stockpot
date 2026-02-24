import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import Button from '../Button';
import StorageLocationPills from './StorageLocationPills';
import QuantityUnitInput from './QuantityUnitInput';
import ExpirationDateInput from './ExpirationDateInput';
import { UnitOfMeasure, StorageLocation } from '../../shared/enums';
import colors from '../../theme/colors';

interface PantryItemFormValues {
  displayName: string;
  quantity: number;
  unit: UnitOfMeasure;
  storageLocation?: StorageLocation;
  expirationDate?: string;
  notes?: string;
}

interface PantryItemFormProps {
  initialValues?: {
    displayName?: string;
    quantity?: string;
    unit?: UnitOfMeasure;
    storageLocation?: StorageLocation | null;
    expirationDate?: Date | null;
    notes?: string;
  };
  onSubmit: (values: PantryItemFormValues) => void;
  submitLabel: string;
  isPending: boolean;
}

export default function PantryItemForm({
  initialValues,
  onSubmit,
  submitLabel,
  isPending,
}: PantryItemFormProps) {
  const [displayName, setDisplayName] = useState(initialValues?.displayName ?? '');
  const [quantity, setQuantity] = useState(initialValues?.quantity ?? '1');
  const [unit, setUnit] = useState<UnitOfMeasure>(initialValues?.unit ?? UnitOfMeasure.Count);
  const [storageLocation, setStorageLocation] = useState<StorageLocation | null>(
    initialValues?.storageLocation ?? null,
  );
  const [expirationDate, setExpirationDate] = useState<Date | null>(
    initialValues?.expirationDate ?? null,
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? '');

  const handleSubmit = () => {
    const qty = parseFloat(quantity);
    if (!displayName.trim()) {
      Alert.alert('Missing name', 'Please enter an item name.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid quantity', 'Please enter a valid quantity.');
      return;
    }

    onSubmit({
      displayName: displayName.trim(),
      quantity: qty,
      unit,
      storageLocation: storageLocation ?? undefined,
      expirationDate: expirationDate
        ? `${expirationDate.getFullYear()}-${String(expirationDate.getMonth() + 1).padStart(2, '0')}-${String(expirationDate.getDate()).padStart(2, '0')}`
        : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <ScrollView
      className="flex-1 px-5"
      keyboardShouldPersistTaps="handled">
      {/* Name */}
      <Text className="text-[13px] text-muted font-semibold mb-1.5">
        NAME
      </Text>
      <View className="bg-white rounded-input border border-border px-3.5 py-3 mb-4">
        <TextInput
          className="text-[14px] leading-[18px] text-dark"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Item name"
          placeholderTextColor={colors.muted}
        />
      </View>

      {/* Quantity & Unit */}
      <Text className="text-[13px] text-muted font-semibold mb-1.5">
        QUANTITY
      </Text>
      <View className="mb-4">
        <QuantityUnitInput
          quantity={quantity}
          unit={unit}
          onQuantityChange={setQuantity}
          onUnitChange={setUnit}
        />
      </View>

      {/* Storage Location */}
      <Text className="text-[13px] text-muted font-semibold mb-1.5">
        STORAGE LOCATION
      </Text>
      <View className="mb-4">
        <StorageLocationPills
          selected={storageLocation}
          onSelect={setStorageLocation}
        />
      </View>

      {/* Expiration Date */}
      <Text className="text-[13px] text-muted font-semibold mb-1.5">
        EXPIRATION DATE
      </Text>
      <View className="mb-4">
        <ExpirationDateInput
          date={expirationDate}
          onChange={setExpirationDate}
        />
      </View>

      {/* Notes */}
      <Text className="text-[13px] text-muted font-semibold mb-1.5">
        NOTES
      </Text>
      <View className="bg-white rounded-input border border-border px-3.5 py-3 mb-6">
        <TextInput
          className="text-[14px] leading-[18px] text-dark"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={3}
          style={{ minHeight: 60, textAlignVertical: 'top' }}
        />
      </View>

      <Button
        label={submitLabel}
        onPress={handleSubmit}
        disabled={isPending}
        className="mb-8"
      />
    </ScrollView>
  );
}
