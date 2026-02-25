import { IsString, IsIn } from 'class-validator';

export class ScanReceiptDto {
  @IsString()
  imageBase64: string;

  @IsIn(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'])
  mimeType: string;
}
