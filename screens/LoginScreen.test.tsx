import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from './LoginScreen';

const mockMutateAsync = jest.fn();
const mockNavigate = jest.fn();

let mockIsPending = false;
let mockError: { message: string } | null = null;

const mockSignInWithApple = jest.fn();
const mockSignInWithGoogle = jest.fn();
let mockSocialPending = false;
let mockSocialError: { message: string } | null = null;

jest.mock('../hooks/useLoginMutation', () => ({
  useLoginMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending,
    error: mockError,
  }),
}));

jest.mock('../hooks/useSocialAuth', () => ({
  useSocialAuth: () => ({
    signInWithApple: mockSignInWithApple,
    signInWithGoogle: mockSignInWithGoogle,
    isPending: mockSocialPending,
    error: mockSocialError,
    isAppleSupported: true,
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

jest.mock('../assets/app-icon.png', () => 'app-icon');

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
    mockSignInWithApple.mockResolvedValue(undefined);
    mockSignInWithGoogle.mockResolvedValue(undefined);
    mockIsPending = false;
    mockError = null;
    mockSocialPending = false;
    mockSocialError = null;
  });

  it('should render email and password fields', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);

    expect(getByPlaceholderText('Email address')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('should render Log In button', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Log In')).toBeTruthy();
  });

  it('should disable button when fields are empty', () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText('Log In'));

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should enable button when both fields are filled', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email address'), 'a@b.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password');
    fireEvent.press(getByText('Log In'));

    expect(mockMutateAsync).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password',
    });
  });

  it('should navigate to SignUp when "Sign Up" is pressed', () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText('Sign Up'));

    expect(mockNavigate).toHaveBeenCalledWith('SignUp');
  });

  it('should toggle password visibility', () => {
    const { getByPlaceholderText, getByTestId } = render(<LoginScreen />);

    const passwordInput = getByPlaceholderText('Password');
    expect(passwordInput.props.secureTextEntry).toBe(true);

    fireEvent.press(getByTestId('icon-Eye'));

    expect(getByPlaceholderText('Password').props.secureTextEntry).toBe(false);
  });

  it('should display error message when login fails', () => {
    mockError = { message: 'Invalid credentials' };

    const { getByText } = render(<LoginScreen />);

    expect(getByText('Invalid credentials')).toBeTruthy();
  });

  it('should show "Logging in..." when pending', () => {
    mockIsPending = true;

    const { getByText } = render(<LoginScreen />);

    expect(getByText('Logging in...')).toBeTruthy();
  });

  it('should render social sign-in buttons', () => {
    const { getByText } = render(<LoginScreen />);

    expect(getByText('Continue with Google')).toBeTruthy();
    expect(getByText('Continue with Apple')).toBeTruthy();
  });

  it('should call signInWithGoogle when Google button is pressed', () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText('Continue with Google'));

    expect(mockSignInWithGoogle).toHaveBeenCalled();
  });

  it('should call signInWithApple when Apple button is pressed', () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText('Continue with Apple'));

    expect(mockSignInWithApple).toHaveBeenCalled();
  });

  it('should display social auth error', () => {
    mockSocialError = { message: 'An account with this email already exists. Please log in with email and password.' };

    const { getByText } = render(<LoginScreen />);

    expect(getByText(/An account with this email already exists/)).toBeTruthy();
  });
});
