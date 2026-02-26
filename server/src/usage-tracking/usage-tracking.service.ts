import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageTracking } from './entities/usage-tracking.entity';
import { formatISODate } from '@shared/dates';

type CounterField =
  | 'receiptScans'
  | 'mealPlansGenerated'
  | 'recipesGenerated'
  | 'aiChatMessages'
  | 'substitutionRequests'
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

  private columnName(field: CounterField): string {
    const map: Record<CounterField, string> = {
      receiptScans: 'receipt_scans',
      mealPlansGenerated: 'meal_plans_generated',
      recipesGenerated: 'recipes_generated',
      aiChatMessages: 'ai_chat_messages',
      substitutionRequests: 'substitution_requests',
      totalInputTokens: 'total_input_tokens',
      totalOutputTokens: 'total_output_tokens',
      estimatedCostCents: 'estimated_cost_cents',
    };
    return map[field];
  }
}
