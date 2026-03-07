import { Pressable, View } from 'react-native';
import AppText from '../AppText';
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
            className={`px-4 py-2 rounded-full ${
              isSelected
                ? 'bg-espresso'
                : 'bg-cream border border-line'
            }`}
            accessibilityRole="button"
            accessibilityLabel={loc}
            accessibilityState={{ selected: isSelected }}>
            <AppText
              className={`text-[13px] ${
                isSelected ? 'text-white font-semibold' : 'text-espresso'
              }`}>
              {loc}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
