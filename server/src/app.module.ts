import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UsageTrackingModule } from './usage-tracking/usage-tracking.module';
import { FoodCacheModule } from './food-cache/food-cache.module';
import { PantryModule } from './pantry/pantry.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
