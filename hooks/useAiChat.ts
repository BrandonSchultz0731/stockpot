import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { createSSEStream } from '../services/sseClient';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import type { RichBlock } from '../shared/richBlocks';

export type { RichBlock };

export interface ToolUseStatus {
  id: string;
  name: string;
  done: boolean;
  resultSummary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  richBlocks?: RichBlock[];
  toolUses?: ToolUseStatus[];
  isStreaming?: boolean;
}

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const closeRef = useRef<(() => void) | null>(null);
  const queryClient = useQueryClient();

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const data = await api.get<Conversation[]>(ROUTES.AI_CHAT.CONVERSATIONS);
      setConversations(data);
    } catch {
      // Silently fail
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const loadConversation = useCallback(async (convId: string) => {
    try {
      const data = await api.get<
        { id: string; role: string; content: string; richBlocks: RichBlock[] | null; createdAt: string }[]
      >(ROUTES.AI_CHAT.CONVERSATION_MESSAGES(convId));

      const loaded: ChatMessage[] = data
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          richBlocks: m.richBlocks ?? undefined,
        }));

      setMessages(loaded);
      setConversationId(convId);
    } catch {
      // Handle error silently
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  const deleteConversation = useCallback(
    async (convId: string) => {
      try {
        await api.delete(ROUTES.AI_CHAT.DELETE_CONVERSATION(convId));
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (conversationId === convId) {
          startNewConversation();
        }
      } catch {
        // Handle error silently
      }
    },
    [conversationId, startNewConversation],
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (isStreaming || !text.trim()) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
      };

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        isStreaming: true,
        toolUses: [],
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const cleanup = createSSEStream(
        ROUTES.AI_CHAT.MESSAGES,
        {
          message: text.trim(),
          ...(conversationId ? { conversationId } : {}),
        },
        {
          onConversation: (data) => {
            setConversationId(data.id);
          },
          onTextDelta: (data) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + data.delta,
                };
              }
              return updated;
            });
          },
          onToolUseStart: (data) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  toolUses: [
                    ...(last.toolUses ?? []),
                    { id: data.id, name: data.name, done: false },
                  ],
                };
              }
              return updated;
            });
          },
          onToolUseResult: (data) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant' && last.toolUses) {
                updated[updated.length - 1] = {
                  ...last,
                  toolUses: last.toolUses.map((tu) =>
                    tu.id === data.id
                      ? { ...tu, done: true, resultSummary: data.resultSummary }
                      : tu,
                  ),
                };
              }
              return updated;
            });
          },
          onMessageComplete: (data) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  id: data.messageId,
                  content: data.content,
                  richBlocks: data.richBlocks?.length
                    ? (data.richBlocks as RichBlock[])
                    : undefined,
                  isStreaming: false,
                };
              }
              return updated;
            });
            setIsStreaming(false);
            // Invalidate conversations list to pick up new title
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AI_CHAT.CONVERSATIONS });
          },
          onError: (data) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content || `Sorry, something went wrong: ${data.message}`,
                  isStreaming: false,
                };
              }
              return updated;
            });
            setIsStreaming(false);
          },
          onClose: () => {
            setIsStreaming(false);
            closeRef.current = null;
          },
        },
      );

      closeRef.current = cleanup;
    },
    [isStreaming, conversationId, queryClient],
  );

  const cancelStream = useCallback(() => {
    closeRef.current?.();
    closeRef.current = null;
    setIsStreaming(false);
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.role === 'assistant' && last.isStreaming) {
        updated[updated.length - 1] = { ...last, isStreaming: false };
      }
      return updated;
    });
  }, []);

  return {
    messages,
    conversationId,
    isStreaming,
    conversations,
    isLoadingConversations,
    sendMessage,
    cancelStream,
    loadConversations,
    loadConversation,
    startNewConversation,
    deleteConversation,
  };
}
