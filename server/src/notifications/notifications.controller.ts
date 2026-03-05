import {
  Controller,
  Post,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { NotificationsService } from './notifications.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  registerToken(
    @GetUser('id') userId: string,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.notificationsService.registerPushToken(userId, dto);
  }

  @Patch('preferences')
  updatePreferences(
    @GetUser('id') userId: string,
    @Body() dto: UpdateNotificationPrefsDto,
  ) {
    return this.notificationsService.updatePreferences(userId, dto);
  }
}
