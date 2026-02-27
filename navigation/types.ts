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

export type HomeStackParamList = {
  HomeScreen: undefined;
  RecipeDetail: { recipeId: string; title?: string; entryId?: string; isCooked?: boolean };
  CookedReview: { entryId: string };
};

export type TabParamList = {
  Home: undefined;
  PantryStack: undefined;
  MealsStack: undefined;
  AIChef: undefined;
  Profile: undefined;
};

export type MealsStackParamList = {
  MealsList: undefined;
  RecipeDetail: { recipeId: string; title?: string; entryId?: string; isCooked?: boolean };
  CookedReview: { entryId: string };
};

export type PantryStackParamList = {
  PantryList: undefined;
  AddItemPicker: undefined;
  ReceiptScan: undefined;
  ReceiptReview: { items: import('../hooks/useReceiptScanMutation').ReceiptScanItem[] };
  BarcodeScan: undefined;
  ManualEntry: {
    displayName?: string;
    quantity?: string;
    unit?: string;
  } | undefined;
  EditItem: { item: import('../hooks/usePantryQuery').PantryItem };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
