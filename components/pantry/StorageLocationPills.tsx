import { Pressable, Text, View } from 'react-native';
import { StorageLocation } from '../../shared/enums';

interface StorageLocationPillsProps {
  selected: StorageLocation | null;
  onSelect: (location: StorageLocation) => void;
}

const LOCATIONS = Object.values(StorageLocation);

export default function StorageLocationPills({
  selected,
  onSelect,
}: StorageLocationPillsProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {LOCATIONS.map(loc => {
        const isSelected = selected === loc;
        return (
          <Pressable
            key={loc}
            onPress={() => onSelect(loc)}
            className={`px-4 py-2 rounded-full border ${
              isSelected
                ? 'bg-orange-pale border-orange'
                : 'bg-white border-border'
            }`}>
            <Text
              className={`text-[13px] ${
                isSelected ? 'text-orange font-semibold' : 'text-dark'
              }`}>
              {loc}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
