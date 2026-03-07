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
      <View className="flex-1 bg-white rounded-input border border-line px-3.5 py-3">
        <TextInput
          className="text-[14px] leading-[18px] text-espresso"
          value={quantity}
          onChangeText={onQuantityChange}
          placeholder="Qty"
          placeholderTextColor={colors.stone}
          keyboardType="decimal-pad"
          accessibilityLabel="Quantity"
        />
      </View>

      <Pressable
        onPress={() => setShowPicker(true)}
        className="flex-1 flex-row items-center justify-between bg-white rounded-input border border-line px-3.5 py-3"
        accessibilityRole="button"
        accessibilityLabel={`Unit: ${unit}`}>
        <Text className="text-[14px] text-espresso">{unit}</Text>
        <ChevronDown size={16} color={colors.stone} />
      </Pressable>

      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setShowPicker(false)}
          accessibilityRole="button"
          accessibilityLabel="Close unit picker"
        />
        <View className="bg-white rounded-t-2xl pb-8 max-h-[50%]">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-line">
            <Text
              className="text-[16px] text-espresso font-bold">
              Select Unit
            </Text>
            <Pressable onPress={() => setShowPicker(false)} accessibilityRole="button" accessibilityLabel="Done">
              <Text className="text-[14px] text-terra font-semibold">
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
                className={`px-4 py-3 border-b border-line ${
                  item === unit ? 'bg-terra-pale' : ''
                }`}
                accessibilityRole="radio"
                accessibilityLabel={item}
                accessibilityState={{ selected: item === unit }}>
                <Text
                  className={`text-[14px] ${
                    item === unit
                      ? 'text-terra font-semibold'
                      : 'text-espresso'
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
