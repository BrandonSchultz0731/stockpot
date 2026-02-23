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
}

export default function TextInputRow({
  icon: Icon,
  right,
  className = '',
  ...inputProps
}: TextInputRowProps) {
  return (
    <View
      className={`flex-row items-center bg-white rounded-input border border-border px-3.5 py-3 gap-2.5 ${className}`}>
      {Icon && <Icon size={18} color={colors.muted} />}
      <TextInput
        className="flex-1 text-sm text-dark p-0"
        placeholderTextColor={colors.muted}
        {...inputProps}
      />
      {right}
    </View>
  );
}
