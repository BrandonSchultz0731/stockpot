import { Text, View } from 'react-native';

interface DividerProps {
  className?: string;
}

export default function Divider({ className = '' }: DividerProps) {
  return (
    <View className={`flex-row items-center gap-3 ${className}`}>
      <View className="flex-1 h-px bg-border" />
      <Text className="text-[11px] font-semibold text-muted">
        OR
      </Text>
      <View className="flex-1 h-px bg-border" />
    </View>
  );
}
