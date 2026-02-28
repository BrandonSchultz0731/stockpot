import { RichBlock } from '@shared/richBlocks';

export type { RichBlock } from '@shared/richBlocks';

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface SSEConversationEvent {
  id: string;
  title: string | null;
}

export interface SSETextDeltaEvent {
  delta: string;
}

export interface SSEToolUseStartEvent {
  id: string;
  name: string;
}

export interface SSEToolUseResultEvent {
  id: string;
  name: string;
  resultSummary: string;
}

export interface SSEMessageCompleteEvent {
  messageId: string;
  content: string;
  richBlocks: RichBlock[];
}

export interface SSEErrorEvent {
  message: string;
}
