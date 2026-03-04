import { Text, type TextProps } from 'react-native';
import { fonts } from '../theme/typography';

type FontVariant = keyof typeof fonts;

interface AppTextProps extends TextProps {
  /** Font variant — defaults to sans (Plus Jakarta Sans Regular) */
  font?: FontVariant;
}

/**
 * Text component that automatically applies custom fontFamily.
 *
 * NativeWind cannot set fontFamily via className, so this component
 * wraps RN Text to handle it via a simple `font` prop.
 *
 * Usage:
 *   <AppText font="serif" className="text-[18px] text-espresso">Heading</AppText>
 *   <AppText font="sansBold" className="text-[11px] text-ink">Label</AppText>
 *   <AppText className="text-sm text-stone">Body text (default sans)</AppText>
 */
export default function AppText({ font = 'sans', style, ...props }: AppTextProps) {
  return <Text style={[{ fontFamily: fonts[font] }, style]} {...props} />;
}
