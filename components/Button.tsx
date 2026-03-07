import React from 'react';
import { Pressable, View } from 'react-native';
import AppText from './AppText';
import { fonts } from '../theme/typography';

type ButtonVariant = 'primary' | 'outline' | 'dark';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
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
  labelClassName = '',
  icon,
  serif = false,
}: ButtonProps) {
  const v = variantStyles[variant];

  return (
    <Pressable
      className={`flex-row items-center justify-center rounded-button ${v.container} ${disabled ? 'opacity-50' : ''} ${className}`}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}>
      {icon && <View className="mr-2">{icon}</View>}
      <AppText
        className={`${v.text} ${labelClassName}`}
        style={serif ? { fontFamily: fonts.serif } : undefined}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
