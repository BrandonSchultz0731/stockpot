import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';
import { UsageTrackingService } from '../usage-tracking/usage-tracking.service';
import { ModelConfig, ACTIVE_MODEL, estimateCostCents } from '../ai-models';
import { FAKE_RESPONSES } from './fake-responses';

export type MessageType =
  | 'meal-plan'
  | 'meal-swap'
  | 'recipe-generation'
  | 'shelf-life'
  | 'receipt-scan'
  | 'ingredient-resolution'
  | 'food-category'
  | 'cook-deduction'
  | 'ai-chat';

@Injectable()
export class AnthropicService {
  private readonly logger = new Logger(AnthropicService.name);
  private readonly anthropic: Anthropic;
  private readonly useFakeData: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
    this.useFakeData = this.configService.get<string>('USE_FAKE_DATA') === 'true';
    if (this.useFakeData) {
      this.logger.warn('USE_FAKE_DATA is enabled — AI calls will return fake responses');
    }
  }

  async sendMessage(
    userId: string,
    params: {
      model?: ModelConfig;
      maxTokens: number;
      messages: Anthropic.MessageParam[];
      messageType?: MessageType;
    },
  ): Promise<Anthropic.Message> {
    if (this.useFakeData) {
      if (!params.messageType) {
        throw new Error('USE_FAKE_DATA is enabled but no messageType was provided to sendMessage');
      }
      this.logger.log(`Returning fake data for messageType: ${params.messageType}`);
      return this.buildFakeResponse(params.messageType);
    }

    const model = params.model ?? ACTIVE_MODEL;

    const response = await this.anthropic.messages.create({
      model: model.id,
      max_tokens: params.maxTokens,
      messages: params.messages,
    });

    await this.trackUsage(userId, response, model);

    return response;
  }

  streamMessage(params: {
    model?: ModelConfig;
    maxTokens: number;
    system?: string;
    messages: Anthropic.MessageParam[];
    tools?: Anthropic.Tool[];
    signal?: AbortSignal;
  }): MessageStream {
    const model = params.model ?? ACTIVE_MODEL;

    return this.anthropic.messages.stream({
      model: model.id,
      max_tokens: params.maxTokens,
      system: params.system,
      messages: params.messages,
      tools: params.tools?.length ? params.tools : undefined,
    }, { signal: params.signal });
  }

  async trackStreamUsage(
    userId: string,
    message: Anthropic.Message,
    model?: ModelConfig,
  ): Promise<void> {
    await this.trackUsage(userId, message, model ?? ACTIVE_MODEL);
  }

  private buildFakeResponse(messageType: MessageType): Anthropic.Message {
    const text = FAKE_RESPONSES[messageType] ?? '{}';
    return {
      id: 'fake-msg-id',
      type: 'message',
      role: 'assistant',
      model: 'fake',
      content: [{ type: 'text', text }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    } as unknown as Anthropic.Message;
  }

  private async trackUsage(
    userId: string,
    response: Anthropic.Message,
    model: ModelConfig,
  ): Promise<void> {
    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;
    const costCents = estimateCostCents(inputTokens, outputTokens, model);

    await Promise.all([
      this.usageTrackingService.increment(
        userId,
        'totalInputTokens',
        inputTokens,
      ),
      this.usageTrackingService.increment(
        userId,
        'totalOutputTokens',
        outputTokens,
      ),
      this.usageTrackingService.increment(
        userId,
        'estimatedCostCents',
        costCents,
      ),
    ]);
  }
}
