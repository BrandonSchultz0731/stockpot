import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ShoppingList } from './entities/shopping-list.entity';
import { MealPlanEntry } from '../meal-plans/entities/meal-plan-entry.entity';
import { PantryService } from '../pantry/pantry.service';
import { FoodCacheService } from '../food-cache/food-cache.service';
import { PantryStatus, UnitOfMeasure, ShoppingListItem, DEFAULT_FOOD_CATEGORY, FOOD_CATEGORIES } from '@shared/enums';
import { AddCustomItemDto } from './dto/add-custom-item.dto';
import { countByPantryStatus } from '@shared/pantryStatusCounts';
import { convertToBase, convertFromBase, resolveBaseQuantity, buildPantryMap } from '../pantry/unit-conversion';

interface AggregatedIngredient {
  displayName: string;
  quantity: number;
  unit: string;
  baseQuantity: number;
  baseUnit: string;
  foodCacheId: string | null;
  recipeCount: number;
}

@Injectable()
export class ShoppingListsService {
  private readonly logger = new Logger(ShoppingListsService.name);

  constructor(
    @InjectRepository(ShoppingList)
    private readonly shoppingListRepo: Repository<ShoppingList>,
    @InjectRepository(MealPlanEntry)
    private readonly entryRepo: Repository<MealPlanEntry>,
    private readonly pantryService: PantryService,
    private readonly foodCacheService: FoodCacheService,
  ) { }

