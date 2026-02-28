import { useRef, useEffect } from 'react';
import { FlatList, View } from 'react-native';
import ChatBubble from './ChatBubble';
import type { ChatMessage } from '../../hooks/useAiChat';

interface ChatMessageListProps {
  messages: ChatMessage[];
  onRecipePress?: (recipeId: string) => void;
  onAction?: (action: string, params: Record<string, unknown>) => void;
}

export default function ChatMessageList({
  messages,
  onRecipePress,
  onAction,
}: ChatMessageListProps) {
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      // Delay to allow layout to complete
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, messages[messages.length - 1]?.content]);

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ChatBubble
          message={item}
          onRecipePress={onRecipePress}
          onAction={onAction}
        />
      )}
      contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    />
  );
}
