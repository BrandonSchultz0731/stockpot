import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SignUpScreen from './SignUpScreen';

const mockMutateAsync = jest.fn();
const mockGoBack = jest.fn();

jest.mock('../hooks/useRegisterMutation', () => ({
  useRegisterMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    error: null,
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: mockGoBack,
  }),
}));

jest.mock('../assets/app-icon.png', () => 'app-icon');

function pressCreateAccount(utils: ReturnType<typeof render>) {
  // "Create Account" appears as both the header and button text
  const elements = utils.getAllByText('Create Account');
  // The button is the last one
  fireEvent.press(elements[elements.length - 1]);
}

describe('SignUpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  it('should render all form fields', () => {
    const { getByPlaceholderText } = render(<SignUpScreen />);

    expect(getByPlaceholderText('First name')).toBeTruthy();
    expect(getByPlaceholderText('Last name')).toBeTruthy();
    expect(getByPlaceholderText('Email address')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm password')).toBeTruthy();
  });

  it('should render password strength hint', () => {
    const { getByText } = render(<SignUpScreen />);
    expect(getByText('Must be at least 8 characters')).toBeTruthy();
  });

  it('should show validation error for short password', () => {
    const utils = render(<SignUpScreen />);

    fireEvent.changeText(utils.getByPlaceholderText('First name'), 'Test');
    fireEvent.changeText(utils.getByPlaceholderText('Email address'), 'a@b.com');
    fireEvent.changeText(utils.getByPlaceholderText('Password'), 'short');
    fireEvent.changeText(utils.getByPlaceholderText('Confirm password'), 'short');
    pressCreateAccount(utils);

    expect(utils.getByText('Password must be at least 8 characters')).toBeTruthy();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should show validation error for password mismatch', () => {
    const utils = render(<SignUpScreen />);

    fireEvent.changeText(utils.getByPlaceholderText('First name'), 'Test');
    fireEvent.changeText(utils.getByPlaceholderText('Email address'), 'a@b.com');
    fireEvent.changeText(utils.getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(utils.getByPlaceholderText('Confirm password'), 'different');
    pressCreateAccount(utils);

    expect(utils.getByText('Passwords do not match')).toBeTruthy();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should show validation error when terms unchecked', () => {
    const utils = render(<SignUpScreen />);

    fireEvent.changeText(utils.getByPlaceholderText('First name'), 'Test');
    fireEvent.changeText(utils.getByPlaceholderText('Email address'), 'a@b.com');
    fireEvent.changeText(utils.getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(utils.getByPlaceholderText('Confirm password'), 'password123');
    pressCreateAccount(utils);

    expect(
      utils.getByText('You must agree to the Terms of Service'),
    ).toBeTruthy();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should call mutateAsync on successful submission', async () => {
    const utils = render(<SignUpScreen />);

    fireEvent.changeText(utils.getByPlaceholderText('First name'), 'Test');
    fireEvent.changeText(utils.getByPlaceholderText('Last name'), 'User');
    fireEvent.changeText(utils.getByPlaceholderText('Email address'), 'a@b.com');
    fireEvent.changeText(utils.getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(utils.getByPlaceholderText('Confirm password'), 'password123');

    // Check the terms checkbox
    fireEvent.press(utils.getByText(/I agree to the/));
    pressCreateAccount(utils);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    });
  });

  it('should navigate back when "Log In" is pressed', () => {
    const { getByText } = render(<SignUpScreen />);

    fireEvent.press(getByText('Log In'));

    expect(mockGoBack).toHaveBeenCalled();
  });
});
