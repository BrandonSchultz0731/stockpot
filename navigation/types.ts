import type { ReceiptScanItem } from '../hooks/useReceiptScanMutation';
import type { PantryItem } from '../hooks/usePantryQuery';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
};

export type OnboardingParamList = {
  OBWelcome: undefined;
  OBDiet: undefined;
  OBExclude: undefined;
  OBHousehold: undefined;
  OBGoals: undefined;
};

// Shared screen params used across multiple stacks
export type RecipeDetailParams = { recipeId: string; title?: string; entryId?: string; isCooked?: boolean };
export type CookedReviewParams = { entryId: string };

export type HomeStackParamList = {
  HomeScreen: undefined;
  RecipeDetail: RecipeDetailParams;
  CookedReview: CookedReviewParams;
};

export type TabParamList = {
  Home: undefined;
  PantryStack: undefined;
  MealsStack: undefined;
  AIChefStack: undefined;
  Profile: undefined;
};

export type AIChefStackParamList = {
  AIChefChat: undefined;
  RecipeDetail: RecipeDetailParams;
};

export type ShoppingListParams = { mealPlanId: string; weekStartDate: string };

export type MealsStackParamList = {
  MealsList: undefined;
  RecipeDetail: RecipeDetailParams;
  CookedReview: CookedReviewParams;
  ShoppingList: ShoppingListParams;
  ReceiptScan: undefined;
  ReceiptReview: { items: ReceiptScanItem[] };
};

export type PantryStackParamList = {
  PantryList: undefined;
  AddItemPicker: undefined;
  ReceiptScan: undefined;
  ReceiptReview: { items: ReceiptScanItem[] };
  BarcodeScan: undefined;
  ManualEntry: {
    displayName?: string;
    quantity?: string;
    unit?: string;
  } | undefined;
  EditItem: { item: PantryItem };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
