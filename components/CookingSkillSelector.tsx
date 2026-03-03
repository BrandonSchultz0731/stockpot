import { View } from 'react-native';
import SelectableCard from './onboarding/SelectableCard';
import { CookingSkill, COOKING_SKILL_DESCRIPTIONS } from '../shared/enums';

interface CookingSkillSelectorProps {
  selectedSkill: CookingSkill;
  onSelect: (skill: CookingSkill) => void;
}

export default function CookingSkillSelector({
  selectedSkill,
  onSelect,
}: CookingSkillSelectorProps) {
  return (
    <View>
      {Object.values(CookingSkill).map(skill => (
        <SelectableCard
          key={skill}
          title={skill}
          description={COOKING_SKILL_DESCRIPTIONS[skill]}
          selected={selectedSkill === skill}
          onPress={() => onSelect(skill)}
        />
      ))}
    </View>
  );
}
