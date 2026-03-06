import { IsString, IsOptional } from 'class-validator';

export class AppleAuthDto {
  @IsString()
  identityToken: string;

  @IsOptional()
  @IsString()
  authorizationCode?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

export class GoogleAuthDto {
  @IsString()
  idToken: string;
}
