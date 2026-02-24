import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import {
  CookingSkill,
  GoalType,
  DietaryPreference,
  MACRO_PRESETS,
} from '../shared/enums';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <OnboardingProvider>{children}</OnboardingProvider>
);

describe('OnboardingContext', () => {
  it('should throw when useOnboarding is used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useOnboarding());
    }).toThrow('useOnboarding must be used within an OnboardingProvider');
    spy.mockRestore();
  });

  it('should have correct default values', () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });

    const defaults = MACRO_PRESETS[GoalType.Maintain];
    expect(result.current.data).toEqual({
      diets: [],
      excludedIngredients: [],
      householdSize: 2,
      cookingSkill: CookingSkill.Intermediate,
      goalType: GoalType.Maintain,
      dailyCalories: defaults.calories,
      dailyProteinGrams: defaults.protein,
      dailyCarbsGrams: defaults.carbs,
      dailyFatGrams: defaults.fat,
    });
  });

  it('should merge partial updates', () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });

    act(() => {
      result.current.updateData({ householdSize: 4 });
    });

    expect(result.current.data.householdSize).toBe(4);
    // Other values unchanged
    expect(result.current.data.cookingSkill).toBe(CookingSkill.Intermediate);
  });

  it('should handle sequential updates correctly', () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });

    act(() => {
      result.current.updateData({ diets: [DietaryPreference.Vegan] });
    });

    act(() => {
      result.current.updateData({ householdSize: 5 });
    });

    expect(result.current.data.diets).toEqual([DietaryPreference.Vegan]);
    expect(result.current.data.householdSize).toBe(5);
  });
});
