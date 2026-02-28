import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { Subject } from 'rxjs';
import { Conversation } from './entities/conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { AnthropicService } from '../anthropic/anthropic.service';
import { UsageTrackingService } from '../usage-tracking/usage-tracking.service';
import { AiChatToolsService } from './ai-chat-tools.service';
import { AI_CHAT_TOOLS } from './ai-chat-tools.definitions';
import { buildAiChefSystemPrompt } from '../prompts';
import { parseRichBlocks } from '@shared/richBlocks';
import { CLAUDE_MODELS } from '../ai-models';
import { formatISODate } from '@shared/dates';
import type { ToolCall } from './types';

const MAX_TOOL_ROUNDS = 5;
const MAX_HISTORY_TOKENS = 100_000;

interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    private readonly anthropicService: AnthropicService,
    private readonly usageTrackingService: UsageTrackingService,
    private readonly toolsService: AiChatToolsService,
  ) {}

  async getConversations(userId: string) {
    return this.conversationRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      select: ['id', 'title', 'createdAt', 'updatedAt'],
    });
  }

  async getMessages(userId: string, conversationId: string) {
    // Verify ownership
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, userId },
    });
    if (!conversation) {
      return [];
    }

    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      select: ['id', 'role', 'content', 'richBlocks', 'toolCalls', 'createdAt'],
    });
  }

  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    await this.conversationRepo.delete({ id: conversationId, userId });
  }

  streamResponse(
    userId: string,
    message: string,
    conversationId?: string,
    abortSignal?: AbortSignal,
  ): Subject<SSEEvent> {
    const subject = new Subject<SSEEvent>();

    this.runStreamLoop(userId, message, conversationId, subject, abortSignal).catch(
      (err) => {
        this.logger.error(`Stream error: ${err.message}`, err.stack);
        subject.next({
          event: 'error',
          data: { message: err.message ?? 'An unexpected error occurred' },
        });
        subject.complete();
      },
    );

    return subject;
  }

  private async runStreamLoop(
    userId: string,
    userMessage: string,
    conversationId: string | undefined,
    subject: Subject<SSEEvent>,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    // 1. Get or create conversation
    let conversation: Conversation;
    const isNew = !conversationId;

    if (conversationId) {
      conversation = await this.conversationRepo.findOne({
        where: { id: conversationId, userId },
      });
      if (!conversation) {
        throw new Error('Conversation not found');
      }
    } else {
      conversation = this.conversationRepo.create({ userId });
      conversation = await this.conversationRepo.save(conversation);
      subject.next({
        event: 'conversation',
        data: { id: conversation.id, title: conversation.title },
      });
    }

    // 2. Save user message
    const userMsg = this.messageRepo.create({
      conversationId: conversation.id,
      role: 'user',
      content: userMessage,
      tokenCount: Math.ceil(userMessage.length / 4), // rough estimate
    });
    await this.messageRepo.save(userMsg);

    // 3. Build message history
    const history = await this.buildMessageHistory(conversation.id);

    // 4. Stream with tool loop
    const systemPrompt = buildAiChefSystemPrompt(formatISODate(new Date()));
    let messages: Anthropic.MessageParam[] = history;
    let fullAssistantText = '';
    const allToolCalls: ToolCall[] = [];
    let toolRound = 0;

    while (toolRound <= MAX_TOOL_ROUNDS) {
      if (abortSignal?.aborted) break;

      const stream = this.anthropicService.streamMessage({
        maxTokens: 4096,
        system: systemPrompt,
        messages,
        tools: AI_CHAT_TOOLS,
        signal: abortSignal,
      });

      const pendingToolCalls: { id: string; name: string; input: Record<string, unknown> }[] = [];

      stream.on('text', (text) => {
        fullAssistantText += text;
        subject.next({ event: 'text_delta', data: { delta: text } });
      });

      // Collect the final message
      const finalMessage = await stream.finalMessage();

      // Track usage
      await this.anthropicService.trackStreamUsage(userId, finalMessage);
      await this.usageTrackingService.increment(userId, 'aiChatMessages');

      // Check for tool use in the response
      for (const block of finalMessage.content) {
        if (block.type === 'tool_use') {
          pendingToolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }

      if (pendingToolCalls.length === 0 || finalMessage.stop_reason === 'end_turn') {
        // No tools, or done — finalize
        break;
      }

      // Execute tools
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tc of pendingToolCalls) {
        allToolCalls.push(tc);

        subject.next({
          event: 'tool_use_start',
          data: { id: tc.id, name: tc.name },
        });

        const result = await this.toolsService.executeTool(tc.name, tc.input, userId);

        // Summarize result for SSE (don't send full data)
        const parsed = JSON.parse(result);
        const summary =
          parsed.totalCount !== undefined
            ? `Found ${parsed.totalCount} items`
            : 'Data retrieved';

        subject.next({
          event: 'tool_use_result',
          data: { id: tc.id, name: tc.name, resultSummary: summary },
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: tc.id,
          content: result,
        });
      }

      // Build the next round of messages
      messages = [
        ...messages,
        { role: 'assistant', content: finalMessage.content },
        { role: 'user', content: toolResults },
      ];

      toolRound++;
    }

    // 5. Parse rich blocks
    const richBlocks = parseRichBlocks(fullAssistantText);

    // 6. Save assistant message
    const assistantMsg = this.messageRepo.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: fullAssistantText,
      toolCalls: allToolCalls.length > 0 ? allToolCalls : null,
      richBlocks: richBlocks.length > 0 ? richBlocks : null,
      tokenCount: Math.ceil(fullAssistantText.length / 4),
    });
    await this.messageRepo.save(assistantMsg);

    // 7. Send message_complete event
    subject.next({
      event: 'message_complete',
      data: {
        messageId: assistantMsg.id,
        content: fullAssistantText,
        richBlocks,
      },
    });

    // 8. Auto-generate title for new conversations
    if (isNew && !conversation.title) {
      this.generateTitle(userId, conversation.id, userMessage).catch((err) =>
        this.logger.error(`Title generation failed: ${err.message}`),
      );
    }

    subject.complete();
  }

  private async buildMessageHistory(
    conversationId: string,
  ): Promise<Anthropic.MessageParam[]> {
    const messages = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    // Walk backwards to fit within token budget
    let totalTokens = 0;
    let startIdx = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      totalTokens += messages[i].tokenCount;
      if (totalTokens > MAX_HISTORY_TOKENS) {
        startIdx = i + 1;
        break;
      }
    }

    const truncated = messages.slice(startIdx);

    // Convert to Anthropic message format
    const result: Anthropic.MessageParam[] = [];
    for (const msg of truncated) {
      if (msg.role === 'user') {
        result.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        result.push({ role: 'assistant', content: msg.content });
      }
      // tool_result messages are reconstructed as part of the tool loop, not stored separately
    }

    return result;
  }

  private async generateTitle(
    userId: string,
    conversationId: string,
    firstMessage: string,
  ): Promise<void> {
    try {
      const response = await this.anthropicService.sendMessage(userId, {
        model: CLAUDE_MODELS['haiku-4.5'],
        maxTokens: 30,
        messages: [
          {
            role: 'user',
            content: `Generate a short title (3-5 words) for a cooking chat that started with this message: "${firstMessage}". Reply with ONLY the title, no quotes or punctuation.`,
          },
        ],
        messageType: 'ai-chat',
      });

      const title =
        response.content[0]?.type === 'text'
          ? response.content[0].text.trim().slice(0, 500)
          : null;

      if (title) {
        await this.conversationRepo.update(conversationId, { title });
      }
    } catch (err) {
      this.logger.error(`Title generation failed: ${err.message}`);
    }
  }
}
