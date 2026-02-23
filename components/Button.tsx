import { Pressable, Text } from 'react-native';

type ButtonVariant = 'primary' | 'outline' | 'dark';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  className?: string;
}

const variantStyles: Record<
  ButtonVariant,
  { container: string; text: string; weight: '600' | '700' }
> = {
  primary: {
    container: 'bg-orange py-3.5',
    text: 'text-[15px] text-white',
    weight: '700',
  },
  outline: {
    container: 'bg-white border border-border py-3',
    text: 'text-sm text-dark',
    weight: '600',
  },
  dark: {
    container: 'bg-dark py-3',
    text: 'text-sm text-white',
    weight: '600',
  },
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  className = '',
}: ButtonProps) {
  const v = variantStyles[variant];

  return (
    <Pressable
      className={`flex-row items-center justify-center rounded-button ${v.container} ${className}`}
      onPress={onPress}>
      <Text className={v.text} style={{ fontWeight: v.weight }}>
        {label}
      </Text>
    </Pressable>
  );
}
