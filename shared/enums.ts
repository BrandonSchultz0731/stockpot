export enum StorageLocation {
  Fridge = 'Fridge',
  Freezer = 'Freezer',
  Pantry = 'Pantry',
}

export type ShelfLife = Partial<Record<StorageLocation, number>>;

export enum SubscriptionTier {
  Free = 'Free',
  Plus = 'Plus',
  Pro = 'Pro',
}

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

export enum UnitOfMeasure {
  // Weight
  Lb = 'lb',
  Oz = 'oz',
  G = 'g',
  Kg = 'kg',
  // Volume
  Cup = 'cup',
  Tbsp = 'tbsp',
  Tsp = 'tsp',
  FlOz = 'fl_oz',
  Gallon = 'gallon',
  Quart = 'quart',
  Pint = 'pint',
  Liter = 'liter',
  Ml = 'ml',
  // Produce / Packaging
  Count = 'count',
  Bunch = 'bunch',
  Clove = 'clove',
  Head = 'head',
  Slice = 'slice',
  Stick = 'stick',
  Bag = 'bag',
  Can = 'can',
  Bottle = 'bottle',
  Package = 'package',
}

export enum CookingSkill {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

export interface DietaryProfile {
  diets: DietaryPreference[];
  excludedIngredients: string[];
  householdSize: number;
  cookingSkill: CookingSkill;
}

export interface NutritionalGoals {
  goalType: GoalType;
  dailyCalories: number;
  dailyProteinGrams: number;
  dailyCarbsGrams: number;
  dailyFatGrams: number;
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

export enum MealType {
  Breakfast = 'Breakfast',
  Lunch = 'Lunch',
  Dinner = 'Dinner',
  Snack = 'Snack',
}

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export enum RecipeSource {
  AI = 'ai',
  Manual = 'manual',
  Imported = 'imported',
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  inPantry?: boolean;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  duration?: number;
}

export interface RecipeNutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  mealType: MealType;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tags: string[];
  dietaryFlags: string[];
  nutrition: RecipeNutrition | null;
}

export enum MealPlanStatus {
  Draft = 'draft',
  Active = 'active',
  Completed = 'completed',
  Error = 'error',
}

export enum DayOfWeek {
  Mon = 0,
  Tue = 1,
  Wed = 2,
  Thu = 3,
  Fri = 4,
  Sat = 5,
  Sun = 6,
}
