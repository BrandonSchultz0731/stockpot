import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import colors from '../../theme/colors';
import Button from '../../components/Button';

export interface AddCustomItemSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: { displayName: string; quantity: number; unit: string }) => void;
  isLoading: boolean;
}

export default function AddCustomItemSheet({
  visible,
  onClose,
  onAdd,
  isLoading,
}: AddCustomItemSheetProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('count');

  // Reset state when sheet opens
  useEffect(() => {
    if (visible) {
      setName('');
      setQuantity('1');
      setUnit('count');
    }
  }, [visible]);

  const parsedQuantity = parseFloat(quantity);
  const isValid = name.trim().length > 0 && !isNaN(parsedQuantity) && parsedQuantity > 0;

  const handleAdd = () => {
    if (!isValid) return;
    onAdd({ displayName: name.trim(), quantity: parsedQuantity, unit: unit.trim() || 'count' });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Backdrop */}
        <Pressable className="flex-1 bg-black/40" onPress={onClose} />

        {/* Sheet */}
        <View className="rounded-t-2xl bg-white px-5 pb-8 pt-3">
          {/* Handle bar */}
          <View className="mb-3 items-center">
            <View className="h-1 w-10 rounded-full bg-line" />
          </View>

          {/* Header */}
          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-[20px] font-bold text-espresso">
              Add Custom Item
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              className="h-8 w-8 items-center justify-center rounded-full bg-cream"
            >
              <X size={16} color={colors.stone} />
            </Pressable>
          </View>

          {/* Item Name */}
          <Text className="mb-2 text-[13px] font-semibold text-stone">
            Item Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Paper Towels"
            placeholderTextColor={colors.stone}
            autoCapitalize="words"
            autoFocus
            className="mb-4 rounded-xl border border-line bg-cream px-4 py-3 text-[15px] text-espresso"
          />

          {/* Quantity + Unit row */}
          <View className="mb-4 flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-2 text-[13px] font-semibold text-stone">
                Quantity
              </Text>
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1"
                placeholderTextColor={colors.stone}
                keyboardType="decimal-pad"
                className="rounded-xl border border-line bg-cream px-4 py-3 text-[15px] text-espresso"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-2 text-[13px] font-semibold text-stone">
                Unit
              </Text>
              <TextInput
                value={unit}
                onChangeText={setUnit}
                placeholder="count"
                placeholderTextColor={colors.stone}
                autoCapitalize="none"
                className="rounded-xl border border-line bg-cream px-4 py-3 text-[15px] text-espresso"
              />
            </View>
          </View>

          <Button
            label={isLoading ? 'Adding...' : 'Add Item'}
            onPress={handleAdd}
            disabled={!isValid || isLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
