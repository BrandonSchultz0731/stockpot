import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UsersService } from './users.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@GetUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me/onboarding')
  completeOnboarding(
    @GetUser('id') userId: string,
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.usersService.completeOnboarding(userId, dto);
  }

  @Delete('me')
  @HttpCode(204)
  deleteAccount(@GetUser('id') userId: string) {
    return this.usersService.deleteAccount(userId);
  }

  @Patch('me/profile')
  updateProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }
}
