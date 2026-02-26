import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { UsageTrackingService } from '../usage-tracking/usage-tracking.service';
import { ModelConfig, ACTIVE_MODEL, estimateCostCents } from '../ai-models';

@Injectable()
export class AnthropicService {
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
