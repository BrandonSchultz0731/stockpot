import { type ComponentType, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import colors from '../theme/colors';

interface TextInputRowProps
  extends Pick<
    TextInputProps,
    | 'value'
    | 'onChangeText'
    | 'placeholder'
    | 'keyboardType'
    | 'autoCapitalize'
    | 'autoCorrect'
    | 'secureTextEntry'
  > {
  icon?: ComponentType<{ size: number; color: string }>;
  right?: ReactNode;
  className?: string;
  /** 'default' bordered box or 'underline' bottom-border-only style */
  variant?: 'default' | 'underline';
}

export default function TextInputRow({
  icon: Icon,
  right,
  className = '',
  variant = 'default',
  ...inputProps
}: TextInputRowProps) {
  const isUnderline = variant === 'underline';

  return (
    <View
      className={`flex-row items-center gap-2.5 ${
        isUnderline
          ? 'border-b border-line bg-transparent px-1 py-3'
          : 'bg-white rounded-input border border-line px-3.5 py-3'
      } ${className}`}>
      {Icon && <Icon size={18} color={colors.stone} />}
      <TextInput
        className="flex-1 text-[14px] leading-[18px] text-espresso"
        placeholderTextColor={colors.stone}
        {...inputProps}
      />
      {right}
    </View>
  );
}
