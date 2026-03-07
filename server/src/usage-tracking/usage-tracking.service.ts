import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageTracking } from './entities/usage-tracking.entity';
import { formatISODate } from '@shared/dates';
import { MessageType, SubscriptionTier } from '@shared/enums';
import {
  INTERNAL_MESSAGE_TYPES,
  MONTHLY_QUOTA_LIMITS,
} from '../common/config/quota-limits';

type CounterField =
  | 'totalInputTokens'
  | 'totalOutputTokens'
  | 'estimatedCostCents';

@Injectable()
export class UsageTrackingService {
  constructor(
    @InjectRepository(UsageTracking)
    private readonly usageRepo: Repository<UsageTracking>,
  ) {}

  async getCurrentPeriod(userId: string): Promise<UsageTracking> {
    const now = new Date();
    now.setDate(1);
    const periodStart = formatISODate(now);

    let record = await this.usageRepo.findOne({
      where: { userId, periodStart },
    });

    if (!record) {
      record = this.usageRepo.create({ userId, periodStart });
      record = await this.usageRepo.save(record);
    }

    return record;
  }

  async increment(
    userId: string,
    field: CounterField,
    amount = 1,
  ): Promise<void> {
    const record = await this.getCurrentPeriod(userId);

    await this.usageRepo
      .createQueryBuilder()
      .update(UsageTracking)
      .set({ [field]: () => `"${this.columnName(field)}" + ${amount}` })
      .where('id = :id', { id: record.id })
      .execute();
  }

  async incrementFeatureCount(
    userId: string,
    messageType: MessageType,
  ): Promise<void> {
    const record = await this.getCurrentPeriod(userId);

    await this.usageRepo
      .createQueryBuilder()
      .update(UsageTracking)
      .set({
        featureCounts: () =>
          `jsonb_set(feature_counts, '{${messageType}}', (COALESCE((feature_counts->>'${messageType}')::int, 0) + 1)::text::jsonb)`,
      })
      .where('id = :id', { id: record.id })
      .execute();
  }

  async checkQuota(
    userId: string,
    messageType: MessageType,
    tier: SubscriptionTier,
  ): Promise<{ allowed: boolean; currentCount: number; limit: number | null }> {
    if (INTERNAL_MESSAGE_TYPES.has(messageType)) {
      return { allowed: true, currentCount: 0, limit: null };
    }

    const tierLimits = MONTHLY_QUOTA_LIMITS[tier];
    if (!tierLimits) {
      return { allowed: true, currentCount: 0, limit: null };
    }

    const limit = tierLimits[messageType];
    if (limit === undefined) {
      return { allowed: true, currentCount: 0, limit: null };
    }

    const record = await this.getCurrentPeriod(userId);
    const currentCount = record.featureCounts[messageType] ?? 0;

    return { allowed: currentCount < limit, currentCount, limit };
  }

  private columnName(field: CounterField): string {
    const map: Record<CounterField, string> = {
      totalInputTokens: 'total_input_tokens',
      totalOutputTokens: 'total_output_tokens',
      estimatedCostCents: 'estimated_cost_cents',
    };
    return map[field];
  }
}
