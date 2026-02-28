import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PantryItem } from './entities/pantry-item.entity';
import { FoodCacheService } from '../food-cache/food-cache.service';
import { AnthropicService } from '../anthropic/anthropic.service';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { StorageLocation, ShelfLife, FOOD_CATEGORIES } from '@shared/enums';
import { calculateExpirationDate, formatISODate } from '@shared/dates';
import { CLAUDE_MODELS } from '../ai-models';
import { buildShelfLifePrompt, buildCategoryPrompt } from '../prompts';

@Injectable()
export class PantryService {
  private readonly logger = new Logger(PantryService.name);

  constructor(
    @InjectRepository(PantryItem)
    private readonly pantryItemRepo: Repository<PantryItem>,
    private readonly foodCacheService: FoodCacheService,
    private readonly anthropicService: AnthropicService,
  ) {}

  async findAllForUser(userId: string): Promise<PantryItem[]> {
    return this.pantryItemRepo.find({
      where: { userId },
      relations: ['foodCache'],
      order: { displayName: 'ASC' },
    });
  }

  async create(userId: string, dto: CreatePantryItemDto): Promise<PantryItem> {
    let foodCacheId = dto.foodCacheId;

    if (!foodCacheId && dto.fdcId) {
      // Has a USDA ID — look up or cache the USDA entry
      const existing = await this.foodCacheService.findByFdcId(dto.fdcId);
      if (existing) {
        foodCacheId = existing.id;
      } else {
        const usdaResults = await this.foodCacheService.searchUsda(
          dto.displayName,
          50,
        );
        const match = usdaResults.find((r) => r.fdcId === dto.fdcId);
        const cached = await this.foodCacheService.cacheUsdaFood(
          match || { fdcId: dto.fdcId, name: dto.displayName, source: 'usda' },
        );
        foodCacheId = cached.id;
      }
    }

    if (!foodCacheId) {
      // Fully manual entry — try to match an existing food cache entry by name
      const localResults = await this.foodCacheService.searchLocal(
        dto.displayName,
        5,
      );
      const exactMatch = localResults.find(
        (r) => r.name.toLowerCase() === dto.displayName.toLowerCase(),
      );
      if (exactMatch?.id) {
        foodCacheId = exactMatch.id;
      } else {
        const cached = await this.foodCacheService.cacheUsdaFood({
          name: dto.displayName,
          source: 'cache',
        });
        foodCacheId = cached.id;
      }
    }

    let expirationDate = dto.expirationDate;
    let expiryIsEstimated: boolean;

    if (dto.expirationDate) {
      // User provided a date — not estimated
      expiryIsEstimated = dto.expiryIsEstimated ?? false;
    } else {
      // Cache shelf life from receipt scan if provided
      if (dto.estimatedShelfLife && foodCacheId) {
        await this.foodCacheService.updateShelfLife(
          foodCacheId,
          dto.estimatedShelfLife,
        );
      }

      // Estimate expiration via cache or AI
      const estimate = await this.estimateExpiration(
        userId,
        foodCacheId,
        dto.displayName,
        dto.storageLocation,
      );
      if (estimate) {
        expirationDate = estimate.expirationDate;
        expiryIsEstimated = true;
      } else {
        expiryIsEstimated = false;
      }
    }

    // Fire-and-forget: ensure the food cache entry has a category
    this.ensureFoodCategory(userId, foodCacheId, dto.displayName).catch(
      (err) =>
        this.logger.warn(
          `Failed to ensure category for "${dto.displayName}"`,
          err,
        ),
    );

    const item = this.pantryItemRepo.create({
      userId,
      foodCacheId,
      displayName: dto.displayName,
      quantity: dto.quantity,
      unit: dto.unit,
      storageLocation: dto.storageLocation,
      expirationDate,
      expiryIsEstimated,
      opened: dto.opened ?? false,
      notes: dto.notes,
    });

    return this.pantryItemRepo.save(item);
  }

  async createBulk(
    userId: string,
    items: CreatePantryItemDto[],
  ): Promise<PantryItem[]> {
    const results: PantryItem[] = [];
    for (const dto of items) {
      results.push(await this.create(userId, dto));
    }
    return results;
  }

