import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingList } from './entities/shopping-list.entity';
import { MealPlanEntry } from '../meal-plans/entities/meal-plan-entry.entity';
import { ShoppingListsService } from './shopping-lists.service';
import { ShoppingListsController } from './shopping-lists.controller';
import { PantryModule } from '../pantry/pantry.module';
import { FoodCacheModule } from '../food-cache/food-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShoppingList, MealPlanEntry]),
    PantryModule,
    FoodCacheModule,
  ],
  controllers: [ShoppingListsController],
  providers: [ShoppingListsService],
  exports: [ShoppingListsService],
})
export class ShoppingListsModule {}
