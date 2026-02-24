import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCompleteOnboardingMutation } from './useCompleteOnboardingMutation';
import { api } from '../services/api';
import { createQueryWrapper } from '../test-utils/wrapper';
import {
  CookingSkill,
  DietaryPreference,
  GoalType,
  MACRO_PRESETS,
} from '../shared/enums';

jest.mock('../services/api', () => ({
  api: { post: jest.fn(), get: jest.fn(), patch: jest.fn() },
  setAccessToken: jest.fn(),
}));

const wrapper = createQueryWrapper();

const testData = {
  diets: [DietaryPreference.Vegan],
  excludedIngredients: ['Peanuts'],
  householdSize: 2,
  cookingSkill: CookingSkill.Intermediate,
  goalType: GoalType.Maintain,
  dailyCalories: MACRO_PRESETS[GoalType.Maintain].calories,
  dailyProteinGrams: MACRO_PRESETS[GoalType.Maintain].protein,
  dailyCarbsGrams: MACRO_PRESETS[GoalType.Maintain].carbs,
  dailyFatGrams: MACRO_PRESETS[GoalType.Maintain].fat,
};

describe('useCompleteOnboardingMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call api.patch with correct payload shape', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useCompleteOnboardingMutation(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate(testData);
    });

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/users/me/onboarding', {
        dietaryProfile: {
          diets: [DietaryPreference.Vegan],
          excludedIngredients: ['Peanuts'],
          householdSize: 2,
          cookingSkill: CookingSkill.Intermediate,
        },
        nutritionalGoals: {
          goalType: GoalType.Maintain,
          dailyCalories: testData.dailyCalories,
          dailyProteinGrams: testData.dailyProteinGrams,
          dailyCarbsGrams: testData.dailyCarbsGrams,
          dailyFatGrams: testData.dailyFatGrams,
        },
      });
    });
  });
});
