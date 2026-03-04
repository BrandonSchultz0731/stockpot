import { Pressable, View } from 'react-native';
import AppText from './AppText';
import { fonts } from '../theme/typography';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center pt-20">
      {icon}
      <AppText
        className="text-[17px] text-espresso mt-4 mb-2 font-bold"
        style={{ fontFamily: fonts.serif }}
      >
        {title}
      </AppText>
      {description ? (
        <AppText className="text-[14px] text-stone text-center px-8">
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <AppText className="text-[14px] text-terra font-semibold">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
