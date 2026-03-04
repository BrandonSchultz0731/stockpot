import { Pressable } from 'react-native';
import AppText from '../AppText';
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
        selected && isDiet && 'bg-terra',
        selected && !isDiet && 'bg-berry-pale',
        !selected && 'bg-white border border-line',
      )}
      onPress={onPress}>
      <AppText
        className={clsx(
          'text-sm',
          selected && isDiet && 'text-white',
          selected && !isDiet && 'text-berry',
          !selected && 'text-espresso',
          selected ? 'font-semibold' : 'font-normal',
        )}>
        {label}
      </AppText>
      {selected && isDiet && (
        <Check size={14} color="#fff" className="ml-1.5" />
      )}
      {selected && !isDiet && (
        <X size={14} color={colors.berry.DEFAULT} className="ml-1.5" />
      )}
    </Pressable>
  );
}
