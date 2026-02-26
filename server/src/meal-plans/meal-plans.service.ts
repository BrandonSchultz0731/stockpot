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
import { MealType } from '@shared/enums';
import { ACTIVE_MODEL } from '../ai-models';

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
  ) {}

  async getCurrentPlan(userId: string): Promise<MealPlan | null> {
    return this.mealPlanRepo.findOne({
      where: { userId },
      relations: ['entries', 'entries.recipe'],
      order: { weekStartDate: 'DESC' },
    });
  }

  async getPlanByWeek(userId: string, weekStartDate: string): Promise<MealPlan> {
    const plan = await this.mealPlanRepo.findOne({
      where: { userId, weekStartDate },
      relations: ['entries', 'entries.recipe'],
    });

    if (!plan) {
      throw new NotFoundException('Meal plan not found for this week');
    }

    return plan;
  }

  async generatePlan(userId: string, dto: GenerateMealPlanDto): Promise<MealPlan> {
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

    const prompt = `You are a meal planning chef. Create a 7-day meal plan (Monday through Sunday) using primarily the following pantry ingredients. It's okay to include a few common ingredients not in the pantry.

Pantry ingredients:
${ingredientList || 'No pantry items available — suggest common recipes.'}

Meal types to plan: ${mealTypes.join(', ')}
Servings per meal: ${servings}
${constraintBlock}
Return ONLY a JSON object with a "meals" array where each item has:
- "dayOfWeek": number (0=Monday, 1=Tuesday, ..., 6=Sunday)
- "mealType": "${mealTypes.join('" | "')}"
- "title": string (recipe name)
- "description": string (1-2 sentence description)
- "prepTimeMinutes": number
- "cookTimeMinutes": number
- "totalTimeMinutes": number
- "servings": number
- "difficulty": "Easy" | "Medium" | "Hard"
- "cuisine": string
- "ingredients": array of { "name": string, "quantity": number, "unit": string, "notes": string (optional), "inPantry": boolean }
- "steps": array of { "stepNumber": number, "instruction": string, "duration": number (optional, in minutes) }
- "tags": array of strings
- "dietaryFlags": array of strings
- "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number } (estimated per serving)

No markdown fences, no explanation — only the JSON object.`;

    let response;
    try {
      response = await this.anthropicService.sendMessage(userId, {
        model: ACTIVE_MODEL,
        maxTokens: 16384,
        messages: [{ role: 'user', content: prompt }],
      });
    } catch (error) {
      this.logger.error('Claude API call failed for meal plan generation', error);
      throw new BadGatewayException('Meal plan generation service unavailable');
    }

    await this.usageTrackingService.increment(userId, 'mealPlansGenerated');

    const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const meals = this.parseMealPlanResponse(rawText);

    // Remove existing plan for this week if any
    const existing = await this.mealPlanRepo.findOne({
      where: { userId, weekStartDate: dto.weekStartDate },
    });
    if (existing) {
      await this.mealPlanRepo.remove(existing);
    }

    const mealPlan = this.mealPlanRepo.create({
      userId,
      weekStartDate: dto.weekStartDate,
      status: 'active',
      source: 'ai',
    });
    const savedPlan = await this.mealPlanRepo.save(mealPlan);

    for (const meal of meals) {
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
        ingredients: meal.ingredients ?? [],
        steps: meal.steps ?? [],
        tags: meal.tags,
        dietaryFlags: meal.dietaryFlags,
        nutrition: meal.nutrition,
      });
      const savedRecipe = await this.recipeRepo.save(recipe);

      const entry = this.entryRepo.create({
        mealPlanId: savedPlan.id,
        recipeId: savedRecipe.id,
        dayOfWeek: meal.dayOfWeek,
        mealType: meal.mealType,
        servings: meal.servings ?? servings,
      });
      await this.entryRepo.save(entry);
    }

    return this.mealPlanRepo.findOne({
      where: { id: savedPlan.id },
      relations: ['entries', 'entries.recipe'],
    });
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

    const prompt = `You are a meal planning chef. Suggest a single replacement recipe for ${dayName} ${entry.mealType} using primarily the following pantry ingredients. It's okay to include a few common ingredients not in the pantry.

The current meal is: "${entry.recipe.title}" — please suggest something different.

Pantry ingredients:
${ingredientList || 'No pantry items available — suggest a common recipe.'}
${constraintBlock}
Return ONLY a JSON object with:
- "title": string (recipe name)
- "description": string (1-2 sentence description)
- "prepTimeMinutes": number
- "cookTimeMinutes": number
- "totalTimeMinutes": number
- "servings": number
- "difficulty": "Easy" | "Medium" | "Hard"
- "cuisine": string
- "ingredients": array of { "name": string, "quantity": number, "unit": string, "notes": string (optional), "inPantry": boolean }
- "steps": array of { "stepNumber": number, "instruction": string, "duration": number (optional, in minutes) }
- "tags": array of strings
- "dietaryFlags": array of strings
- "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number } (estimated per serving)

No markdown fences, no explanation — only the JSON object.`;

    let response;
    try {
      response = await this.anthropicService.sendMessage(userId, {
        model: ACTIVE_MODEL,
        maxTokens: 2048,
        messages: [{ role: 'user', content: prompt }],
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
      ingredients: parsed.ingredients ?? [],
      steps: parsed.steps ?? [],
      tags: parsed.tags,
      dietaryFlags: parsed.dietaryFlags,
      nutrition: parsed.nutrition,
    });
    const savedRecipe = await this.recipeRepo.save(recipe);

    entry.recipeId = savedRecipe.id;
    const savedEntry = await this.entryRepo.save(entry);

    return this.entryRepo.findOne({
      where: { id: savedEntry.id },
      relations: ['mealPlan', 'recipe'],
    });
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
