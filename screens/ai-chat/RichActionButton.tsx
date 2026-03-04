import { Pressable } from 'react-native';
import AppText from '../../components/AppText';
import colors from '../../theme/colors';

interface RichActionButtonProps {
  data: {
    label?: string;
    action?: string;
    recipeId?: string;
  };
  onAction?: (action: string, params: Record<string, unknown>) => void;
}

export default function RichActionButton({ data, onAction }: RichActionButtonProps) {
  const { label, action, ...params } = data;

  return (
    <Pressable
      onPress={() => action && onAction?.(action, params)}
      className="my-1 self-start rounded-full bg-terra-pale px-4 py-2"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <AppText className="text-sm font-semibold" style={{ color: colors.terra.DEFAULT }}>
        {label ?? 'Action'}
      </AppText>
    </Pressable>
  );
}
