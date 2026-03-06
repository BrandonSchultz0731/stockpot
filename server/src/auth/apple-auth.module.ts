import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppleAuthService } from './apple-auth.service';

@Module({
  imports: [ConfigModule],
  providers: [AppleAuthService],
  exports: [AppleAuthService],
})
export class AppleAuthModule {}
