import { MessageType, SubscriptionTier } from '@shared/enums';

/** Internal message types that are system operations and should NOT count against quotas */
export const INTERNAL_MESSAGE_TYPES: Set<MessageType> = new Set([
  MessageType.ShelfLife,
  MessageType.IngredientResolution,
  MessageType.FoodCategory,
  MessageType.FoodMatch,
  MessageType.CookDeduction,
]);

/** Monthly quota limits per subscription tier and message type */
export const MONTHLY_QUOTA_LIMITS: Partial<
  Record<SubscriptionTier, Partial<Record<MessageType, number>>>
> = {
  [SubscriptionTier.Free]: {
    [MessageType.ReceiptScan]: 3,
    [MessageType.RecipeGeneration]: 3,
    [MessageType.MealPlan]: 1,
    [MessageType.MealSwap]: 3,
    [MessageType.AiChat]: 8,
    [MessageType.UrlImport]: 2,
    [MessageType.PhotoImport]: 2,
  },
  [SubscriptionTier.Plus]: {
    [MessageType.ReceiptScan]: 20,
    [MessageType.RecipeGeneration]: 25,
    [MessageType.MealPlan]: 8,
    [MessageType.MealSwap]: 25,
    [MessageType.AiChat]: 100,
    [MessageType.UrlImport]: 15,
    [MessageType.PhotoImport]: 15,
  },
  [SubscriptionTier.Pro]: {
    [MessageType.ReceiptScan]: 40,
    [MessageType.RecipeGeneration]: 50,
    [MessageType.MealPlan]: 15,
    [MessageType.MealSwap]: 50,
    [MessageType.AiChat]: 200,
    [MessageType.UrlImport]: 30,
    [MessageType.PhotoImport]: 30,
  },
};
