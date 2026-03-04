import { ActivityIndicator, Pressable, View } from 'react-native';
import AppText from './AppText';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import colors from '../theme/colors';
import { fonts } from '../theme/typography';

interface ScreenHeaderProps {
  /** Primary title displayed beside the back button */
  title?: string;
  /** Smaller subtitle shown below the title */
  subtitle?: string;
  /** Override the default `navigation.goBack()` behaviour */
  onBack?: () => void;
  /** Arbitrary element rendered on the trailing side (icon, save button, etc.) */
  rightAction?: React.ReactNode;
  /** Shorthand: renders a terra "Save" text button on the right */
  onSave?: () => void;
  /** When true, replaces the Save text with a spinner */
  isSaving?: boolean;
  /** When true the title is centred between back and right action (edit-screen style) */
  centerTitle?: boolean;
}

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  onSave,
  isSaving,
  centerTitle = false,
}: ScreenHeaderProps) {
  const navigation = useNavigation();

  const handleBack = onBack ?? (() => navigation.goBack());

  const saveElement = onSave ? (
    <Pressable onPress={onSave} disabled={isSaving} hitSlop={12}>
      {isSaving ? (
        <ActivityIndicator size="small" color={colors.terra.DEFAULT} />
      ) : (
        <AppText className="text-[15px] font-semibold text-terra">Save</AppText>
      )}
    </Pressable>
  ) : null;

  const trailing = rightAction ?? saveElement;

  if (centerTitle) {
    return (
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable onPress={handleBack} hitSlop={12}>
          <ChevronLeft size={24} color={colors.espresso} />
        </Pressable>
        {title ? (
          <AppText
            className="text-[18px] font-bold text-espresso"
            style={{ fontFamily: fonts.serif }}
          >
            {title}
          </AppText>
        ) : (
          <View />
        )}
        {trailing ?? <View className="w-6" />}
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-between px-5 py-3">
      <View className="flex-row items-center flex-1">
        <Pressable onPress={handleBack} hitSlop={8}>
          <ChevronLeft size={22} color={colors.espresso} />
        </Pressable>
        {title ? (
          <View className="ml-3 flex-1">
            <AppText
              className="text-[18px] font-bold text-espresso"
              style={{ fontFamily: fonts.serif }}
            >
              {title}
            </AppText>
            {subtitle ? (
              <AppText className="text-[13px] text-stone" numberOfLines={1}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}
