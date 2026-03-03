import { Text, View } from 'react-native';
import colors from '../theme/colors';

interface MacroProgressBarProps {
  label: string;
  displayValue: string;
  /** 0-1 fraction representing how full the bar is */
  progress: number;
  /** Bar colour — defaults to orange */
  color?: string;
}

export default function MacroProgressBar({
  label,
  displayValue,
  progress,
  color = colors.orange.DEFAULT,
}: MacroProgressBarProps) {
  const pct = Math.min(progress * 100, 100);

  return (
    <View className={'mb-3'}>
      <View className="flex-row justify-between mb-1">
        <Text className="text-[13px] text-body">{label}</Text>
        <Text className="text-[13px] font-semibold text-dark">
          {displayValue}
        </Text>
      </View>
      <View className="h-1.5 rounded-full bg-border overflow-hidden">
        <View
          className="h-1.5 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}
