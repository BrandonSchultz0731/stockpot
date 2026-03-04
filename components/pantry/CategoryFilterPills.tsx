import { Pressable, ScrollView } from 'react-native';
import AppText from '../AppText';

interface CategoryFilterPillsProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
  counts: Map<string, number>;
  totalCount: number;
}

export default function CategoryFilterPills({
  categories,
  selected,
  onSelect,
  counts,
  totalCount,
}: CategoryFilterPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-5">
      <Pill
        label={`All (${totalCount})`}
        active={selected === null}
        onPress={() => onSelect(null)}
      />
      {categories.map(cat => (
        <Pill
          key={cat}
          label={`${cat} (${counts.get(cat) ?? 0})`}
          active={selected === cat}
          onPress={() => onSelect(cat)}
        />
      ))}
    </ScrollView>
  );
}

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 ${
        active
          ? 'bg-espresso'
          : 'bg-cream border border-line'
      }`}>
      <AppText
        className={`text-[13px] ${
          active ? 'text-white font-semibold' : 'text-espresso'
        }`}>
        {label}
      </AppText>
    </Pressable>
  );
}
