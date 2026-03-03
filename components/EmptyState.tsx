import { Pressable, Text, View } from 'react-native';

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
      <Text className="text-[17px] text-navy mt-4 mb-2 font-bold">
        {title}
      </Text>
      {description ? (
        <Text className="text-[14px] text-muted text-center px-8">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <Text className="text-[14px] text-orange font-semibold">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
