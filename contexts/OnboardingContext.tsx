import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DietaryPreference,
  GoalType,
  CookingSkill,
  MACRO_PRESETS,
} from '../shared/enums';

export interface OnboardingData {
  diets: DietaryPreference[];
  excludedIngredients: string[];
  householdSize: number;
  cookingSkill: CookingSkill;
  goalType: GoalType;
  dailyCalories: number;
  dailyProteinGrams: number;
  dailyCarbsGrams: number;
  dailyFatGrams: number;
}

interface OnboardingContextValue {
  data: OnboardingData;
  updateData: (partial: Partial<OnboardingData>) => void;
}

const defaults = MACRO_PRESETS[GoalType.Maintain];

const initialData: OnboardingData = {
  diets: [],
  excludedIngredients: [],
  householdSize: 2,
  cookingSkill: CookingSkill.Intermediate,
  goalType: GoalType.Maintain,
  dailyCalories: defaults.calories,
  dailyProteinGrams: defaults.protein,
  dailyCarbsGrams: defaults.carbs,
  dailyFatGrams: defaults.fat,
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(initialData);

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  const value = useMemo(() => ({ data, updateData }), [data, updateData]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}
