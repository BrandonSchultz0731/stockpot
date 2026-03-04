import {
  Injectable,
  BadGatewayException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { AnthropicService } from '../anthropic/anthropic.service';
import { ACTIVE_MODEL } from '../ai-models';
import { UnitOfMeasure, StorageLocation, ShelfLife, MessageType } from '@shared/enums';
import { buildReceiptScanPrompt } from '../prompts';
import { ScanReceiptDto } from './dto/scan-receipt.dto';
import { extractText, parseArrayFromAI } from '../utils/ai-response';
import { parseShelfLife } from '../utils/shelf-life';
import { normalizeImageMime } from '../utils/mime';

export interface ScannedItem {
  displayName: string;
  quantity: number;
  unit: string;
  emoji?: string;
  estimatedShelfLife?: ShelfLife;
  suggestedStorageLocation?: string;
}

const VALID_UNITS = new Set(Object.values(UnitOfMeasure));
const VALID_STORAGE_LOCATIONS = new Set(Object.values(StorageLocation));

@Injectable()
export class ReceiptScanService {
  private readonly logger = new Logger(ReceiptScanService.name);

  constructor(
    private readonly anthropicService: AnthropicService,
  ) {}

  async scanReceipt(
    userId: string,
    dto: ScanReceiptDto,
  ): Promise<{ items: ScannedItem[] }> {
    let response;

    try {
      response = await this.anthropicService.sendMessage(userId, {
        model: ACTIVE_MODEL,
        maxTokens: 4096,
        messageType: MessageType.ReceiptScan,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: normalizeImageMime(dto.mimeType),
                  data: dto.imageBase64,
                },
              },
              {
                type: 'text',
                text: buildReceiptScanPrompt(),
              },
            ],
          },
        ],
      });
    } catch (error) {
      this.logger.error('Claude API call failed', error);
      throw new BadGatewayException('Receipt scanning service unavailable');
    }

    const rawText = extractText(response);

    const parsed = parseArrayFromAI(rawText);
    if (parsed === undefined) {
      return { items: [] };
    }

    const items: ScannedItem[] = parsed
      .filter(
        (item: any) =>
          item &&
          typeof item.displayName === 'string' &&
          item.displayName.trim().length > 0,
      )
      .map((item: any) => ({
        displayName: item.displayName.trim(),
        quantity:
          typeof item.quantity === 'number' && item.quantity > 0
            ? item.quantity
            : 1,
        unit: VALID_UNITS.has(item.unit) ? item.unit : UnitOfMeasure.Count,
        ...(typeof item.emoji === 'string' && item.emoji.trim().length > 0 && {
          emoji: item.emoji.trim(),
        }),
        ...(item.estimatedShelfLife && {
          estimatedShelfLife: parseShelfLife(item.estimatedShelfLife),
        }),
        ...(VALID_STORAGE_LOCATIONS.has(item.suggestedStorageLocation) && {
          suggestedStorageLocation: item.suggestedStorageLocation,
        }),
      }));

    return { items };
  }
}
