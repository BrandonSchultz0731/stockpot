import {
  Injectable,
  Logger,
  NotFoundException,
  BadGatewayException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealPlan } from './entities/meal-plan.entity';
import { MealPlanEntry } from './entities/meal-plan-entry.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { PantryService } from '../pantry/pantry.service';
import { AnthropicService } from '../anthropic/anthropic.service';
import { UsageTrackingService } from '../usage-tracking/usage-tracking.service';
import { UsersService } from '../users/users.service';
import { GenerateMealPlanDto } from './dto/generate-meal-plan.dto';
import { UpdateMealPlanEntryDto } from './dto/update-meal-plan-entry.dto';
import { SwapMealPlanEntryDto } from './dto/swap-meal-plan-entry.dto';
import { MealType, RecipeIngredient } from '@shared/enums';
import { ACTIVE_MODEL } from '../ai-models';
import { FoodCacheService } from '../food-cache/food-cache.service';
import { buildMealPlanPrompt, buildMealSwapPrompt } from '../prompts';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

@Injectable()
export class MealPlansService {
  private readonly logger = new Logger(MealPlansService.name);

  constructor(
    @InjectRepository(MealPlan)
    private readonly mealPlanRepo: Repository<MealPlan>,
    @InjectRepository(MealPlanEntry)
    private readonly entryRepo: Repository<MealPlanEntry>,
    @InjectRepository(Recipe)
    private readonly recipeRepo: Repository<Recipe>,
    private readonly pantryService: PantryService,
    private readonly anthropicService: AnthropicService,
    private readonly usageTrackingService: UsageTrackingService,
    private readonly usersService: UsersService,
    private readonly foodCacheService: FoodCacheService,
  ) {}

  async getCurrentPlan(userId: string): Promise<MealPlan | null> {
    const plan = await this.mealPlanRepo.findOne({
      where: { userId },
      relations: ['entries', 'entries.recipe'],
      order: { weekStartDate: 'DESC' },
    });
    if (plan?.entries) {
      await this.enrichPlanEntries(userId, plan.entries);
    }
    return plan;
  }

  async getPlanByWeek(userId: string, weekStartDate: string): Promise<MealPlan> {
    const plan = await this.mealPlanRepo.findOne({
      where: { userId, weekStartDate },
      relations: ['entries', 'entries.recipe'],
    });

    if (!plan) {
      throw new NotFoundException('Meal plan not found for this week');
    }

    if (plan.entries) {
      await this.enrichPlanEntries(userId, plan.entries);
    }

    return plan;
  }

  async generatePlan(userId: string, dto: GenerateMealPlanDto): Promise<MealPlan> {
    // Remove existing plan for this week if any
    const existing = await this.mealPlanRepo.findOne({
      where: { userId, weekStartDate: dto.weekStartDate },
    });
    if (existing) {
      await this.mealPlanRepo.remove(existing);
    }

    // Create draft plan and return immediately
    const mealPlan = this.mealPlanRepo.create({
      userId,
      weekStartDate: dto.weekStartDate,
      status: 'draft',
      source: 'ai',
    });
    const savedPlan = await this.mealPlanRepo.save(mealPlan);

    // Fire off background generation (not awaited)
    this.processGeneration(userId, savedPlan.id, dto).catch((error) => {
      this.logger.error(`Background meal plan generation failed for plan ${savedPlan.id}`, error);
    });

    return savedPlan;
  }

