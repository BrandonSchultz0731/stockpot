import { Platform, type ViewStyle } from 'react-native';

/** Subtle card shadow for cards */
export const cardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#1C1512',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: {
    elevation: 2,
  },
})!;

/** Elevated floating shadow — tab bar, FABs, modals */
export const floatingShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#1C1512',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  android: {
    elevation: 8,
  },
})!;
