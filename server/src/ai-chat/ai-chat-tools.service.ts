import { Injectable, Logger } from '@nestjs/common';
import { PantryService } from '../pantry/pantry.service';
import { RecipesService } from '../recipes/recipes.service';
import { MealPlansService } from '../meal-plans/meal-plans.service';
import { ShoppingListsService } from '../shopping-lists/shopping-lists.service';
import { UsersService } from '../users/users.service';
import { AiChatTool } from '@shared/aiChatTools';

@Injectable()
export class AiChatToolsService {
  private readonly logger = new Logger(AiChatToolsService.name);

  constructor(
    private readonly pantryService: PantryService,
    private readonly recipesService: RecipesService,
    private readonly mealPlansService: MealPlansService,
    private readonly shoppingListsService: ShoppingListsService,
    private readonly usersService: UsersService,
  ) {}

  async executeTool(
    toolName: string,
    input: Record<string, unknown>,
    userId: string,
  ): Promise<string> {
    try {
      switch (toolName) {
        case AiChatTool.GetPantryItems:
          return await this.getPantryItems(userId);
        case AiChatTool.SearchSavedRecipes:
          return await this.searchSavedRecipes(userId, input.query as string | undefined);
        case AiChatTool.GetRecipeDetail:
          return await this.getRecipeDetail(input.recipeId as string, userId);
        case AiChatTool.GetCurrentMealPlan:
          return await this.getCurrentMealPlan(userId);
        case AiChatTool.GetShoppingList:
          return await this.getShoppingList(input.mealPlanId as string, userId);
        case AiChatTool.GetUserProfile:
          return await this.getUserProfile(userId);
        case AiChatTool.GetExpiringItems:
          return await this.getExpiringItems(userId, (input.days as number) ?? 3);
        default:
          return JSON.stringify({ error: `Unknown tool: ${toolName}` });
      }
    } catch (error) {
      this.logger.error(`Tool ${toolName} failed: ${error.message}`, error.stack);
      return JSON.stringify({ error: `Tool execution failed: ${error.message}` });
    }
  }

  private async getPantryItems(userId: string): Promise<string> {
    const items = await this.pantryService.findAllForUser(userId);
    const summary = items.map((item) => ({
      id: item.id,
      name: item.displayName,
      quantity: item.quantity,
      unit: item.unit,
      storageLocation: item.storageLocation,
      expirationDate: item.expirationDate,
      category: item.foodCache?.category ?? null,
    }));
    return JSON.stringify({ items: summary, totalCount: items.length });
  }

  private async searchSavedRecipes(userId: string, query?: string): Promise<string> {
    const saved = await this.recipesService.getSavedRecipes(userId);
    let results = saved.map((sr) => ({
      savedRecipeId: sr.id,
      recipeId: sr.recipe.id,
      title: sr.recipe.title,
      description: sr.recipe.description,
      cuisine: sr.recipe.cuisine,
      difficulty: sr.recipe.difficulty,
      totalTimeMinutes: sr.recipe.totalTimeMinutes,
      mealType: sr.recipe.mealType,
      rating: sr.rating,
    }));

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q),
      );
    }

    return JSON.stringify({ recipes: results, totalCount: results.length });
  }

  private async getRecipeDetail(recipeId: string, userId: string): Promise<string> {
    const recipe = await this.recipesService.findById(recipeId, userId);
    return JSON.stringify({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      totalTimeMinutes: recipe.totalTimeMinutes,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine,
      mealType: recipe.mealType,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tags: recipe.tags,
      dietaryFlags: recipe.dietaryFlags,
      nutrition: recipe.nutrition,
    });
  }

  private async getCurrentMealPlan(userId: string): Promise<string> {
    try {
      const plan = await this.mealPlansService.getCurrentPlan(userId);
      return JSON.stringify({
        id: plan.id,
        weekStartDate: plan.weekStartDate,
        status: plan.status,
        entries: plan.entries?.map((e) => ({
          id: e.id,
          dayOfWeek: e.dayOfWeek,
          mealType: e.mealType,
          servings: e.servings,
          isCooked: e.isCooked,
          recipe: e.recipe
            ? {
                id: e.recipe.id,
                title: e.recipe.title,
                description: e.recipe.description,
                totalTimeMinutes: e.recipe.totalTimeMinutes,
                difficulty: e.recipe.difficulty,
              }
            : null,
        })),
      });
    } catch {
      return JSON.stringify({ message: 'No current meal plan found.' });
    }
  }

  private async getShoppingList(mealPlanId: string, userId: string): Promise<string> {
    try {
      const list = await this.shoppingListsService.getByMealPlan(userId, mealPlanId);
      return JSON.stringify(list);
    } catch {
      return JSON.stringify({ message: 'No shopping list found for this meal plan.' });
    }
  }

  private async getUserProfile(userId: string): Promise<string> {
    const profile = await this.usersService.getProfile(userId);
    return JSON.stringify({
      firstName: profile.firstName,
      lastName: profile.lastName,
      dietaryProfile: profile.dietaryProfile,
      nutritionalGoals: profile.nutritionalGoals,
      onboardingComplete: profile.onboardingComplete,
    });
  }

  private async getExpiringItems(userId: string, days: number): Promise<string> {
    const items = await this.pantryService.findAllForUser(userId);
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const expiring = items
      .filter((item) => {
        if (!item.expirationDate) return false;
        const expDate = new Date(item.expirationDate);
        return expDate <= cutoff && expDate >= now;
      })
      .map((item) => {
        const expDate = new Date(item.expirationDate!);
        const daysLeft = Math.ceil(
          (expDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        return {
          id: item.id,
          name: item.displayName,
          quantity: item.quantity,
          unit: item.unit,
          expirationDate: item.expirationDate,
          daysUntilExpiration: daysLeft,
          storageLocation: item.storageLocation,
        };
      })
      .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);

    return JSON.stringify({ items: expiring, totalCount: expiring.length, lookAheadDays: days });
  }
}
