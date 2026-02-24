import { Pressable, Text, View } from 'react-native';
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
        selected ? 'bg-orange-pale border-orange' : 'bg-white border-border',
      )}
      onPress={onPress}>
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-dark">
          {title}
        </Text>
        {description ? (
          <Text className="text-sm text-muted mt-0.5">{description}</Text>
        ) : null}
      </View>
      {selected && (
        <View className="w-6 h-6 rounded-full bg-orange items-center justify-center ml-3">
          <Check size={14} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}
