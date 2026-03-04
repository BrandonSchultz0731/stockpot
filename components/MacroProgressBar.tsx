import { View } from 'react-native';
import AppText from './AppText';
import colors from '../theme/colors';

interface MacroProgressBarProps {
  label: string;
  displayValue: string;
  /** 0-1 fraction representing how full the bar is */
  progress: number;
  /** Bar colour — defaults to terra */
  color?: string;
}

export default function MacroProgressBar({
  label,
  displayValue,
  progress,
  color = colors.terra.DEFAULT,
}: MacroProgressBarProps) {
  const pct = Math.min(progress * 100, 100);

  return (
    <View className={'mb-3'}>
      <View className="flex-row justify-between mb-1">
        <AppText className="text-[13px] text-ink">{label}</AppText>
        <AppText className="text-[13px] font-semibold text-espresso">
          {displayValue}
        </AppText>
      </View>
      <View className="overflow-hidden bg-line-light" style={{ height: 4, borderRadius: 2 }}>
        <View
          style={{ width: `${pct}%`, height: 4, borderRadius: 2, backgroundColor: color }}
        />
      </View>
    </View>
  );
}
