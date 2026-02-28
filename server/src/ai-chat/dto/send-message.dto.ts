import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MaxLength(10000)
  message: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
