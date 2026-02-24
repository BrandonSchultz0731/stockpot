export class UsageTrackingResponseDto {
  id: string;
  userId: string;
  periodStart: string;
  receiptScans: number;
  mealPlansGenerated: number;
  recipesGenerated: number;
  aiChatMessages: number;
  substitutionRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostCents: number;
}
