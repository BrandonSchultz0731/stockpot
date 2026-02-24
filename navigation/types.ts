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
  Meals: undefined;
  AIChef: undefined;
  Profile: undefined;
};

export type PantryStackParamList = {
  PantryList: undefined;
  AddItemPicker: undefined;
  ReceiptScan: undefined;
  ReceiptReview: { items: Partial<import('../hooks/usePantryMutations').CreatePantryItemRequest>[] };
  BarcodeScan: undefined;
  ManualEntry: undefined;
  EditItem: { item: import('../hooks/usePantryQuery').PantryItem };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