  async update(
    userId: string,
    itemId: string,
    dto: UpdatePantryItemDto,
  ): Promise<PantryItem> {
    const item = await this.pantryItemRepo.findOne({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Pantry item not found');
    }

    // Only allow expiryIsEstimated to change if the expiration date actually changed.
    if (dto.expirationDate === item.expirationDate) {
      delete dto.expiryIsEstimated;
    }

    Object.assign(item, dto);
    return this.pantryItemRepo.save(item);
  }

  async deductItems(
    userId: string,
    deductions: { pantryItemId: string; deductQuantity: number }[],
  ): Promise<{ updatedPantryIds: string[]; removedPantryIds: string[] }> {
    const updatedPantryIds: string[] = [];
    const removedPantryIds: string[] = [];

    for (const d of deductions) {
      const item = await this.pantryItemRepo.findOne({
        where: { id: d.pantryItemId, userId },
      });
      if (!item) continue;

      const remaining = item.quantity - d.deductQuantity;
      if (remaining <= 0) {
        await this.pantryItemRepo.remove(item);
        removedPantryIds.push(d.pantryItemId);
      } else {
        item.quantity = Math.round(remaining * 100) / 100;
        await this.pantryItemRepo.save(item);
        updatedPantryIds.push(d.pantryItemId);
      }
    }

    return { updatedPantryIds, removedPantryIds };
  }

  async remove(userId: string, itemId: string): Promise<void> {
    const item = await this.pantryItemRepo.findOne({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Pantry item not found');
    }

    await this.pantryItemRepo.remove(item);
  }

  private async estimateExpiration(
    userId: string,
    foodCacheId: string,
    displayName: string,
    storageLocation?: StorageLocation,
  ): Promise<{ expirationDate: string; expiryIsEstimated: true } | null> {
    try {
      // Check food_cache.shelfLife first
      let shelfLife = await this.foodCacheService.getShelfLife(foodCacheId);

      if (!shelfLife) {
        // Fall back to AI estimation (also returns category)
        const aiResult = await this.estimateShelfLifeViaAI(userId, displayName);
        if (aiResult) {
          shelfLife = aiResult.shelfLife;
          await this.foodCacheService.updateShelfLife(foodCacheId, shelfLife);
          if (aiResult.category) {
            await this.foodCacheService.updateCategory(
              foodCacheId,
              aiResult.category,
            );
          }
        }
      }

      if (!shelfLife) return null;

      const expiryDate = calculateExpirationDate(shelfLife, storageLocation);
      if (!expiryDate) return null;
      const expirationDate = formatISODate(expiryDate);

      return { expirationDate, expiryIsEstimated: true };
    } catch (error) {
      this.logger.warn(
        `Failed to estimate expiration for "${displayName}"`,
        error,
      );
      return null;
    }
  }

  private async estimateShelfLifeViaAI(
    userId: string,
    displayName: string,
  ): Promise<{ shelfLife: ShelfLife; category: string | null } | null> {
    try {
      const response = await this.anthropicService.sendMessage(userId, {
        model: CLAUDE_MODELS['haiku-4.5'],
        maxTokens: 256,
        messages: [
          {
            role: 'user',
            content: buildShelfLifePrompt(displayName),
          },
        ],
        messageType: 'shelf-life',
      });

      const rawText =
        response.content[0]?.type === 'text' ? response.content[0].text : '';

      // Parse the JSON, trying a few strategies
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch {
            return null;
          }
        }
      }

      if (!parsed || typeof parsed !== 'object') return null;

      const obj = parsed as Record<string, unknown>;

      const shelfLife: ShelfLife = {};
      for (const loc of Object.values(StorageLocation)) {
        const val = Number(obj[loc]);
        if (Number.isFinite(val) && val > 0) {
          shelfLife[loc] = Math.round(val);
        }
      }

      if (Object.keys(shelfLife).length === 0) return null;

      // Extract category if present and valid
      const rawCategory =
        typeof obj.category === 'string' ? obj.category.trim() : null;
      const category =
        rawCategory && FOOD_CATEGORIES.includes(rawCategory)
          ? rawCategory
          : null;

      return { shelfLife, category };
    } catch (error) {
      this.logger.warn(
        `AI shelf life estimation failed for "${displayName}"`,
        error,
      );
      return null;
    }
  }

  private async ensureFoodCategory(
    userId: string,
    foodCacheId: string,
    displayName: string,
  ): Promise<void> {
    const existing = await this.foodCacheService.getCategory(foodCacheId);
    if (existing) return;

    const response = await this.anthropicService.sendMessage(userId, {
      model: CLAUDE_MODELS['haiku-4.5'],
      maxTokens: 64,
      messages: [
        {
          role: 'user',
          content: buildCategoryPrompt(displayName),
        },
      ],
      messageType: 'food-category',
    });

    const rawText =
      response.content[0]?.type === 'text'
        ? response.content[0].text.trim()
        : '';

    if (rawText && FOOD_CATEGORIES.includes(rawText)) {
      await this.foodCacheService.updateCategory(foodCacheId, rawText);
    } else {
      this.logger.warn(
        `AI returned unrecognized category "${rawText}" for "${displayName}"`,
      );
    }
  }

}
