import { Pressable, Text } from 'react-native';
import { Check, X } from 'lucide-react-native';
import clsx from 'clsx';
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

  return (
    <Pressable
      className={clsx(
        'flex-row items-center rounded-full px-4 py-2.5 mr-2 mb-2',
        selected && isDiet && 'bg-navy',
        selected && !isDiet && 'bg-danger-pale',
        !selected && 'bg-white border border-border',
      )}
      onPress={onPress}>
      <Text
        className={clsx(
          'text-sm',
          selected && isDiet && 'text-white',
          selected && !isDiet && 'text-danger',
          !selected && 'text-dark',
        )}
        style={{ fontWeight: selected ? '600' : '400' }}>
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
