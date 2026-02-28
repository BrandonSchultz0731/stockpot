import { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageSquare, SquarePen } from 'lucide-react-native';
import { useAiChat } from '../hooks/useAiChat';
import ChatMessageList from './ai-chat/ChatMessageList';
import ChatInputBar from './ai-chat/ChatInputBar';
import WelcomeView from './ai-chat/WelcomeView';
import ConversationListSheet from './ai-chat/ConversationListSheet';
import type { AIChefStackParamList } from '../navigation/types';
import colors from '../theme/colors';

type Nav = NativeStackNavigationProp<AIChefStackParamList, 'AIChefChat'>;

export default function AIChefScreen() {
  const navigation = useNavigation<Nav>();
  const [showHistory, setShowHistory] = useState(false);
  const {
    messages,
    conversationId,
    isStreaming,
    conversations,
    isLoadingConversations,
    sendMessage,
    loadConversations,
    loadConversation,
    startNewConversation,
    deleteConversation,
  } = useAiChat();

  const handleShowHistory = useCallback(() => {
    loadConversations();
    setShowHistory(true);
  }, [loadConversations]);

  const handleRecipePress = useCallback(
    (recipeId: string) => {
      navigation.navigate('RecipeDetail', { recipeId });
    },
    [navigation],
  );

  const handleAction = useCallback(
    (action: string, params: Record<string, unknown>) => {
      switch (action) {
        case 'view_recipe':
          if (params.recipeId) {
            navigation.navigate('RecipeDetail', { recipeId: params.recipeId as string });
          }
          break;
        // go_to_pantry and generate_meal_plan would require cross-tab navigation
        // which is complex; for now these are no-ops
      }
    },
    [navigation],
  );

  const hasMessages = messages.length > 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border bg-white px-4 py-3">
          <Pressable
            onPress={handleShowHistory}
            className="h-9 w-9 items-center justify-center rounded-full"
            hitSlop={8}
          >
            <MessageSquare size={20} color={colors.navy.DEFAULT} />
          </Pressable>
          <Text className="text-[17px] font-bold text-navy">AI Chef</Text>
          <Pressable
            onPress={startNewConversation}
            className="h-9 w-9 items-center justify-center rounded-full"
            hitSlop={8}
          >
            <SquarePen size={20} color={colors.navy.DEFAULT} />
          </Pressable>
        </View>

        {/* Chat or Welcome */}
        {hasMessages ? (
          <ChatMessageList
            messages={messages}
            onRecipePress={handleRecipePress}
            onAction={handleAction}
          />
        ) : (
          <WelcomeView onSuggestionPress={sendMessage} />
        )}

        {/* Input */}
        <ChatInputBar onSend={sendMessage} disabled={isStreaming} />

        {/* Conversation History */}
        <ConversationListSheet
          visible={showHistory}
          conversations={conversations}
          isLoading={isLoadingConversations}
          activeConversationId={conversationId}
          onSelect={loadConversation}
          onDelete={deleteConversation}
          onNewChat={startNewConversation}
          onClose={() => setShowHistory(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
