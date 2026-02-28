import { useRef, useEffect, useMemo } from 'react';
import { FlatList } from 'react-native';
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
  const lastMessageContent = useMemo(
    () => messages[messages.length - 1]?.content,
    [messages],
  );

  useEffect(() => {
    if (messages.length > 0) {
      // Delay to allow layout to complete
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, lastMessageContent]);

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
      contentContainerClassName="p-4 pb-2"
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    />
  );
}
