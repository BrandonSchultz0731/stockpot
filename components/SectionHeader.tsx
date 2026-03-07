import { Pressable, View } from 'react-native';
import AppText from './AppText';
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
      <AppText
        className="text-[18px] font-bold text-espresso"
        style={{ fontFamily: fonts.serif }}
      >
        {title}
      </AppText>
      {badge ? (
        <View className="rounded-full bg-terra-pale px-2 py-0.5">
          <AppText className="text-[10px] font-bold text-terra">{badge}</AppText>
        </View>
      ) : null}
      {rightAction ? (
        <Pressable onPress={rightAction.onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={rightAction.label}>
          <AppText className="text-xs font-semibold text-terra">
            {rightAction.label}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
