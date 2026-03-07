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
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { MealPlansService } from './meal-plans.service';
import { GenerateMealPlanDto } from './dto/generate-meal-plan.dto';
import { UpdateMealPlanEntryDto } from './dto/update-meal-plan-entry.dto';
import { SwapMealPlanEntryDto } from './dto/swap-meal-plan-entry.dto';
import { ConfirmCookDto } from './dto/confirm-cook.dto';
import { AddMealPlanEntryDto } from './dto/add-meal-plan-entry.dto';
import { AddLeftoverEntryDto } from './dto/add-leftover-entry.dto';

@Controller('meal-plans')
@UseGuards(JwtAuthGuard)
@Throttle({ ai: { ttl: 60_000, limit: 10 } })
export class MealPlansController {
  constructor(private readonly mealPlansService: MealPlansService) { }

  @Post('generate')
  @HttpCode(202)
  generatePlan(
    @GetUser('id') userId: string,
    @Body() dto: GenerateMealPlanDto,
  ) {
    return this.mealPlansService.generatePlan(userId, dto);
  }

  @Get()
  listPlans(@GetUser('id') userId: string) {
    return this.mealPlansService.listPlans(userId);
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

  @Post('entries/add')
  addEntry(
    @GetUser('id') userId: string,
    @Body() dto: AddMealPlanEntryDto,
  ) {
    return this.mealPlansService.addEntry(userId, dto);
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
    @Body() body: { servingsToCook?: number },
  ) {
    return this.mealPlansService.cookPreview(userId, entryId, body?.servingsToCook);
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

  @Get(':planId/leftovers')
  getAvailableLeftovers(
    @GetUser('id') userId: string,
    @Param('planId') planId: string,
  ) {
    return this.mealPlansService.getAvailableLeftovers(userId, planId);
  }

  @Post('entries/add-leftover')
  addLeftoverEntry(
    @GetUser('id') userId: string,
    @Body() dto: AddLeftoverEntryDto,
  ) {
    return this.mealPlansService.addLeftoverEntry(userId, dto);
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
