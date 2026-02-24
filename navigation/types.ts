export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  MainTabs: undefined;
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
