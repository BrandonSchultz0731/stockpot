import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AiChatService } from './ai-chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('ai-chat')
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('messages')
  async sendMessage(
    @GetUser('id') userId: string,
    @Body() dto: SendMessageDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const abortController = new AbortController();

    // Handle client disconnect
    req.on('close', () => {
      abortController.abort();
    });

    const subject = this.aiChatService.streamResponse(
      userId,
      dto.message,
      dto.conversationId,
      abortController.signal,
    );

    subject.subscribe({
      next: (event) => {
        res.write(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`);
      },
      error: (err) => {
        res.write(
          `event: error\ndata: ${JSON.stringify({ message: err.message ?? 'Stream error' })}\n\n`,
        );
        res.end();
      },
      complete: () => {
        res.end();
      },
    });
  }

  @Get('conversations')
  getConversations(@GetUser('id') userId: string) {
    return this.aiChatService.getConversations(userId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @GetUser('id') userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.aiChatService.getMessages(userId, conversationId);
  }

  @Delete('conversations/:id')
  @HttpCode(204)
  deleteConversation(
    @GetUser('id') userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.aiChatService.deleteConversation(userId, conversationId);
  }
}
