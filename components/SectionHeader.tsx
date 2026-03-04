import { Pressable, Text, View } from 'react-native';
import { fonts } from '../theme/typography';

interface SectionHeaderProps {
  title: string;
  /** Optional badge text rendered in a terra pill */
  badge?: string;
  /** Optional right-side action link (e.g. "View all") */
  rightAction?: { label: string; onPress: () => void };
  className?: string;
}

export default function SectionHeader({
  title,
  badge,
  rightAction,
  className,
}: SectionHeaderProps) {
  return (
    <View
      className={`mt-3 mb-1.5 flex-row items-center justify-between ${className ?? ''}`}
    >
      <Text
        className="text-[18px] font-bold text-espresso"
        style={{ fontFamily: fonts.serif }}
      >
        {title}
      </Text>
      {badge ? (
        <View className="rounded-full bg-terra-pale px-2 py-0.5">
          <Text className="text-[10px] font-bold text-terra">{badge}</Text>
        </View>
      ) : null}
      {rightAction ? (
        <Pressable onPress={rightAction.onPress} hitSlop={8}>
          <Text className="text-xs font-semibold text-terra">
            {rightAction.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
