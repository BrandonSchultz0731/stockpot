import {
  BadRequestException,
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
import { UsersService } from '../users/users.service';
import { GenerateMealPlanDto } from './dto/generate-meal-plan.dto';
import { UpdateMealPlanEntryDto } from './dto/update-meal-plan-entry.dto';
import { SwapMealPlanEntryDto } from './dto/swap-meal-plan-entry.dto';
import { AddLeftoverEntryDto } from './dto/add-leftover-entry.dto';
import { MealType, RecipeSource, MealScheduleSlot, DAY_NAMES, MessageType } from '@shared/enums';
import { ACTIVE_MODEL } from '../ai-models';
import { FoodCacheService } from '../food-cache/food-cache.service';
import { ShoppingListsService } from '../shopping-lists/shopping-lists.service';
import { buildMealPlanPrompt, buildMealSwapPrompt, buildUrlRecipeImportPrompt, buildPhotoRecipeImportPrompt } from '../prompts';
import { enrichPantryStatus } from '../pantry/enrich-pantry';
import { computeCookDeductions } from '../pantry/cook-deduction';
import { resolveAiConversions } from '../pantry/cook-deduction-ai';
import { ConfirmCookDto } from './dto/confirm-cook.dto';
import { AddMealPlanEntryDto } from './dto/add-meal-plan-entry.dto';
import { extractText, parseJsonFromAI, parseObjectFromAI } from '../utils/ai-response';
import { normalizeImageMime } from '../utils/mime';
import { formatPantryForPrompt, buildPantryFoodItems, mapResolvedIngredients, buildRecipeData, ParsedRecipe } from '../utils/recipe-builder';
import { IsNull } from 'typeorm';

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
    private readonly usersService: UsersService,
    private readonly foodCacheService: FoodCacheService,
    private readonly shoppingListsService: ShoppingListsService,
  ) { }

  async getCurrentPlan(userId: string): Promise<MealPlan> {
    const plan = await this.mealPlanRepo.findOne({
      where: { userId },
      relations: ['entries', 'entries.recipe', 'entries.leftoverEntries'],
      order: { weekStartDate: 'DESC' },
    });
    if (!plan) {
      throw new NotFoundException('No meal plan found');
    }
    if (plan.entries) {
      await this.enrichPlanEntries(userId, plan.entries);
    }
    return plan;
  }

  async getPlanByWeek(userId: string, weekStartDate: string): Promise<MealPlan> {
    const plan = await this.mealPlanRepo.findOne({
      where: { userId, weekStartDate },
      relations: ['entries', 'entries.recipe', 'entries.leftoverEntries'],
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
      source: RecipeSource.AI,
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

      const ingredientList = formatPantryForPrompt(pantryItems);

      let mealSchedule: MealScheduleSlot[];

      if (dto.mealSchedule?.length) {
        mealSchedule = dto.mealSchedule;
      } else {
        const mealTypes = dto.mealTypes ?? [MealType.Breakfast, MealType.Lunch, MealType.Dinner];
        mealSchedule = [];
        for (let day = 0; day <= 6; day++) {
          for (const type of mealTypes) {
            mealSchedule.push({ dayOfWeek: day, mealType: type });
          }
        }
      }

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

      const prompt = buildMealPlanPrompt(ingredientList, mealSchedule, servings, constraintBlock);

      const response = await this.anthropicService.sendMessage(userId, {
        model: ACTIVE_MODEL,
        maxTokens: 16384,
        messages: [{ role: 'user', content: prompt }],
        messageType: MessageType.MealPlan,
      });

      const rawText = extractText(response);
      const meals = this.parseMealPlanResponse(rawText);

      if (meals.length === 0) {
        throw new Error('No valid meals parsed from AI response');
      }

      // Resolve ingredient names to food_cache IDs
      const allIngredientNames = meals.flatMap(
        (meal) => meal.ingredients.map((ing) => ing.name),
      );
      const resolvedMap = await this.foodCacheService.resolveIngredientNames(
        allIngredientNames,
        buildPantryFoodItems(pantryItems),
        userId,
      );

      for (const meal of meals) {
        const resolvedIngredients = mapResolvedIngredients(meal.ingredients ?? [], resolvedMap);
        const recipe = this.recipeRepo.create({
          ...buildRecipeData(meal, { userId, source: RecipeSource.AI, servings }),
          ingredients: resolvedIngredients,
        });
        const savedRecipe = await this.recipeRepo.save(recipe);

        const entry = this.entryRepo.create({
          mealPlanId: planId,
          recipeId: savedRecipe.id,
          dayOfWeek: meal.dayOfWeek,
          mealType: meal.mealType as MealType,
          servings: meal.servings ?? servings,
        });
        await this.entryRepo.save(entry);
      }

      await this.mealPlanRepo.update(planId, { status: 'active' });
      this.logger.log(`Meal plan ${planId} generation completed with ${meals.length} meals`);

      // Generate shopping list in background
      this.shoppingListsService.generateForMealPlan(planId, userId).catch((err) => {
        this.logger.error(`Shopping list generation failed for plan ${planId}`, err);
      });
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

    if (entry.isCooked) {
      throw new BadRequestException('Cannot swap a meal that has already been cooked');
    }

    const pantryItems = await this.pantryService.findAllForUser(userId);
    const ingredientList = formatPantryForPrompt(pantryItems);

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
        messageType: MessageType.MealSwap,
      });
    } catch (error) {
      this.logger.error('Claude API call failed for meal swap', error);
      throw new BadGatewayException('Meal swap service unavailable');
    }

    const rawText = extractText(response);
    const parsed = this.parseRecipeFromAI(rawText);

    if (!parsed) {
      throw new BadGatewayException('Failed to parse replacement recipe');
    }

    const savedRecipe = await this.createRecipeFromParsed(
      userId, parsed, pantryItems,
      { source: RecipeSource.AI, mealType: entry.mealType, servings: entry.servings },
    );

    // Remove any leftover entries that reference this source before swapping
    await this.entryRepo.delete({ leftoverSourceEntryId: entry.id });

    entry.recipe = savedRecipe;
    entry.recipeId = savedRecipe.id;
    entry.servingsToCook = null;
    const savedEntry = await this.entryRepo.save(entry);

    const returnedEntry = await this.entryRepo.findOne({
      where: { id: savedEntry.id },
      relations: ['mealPlan', 'recipe'],
    });

    // Enrich with pantryStatus for the API response
    if (returnedEntry?.recipe?.ingredients) {
      returnedEntry.recipe.ingredients = enrichPantryStatus(
        returnedEntry.recipe.ingredients,
        pantryItems,
      );
    }

    // Regenerate shopping list in background
    this.shoppingListsService.generateForMealPlan(entry.mealPlanId, userId).catch((err) => {
      this.logger.error(`Shopping list regeneration failed after swap for plan ${entry.mealPlanId}`, err);
    });

    return returnedEntry;
  }

  async addEntry(
    userId: string,
    dto: AddMealPlanEntryDto,
  ): Promise<MealPlanEntry> {
    const plan = await this.mealPlanRepo.findOne({
      where: { id: dto.mealPlanId, userId },
    });
    if (!plan) {
      throw new NotFoundException('Meal plan not found');
    }
    if (plan.status !== 'active') {
      throw new BadRequestException('Meal plan is not active');
    }

    const existingEntry = await this.entryRepo.findOne({
      where: {
        mealPlanId: dto.mealPlanId,
        dayOfWeek: dto.dayOfWeek,
        mealType: dto.mealType,
        leftoverSourceEntryId: IsNull(),
      },
    });
    if (existingEntry) {
      throw new BadRequestException(
        `A ${dto.mealType} entry already exists for this day`,
      );
    }

    const pantryItems = await this.pantryService.findAllForUser(userId);

    let parsed: ParsedRecipe;
    let source: RecipeSource;
    let sourceUrl: string | null = null;

    if (dto.imageBase64) {
      ({ parsed, source } = await this.addEntryFromPhoto(userId, dto));
    } else if (dto.url) {
      ({ parsed, source, sourceUrl } = await this.addEntryFromUrl(userId, dto));
    } else {
      ({ parsed, source } = await this.addEntryViaAI(userId, dto, pantryItems));
    }

    const user = await this.usersService.findById(userId);
    const servings = user?.dietaryProfile?.householdSize ?? 2;

    const savedRecipe = await this.createRecipeFromParsed(
      userId, parsed, pantryItems,
      { source, mealType: dto.mealType, servings, sourceUrl },
    );

    const entry = this.entryRepo.create({
      mealPlanId: dto.mealPlanId,
      recipeId: savedRecipe.id,
      dayOfWeek: dto.dayOfWeek,
      mealType: dto.mealType,
      servings: parsed.servings ?? servings,
    });
    const savedEntry = await this.entryRepo.save(entry);

    const returnedEntry = await this.entryRepo.findOne({
      where: { id: savedEntry.id },
      relations: ['mealPlan', 'recipe'],
    });

    // Enrich with pantryStatus for the API response
    if (returnedEntry?.recipe?.ingredients) {
      returnedEntry.recipe.ingredients = enrichPantryStatus(
        returnedEntry.recipe.ingredients,
        pantryItems,
      );
    }

    // Regenerate shopping list before returning so the client gets fresh data
    try {
      await this.shoppingListsService.generateForMealPlan(dto.mealPlanId, userId);
    } catch (err) {
      this.logger.error(
        `Shopping list regeneration failed after add entry for plan ${dto.mealPlanId}`,
        err,
      );
    }

    return returnedEntry;
  }

  private async addEntryFromPhoto(
    userId: string,
    dto: AddMealPlanEntryDto,
  ): Promise<{ parsed: ParsedRecipe; source: RecipeSource }> {
    let response;
    try {
      response = await this.anthropicService.sendMessage(userId, {
        model: ACTIVE_MODEL,
        maxTokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: normalizeImageMime(dto.mimeType),
                  data: dto.imageBase64,
                },
              },
              {
                type: 'text',
                text: buildPhotoRecipeImportPrompt(dto.mealType),
              },
            ],
          },
        ],
        messageType: MessageType.PhotoImport,
      });
    } catch (error) {
      this.logger.error('Claude API call failed for photo recipe import', error);
      throw new BadGatewayException('Recipe import service unavailable');
    }

    const rawText = extractText(response);
    this.checkForErrorResponse(rawText);

    const parsed = this.parseRecipeFromAI(rawText);
    if (!parsed) {
      throw new BadGatewayException('Failed to parse recipe from photo');
    }

    return { parsed, source: RecipeSource.Photo };
  }

  private async addEntryFromUrl(
    userId: string,
    dto: AddMealPlanEntryDto,
  ): Promise<{ parsed: ParsedRecipe; source: RecipeSource; sourceUrl: string }> {
    let pageContent: string;
    try {
      const res = await fetch(dto.url);
      const html = await res.text();
      // Strip script/style tags, then all HTML tags
      pageContent = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 15000);
    } catch (error) {
      this.logger.error('Failed to fetch recipe URL', error);
      throw new BadGatewayException('Could not fetch the provided URL');
    }

    const prompt = buildUrlRecipeImportPrompt(pageContent, dto.mealType);

    let response;
    try {
      response = await this.anthropicService.sendMessage(userId, {
        model: ACTIVE_MODEL,
        maxTokens: 2048,
        messages: [{ role: 'user', content: prompt }],
        messageType: MessageType.UrlImport,
      });
    } catch (error) {
      this.logger.error('Claude API call failed for URL recipe import', error);
      throw new BadGatewayException('Recipe import service unavailable');
    }

    const rawText = extractText(response);
    this.checkForErrorResponse(rawText);

    const parsed = this.parseRecipeFromAI(rawText);
    if (!parsed) {
      throw new BadGatewayException('Failed to parse recipe from URL');
    }

    return { parsed, source: RecipeSource.Website, sourceUrl: dto.url };
  }

  private async addEntryViaAI(
    userId: string,
    dto: AddMealPlanEntryDto,
    pantryItems: { foodCacheId: string; displayName: string; quantity: number; unit: string }[],
  ): Promise<{ parsed: ParsedRecipe; source: RecipeSource }> {
    const ingredientList = formatPantryForPrompt(pantryItems);
    const dayName = DAY_NAMES[dto.dayOfWeek] ?? `Day ${dto.dayOfWeek}`;
    const prompt = buildMealSwapPrompt(
      ingredientList,
      dayName,
      dto.mealType,
      '(none — this is a new meal)',
      '',
    );

    let response;
    try {
      response = await this.anthropicService.sendMessage(userId, {
        model: ACTIVE_MODEL,
        maxTokens: 2048,
        messages: [{ role: 'user', content: prompt }],
        messageType: MessageType.MealSwap,
      });
    } catch (error) {
      this.logger.error('Claude API call failed for add entry', error);
      throw new BadGatewayException('Meal generation service unavailable');
    }

    const rawText = extractText(response);
    const parsed = this.parseRecipeFromAI(rawText);

    if (!parsed) {
      throw new BadGatewayException('Failed to parse generated recipe');
    }

    return { parsed, source: RecipeSource.AI };
  }

  private async createRecipeFromParsed(
    userId: string,
    parsed: ParsedRecipe,
    pantryItems: { foodCacheId: string; displayName: string; quantity: number; unit: string }[],
    overrides: {
      source: RecipeSource;
      mealType: string;
      servings: number;
      sourceUrl?: string | null;
    },
  ): Promise<Recipe> {
    const ingredientNames = (parsed.ingredients ?? []).map(
      (ing: any) => ing.name as string,
    );
    const resolvedMap = await this.foodCacheService.resolveIngredientNames(
      ingredientNames,
      buildPantryFoodItems(pantryItems),
      userId,
    );

    const resolvedIngredients = mapResolvedIngredients(parsed.ingredients ?? [], resolvedMap);
    const recipe = this.recipeRepo.create({
      ...buildRecipeData(parsed, {
        userId,
        source: overrides.source,
        mealType: overrides.mealType,
        servings: overrides.servings,
        sourceUrl: overrides.sourceUrl,
      }),
      ingredients: resolvedIngredients,
    });
    return this.recipeRepo.save(recipe);
  }

  async cookPreview(userId: string, entryId: string, servingsToCook?: number) {
    const entry = await this.entryRepo.findOne({
      where: { id: entryId },
      relations: ['mealPlan', 'recipe'],
    });

    if (!entry || entry.mealPlan.userId !== userId) {
      throw new NotFoundException('Meal plan entry not found');
    }

    const pantryItems = await this.pantryService.findAllForUser(userId);

    const pantryData = pantryItems.map((item) => ({
      id: item.id,
      displayName: item.displayName,
      quantity: Number(item.quantity),
      unit: item.unit,
      foodCacheId: item.foodCacheId,
    }));

    // Scale ingredients if servingsToCook differs from recipe servings
    const recipeServings = entry.recipe.servings || 1;
    const cookServings = servingsToCook ?? entry.servingsToCook ?? recipeServings;
    const scale = cookServings / recipeServings;
    const scaledIngredients = (entry.recipe.ingredients ?? []).map((ing) => ({
      ...ing,
      quantity: Math.round(ing.quantity * scale * 100) / 100,
      ...(ing.baseQuantity != null
        ? { baseQuantity: Math.round(ing.baseQuantity * scale * 100) / 100 }
        : {}),
    }));

    // 1. Deterministic deductions
    const deductions = computeCookDeductions(
      scaledIngredients,
      pantryData,
    );

    // 2. AI fallback for incompatible unit conversions
    const needsAi = deductions.some((d) => d.needsAiConversion);
    if (needsAi) {
      await resolveAiConversions(deductions, userId, this.anthropicService);
    }

    // 3. Strip internal fields before returning
    const cleaned = deductions.map(
      ({ needsAiConversion, recipeQuantity, recipeUnit, ...rest }) => rest,
    );

    return {
      entryId: entry.id,
      recipeTitle: entry.recipe.title,
      deductions: cleaned,
    };
  }

  async confirmCook(userId: string, entryId: string, dto: ConfirmCookDto) {
    const entry = await this.entryRepo.findOne({
      where: { id: entryId },
      relations: ['mealPlan'],
    });

    if (!entry || entry.mealPlan.userId !== userId) {
      throw new NotFoundException('Meal plan entry not found');
    }

    const result = await this.pantryService.deductItems(userId, dto.deductions);

    if (dto.servingsToCook != null) {
      entry.servingsToCook = dto.servingsToCook;
    }
    if (dto.servingsToEat != null) {
      entry.servings = dto.servingsToEat;
    }
    entry.isCooked = true;
    await this.entryRepo.save(entry);

    return {
      entryId: entry.id,
      isCooked: true,
      pantryUpdated: result.updatedPantryIds.length,
      pantryRemoved: result.removedPantryIds.length,
    };
  }

  async getAvailableLeftovers(userId: string, mealPlanId: string) {
    const plan = await this.mealPlanRepo.findOne({
      where: { id: mealPlanId, userId },
    });
    if (!plan) {
      throw new NotFoundException('Meal plan not found');
    }

    // Find entries that have servingsToCook set (i.e. user intends to cook extra)
    const sourceEntries = await this.entryRepo.find({
      where: {
        mealPlanId,
        leftoverSourceEntryId: IsNull(),
      },
      relations: ['recipe', 'leftoverEntries'],
    });

    const results: {
      sourceEntryId: string;
      recipeId: string;
      recipeTitle: string;
      recipeImageUrl: string | null;
      availableServings: number;
    }[] = [];

    for (const entry of sourceEntries) {
      if (entry.servingsToCook == null || entry.servingsToCook <= entry.servings) {
        continue;
      }
      const assignedLeftovers = (entry.leftoverEntries ?? []).reduce(
        (sum, le) => sum + le.servings,
        0,
      );
      const available = entry.servingsToCook - entry.servings - assignedLeftovers;
      if (available > 0) {
        results.push({
          sourceEntryId: entry.id,
          recipeId: entry.recipeId,
          recipeTitle: entry.recipe.title,
          recipeImageUrl: entry.recipe.imageUrl ?? null,
          availableServings: available,
        });
      }
    }

    return results;
  }

  async addLeftoverEntry(userId: string, dto: AddLeftoverEntryDto) {
    const plan = await this.mealPlanRepo.findOne({
      where: { id: dto.mealPlanId, userId },
    });
    if (!plan) {
      throw new NotFoundException('Meal plan not found');
    }

    const sourceEntry = await this.entryRepo.findOne({
      where: { id: dto.sourceEntryId, mealPlanId: dto.mealPlanId },
      relations: ['leftoverEntries'],
    });
    if (!sourceEntry) {
      throw new NotFoundException('Source entry not found');
    }
    if (sourceEntry.servingsToCook == null) {
      throw new BadRequestException('Source entry has no servings to cook set');
    }

    const assignedLeftovers = (sourceEntry.leftoverEntries ?? []).reduce(
      (sum, le) => sum + le.servings,
      0,
    );
    const available = sourceEntry.servingsToCook - sourceEntry.servings - assignedLeftovers;
    if (dto.servings > available) {
      throw new BadRequestException(
        `Only ${available} leftover servings available`,
      );
    }

    const entry = this.entryRepo.create({
      mealPlanId: dto.mealPlanId,
      recipeId: sourceEntry.recipeId,
      dayOfWeek: dto.dayOfWeek,
      mealType: dto.mealType,
      servings: dto.servings,
      leftoverSourceEntryId: dto.sourceEntryId,
      isLocked: true,
    });
    const savedEntry = await this.entryRepo.save(entry);

    return this.entryRepo.findOne({
      where: { id: savedEntry.id },
      relations: ['recipe'],
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

  private async enrichPlanEntries(
    userId: string,
    entries: MealPlanEntry[],
  ): Promise<void> {
    if (!entries?.length) return;
    const pantryItems = await this.pantryService.findAllForUser(userId);
    for (const entry of entries) {
      if (entry.recipe?.ingredients) {
        entry.recipe.ingredients = enrichPantryStatus(entry.recipe.ingredients, pantryItems);
      }
    }
  }

  /** Check for an AI error response (e.g. unreadable photo) before recipe validation. */
  private checkForErrorResponse(rawText: string): void {
    const parsed = parseJsonFromAI(rawText);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed as any).error) {
      throw new BadRequestException((parsed as any).error);
    }
  }

  private parseMealPlanResponse(raw: string): ParsedRecipe[] {
    const parsed = parseJsonFromAI(raw);

    // Extract meals array from parsed object
    let meals: unknown[];
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'meals' in parsed) {
      meals = (parsed as Record<string, unknown>).meals as unknown[];
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
      (item): item is ParsedRecipe =>
        item != null &&
        typeof item === 'object' &&
        typeof (item as ParsedRecipe).title === 'string' &&
        (item as ParsedRecipe).title.trim().length > 0 &&
        typeof (item as ParsedRecipe).dayOfWeek === 'number' &&
        typeof (item as ParsedRecipe).mealType === 'string' &&
        Array.isArray((item as ParsedRecipe).ingredients) &&
        Array.isArray((item as ParsedRecipe).steps),
    );
  }

  private parseRecipeFromAI(raw: string): ParsedRecipe | null {
    const parsed = parseObjectFromAI<ParsedRecipe>(raw);

    if (
      !parsed ||
      typeof parsed.title !== 'string' ||
      !Array.isArray(parsed.ingredients) ||
      !Array.isArray(parsed.steps)
    ) {
      this.logger.warn('Failed to parse replacement recipe response');
      return null;
    }

    return parsed;
  }
}
