export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
