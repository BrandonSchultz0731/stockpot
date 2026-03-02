import { MessageType } from '@shared/enums';

export class UsageTrackingResponseDto {
  id: string;
  userId: string;
  periodStart: string;
  featureCounts: Partial<Record<MessageType, number>>;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostCents: number;
}
