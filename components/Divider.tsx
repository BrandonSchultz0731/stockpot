import { View } from 'react-native';
import AppText from './AppText';

interface DividerProps {
  className?: string;
}

export default function Divider({ className = '' }: DividerProps) {
  return (
    <View className={`flex-row items-center gap-3 ${className}`}>
      <View className="flex-1 h-px bg-line" />
      <AppText className="text-[11px] font-semibold text-stone">
        OR
      </AppText>
      <View className="flex-1 h-px bg-line" />
    </View>
  );
}