  private async processGeneration(
    userId: string,
    planId: string,
    dto: GenerateMealPlanDto,
  ): Promise<void> {
    try {
      const pantryItems = await this.pantryService.findAllForUser(userId);
      const user = await this.usersService.findById(userId);

      const ingredientList = pantryItems
        .map((item) => `${item.displayName} (${item.quantity} ${item.unit})`)
        .join('\n');

      const mealTypes = dto.mealTypes ?? [MealType.Breakfast, MealType.Lunch, MealType.Dinner];
      const servings = dto.servingsPerMeal ?? user?.dietaryProfile?.householdSize ?? 2;

      const constraints: string[] = [];
      if (dto.cuisine) constraints.push(`Cuisine preference: ${dto.cuisine}`);
      if (dto.difficulty) constraints.push(`Difficulty level: ${dto.difficulty}`);
      if (dto.dietaryFlags?.length) {
        constraints.push(`Dietary requirements: ${dto.dietaryFlags.join(', ')}`);
      }
      if (user?.dietaryProfile?.diets?.length) {
        constraints.push(`User dietary preferences: ${user.dietaryProfile.diets.join(', ')}`);
      }
      if (user?.dietaryProfile?.excludedIngredients?.length) {
        constraints.push(`Excluded ingredients: ${user.dietaryProfile.excludedIngredients.join(', ')}`);
      }

      const constraintBlock = constraints.length > 0
        ? `\nConstraints:\n${constraints.join('\n')}\n`
        : '';

      const prompt = buildMealPlanPrompt(ingredientList, mealTypes, servings, constraintBlock);

      const response = await this.anthropicService.sendMessage(userId, {
        model: ACTIVE_MODEL,
        maxTokens: 16384,
        messages: [{ role: 'user', content: prompt }],
        messageType: 'meal-plan',
      });

      await this.usageTrackingService.increment(userId, 'mealPlansGenerated');

      const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const meals = this.parseMealPlanResponse(rawText);

      if (meals.length === 0) {
        throw new Error('No valid meals parsed from AI response');
      }

      // Resolve ingredient names to food_cache IDs
      const allIngredientNames = meals.flatMap(
        (meal: any) => (meal.ingredients ?? []).map((ing: any) => ing.name as string),
      );
      const pantryFoodItems = pantryItems.map((item) => ({
        foodCacheId: item.foodCacheId,
        displayName: item.displayName,
      }));
      const resolvedMap = await this.foodCacheService.resolveIngredientNames(
        allIngredientNames,
        pantryFoodItems,
        userId,
      );

      for (const meal of meals) {
        const resolvedIngredients: RecipeIngredient[] = (meal.ingredients ?? []).map(
          (ing: any) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            ...(ing.notes ? { notes: ing.notes } : {}),
            foodCacheId: resolvedMap.get(ing.name.toLowerCase()),
          }),
        );

        const recipe = this.recipeRepo.create({
          userId,
          title: meal.title,
          description: meal.description,
          prepTimeMinutes: meal.prepTimeMinutes,
          cookTimeMinutes: meal.cookTimeMinutes,
          totalTimeMinutes: meal.totalTimeMinutes,
          servings: meal.servings ?? servings,
          difficulty: meal.difficulty,
          cuisine: meal.cuisine,
          mealType: meal.mealType,
          source: 'ai',
          ingredients: resolvedIngredients,
          steps: meal.steps ?? [],
          tags: meal.tags,
          dietaryFlags: meal.dietaryFlags,
          nutrition: meal.nutrition,
        });
        const savedRecipe = await this.recipeRepo.save(recipe);

        const entry = this.entryRepo.create({
          mealPlanId: planId,
          recipeId: savedRecipe.id,
          dayOfWeek: meal.dayOfWeek,
          mealType: meal.mealType,
          servings: meal.servings ?? servings,
        });
        await this.entryRepo.save(entry);
      }

