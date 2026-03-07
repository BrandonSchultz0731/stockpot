import { Pressable, View } from 'react-native';
import AppText from '../AppText';
import { Check } from 'lucide-react-native';
import clsx from 'clsx';

interface SelectableCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

export default function SelectableCard({
  title,
  description,
  selected,
  onPress,
}: SelectableCardProps) {
  return (
    <Pressable
      className={clsx(
        'flex-row items-center rounded-2xl px-4 py-4 mb-3 border',
        selected ? 'bg-terra-pale border-terra' : 'bg-white border-line',
      )}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected }}>
      <View className="flex-1">
        <AppText className="text-[15px] font-semibold text-espresso">
          {title}
        </AppText>
        {description ? (
          <AppText className="text-sm text-stone mt-0.5">{description}</AppText>
        ) : null}
      </View>
      {selected && (
        <View className="w-6 h-6 rounded-full bg-terra items-center justify-center ml-3">
          <Check size={14} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}
