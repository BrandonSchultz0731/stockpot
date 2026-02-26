import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RecipesService } from './recipes.service';
import { GenerateRecipeDto } from './dto/generate-recipe.dto';
import { SaveRecipeDto } from './dto/save-recipe.dto';
import { UpdateSavedRecipeDto } from './dto/update-saved-recipe.dto';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post('generate')
  generateRecipes(
    @GetUser('id') userId: string,
    @Body() dto: GenerateRecipeDto,
  ) {
    return this.recipesService.generateRecipes(userId, dto);
  }

  @Get('saved')
  getSavedRecipes(@GetUser('id') userId: string) {
    return this.recipesService.getSavedRecipes(userId);
  }

  @Get(':id')
  findById(
    @GetUser('id') userId: string,
    @Param('id') recipeId: string,
  ) {
    return this.recipesService.findById(recipeId, userId);
  }

  @Post(':id/save')
  saveRecipe(
    @GetUser('id') userId: string,
    @Param('id') recipeId: string,
    @Body() dto: SaveRecipeDto,
  ) {
    return this.recipesService.saveRecipe(userId, recipeId, dto);
  }

  @Delete(':id/save')
  @HttpCode(204)
  unsaveRecipe(
    @GetUser('id') userId: string,
    @Param('id') recipeId: string,
  ) {
    return this.recipesService.unsaveRecipe(userId, recipeId);
  }

  @Patch('saved/:id')
  updateSavedRecipe(
    @GetUser('id') userId: string,
    @Param('id') savedRecipeId: string,
    @Body() dto: UpdateSavedRecipeDto,
  ) {
    return this.recipesService.updateSavedRecipe(userId, savedRecipeId, dto);
  }
}
