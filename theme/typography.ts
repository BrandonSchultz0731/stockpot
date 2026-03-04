import { Platform } from 'react-native';

/**
 * Custom font families for the Warm Editorial design system.
 *
 * NativeWind cannot apply custom fontFamily via className,
 * so these are used via `style={{ fontFamily: fonts.serif }}`.
 */
export const fonts = {
  /** Fraunces — display serif for headings */
  serif: Platform.select({
    ios: 'Fraunces-Bold',
    android: 'Fraunces-Bold',
  })!,
  serifHeavy: Platform.select({
    ios: 'Fraunces-ExtraBold',
    android: 'Fraunces-ExtraBold',
  })!,
  /** Plus Jakarta Sans — body sans-serif */
  sans: Platform.select({
    ios: 'PlusJakartaSans-Regular',
    android: 'PlusJakartaSans-Regular',
  })!,
  sansMedium: Platform.select({
    ios: 'PlusJakartaSans-Medium',
    android: 'PlusJakartaSans-Medium',
  })!,
  sansSemiBold: Platform.select({
    ios: 'PlusJakartaSans-SemiBold',
    android: 'PlusJakartaSans-SemiBold',
  })!,
  sansBold: Platform.select({
    ios: 'PlusJakartaSans-Bold',
    android: 'PlusJakartaSans-Bold',
  })!,
};
