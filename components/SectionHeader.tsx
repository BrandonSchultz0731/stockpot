import { Text, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
  /** Optional badge text rendered in an orange pill */
  badge?: string;
  className?: string;
}

export default function SectionHeader({
  title,
  badge,
  className,
}: SectionHeaderProps) {
  return (
    <View
      className={`mt-3 mb-1.5 flex-row items-center justify-between ${className ?? ''}`}
    >
      <Text className="text-[13px] font-bold uppercase tracking-[0.5px] text-navy">
        {title}
      </Text>
      {badge ? (
        <View className="rounded-full bg-orange-pale px-2 py-0.5">
          <Text className="text-[10px] font-bold text-orange">{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}
