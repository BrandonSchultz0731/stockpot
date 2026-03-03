import { useCallback } from 'react';
import { DietaryPreference } from '../shared/enums';

/**
 * Returns a toggle function that implements "None clears all others"
 * semantics for dietary preference lists.
 */
export function useToggleDiet(
  diets: DietaryPreference[],
  setDiets: (next: DietaryPreference[]) => void,
) {
  return useCallback(
    (diet: DietaryPreference) => {
      if (diet === DietaryPreference.None) {
        setDiets([DietaryPreference.None]);
        return;
      }
      const withoutNone = diets.filter(d => d !== DietaryPreference.None);
      if (withoutNone.includes(diet)) {
        setDiets(withoutNone.filter(d => d !== diet));
      } else {
        setDiets([...withoutNone, diet]);
      }
    },
    [diets, setDiets],
  );
}

/**
 * Returns a toggle function for a generic string list (e.g. excluded
 * ingredients).
 */
export function useToggleItem(
  items: string[],
  setItems: (next: string[]) => void,
) {
  return useCallback(
    (item: string) => {
      if (items.includes(item)) {
        setItems(items.filter(i => i !== item));
      } else {
        setItems([...items, item]);
      }
    },
    [items, setItems],
  );
}
