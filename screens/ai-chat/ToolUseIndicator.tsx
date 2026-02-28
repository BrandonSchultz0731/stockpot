import { View, Text, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import colors from '../../theme/colors';
import { AI_CHAT_TOOL_LABELS } from '../../shared/aiChatTools';

interface ToolUseIndicatorProps {
  name: string;
  done: boolean;
}

export default function ToolUseIndicator({ name, done }: ToolUseIndicatorProps) {
  const label = AI_CHAT_TOOL_LABELS[name as keyof typeof AI_CHAT_TOOL_LABELS] ?? 'Working';

  return (
    <View className="mb-1.5 flex-row items-center rounded-full bg-navy-pale px-3 py-1.5">
      {done ? (
        <Check size={14} color={colors.success.DEFAULT} />
      ) : (
        <ActivityIndicator size="small" color={colors.orange.DEFAULT} />
      )}
      <Text className="ml-1.5 text-xs text-body">{label}...</Text>
    </View>
  );
}
