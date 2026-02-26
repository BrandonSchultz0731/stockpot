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

export type TabParamList = {
  Home: undefined;
  PantryStack: undefined;
  MealsStack: undefined;
  AIChef: undefined;
  Profile: undefined;
};

export type MealsStackParamList = {
  MealsList: undefined;
  RecipeDetail: { recipeId: string; title?: string };
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
