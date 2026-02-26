import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealPlan } from './entities/meal-plan.entity';
import { MealPlanEntry } from './entities/meal-plan-entry.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { MealPlansService } from './meal-plans.service';
import { MealPlansController } from './meal-plans.controller';
import { PantryModule } from '../pantry/pantry.module';
import { AnthropicModule } from '../anthropic/anthropic.module';
import { UsageTrackingModule } from '../usage-tracking/usage-tracking.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MealPlan, MealPlanEntry, Recipe]),
    PantryModule,
    AnthropicModule,
    UsageTrackingModule,
    UsersModule,
  ],
  controllers: [MealPlansController],
  providers: [MealPlansService],
  exports: [MealPlansService],
})
export class MealPlansModule {}
