import EventSource from 'react-native-sse';
import API_BASE_URL from '../config';
import { getAccessToken } from './api';

type AiChatEvent =
  | 'conversation'
  | 'text_delta'
  | 'tool_use_start'
  | 'tool_use_result'
  | 'message_complete';

export interface SSECallbacks {
  onConversation?: (data: { id: string; title: string | null }) => void;
  onTextDelta?: (data: { delta: string }) => void;
  onToolUseStart?: (data: { id: string; name: string }) => void;
  onToolUseResult?: (data: { id: string; name: string; resultSummary: string }) => void;
  onMessageComplete?: (data: {
    messageId: string;
    content: string;
    richBlocks: { type: string; data: Record<string, unknown> }[];
  }) => void;
  onError?: (data: { message: string }) => void;
  onClose?: () => void;
}

export function createSSEStream(
  path: string,
  body: Record<string, unknown>,
  callbacks: SSECallbacks,
): () => void {
  const url = `${API_BASE_URL}${path}`;
  const token = getAccessToken();

  const es = new EventSource<AiChatEvent>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  es.addEventListener('conversation', (event) => {
    if (event.data) {
      callbacks.onConversation?.(JSON.parse(event.data));
    }
  });

  es.addEventListener('text_delta', (event) => {
    if (event.data) {
      callbacks.onTextDelta?.(JSON.parse(event.data));
    }
  });

  es.addEventListener('tool_use_start', (event) => {
    if (event.data) {
      callbacks.onToolUseStart?.(JSON.parse(event.data));
    }
  });

  es.addEventListener('tool_use_result', (event) => {
    if (event.data) {
      callbacks.onToolUseResult?.(JSON.parse(event.data));
    }
  });

  es.addEventListener('message_complete', (event) => {
    if (event.data) {
      callbacks.onMessageComplete?.(JSON.parse(event.data));
    }
    // Stream is done after message_complete
    es.close();
    callbacks.onClose?.();
  });

  es.addEventListener('error', (event: any) => {
    if (event.data) {
      try {
        callbacks.onError?.(JSON.parse(event.data));
      } catch {
        callbacks.onError?.({ message: 'Connection error' });
      }
    } else {
      callbacks.onError?.({ message: 'Connection error' });
    }
    es.close();
    callbacks.onClose?.();
  });

  return () => {
    es.close();
  };
}
