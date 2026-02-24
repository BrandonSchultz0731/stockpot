import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodCache } from './entities/food-cache.entity';
import { FoodCacheService } from './food-cache.service';
import { FoodCacheController } from './food-cache.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FoodCache])],
  controllers: [FoodCacheController],
  providers: [FoodCacheService],
  exports: [FoodCacheService],
})
export class FoodCacheModule {}
