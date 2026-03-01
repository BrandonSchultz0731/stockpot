import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { UnitOfMeasure } from '../../shared/enums';
import colors from '../../theme/colors';

interface QuantityUnitInputProps {
  quantity: string;
  unit: UnitOfMeasure;
  onQuantityChange: (value: string) => void;
  onUnitChange: (unit: UnitOfMeasure) => void;
}

const ALL_UNITS = Object.values(UnitOfMeasure);

export default function QuantityUnitInput({
  quantity,
  unit,
  onQuantityChange,
  onUnitChange,
}: QuantityUnitInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View className="flex-row gap-2">
      <View className="flex-1 bg-white rounded-input border border-border px-3.5 py-3">
        <TextInput
          className="text-[14px] leading-[18px] text-dark"
          value={quantity}
          onChangeText={onQuantityChange}
          placeholder="Qty"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
        />
      </View>

      <Pressable
        onPress={() => setShowPicker(true)}
        className="flex-1 flex-row items-center justify-between bg-white rounded-input border border-border px-3.5 py-3">
        <Text className="text-[14px] text-dark">{unit}</Text>
        <ChevronDown size={16} color={colors.muted} />
      </Pressable>

      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setShowPicker(false)}
        />
        <View className="bg-white rounded-t-2xl pb-8 max-h-[50%]">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Text
              className="text-[16px] text-navy font-bold">
              Select Unit
            </Text>
            <Pressable onPress={() => setShowPicker(false)}>
              <Text className="text-[14px] text-orange font-semibold">
                Done
              </Text>
            </Pressable>
          </View>
          <FlatList
            data={ALL_UNITS}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onUnitChange(item);
                  setShowPicker(false);
                }}
                className={`px-4 py-3 border-b border-border ${
                  item === unit ? 'bg-orange-pale' : ''
                }`}>
                <Text
                  className={`text-[14px] ${
                    item === unit
                      ? 'text-orange font-semibold'
                      : 'text-dark'
                  }`}>
                  {item}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}
