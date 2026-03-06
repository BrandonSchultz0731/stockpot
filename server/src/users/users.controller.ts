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
import { AppleAuthService } from '../auth/apple-auth.service';
import { UsersService } from './users.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly appleAuthService: AppleAuthService,
  ) {}

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
  async deleteAccount(@GetUser('id') userId: string) {
    const { appleRefreshToken } = await this.usersService.deleteAccount(userId);
    await this.appleAuthService.revokeToken(appleRefreshToken);
  }

  @Patch('me/profile')
  updateProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }
}
