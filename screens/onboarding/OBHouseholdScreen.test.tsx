import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OBHouseholdScreen from './OBHouseholdScreen';
import { OnboardingProvider } from '../../contexts/OnboardingContext';
import { CookingSkill, COOKING_SKILL_DESCRIPTIONS } from '../../shared/enums';

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
  return render(<OBHouseholdScreen />, { wrapper });
}

describe('OBHouseholdScreen', () => {
  it('should render household size stepper with default value 2', () => {
    const { getByText } = renderScreen();

    expect(getByText('2')).toBeTruthy();
    expect(getByText('people')).toBeTruthy();
  });

  it('should increment household size', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('+'));

    expect(getByText('3')).toBeTruthy();
  });

  it('should decrement household size', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('−'));

    expect(getByText('1')).toBeTruthy();
  });

  it('should not decrement below 1', () => {
    const { getByText } = renderScreen();

    // Decrement to 1
    fireEvent.press(getByText('−'));
    expect(getByText('1')).toBeTruthy();

    // Try to decrement again — should stay at 1
    fireEvent.press(getByText('−'));
    expect(getByText('1')).toBeTruthy();
  });

  it('should not increment above 10', () => {
    const { getByText } = renderScreen();

    // Increment from 2 to 10 (8 presses)
    for (let i = 0; i < 8; i++) {
      fireEvent.press(getByText('+'));
    }
    expect(getByText('10')).toBeTruthy();

    // Try to increment again — should stay at 10
    fireEvent.press(getByText('+'));
    expect(getByText('10')).toBeTruthy();
  });

  it('should show "person" for household size 1', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('−'));

    expect(getByText('person')).toBeTruthy();
  });

  it('should render all cooking skill cards', () => {
    const { getByText } = renderScreen();

    for (const skill of Object.values(CookingSkill)) {
      expect(getByText(skill)).toBeTruthy();
      expect(getByText(COOKING_SKILL_DESCRIPTIONS[skill])).toBeTruthy();
    }
  });
});
