import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { AiChatToolsService } from './ai-chat-tools.service';
import { AnthropicModule } from '../anthropic/anthropic.module';
import { UsageTrackingModule } from '../usage-tracking/usage-tracking.module';
import { PantryModule } from '../pantry/pantry.module';
import { RecipesModule } from '../recipes/recipes.module';
import { MealPlansModule } from '../meal-plans/meal-plans.module';
import { ShoppingListsModule } from '../shopping-lists/shopping-lists.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ChatMessage]),
    AnthropicModule,
    UsageTrackingModule,
    PantryModule,
    RecipesModule,
    MealPlansModule,
    ShoppingListsModule,
    UsersModule,
  ],
  controllers: [AiChatController],
  providers: [AiChatService, AiChatToolsService],
})
export class AiChatModule {}
