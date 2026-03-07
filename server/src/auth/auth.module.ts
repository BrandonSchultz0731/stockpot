import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { AppleAuthModule } from './apple-auth.module';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    AppleAuthModule,
    TypeOrmModule.forFeature([PasswordResetToken, EmailVerificationToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_ACCESS_EXPIRY') },
      }),
    }),
  ],
  providers: [AuthService, EmailService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule { }
