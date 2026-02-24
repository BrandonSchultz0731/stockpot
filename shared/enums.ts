export enum DietaryPreference {
  Vegetarian = 'Vegetarian',
  Vegan = 'Vegan',
  Pescatarian = 'Pescatarian',
  GlutenFree = 'Gluten-Free',
  DairyFree = 'Dairy-Free',
  Keto = 'Keto',
  Paleo = 'Paleo',
  Halal = 'Halal',
  Kosher = 'Kosher',
  HighProtein = 'High-Protein',
  LowCarb = 'Low-Carb',
  LowSodium = 'Low-Sodium',
  Whole30 = 'Whole30',
  None = 'None',
}

export enum GoalType {
  LoseWeight = 'Lose Weight',
  Maintain = 'Maintain',
  BuildMuscle = 'Build Muscle',
}

export enum CookingSkill {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

export const COOKING_SKILL_DESCRIPTIONS: Record<CookingSkill, string> = {
  [CookingSkill.Beginner]: "I'm new to cooking and prefer simple recipes",
  [CookingSkill.Intermediate]: 'I can follow most recipes comfortably',
  [CookingSkill.Advanced]: 'I love experimenting with complex techniques',
};

export const MACRO_PRESETS: Record<
  GoalType,
  { calories: number; protein: number; carbs: number; fat: number }
> = {
  [GoalType.LoseWeight]: { calories: 1800, protein: 140, carbs: 180, fat: 60 },
  [GoalType.Maintain]: { calories: 2000, protein: 150, carbs: 250, fat: 65 },
  [GoalType.BuildMuscle]: { calories: 2500, protein: 200, carbs: 300, fat: 75 },
};

export const EXCLUDED_INGREDIENT_SUGGESTIONS: string[] = [
  'Peanuts',
  'Tree Nuts',
  'Soy',
  'Eggs',
  'Fish',
  'Shellfish',
  'Sesame',
  'Mushrooms',
  'Cilantro',
  'Olives',
  'Coconut',
  'Bell Peppers',
];
