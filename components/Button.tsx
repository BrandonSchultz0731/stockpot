import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { fonts } from '../theme/typography';

type ButtonVariant = 'primary' | 'outline' | 'dark';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  serif?: boolean;
}

const variantStyles: Record<
  ButtonVariant,
  { container: string; text: string }
> = {
  primary: {
    container: 'bg-terra py-3.5',
    text: 'text-[15px] font-bold text-white',
  },
  outline: {
    container: 'bg-white border border-line py-3',
    text: 'text-sm font-semibold text-espresso',
  },
  dark: {
    container: 'bg-espresso py-3',
    text: 'text-sm font-semibold text-white',
  },
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  className = '',
  icon,
  serif = false,
}: ButtonProps) {
  const v = variantStyles[variant];

  return (
    <Pressable
      className={`flex-row items-center justify-center rounded-button ${v.container} ${disabled ? 'opacity-50' : ''} ${className}`}
      disabled={disabled}
      onPress={onPress}>
      {icon && <View className="mr-2">{icon}</View>}
      <Text
        className={v.text}
        style={serif ? { fontFamily: fonts.serif } : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}
