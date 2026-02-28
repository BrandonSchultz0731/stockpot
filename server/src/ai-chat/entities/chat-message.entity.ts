import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('chat_messages')
@Index(['conversationId'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'conversation_id' })
  conversationId: string;

  @Column({ type: 'varchar', length: 20 })
  role: 'user' | 'assistant' | 'tool_result';

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', name: 'tool_calls', nullable: true })
  toolCalls: { id: string; name: string; input: Record<string, unknown> }[] | null;

  @Column({ type: 'jsonb', name: 'rich_blocks', nullable: true })
  richBlocks: { type: string; data: Record<string, unknown> }[] | null;

  @Column({ type: 'int', name: 'token_count', default: 0 })
  tokenCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Conversation, (conv) => conv.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;
}
