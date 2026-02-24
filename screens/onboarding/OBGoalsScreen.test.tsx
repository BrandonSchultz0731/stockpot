import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OBGoalsScreen from './OBGoalsScreen';
import { OnboardingProvider } from '../../contexts/OnboardingContext';
import { GoalType, MACRO_PRESETS } from '../../shared/enums';

const mockMutate = jest.fn();
let mockIsPending = false;
let mockIsError = false;

jest.mock('../../hooks/useCompleteOnboardingMutation', () => ({
  useCompleteOnboardingMutation: () => ({
    mutate: mockMutate,
    isPending: mockIsPending,
    isError: mockIsError,
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <OnboardingProvider>{children}</OnboardingProvider>
);

function renderScreen() {
  return render(<OBGoalsScreen />, { wrapper });
}

describe('OBGoalsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPending = false;
    mockIsError = false;
  });

  it('should render all goal type cards', () => {
    const { getByText } = renderScreen();

    for (const goal of Object.values(GoalType)) {
      expect(getByText(new RegExp(goal))).toBeTruthy();
    }
  });

  it('should show default macro values for Maintain goal', () => {
    const { getByText } = renderScreen();

    const preset = MACRO_PRESETS[GoalType.Maintain];
    expect(getByText(`${preset.calories} cal`)).toBeTruthy();
    expect(getByText(`${preset.protein}g`)).toBeTruthy();
  });

  it('should update macros when selecting a different goal', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText(/Lose Weight/));

    const preset = MACRO_PRESETS[GoalType.LoseWeight];
    expect(getByText(`${preset.calories} cal`)).toBeTruthy();
    expect(getByText(`${preset.protein}g`)).toBeTruthy();
  });

  it('should call mutation.mutate when Finish Setup is pressed', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Finish Setup'));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        goalType: GoalType.Maintain,
        dailyCalories: MACRO_PRESETS[GoalType.Maintain].calories,
      }),
    );
  });

  it('should show error message when mutation fails', () => {
    mockIsError = true;

    const { getByText } = renderScreen();

    expect(getByText('Something went wrong. Please try again.')).toBeTruthy();
  });
});
