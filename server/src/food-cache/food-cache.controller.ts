import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FoodCacheService } from './food-cache.service';

@Controller('food')
@UseGuards(JwtAuthGuard)
export class FoodCacheController {
  constructor(private readonly foodCacheService: FoodCacheService) {}

  @Get('search')
  search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.foodCacheService.search(
      query || '',
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('barcode/:code')
  async findByBarcode(@Param('code') code: string) {
    const result = await this.foodCacheService.findByBarcode(code);
    if (!result) {
      throw new NotFoundException('No food found for this barcode');
    }
    return result;
  }
}
