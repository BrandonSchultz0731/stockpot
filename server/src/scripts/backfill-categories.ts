import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { AppModule } from '../app.module';
import { FoodCache } from '../food-cache/entities/food-cache.entity';
import { CLAUDE_MODELS } from '../ai-models';
import { buildCategoryPrompt } from '../prompts';
import { FOOD_CATEGORIES } from '@shared/enums';

async function bootstrap() {
  const logger = new Logger('BackfillCategories');
  const app = await NestFactory.createApplicationContext(AppModule);

  const foodCacheRepo = app.get<Repository<FoodCache>>(
    getRepositoryToken(FoodCache),
  );
  const configService = app.get(ConfigService);
  const anthropic = new Anthropic({
    apiKey: configService.get<string>('ANTHROPIC_API_KEY'),
  });

  const items = await foodCacheRepo.find({
    where: { category: IsNull() },
    order: { name: 'ASC' },
  });

  logger.log(`Found ${items.length} food_cache entries with null category`);

  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    try {
      const response = await anthropic.messages.create({
        model: CLAUDE_MODELS['haiku-4.5'].id,
        max_tokens: 64,
        messages: [
          {
            role: 'user',
            content: buildCategoryPrompt(item.name),
          },
        ],
      });

      const rawText =
        response.content[0]?.type === 'text'
          ? response.content[0].text.trim()
          : '';

      if (rawText && FOOD_CATEGORIES.includes(rawText)) {
        await foodCacheRepo.update(item.id, { category: rawText });
        updated++;
        logger.log(`[${updated}/${items.length}] "${item.name}" → ${rawText}`);
      } else {
        skipped++;
        logger.warn(
          `Skipped "${item.name}" — AI returned: "${rawText}"`,
        );
      }
    } catch (error) {
      skipped++;
      logger.error(`Failed for "${item.name}"`, error);
    }
  }

  logger.log(`Done. Updated: ${updated}, Skipped: ${skipped}`);
  await app.close();
}

bootstrap();
