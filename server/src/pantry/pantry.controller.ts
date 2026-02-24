import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PantryService } from './pantry.service';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';

@Controller('pantry')
@UseGuards(JwtAuthGuard)
export class PantryController {
  constructor(private readonly pantryService: PantryService) {}

  @Get()
  findAll(@GetUser('id') userId: string) {
    return this.pantryService.findAllForUser(userId);
  }

  @Post()
  create(
    @GetUser('id') userId: string,
    @Body() dto: CreatePantryItemDto,
  ) {
    return this.pantryService.create(userId, dto);
  }

  @Post('bulk')
  createBulk(
    @GetUser('id') userId: string,
    @Body() items: CreatePantryItemDto[],
  ) {
    return this.pantryService.createBulk(userId, items);
  }

  @Patch(':id')
  update(
    @GetUser('id') userId: string,
    @Param('id') itemId: string,
    @Body() dto: UpdatePantryItemDto,
  ) {
    return this.pantryService.update(userId, itemId, dto);
  }

  @Delete(':id')
  remove(
    @GetUser('id') userId: string,
    @Param('id') itemId: string,
  ) {
    return this.pantryService.remove(userId, itemId);
  }
}
