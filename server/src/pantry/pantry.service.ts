import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { PantryItem } from './entities/pantry-item.entity';
import { FoodCacheService } from '../food-cache/food-cache.service';
import { UsageTrackingService } from '../usage-tracking/usage-tracking.service';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { StorageLocation, ShelfLife } from '@shared/enums';
import { CLAUDE_MODELS, estimateCostCents } from '../ai-models';

@Injectable()
export class PantryService {
  private readonly logger = new Logger(PantryService.name);
  private readonly anthropic: Anthropic;

  constructor(
    @InjectRepository(PantryItem)
    private readonly pantryItemRepo: Repository<PantryItem>,
    private readonly foodCacheService: FoodCacheService,
    private readonly usageTrackingService: UsageTrackingService,
    private readonly configService: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

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
      // Fully manual entry — create a simple food cache entry
      const cached = await this.foodCacheService.cacheUsdaFood({
        name: dto.displayName,
        source: 'cache',
      });
      foodCacheId = cached.id;
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

    Object.assign(item, dto);
    return this.pantryItemRepo.save(item);
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
        // Fall back to AI estimation
        shelfLife = await this.estimateShelfLifeViaAI(userId, displayName);
        if (shelfLife) {
          await this.foodCacheService.updateShelfLife(foodCacheId, shelfLife);
        }
      }

      if (!shelfLife) return null;

      const expirationDate = this.calculateExpirationDate(
        shelfLife,
        storageLocation,
      );
      if (!expirationDate) return null;

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
  ): Promise<ShelfLife | null> {
    try {
      const model = CLAUDE_MODELS['haiku-4.5'];
      const storageKeys = Object.values(StorageLocation).join(', ');

      const response = await this.anthropic.messages.create({
        model: model.id,
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: `How many days does "${displayName}" typically last when stored properly? Return ONLY a JSON object with numeric values for applicable storage methods: { "${StorageLocation.Fridge}": days, "${StorageLocation.Freezer}": days, "${StorageLocation.Pantry}": days }. Valid keys: ${storageKeys}. Omit a key if that storage method is not applicable. No explanation.`,
          },
        ],
      });

      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;
      const costCents = estimateCostCents(inputTokens, outputTokens, model);

      await Promise.all([
        this.usageTrackingService.increment(
          userId,
          'totalInputTokens',
          inputTokens,
        ),
        this.usageTrackingService.increment(
          userId,
          'totalOutputTokens',
          outputTokens,
        ),
        this.usageTrackingService.increment(
          userId,
          'estimatedCostCents',
          costCents,
        ),
      ]);

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

      const result: ShelfLife = {};
      const obj = parsed as Record<string, unknown>;

      for (const loc of Object.values(StorageLocation)) {
        const val = Number(obj[loc]);
        if (Number.isFinite(val) && val > 0) {
          result[loc] = Math.round(val);
        }
      }

      return Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      this.logger.warn(
        `AI shelf life estimation failed for "${displayName}"`,
        error,
      );
      return null;
    }
  }

  private calculateExpirationDate(
    shelfLife: ShelfLife,
    storageLocation?: StorageLocation,
  ): string | null {
    let days: number | undefined;

    if (storageLocation) {
      days = shelfLife[storageLocation];
    }

    // Fallback order: Pantry → Fridge → Freezer
    if (days === undefined) days = shelfLife[StorageLocation.Pantry];
    if (days === undefined) days = shelfLife[StorageLocation.Fridge];
    if (days === undefined) days = shelfLife[StorageLocation.Freezer];

    if (days === undefined || days <= 0) return null;

    const date = new Date();
    date.setDate(date.getDate() + days);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
