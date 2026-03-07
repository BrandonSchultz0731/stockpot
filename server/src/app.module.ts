import { join } from 'path';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UsageTrackingModule } from './usage-tracking/usage-tracking.module';
import { FoodCacheModule } from './food-cache/food-cache.module';
import { PantryModule } from './pantry/pantry.module';
import { ReceiptScanModule } from './receipt-scan/receipt-scan.module';
import { RecipesModule } from './recipes/recipes.module';
import { MealPlansModule } from './meal-plans/meal-plans.module';
import { ShoppingListsModule } from './shopping-lists/shopping-lists.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 60 },
      { name: 'auth', ttl: 900_000, limit: 10 },
      { name: 'ai', ttl: 60_000, limit: 10 },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
        migrationsRun: true,
      }),
    }),
    UsersModule,
    AuthModule,
    UsageTrackingModule,
    FoodCacheModule,
    PantryModule,
    ReceiptScanModule,
    RecipesModule,
    MealPlansModule,
    ShoppingListsModule,
    AiChatModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
})
export class AppModule {}
