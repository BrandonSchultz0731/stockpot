import React from 'react';
import { Pressable, Text, View } from 'react-native';

type ButtonVariant = 'primary' | 'outline' | 'dark';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const variantStyles: Record<
  ButtonVariant,
  { container: string; text: string }
> = {
  primary: {
    container: 'bg-orange py-3.5',
    text: 'text-[15px] font-bold text-white',
  },
  outline: {
    container: 'bg-white border border-border py-3',
    text: 'text-sm font-semibold text-dark',
  },
  dark: {
    container: 'bg-dark py-3',
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
}: ButtonProps) {
  const v = variantStyles[variant];

  return (
    <Pressable
      className={`flex-row items-center justify-center rounded-button ${v.container} ${disabled ? 'opacity-50' : ''} ${className}`}
      disabled={disabled}
      onPress={onPress}>
      {icon && <View className="mr-2">{icon}</View>}
      <Text className={v.text}>
        {label}
      </Text>
    </Pressable>
  );
}
