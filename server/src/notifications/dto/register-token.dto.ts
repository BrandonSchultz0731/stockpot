import { IsString, IsIn } from 'class-validator';

export class RegisterTokenDto {
  @IsString()
  pushToken: string;

  @IsIn(['ios', 'android'])
  pushPlatform: string;
}
