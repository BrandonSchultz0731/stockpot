import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { SavedRecipe } from './entities/saved-recipe.entity';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { PantryModule } from '../pantry/pantry.module';
import { AnthropicModule } from '../anthropic/anthropic.module';
import { FoodCacheModule } from '../food-cache/food-cache.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recipe, SavedRecipe]),
    PantryModule,
    AnthropicModule,
    FoodCacheModule,
    UsersModule,
  ],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
