import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { SavedRecipe } from './entities/saved-recipe.entity';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { PantryModule } from '../pantry/pantry.module';
import { AnthropicModule } from '../anthropic/anthropic.module';
import { UsageTrackingModule } from '../usage-tracking/usage-tracking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recipe, SavedRecipe]),
    PantryModule,
    AnthropicModule,
    UsageTrackingModule,
  ],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
