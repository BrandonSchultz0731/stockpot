import { View } from 'react-native';
import PillButton from './onboarding/PillButton';
import { EXCLUDED_INGREDIENT_SUGGESTIONS } from '../shared/enums';

interface ExcludedIngredientsSelectorProps {
  selectedIngredients: string[];
  onToggle: (ingredient: string) => void;
  className?: string;
}

export default function ExcludedIngredientsSelector({
  selectedIngredients,
  onToggle,
  className,
}: ExcludedIngredientsSelectorProps) {
  return (
    <View className={`flex-row flex-wrap ${className ?? ''}`}>
      {EXCLUDED_INGREDIENT_SUGGESTIONS.map(ingredient => (
        <PillButton
          key={ingredient}
          label={ingredient}
          selected={selectedIngredients.includes(ingredient)}
          onPress={() => onToggle(ingredient)}
          variant="exclude"
        />
      ))}
    </View>
  );
}
