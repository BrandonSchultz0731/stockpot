import { Text, View } from 'react-native';

interface CategorySectionHeaderProps {
  title: string;
  count: number;
}

export default function CategorySectionHeader({
  title,
  count,
}: CategorySectionHeaderProps) {
  return (
    <View className="pt-4 pb-1.5 px-1">
      <Text className="text-[13px] text-muted font-semibold uppercase tracking-[0.5px]">
        {title}
        {'  '}
        <Text className="text-[12px] text-muted font-normal normal-case tracking-normal">
          {count} {count === 1 ? 'item' : 'items'}
        </Text>
      </Text>
    </View>
  );
}
