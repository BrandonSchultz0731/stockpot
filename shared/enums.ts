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

export const GOAL_EMOJIS: Record<GoalType, string> = {
  [GoalType.LoseWeight]: '📉',
  [GoalType.Maintain]: '⚖️',
  [GoalType.BuildMuscle]: '💪',
};

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

export interface MealScheduleSlot {
  dayOfWeek: number;
  mealType: MealType;
}

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export enum PantryStatus {
  None = 'none',
  Low = 'low',
  Enough = 'enough',
  NA = 'na',
}

export enum RecipeSource {
  AI = 'ai',
  Manual = 'manual',
  Website = 'website',
  Photo = 'photo',
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  baseQuantity: number;
  baseUnit: string;
  notes?: string;
  foodCacheId: string;
  pantryStatus?: PantryStatus;
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
  Sun = 0,
  Mon = 1,
  Tue = 2,
  Wed = 3,
  Thu = 4,
  Fri = 5,
  Sat = 6,
}

export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

export const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export interface ShoppingListItem {
  id: string;
  displayName: string;
  quantity: number;
  unit: string;
  baseQuantity: number;
  baseUnit: string;
  foodCacheId: string | null;
  category: string;
  pantryStatus: PantryStatus;
  neededQuantity: number;
  isChecked: boolean;
  isCustom: boolean;
  recipeCount: number;
}

export enum MessageType {
  /** Generate a full weekly meal plan */
  MealPlan = 'meal-plan',
  /** Swap a single meal plan entry for a new recipe */
  MealSwap = 'meal-swap',
  /** Generate standalone recipes from pantry ingredients */
  RecipeGeneration = 'recipe-generation',
  /** Estimate shelf life and category for a pantry item */
  ShelfLife = 'shelf-life',
  /** Parse a grocery receipt photo into pantry items */
  ReceiptScan = 'receipt-scan',
  /** Match ingredient names to food_cache entries */
  IngredientResolution = 'ingredient-resolution',
  /** Categorize food items (e.g. "Dairy & Eggs", "Meat & Poultry") */
  FoodCategory = 'food-category',
  /** AI unit conversion fallback for cook deductions (e.g. cloves → heads) */
  CookDeduction = 'cook-deduction',
  /** Interactive Chef Pixel chat conversation */
  AiChat = 'ai-chat',
  /** Deduplicate pantry items by matching similar food names */
  FoodMatch = 'food-match',
  /** Import a recipe from a website URL */
  UrlImport = 'url-import',
  /** Import a recipe from a photo of a cookbook/recipe card */
  PhotoImport = 'photo-import',
}

export const DEFAULT_FOOD_CATEGORY = 'Other';

export const FOOD_CATEGORIES: string[] = [
  'Fruits',
  'Vegetables',
  'Meat & Poultry',
  'Seafood',
  'Dairy & Eggs',
  'Grains & Bread',
  'Canned Goods',
  'Condiments & Sauces',
  'Snacks',
  'Beverages',
  'Frozen',
  'Spices & Herbs',
  'Baking',
  'Other',
];

export enum NotificationType {
  ExpiringItems = 'expiring_items',
  MealReminder = 'meal_reminder',
  MealPlanNudge = 'meal_plan_nudge',
}

export interface NotificationPrefs {
  expiringItems: boolean;
  mealReminders: boolean;
  mealPlanNudge: boolean;
  mealReminderTime: string; // HH:mm 24h format
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  expiringItems: true,
  mealReminders: true,
  mealPlanNudge: true,
  mealReminderTime: '17:00',
};
