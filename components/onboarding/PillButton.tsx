import { Pressable, Text } from 'react-native';
import { Check, X } from 'lucide-react-native';
import colors from '../../theme/colors';

interface PillButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: 'diet' | 'exclude';
}

export default function PillButton({
  label,
  selected,
  onPress,
  variant = 'diet',
}: PillButtonProps) {
  const isDiet = variant === 'diet';

  const containerClass = selected
    ? isDiet
      ? 'bg-navy flex-row items-center rounded-full px-4 py-2.5 mr-2 mb-2'
      : 'bg-danger-pale flex-row items-center rounded-full px-4 py-2.5 mr-2 mb-2'
    : 'bg-white border border-border flex-row items-center rounded-full px-4 py-2.5 mr-2 mb-2';

  const textClass = selected
    ? isDiet
      ? 'text-sm text-white'
      : 'text-sm text-danger'
    : 'text-sm text-dark';

  return (
    <Pressable className={containerClass} onPress={onPress}>
      <Text className={textClass} style={{ fontWeight: selected ? '600' : '400' }}>
        {label}
      </Text>
      {selected && isDiet && (
        <Check size={14} color="#fff" style={{ marginLeft: 6 }} />
      )}
      {selected && !isDiet && (
        <X size={14} color={colors.danger.DEFAULT} style={{ marginLeft: 6 }} />
      )}
    </Pressable>
  );
}
