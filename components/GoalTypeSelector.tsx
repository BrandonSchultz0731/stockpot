import { View } from 'react-native';
import SelectableCard from './onboarding/SelectableCard';
import { GoalType, GOAL_EMOJIS } from '../shared/enums';

interface GoalTypeSelectorProps {
  selectedGoal: GoalType;
  onSelect: (goal: GoalType) => void;
}

export default function GoalTypeSelector({
  selectedGoal,
  onSelect,
}: GoalTypeSelectorProps) {
  return (
    <View>
      {Object.values(GoalType).map(goal => (
        <SelectableCard
          key={goal}
          title={`${GOAL_EMOJIS[goal]}  ${goal}`}
          selected={selectedGoal === goal}
          onPress={() => onSelect(goal)}
        />
      ))}
    </View>
  );
}
