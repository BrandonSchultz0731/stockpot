import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ShoppingListsService } from './shopping-lists.service';
import { AddCustomItemDto } from './dto/add-custom-item.dto';

@Controller('shopping-lists')
@UseGuards(JwtAuthGuard)
export class ShoppingListsController {
  constructor(private readonly shoppingListsService: ShoppingListsService) {}

  @Get('meal-plan/:planId')
  getByMealPlan(
    @GetUser('id') userId: string,
    @Param('planId') planId: string,
  ) {
    return this.shoppingListsService.getByMealPlan(userId, planId);
  }

  @Post(':id/items')
  addCustomItem(
    @GetUser('id') userId: string,
    @Param('id') listId: string,
    @Body() dto: AddCustomItemDto,
  ) {
    return this.shoppingListsService.addCustomItem(userId, listId, dto);
  }

  @Patch(':id/items/:itemId')
  toggleItem(
    @GetUser('id') userId: string,
    @Param('id') listId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.shoppingListsService.toggleItem(userId, listId, itemId);
  }
}
