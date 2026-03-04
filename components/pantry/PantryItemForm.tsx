import { useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
import AppText from '../AppText';
import Button from '../Button';
import StorageLocationPills from './StorageLocationPills';
import QuantityUnitInput from './QuantityUnitInput';
import ExpirationDateInput from './ExpirationDateInput';
import { UnitOfMeasure, StorageLocation, type ShelfLife } from '../../shared/enums';
import { calculateExpirationDate, formatISODate } from '../../shared/dates';
import colors from '../../theme/colors';

interface PantryItemFormValues {
  displayName: string;
  quantity: number;
  unit: UnitOfMeasure;
  storageLocation?: StorageLocation;
  expirationDate?: string;
  expiryIsEstimated?: boolean;
  notes?: string;
}

interface PantryItemFormProps {
  initialValues?: {
    displayName?: string;
    quantity?: string;
    unit?: UnitOfMeasure;
    storageLocation?: StorageLocation | null;
    expirationDate?: Date | null;
    estimatedShelfLife?: ShelfLife;
    notes?: string;
  };
  onSubmit: (values: PantryItemFormValues) => void;
  submitLabel: string;
  isPending: boolean;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <AppText font="sansBold" className="text-[11px] text-stone uppercase tracking-[1.2px] mb-2">
      {children}
    </AppText>
  );
}

export default function PantryItemForm({
  initialValues,
  onSubmit,
  submitLabel,
  isPending,
}: PantryItemFormProps) {
  const shelfLife = initialValues?.estimatedShelfLife;

  // Pre-compute expiration from shelf life if no explicit date provided
  const prefilledDate = !initialValues?.expirationDate && shelfLife
    ? calculateExpirationDate(shelfLife, initialValues?.storageLocation)
    : null;

  const [displayName, setDisplayName] = useState(initialValues?.displayName ?? '');
  const [quantity, setQuantity] = useState(initialValues?.quantity ?? '1');
  const [unit, setUnit] = useState<UnitOfMeasure>(initialValues?.unit ?? UnitOfMeasure.Count);
  const [storageLocation, setStorageLocation] = useState<StorageLocation | null>(
    initialValues?.storageLocation ?? null,
  );
  const [expirationDate, setExpirationDate] = useState<Date | null>(
    initialValues?.expirationDate ?? prefilledDate,
  );
  const [expiryIsEstimated, setExpiryIsEstimated] = useState(!!prefilledDate);
  const [notes, setNotes] = useState(initialValues?.notes ?? '');

  const handleStorageChange = (newStorage: StorageLocation | null) => {
    setStorageLocation(newStorage);

    // Recalculate expiration if still estimated
    if (expiryIsEstimated && shelfLife) {
      const newDate = calculateExpirationDate(shelfLife, newStorage);
      setExpirationDate(newDate);
    }
  };

  const handleExpirationChange = (date: Date | null) => {
    setExpirationDate(date);
    if (date) {
      // User manually set a date — no longer estimated
      setExpiryIsEstimated(false);
    } else if (shelfLife) {
      // User cleared the date — recalculate from shelf life
      const recalc = calculateExpirationDate(shelfLife, storageLocation);
      if (recalc) {
        setExpirationDate(recalc);
        setExpiryIsEstimated(true);
      }
    }
  };

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

    const formattedDate = expirationDate
      ? formatISODate(expirationDate)
      : undefined;

    onSubmit({
      displayName: displayName.trim(),
      quantity: qty,
      unit,
      storageLocation: storageLocation ?? undefined,
      expirationDate: formattedDate,
      expiryIsEstimated: formattedDate ? expiryIsEstimated : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <ScrollView
      className="flex-1 px-7"
      contentContainerClassName="pb-28"
      keyboardShouldPersistTaps="handled"
    >
      {/* Name */}
      <FieldLabel>Item Name</FieldLabel>
      <View className="border-b-2 border-line pb-2.5 mb-5">
        <TextInput
          className="text-[15px] text-espresso"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="e.g., Chicken Breast"
          placeholderTextColor={colors.dust}
        />
      </View>

      {/* Quantity & Unit */}
      <FieldLabel>Quantity</FieldLabel>
      <View className="mb-5">
        <QuantityUnitInput
          quantity={quantity}
          unit={unit}
          onQuantityChange={setQuantity}
          onUnitChange={setUnit}
        />
      </View>

      {/* Storage Location */}
      <FieldLabel>Storage Location</FieldLabel>
      <View className="mb-5">
        <StorageLocationPills
          selected={storageLocation}
          onSelect={handleStorageChange}
        />
      </View>

      {/* Expiration Date */}
      <FieldLabel>Expiration Date</FieldLabel>
      <View className="mb-5">
        <ExpirationDateInput
          date={expirationDate}
          onChange={handleExpirationChange}
        />
      </View>

      {/* Notes */}
      <FieldLabel>Notes</FieldLabel>
      <View className="border-b-2 border-line pb-2.5 mb-6">
        <TextInput
          className="text-[15px] text-espresso min-h-[60px]"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes..."
          placeholderTextColor={colors.dust}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <Button
        label={submitLabel}
        onPress={handleSubmit}
        disabled={isPending}
        className="mb-6"
      />
    </ScrollView>
  );
}
