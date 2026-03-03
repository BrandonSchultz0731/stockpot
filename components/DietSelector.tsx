import { View } from 'react-native';
import PillButton from './onboarding/PillButton';
import { DietaryPreference } from '../shared/enums';

const ALL_DIETS = Object.values(DietaryPreference);

interface DietSelectorProps {
  selectedDiets: DietaryPreference[];
  onToggle: (diet: DietaryPreference) => void;
  className?: string;
}

export default function DietSelector({
  selectedDiets,
  onToggle,
  className,
}: DietSelectorProps) {
  return (
    <View className={`flex-row flex-wrap ${className ?? ''}`}>
      {ALL_DIETS.map(diet => (
        <PillButton
          key={diet}
          label={diet}
          selected={selectedDiets.includes(diet)}
          onPress={() => onToggle(diet)}
          variant="diet"
        />
      ))}
    </View>
  );
}