      await this.mealPlanRepo.update(planId, { status: 'active' });
      this.logger.log(`Meal plan ${planId} generation completed with ${meals.length} meals`);
    } catch (error) {
      this.logger.error(`Meal plan ${planId} generation failed`, error);
      await this.mealPlanRepo.update(planId, { status: 'error' });
    }
  }

  async updateEntry(
    userId: string,
    entryId: string,
    dto: UpdateMealPlanEntryDto,
  ): Promise<MealPlanEntry> {
    const entry = await this.entryRepo.findOne({
      where: { id: entryId },
      relations: ['mealPlan', 'recipe'],
    });

    if (!entry || entry.mealPlan.userId !== userId) {
      throw new NotFoundException('Meal plan entry not found');
    }

    Object.assign(entry, dto);
    return this.entryRepo.save(entry);
  }

  async swapEntry(
    userId: string,
    entryId: string,
    dto: SwapMealPlanEntryDto,
  ): Promise<MealPlanEntry> {
    const entry = await this.entryRepo.findOne({
      where: { id: entryId },
      relations: ['mealPlan', 'recipe'],
    });

    if (!entry || entry.mealPlan.userId !== userId) {
      throw new NotFoundException('Meal plan entry not found');
    }

    const pantryItems = await this.pantryService.findAllForUser(userId);
    const ingredientList = pantryItems
      .map((item) => `${item.displayName} (${item.quantity} ${item.unit})`)
      .join('\n');

    const constraints: string[] = [];
    if (dto.cuisine) constraints.push(`Cuisine preference: ${dto.cuisine}`);
    if (dto.difficulty) constraints.push(`Difficulty level: ${dto.difficulty}`);
    if (dto.dietaryFlags?.length) {
      constraints.push(`Dietary requirements: ${dto.dietaryFlags.join(', ')}`);
    }

    const constraintBlock = constraints.length > 0
      ? `\nConstraints:\n${constraints.join('\n')}\n`
      : '';

    const dayName = DAY_NAMES[entry.dayOfWeek] ?? `Day ${entry.dayOfWeek}`;

    const prompt = buildMealSwapPrompt(ingredientList, dayName, entry.mealType, entry.recipe.title, constraintBlock);

    let response;
    try {
      response = await this.anthropicService.sendMessage(userId, {
        model: ACTIVE_MODEL,
        maxTokens: 2048,
        messages: [{ role: 'user', content: prompt }],
        messageType: 'meal-swap',
      });
    } catch (error) {
      this.logger.error('Claude API call failed for meal swap', error);
      throw new BadGatewayException('Meal swap service unavailable');
    }

    const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const parsed = this.parseRecipeObject(rawText);

    if (!parsed) {
      throw new BadGatewayException('Failed to parse replacement recipe');
    }

    // Resolve ingredient names to food_cache IDs
    const swapIngredientNames = (parsed.ingredients ?? []).map((ing: any) => ing.name as string);
    const pantryFoodItems = pantryItems.map((item) => ({
      foodCacheId: item.foodCacheId,
      displayName: item.displayName,
    }));
    const resolvedMap = await this.foodCacheService.resolveIngredientNames(
      swapIngredientNames,
      pantryFoodItems,
      userId,
    );

    const resolvedIngredients: RecipeIngredient[] = (parsed.ingredients ?? []).map(
      (ing: any) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        ...(ing.notes ? { notes: ing.notes } : {}),
        foodCacheId: resolvedMap.get(ing.name.toLowerCase()),
      }),
    );

    const recipe = this.recipeRepo.create({
      userId,
      title: parsed.title,
      description: parsed.description,
      prepTimeMinutes: parsed.prepTimeMinutes,
      cookTimeMinutes: parsed.cookTimeMinutes,
      totalTimeMinutes: parsed.totalTimeMinutes,
      servings: parsed.servings ?? entry.servings,
      difficulty: parsed.difficulty,
      cuisine: parsed.cuisine,
      mealType: entry.mealType,
      source: 'ai',
      ingredients: resolvedIngredients,
      steps: parsed.steps ?? [],
      tags: parsed.tags,
      dietaryFlags: parsed.dietaryFlags,
      nutrition: parsed.nutrition,
    });
    const savedRecipe = await this.recipeRepo.save(recipe);

    entry.recipeId = savedRecipe.id;
    const savedEntry = await this.entryRepo.save(entry);

    const returnedEntry = await this.entryRepo.findOne({
      where: { id: savedEntry.id },
      relations: ['mealPlan', 'recipe'],
    });

    // Enrich with inPantry for the API response
    if (returnedEntry?.recipe?.ingredients) {
      const pantryFoodCacheIds = new Set(pantryItems.map((item) => item.foodCacheId));
      returnedEntry.recipe.ingredients = this.enrichInPantry(
        returnedEntry.recipe.ingredients,
        pantryFoodCacheIds,
      );
    }

    return returnedEntry;
  }

  async deletePlan(userId: string, planId: string): Promise<void> {
    const plan = await this.mealPlanRepo.findOne({
      where: { id: planId, userId },
    });

    if (!plan) {
      throw new NotFoundException('Meal plan not found');
    }

    await this.mealPlanRepo.remove(plan);
  }

  private enrichInPantry(
    ingredients: RecipeIngredient[],
    pantryFoodCacheIds: Set<string>,
  ): RecipeIngredient[] {
    return ingredients.map((ing) => ({
      ...ing,
      inPantry: ing.foodCacheId ? pantryFoodCacheIds.has(ing.foodCacheId) : false,
    }));
  }

  private async enrichPlanEntries(
    userId: string,
    entries: MealPlanEntry[],
  ): Promise<void> {
    if (!entries?.length) return;
    const pantryItems = await this.pantryService.findAllForUser(userId);
    const ids = new Set(pantryItems.map((item) => item.foodCacheId));
    for (const entry of entries) {
      if (entry.recipe?.ingredients) {
        entry.recipe.ingredients = this.enrichInPantry(entry.recipe.ingredients, ids);
      }
    }
  }

  private parseMealPlanResponse(raw: string): any[] {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try {
          parsed = JSON.parse(codeBlockMatch[1].trim());
        } catch {
          // fall through
        }
      }

      if (!parsed) {
        const objectMatch = raw.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          try {
            parsed = JSON.parse(objectMatch[0]);
          } catch {
            // fall through
          }
        }
      }
    }

    // Extract meals array from parsed object
    let meals: unknown[];
    if (parsed && typeof parsed === 'object' && 'meals' in (parsed as any)) {
      meals = (parsed as any).meals;
    } else if (Array.isArray(parsed)) {
      meals = parsed;
    } else {
      this.logger.warn('Failed to parse meal plan generation response');
      return [];
    }

    if (!Array.isArray(meals)) {
      this.logger.warn('Meals field is not an array');
      return [];
    }

    return meals.filter(
      (item: any) =>
        item &&
        typeof item.title === 'string' &&
        item.title.trim().length > 0 &&
        typeof item.dayOfWeek === 'number' &&
        typeof item.mealType === 'string' &&
        Array.isArray(item.ingredients) &&
        Array.isArray(item.steps),
    );
  }

  private parseRecipeObject(raw: string): any | null {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try {
          parsed = JSON.parse(codeBlockMatch[1].trim());
        } catch {
          // fall through
        }
      }

      if (!parsed) {
        const objectMatch = raw.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          try {
            parsed = JSON.parse(objectMatch[0]);
          } catch {
            // fall through
          }
        }
      }
    }

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as any).title !== 'string' ||
      !Array.isArray((parsed as any).ingredients) ||
      !Array.isArray((parsed as any).steps)
    ) {
      this.logger.warn('Failed to parse replacement recipe response');
      return null;
    }

    return parsed;
  }
}
