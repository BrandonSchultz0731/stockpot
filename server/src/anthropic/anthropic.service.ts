import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';
import { UsageTrackingService } from '../usage-tracking/usage-tracking.service';
import { ModelConfig, ACTIVE_MODEL, estimateCostCents } from '../ai-models';

export type MessageType =
  | 'meal-plan'
  | 'meal-swap'
  | 'recipe-generation'
  | 'shelf-life'
  | 'receipt-scan'
  | 'ingredient-resolution'
  | 'food-category'
  | 'cook-deduction'
  | 'ai-chat'
  | 'food-match'
  | 'url-import';

@Injectable()
export class AnthropicService {
  private readonly logger = new Logger(AnthropicService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly configService: ConfigService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
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