  async generateForMealPlan(planId: string, userId: string): Promise<void> {
    try {
      // 1. Load all non-leftover entries with recipes for this plan
      const entries = await this.entryRepo.find({
        where: { mealPlanId: planId, leftoverSourceEntryId: IsNull() },
        relations: ['recipe'],
      });

      // 2. Load pantry items and build lookup by foodCacheId
      const pantryItems = await this.pantryService.findAllForUser(userId);
      const pantryMap = buildPantryMap(pantryItems);

      // 3. Aggregate all recipe ingredients, dedup by foodCacheId or lowercase name
      const byKey = new Map<string, AggregatedIngredient>();

      for (const entry of entries) {
        if (!entry.recipe?.ingredients) continue;
        for (const ing of entry.recipe.ingredients) {
          const key = ing.foodCacheId || ing.name.toLowerCase();
          const existing = byKey.get(key);
          if (existing) {
            existing.quantity += ing.quantity;
            if (existing.baseUnit === (ing.baseUnit ?? UnitOfMeasure.Count)) {
              existing.baseQuantity += ing.baseQuantity ?? 0;
            }
            existing.recipeCount += 1;
          } else {
            byKey.set(key, {
              displayName: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              baseQuantity: ing.baseQuantity ?? 0,
              baseUnit: ing.baseUnit ?? UnitOfMeasure.Count,
              foodCacheId: ing.foodCacheId || null,
              recipeCount: 1,
            });
          }
        }
      }

      // 4. Batch-fetch categories and backfill missing ones
      const foodCacheIds = Array.from(byKey.values())
        .map((i) => i.foodCacheId)
        .filter((id): id is string => id != null);
      const categoryMap = await this.foodCacheService.getCategoriesByIds(foodCacheIds);

      // Find items with a foodCacheId but no category and backfill via AI
      const missingCategory = Array.from(byKey.values()).filter(
        (i) => i.foodCacheId && !categoryMap.has(i.foodCacheId),
      );
      if (missingCategory.length > 0) {
        const backfilled = await this.foodCacheService.backfillCategories(
          userId,
          missingCategory,
        );
        for (const [id, category] of backfilled) {
          categoryMap.set(id, category);
        }
      }

      // 5. Build ShoppingListItem[]
      const items: ShoppingListItem[] = Array.from(byKey.values()).map((agg) => {
        const { pantryStatus, neededQuantity } = this.computePantryResult(agg, pantryMap);
        return {
          id: randomUUID(),
          displayName: agg.displayName,
          quantity: Math.round(agg.quantity * 100) / 100,
          unit: agg.unit,
          baseQuantity: agg.baseQuantity,
          baseUnit: agg.baseUnit,
          foodCacheId: agg.foodCacheId,
          category: agg.foodCacheId
            ? (categoryMap.get(agg.foodCacheId) ?? DEFAULT_FOOD_CATEGORY)
            : DEFAULT_FOOD_CATEGORY,
          pantryStatus,
          neededQuantity,
          isChecked: false,
          isCustom: false,
          recipeCount: agg.recipeCount,
        };
      });

      // 6. Find existing shopping list or create new
      let list = await this.shoppingListRepo.findOne({
        where: { mealPlanId: planId, userId },
      });

      if (list) {
        const customItems = list.items.filter((i) => i.isCustom);
        list.items = [...items, ...customItems];
      } else {
        list = this.shoppingListRepo.create({
          userId,
          mealPlanId: planId,
          items,
        });
      }

      await this.shoppingListRepo.save(list);
      this.logger.log(
        `Shopping list generated for plan ${planId} with ${items.length} items`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate shopping list for plan ${planId}`,
        error,
      );
    }
  }

  async getByMealPlan(userId: string, planId: string) {
    const list = await this.shoppingListRepo.findOne({
      where: { mealPlanId: planId, userId },
    });

    if (!list) {
      throw new NotFoundException('Shopping list not found for this meal plan');
    }

    await this.enrichPantryStatuses(userId, list);
    return this.formatListResponse(list);
  }

  async toggleItem(userId: string, listId: string, itemId: string) {
    const list = await this.shoppingListRepo.findOne({
      where: { id: listId, userId },
    });

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    const item = list.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Shopping list item not found');
    }

    item.isChecked = !item.isChecked;
    await this.shoppingListRepo.save(list);

    await this.enrichPantryStatuses(userId, list);
    return this.formatListResponse(list);
  }

  async addCustomItem(userId: string, listId: string, dto: AddCustomItemDto) {
    const list = await this.shoppingListRepo.findOne({
      where: { id: listId, userId },
    });

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    const item: ShoppingListItem = {
      id: randomUUID(),
      displayName: dto.displayName,
      quantity: dto.quantity,
      unit: dto.unit,
      baseQuantity: dto.quantity,
      baseUnit: dto.unit,
      foodCacheId: null,
      category: dto.category ?? DEFAULT_FOOD_CATEGORY,
      pantryStatus: PantryStatus.NA,
      neededQuantity: dto.quantity,
      isChecked: false,
      isCustom: true,
      recipeCount: 0,
    };

    list.items.push(item);
    await this.shoppingListRepo.save(list);

    return this.formatListResponse(list);
  }

  private async enrichPantryStatuses(userId: string, list: ShoppingList): Promise<void> {
    const pantryItems = await this.pantryService.findAllForUser(userId);
    const pantryMap = buildPantryMap(pantryItems);
    for (const item of list.items) {
      if (item.isCustom) continue;
      const result = this.computePantryResult(item, pantryMap);
      item.pantryStatus = result.pantryStatus;
      item.neededQuantity = result.neededQuantity;
    }
  }

  private formatListResponse(list: ShoppingList) {
    const categoryOrder = new Map(
      FOOD_CATEGORIES.map((cat, idx) => [cat, idx]),
    );

    const sortedItems = [...list.items].sort((a, b) => {
      const catA = categoryOrder.get(a.category) ?? 999;
      const catB = categoryOrder.get(b.category) ?? 999;
      if (catA !== catB) return catA - catB;
      return a.displayName.localeCompare(b.displayName);
    });

    const counts = countByPantryStatus(sortedItems);

    return {
      id: list.id,
      mealPlanId: list.mealPlanId,
      items: sortedItems,
      summary: {
        toBuy: counts.none,
        low: counts.low,
        alreadyHave: counts.enough,
        total: sortedItems.length,
      },
    };
  }

  private computePantryResult(
    item: {
      foodCacheId: string | null;
      quantity: number;
      unit: string;
      baseQuantity?: number;
      baseUnit?: string;
    },
    pantryMap: Map<string, { quantity: number; unit: string }[]>,
  ): { pantryStatus: PantryStatus; neededQuantity: number } {
    if (!item.foodCacheId || !pantryMap.has(item.foodCacheId)) {
      return { pantryStatus: PantryStatus.None, neededQuantity: item.quantity };
    }

    const resolved = resolveBaseQuantity(item);
    if (!resolved) {
      return { pantryStatus: PantryStatus.Enough, neededQuantity: 0 };
    }
    const { quantity: neededQty, baseUnit: neededUnit } = resolved;

    const pantryEntries = pantryMap.get(item.foodCacheId)!;
    let available = 0;
    let anyConverted = false;

    for (const entry of pantryEntries) {
      const converted = convertToBase(entry.quantity, entry.unit);
      if (converted && converted.baseUnit === neededUnit) {
        available += converted.quantity;
        anyConverted = true;
      }
    }

    // If no pantry entries could be converted to the recipe's base unit,
    // default to Enough (conservative — item exists but units are incomparable)
    if (!anyConverted) {
      return { pantryStatus: PantryStatus.Enough, neededQuantity: 0 };
    }

    if (available >= neededQty) {
      return { pantryStatus: PantryStatus.Enough, neededQuantity: 0 };
    }

    // Convert available pantry amount to display unit, then subtract from
    // the display quantity so both sides use the same conversion factor.
    // (Using the deficit in base units can produce inconsistent results when
    //  the AI's baseQuantity uses a different conversion rate than our tables.)
    const availableDisplay = convertFromBase(available, neededUnit, item.unit);
    const neededQuantity = availableDisplay != null
      ? Math.round(Math.max(0, item.quantity - availableDisplay) * 100) / 100
      : item.quantity;

    return { pantryStatus: PantryStatus.Low, neededQuantity };
  }
}
