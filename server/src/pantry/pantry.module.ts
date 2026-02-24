import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PantryItem } from './entities/pantry-item.entity';
import { PantryService } from './pantry.service';
import { PantryController } from './pantry.controller';
import { FoodCacheModule } from '../food-cache/food-cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([PantryItem]), FoodCacheModule],
  controllers: [PantryController],
  providers: [PantryService],
  exports: [PantryService],
})
export class PantryModule {}
