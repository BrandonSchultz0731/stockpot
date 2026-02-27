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
import { MealPlansService } from './meal-plans.service';
import { GenerateMealPlanDto } from './dto/generate-meal-plan.dto';
import { UpdateMealPlanEntryDto } from './dto/update-meal-plan-entry.dto';
import { SwapMealPlanEntryDto } from './dto/swap-meal-plan-entry.dto';
import { ConfirmCookDto } from './dto/confirm-cook.dto';

@Controller('meal-plans')
@UseGuards(JwtAuthGuard)
export class MealPlansController {
  constructor(private readonly mealPlansService: MealPlansService) {}

  @Post('generate')
  @HttpCode(202)
  generatePlan(
    @GetUser('id') userId: string,
    @Body() dto: GenerateMealPlanDto,
  ) {
    return this.mealPlansService.generatePlan(userId, dto);
  }

  @Get('current')
  getCurrentPlan(@GetUser('id') userId: string) {
    return this.mealPlansService.getCurrentPlan(userId);
  }

  @Get('week/:date')
  getPlanByWeek(
    @GetUser('id') userId: string,
    @Param('date') date: string,
  ) {
    return this.mealPlansService.getPlanByWeek(userId, date);
  }

  @Patch('entries/:id')
  updateEntry(
    @GetUser('id') userId: string,
    @Param('id') entryId: string,
    @Body() dto: UpdateMealPlanEntryDto,
  ) {
    return this.mealPlansService.updateEntry(userId, entryId, dto);
  }

  @Post('entries/:id/cook/preview')
  cookPreview(
    @GetUser('id') userId: string,
    @Param('id') entryId: string,
  ) {
    return this.mealPlansService.cookPreview(userId, entryId);
  }

  @Post('entries/:id/cook/confirm')
  confirmCook(
    @GetUser('id') userId: string,
    @Param('id') entryId: string,
    @Body() dto: ConfirmCookDto,
  ) {
    return this.mealPlansService.confirmCook(userId, entryId, dto);
  }

  @Post('entries/:id/swap')
  swapEntry(
    @GetUser('id') userId: string,
    @Param('id') entryId: string,
    @Body() dto: SwapMealPlanEntryDto,
  ) {
    return this.mealPlansService.swapEntry(userId, entryId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  deletePlan(
    @GetUser('id') userId: string,
    @Param('id') planId: string,
  ) {
    return this.mealPlansService.deletePlan(userId, planId);
  }
}
