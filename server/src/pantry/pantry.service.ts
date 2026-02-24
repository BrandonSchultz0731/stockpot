import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PantryItem } from './entities/pantry-item.entity';
import { FoodCacheService } from '../food-cache/food-cache.service';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';

@Injectable()
export class PantryService {
  constructor(
    @InjectRepository(PantryItem)
    private readonly pantryItemRepo: Repository<PantryItem>,
    private readonly foodCacheService: FoodCacheService,
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
      const usdaResults = await this.foodCacheService.searchUsda(
        dto.displayName,
        50,
      );
      const match = usdaResults.find((r) => r.fdcId === dto.fdcId);

      if (match) {
        const cached = await this.foodCacheService.cacheUsdaFood(match);
        foodCacheId = cached.id;
      } else {
        const existing = await this.foodCacheService.findByFdcId(dto.fdcId);
        if (existing) {
          foodCacheId = existing.id;
        } else {
          const cached = await this.foodCacheService.cacheUsdaFood({
            fdcId: dto.fdcId,
            name: dto.displayName,
            source: 'usda',
          });
          foodCacheId = cached.id;
        }
      }
    }

    const item = this.pantryItemRepo.create({
      userId,
      foodCacheId,
      displayName: dto.displayName,
      quantity: dto.quantity,
      unit: dto.unit,
      storageLocation: dto.storageLocation,
      expirationDate: dto.expirationDate,
      expiryIsEstimated: dto.expiryIsEstimated ?? true,
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
}
