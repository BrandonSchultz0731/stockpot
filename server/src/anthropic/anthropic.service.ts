import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';
import { UsageTrackingService } from '../usage-tracking/usage-tracking.service';
import { UsersService } from '../users/users.service';
import { ModelConfig, ACTIVE_MODEL, estimateCostCents } from '../ai-models';
import { MessageType, UserRole } from '@shared/enums';
import { INTERNAL_MESSAGE_TYPES } from '../common/config/quota-limits';

@Injectable()
export class AnthropicService {
  private readonly logger = new Logger(AnthropicService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly configService: ConfigService,
    private readonly usageTrackingService: UsageTrackingService,
    private readonly usersService: UsersService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async enforceQuota(userId: string, messageType: MessageType): Promise<void> {
    if (INTERNAL_MESSAGE_TYPES.has(messageType)) {
      return;
    }

    const user = await this.usersService.findById(userId);
    if (!user || user.role === UserRole.Admin) {
      return;
    }

    const result = await this.usageTrackingService.checkQuota(
      userId,
      messageType,
      user.subscriptionTier,
    );

    if (!result.allowed) {
      throw new HttpException(
        {
          code: 'QUOTA_EXCEEDED',
          messageType,
          currentCount: result.currentCount,
          limit: result.limit,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async sendMessage(
    userId: string,
    params: {
      model?: ModelConfig;
      maxTokens: number;
      messages: Anthropic.MessageParam[];
      messageType: MessageType;
    },
  ): Promise<Anthropic.Message> {
    await this.enforceQuota(userId, params.messageType);

    const model = params.model ?? ACTIVE_MODEL;

    const response = await this.anthropic.messages.create({
      model: model.id,
      max_tokens: params.maxTokens,
      messages: params.messages,
    });

    await this.trackUsage(userId, response, model, params.messageType);

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
    messageType: MessageType,
    model?: ModelConfig,
  ): Promise<void> {
    await this.trackUsage(userId, message, model ?? ACTIVE_MODEL, messageType);
  }

  private async trackUsage(
    userId: string,
    response: Anthropic.Message,
    model: ModelConfig,
    messageType: MessageType,
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
      this.usageTrackingService.incrementFeatureCount(userId, messageType),
    ]);
  }
}
