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
  Pantry: undefined;
  Meals: undefined;
  AIChef: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
